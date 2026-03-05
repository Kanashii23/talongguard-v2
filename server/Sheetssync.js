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

// ── Pre-seeded municipality bounds for Nueva Ecija ───────────────────
const MUNICIPALITY_BOUNDS = [
  { name: 'Cabanatuan City',       latMin: 15.44, latMax: 15.53, lngMin: 120.92, lngMax: 121.02 },
  { name: 'Science City of Munoz', latMin: 15.68, latMax: 15.76, lngMin: 120.86, lngMax: 120.95 },
  { name: 'Talavera',              latMin: 15.53, latMax: 15.63, lngMin: 120.87, lngMax: 120.96 },
  { name: 'San Jose City',         latMin: 15.75, latMax: 15.83, lngMin: 120.95, lngMax: 121.03 },
  { name: 'San Isidro',            latMin: 15.40, latMax: 15.47, lngMin: 120.82, lngMax: 120.91 },
  { name: 'Aliaga',                latMin: 15.62, latMax: 15.71, lngMin: 120.79, lngMax: 120.89 },
  { name: 'Cuyapo',                latMin: 15.75, latMax: 15.82, lngMin: 120.62, lngMax: 120.71 },
  { name: 'Guimba',                latMin: 15.62, latMax: 15.73, lngMin: 120.73, lngMax: 120.81 },
  { name: 'Lupao',                 latMin: 15.81, latMax: 15.89, lngMin: 120.87, lngMax: 120.96 },
  { name: 'Gapan City',            latMin: 15.29, latMax: 15.37, lngMin: 120.92, lngMax: 121.01 },
  { name: 'Zaragoza',              latMin: 15.49, latMax: 15.56, lngMin: 120.84, lngMax: 120.91 },
  { name: 'Llanera',               latMin: 15.67, latMax: 15.74, lngMin: 120.73, lngMax: 120.80 },
  { name: 'Rizal',                 latMin: 15.72, latMax: 15.78, lngMin: 120.74, lngMax: 120.81 },
  { name: 'Nampicuan',             latMin: 15.67, latMax: 15.73, lngMin: 120.68, lngMax: 120.75 },
  { name: 'Sto. Domingo',          latMin: 15.52, latMax: 15.60, lngMin: 120.83, lngMax: 120.89 },
]

function getMunicipalityFromBounds(lat, lng) {
  const flat = parseFloat(lat), flng = parseFloat(lng)
  for (const m of MUNICIPALITY_BOUNDS) {
    if (flat >= m.latMin && flat <= m.latMax && flng >= m.lngMin && flng <= m.lngMax) {
      return m.name
    }
  }
  return null
}

// ── Reverse geocode lat/lng → municipality via OpenCage ──────────────
const _munCache = new Map()
async function getMunicipality(lat, lng) {
  const key = `${parseFloat(lat).toFixed(3)},${parseFloat(lng).toFixed(3)}`
  if (_munCache.has(key)) return _munCache.get(key)

  // Try bounds first — instant, no API call needed
  const fromBounds = getMunicipalityFromBounds(lat, lng)
  if (fromBounds) {
    _munCache.set(key, fromBounds)
    return fromBounds
  }

  try {
    const apiKey = process.env.OPENCAGE_API_KEY
    const query  = encodeURIComponent(`${lat},${lng}`)
    const url    = `https://api.opencagedata.com/geocode/v1/json?key=${apiKey}&q=${query}&no_annotations=1&language=en`
    const res    = await fetch(url)
    const data   = await res.json()

    if (data.status && data.status.code !== 200) {
      console.error('[Geocode] API error:', data.status.message)
      return 'Nueva Ecija'
    }

    if (data.results && data.results.length > 0) {
      const comp = data.results[0].components
      // Philippines admin levels: city/town → municipality → county → state_district
      let mun = comp.city        ||
                comp.town        ||
                comp.municipality||
                comp.county      ||
                comp.state_district || 'Nueva Ecija'
      // Clean up prefixes
      mun = mun.replace(/^(City of |Municipality of )/i, '').trim()
      console.log(`[Geocode] ✅ ${lat},${lng} → ${mun}`)
      _munCache.set(key, mun)
      return mun
    }
    return 'Nueva Ecija'
  } catch (e) {
    console.error('[Geocode] Error:', e.message)
    return 'Nueva Ecija'
  }
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
    // Step 1: Fix all records using bounds first (instant, no API)
    const allRecords = db.all(`SELECT id, lat, lng, municipality FROM scan_records`)
    let fixedByBounds = 0
    for (const r of allRecords) {
      const fromBounds = getMunicipalityFromBounds(r.lat, r.lng)
      if (fromBounds && fromBounds !== r.municipality) {
        db.run(`UPDATE scan_records SET municipality = ? WHERE id = ?`, [fromBounds, r.id])
        fixedByBounds++
      }
    }
    if (fixedByBounds > 0) {
      db.save()
      console.log(`[Geocode] ✅ Fixed ${fixedByBounds} records via bounds`)
    }

    // Step 2: API geocode remaining NULL records
    const pending = db.all(`SELECT id, lat, lng FROM scan_records WHERE municipality IS NULL LIMIT 50`)
    if (pending.length === 0) return
    console.log(`[Sheets Sync] 🌍 Geocoding ${pending.length} records via OpenCage...`)
    const seen = new Map()
    for (const r of pending) {
      const key = `${parseFloat(r.lat).toFixed(3)},${parseFloat(r.lng).toFixed(3)}`
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