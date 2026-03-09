require('dotenv').config()
const express = require('express')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')
const db = require('../db')
const { authMiddleware, adminOnly } = require('../middleware/authMiddleware')
const { sendWelcomeEmail, sendVerificationCode } = require('../email')

const router = express.Router()

// ── In-memory store for verification codes (email → { code, expires, name }) ──
const verificationCodes = new Map()

// ── Helpers ──────────────────────────────────────────────────────────
function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

function validatePHPhone(phone) {
  return /^09\d{9}$/.test(phone.replace(/\s/g, ''))
}

// ── POST /api/users/send-code ─────────────────────────────────────────
router.post('/send-code', authMiddleware, adminOnly, async (req, res) => {
  const { email, name } = req.body

  if (!email || !name) return res.status(400).json({ error: 'Email and name are required' })

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) return res.status(400).json({ error: 'Invalid email address' })

  try {
    const existing = await db.get('SELECT id FROM users WHERE email = ?', [
      email.toLowerCase().trim(),
    ])
    if (existing)
      return res.status(409).json({ error: 'An account with this email already exists' })

    const code = generateCode()
    const expires = Date.now() + 10 * 60 * 1000

    verificationCodes.set(email.toLowerCase().trim(), { code, expires, name })

    try {
      await sendVerificationCode({ to: email, name, code })
    } catch (err) {
      console.error('Verification email failed:', err.message)
      return res
        .status(500)
        .json({ error: 'Failed to send verification email. Check Gmail config in .env' })
    }

    console.log(`📧 Verification code sent to ${email}: ${code}`)
    res.json({ message: `Verification code sent to ${email}` })
  } catch (err) {
    console.error('Send code error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ── GET /api/users ────────────────────────────────────────────────────
router.get('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const users = await db.all(`
      SELECT u.id, u.name, u.email, u.phone, u.address, u.municipality, u.barangay,
             u.role, u.is_active, u.must_change_password, u.created_at,
             c.name as created_by_name
      FROM users u
      LEFT JOIN users c ON c.id = u.created_by
      ORDER BY u.created_at DESC
    `)
    res.json(
      users.map((u) => ({
        ...u,
        isActive: u.is_active === 1 || u.is_active === true,
        mustChangePassword: u.must_change_password === 1 || u.must_change_password === true,
      }))
    )
  } catch (err) {
    console.error('Get users error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ── POST /api/users ───────────────────────────────────────────────────
router.post('/', authMiddleware, adminOnly, async (req, res) => {
  const {
    name,
    email,
    phone,
    address,
    municipality,
    barangay,
    role = 'agriculturist',
    password,
    verificationCode,
  } = req.body

  if (!name || !email || !phone || !password || !verificationCode)
    return res
      .status(400)
      .json({ error: 'Name, email, phone, password, and verification code are all required' })

  const cleanPhone = phone.replace(/\s/g, '')
  if (!validatePHPhone(cleanPhone))
    return res
      .status(400)
      .json({ error: 'Phone must be a valid Philippine number (09XXXXXXXXX, 11 digits)' })

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) return res.status(400).json({ error: 'Invalid email address' })

  if (password.length < 8)
    return res.status(400).json({ error: 'Password must be at least 8 characters' })

  const emailKey = email.toLowerCase().trim()
  const stored = verificationCodes.get(emailKey)

  if (!stored)
    return res
      .status(400)
      .json({ error: 'No verification code found for this email. Please send the code first.' })

  if (Date.now() > stored.expires) {
    verificationCodes.delete(emailKey)
    return res.status(400).json({ error: 'Verification code has expired. Please send a new one.' })
  }

  if (stored.code !== verificationCode.trim())
    return res
      .status(400)
      .json({ error: 'Incorrect verification code. Please check and try again.' })

  try {
    const existing = await db.get('SELECT id FROM users WHERE email = ?', [emailKey])
    if (existing)
      return res.status(409).json({ error: 'An account with this email already exists' })

    const hashed = bcrypt.hashSync(password, 12)

    const result = await db.run(
      `INSERT INTO users (name, email, password, phone, address, municipality, barangay, role, is_active, must_change_password, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 0, ?)`,
      [
        name.trim(),
        emailKey,
        hashed,
        cleanPhone,
        address || null,
        municipality || null,
        barangay || null,
        role,
        req.user.id,
      ]
    )

    verificationCodes.delete(emailKey)

    let emailSent = false
    try {
      await sendWelcomeEmail({
        to: email,
        name: name.trim(),
        email: emailKey,
        tempPassword: password,
      })
      emailSent = true
    } catch (err) {
      console.error('Welcome email failed:', err.message)
    }

    res.status(201).json({
      message: `Account created successfully for ${name}`,
      userId: result.lastInsertRowid,
      emailSent,
    })
  } catch (err) {
    console.error('Create user error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ── PUT /api/users/:id ────────────────────────────────────────────────
router.put('/:id', authMiddleware, adminOnly, async (req, res) => {
  const { id } = req.params
  const { name, phone, address, municipality, barangay, role, isActive } = req.body

  try {
    const user = await db.get('SELECT id FROM users WHERE id = ?', [id])
    if (!user) return res.status(404).json({ error: 'User not found' })

    if (phone) {
      const cleanPhone = phone.replace(/\s/g, '')
      if (!validatePHPhone(cleanPhone))
        return res
          .status(400)
          .json({ error: 'Phone must be a valid Philippine number (09XXXXXXXXX, 11 digits)' })
      await db.run('UPDATE users SET phone = ? WHERE id = ?', [cleanPhone, id])
    }

    if (name) await db.run('UPDATE users SET name         = ? WHERE id = ?', [name, id])
    if (address) await db.run('UPDATE users SET address      = ? WHERE id = ?', [address, id])
    if (municipality)
      await db.run('UPDATE users SET municipality = ? WHERE id = ?', [municipality, id])
    if (barangay) await db.run('UPDATE users SET barangay     = ? WHERE id = ?', [barangay, id])
    if (role) await db.run('UPDATE users SET role         = ? WHERE id = ?', [role, id])
    if (isActive != null)
      await db.run('UPDATE users SET is_active = ? WHERE id = ?', [isActive ? 1 : 0, id])

    res.json({ message: 'User updated successfully' })
  } catch (err) {
    console.error('Update user error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ── POST /api/users/:id/reset-password ───────────────────────────────
router.post('/:id/reset-password', authMiddleware, adminOnly, async (req, res) => {
  const { id } = req.params

  try {
    const user = await db.get('SELECT * FROM users WHERE id = ?', [id])
    if (!user) return res.status(404).json({ error: 'User not found' })

    const words = ['Talong', 'Guard', 'Field', 'Agri', 'Plant']
    const word = words[Math.floor(Math.random() * words.length)]
    const nums = Math.floor(1000 + Math.random() * 9000)
    const chars = crypto.randomBytes(2).toString('hex').slice(0, 3).toUpperCase()
    const tempPassword = `${word}@${nums}#${chars}`
    const hashed = bcrypt.hashSync(tempPassword, 12)

    await db.run('UPDATE users SET password = ?, must_change_password = 1 WHERE id = ?', [
      hashed,
      id,
    ])

    let emailSent = false
    try {
      await sendWelcomeEmail({ to: user.email, name: user.name, email: user.email, tempPassword })
      emailSent = true
    } catch (err) {
      console.error('Reset email failed:', err.message)
    }

    res.json({
      message: emailSent ? 'Password reset and sent via email' : 'Password reset (email failed)',
      tempPassword: emailSent ? undefined : tempPassword,
      emailSent,
    })
  } catch (err) {
    console.error('Reset password error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ── DELETE /api/users/:id ─────────────────────────────────────────────
router.delete('/:id', authMiddleware, adminOnly, async (req, res) => {
  const { id } = req.params
  if (parseInt(id) === req.user.id)
    return res.status(400).json({ error: 'You cannot delete your own account' })

  try {
    const user = await db.get('SELECT id FROM users WHERE id = ?', [id])
    if (!user) return res.status(404).json({ error: 'User not found' })

    await db.run('UPDATE users SET is_active = 0 WHERE id = ?', [id])

    res.json({ message: 'User deactivated successfully' })
  } catch (err) {
    console.error('Delete user error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router
