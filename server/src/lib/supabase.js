const { createClient } = require('@supabase/supabase-js')

function requireEnv(name) {
  const value = process.env[name]
  if (!value) {
    const error = new Error(`Missing required server configuration`)
    error.status = 500
    throw error
  }
  return value
}

function createAnonClient() {
  return createClient(requireEnv('SUPABASE_URL'), requireEnv('SUPABASE_PUBLISHABLE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

function createUserClient(accessToken) {
  return createClient(requireEnv('SUPABASE_URL'), requireEnv('SUPABASE_PUBLISHABLE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
    global: accessToken ? { headers: { Authorization: `Bearer ${accessToken}` } } : {},
  })
}

function clientFor(req) {
  return req.accessToken ? createUserClient(req.accessToken) : createAnonClient()
}

module.exports = {
  createAnonClient,
  createUserClient,
  clientFor,
}
