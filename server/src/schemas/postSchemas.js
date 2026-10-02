const { z } = require('zod')

const CATEGORIES = [
  'Internships & Scholarships',
  'Lost & Found',
  'Local Issues & Emergencies',
  'Events & Announcements',
]

const CATEGORY_KEYS = {
  internships: 'Internships & Scholarships',
  lost: 'Lost & Found',
  issues: 'Local Issues & Emergencies',
  events: 'Events & Announcements',
}

const URGENCIES = ['Low', 'Normal', 'High', 'Critical']

function normalizeCategory(value) {
  if (!value) return value
  return CATEGORY_KEYS[value] || value
}

function normalizeUrgency(value) {
  if (value === 'Medium') return 'Normal'
  return value
}

function parseExpiry(value) {
  if (value == null || value === '') return undefined
  if (value instanceof Date) return value.toISOString()
  const raw = String(value).trim()
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    const date = new Date(raw)
    if (Number.isNaN(date.getTime())) return undefined
    return date.toISOString()
  }
  const hoursMatch = raw.match(/(\d+)\s*hours?/i)
  if (hoursMatch) return new Date(Date.now() + Number(hoursMatch[1]) * 3600000).toISOString()
  const daysMatch = raw.match(/(\d+)\s*days?/i)
  if (daysMatch) return new Date(Date.now() + Number(daysMatch[1]) * 86400000).toISOString()
  return undefined
}

function normalizeTags(value) {
  if (Array.isArray(value)) return value
  if (typeof value === 'string') {
    return value.split(',').map((tag) => tag.trim()).filter(Boolean)
  }
  return []
}

const optionalCoord = z.preprocess(
  (value) => (value === '' || value === null || value === undefined ? undefined : Number(value)),
  z.number().gte(-90).lte(90).optional(),
)

const optionalLng = z.preprocess(
  (value) => (value === '' || value === null || value === undefined ? undefined : Number(value)),
  z.number().gte(-180).lte(180).optional(),
)

const tagSchema = z.string().trim().min(1).max(32)

const postWriteSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(12).max(5000),
  category: z.string().trim().transform(normalizeCategory).pipe(z.enum(CATEGORIES)),
  location: z.string().trim().min(2).max(200),
  latitude: optionalCoord,
  longitude: optionalLng,
  urgency: z.string().trim().transform(normalizeUrgency).pipe(z.enum(URGENCIES)),
  tags: z.preprocess(normalizeTags, z.array(tagSchema).max(8)).optional().default([]),
  is_anonymous: z.boolean().optional(),
  anonymous: z.boolean().optional(),
  expires_at: z.string().datetime().optional().nullable(),
  expiry: z.string().max(40).optional(),
  resolution_note: z.string().trim().max(1000).optional(),
}).transform((value) => ({
  title: value.title,
  description: value.description,
  category: value.category,
  location: value.location,
  latitude: value.latitude ?? null,
  longitude: value.longitude ?? null,
  urgency: value.urgency,
  tags: value.tags,
  is_anonymous: Boolean(value.is_anonymous ?? value.anonymous),
  expires_at: value.expires_at || parseExpiry(value.expiry) || null,
}))

const createPostSchema = postWriteSchema

const updatePostSchema = z.object({
  title: z.string().trim().min(3).max(120).optional(),
  description: z.string().trim().min(12).max(5000).optional(),
  category: z.string().trim().transform(normalizeCategory).pipe(z.enum(CATEGORIES)).optional(),
  location: z.string().trim().min(2).max(200).optional(),
  latitude: optionalCoord,
  longitude: optionalLng,
  urgency: z.string().trim().transform(normalizeUrgency).pipe(z.enum(URGENCIES)).optional(),
  tags: z.preprocess((value) => (value === undefined ? undefined : normalizeTags(value)), z.array(tagSchema).max(8).optional()),
  is_anonymous: z.boolean().optional(),
  anonymous: z.boolean().optional(),
  expires_at: z.string().datetime().optional().nullable(),
  expiry: z.string().max(40).optional(),
}).transform((value) => {
  const next = {}
  for (const key of ['title', 'description', 'category', 'location', 'latitude', 'longitude', 'urgency', 'tags', 'expires_at']) {
    if (value[key] !== undefined) next[key] = value[key]
  }
  if (value.is_anonymous !== undefined || value.anonymous !== undefined) {
    next.is_anonymous = Boolean(value.is_anonymous ?? value.anonymous)
  }
  if (!next.expires_at && value.expiry) next.expires_at = parseExpiry(value.expiry)
  return next
})

const resolvePostSchema = z.object({
  resolution_note: z.string().trim().max(1000).optional().default(''),
})

const listPostsQuerySchema = z.object({
  category: z.string().trim().max(80).optional(),
  search: z.string().trim().max(80).optional(),
}).transform((value) => ({
  category: value.category ? normalizeCategory(value.category) : undefined,
  search: value.search || undefined,
})).refine((value) => !value.category || ['Internships & Scholarships', 'Lost & Found', 'Local Issues & Emergencies', 'Events & Announcements'].includes(value.category))

const analyzePostSchema = z.object({
  text: z.string().trim().min(12).max(4000).optional(),
  natural_language: z.string().trim().min(12).max(4000).optional(),
}).refine((value) => value.text || value.natural_language, { message: 'text required' })
  .transform((value) => ({ text: value.text || value.natural_language }))

const aiOutputSchema = z.object({
  title: z.string().trim().min(3).max(120),
  category: z.enum(CATEGORIES),
  location: z.string().trim().max(200).optional().default(''),
  urgency: z.enum(URGENCIES),
  tags: z.array(tagSchema).max(8),
  suggested_expiry_hours: z.coerce.number().int().min(1).max(168),
})

module.exports = {
  CATEGORIES,
  URGENCIES,
  createPostSchema,
  updatePostSchema,
  resolvePostSchema,
  listPostsQuerySchema,
  analyzePostSchema,
  aiOutputSchema,
  normalizeCategory,
}
