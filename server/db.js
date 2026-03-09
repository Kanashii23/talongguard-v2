const { Pool } = require('pg')
const bcrypt = require('bcryptjs')
require('dotenv').config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

async function run(sql, params = []) {
  // Convert SQLite ? placeholders to PostgreSQL $1, $2...
  let i = 0
  const pgSql = sql.replace(/\?/g, () => `$${++i}`)
  const result = await pool.query(pgSql, params)
  return { lastInsertRowid: result.rows[0]?.id ?? null }
}

async function get(sql, params = []) {
  let i = 0
  const pgSql = sql.replace(/\?/g, () => `$${++i}`)
  const result = await pool.query(pgSql, params)
  return result.rows[0] ?? undefined
}

async function all(sql, params = []) {
  let i = 0
  const pgSql = sql.replace(/\?/g, () => `$${++i}`)
  const result = await pool.query(pgSql, params)
  return result.rows
}

async function exec(sql) {
  await pool.query(sql)
}

async function createTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id                   SERIAL PRIMARY KEY,
      name                 TEXT    NOT NULL,
      email                TEXT    NOT NULL UNIQUE,
      password             TEXT    NOT NULL,
      phone                TEXT,
      address              TEXT,
      municipality         TEXT,
      barangay             TEXT,
      role                 TEXT    NOT NULL DEFAULT 'agriculturist',
      is_active            INTEGER NOT NULL DEFAULT 1,
      must_change_password INTEGER NOT NULL DEFAULT 0,
      created_at           TEXT    NOT NULL DEFAULT NOW()::TEXT,
      created_by           INTEGER
    )
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id         SERIAL PRIMARY KEY,
      user_id    INTEGER NOT NULL,
      token      TEXT    NOT NULL,
      expires_at TEXT    NOT NULL,
      used       INTEGER NOT NULL DEFAULT 0,
      created_at TEXT    NOT NULL DEFAULT NOW()::TEXT
    )
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS login_logs (
      id         SERIAL PRIMARY KEY,
      user_id    INTEGER,
      email      TEXT,
      success    INTEGER NOT NULL,
      ip         TEXT,
      created_at TEXT    NOT NULL DEFAULT NOW()::TEXT
    )
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS sync_state (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS scan_records (
      id           SERIAL PRIMARY KEY,
      lat          REAL    NOT NULL,
      lng          REAL    NOT NULL,
      municipality TEXT,
      scanned_at   TEXT    NOT NULL DEFAULT NOW()::TEXT,
      source       TEXT    DEFAULT 'rover',
      healthy      INTEGER DEFAULT 0,
      insect       INTEGER DEFAULT 0,
      leafspot     INTEGER DEFAULT 0,
      mosaic       INTEGER DEFAULT 0,
      wilt         INTEGER DEFAULT 0,
      is_edited    INTEGER DEFAULT 0,
      UNIQUE(lat, lng, scanned_at)
    )
  `)

  console.log('✅ Tables ready')
}

async function seedAdmin() {
  const existing = await get(`SELECT id FROM users WHERE role = $1 LIMIT 1`, ['admin'])
  if (existing) return
  const hashed = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'admin123', 12)
  await pool.query(
    `INSERT INTO users (name, email, password, role, is_active, must_change_password)
     VALUES ($1, $2, $3, 'admin', 1, 0)`,
    [
      process.env.ADMIN_NAME || 'System Administrator',
      process.env.ADMIN_EMAIL || 'admin@talonggaurd.com',
      hashed,
    ]
  )
  console.log('✅ Default admin seeded')
  console.log('   Email:   ', process.env.ADMIN_EMAIL || 'admin@talonggaurd.com')
  console.log('   Password:', process.env.ADMIN_PASSWORD || 'admin123')
}

async function init() {
  await createTables()
  await seedAdmin()
  console.log('🐘 PostgreSQL connected')
}

// No-op for compatibility (no file to save)
function save() {}

module.exports = { init, run, get, all, exec, save, pool }
