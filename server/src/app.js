const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const crypto = require('crypto')
const logger = require('./utils/logger')
const { errorHandler } = require('./middleware/errorHandler')
const { authIpLimiter, authAccountLimiter, authBackoff } = require('./middleware/rateLimiter')
const postRoutes = require('./routes/posts')
const interactionRoutes = require('./routes/interactions')
const aiRoutes = require('./routes/ai')

function allowedOrigins() {
  const configured = process.env.FRONTEND_URL || 'http://localhost:5173'
  const origins = configured.split(',').map((value) => value.trim()).filter(Boolean)
  if (process.env.NODE_ENV !== 'production') {
    for (const origin of ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173', 'http://127.0.0.1:3000']) {
      if (!origins.includes(origin)) origins.push(origin)
    }
  }
  return origins
}

function createApp() {
  const app = express()
  // File uploads are intentionally out of MVP scope.
  app.set('trust proxy', 1)
  app.disable('x-powered-by')
  app.use(helmet())
  app.use(cors({
    origin(origin, callback) {
      const allowed = allowedOrigins()
      if (!origin || allowed.includes(origin)) return callback(null, true)
      return callback(new Error('Not allowed by CORS'))
    },
    credentials: true,
  }))
  app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || '100kb' }))

  app.use((req, res, next) => {
    req.requestId = crypto.randomUUID()
    res.setHeader('x-request-id', req.requestId)
    if (process.env.NODE_ENV === 'production' && req.headers['x-forwarded-proto'] && req.headers['x-forwarded-proto'] !== 'https') {
      res.setHeader('strict-transport-security', 'max-age=15552000; includeSubDomains')
    }
    logger.info('request', { requestId: req.requestId, method: req.method, path: req.originalUrl })
    next()
  })

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', data: { status: 'ok' } })
  })

  app.use('/api/auth', authIpLimiter, authAccountLimiter, authBackoff)
  app.use('/api/posts', postRoutes)
  app.use('/api/posts/:id', interactionRoutes)
  app.use('/api/ai', aiRoutes)

  app.use((req, res) => {
    res.status(404).json({ error: 'Not found', message: 'Not found' })
  })

  app.use((err, req, res, next) => {
    if (err.type === 'entity.too.large') {
      err.status = 413
    }
    if (err.message === 'Not allowed by CORS') {
      err.status = 403
      err.expose = true
      err.message = 'You are not allowed to perform this action'
    }
    return errorHandler(logger)(err, req, res, next)
  })

  return app
}

module.exports = { createApp }
