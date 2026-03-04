require('dotenv').config()
const express = require('express')
const bcrypt  = require('bcryptjs')
const crypto  = require('crypto')
const db      = require('../db')
const { authMiddleware, adminOnly } = require('../middleware/authMiddleware')
const { sendWelcomeEmail, sendVerificationCode } = require('../email')

const router = express.Router()

// ── In-memory store for verification codes (email → { code, expires, name }) ──
const verificationCodes = new Map()

// ── Helpers ──────────────────────────────────────────────────────────
function generateCode() {
  // 6-digit number e.g. 482910
  return String(Math.floor(100000 + Math.random() * 900000))
}

function validatePHPhone(phone) {
  // Must be exactly 11 digits starting with 09
  return /^09\d{9}$/.test(phone.replace(/\s/g, ''))
}

// ── POST /api/users/send-code ─────────────────────────────────────────
// Admin hits this to send a verification code to the new user's email
router.post('/send-code', authMiddleware, adminOnly, async (req, res) => {
  const { email, name } = req.body

  if (!email || !name)
    return res.status(400).json({ error: 'Email and name are required' })

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email))
    return res.status(400).json({ error: 'Invalid email address' })

  // Check if email already registered
  const existing = db.get('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()])
  if (existing)
    return res.status(409).json({ error: 'An account with this email already exists' })

  const code    = generateCode()
  const expires = Date.now() + 10 * 60 * 1000 // 10 minutes

  verificationCodes.set(email.toLowerCase().trim(), { code, expires, name })

  try {
    await sendVerificationCode({ to: email, name, code })
  } catch (err) {
    console.error('Verification email failed:', err.message)
    return res.status(500).json({ error: 'Failed to send verification email. Check Gmail config in .env' })
  }

  console.log(`📧 Verification code sent to ${email}: ${code}`)
  res.json({ message: `Verification code sent to ${email}` })
})

// ── GET /api/users ────────────────────────────────────────────────────
router.get('/', authMiddleware, adminOnly, (req, res) => {
  const users = db.all(`
    SELECT u.id, u.name, u.email, u.phone, u.address, u.municipality, u.barangay,
           u.role, u.is_active, u.must_change_password, u.created_at,
           c.name as created_by_name
    FROM users u
    LEFT JOIN users c ON c.id = u.created_by
    ORDER BY u.created_at DESC
  `)
  res.json(users.map(u => ({
    ...u,
    isActive:           u.is_active            === 1,
    mustChangePassword: u.must_change_password  === 1,
  })))
})

// ── POST /api/users ───────────────────────────────────────────────────
router.post('/', authMiddleware, adminOnly, async (req, res) => {
  const {
    name, email, phone, address, municipality,
    barangay, role = 'agriculturist',
    password, verificationCode,
  } = req.body

  // ── Validate required ──
  if (!name || !email || !phone || !password || !verificationCode)
    return res.status(400).json({ error: 'Name, email, phone, password, and verification code are all required' })

  // ── Validate phone (PH format 09XXXXXXXXX) ──
  const cleanPhone = phone.replace(/\s/g, '')
  if (!validatePHPhone(cleanPhone))
    return res.status(400).json({ error: 'Phone must be a valid Philippine number (09XXXXXXXXX, 11 digits)' })

  // ── Validate email ──
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email))
    return res.status(400).json({ error: 'Invalid email address' })

  // ── Validate password ──
  if (password.length < 8)
    return res.status(400).json({ error: 'Password must be at least 8 characters' })

  // ── Verify the code ──
  const emailKey = email.toLowerCase().trim()
  const stored   = verificationCodes.get(emailKey)

  if (!stored)
    return res.status(400).json({ error: 'No verification code found for this email. Please send the code first.' })

  if (Date.now() > stored.expires) {
    verificationCodes.delete(emailKey)
    return res.status(400).json({ error: 'Verification code has expired. Please send a new one.' })
  }

  if (stored.code !== verificationCode.trim())
    return res.status(400).json({ error: 'Incorrect verification code. Please check and try again.' })

  // ── Check duplicate ──
  const existing = db.get('SELECT id FROM users WHERE email = ?', [emailKey])
  if (existing)
    return res.status(409).json({ error: 'An account with this email already exists' })

  // ── Create account ──
  const hashed = bcrypt.hashSync(password, 12)

  const result = db.run(
    `INSERT INTO users (name, email, password, phone, address, municipality, barangay, role, is_active, must_change_password, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 0, ?)`,
    [
      name.trim(), emailKey, hashed,
      cleanPhone,
      address || null, municipality || null, barangay || null,
      role,
      req.user.id,
    ]
  )
  db.save()

  // Clean up used code
  verificationCodes.delete(emailKey)

  // Send welcome email (no temp password since admin set it)
  let emailSent = false
  try {
    await sendWelcomeEmail({
      to: email, name: name.trim(),
      email: emailKey,
      tempPassword: password, // show them the password they were given
    })
    emailSent = true
  } catch (err) {
    console.error('Welcome email failed:', err.message)
  }

  res.status(201).json({
    message:  `Account created successfully for ${name}`,
    userId:   result.lastInsertRowid,
    emailSent,
  })
})

