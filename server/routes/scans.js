require('dotenv').config()
const express = require('express')
const db      = require('../db')
const { authMiddleware } = require('../middleware/authMiddleware')

const router = express.Router()

// ── GET /api/scans — public, no auth needed ───────────────────────────
router.get('/', (req, res) => {
  const records = db.all(
    `SELECT id, lat, lng, municipality, scanned_at as date,
            healthy, insect, leafspot, mosaic, wilt
     FROM scan_records
     ORDER BY scanned_at DESC
     LIMIT 2000`
  )
  res.json(records)
})

// ── DELETE /api/scans/:id — requires login ────────────────────────────
router.delete('/:id', authMiddleware, (req, res) => {
  db.run('DELETE FROM scan_records WHERE id = ?', [req.params.id])
  db.save()
  res.json({ message: 'Record deleted' })
})

// ── PUT /api/scans/:id — requires login ───────────────────────────────
router.put('/:id', authMiddleware, (req, res) => {
  const { scanned_at, healthy, insect, leafspot, mosaic, wilt } = req.body
  db.run(
    `UPDATE scan_records SET scanned_at=?, healthy=?, insect=?, leafspot=?, mosaic=?, wilt=? WHERE id=?`,
    [scanned_at, healthy, insect, leafspot, mosaic, wilt, req.params.id]
  )
  db.save()
  res.json({ message: 'Record updated' })
})

module.exports = router