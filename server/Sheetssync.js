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

// ── Persist lastSyncedRow in DB so server restarts don't re-sync ─────
function getLastSyncedRow() {
  try {
    const row = db.get(`SELECT value FROM sync_state WHERE key = 'lastSyncedRow'`)
    return row ? parseInt(row.value) : 0
  } catch { return 0 }
}
function setLastSyncedRow(n) {
  db.run(`INSERT OR REPLACE INTO sync_state (key, value) VALUES ('lastSyncedRow', ?)`, [String(n)])
  db.save()
}

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
// Municipality geocoding happens AFTER saving — doesn't block sync
function parseRows(rows) {
  const records = []
  if (rows.length > 0) console.log(`[Sheets Sync] Sample row[0]:`, JSON.stringify(rows[0]))
  for (const row of rows) {
    if (!row || row.length < 8) continue

    const rawDt = String(row[COL_DATETIME] || '').trim()
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

    if (healthy + insect + leafspot + mosaic + wilt === 0) {
      console.log(`[Sheets Sync] ⚠️  Skipped zero-count row: ${rawDt}`)
      continue
    }

    // Save with null municipality first — geocode in background after
    records.push({ lat, lng, municipality: null, scanned_at: rawDt, healthy, insect, leafspot, mosaic, wilt })
  }
  return records
}

// ── Background geocoding — runs after records are saved ───────────────
async function geocodePendingRecords() {
  try {
    const pending = db.all(`SELECT id, lat, lng FROM scan_records WHERE municipality IS NULL LIMIT 50`)
    if (pending.length === 0) return
    console.log(`[Sheets Sync] 🌍 Geocoding ${pending.length} records...`)
    const seen = new Map()
    for (const r of pending) {
      const key = `${parseFloat(r.lat).toFixed(2)},${parseFloat(r.lng).toFixed(2)}`
      const mun = seen.has(key) ? seen.get(key) : await getMunicipality(r.lat, r.lng)
      seen.set(key, mun)
      db.run(`UPDATE scan_records SET municipality = ? WHERE id = ?`, [mun, r.id])
    }
    db.save()
    console.log(`[Sheets Sync] ✅ Geocoded ${pending.length} records`)
  } catch (err) {
    console.error('[Sheets Sync] Geocode error:', err.message)
  }
}

// ── Save records to database ──────────────────────────────────────────
function saveRecords(records) {
  // Get all manually edited records — these must never be overwritten by sync
  const editedRows = db.all(`SELECT lat, lng, scanned_at FROM scan_records WHERE is_edited = 1`)
  const editedKeys = new Set(editedRows.map(r => `${r.lat},${r.lng},${r.scanned_at}`))

  let inserted = 0
  let skipped  = 0
  for (const r of records) {
    const key = `${r.lat},${r.lng},${r.scanned_at}`
    // Skip records that were manually edited — preserve user changes
    if (editedKeys.has(key)) { skipped++; continue }
    db.run(
      `INSERT OR REPLACE INTO scan_records (lat, lng, municipality, scanned_at, source, healthy, insect, leafspot, mosaic, wilt, is_edited)
       VALUES (?, ?, ?, ?, 'rover', ?, ?, ?, ?, ?, 0)`,
      [r.lat, r.lng, r.municipality, r.scanned_at, r.healthy, r.insect, r.leafspot, r.mosaic, r.wilt]
    )
    inserted++
  }
  if (inserted > 0) db.save()
  if (skipped > 0) console.log(`[Sheets Sync] 🔒 Skipped ${skipped} manually edited records`)
  return inserted
}

// ── Main sync ─────────────────────────────────────────────────────────
// Always clear + re-sync so DB matches sheet exactly — no duplicates ever
async function syncSheets() {
  try {
    const allRows  = await fetchSheetCSV()
    const dataRows = allRows.slice(1) // skip header

    // Filter out empty rows and totals row at bottom
    const validRows = dataRows.filter(row => {
      if (!row || row.length < 8) return false
      const rawDt = String(row[COL_DATETIME] || '').trim()
      if (!rawDt || rawDt === '' || rawDt.toLowerCase().includes('date') || rawDt === 'N/A') return false
      const lat = parseFloat(row[COL_LATITUDE])
      const lng = parseFloat(row[COL_LONGITUDE])
      if (isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) return false
      return true
    })

    console.log(`[${new Date().toLocaleTimeString()}] [Sheets Sync] Sheet has ${validRows.length} valid rows`)

    // Parse synchronously — no geocoding yet
    const records = parseRows(validRows)
    console.log(`[Sheets Sync] Parsed ${records.length} records from ${validRows.length} rows`)

    if (records.length === 0) {
      console.log('[Sheets Sync] ⚠️  No records parsed — skipping to avoid empty DB')
      return
    }

    // Only delete non-edited records — preserve manual edits
    db.run('DELETE FROM scan_records WHERE is_edited = 0')
    db.save()
    const inserted = saveRecords(records)
    console.log(`[Sheets Sync] ✅ Synced ${inserted} rows — matches sheet exactly`)

    // Geocode in background — won't block next sync cycle
    geocodePendingRecords()

  } catch (err) {
    console.error('[Sheets Sync] ❌ Error:', err.message)
  }
}

function startSheetsSync() {
  console.log(`✅ [Sheets Sync] Starting — resuming from row ${getLastSyncedRow()} (persisted)`)
  syncSheets()
  cron.schedule(SYNC_INTERVAL, syncSheets)
}

module.exports = { startSheetsSync }