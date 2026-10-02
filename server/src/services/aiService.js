const { generateJson } = require('../lib/gemini')
const { aiOutputSchema, CATEGORIES, URGENCIES } = require('../schemas/postSchemas')
const { geocodeLocation } = require('./geocodingService')
const { fail } = require('../middleware/errorHandler')
const logger = require('../utils/logger')

async function analyzePost(text) {
  const prompt = [
    'Extract a structured community post from the user text.',
    'Return JSON only with keys: title, category, location, urgency, tags, suggested_expiry_hours.',
    'Extract and normalize a place name from the user text for location; do not generate latitude or longitude.',
    `category must be one of: ${CATEGORIES.join(' | ')}`,
    `urgency must be one of: ${URGENCIES.join(' | ')}`,
    'tags must be an array of at most 8 short lowercase keywords.',
    'suggested_expiry_hours must be an integer between 1 and 168.',
    'If no location can be inferred, return an empty string for location.',
    `User text: ${text}`,
  ].join('\n')

  let raw
  try {
    raw = await generateJson(prompt)
  } catch (error) {
    logger.error('gemini_request_failed', { errorType: error.name })
    throw fail(503, 'Something went wrong. Please try again.')
  }

  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch {
    logger.error('gemini_invalid_json', { errorType: 'SyntaxError' })
    throw fail(502, 'Something went wrong. Please try again.')
  }

  const result = aiOutputSchema.safeParse(parsed)
  if (!result.success) {
    logger.error('gemini_invalid_output', { errorType: 'ValidationError' })
    throw fail(502, 'Something went wrong. Please try again.')
  }

  // Geocode extracted location string to real lat/lng via OpenStreetMap Nominatim
  let latitude = null
  let longitude = null
  let locationStr = result.data.location

  if (locationStr && locationStr.trim()) {
    const geocoded = await geocodeLocation(locationStr)
    if (geocoded) {
      latitude = geocoded.latitude
      longitude = geocoded.longitude
      locationStr = geocoded.location
    }
  }

  const hours = result.data.suggested_expiry_hours
  return {
    title: result.data.title,
    category: result.data.category,
    location: locationStr,
    latitude,
    longitude,
    urgency: result.data.urgency,
    tags: result.data.tags,
    suggested_expiry_hours: hours,
    expiry: hours >= 96 ? '5 days' : hours <= 6 ? '4 hours' : hours <= 24 ? '24 hours' : '48 hours',
  }
}

module.exports = { analyzePost }
