import { useMemo, useState } from 'react'
import { ArrowUpRight, CircleDot, Crosshair, RotateCcw, Search, ShieldCheck, SlidersHorizontal, Sparkles } from 'lucide-react'
import { Link, useNavigate, useOutletContext } from 'react-router-dom'
import SearchBar from '../components/SearchBar.jsx'
import CategoryFilter from '../components/CategoryFilter.jsx'
import PostList from '../components/PostList.jsx'
import MapPreview from '../components/MapPreview.jsx'
import ErrorMessage from '../components/ErrorMessage.jsx'
import { categoryConfig } from '../mockData.js'
import { INSTITUTION } from '../constants/institution.js'

export default function Home() {
  const { posts, loading, error, refreshPosts, onUpdatePost, notify } = useOutletContext()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [showFilters, setShowFilters] = useState(false)

  const filtered = useMemo(() => {
    return (posts || []).filter((post) => {
      const matchesCategory = category === 'all' || post.categoryKey === category
      const tagsList = Array.isArray(post.tags) ? post.tags : []
      const searchable = [post.title, post.description, post.category, post.location, ...tagsList]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return matchesCategory && (!query.trim() || searchable.includes(query.trim().toLowerCase()))
    })
  }, [posts, query, category])

  const activeCount = useMemo(() => {
    return (posts || []).filter((post) => post.status === 'Active' || post.status === 'active').length
  }, [posts])

  return (
    <>
      <section className="hero-section">
        <div className="container hero-grid">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="signal-dot" /> {INSTITUTION.shortName} community signal <span className="eyebrow-divider" /> Live today
            </div>
            <h1>Know what's <em>moving</em> around you.</h1>
            <p className="hero-lede">
              A clearer local signal layer for campus communities. Discover useful updates, make messy moments legible, and help your neighbours act sooner.
            </p>
            <div className="hero-actions">
              <Link className="button button--primary button--hero" to="/create">
                <Sparkles size={18} /> Share local information <ArrowUpRight size={17} />
              </Link>
              <span className="hero-note">
                <ShieldCheck size={15} /> Public to browse · thoughtful by design
              </span>
            </div>
          </div>
          <div className="hero-signal-card">
            <div className="signal-card-top">
              <span className="kicker">Today in {INSTITUTION.shortName}</span>
              <span className="live-badge"><CircleDot size={12} /> Live</span>
            </div>
            <div className="signal-card-stat">
              <strong>{activeCount}</strong>
              <span>active signals<br />worth knowing</span>
            </div>
            <div className="signal-bars" aria-hidden="true">
              <span style={{ height: '38%' }} />
              <span style={{ height: '58%' }} />
              <span style={{ height: '76%' }} />
              <span style={{ height: '48%' }} />
              <span style={{ height: '88%' }} />
              <span style={{ height: '68%' }} />
              <span style={{ height: '96%' }} />
            </div>
            <div className="signal-card-bottom">
              <span>Verified local signals</span>
              <span>Community powered</span>
            </div>
          </div>
        </div>
      </section>

      <section className="container discovery-section">
        <div className="section-heading-row">
          <div>
            <div className="eyebrow eyebrow--dark"><span className="signal-dot" /> The local feed</div>
            <h2>What matters <em>right now.</em></h2>
          </div>
          <div className="section-aside">
            <span className="status-dot status-dot--green" /> Showing {INSTITUTION.shortName} · updated just now
          </div>
        </div>

        <div className="feed-toolbar">
          <SearchBar value={query} onChange={setQuery} />
          <button
            className={`filter-toggle ${showFilters ? 'is-open' : ''}`}
            type="button"
            onClick={() => setShowFilters((value) => !value)}
          >
            <SlidersHorizontal size={17} /> Filters
          </button>
          <div className={showFilters ? 'category-filters category-filters--open' : 'category-filters'}>
            <CategoryFilter value={category} onChange={setCategory} />
          </div>
        </div>

        {error ? (
          <ErrorMessage
            title="Unable to load community posts."
            message={error}
            onRetry={refreshPosts}
          />
        ) : (
          <div className="home-grid">
            <div className="feed-column">
              <div className="feed-column-head">
                <span>{loading ? 'Refreshing feed...' : `${filtered.length} signals nearby`}</span>
                <button className="text-action" type="button" onClick={refreshPosts}>
                  <RotateCcw size={14} className={loading ? 'spin' : ''} /> Refresh
                </button>
              </div>
              {loading ? (
                <div className="skeleton-list">
                  <div className="skeleton-card" />
                  <div className="skeleton-card" />
                </div>
              ) : (
                <PostList
                  posts={filtered}
                  query={query}
                  onClear={() => {
                    setQuery('')
                    setCategory('all')
                  }}
                  onUpdate={onUpdatePost}
                  onNotify={notify}
                />
              )}
            </div>
            <MapPreview posts={filtered} onSelect={(post) => navigate(`/post/${post.id}`)} />
          </div>
        )}
      </section>

      <section className="container trust-strip">
        <div className="trust-strip__mark">
          <ShieldCheck size={21} />
        </div>
        <div>
          <strong>Useful information, with a pulse.</strong>
          <p>Every signal has a time, a place, and a way for the community to say: still valid.</p>
        </div>
        <Link to="/privacy">See our promise <ArrowUpRight size={15} /></Link>
      </section>
    </>
  )
}
