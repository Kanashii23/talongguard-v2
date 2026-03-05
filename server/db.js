const initSqlJs = require('sql.js')
const bcrypt    = require('bcryptjs')
const fs        = require('fs')
const path      = require('path')
require('dotenv').config()

const DB_PATH = path.join(__dirname, 'talonggaurd.db')

let db  = null
let SQL = null

function save() {
  const data = db.export()
  fs.writeFileSync(DB_PATH, Buffer.from(data))
}

function startAutosave() {
  setInterval(save, 10000)
  process.on('exit',    save)
  process.on('SIGINT',  () => { save(); process.exit() })
  process.on('SIGTERM', () => { save(); process.exit() })
}

function run(sql, params = []) {
  db.run(sql, params)
  const rows = db.exec('SELECT last_insert_rowid() as id')
  const id   = rows[0]?.values[0]?.[0] ?? null
  return { lastInsertRowid: id }
}

function get(sql, params = []) {
  const stmt = db.prepare(sql)
  stmt.bind(params)
  if (stmt.step()) {
    const row = stmt.getAsObject()
    stmt.free()
    return row
  }
  stmt.free()
  return undefined
}

function all(sql, params = []) {
  const stmt = db.prepare(sql)
  stmt.bind(params)
  const rows = []
  while (stmt.step()) rows.push(stmt.getAsObject())
  stmt.free()
  return rows
}

function exec(sql) { db.run(sql) }

function createTables() {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id                   INTEGER PRIMARY KEY AUTOINCREMENT,
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
    created_at           TEXT    NOT NULL DEFAULT (datetime('now')),
    created_by           INTEGER
  )`)

  db.run(`CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL,
    token      TEXT    NOT NULL,
    expires_at TEXT    NOT NULL,
    used       INTEGER NOT NULL DEFAULT 0,
    created_at TEXT    NOT NULL DEFAULT (datetime('now'))
  )`)

  db.run(`CREATE TABLE IF NOT EXISTS login_logs (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER,
    email      TEXT,
    success    INTEGER NOT NULL,
    ip         TEXT,
    created_at TEXT    NOT NULL DEFAULT (datetime('now'))
  )`)

  db.run(`CREATE TABLE IF NOT EXISTS sync_state (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  )`)

  db.run(`CREATE TABLE IF NOT EXISTS scan_records (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    lat          REAL    NOT NULL,
    lng          REAL    NOT NULL,
    municipality TEXT,
    scanned_at   TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
    source       TEXT    DEFAULT 'rover',
    healthy      INTEGER DEFAULT 0,
    insect       INTEGER DEFAULT 0,
    leafspot     INTEGER DEFAULT 0,
    mosaic       INTEGER DEFAULT 0,
    wilt         INTEGER DEFAULT 0,
    is_edited    INTEGER DEFAULT 0,
    UNIQUE(lat, lng, scanned_at)
  )`)
}

function seedAdmin() {
  const existing = get('SELECT id FROM users WHERE role = ? LIMIT 1', ['admin'])
  if (existing) return
  const hashed = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'admin123', 12)
  run(
    `INSERT INTO users (name, email, password, role, is_active, must_change_password) VALUES (?, ?, ?, 'admin', 1, 0)`,
    [
      process.env.ADMIN_NAME  || 'System Administrator',
      process.env.ADMIN_EMAIL || 'admin@talonggaurd.com',
      hashed,
    ]
  )
  save()
  console.log('✅ Default admin seeded')
  console.log('   Email:   ', process.env.ADMIN_EMAIL    || 'admin@talonggaurd.com')
  console.log('   Password:', process.env.ADMIN_PASSWORD || 'admin123')
}

async function init() {
  SQL = await initSqlJs()
  if (fs.existsSync(DB_PATH)) {
    db = new SQL.Database(fs.readFileSync(DB_PATH))
    console.log('📂 Loaded existing database')
  } else {
    db = new SQL.Database()
    console.log('🆕 Created new database')
  }
  createTables()
  seedAdmin()
  startAutosave()
}

module.exports = { init, run, get, all, exec, save }