/**
 * AuthContext — глобальное хранилище состояния аутентификации.
 * Оборачивает всё приложение; предоставляет хук useAuth().
 */
import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  // При первом рендере — пробуем восстановить сессию по токену
  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) { setLoading(false); return }

    authAPI.me()
      .then((res) => setUser(res.data))
      .catch(() => localStorage.removeItem('access_token'))
      .finally(() => setLoading(false))
  }, [])

  const login = async (email, password) => {
    const res = await authAPI.login(email, password)
    localStorage.setItem('access_token', res.data.access_token)
    const me = await authAPI.me()
    setUser(me.data)
    return me.data
  }

  const logout = () => {
    localStorage.removeItem('access_token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
