/**
 * Layout — адаптивная компоновка приложения с боковой панелью
 * и поддержкой мобильных устройств (смартфоны, планшеты, десктоп).
 */
import { useState, useEffect } from 'react'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth }  from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { notesAPI, checkBackendHealth } from '../api'

/* ── SVG иконки ──────────────────────────────────────────────────────────── */
const IconGraph = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5"  r="3"/>
    <circle cx="6"  cy="12" r="3"/>
    <circle cx="18" cy="19" r="3"/>
    <line x1="8.59"  y1="13.51" x2="15.42" y2="17.49"/>
    <line x1="15.41" y1="6.51"  x2="8.59"  y2="10.49"/>
  </svg>
)
const IconNotes = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
)
const IconMic = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
    <line x1="12" y1="19" x2="12" y2="23"/>
    <line x1="8"  y1="23" x2="16" y2="23"/>
  </svg>
)
const IconLogout = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
)
const IconDoc = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
  </svg>
)
const IconMenu = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="12" x2="21" y2="12"/>
    <line x1="3" y1="6"  x2="21" y2="6"/>
    <line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
)
const IconClose = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6"  x2="6"  y2="18"/>
    <line x1="6"  y1="6"  x2="18" y2="18"/>
  </svg>
)

function ThemeIcon({ dark }) {
  return dark ? (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1"  x2="12" y2="3"/>
      <line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22"   x2="5.64" y2="5.64"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1"  y1="12" x2="3"  y2="12"/>
      <line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64"  y2="18.36"/>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  ) : (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  )
}

const NAV = [
  { to: '/',         end: true,  Icon: IconGraph, label: 'Knowledge Graph' },
  { to: '/notes',    end: false, Icon: IconNotes, label: 'Notes'           },
  { to: '/recorder', end: false, Icon: IconMic,   label: 'Transcription'   },
]

export default function Layout() {
  const { user, logout, isDemo, exitDemoMode } = useAuth()
  const { dark, toggle }    = useTheme()
  const navigate            = useNavigate()
  const location            = useLocation()

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [pulse, setPulse]                   = useState(false)
  const [recentNotes, setRecentNotes]       = useState([])
  const [checkingBackend, setChecking]      = useState(false)
  const [toastMessage, setToastMessage]     = useState('')

  // Закрывать мобильное меню при переходе по роутам
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  const displayName = user?.name?.trim() || (user?.email ? user.email.split('@')[0] : 'User')

  useEffect(() => {
    const loadSidebarData = async () => {
      try {
        const res = await notesAPI.list()
        const nList = res.data || []
        setRecentNotes(nList.slice(0, 8))
      } catch { /* silent */ }
    }

    loadSidebarData()

    const onNoteSaved = () => loadSidebarData()
    window.addEventListener('aether:notes-changed', onNoteSaved)
    window.addEventListener('aether:demo-mode', onNoteSaved)
    return () => {
      window.removeEventListener('aether:notes-changed', onNoteSaved)
      window.removeEventListener('aether:demo-mode', onNoteSaved)
    }
  }, [isDemo])

  const handleThemeToggle = () => {
    toggle()
    setPulse(true)
    setTimeout(() => setPulse(false), 600)
  }

  const handleReconnect = async () => {
    setChecking(true)
    const alive = await checkBackendHealth()
    setChecking(false)

    if (alive) {
      await exitDemoMode()
      window.location.reload()
    } else {
      setToastMessage('Backend is still unreachable. Continuing in Demo Mode.')
      setTimeout(() => setToastMessage(''), 3500)
    }
  }

  // Общий контент сайдбара
  const sidebarContent = (
    <div className="flex flex-col h-full select-none">
      {/* Header профиля */}
      <div className="p-3.5 border-b border-th-border flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs bg-th-accent text-white shadow-sm shrink-0">
            {displayName[0]?.toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-bold tracking-tight text-th-text truncate leading-tight">
              Aether PKM
            </p>
            <p className="text-[11px] font-medium text-th-accent truncate mt-0.5" title={displayName}>
              {displayName}
            </p>
          </div>
        </div>

        {/* Кнопка закрытия только на мобильных */}
        <button
          onClick={() => setMobileMenuOpen(false)}
          className="md:hidden p-1.5 rounded-lg text-th-muted hover:text-th-text hover:bg-th-hover transition-colors"
          title="Close menu"
        >
          <IconClose />
        </button>
      </div>

      {/* Индикатор статуса соединения / режима */}
      <div className="px-3.5 py-1.5 border-b border-th-border bg-th-bg/40 flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              isDemo ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
            }`}
          />
          <span className="truncate font-medium text-th-muted">
            {isDemo ? 'Demo Mode (Offline)' : 'Live API'}
          </span>
        </div>
        {isDemo && (
          <button
            onClick={handleReconnect}
            disabled={checkingBackend}
            className="text-[10px] px-1.5 py-0.5 rounded text-th-accent hover:bg-th-hover transition-colors font-semibold shrink-0 cursor-pointer"
            title="Check if backend server is available"
          >
            {checkingBackend ? '...' : 'Check'}
          </button>
        )}
      </div>

      {/* Основная навигация */}
      <div className="px-2 py-3 space-y-0.5">
        {NAV.map(({ to, end, Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-2.5 py-2 md:py-1.5 rounded-lg text-[13px] transition-colors
               ${isActive
                 ? 'bg-th-hover text-th-text font-semibold'
                 : 'text-th-muted hover:bg-th-hover hover:text-th-text'}`
            }
          >
            {({ isActive }) => (
              <>
                <span className={isActive ? 'text-th-accent' : 'opacity-70'}><Icon /></span>
                <span className="flex-1 truncate">{label}</span>
                {isActive && dark && (
                  <span className="w-1.5 h-1.5 rounded-full bg-th-accent" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>

      {/* ── Раздел: Недавние заметки ─────────────────────────────── */}
      <div className="px-3 pt-3 pb-2 flex-1 overflow-y-auto">
        <p className="text-[10px] font-bold uppercase tracking-wider text-th-muted mb-2 px-1 opacity-70">
          Recent Pages
        </p>

        <div className="space-y-0.5">
          {recentNotes.length === 0 ? (
            <p className="text-[11px] text-th-muted px-1 py-1 italic opacity-60">
              No pages yet
            </p>
          ) : (
            recentNotes.map((note) => (
              <button
                key={note.id}
                onClick={() => {
                  setMobileMenuOpen(false)
                  navigate('/notes')
                }}
                className="flex items-center gap-2 w-full px-2 py-1.5 rounded text-left text-[12px] text-th-muted hover:text-th-text hover:bg-th-hover transition-colors group cursor-pointer"
              >
                <span className="opacity-50 group-hover:opacity-100 group-hover:text-th-accent transition-opacity">
                  <IconDoc />
                </span>
                <span className="truncate">{note.title || 'Untitled'}</span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Нижний блок: Переключатель темы + Выход */}
      <div className="p-3 border-t border-th-border space-y-1">
        {/* Theme toggle */}
        <button
          onClick={handleThemeToggle}
          className={`flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-lg text-[12px] font-medium transition-all cursor-pointer ${pulse ? 'theme-toggle-active' : ''}`}
          style={{
            background: dark ? 'rgba(249,115,22,.12)' : 'var(--th-hover)',
            color: dark ? 'var(--th-accent)' : 'var(--th-muted)',
            border: dark ? '1px solid rgba(249,115,22,.25)' : '1px solid var(--th-border)',
          }}
        >
          <ThemeIcon dark={dark} />
          <span>{dark ? 'Dark Mode' : 'Light Mode'}</span>
          <span
            className="ml-auto w-7 h-4 rounded-full relative"
            style={{ background: dark ? 'var(--th-accent)' : 'var(--th-border)' }}
          >
            <span
              className="absolute top-0.5 w-3 h-3 rounded-full bg-white"
              style={{
                left: dark ? '14px' : '2px',
                transition: 'left 0.25s cubic-bezier(.4,0,.2,1)',
                boxShadow: '0 1px 3px rgba(0,0,0,.3)',
              }}
            />
          </span>
        </button>

        {/* Logout */}
        <button
          onClick={logout}
          className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-[12px] text-th-muted hover:text-th-danger hover:bg-th-hover transition-colors cursor-pointer"
        >
          <IconLogout />
          <span>Sign out</span>
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-th-bg text-th-text">
      {/* ── Мобильный верхний бар (виден только на экранах < 768px) ── */}
      <header className="md:hidden flex items-center justify-between px-3.5 py-2.5 border-b border-th-border bg-th-sidebar shrink-0 z-30">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-1.5 rounded-lg text-th-muted hover:text-th-text hover:bg-th-hover transition-colors"
            title="Open menu"
            aria-label="Open menu"
          >
            <IconMenu />
          </button>
          <span className="font-bold text-[14px] tracking-tight text-th-text">
            Aether PKM
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isDemo && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-500 border border-amber-500/30">
              Demo
            </span>
          )}
          <button
            onClick={handleThemeToggle}
            className="p-1.5 rounded-lg text-th-muted hover:text-th-text hover:bg-th-hover transition-colors"
            title="Toggle theme"
          >
            <ThemeIcon dark={dark} />
          </button>
        </div>
      </header>

      {/* ── Десктопный постоянный сайдбар (md:flex) ── */}
      <aside className="hidden md:flex md:w-56 lg:w-60 shrink-0 flex-col border-r bg-th-sidebar border-th-border">
        {sidebarContent}
      </aside>

      {/* ── Мобильный выезжающий сайдбар (Drawer + Backdrop) ── */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer panel */}
          <div className="relative w-64 max-w-[80vw] h-full bg-th-sidebar border-r border-th-border shadow-2xl z-10 flex flex-col animate-slide-right">
            {sidebarContent}
          </div>
        </div>
      )}

      {/* ── Основная рабочая зона ────────────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden bg-th-bg text-th-text relative min-w-0">
        {/* Верхний баннер при Demo Mode */}
        {isDemo && (
          <div className="shrink-0 px-3 sm:px-4 py-1.5 bg-amber-500/10 border-b border-amber-500/20 flex flex-wrap items-center justify-between gap-1 text-[11px] sm:text-[12px] text-amber-600 dark:text-amber-400 select-none">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
              <span className="truncate">
                <strong>Demo Mode:</strong> Backend offline. Data saved in localStorage.
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-auto">
              <button
                onClick={handleReconnect}
                disabled={checkingBackend}
                className="px-2 py-0.5 rounded bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-[10px] sm:text-[11px] font-semibold transition-colors cursor-pointer"
              >
                {checkingBackend ? 'Checking…' : 'Reconnect'}
              </button>
            </div>
          </div>
        )}

        {/* Уведомление при проверке статуса */}
        {toastMessage && (
          <div className="absolute top-10 right-4 z-50 px-3.5 py-2 rounded-lg bg-th-card border border-th-border shadow-lg text-[12px] text-th-text transition-all animate-fade-in">
            {toastMessage}
          </div>
        )}

        <Outlet />
      </main>
    </div>
  )
}
