import { useState } from 'react'
import { ArrowLeft, Check, Eye, Lock, Plus, Send, Shield, Sparkles } from 'lucide-react'
import { Link, useNavigate, useOutletContext } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../lib/api.js'
import { categoryConfig } from '../mockData.js'
import { validatePost } from '../lib/validation.js'
import PostForm from '../components/PostForm.jsx'
import AIAnalysis from '../components/AIAnalysis.jsx'
import PostPreview from '../components/PostPreview.jsx'
import Button from '../components/Button.jsx'
export default function CreatePost() {
  const { user } = useAuth()
  const { onPublish, notify } = useOutletContext()
  const navigate = useNavigate()
  const [rawText, setRawText] = useState('')
  const [status, setStatus] = useState('idle')
  const [fields, setFields] = useState({
    title: '',
    category: '',
    location: '',
    latitude: null,
    longitude: null,
    urgency: '',
    tags: '',
    expiry: '48 hours',
  })
  const [errors, setErrors] = useState({})
  const [anonymous, setAnonymous] = useState(false)
  const [preview, setPreview] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [locating, setLocating] = useState(false)
  const [locationError, setLocationError] = useState('')

  if (!user) {
    return (
      <section className="auth-gate-page">
        <div className="auth-gate-card">
          <span className="auth-icon"><Shield size={19} /></span>
          <div className="eyebrow eyebrow--dark"><Lock size={13} /> A logged-in action</div>
          <h1>Share a signal with your community.</h1>
          <p>Creating a post is the one step that needs an account. Log in first so you can edit, publish, and close the loop on what you share.</p>
          <div className="auth-gate-actions">
            <Link className="button button--primary" to="/login">Log in to continue</Link>
            <Link className="button button--secondary" to="/">Keep browsing</Link>
          </div>
        </div>
      </section>
    )
  }

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Browser does not support geolocation. You can enter the location manually.')
      notify('Geolocation is not supported by your browser.', 'neutral')
      return
    }
    setLocating(true)
    setLocationError('')
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false)
        const lat = position.coords.latitude
        const lng = position.coords.longitude
        setFields((current) => ({
          ...current,
          latitude: lat,
          longitude: lng,
        }))
        notify('✓ Location captured.', 'success')
      },
      (err) => {
        setLocating(false)
        let msg = 'Unable to determine your location. Please enter it manually.'
        if (err.code === 1) {
          msg = 'Location permission was denied. You can enter the location manually.'
        } else if (err.code === 2) {
          msg = 'Location unavailable. Please enter the location manually.'
        } else if (err.code === 3) {
          msg = 'Location request timed out. Please enter the location manually.'
        }
        setLocationError(msg)
        notify(msg, 'neutral')
      },
      { timeout: 10000, enableHighAccuracy: true }
    )
  }

  const analyze = async () => {
    if (rawText.trim().length < 12) {
      setErrors({ description: 'Give us a little more context — at least a sentence helps.' })
      return
    }
    setErrors({})
    setStatus('loading')
    try {
      const result = await api.ai.analyzePost(rawText)
      if (result) {
        setFields((current) => ({
          ...current,
          title: result.title || '',
          category: result.category || '',
          location: result.location || current.location || '',
          latitude: result.latitude ?? current.latitude ?? null,
          longitude: result.longitude ?? current.longitude ?? null,
          urgency: result.urgency === 'Normal' ? 'Medium' : result.urgency || 'Medium',
          tags: Array.isArray(result.tags) ? result.tags.join(', ') : (result.tags || ''),
          expiry: result.expiry || '48 hours',
        }))
        setStatus('complete')
      } else {
        setStatus('error')
      }
    } catch (err) {
      setStatus('error')
      notify(err.message || 'AI analysis could not be completed. You can continue manually.', 'neutral')
    }
  }

  const handleFieldChange = (key, value) => {
    setFields((current) => {
      const next = { ...current, [key]: value }
      if (key === 'location') {
        next.latitude = null
        next.longitude = null
        setLocationError('')
      }
      return next
    })
  }

  const publish = async () => {
    const nextErrors = validatePost(fields, rawText)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    setPublishing(true)
    setLocationError('')
    const payload = {
      title: fields.title,
      description: rawText,
      category: fields.category,
      location: fields.location,
      latitude: fields.latitude ?? null,
      longitude: fields.longitude ?? null,
      urgency: fields.urgency,
      tags: typeof fields.tags === 'string'
        ? fields.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : (fields.tags || []),
      is_anonymous: anonymous,
      expiry: fields.expiry,
    }

    try {
      const createdPost = await api.posts.create(payload)
      notify('✓ Signal published to the map!', 'success')
      onPublish(createdPost)
    } catch (err) {
      const msg = err.message || 'The post could not be published. Please try again.'
      notify(msg, 'neutral')
      if (msg.toLowerCase().includes('location')) {
        setErrors((curr) => ({ ...curr, location: msg }))
        setLocationError(msg)
      }
      setPublishing(false)
    }
  }

  return (
    <section className="create-page">
      <div className="container create-layout">
        <div className="create-main">
          <Link className="back-link" to="/">
            <ArrowLeft size={15} /> Back to local feed
          </Link>
          <div className="eyebrow eyebrow--dark">
            <Sparkles size={14} /> The magic moment
          </div>
          <h1>Turn a messy moment into a <em>useful signal.</em></h1>
          <p className="page-lede">
            Tell us what happened in your own words. Techtonix will structure the details so your community can find, understand, and act on them.
          </p>
          <div className="create-workbench">
            <div className="workbench-label">
              <span className="step-number">01</span>
              <div>
                <strong>Start with the raw signal</strong>
                <span>Write it like you would text a neighbour.</span>
              </div>
            </div>
            <PostForm
              rawText={rawText}
              setRawText={setRawText}
              error={errors.description}
              analyzing={status === 'loading'}
              onAnalyze={analyze}
            />
          </div>

          <AIAnalysis
            status={status}
            fields={fields}
            errors={errors}
            onChange={handleFieldChange}
            onRetry={analyze}
            onUseLocation={handleUseLocation}
            locating={locating}
            locationError={locationError}
            onManual={() => {
              setStatus('complete')
              setFields((current) => ({
                ...current,
                urgency: current.urgency || 'Medium',
                category: current.category || 'Events & Announcements',
              }))
            }}
          />

          {status === 'complete' && (
            <div className="publish-bar">
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={anonymous}
                  onChange={(event) => setAnonymous(event.target.checked)}
                />
                <span className="custom-checkbox">
                  <Check size={13} />
                </span>
                <span>
                  Post anonymously <small>Your identity stays hidden from normal users.</small>
                </span>
              </label>
              <div className="publish-actions">
                <Button variant="secondary" onClick={() => setPreview(true)}>
                  <Eye size={16} /> Preview
                </Button>
                <Button disabled={publishing} onClick={publish}>
                  {publishing ? 'Publishing...' : <><Send size={16} /> Publish post</>}
                </Button>
              </div>
            </div>
          )}

          {preview && (
            <PostPreview
              fields={fields}
              rawText={rawText}
              anonymous={anonymous}
              onClose={() => setPreview(false)}
            />
          )}
        </div>

        <aside className="create-aside">
          <div className="aside-sticky">
            <div className="aside-card aside-card--dark">
              <div className="eyebrow">
                <span className="signal-dot" /> What happens next
              </div>
              <div className="process-list">
                <div className="process-item is-active">
                  <span className="process-number">01</span>
                  <div>
                    <strong>AI structures</strong>
                    <p>Category, location, urgency and useful tags.</p>
                  </div>
                </div>
                <div className="process-item">
                  <span className="process-number">02</span>
                  <div>
                    <strong>You review</strong>
                    <p>Edit every field before anything goes live.</p>
                  </div>
                </div>
                <div className="process-item">
                  <span className="process-number">03</span>
                  <div>
                    <strong>The community validates</strong>
                    <p>Neighbours can mark it still valid or outdated.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  )
}
