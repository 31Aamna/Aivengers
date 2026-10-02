import { Link, NavLink } from 'react-router-dom'
import { ChevronDown, LogIn, Menu, Plus, X } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
function Brand() { return <Link className="brand" to="/" aria-label="Techtonix home"><span className="brand-mark" aria-hidden="true"><span /><span /></span><span className="brand-wordmark">techtonix</span></Link> }
export default function Navbar() {
  const { user, signOut } = useAuth(); const [open, setOpen] = useState(false)
  const logout = async () => { await signOut(); setOpen(false) }
  const initials = (user?.user_metadata?.name || user?.email || 'U').slice(0, 2).toUpperCase()
  return <header className="site-header"><div className="container nav-inner"><Brand /><nav className={`nav-links ${open ? 'nav-links--open' : ''}`} aria-label="Primary navigation"><NavLink end to="/" onClick={() => setOpen(false)}>Explore signals</NavLink><NavLink to="/create" onClick={() => setOpen(false)}>How it works</NavLink><NavLink to="/privacy" onClick={() => setOpen(false)}>Our promise</NavLink></nav><div className="nav-actions">{user ? <div className="user-menu"><span className="user-chip"><span className="avatar avatar--lime">{initials}</span><span className="user-chip__name">{user.user_metadata?.name?.split(' ')[0] || user.email?.split('@')[0]}</span><ChevronDown size={15} /></span><button className="button button--text" type="button" onClick={logout}>Sign out</button></div> : <><Link className="button button--nav" to="/login"><LogIn size={16} /> Log in</Link><Link className="button button--nav" to="/signup">Sign up</Link></>}<Link className="button button--primary button--small" to="/create"><Plus size={16} /> Share local information</Link></div><button className="menu-toggle" type="button" onClick={() => setOpen((value) => !value)} aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open}>{open ? <X size={21} /> : <Menu size={21} />}</button></div></header>
}
