const rateLimit = require('express-rate-limit')

const windowMs = () => Number(process.env.RATE_LIMIT_WINDOW_MS || 900000)
const backoffBaseMs = () => Number(process.env.RATE_LIMIT_BACKOFF_BASE_MS || 1000)

const authFailures = new Map()

function envMax(name, fallback) {
  const value = Number(process.env[name])
  return Number.isFinite(value) && value > 0 ? value : fallback
}

function clientIp(req) {
  return req.ip || req.socket?.remoteAddress || 'unknown'
}

function tooMany(_req, res) {
  res.status(429).json({ error: 'Too many requests', message: 'Too many requests' })
}

function makeLimiter(max, prefix) {
  return rateLimit({
    windowMs: windowMs(),
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: tooMany,
    keyGenerator: (req) => `${prefix}:${req.user?.id || clientIp(req)}`,
  })
}

const publicLimiter = makeLimiter(envMax('PUBLIC_RATE_LIMIT_MAX', 100), 'public')
const userLimiter = makeLimiter(envMax('USER_RATE_LIMIT_MAX', 60), 'user')
const aiLimiter = makeLimiter(envMax('AI_RATE_LIMIT_MAX', 10), 'ai')

const authIpLimiter = rateLimit({
  windowMs: windowMs(),
  max: envMax('AUTH_RATE_LIMIT_MAX', 10),
  standardHeaders: true,
  legacyHeaders: false,
  handler: tooMany,
  keyGenerator: (req) => `auth-ip:${clientIp(req)}`,
})

const authAccountLimiter = rateLimit({
  windowMs: windowMs(),
  max: envMax('AUTH_ACCOUNT_RATE_LIMIT_MAX', 5),
  standardHeaders: true,
  legacyHeaders: false,
  handler: tooMany,
  keyGenerator: (req) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : ''
    return email ? `auth-account:${email}` : `auth-account-ip:${clientIp(req)}`
  },
})

function failureKey(req) {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : ''
  return email ? `account:${email}` : `ip:${clientIp(req)}`
}

function noteAuthFailure(req) {
  const key = failureKey(req)
  const current = authFailures.get(key) || { count: 0, updatedAt: Date.now() }
  current.count += 1
  current.updatedAt = Date.now()
  authFailures.set(key, current)
}

function authBackoffDelay(req) {
  const key = failureKey(req)
  const current = authFailures.get(key)
  if (!current) return Promise.resolve()
  const delay = Math.min(backoffBaseMs() * 2 ** Math.max(0, current.count - 1), 8000)
  return new Promise((resolve) => setTimeout(resolve, delay))
}

function authBackoff(req, _res, next) {
  authBackoffDelay(req).then(() => next()).catch(next)
}

module.exports = {
  publicLimiter,
  userLimiter,
  aiLimiter,
  authIpLimiter,
  authAccountLimiter,
  authBackoff,
  noteAuthFailure,
  authBackoffDelay,
}
