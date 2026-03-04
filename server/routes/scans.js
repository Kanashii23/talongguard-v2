require('dotenv').config()
const express = require('express')
const db      = require('../db')
const { authMiddleware } = require('../middleware/authMiddleware')

const router = express.Router()

// ── Reverse geocode lat/lng → municipality via Nominatim ──────────────
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

// ── POST /api/scans/ingest ────────────────────────────────────────────
// Called by the Raspberry Pi to send detection records
// Accepts array: [{ lat, lng, disease, scanned_at? }, ...]
// Groups by municipality — only inserts if municipality is new for that date
router.post('/ingest', async (req, res) => {
  // Simple API key check (add ROVER_API_KEY=xxx to your .env)
  const apiKey = req.headers['x-api-key']
  if (process.env.ROVER_API_KEY && apiKey !== process.env.ROVER_API_KEY) {
    return res.status(401).json({ error: 'Invalid API key' })
  }

  let records = req.body
  if (!Array.isArray(records)) records = [records]
  if (records.length === 0) return res.status(400).json({ error: 'No records provided' })

  const VALID_DISEASES = ['healthy', 'insect', 'leafspot', 'mosaic', 'mold', 'wilt'] // mold kept for sample data
  const inserted = []
  const skipped  = []

  for (const rec of records) {
    const lat     = parseFloat(rec.lat  || rec.latitude)
    const lng     = parseFloat(rec.lng  || rec.longitude || rec.long)
    // Normalize disease name — raspi_sender.py already maps to keys,
    // but keep fallbacks for direct sheet field names just in case
    let disease = (rec.disease || rec.dis || '').toLowerCase().trim()
    const diseaseAliases = {
      'healthy leaf':        'healthy',
      'insect pest':         'insect',
      'insect pest disease': 'insect',
      'leaf spot':           'leafspot',
      'leaf spot disease':   'leafspot',
      'mosaic virus':        'mosaic',
      'white mold':          'mold',
      'white mold disease':  'mold',
      'wilt disease':        'wilt',
    }
    if (diseaseAliases[disease]) disease = diseaseAliases[disease]

    // Validate
    if (isNaN(lat) || isNaN(lng)) { skipped.push({ rec, reason: 'invalid coordinates' }); continue }
    if (!VALID_DISEASES.includes(disease)) { skipped.push({ rec, reason: `unknown disease: ${disease}` }); continue }

    // Get municipality
    const municipality = await getMunicipality(lat, lng)
    const date         = (rec.scanned_at || rec.timestamp || new Date().toISOString()).split('T')[0]

    // ── Only insert if this municipality hasn't been scanned today ──
    // (prevents duplicate sessions from nearby GPS points)
    const existing = db.get(
      `SELECT id FROM scan_records
       WHERE municipality = ?
       AND date(scanned_at) = ?
       LIMIT 1`,
      [municipality, date]
    )

    const scanned_at = rec.scanned_at || rec.timestamp || new Date().toISOString().replace('T', ' ').slice(0, 19)

    // Always insert the record (we need all data points)
    // The "municipality filter" only applies to SESSION display on frontend
    db.run(
      `INSERT INTO scan_records (lat, lng, disease, municipality, scanned_at, source)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [lat, lng, disease, municipality, scanned_at, rec.source || 'rover']
    )

    inserted.push({ lat, lng, disease, municipality, scanned_at, isNewMunicipality: !existing })
  }

  db.save()

  res.json({
    message:  `Processed ${records.length} records`,
    inserted: inserted.length,
    skipped:  skipped.length,
    details:  inserted,
  })
})

// ── GET /api/scans ────────────────────────────────────────────────────
// Frontend fetches all scan records
router.get('/', authMiddleware, (req, res) => {
  const records = db.all(
    `SELECT id, lat, lng, disease, municipality, scanned_at as date
     FROM scan_records
     ORDER BY scanned_at DESC
     LIMIT 2000`
  )
  res.json(records)
})

// ── DELETE /api/scans/:id ─────────────────────────────────────────────
router.delete('/:id', authMiddleware, (req, res) => {
  db.run('DELETE FROM scan_records WHERE id = ?', [req.params.id])
  db.save()
  res.json({ message: 'Record deleted' })
})

// ── PUT /api/scans/:id ────────────────────────────────────────────────
router.put('/:id', authMiddleware, (req, res) => {
  const { disease, scanned_at } = req.body
  if (disease) db.run('UPDATE scan_records SET disease = ? WHERE id = ?', [disease, req.params.id])
  if (scanned_at) db.run('UPDATE scan_records SET scanned_at = ? WHERE id = ?', [scanned_at, req.params.id])
  db.save()
  res.json({ message: 'Record updated' })
})

module.exports = router