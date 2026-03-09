require('dotenv').config()
const express = require('express')
const db      = require('../db')
const { authMiddleware } = require('../middleware/authMiddleware')

const router = express.Router()

// ── GET /api/scans — public ───────────────────────────────────────────
router.get('/', (req, res) => {
  const records = db.all(
    `SELECT id, lat, lng, municipality, scanned_at as date,
            healthy, insect, leafspot, mosaic, wilt, is_edited
     FROM scan_records
     ORDER BY substr(scanned_at,7,4)||substr(scanned_at,4,2)||substr(scanned_at,1,2) DESC
     LIMIT 5000`
  )
  res.json(records)
})

// ── PUT /api/scans/:id — update all disease counts, mark as edited ────
router.put('/:id', authMiddleware, (req, res) => {
  const { scanned_at, lat, lng, municipality, healthy, insect, leafspot, mosaic, wilt } = req.body

  db.run(
    `UPDATE scan_records
     SET scanned_at  = ?,
         lat         = ?,
         lng         = ?,
         municipality = ?,
         healthy     = ?,
         insect      = ?,
         leafspot    = ?,
         mosaic      = ?,
         wilt        = ?,
         is_edited   = 1
     WHERE id = ?`,
    [scanned_at, lat, lng, municipality, 
     parseInt(healthy)  || 0,
     parseInt(insect)   || 0,
     parseInt(leafspot) || 0,
     parseInt(mosaic)   || 0,
     parseInt(wilt)     || 0,
     req.params.id]
  )
  db.save()
  res.json({ message: 'Record updated' })
})

// ── DELETE /api/scans/:id — requires login ────────────────────────────
router.delete('/:id', authMiddleware, (req, res) => {
  db.run('DELETE FROM scan_records WHERE id = ?', [req.params.id])
  db.save()
  res.json({ message: 'Record deleted' })
})

module.exports = router