const { GoogleGenAI } = require('@google/genai')

let client

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    const error = new Error('Gemini is not configured')
    error.status = 503
    throw error
  }
  if (!client) client = new GoogleGenAI({ apiKey })
  return client
}

async function generateJson(prompt) {
  const ai = getGeminiClient()
  const response = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      temperature: 0.2,
    },
  })
  return response.text
}

module.exports = { generateJson }
