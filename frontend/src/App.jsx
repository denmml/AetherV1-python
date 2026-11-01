import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth }   from './context/AuthContext'
import { ThemeProvider }           from './context/ThemeContext'
import LoginPage    from './pages/LoginPage'
import GraphPage    from './pages/GraphPage'
import RecorderPage from './pages/RecorderPage'
import NotesPage    from './pages/NotesPage'
import Layout       from './components/Layout'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center text-th-muted text-sm bg-th-bg">
      Loading…
    </div>
  )
  return user ? children : <Navigate to="/login" replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index           element={<GraphPage />}    />
        <Route path="notes"    element={<NotesPage />}    />
        <Route path="recorder" element={<RecorderPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ThemeProvider>
  )
}
