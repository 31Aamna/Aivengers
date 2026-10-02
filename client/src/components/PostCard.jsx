import { useState } from 'react'
import { ArrowUpRight, BadgeCheck, CheckCircle2, Clock3, MapPin, ShieldCheck, ThumbsUp, TriangleAlert } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../lib/api.js'
import { categoryIcon } from '../mockData.js'

export default function PostCard({ post, onUpdate, onNotify }) {
  const { user } = useAuth()
  const [action, setAction] = useState(null)
  const [voted, setVoted] = useState(false)
  const Icon = categoryIcon[post.categoryKey] || ShieldCheck

  const handleVote = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!user) {
      onNotify('Log in to upvote local signals.', 'neutral')
      return
    }
    try {
      const updated = await api.posts.vote(post.id, 'up')
      setVoted(true)
      onUpdate(post.id, updated)
      onNotify('Upvoted signal.', 'success')
    } catch (err) {
      onNotify(err.message || 'Could not record vote.', 'neutral')
    }
  }

  const validate = async (type) => {
    if (!user) {
      onNotify('Log in to validate signals and help keep the feed fresh.', 'neutral')
      return
    }
    try {
      const updated = await api.posts.validity(post.id, type)
      setAction(type)
      onUpdate(post.id, updated)
      onNotify(type === 'valid' ? 'Thanks — your “still valid” check helps.' : 'Outdated check added.', 'neutral')
    } catch (err) {
      onNotify(err.message || 'Could not record validity check.', 'neutral')
    }
  }

  return (
    <article className={`post-card post-card--${post.accent}`}>
      <div className="post-card__topline">
        <span className={`category-label category-label--${post.accent}`}>
          <Icon size={14} /> {post.category}
        </span>
        <span className="post-time">
          <Clock3 size={14} /> {post.time || 'Recently'}
        </span>
      </div>
      <Link className="post-card__title" to={`/post/${post.id}`}>
        {post.title} <ArrowUpRight size={17} />
      </Link>
      <p className="post-card__description">{post.description}</p>
      <div className="post-card__meta">
        <span><MapPin size={15} /> {post.location}</span>
        <span className={`urgency urgency--${(post.urgency || 'medium').toLowerCase()}`}>
          <span /> {post.urgency} urgency
        </span>
      </div>
      <div className="post-card__footer">
        <div className="trust-line">
          {post.verified ? <BadgeCheck size={16} className="verified-icon" /> : <ShieldCheck size={16} />}
          <span>{post.anonymous ? 'Posted anonymously' : post.verified ? 'Verified source' : `Trust score ${post.trust ?? 50}`}</span>
        </div>
        <div className="card-actions">
          <button
            className={`card-action ${voted ? 'is-active' : ''}`}
            type="button"
            onClick={handleVote}
            title="Upvote this signal"
          >
            <ThumbsUp size={14} /> {post.upvotes || 0}
          </button>
          <button
            className={`card-action ${action === 'valid' ? 'is-active' : ''}`}
            type="button"
            onClick={() => validate('valid')}
          >
            <CheckCircle2 size={15} /> {post.valid || 0} valid
          </button>
          <button
            className={`card-action ${action === 'outdated' ? 'is-active card-action--muted' : ''}`}
            type="button"
            onClick={() => validate('outdated')}
          >
            <TriangleAlert size={14} /> Outdated
          </button>
        </div>
      </div>
    </article>
  )
}
