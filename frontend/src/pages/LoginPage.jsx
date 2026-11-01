/**
 * LoginPage — страница входа и регистрации с возможностью быстрого
 * перехода в Demo Mode (Offline) при недоступности бэкенда.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { authAPI, isNetworkError } from '../api'

export default function LoginPage() {
  const { login, enterDemoMode } = useAuth()
  const navigate = useNavigate()

  const [mode,     setMode]     = useState('login')
  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [busy,     setBusy]     = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)

    try {
      // --- Регистрация ---
      if (mode === 'register') {
        try {
          await authAPI.register(email, password, name.trim())
        } catch (regErr) {
          if (!isNetworkError(regErr)) {
            const detail = regErr.response?.data?.detail
            setError(typeof detail === 'string' ? detail : 'Registration failed. Try a different email.')
            setBusy(false)
            return
          }
        }
      }

      // --- Вход ---
      try {
        await login(email, password)
        navigate('/')
      } catch (loginErr) {
        if (isNetworkError(loginErr)) {
          // Fallback в демо-режим
          enterDemoMode()
          navigate('/')
        } else {
          const detail = loginErr.response?.data?.detail
          setError(typeof detail === 'string' ? detail : 'Incorrect email or password.')
        }
      }
    } finally {
      setBusy(false)
    }
  }

  const handleDemoClick = () => {
    enterDemoMode()
    navigate('/')
  }

  const switchMode = () => {
    setMode((m) => (m === 'login' ? 'register' : 'login'))
    setError('')
  }

  return (
    <div className="min-h-screen flex bg-th-sidebar text-th-text">
      {/* Left — classical painting */}
      <div
        className="hidden lg:flex lg:w-1/2 bg-cover bg-center flex-col justify-end"
        style={{
          backgroundImage: `url(https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Caspar_David_Friedrich_-_Wanderer_above_the_sea_of_fog.jpg/800px-Caspar_David_Friedrich_-_Wanderer_above_the_sea_of_fog.jpg)`,
        }}
      >
        <div className="p-10 bg-gradient-to-t from-black/70 to-transparent">
          <p className="text-white text-2xl font-bold tracking-tight">Aether PKM</p>
          <p className="text-white/80 text-sm mt-1">Your personal knowledge management system</p>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 bg-th-bg">
        <div className="w-full max-w-sm">
          <h1 className="text-[1.7rem] font-bold text-th-text mb-1 tracking-tight">
            {mode === 'login' ? 'Welcome back' : 'Create account'}
          </h1>
          <p className="text-[14px] text-th-muted mb-8">
            {mode === 'login' ? 'Sign in to your workspace' : 'Start your knowledge journey'}
          </p>

          <form onSubmit={submit} className="space-y-4" autoComplete="on">
            {/* Name (only on register) */}
            {mode === 'register' && (
              <div>
                <label className="block text-[11px] font-semibold text-th-muted mb-1.5 uppercase tracking-widest">
                  Your Name
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alexander"
                  className="w-full px-3.5 py-2.5 text-[14px] text-th-text bg-th-input
                             border border-th-border rounded-lg outline-none transition
                             focus:border-th-accent focus:ring-2 focus:ring-th-accent/20
                             placeholder:text-th-muted/50"
                />
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-[11px] font-semibold text-th-muted mb-1.5 uppercase tracking-widest">
                Email
              </label>
              <input
                type="email"
                name="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3.5 py-2.5 text-[14px] text-th-text bg-th-input
                           border border-th-border rounded-lg outline-none transition
                           focus:border-th-accent focus:ring-2 focus:ring-th-accent/20
                           placeholder:text-th-muted/50"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-[11px] font-semibold text-th-muted mb-1.5 uppercase tracking-widest">
                Password
              </label>
              <input
                type="password"
                name="password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                className="w-full px-3.5 py-2.5 text-[14px] text-th-text bg-th-input
                           border border-th-border rounded-lg outline-none transition
                           focus:border-th-accent focus:ring-2 focus:ring-th-accent/20
                           placeholder:text-th-muted/50"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="px-3 py-2.5 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-[13px] text-th-danger">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={busy}
              className="w-full py-2.5 text-[14px] font-semibold bg-th-accent text-white
                         rounded-lg hover:bg-th-accentH disabled:opacity-50 transition-colors mt-2
                         shadow-sm cursor-pointer"
            >
              {busy
                ? 'Connecting…'
                : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          {/* Demo Mode Button */}
          <div className="mt-4 pt-4 border-t border-th-border/70 text-center">
            <button
              type="button"
              onClick={handleDemoClick}
              className="w-full py-2 px-3 text-[13px] font-medium text-th-muted hover:text-th-accent
                         bg-th-hover/60 hover:bg-th-hover rounded-lg border border-th-border transition-all
                         flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span>Explore in Demo Mode (Offline)</span>
            </button>
          </div>

          {/* Toggle */}
          <p className="mt-5 text-center text-[13px] text-th-muted">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={switchMode}
              className="text-th-accent hover:underline font-medium cursor-pointer"
            >
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
