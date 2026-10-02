import { supabase } from './supabase.js'

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

async function accessToken() {
  if (!supabase) return null
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token || null
}

function unwrap(payload) {
  const data = payload?.data ?? payload
  if (data && Array.isArray(data.tags)) {
    return {
      ...data,
      tags: data.tags.join(', '),
      urgency: data.urgency === 'Normal' ? 'Medium' : data.urgency,
    }
  }
  if (data?.urgency === 'Normal') return { ...data, urgency: 'Medium' }
  return data
}

async function request(path, options = {}) {
  if (!API_URL) throw new Error('API is not configured for this frontend preview.')
  const token = await accessToken()
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) }
  if (token) headers.Authorization = `Bearer ${token}`
  const response = await fetch(`${API_URL}${path}`, { ...options, headers })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload.error || payload.message || 'The request could not be completed.')
  return unwrap(payload)
}

export const api = {
  health: () => request('/api/health'),
  posts: {
    list: (params = {}) => request(`/api/posts?${new URLSearchParams(params)}`),
    get: (id) => request(`/api/posts/${id}`),
    create: (post) => request('/api/posts', { method: 'POST', body: JSON.stringify(post) }),
    update: (id, post) => request(`/api/posts/${id}`, { method: 'PUT', body: JSON.stringify(post) }),
    remove: (id) => request(`/api/posts/${id}`, { method: 'DELETE' }),
    resolve: (id) => request(`/api/posts/${id}/resolve`, { method: 'PATCH', body: JSON.stringify({}) }),
    vote: (id, voteType) => request(`/api/posts/${id}/vote`, { method: 'POST', body: JSON.stringify({ vote_type: voteType }) }),
    validity: (id, status) => request(`/api/posts/${id}/validity`, { method: 'POST', body: JSON.stringify({ status }) }),
    report: (id, reason) => request(`/api/posts/${id}/report`, { method: 'POST', body: JSON.stringify({ reason }) }),
  },
  ai: {
    analyzePost: (naturalLanguage) => request('/api/ai/analyze-post', { method: 'POST', body: JSON.stringify({ text: naturalLanguage, natural_language: naturalLanguage }) }),
    geocode: (location) => request('/api/ai/geocode', { method: 'POST', body: JSON.stringify({ location }) }),
  },
}
