const { z } = require('zod')

const voteSchema = z.object({
  vote_type: z.enum(['up', 'down']),
})

const validitySchema = z.object({
  status: z.string().trim().transform((value) => {
    if (value === 'valid') return 'still_valid'
    return value
  }).pipe(z.enum(['still_valid', 'outdated'])),
})

const reportSchema = z.object({
  reason: z.string().trim().min(3).max(500),
})

module.exports = { voteSchema, validitySchema, reportSchema }
