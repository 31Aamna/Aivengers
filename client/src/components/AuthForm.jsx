import { useState } from 'react'
import { ArrowUpRight, AtSign, Eye, EyeOff, Lock, LoaderCircle, Shield, UserRound } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { validateAuth } from '../lib/validation.js'
import Button from './Button.jsx'
export default function AuthForm({ mode = 'login' }) {
  const signup = mode === 'signup'
  const { signIn, signUp, signInWithGoogle, isConfigured } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }))

  const submit = async (event) => {
    event.preventDefault()
    const next = validateAuth(form, mode)
    setErrors(next)
    if (Object.keys(next).length) return

    setLoading(true)
    setMessage('')
    try {
      const result = signup ? await signUp(form) : await signIn(form)
      if (result.error) throw result.error
      if (signup && !result.data?.session) {
        setMessage('Check your email to confirm your account before logging in.')
        return
      }
      navigate(location.state?.from || '/')
    } catch (error) {
      setMessage(error.message || 'Authentication failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="auth-page">
      <div className="container auth-layout">
        <div className="auth-story">
          <Link className="brand" to="/">
            <span className="brand-mark"><span /><span /></span>
            <span className="brand-wordmark">techtonix</span>
          </Link>
          <div className="auth-story__copy">
            <div className="eyebrow eyebrow--dark">
              <span className="signal-dot" /> Join the signal layer
            </div>
            <h1>Make your corner of the world <em>more legible.</em></h1>
            <p>Share what is happening, help validate useful information, and close the loop when the moment has passed.</p>
            <div className="auth-points">
              <span>✓ Browse publicly, always</span>
              <span>✓ Keep identity in your control</span>
              <span>✓ Help information stay useful</span>
            </div>
          </div>
        </div>
        <div className="auth-card">
          <div className="auth-card__heading">
            <span className="auth-icon"><Shield size={19} /></span>
            <div>
              <span className="kicker">{signup ? 'New to the network' : 'Welcome back'}</span>
              <h2>{signup ? 'Create your account' : 'Log in to Techtonix'}</h2>
            </div>
          </div>
          {import.meta.env.VITE_SUPABASE_GOOGLE_ENABLED === 'true' && (
            <button
              className="google-button"
              type="button"
              onClick={() => signInWithGoogle().catch((error) => setMessage(error.message))}
            >
              Continue with Google <ArrowUpRight size={16} />
            </button>
          )}
          <div className="or-divider"><span>use email</span></div>
          <form onSubmit={submit} noValidate>
            {signup && (
              <div className="field">
                <label htmlFor="auth-name">Name</label>
                <div className="input-with-icon">
                  <UserRound size={16} />
                  <input
                    id="auth-name"
                    value={form.name}
                    onChange={(event) => update('name', event.target.value)}
                    placeholder="Your name"
                  />
                </div>
                {errors.name && <span className="field-error">{errors.name}</span>}
              </div>
            )}
            <div className="field">
              <label htmlFor="auth-email">Email</label>
              <div className="input-with-icon">
                <AtSign size={16} />
                <input
                  id="auth-email"
                  type="email"
                  value={form.email}
                  onChange={(event) => update('email', event.target.value)}
                  placeholder="you@example.com"
                />
              </div>
              {errors.email && <span className="field-error">{errors.email}</span>}
            </div>
            <div className="field">
              <label htmlFor="auth-password">Password</label>
              <div className="input-with-icon">
                <Lock size={16} />
                <input
                  id="auth-password"
                  type={show ? 'text' : 'password'}
                  value={form.password}
                  onChange={(event) => update('password', event.target.value)}
                  placeholder="At least 8 characters"
                />
                <button
                  className="input-action"
                  type="button"
                  onClick={() => setShow((value) => !value)}
                  aria-label="Toggle password visibility"
                >
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <span className="field-error">{errors.password}</span>}
            </div>
            {signup && (
              <div className="field">
                <label htmlFor="auth-confirm">Confirm password</label>
                <input
                  id="auth-confirm"
                  type="password"
                  value={form.confirmPassword}
                  onChange={(event) => update('confirmPassword', event.target.value)}
                  placeholder="Repeat your password"
                />
                {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}
              </div>
            )}
            {message && <div className="inline-feedback">{message}</div>}
            <Button type="submit" wide disabled={loading}>
              {loading ? <><LoaderCircle size={17} className="spin" /> Working...</> : signup ? 'Create account' : 'Log in'} <ArrowUpRight size={16} />
            </Button>
          </form>
          <p className="auth-switch">
            {signup ? 'Already have an account?' : 'New to Techtonix?'} <Link to={signup ? '/login' : '/signup'}>{signup ? 'Log in' : 'Create an account'}</Link>
          </p>
          {!isConfigured && <p className="auth-legal">Auth is ready for Supabase. Add the public Vite variables to enable it in this preview.</p>}
        </div>
      </div>
    </section>
  )
}
