require('dotenv').config()
const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const db = require('../db')
const { authMiddleware } = require('../middleware/authMiddleware')
const { sendPasswordResetEmail } = require('../email')

const router = express.Router()

// ── POST /api/auth/login ─────────────────────────────────────────────
router.post('/login', (req, res) => {
  const { email, password } = req.body
  const ip = req.ip

  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' })

  const user = db.get('SELECT * FROM users WHERE email = ? AND is_active = 1', [
    email.toLowerCase().trim(),
  ])

  if (!user || !bcrypt.compareSync(password, user.password)) {
    db.run('INSERT INTO login_logs (email, success, ip) VALUES (?, 0, ?)', [email, ip])
    return res.status(401).json({ error: 'Invalid email or password' })
  }

  db.run('INSERT INTO login_logs (user_id, email, success, ip) VALUES (?, ?, 1, ?)', [
    user.id,
    email,
    ip,
  ])

  const token = jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  )

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      mustChangePassword: user.must_change_password === 1,
    },
  })
})

// ── GET /api/auth/me ─────────────────────────────────────────────────
router.get('/me', authMiddleware, (req, res) => {
  const user = db.get(
    'SELECT id, name, email, role, phone, address, municipality, barangay, must_change_password FROM users WHERE id = ?',
    [req.user.id]
  )
  if (!user) return res.status(404).json({ error: 'User not found' })
  res.json({ ...user, mustChangePassword: user.must_change_password === 1 })
})

// ── POST /api/auth/change-password ───────────────────────────────────
router.post('/change-password', authMiddleware, (req, res) => {
  const { currentPassword, newPassword } = req.body

  if (!newPassword || newPassword.length < 8)
    return res.status(400).json({ error: 'New password must be at least 8 characters' })

  const user = db.get('SELECT * FROM users WHERE id = ?', [req.user.id])
  if (!user) return res.status(404).json({ error: 'User not found' })

  if (!user.must_change_password && !bcrypt.compareSync(currentPassword, user.password))
    return res.status(401).json({ error: 'Current password is incorrect' })

  const hashed = bcrypt.hashSync(newPassword, 12)
  db.run('UPDATE users SET password = ?, must_change_password = 0 WHERE id = ?', [hashed, user.id])
  db.save()

  res.json({ message: 'Password changed successfully' })
})

// ── POST /api/auth/forgot-password ───────────────────────────────────
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body
  if (!email) return res.status(400).json({ error: 'Email is required' })

  const user = db.get('SELECT * FROM users WHERE email = ? AND is_active = 1', [
    email.toLowerCase().trim(),
  ])
  if (!user) return res.json({ message: 'If that email exists, a reset link has been sent.' })

  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 3600000).toISOString()

  db.run('UPDATE password_reset_tokens SET used = 1 WHERE user_id = ?', [user.id])
  db.run('INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)', [
    user.id,
    token,
    expiresAt,
  ])
  db.save()

  try {
    await sendPasswordResetEmail({ to: user.email, name: user.name, resetToken: token })
  } catch (err) {
    console.error('=== EMAIL ERROR ===')
    console.error('Code:', err.code)
    console.error('Message:', err.message)
    console.error('Response:', err.response)
    console.error('GMAIL_USER set:', !!process.env.GMAIL_USER)
    console.error('GMAIL_APP_PASSWORD set:', !!process.env.GMAIL_APP_PASSWORD)
    console.error('==================')

    let hint = 'Check your Gmail config in .env'
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      hint = 'GMAIL_USER or GMAIL_APP_PASSWORD is missing in your .env file'
    } else if (err.code === 'EAUTH' || err.responseCode === 535) {
      hint =
        'Gmail App Password is wrong. Make sure you are using an App Password (16 chars), NOT your real Gmail password'
    } else if (err.code === 'ECONNECTION' || err.code === 'ESOCKET') {
      hint = 'Cannot connect to Gmail. Check your internet connection'
    } else if (err.responseCode === 550 || err.responseCode === 553) {
      hint = 'Recipient email address is invalid or rejected'
    }

    return res.status(500).json({ error: hint })
  }

  res.json({ message: 'If that email exists, a reset link has been sent.' })
})

// ── POST /api/auth/reset-password ────────────────────────────────────
router.post('/reset-password', (req, res) => {
  const { token, newPassword } = req.body

  if (!token || !newPassword || newPassword.length < 8)
    return res.status(400).json({ error: 'Token and new password (min 8 chars) are required' })

  const record = db.get(
    `
    SELECT prt.*, u.id as userId FROM password_reset_tokens prt
    JOIN users u ON u.id = prt.user_id
    WHERE prt.token = ? AND prt.used = 0 AND prt.expires_at > datetime('now')
  `,
    [token]
  )

  if (!record) return res.status(400).json({ error: 'Invalid or expired reset token' })

  const hashed = bcrypt.hashSync(newPassword, 12)
  db.run('UPDATE users SET password = ?, must_change_password = 0 WHERE id = ?', [
    hashed,
    record.userId,
  ])
  db.run('UPDATE password_reset_tokens SET used = 1 WHERE token = ?', [token])
  db.save()

  res.json({ message: 'Password reset successfully. You can now log in.' })
})

// ── GET /api/auth/test-email ── Test Gmail config ────────────────────
router.get('/test-email', async (req, res) => {
  const nodemailer = require('nodemailer')

  console.log('GMAIL_USER:', process.env.GMAIL_USER)
  console.log('GMAIL_APP_PASSWORD length:', process.env.GMAIL_APP_PASSWORD?.length)

  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    return res.status(500).json({
      ok: false,
      error: 'GMAIL_USER or GMAIL_APP_PASSWORD is not set in .env',
    })
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  })

  try {
    await transporter.verify()
    res.json({ ok: true, message: `Gmail connected successfully as ${process.env.GMAIL_USER}` })
  } catch (err) {
    console.error('Gmail verify error:', err)
    res.status(500).json({
      ok: false,
      code: err.code,
      response: err.response,
      error: err.message,
      hint:
        err.code === 'EAUTH'
          ? 'Wrong App Password. Use a Gmail App Password (16 chars), not your real password.'
          : err.message,
    })
  }
})

module.exports = router
