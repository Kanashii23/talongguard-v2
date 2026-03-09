require('dotenv').config()
const express = require('express')
const cors = require('cors')

const { init } = require('./db')

const app = express()
const PORT = process.env.PORT || 3001

// Allow ALL localhost origins (any port) during development
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true)
      if (origin.match(/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/)) {
        return callback(null, true)
      }
      if (origin === 'https://talongguard-v2-oakf.vercel.app') {
        return callback(null, true)
      }
      callback(new Error('Not allowed by CORS'))
    },
    credentials: true,
  })
)

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Health check — test this first: http://localhost:3001/api/health
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: '🍆 TalongGuard API is running!',
    time: new Date().toISOString(),
  })
})

init()
  .then(() => {
    const { startSync } = require('./Sheetssync')
    const authRoutes = require('./routes/auth')
    const usersRoutes = require('./routes/users')
    const scansRoutes = require('./routes/scans')

    app.use('/api/auth', authRoutes)
    app.use('/api/users', usersRoutes)
    app.use('/api/scans', scansRoutes)

    // Start Google Sheets sync (rover data)
    startSync()

    // 404 handler
    app.use((req, res) =>
      res.status(404).json({ error: `Route ${req.method} ${req.path} not found` })
    )

    // Error handler
    app.use((err, req, res, next) => {
      console.error('Server error:', err)
      res.status(500).json({ error: 'Internal server error' })
    })

    app.listen(PORT, () => {
      console.log('')
      console.log('🍆 TalongGuard API Server')
      console.log(`   Running at:  http://localhost:${PORT}`)
      console.log(`   Health test: http://localhost:${PORT}/api/health`)
      console.log('')
    })
  })
  .catch((err) => {
    console.error('❌ Failed to initialize database:', err)
    process.exit(1)
  })
