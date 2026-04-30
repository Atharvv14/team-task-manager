import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authApi } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('ttm_token')
    if (!token) { setLoading(false); return }

    authApi.me()
      .then(r => setUser(r.data))
      .catch(() => {
        localStorage.removeItem('ttm_token')
        localStorage.removeItem('ttm_user')
      })
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async ({ email, password }) => {
    const r = await authApi.login({ email, password })
    localStorage.setItem('ttm_token', r.data.token)
    setUser(r.data.user)
    return r.data
  }, [])

  const signup = useCallback(async ({ name, email, password }) => {
    const r = await authApi.signup({ name, email, password })
    localStorage.setItem('ttm_token', r.data.token)
    setUser(r.data.user)
    return r.data
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('ttm_token')
    localStorage.removeItem('ttm_user')
    setUser(null)
  }, [])

  const updateProfile = useCallback(async (data) => {
    const r = await authApi.update(data)
    setUser(r.data)
    return r.data
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
