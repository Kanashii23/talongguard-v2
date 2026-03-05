'use strict'
const db = require('./db')

// ── Toggle geocoding mode ─────────────────────────────────────────────
// true  = centroid nearest-neighbor (instant, no API calls — use for test data)
// false = Nominatim API (accurate, free, no key needed — use for real rover data)
const USE_TEST_MODE = true

const SHEET_ID  = '1gcT90rgmRczXM8C0sbMY-j_vk3WyvBUvzm5sXV-ygW0'
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=tsv`

const COL_DATETIME     = 0
const COL_LONGITUDE    = 1
const COL_LATITUDE     = 2
const COL_HEALTHY_LEAF = 3
const COL_INSECT_PEST  = 4
const COL_LEAF_SPOT    = 5
const COL_MOSAIC_VIRUS = 6
const COL_WILT         = 7

// Nearest-neighbor centroid lookup — no overlaps, every coord maps to exactly one municipality
const MUNICIPALITY_CENTROIDS = [
  { name: 'Aliaga',                    lat: 15.4939, lng: 120.8400 },
  { name: 'Bongabon',                  lat: 15.6329, lng: 121.1423 },
  { name: 'Cabiao',                    lat: 15.2374, lng: 120.8581 },
  { name: 'Carranglan',                lat: 15.9610, lng: 121.0484 },
  { name: 'Cuyapo',                    lat: 15.7732, lng: 120.6598 },
  { name: 'Gabaldon',                  lat: 15.4626, lng: 121.3331 },
  { name: 'General Mamerto Natividad', lat: 15.7594, lng: 121.0600 },
  { name: 'General Tinio',             lat: 15.3650, lng: 121.0700 },
  { name: 'Guimba',                    lat: 15.6674, lng: 120.7724 },
  { name: 'Jaen',                      lat: 15.3284, lng: 120.9038 },
  { name: 'Laur',                      lat: 15.5708, lng: 121.2500 },
  { name: 'Licab',                     lat: 15.5293, lng: 120.7966 },
  { name: 'Llanera',                   lat: 15.6719, lng: 120.6700 },
  { name: 'Lupao',                     lat: 15.8481, lng: 120.9006 },
  { name: 'Nampicuan',                 lat: 15.7156, lng: 120.6928 },
  { name: 'Pantabangan',               lat: 15.8063, lng: 121.1425 },
  { name: 'Penaranda',                 lat: 15.3400, lng: 121.0200 },
  { name: 'Quezon',                    lat: 15.7981, lng: 121.2347 },
  { name: 'Rizal',                     lat: 15.7189, lng: 121.1039 },
  { name: 'San Antonio',               lat: 15.4936, lng: 121.1800 },
  { name: 'San Isidro',                lat: 15.4286, lng: 121.0400 },
  { name: 'San Leonardo',              lat: 15.3660, lng: 120.9682 },
  { name: 'Santa Rosa',                lat: 15.4273, lng: 120.8706 },
  { name: 'Santo Domingo',             lat: 15.5730, lng: 120.8713 },
  { name: 'Talavera',                  lat: 15.5766, lng: 120.9108 },
  { name: 'Talugtug',                  lat: 15.8386, lng: 120.7286 },
  { name: 'Zaragoza',                  lat: 15.5072, lng: 120.8678 },
  { name: 'Cabanatuan City',           lat: 15.4851, lng: 120.9755 },
  { name: 'Science City of Munoz',     lat: 15.7186, lng: 120.9042 },
  { name: 'San Jose City',             lat: 15.8009, lng: 121.0062 },
  { name: 'Gapan City',                lat: 15.3066, lng: 120.9495 },
  { name: 'Palayan City',              lat: 15.5489, lng: 121.0795 },
]

function getMunicipalityFromCentroids(lat, lng) {
  const flat = parseFloat(lat), flng = parseFloat(lng)
  let best = null, bestDist = Infinity
  for (const m of MUNICIPALITY_CENTROIDS) {
    const dist = (m.lat - flat) ** 2 + (m.lng - flng) ** 2
    if (dist < bestDist) { bestDist = dist; best = m.name }
  }
  return best
}

const _munCache = new Map()

async function getMunicipality(lat, lng) {
  const key = `${parseFloat(lat).toFixed(4)},${parseFloat(lng).toFixed(4)}`
  if (_munCache.has(key)) return _munCache.get(key)

  // TEST MODE: instant centroid lookup, zero API calls
  if (USE_TEST_MODE) {
    const mun = getMunicipalityFromCentroids(lat, lng) || 'Unknown'
    _munCache.set(key, mun)
    return mun
  }

  // NOMINATIM: accurate reverse geocoding, free, no key needed
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
    const res  = await fetch(url, { headers: { 'User-Agent': 'TalongGuard-Thesis/1.0 (Nueva Ecija PH)' } })
    const text = await res.text()
    // Guard against HTML/XML error responses
    if (!text || text.trim().startsWith('<')) {
      console.error(`[Geocode] Nominatim returned non-JSON for ${lat},${lng} — skipping`)
      return 'Unknown'
    }
    const data = JSON.parse(text)
    if (data && data.address) {
      const a   = data.address
      const mun = a.city || a.town || a.municipality || a.village || a.county || 'Unknown'
      console.log(`[Geocode] Nominatim ${lat},${lng} -> ${mun}`)
      _munCache.set(key, mun)
      return mun
    }
    return 'Unknown'
  } catch (e) { console.error('[Geocode] Error:', e.message); return 'Unknown' }
}

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
      console.log(`[Sheets Sync] Skipped zero-count row: ${rawDt}`); continue
    }
    // In test mode resolve immediately, in Nominatim mode leave null for background geocoding
    const municipality = USE_TEST_MODE ? (getMunicipalityFromCentroids(lat, lng) || null) : null
    records.push({ lat, lng, municipality, scanned_at: rawDt, healthy, insect, leafspot, mosaic, wilt })
  }
  return records
}

async function geocodePendingRecords() {
  try {
    const pending = db.all(`SELECT id, lat, lng FROM scan_records WHERE municipality IS NULL`)
    if (pending.length === 0) return

    if (USE_TEST_MODE) {
      // Test mode: resolve all via centroids instantly
      let resolved = 0
      for (const r of pending) {
        const mun = getMunicipalityFromCentroids(r.lat, r.lng) || 'Unknown'
        db.run(`UPDATE scan_records SET municipality = ? WHERE id = ?`, [mun, r.id])
        resolved++
      }
      db.save()
      console.log(`[Geocode] ${resolved} records resolved via centroids (0 API calls)`)
      return
    }

    // Nominatim mode: group by unique coord, 1 req/sec
    const coordGroups = new Map()
    for (const r of pending) {
      const key = `${parseFloat(r.lat).toFixed(3)},${parseFloat(r.lng).toFixed(3)}`
      if (!coordGroups.has(key)) coordGroups.set(key, { lat: r.lat, lng: r.lng, ids: [] })
      coordGroups.get(key).ids.push(r.id)
    }
    console.log(`[Geocode] ${pending.length} records pending, ${coordGroups.size} unique coords — Nominatim starting...`)
    const entries = [...coordGroups.entries()].slice(0, 50) // max 50 per cycle
    console.log(`[Geocode] Processing ${entries.length} of ${coordGroups.size} coords this cycle...`)
    let done = 0
    for (const [, group] of entries) {
      const mun = await getMunicipality(group.lat, group.lng)
      for (const id of group.ids) db.run(`UPDATE scan_records SET municipality = ? WHERE id = ?`, [mun, id])
      done += group.ids.length
      await new Promise(res => setTimeout(res, 1200)) // slightly over 1 req/sec to be safe
    }
    db.save()
    console.log(`[Geocode] Done this cycle — ${done} records geocoded (more pending on next sync)`)
  } catch (err) { console.error('[Sheets Sync] Geocode error:', err.message) }
}

function saveRecords(records) {
  const editedRows = db.all(`SELECT lat, lng, scanned_at FROM scan_records WHERE is_edited = 1`)
  const editedKeys = new Set(editedRows.map(r => `${r.lat},${r.lng},${r.scanned_at}`))
  let inserted = 0, skipped = 0
  for (const r of records) {
    const key = `${r.lat},${r.lng},${r.scanned_at}`
    if (editedKeys.has(key)) { skipped++; continue }
    // Preserve existing municipality if already geocoded
    const existing = db.get(`SELECT municipality FROM scan_records WHERE lat=? AND lng=? AND scanned_at=?`, [r.lat, r.lng, r.scanned_at])
    const municipality = r.municipality || (existing && existing.municipality) || null
    db.run(
      `INSERT OR REPLACE INTO scan_records (lat, lng, municipality, scanned_at, source, healthy, insect, leafspot, mosaic, wilt, is_edited) VALUES (?, ?, ?, ?, 'rover', ?, ?, ?, ?, ?, 0)`,
      [r.lat, r.lng, municipality, r.scanned_at, r.healthy, r.insect, r.leafspot, r.mosaic, r.wilt]
    )
    inserted++
  }
  if (inserted > 0) db.save()
  if (skipped  > 0) console.log(`[Sheets Sync] Skipped ${skipped} manually edited records`)
  return inserted
}

async function syncFromSheet() {
  try {
    const res  = await fetch(SHEET_URL)
    const text = await res.text()
    const rows = text.split('\n').map(line => line.split('\t').map(c => c.trim()))
    const validRows = rows.filter(r => r && r.length >= 8 && r[0] && !r[0].toLowerCase().includes('date'))
    console.log(`[Sheets Sync] Sheet has ${validRows.length} valid rows`)
    const records = parseRows(validRows)
    console.log(`[Sheets Sync] Parsed ${records.length} records from ${validRows.length} rows`)
    if (records.length === 0) { console.log('[Sheets Sync] No records parsed — skipping'); return }
    db.run('DELETE FROM scan_records WHERE is_edited = 0')
    db.save()
    const inserted = saveRecords(records)
    console.log(`[Sheets Sync] Synced ${inserted} rows`)
    geocodePendingRecords()
  } catch (err) { console.error('[Sheets Sync] Error:', err.message) }
}

function startSync() {
  console.log(`[Sheets Sync] Starting... (${USE_TEST_MODE ? 'TEST MODE' : 'NOMINATIM MODE'})`)
  syncFromSheet()
  setInterval(syncFromSheet, 2 * 60 * 1000)
}

module.exports = { startSync }
