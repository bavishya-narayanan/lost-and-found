import { useContext } from 'react'
import { AuthContext } from '../context/AuthContext'

/**
 * Convenience hook to consume AuthContext.
 * Throws if used outside <AuthProvider>.
 */
export default function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an <AuthProvider>')
  return ctx
}
