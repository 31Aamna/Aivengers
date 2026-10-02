import { useEffect, useState } from 'react'
import { ArrowLeft, BadgeCheck, Check, CheckCircle2, Flag, MessageCircle, ShieldCheck, ThumbsUp, TriangleAlert, UserRound } from 'lucide-react'
import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../lib/api.js'
import MapPreview from '../components/MapPreview.jsx'
import Button from '../components/Button.jsx'
import ErrorMessage from '../components/ErrorMessage.jsx'

export default function PostDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { posts, onUpdatePost, notify } = useOutletContext()
  const { user } = useAuth()

  const [post, setPost] = useState(() => (posts || []).find((item) => String(item.id) === String(id)) || null)
  const [loading, setLoading] = useState(!post)
  const [error, setError] = useState(null)
  const [reporting, setReporting] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [submittingReport, setSubmittingReport] = useState(false)
  const [vote, setVote] = useState(null)
  const [voted, setVoted] = useState(false)

  useEffect(() => {
    let mounted = true
    const cached = (posts || []).find((item) => String(item.id) === String(id))
    if (cached) {
      setPost(cached)
      setLoading(false)
    } else {
      setLoading(true)
      api.posts.get(id)
        .then((data) => {
          if (mounted) {
            setPost(data)
            setError(null)
          }
        })
        .catch((err) => {
          if (mounted) {
            setError(err.message || 'Post not found.')
          }
        })
        .finally(() => {
          if (mounted) setLoading(false)
        })
    }
    return () => {
      mounted = false
    }
  }, [id, posts])

  if (loading) {
    return (
      <section className="detail-page">
        <div className="container detail-empty">
          <p>Loading signal details...</p>
        </div>
      </section>
    )
  }

  if (error || !post) {
    return (
      <section className="detail-page">
        <div className="container detail-empty">
          <ErrorMessage
            title="This signal has gone missing."
            message="It may have expired, been resolved, or never existed."
            onRetry={() => navigate('/')}
          />
        </div>
      </section>
    )
  }

  const owner =
    Boolean(user && post && (
      (post.author_id && post.author_id === user.id) ||
      (!post.anonymous && (post.author === user.email || post.author === user.user_metadata?.name))
    ))

  const handleVote = async () => {
    if (!user) {
      notify('Log in to upvote local signals.', 'neutral')
      return
    }
    try {
      const updated = await api.posts.vote(post.id, 'up')
      setVoted(true)
      setPost(updated)
      onUpdatePost(post.id, updated)
      notify('Upvoted signal.', 'success')
    } catch (err) {
      notify(err.message || 'Could not record vote.', 'neutral')
    }
  }

  const markValidity = async (status) => {
    if (!user) {
      notify('Log in to help validate local signals.', 'neutral')
      return
    }
    try {
      const updated = await api.posts.validity(post.id, status)
      setVote(status)
      setPost(updated)
      onUpdatePost(post.id, updated)
      notify(status === 'valid' ? 'Marked still valid.' : 'Marked outdated.', 'neutral')
    } catch (err) {
      notify(err.message || 'Could not update validity.', 'neutral')
    }
  }

  const submitReport = async () => {
    if (!user) {
      notify('Log in to report a signal.', 'neutral')
      return
    }
    if (!reportReason.trim()) {
      notify('Please enter a reason for reporting.', 'neutral')
      return
    }
    setSubmittingReport(true)
    try {
      const updated = await api.posts.report(post.id, reportReason.trim())
      setReporting(false)
      setReportReason('')
      if (updated) {
        setPost(updated)
        onUpdatePost(post.id, updated)
      }
      notify('Thanks — your report has been noted.', 'neutral')
    } catch (err) {
      notify(err.message || 'Could not submit report.', 'neutral')
    } finally {
      setSubmittingReport(false)
    }
  }

  const handleResolve = async () => {
    if (!user) {
      notify('Log in to resolve this post.', 'neutral')
      return
    }
    try {
      const updated = await api.posts.resolve(post.id)
      onUpdatePost(post.id, updated)
      notify('Post resolved — thanks for closing the loop.')
      navigate('/')
    } catch (err) {
      notify(err.message || 'Could not resolve post.', 'neutral')
    }
  }

  const handleContact = () => {
    if (post.anonymous) {
      notify('This signal was posted anonymously. Direct contact is not available.', 'neutral')
    } else {
      notify(`Signal shared by ${post.author}. You can discuss this in campus community spaces.`, 'neutral')
    }
  }

  const tags = Array.isArray(post.tags) ? post.tags : []

  return (
    <section className="detail-page">
      <div className="container">
        <Link className="back-link" to="/">
          <ArrowLeft size={15} /> Back to local feed
        </Link>
        <div className="detail-layout">
          <article className={`detail-card detail-card--${post.accent || 'amber'}`}>
            <div className="detail-card__head">
              <span className={`category-label category-label--${post.accent || 'amber'}`}>
                {post.category}
              </span>
              <span className="live-badge">
                <span className="status-dot status-dot--green" /> {post.status}
              </span>
            </div>
            <h1>{post.title}</h1>
            <p className="detail-description">{post.description}</p>
            <div className="detail-meta-grid">
              <div>
                <span>Location</span>
                <strong>{post.location}</strong>
              </div>
              <div>
                <span>Urgency</span>
                <strong className={`urgency urgency--${(post.urgency || 'medium').toLowerCase()}`}>
                  <span /> {post.urgency}
                </strong>
              </div>
              <div>
                <span>Posted</span>
                <strong>{post.createdTime || post.time || 'Recently'}</strong>
              </div>
              <div>
                <span>Expiry</span>
                <strong>{post.expiry || '48 hours'}</strong>
              </div>
            </div>

            <MapPreview posts={[post]} onSelect={() => {}} detail />

            <div className="detail-actions">
              <Button
                variant={voted ? 'primary' : 'secondary'}
                onClick={handleVote}
              >
                <ThumbsUp size={16} /> Upvote ({post.upvotes || 0})
              </Button>
              <Button
                variant={vote === 'valid' ? 'primary' : 'secondary'}
                onClick={() => markValidity('valid')}
              >
                <CheckCircle2 size={16} /> Still valid ({post.valid || 0})
              </Button>
              <Button
                variant={vote === 'outdated' ? 'primary' : 'secondary'}
                onClick={() => markValidity('outdated')}
              >
                <TriangleAlert size={16} /> Outdated ({post.outdated || 0})
              </Button>
              <Button variant="secondary" onClick={() => setReporting((value) => !value)}>
                <Flag size={16} /> Report
              </Button>
              <Button variant="secondary" onClick={handleContact}>
                <MessageCircle size={16} /> Contact poster
              </Button>
              {owner && post.status !== 'Resolved' && (
                <Button onClick={handleResolve}>
                  <Check size={16} /> Resolve post
                </Button>
              )}
            </div>

            {reporting && (
              <div className="report-box">
                <strong>What should we know?</strong>
                <textarea
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  placeholder="Tell us what seems inaccurate or unsafe."
                  rows={3}
                />
                <Button small disabled={submittingReport} onClick={submitReport}>
                  {submittingReport ? 'Sending...' : 'Send report'}
                </Button>
              </div>
            )}
          </article>

          <aside className="detail-sidebar">
            <div className="author-card">
              <div className="eyebrow eyebrow--dark">
                <UserRound size={13} /> Shared by
              </div>
              <div className="author-row">
                <span className="avatar avatar--lime">{post.initials || 'CM'}</span>
                <div>
                  <strong>{post.author}</strong>
                  <span>
                    {post.verified ? (
                      <>
                        <BadgeCheck size={14} /> Verified source
                      </>
                    ) : post.anonymous ? (
                      'Identity hidden'
                    ) : (
                      'Community member'
                    )}
                  </span>
                </div>
              </div>
              <div className="trust-score">
                <div>
                  <span>Trust score</span>
                  <strong>
                    {post.trust ?? 50}
                    <small>/100</small>
                  </strong>
                </div>
                <div className="trust-ring" style={{ '--score': `${post.trust ?? 50}%` }}>
                  {post.trust ?? 50}
                </div>
              </div>
              <p>Trust is built from community validation and healthy signal history — not popularity.</p>
            </div>
            <div className="aside-card aside-card--dark">
              <ShieldCheck size={21} />
              <strong>Good signal hygiene</strong>
              <p>Come back when the situation changes and mark this post outdated or resolved.</p>
            </div>
            {tags.length > 0 && (
              <div className="detail-tags">
                {tags.map((tag) => (
                  <span key={tag}>#{tag}</span>
                ))}
              </div>
            )}
          </aside>
        </div>
      </div>
    </section>
  )
}
