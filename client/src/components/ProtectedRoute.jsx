import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import Loading from './Loading.jsx'
export default function ProtectedRoute({ children }) { const { user, loading } = useAuth(); const location = useLocation(); if (loading) return <Loading label="Checking your session..." />; return user ? children : <Navigate to="/login" replace state={{ from: location.pathname }} /> }
