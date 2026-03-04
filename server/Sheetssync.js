/**
 * TalongGuard — Google Sheets Sync Service
 * Runs inside the backend server, polls Google Sheets every 2 minutes.
 *
 * Flow:
 *   Raspi rover → raspi_sender.py → Google Sheets (via SIM)
 *                                          ↓
 *                              This service reads the sheet
 *                                          ↓
 *                              Saves new rows to database
 *                                          ↓
 *                                     Dashboard
 */

const { google } = require('googleapis')
const cron       = require('node-cron')
const db         = require('./db')
const path       = require('path')
const fs         = require('fs')

// ── Configuration ─────────────────────────────────────────────────────
const SPREADSHEET_ID  = '1gcT90rgmRczXM8C0sbMY-j_vk3WyvBUvzm5sXV-ygW0'
const SHEET_NAME      = 'Sheet1'
const CREDENTIALS_PATH = path.join(__dirname, 'credentials.json')
const SYNC_INTERVAL   = '*/2 * * * *' // every 2 minutes

// Google Sheets column order (matches raspi main script output)
const COL_DATETIME     = 0
const COL_LONGITUDE    = 1
const COL_LATITUDE     = 2
const COL_HEALTHY_LEAF = 3
const COL_INSECT_PEST  = 4
const COL_LEAF_SPOT    = 5
const COL_MOSAIC_VIRUS = 6
const COL_WILT         = 7

const LABELS = ['Healthy Leaf', 'Insect Pest', 'Leaf Spot', 'Mosaic Virus', 'Wilt']
const LABEL_COLS = [COL_HEALTHY_LEAF, COL_INSECT_PEST, COL_LEAF_SPOT, COL_MOSAIC_VIRUS, COL_WILT]
const DISEASE_MAP = {
  'Healthy Leaf': 'healthy',
  'Insect Pest':  'insect',
  'Leaf Spot':    'leafspot',
  'Mosaic Virus': 'mosaic',
  'Wilt':         'wilt',
}

// Track last synced row count to only process new rows
let lastSyncedRow = 0
let sheetsClient  = null

// ── Connect to Google Sheets ──────────────────────────────────────────
function connectSheets() {
  if (!fs.existsSync(CREDENTIALS_PATH)) {
    console.log('⚠️  [Sheets Sync] credentials.json not found — sync disabled')
    console.log('   Place credentials.json in the server folder to enable rover sync')
    return null
  }

  try {
    const creds  = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'))
    const auth   = new google.auth.GoogleAuth({
      credentials: creds,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    })
    const sheets = google.sheets({ version: 'v4', auth })
    console.log('✅ [Sheets Sync] Connected to Google Sheets')
    return sheets
  } catch (err) {
    console.error('❌ [Sheets Sync] Failed to connect:', err.message)
    return null
  }
}

// ── Fetch all rows from sheet ─────────────────────────────────────────
async function fetchRows(sheets) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A:H`,
  })
  return res.data.values || []
}

// ── Reverse geocode lat/lng → municipality ────────────────────────────
const _munCache = new Map()
async function getMunicipality(lat, lng) {
  const key = `${parseFloat(lat).toFixed(2)},${parseFloat(lng).toFixed(2)}`
  if (_munCache.has(key)) return _munCache.get(key)
  try {
    const res  = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`,
      { headers: { 'User-Agent': 'TalongGuard-Thesis/1.0' } }
    )
    const data = await res.json()
    const addr = data.address || {}
    const mun  = addr.city || addr.town || addr.municipality || addr.county || 'Nueva Ecija'
    _munCache.set(key, mun)
    return mun
  } catch {
    return 'Nueva Ecija'
  }
}

// ── Parse rows → individual detection records ─────────────────────────
async function parseRows(rows) {
  const records = []

  for (const row of rows) {
    if (!row || row.length < 8) continue

    const rawDt = String(row[COL_DATETIME] || '').trim()
    if (!rawDt || rawDt === 'N/A' || rawDt.toLowerCase().includes('date')) continue

    const lat = parseFloat(row[COL_LATITUDE])
    const lng = parseFloat(row[COL_LONGITUDE])
    if (isNaN(lat) || isNaN(lng)) continue
    if (lat === 0 && lng === 0) continue
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) continue

    // Get municipality from cache or Nominatim
    const municipality = await getMunicipality(lat, lng)

    for (let i = 0; i < LABELS.length; i++) {
      const count = parseInt(String(row[LABEL_COLS[i]] || '0').trim()) || 0
      if (count <= 0) continue

      for (let j = 0; j < count; j++) {
        records.push({
          lat,
          lng,
          disease:      DISEASE_MAP[LABELS[i]],
          municipality,
          scanned_at:   rawDt,
        })
      }
    }
  }

  return records
}

// ── Save records to database ──────────────────────────────────────────
function saveRecords(records) {
  let inserted = 0
  for (const r of records) {
    db.run(
      `INSERT INTO scan_records (lat, lng, disease, municipality, scanned_at, source)
       VALUES (?, ?, ?, ?, ?, 'rover')`,
      [r.lat, r.lng, r.disease, r.municipality, r.scanned_at]
    )
    inserted++
  }
  if (inserted > 0) db.save()
  return inserted
}

// ── Main sync function ────────────────────────────────────────────────
async function syncSheets() {
  if (!sheetsClient) return

  try {
    const allRows  = await fetchRows(sheetsClient)
    // Skip header row if present
    const hasHeader = allRows[0] && allRows[0].some(c => String(c).toLowerCase().includes('lat'))
    const dataRows  = hasHeader ? allRows.slice(1) : allRows
    const newRows   = dataRows.slice(lastSyncedRow)

    if (newRows.length === 0) {
      console.log(`[${new Date().toLocaleTimeString()}] [Sheets Sync] No new rows`)
      return
    }

    console.log(`[${new Date().toLocaleTimeString()}] [Sheets Sync] 📡 ${newRows.length} new row(s) from rover`)

    const records = await parseRows(newRows)
    console.log(`[Sheets Sync] Expanded to ${records.length} detection records`)

    const inserted = saveRecords(records)
    console.log(`[Sheets Sync] ✅ Saved ${inserted} records to database`)

    lastSyncedRow += newRows.length

  } catch (err) {
    console.error('[Sheets Sync] ❌ Sync error:', err.message)
  }
}

// ── Start the sync service ────────────────────────────────────────────
function startSheetsSync() {
  sheetsClient = connectSheets()
  if (!sheetsClient) return

  // Run once immediately on startup
  syncSheets()

  // Then every 2 minutes
  cron.schedule(SYNC_INTERVAL, syncSheets)
  console.log(`✅ [Sheets Sync] Polling Google Sheets every 2 minutes`)
}

module.exports = { startSheetsSync }