// ── PUT /api/users/:id ────────────────────────────────────────────────
router.put('/:id', authMiddleware, adminOnly, (req, res) => {
  const { id } = req.params
  const { name, phone, address, municipality, barangay, role, isActive } = req.body

  const user = db.get('SELECT id FROM users WHERE id = ?', [id])
  if (!user) return res.status(404).json({ error: 'User not found' })

  // Validate phone if provided
  if (phone) {
    const cleanPhone = phone.replace(/\s/g, '')
    if (!validatePHPhone(cleanPhone))
      return res.status(400).json({ error: 'Phone must be a valid Philippine number (09XXXXXXXXX, 11 digits)' })
    db.run('UPDATE users SET phone = ? WHERE id = ?', [cleanPhone, id])
  }

  if (name)         db.run('UPDATE users SET name         = ? WHERE id = ?', [name, id])
  if (address)      db.run('UPDATE users SET address      = ? WHERE id = ?', [address, id])
  if (municipality) db.run('UPDATE users SET municipality = ? WHERE id = ?', [municipality, id])
  if (barangay)     db.run('UPDATE users SET barangay     = ? WHERE id = ?', [barangay, id])
  if (role)         db.run('UPDATE users SET role         = ? WHERE id = ?', [role, id])
  if (isActive != null) db.run('UPDATE users SET is_active = ? WHERE id = ?', [isActive ? 1 : 0, id])
  db.save()

  res.json({ message: 'User updated successfully' })
})

// ── POST /api/users/:id/reset-password ───────────────────────────────
router.post('/:id/reset-password', authMiddleware, adminOnly, async (req, res) => {
  const { id } = req.params
  const user   = db.get('SELECT * FROM users WHERE id = ?', [id])
  if (!user) return res.status(404).json({ error: 'User not found' })

  // Generate a readable temp password
  const words        = ['Talong', 'Guard', 'Field', 'Agri', 'Plant']
  const word         = words[Math.floor(Math.random() * words.length)]
  const nums         = Math.floor(1000 + Math.random() * 9000)
  const chars        = crypto.randomBytes(2).toString('hex').slice(0, 3).toUpperCase()
  const tempPassword = `${word}@${nums}#${chars}`
  const hashed       = bcrypt.hashSync(tempPassword, 12)

  db.run('UPDATE users SET password = ?, must_change_password = 1 WHERE id = ?', [hashed, id])
  db.save()

  let emailSent = false
  try {
    await sendWelcomeEmail({ to: user.email, name: user.name, email: user.email, tempPassword })
    emailSent = true
  } catch (err) {
    console.error('Reset email failed:', err.message)
  }

  res.json({
    message:      emailSent ? 'Password reset and sent via email' : 'Password reset (email failed)',
    tempPassword: emailSent ? undefined : tempPassword,
    emailSent,
  })
})

// ── DELETE /api/users/:id ─────────────────────────────────────────────
router.delete('/:id', authMiddleware, adminOnly, (req, res) => {
  const { id } = req.params
  if (parseInt(id) === req.user.id)
    return res.status(400).json({ error: 'You cannot delete your own account' })

  const user = db.get('SELECT id FROM users WHERE id = ?', [id])
  if (!user) return res.status(404).json({ error: 'User not found' })

  db.run('UPDATE users SET is_active = 0 WHERE id = ?', [id])
  db.save()

  res.json({ message: 'User deactivated successfully' })
})

module.exports = router