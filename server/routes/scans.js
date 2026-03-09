require('dotenv').config()
const express = require('express')
const db = require('../db')
const { authMiddleware } = require('../middleware/authMiddleware')

const router = express.Router()

// ── GET /api/scans — public ───────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const records = await db.all(
      `SELECT id, lat, lng, municipality, scanned_at as date,
              healthy, insect, leafspot, mosaic, wilt, is_edited
       FROM scan_records
       ORDER BY scanned_at DESC
       LIMIT 5000`
    )
    res.json(records)
  } catch (err) {
    console.error('GET /scans error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// ── PUT /api/scans/:id ────────────────────────────────────────────────
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { scanned_at, lat, lng, municipality, healthy, insect, leafspot, mosaic, wilt } = req.body
    await db.run(
      `UPDATE scan_records
       SET scanned_at   = ?,
           lat          = ?,
           lng          = ?,
           municipality = ?,
           healthy      = ?,
           insect       = ?,
           leafspot     = ?,
           mosaic       = ?,
           wilt         = ?,
           is_edited    = 1
       WHERE id = ?`,
      [
        scanned_at,
        lat,
        lng,
        municipality,
        parseInt(healthy) || 0,
        parseInt(insect) || 0,
        parseInt(leafspot) || 0,
        parseInt(mosaic) || 0,
        parseInt(wilt) || 0,
        req.params.id,
      ]
    )
    res.json({ message: 'Record updated' })
  } catch (err) {
    console.error('PUT /scans error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// ── DELETE /api/scans/:id ─────────────────────────────────────────────
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await db.run('DELETE FROM scan_records WHERE id = ?', [req.params.id])
    res.json({ message: 'Record deleted' })
  } catch (err) {
    console.error('DELETE /scans error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
