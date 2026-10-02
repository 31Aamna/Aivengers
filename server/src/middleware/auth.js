const { createAnonClient } = require('../lib/supabase')
const { fail } = require('./errorHandler')
const { noteAuthFailure, authBackoffDelay } = require('./rateLimiter')

function parseBearer(header) {
  if (!header || typeof header !== 'string') return null
  const [scheme, token] = header.split(' ')
  if (scheme !== 'Bearer' || !token) return null
  return token
}

function attachUser(req, user, token) {
  req.accessToken = token
  req.user = { id: user.id, email: user.email }
}

async function authenticate(req, _res, next) {
  try {
    const token = parseBearer(req.headers.authorization)
    if (!token) return next(fail(401, 'Authentication required'))

    const supabase = createAnonClient()
    const { data, error } = await supabase.auth.getUser(token)
    if (error || !data.user) {
      noteAuthFailure(req)
      await authBackoffDelay(req)
      return next(fail(401, 'Authentication required'))
    }

    attachUser(req, data.user, token)
    next()
  } catch (error) {
    next(error)
  }
}

async function optionalAuth(req, _res, next) {
  try {
    const token = parseBearer(req.headers.authorization)
    if (!token) return next()
    const supabase = createAnonClient()
    const { data, error } = await supabase.auth.getUser(token)
    if (!error && data.user) attachUser(req, data.user, token)
    next()
  } catch (error) {
    next(error)
  }
}

module.exports = { authenticate, optionalAuth }
