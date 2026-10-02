const { generateJson } = require('../lib/gemini')
const logger = require('../utils/logger')

/**
 * Formats OpenStreetMap display_name to be readable for card/pill titles
 */
function formatReadableLocation(rawDisplayName, fallbackQuery) {
  if (!rawDisplayName) return fallbackQuery
  const parts = rawDisplayName.split(',').map((p) => p.trim()).filter(Boolean)
  if (parts.length <= 3) return rawDisplayName
  return parts.slice(0, 3).join(', ')
}

/**
 * Direct OpenStreetMap Nominatim search
 */
async function searchNominatim(query) {
  if (!query || typeof query !== 'string' || !query.trim()) return null
  const clean = query.trim()
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(clean)}&format=json&addressdetails=1&limit=1`
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Techtonix-Hackathon/1.0 (community-app)',
        'Accept-Language': 'en',
      },
    })
    if (!res.ok) return null
    const data = await res.json()
    if (Array.isArray(data) && data.length > 0) {
      const item = data[0]
      const lat = parseFloat(item.lat)
      const lng = parseFloat(item.lon)
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        return {
          latitude: lat,
          longitude: lng,
          location: formatReadableLocation(item.display_name, clean),
          full_address: item.display_name,
        }
      }
    }
  } catch (err) {
    logger.error('nominatim_geocoding_failed', { query: clean, error: err.message })
  }
  return null
}

/**
 * Main Geocoding pipeline:
 * 1. Direct Nominatim search
 * 2. Search with city/region context if needed
 * 3. Gemini AI landmark/address extraction -> Nominatim search
 */
async function geocodeLocation(userText) {
  if (!userText || typeof userText !== 'string' || !userText.trim()) return null
  const cleanInput = userText.trim()

  // 1. Direct Nominatim search
  let result = await searchNominatim(cleanInput)
  if (result) return result

  // 2. Append Mumbai/Campus context if not present
  const lower = cleanInput.toLowerCase()
  if (!lower.includes('mumbai') && !lower.includes('india')) {
    result = await searchNominatim(`${cleanInput}, Mumbai`)
    if (result) return result
  }

  // 3. Gemini AI place name extraction -> Nominatim search
  try {
    const prompt = `You are a location extraction assistant for OpenStreetMap.
Extract or refine the place name/address from the user input into a formal landmark search query.
User input: "${cleanInput}"
Return JSON only: { "search_query": "Formal Landmark Name, Area, City" }`

    const raw = await generateJson(prompt)
    let parsed = null
    try {
      parsed = JSON.parse(raw)
    } catch {
      parsed = null
    }

    if (parsed && parsed.search_query) {
      result = await searchNominatim(parsed.search_query)
      if (result) return result
    }
  } catch (err) {
    logger.error('gemini_geocoding_extraction_failed', { input: cleanInput, error: err.message })
  }

  return null
}

module.exports = { geocodeLocation, searchNominatim }
