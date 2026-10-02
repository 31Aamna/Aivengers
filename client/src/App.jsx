import { useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { CheckCircle2, CircleDot, X } from 'lucide-react'
import { AuthProvider } from './context/AuthContext.jsx'
import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import CookieConsent from './components/CookieConsent.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import { api } from './lib/api.js'
import Home from './pages/Home.jsx'
import CreatePost from './pages/CreatePost.jsx'
import PostDetails from './pages/PostDetails.jsx'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import Privacy from './pages/Privacy.jsx'
import Terms from './pages/Terms.jsx'
import NotFound from './pages/NotFound.jsx'
import { track } from './lib/analytics.js'

const pageMeta = {
  '/': ['Techtonix — Local Information, Made Discoverable', 'Discover, share, and validate useful information around your campus and local community.'],
  '/create': ['Share Local Information — Techtonix', 'Turn a messy local moment into a useful, structured community signal.'],
  '/login': ['Login — Techtonix', 'Log in to share and validate useful local information.'],
  '/signup': ['Sign up — Techtonix', 'Join the Techtonix local signal network.'],
  '/privacy': ['Privacy Policy — Techtonix', 'A plain-language hackathon privacy notice for Techtonix.'],
  '/terms': ['Terms & Conditions — Techtonix', 'Readable terms for the Techtonix prototype.'],
}

function PageMeta() {
  const { pathname } = useLocation()
  useEffect(() => {
    const [title, description] = pageMeta[pathname] || ['Signal not found — Techtonix', 'The page you are looking for is not available.']
    document.title = title
    document.querySelector('meta[name="description"]')?.setAttribute('content', description)
  }, [pathname])
  return null
}

function Toast({ toast, onClose }) {
  if (!toast) return null
  return (
    <div className={`toast toast--${toast.tone}`} role="status">
      <span className="toast-icon">
        {toast.tone === 'success' ? <CheckCircle2 size={17} /> : <CircleDot size={17} />}
      </span>
      <span>{toast.message}</span>
      <button type="button" onClick={onClose} aria-label="Dismiss message">
        <X size={15} />
      </button>
    </div>
  )
}

function AppShell() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [toast, setToast] = useState(null)
  const [consent, setConsent] = useState(() => localStorage.getItem('techtonix-consent'))
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    track('page_view', { path: location.pathname })
  }, [location.pathname])

  const fetchPosts = async () => {
    setLoading(true)
    setError(null)
    try {
      const rows = await api.posts.list()
      setPosts(Array.isArray(rows) ? rows : [])
      setError(null)
    } catch (err) {
      setError(err.message || 'Unable to load community posts. Please try again.')
      setPosts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPosts()
  }, [])

  useEffect(() => {
    if (!toast) return undefined
    const timer = window.setTimeout(() => setToast(null), 4200)
    return () => window.clearTimeout(timer)
  }, [toast])

  const notify = (message, tone = 'success') => setToast({ message, tone })
  const updatePost = (id, patch) => {
    setPosts((current) => current.map((post) => (post.id === id ? { ...post, ...patch } : post)))
  }
  const publishPost = (post) => {
    setPosts((current) => [post, ...current])
    notify('Your local signal is live in the feed.')
    navigate('/')
  }

  const context = {
    posts,
    loading,
    error,
    refreshPosts: fetchPosts,
    onUpdatePost: updatePost,
    onPublish: publishPost,
    notify,
  }

  return (
    <>
      <PageMeta />
      <Navbar />
      <main>
        <Outlet context={context} />
      </main>
      <Footer />
      {!consent && (
        <CookieConsent
          onChoice={(value) => {
            localStorage.setItem('techtonix-consent', value)
            setConsent(value)
          }}
        />
      )}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </>
  )
}

export default function App() {
  return <BrowserRouter><AuthProvider><Routes><Route element={<AppShell />}><Route path="/" element={<Home />} /><Route path="/create" element={<ProtectedRoute><CreatePost /></ProtectedRoute>} /><Route path="/post/:id" element={<PostDetails />} /><Route path="/login" element={<Login />} /><Route path="/signup" element={<Signup />} /><Route path="/privacy" element={<Privacy />} /><Route path="/terms" element={<Terms />} /><Route path="*" element={<NotFound />} /></Route><Route path="/404" element={<Navigate to="*" replace />} /></Routes></AuthProvider></BrowserRouter>
}
