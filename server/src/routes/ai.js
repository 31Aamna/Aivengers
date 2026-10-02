const express = require('express')
const { authenticate } = require('../middleware/auth')
const { aiLimiter } = require('../middleware/rateLimiter')
const { validate } = require('../middleware/validate')
const { analyzePostSchema } = require('../schemas/postSchemas')
const { analyzePost } = require('../services/aiService')

const { geocodeLocation } = require('../services/geocodingService')
const { fail } = require('../middleware/errorHandler')

const router = express.Router()

router.post('/analyze-post', authenticate, aiLimiter, validate(analyzePostSchema), async (req, res, next) => {
  try {
    res.json({ data: await analyzePost(req.body.text) })
  } catch (error) {
    next(error)
  }
})

router.post('/geocode', authenticate, async (req, res, next) => {
  try {
    const { location } = req.body
    if (!location || typeof location !== 'string' || !location.trim()) {
      throw fail(400, 'Location is required')
    }
    const result = await geocodeLocation(location)
    if (!result) {
      throw fail(400, `Location "${location}" could not be found on OpenStreetMap. Please enter a valid landmark or address.`)
    }
    res.json({ data: result })
  } catch (error) {
    next(error)
  }
})

module.exports = router

