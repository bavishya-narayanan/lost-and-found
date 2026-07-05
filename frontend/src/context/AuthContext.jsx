import { createContext, useState, useEffect, useCallback } from 'react'
import { getProfile } from '../services/authService'

export const AuthContext = createContext(null)

const TOKEN_KEY = 'findit_token'
const USER_KEY  = 'findit_user'

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [token, setToken]     = useState(() => localStorage.getItem(TOKEN_KEY) || null)
  const [loading, setLoading] = useState(true)  // true while hydrating from localStorage

  // ── On mount: if token exists, validate with server ──────
  useEffect(() => {
    const hydrate = async () => {
      if (!token) {
        setLoading(false)
        return
      }
      try {
        const data = await getProfile()
        setUser(data.user)
      } catch {
        // Token invalid / expired — clear it
        logout()
      } finally {
        setLoading(false)
      }
    }
    hydrate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Called after successful register or login ────────────
  const saveAuth = useCallback((tokenValue, userData) => {
    localStorage.setItem(TOKEN_KEY, tokenValue)
    localStorage.setItem(USER_KEY, JSON.stringify(userData))
    setToken(tokenValue)
    setUser(userData)
  }, [])

  // ── Update specific fields in user object ─────────────────
  const updateUser = useCallback((userData) => {
    setUser(userData)
    localStorage.setItem(USER_KEY, JSON.stringify(userData))
  }, [])

  // ── Logout: wipe everything ──────────────────────────────
  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setToken(null)
    setUser(null)
  }, [])

  const isAuthenticated = Boolean(token && user)

  return (
    <AuthContext.Provider value={{ user, token, loading, isAuthenticated, saveAuth, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}
