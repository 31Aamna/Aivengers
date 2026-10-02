const { z } = require('zod')
const { fail } = require('./errorHandler')

function validate(schema, source = 'body') {
  return (req, _res, next) => {
    const parsed = schema.safeParse(source === 'body' ? req.body || {} : req[source])
    if (!parsed.success) return next(fail(400, 'Invalid request data'))
    req[source] = parsed.data
    next()
  }
}

const uuidParam = z.object({
  id: z.string().uuid(),
})

module.exports = { validate, uuidParam }
