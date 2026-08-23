import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { setSessionAccessor } from '../lib/api.js'

const AuthContext = createContext(null)

const STORAGE_KEY = 'primal_admin_session'

function decodeJwtPayload(token) {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const pad = base64.length % 4 === 0 ? '' : '='.repeat(4 - (base64.length % 4))
    const json = atob(base64 + pad)
    return JSON.parse(json)
  } catch {
    return null
  }
}

function loadStoredSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed?.token || !parsed?.email) return null
    const payload = decodeJwtPayload(parsed.token)
    if (!payload?.exp || payload.exp * 1000 < Date.now()) {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }
    return parsed
  } catch {
    return null
  }
}

function getApiBase() {
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setSessionAccessor(() => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (!raw) return Promise.resolve(null)
        const parsed = JSON.parse(raw)
        return Promise.resolve(parsed?.token ? { access_token: parsed.token } : null)
      } catch {
        return Promise.resolve(null)
      }
    })
  }, [])

  useEffect(() => {
    const stored = loadStoredSession()
    if (stored) {
      setUser({ id: stored.email, email: stored.email, name: stored.email })
      setSession({ access_token: stored.token, user: { email: stored.email } })
    }
    setLoading(false)
  }, [])

  const requestOtp = useCallback(async (email) => {
    const res = await fetch(`${getApiBase()}/auth/request-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    let body
    try { body = await res.json() } catch { body = {} }
    if (!res.ok) {
      const err = new Error(body.message || `Failed to send code (HTTP ${res.status})`)
      err.status = res.status
      err.body = body
      throw err
    }
    return body
  }, [])

  const loginWithOtp = useCallback(async (email, code) => {
    const res = await fetch(`${getApiBase()}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
    })
    let body
    try { body = await res.json() } catch { body = {} }
    if (!res.ok || !body?.token) {
      const err = new Error(body.message || `Verification failed (HTTP ${res.status})`)
      err.status = res.status
      err.body = body
      throw err
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: body.token, email: body.email }))
    const u = { id: body.email, email: body.email, name: body.email }
    const s = { access_token: body.token, user: u }
    setUser(u)
    setSession(s)
    return { user: u, session: s }
  }, [])

  const logout = useCallback(async () => {
    try { localStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
    setUser(null)
    setSession(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, session, loading, requestOtp, loginWithOtp, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
