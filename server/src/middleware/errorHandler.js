function fail(status, message) {
  const error = new Error(message)
  error.status = status
  error.expose = true
  return error
}

function errorHandler(logger) {
  return (err, req, res, next) => {
    if (res.headersSent) return next(err)

    const status = Number(err.status || err.statusCode) || 500
    const requestId = req.requestId

    logger.error('request_failed', {
      requestId,
      method: req.method,
      path: req.originalUrl,
      status,
      errorType: err.name,
      stack: err.stack,
    })

    if (status === 400) {
      return res.status(400).json({ error: 'Invalid request data', message: 'Invalid request data' })
    }
    if (status === 401) {
      return res.status(401).json({ error: 'Authentication required', message: 'Authentication required' })
    }
    if (status === 403) {
      return res.status(403).json({
        error: 'You are not allowed to perform this action',
        message: 'You are not allowed to perform this action',
      })
    }
    if (status === 404) {
      return res.status(404).json({ error: 'Not found', message: 'Not found' })
    }
    if (status === 409) {
      return res.status(409).json({ error: 'This action has already been recorded', message: 'This action has already been recorded' })
    }
    if (status === 413) {
      return res.status(413).json({ error: 'Request is too large', message: 'Request is too large' })
    }
    if (status === 429) {
      return res.status(429).json({ error: 'Too many requests', message: 'Too many requests' })
    }

    return res.status(status >= 400 && status < 600 ? status : 500).json({
      error: err.expose && status < 500 ? err.message : 'Something went wrong. Please try again.',
      message: err.expose && status < 500 ? err.message : 'Something went wrong. Please try again.',
    })
  }
}

module.exports = { errorHandler, fail }
