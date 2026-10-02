const express = require('express')
const { authenticate } = require('../middleware/auth')
const { userLimiter } = require('../middleware/rateLimiter')
const { validate, uuidParam } = require('../middleware/validate')
const { voteSchema, validitySchema, reportSchema } = require('../schemas/interactionSchemas')
const posts = require('../services/postService')

const router = express.Router({ mergeParams: true })

router.post('/vote', authenticate, userLimiter, validate(uuidParam, 'params'), validate(voteSchema), async (req, res, next) => {
  try {
    res.json({ data: await posts.vote(req, req.params.id, req.body.vote_type) })
  } catch (error) {
    next(error)
  }
})

router.post('/validity', authenticate, userLimiter, validate(uuidParam, 'params'), validate(validitySchema), async (req, res, next) => {
  try {
    res.json({ data: await posts.validity(req, req.params.id, req.body.status) })
  } catch (error) {
    next(error)
  }
})

router.post('/report', authenticate, userLimiter, validate(uuidParam, 'params'), validate(reportSchema), async (req, res, next) => {
  try {
    res.json({ data: await posts.report(req, req.params.id, req.body.reason) })
  } catch (error) {
    next(error)
  }
})

module.exports = router
