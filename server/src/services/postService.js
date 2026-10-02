const { clientFor } = require('../lib/supabase')
const { fail } = require('../middleware/errorHandler')
const { normalizeCategory } = require('../schemas/postSchemas')
const logger = require('../utils/logger')

const CATEGORY_META = {
  'Internships & Scholarships': { key: 'internships', accent: 'violet' },
  'Lost & Found': { key: 'lost', accent: 'blue' },
  'Local Issues & Emergencies': { key: 'issues', accent: 'coral' },
  'Events & Announcements': { key: 'events', accent: 'amber' },
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function hasValidCoordinates(latitude, longitude) {
  if (latitude == null || latitude === '' || longitude == null || longitude === '') return false
  const lat = Number(latitude)
  const lng = Number(longitude)
  return Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
}

function derivedStatus(post) {
  if (post.status === 'resolved') return 'resolved'
  if (post.expires_at && new Date(post.expires_at) < new Date()) return 'expired'
  return post.status || 'active'
}

function relativeTime(iso) {
  const then = new Date(iso).getTime()
  const delta = Math.max(0, Date.now() - then)
  const minutes = Math.floor(delta / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hr ago`
  return `${Math.floor(hours / 24)} days ago`
}

function expiryLabel(post, status) {
  if (status === 'resolved') return 'Resolved'
  if (status === 'expired') return 'Expired'
  if (!post.expires_at) return 'No expiry'
  const remaining = new Date(post.expires_at).getTime() - Date.now()
  if (remaining <= 0) return 'Expired'
  const hours = Math.round(remaining / 3600000)
  if (hours < 24) return `Expires in ${hours} hour${hours === 1 ? '' : 's'}`
  const days = Math.round(hours / 24)
  return `Expires in ${days} day${days === 1 ? '' : 's'}`
}

function present(post, extras = {}) {
  const status = derivedStatus(post)
  const meta = CATEGORY_META[post.category] || { key: 'events', accent: 'amber' }
  const valid = extras.valid || 0
  const outdated = extras.outdated || 0
  const reports = extras.reports || 0
  const upvotes = extras.upvotes || 0
  const baseTrust = extras.trustScore ?? 50
  const trust = clamp(baseTrust + valid * 2 - outdated * 3 - reports * 5, 0, 100)
  const anonymous = Boolean(post.is_anonymous)
  const displayStatus = status === 'active' ? 'Active' : status.charAt(0).toUpperCase() + status.slice(1)
  const urgency = post.urgency === 'Normal' ? 'Medium' : post.urgency

  const isAuthor = Boolean(extras.requestingUserId && extras.requestingUserId === post.author_id)
  const exposedAuthorId = !anonymous || isAuthor ? post.author_id : null

  return {
    id: post.id,
    author_id: exposedAuthorId,
    title: post.title,
    description: post.description,
    category: post.category,
    categoryKey: meta.key,
    location: post.location,
    latitude: post.latitude,
    longitude: post.longitude,
    urgency,
    tags: post.tags || [],
    anonymous,
    is_anonymous: anonymous,
    status: displayStatus,
    created_at: post.created_at,
    expires_at: post.expires_at,
    resolved_at: post.resolved_at,
    resolution_note: post.resolution_note,
    time: relativeTime(post.created_at),
    createdTime: new Date(post.created_at).toLocaleString(),
    expiry: expiryLabel(post, status),
    trust,
    verified: trust >= 80,
    author: anonymous ? 'Posted anonymously' : extras.authorName || 'Community member',
    initials: anonymous ? 'AN' : (extras.authorName || 'CM').slice(0, 2).toUpperCase(),
    valid,
    outdated,
    upvotes,
    reports_count: reports,
    accent: meta.accent,
  }
}

async function enrich(client, posts, requestingUserId = null) {
  if (!posts.length) return []
  const ids = posts.map((post) => post.id)
  const authorIds = [...new Set(posts.map((post) => post.author_id))]

  const [profiles, votes, validity, reports] = await Promise.all([
    client.from('profiles').select('id, name, trust_score').in('id', authorIds),
    client.from('votes').select('post_id, vote_type').in('post_id', ids),
    client.from('validity_checks').select('post_id, status').in('post_id', ids),
    client.from('reports').select('post_id').in('post_id', ids),
  ])

  const profileMap = new Map((profiles.data || []).map((row) => [row.id, row]))
  const validMap = new Map()
  const outdatedMap = new Map()
  const upvoteMap = new Map()
  const reportMap = new Map()

  for (const row of votes.data || []) {
    if (row.vote_type === 'up') upvoteMap.set(row.post_id, (upvoteMap.get(row.post_id) || 0) + 1)
  }
  for (const row of validity.data || []) {
    if (row.status === 'still_valid') validMap.set(row.post_id, (validMap.get(row.post_id) || 0) + 1)
    if (row.status === 'outdated') outdatedMap.set(row.post_id, (outdatedMap.get(row.post_id) || 0) + 1)
  }
  for (const row of reports.data || []) {
    reportMap.set(row.post_id, (reportMap.get(row.post_id) || 0) + 1)
  }

  return posts.map((post) => {
    const profile = profileMap.get(post.author_id)
    const reportsCount = reportMap.get(post.id) || 0
    return present(post, {
      authorName: profile?.name,
      trustScore: profile?.trust_score,
      valid: validMap.get(post.id) || 0,
      outdated: outdatedMap.get(post.id) || 0,
      upvotes: upvoteMap.get(post.id) || 0,
      reports: reportsCount,
      requestingUserId,
    })
  })
}

function handleDbError(error) {
  if (!error) return
  logger.error('database_error', { errorType: error.code || error.name })
  if (error.code === '23505') throw fail(409, 'This action has already been recorded')
  throw fail(500, 'Something went wrong. Please try again.')
}

async function listPosts(req) {
  const client = clientFor(req)
  const { category, search } = req.query
  let query = client.from('posts').select('*').order('created_at', { ascending: false }).limit(100)
  if (category && category !== 'all') query = query.eq('category', normalizeCategory(category) || category)
  if (search) {
    const term = `%${search.replace(/[%_,]/g, '')}%`
    query = query.or(`title.ilike.${term},description.ilike.${term},location.ilike.${term}`)
  }
  const { data, error } = await query
  handleDbError(error)
  return enrich(client, data || [], req.user?.id)
}

async function getPost(req, id) {
  const client = clientFor(req)
  const { data, error } = await client.from('posts').select('*').eq('id', id).maybeSingle()
  handleDbError(error)
  if (!data) throw fail(404, 'Not found')
  const [presented] = await enrich(client, [data], req.user?.id)
  return presented
}

async function ensureProfile(client, user) {
  const { data } = await client.from('profiles').select('id').eq('id', user.id).maybeSingle()
  if (data) return
  const { error } = await client.from('profiles').insert({
    id: user.id,
    name: (user.email || 'member').split('@')[0],
    email: user.email,
    role: 'student',
    community_type: 'campus',
    trust_score: 50,
  })
  if (error && error.code !== '23505') handleDbError(error)
}

const { geocodeLocation } = require('./geocodingService')

async function createPost(req, payload) {
  const client = clientFor(req)
  await ensureProfile(client, req.user)

  if (!hasValidCoordinates(payload.latitude, payload.longitude) && payload.location && payload.location.trim()) {
    const geocoded = await geocodeLocation(payload.location)
    if (geocoded) {
      payload.latitude = geocoded.latitude
      payload.longitude = geocoded.longitude
      payload.location = geocoded.location
    }
  }

  if (!hasValidCoordinates(payload.latitude, payload.longitude)) {
    payload.latitude = null
    payload.longitude = null
  }

  const { data, error } = await client.from('posts').insert({
    ...payload,
    author_id: req.user.id,
    status: 'active',
  }).select('*').single()
  handleDbError(error)
  const [presented] = await enrich(client, [data], req.user.id)
  return presented
}

async function requireOwnPost(client, id, userId) {
  const { data, error } = await client.from('posts').select('*').eq('id', id).maybeSingle()
  handleDbError(error)
  if (!data) throw fail(404, 'Not found')
  if (data.author_id !== userId) throw fail(403, 'You are not allowed to perform this action')
  return data
}

async function updatePost(req, id, payload) {
  const client = clientFor(req)
  await requireOwnPost(client, id, req.user.id)

  if (!hasValidCoordinates(payload.latitude, payload.longitude) && payload.location && payload.location.trim()) {
    const geocoded = await geocodeLocation(payload.location)
    if (geocoded) {
      payload.latitude = geocoded.latitude
      payload.longitude = geocoded.longitude
      payload.location = geocoded.location
    } else {
      payload.latitude = null
      payload.longitude = null
    }
  } else if (('latitude' in payload || 'longitude' in payload) && !hasValidCoordinates(payload.latitude, payload.longitude)) {
    payload.latitude = null
    payload.longitude = null
  }

  const { data, error } = await client.from('posts').update(payload).eq('id', id).eq('author_id', req.user.id).select('*').maybeSingle()
  handleDbError(error)
  if (!data) throw fail(403, 'You are not allowed to perform this action')
  const [presented] = await enrich(client, [data], req.user.id)
  return presented
}

async function deletePost(req, id) {
  const client = clientFor(req)
  await requireOwnPost(client, id, req.user.id)
  const { error } = await client.from('posts').delete().eq('id', id).eq('author_id', req.user.id)
  handleDbError(error)
  return { success: true }
}

async function resolvePost(req, id, resolutionNote) {
  const client = clientFor(req)
  await requireOwnPost(client, id, req.user.id)
  const { data, error } = await client.from('posts').update({
    status: 'resolved',
    resolved_at: new Date().toISOString(),
    resolution_note: resolutionNote || '',
  }).eq('id', id).eq('author_id', req.user.id).select('*').maybeSingle()
  handleDbError(error)
  if (!data) throw fail(403, 'You are not allowed to perform this action')
  const [presented] = await enrich(client, [data], req.user.id)
  return presented
}

async function vote(req, id, voteType) {
  const client = clientFor(req)
  await getPost(req, id)
  const { error } = await client.from('votes').upsert({
    post_id: id,
    user_id: req.user.id,
    vote_type: voteType,
  }, { onConflict: 'post_id,user_id' })
  handleDbError(error)
  return getPost(req, id)
}

async function validity(req, id, status) {
  const client = clientFor(req)
  await getPost(req, id)
  const { error } = await client.from('validity_checks').upsert({
    post_id: id,
    user_id: req.user.id,
    status,
  }, { onConflict: 'post_id,user_id' })
  handleDbError(error)
  return getPost(req, id)
}

async function report(req, id, reason) {
  const client = clientFor(req)
  await getPost(req, id)
  const { error } = await client.from('reports').insert({
    post_id: id,
    user_id: req.user.id,
    reason,
  })
  handleDbError(error)
  return getPost(req, id)
}

module.exports = {
  listPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  resolvePost,
  vote,
  validity,
  report,
}
