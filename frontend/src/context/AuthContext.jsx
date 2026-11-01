/**
 * AuthContext — глобальное хранилище состояния аутентификации
 * с автоматическим переходом в Demo Mode при отсутствии бэкенда.
 */
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authAPI, isNetworkError, checkBackendHealth } from '../api'
import { isDemoMode, setDemoMode, demoAuth } from '../services/demoStore'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]           = useState(null)
  const [loading, setLoading]     = useState(true)
  const [isDemo, setIsDemo]       = useState(isDemoMode())
  const [backendUp, setBackendUp] = useState(null)

  // Синхронизация состояния Demo Mode через custom event
  useEffect(() => {
    const onDemoChange = (e) => {
      setIsDemo(e.detail.isDemo)
      if (e.detail.isDemo) {
        setUser((prev) => prev || demoAuth.me())
      }
    }
    window.addEventListener('aether:demo-mode', onDemoChange)
    return () => window.removeEventListener('aether:demo-mode', onDemoChange)
  }, [])

  // Периодическая или начальная проверка доступности сервера
  const refreshBackendStatus = useCallback(async () => {
    const alive = await checkBackendHealth()
    setBackendUp(alive)
    return alive
  }, [])

  // При первом рендере — восстанавливаем сессию
  useEffect(() => {
    const initAuth = async () => {
      // 1. Если уже сохранен флаг демо-режима:
      if (isDemoMode()) {
        setIsDemo(true)
        setUser(demoAuth.me())
        setLoading(false)
        refreshBackendStatus()
        return
      }

      // 2. Если есть сохраненный токен:
      const token = localStorage.getItem('access_token')
      if (token) {
        try {
          const res = await authAPI.me()
          setUser(res.data)
          setBackendUp(true)
        } catch (err) {
          if (isNetworkError(err)) {
            // Сервер недоступен — переключаем в демо-режим
            setDemoMode(true)
            setIsDemo(true)
            setUser(demoAuth.me())
            setBackendUp(false)
          } else {
            // Ошибка токена (401 и т.д.)
            localStorage.removeItem('access_token')
            setUser(null)
          }
        } finally {
          setLoading(false)
        }
        return
      }

      // 3. Токена нет (новый посетитель, например с телефона на GitHub Pages):
      // Проверяем доступность бэкенда. Если бэкенд недоступен, автоматически
      // активируем Demo Mode, чтобы пользователь сразу мог пользоваться приложением!
      try {
        const isUp = await checkBackendHealth()
        setBackendUp(isUp)
        if (!isUp) {
          setDemoMode(true)
          setIsDemo(true)
          setUser(demoAuth.me())
        }
      } catch {
        setDemoMode(true)
        setIsDemo(true)
        setUser(demoAuth.me())
      } finally {
        setLoading(false)
      }
    }

    initAuth()
  }, [refreshBackendStatus])

  const login = async (email, password) => {
    try {
      const res = await authAPI.login(email, password)
      if (res.data?.access_token) {
        localStorage.setItem('access_token', res.data.access_token)
      }
      const me = await authAPI.me()
      setUser(me.data)
      setIsDemo(isDemoMode())
      return me.data
    } catch (err) {
      if (isNetworkError(err)) {
        // Fallback в демо-режим
        const fallbackUser = demoAuth.login(email, password)
        setUser(fallbackUser.user)
        setIsDemo(true)
        setBackendUp(false)
        return fallbackUser.user
      }
      throw err
    }
  }

  const enterDemoMode = () => {
    setDemoMode(true)
    setIsDemo(true)
    const demoUser = demoAuth.me()
    setUser(demoUser)
    return demoUser
  }

  const exitDemoMode = async () => {
    setDemoMode(false)
    setIsDemo(false)
    localStorage.removeItem('access_token')
    setUser(null)
  }

  const logout = () => {
    localStorage.removeItem('access_token')
    setUser(null)
    setDemoMode(false)
    setIsDemo(false)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isDemo,
        backendUp,
        login,
        logout,
        enterDemoMode,
        exitDemoMode,
        refreshBackendStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
