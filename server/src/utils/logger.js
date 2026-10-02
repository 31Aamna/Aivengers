const SENSITIVE = /authorization|cookie|token|password|secret|api[_-]?key|service[_-]?role|gemini/i

function redact(value) {
  if (value == null) return value
  if (typeof value === 'string') {
    if (value.length > 24 && SENSITIVE.test(value)) return '[redacted]'
    return value
  }
  if (Array.isArray(value)) return value.map(redact)
  if (typeof value === 'object') {
    const out = {}
    for (const [key, nested] of Object.entries(value)) {
      out[key] = SENSITIVE.test(key) ? '[redacted]' : redact(nested)
    }
    return out
  }
  return value
}

function log(level, message, meta = {}) {
  const line = {
    level,
    time: new Date().toISOString(),
    message,
    ...redact(meta),
  }
  const serialized = JSON.stringify(line)
  if (level === 'error') console.error(serialized)
  else console.log(serialized)
}

module.exports = {
  info: (message, meta) => log('info', message, meta),
  warn: (message, meta) => log('warn', message, meta),
  error: (message, meta) => log('error', message, meta),
}
