/**
 * TalongGuard — Google Sheets Sync Service
 * Reads from a PUBLIC Google Sheet — no credentials needed!
 *
 * Flow:
 *   Raspi rover → Google Sheets (via SIM) → This service → Database → Dashboard
 *
 * One row in sheet = one row in DB (stores raw counts, matches sheet exactly)
 */

const cron = require('node-cron')
const db   = require('./db')

const SPREADSHEET_ID = '1gcT90rgmRczXM8C0sbMY-j_vk3WyvBUvzm5sXV-ygW0'
const SHEET_NAME     = 'Sheet1'
const SYNC_INTERVAL  = '*/2 * * * *'

const SHEET_CSV_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SHEET_NAME)}`

// Column indices matching raspi script output
const COL_DATETIME     = 0
const COL_LONGITUDE    = 1
const COL_LATITUDE     = 2
const COL_HEALTHY_LEAF = 3
const COL_INSECT_PEST  = 4
const COL_LEAF_SPOT    = 5
const COL_MOSAIC_VIRUS = 6
const COL_WILT         = 7

let lastSyncedRow = 0

// ── Parse CSV line properly (handles commas inside quotes) ────────────
function parseCSVLine(line) {
  const result = []
  let current  = ''
  let inQuotes = false
  for (const ch of line) {
    if (ch === '"') { inQuotes = !inQuotes }
    else if (ch === ',' && !inQuotes) { result.push(current.trim()); current = '' }
    else { current += ch }
  }
  result.push(current.trim())
  return result
}

// ── Fetch public sheet as TSV (tab-separated is more reliable than CSV) ──
async function fetchSheetCSV() {
  // Use TSV export — avoids comma-in-value issues
  const tsvUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=tsv&sheet=${encodeURIComponent(SHEET_NAME)}`
  const res    = await fetch(tsvUrl)
  if (!res.ok) throw new Error(`Failed to fetch sheet: ${res.status}`)
  const text   = await res.text()
  // TSV = tab separated, no quoting issues
  return text.trim().split('\n').map(line => line.split('\t').map(c => c.trim()))
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
  } catch { return 'Nueva Ecija' }
}

// ── Parse rows → one DB record per sheet row (raw counts) ─────────────
async function parseRows(rows) {
  const records = []
  for (const row of rows) {
    if (!row || row.length < 8) continue

    const rawDt = String(row[COL_DATETIME] || '').trim()
    // Skip header or empty rows
    if (!rawDt || rawDt.toLowerCase().includes('date') || rawDt === 'N/A') continue

    const lat = parseFloat(row[COL_LATITUDE])
    const lng = parseFloat(row[COL_LONGITUDE])
    if (isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) continue
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) continue

    const healthy  = parseInt(row[COL_HEALTHY_LEAF] || 0) || 0
    const insect   = parseInt(row[COL_INSECT_PEST]  || 0) || 0
    const leafspot = parseInt(row[COL_LEAF_SPOT]    || 0) || 0
    const mosaic   = parseInt(row[COL_MOSAIC_VIRUS] || 0) || 0
    const wilt     = parseInt(row[COL_WILT]         || 0) || 0

    // Skip rows where all counts are 0
    if (healthy + insect + leafspot + mosaic + wilt === 0) continue

    const municipality = await getMunicipality(lat, lng)

    records.push({ lat, lng, municipality, scanned_at: rawDt, healthy, insect, leafspot, mosaic, wilt })
  }
  return records
}

// ── Save records to database ──────────────────────────────────────────
function saveRecords(records) {
  let inserted = 0
  for (const r of records) {
    db.run(
      `INSERT INTO scan_records (lat, lng, municipality, scanned_at, source, healthy, insect, leafspot, mosaic, wilt)
       VALUES (?, ?, ?, ?, 'rover', ?, ?, ?, ?, ?)`,
      [r.lat, r.lng, r.municipality, r.scanned_at, r.healthy, r.insect, r.leafspot, r.mosaic, r.wilt]
    )
    inserted++
  }
  if (inserted > 0) db.save()
  return inserted
}

// ── Main sync ─────────────────────────────────────────────────────────
async function syncSheets() {
  try {
    const allRows  = await fetchSheetCSV()
    const dataRows = allRows.slice(1) // skip header
    const newRows  = dataRows.slice(lastSyncedRow)

    if (newRows.length === 0) {
      console.log(`[${new Date().toLocaleTimeString()}] [Sheets Sync] No new rows`)
      return
    }

    console.log(`[${new Date().toLocaleTimeString()}] [Sheets Sync] 📡 ${newRows.length} new row(s)`)
    const records  = await parseRows(newRows)
    const inserted = saveRecords(records)
    console.log(`[Sheets Sync] ✅ Saved ${inserted} rows to database`)
    lastSyncedRow += newRows.length

  } catch (err) {
    console.error('[Sheets Sync] ❌ Error:', err.message)
  }
}

function startSheetsSync() {
  console.log('✅ [Sheets Sync] Starting — polling Google Sheet every 2 minutes')
  syncSheets()
  cron.schedule(SYNC_INTERVAL, syncSheets)
}

module.exports = { startSheetsSync }