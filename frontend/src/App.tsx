import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router'
import type { FC } from 'react'
import { Server, GitBranch, BarChart3, FileText, Settings as SettingsIcon, User, LogOut } from 'lucide-react'
import Dashboard from '@components/Dashboard'
import GitOps from '@components/GitOps'
import PodsView from '@components/PodsView'
import SettingsPage from '@components/Settings'
import Logs from '@components/Logs'

interface ProtectedRouteProps {
  children: React.ReactNode
  isAuthenticated: boolean
}

const ProtectedRoute: FC<ProtectedRouteProps> = ({ children, isAuthenticated }) => {
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

interface LoginPageProps {
  loginForm: { username: string; password: string }
  setLoginForm: (form: { username: string; password: string }) => void
  handleLogin: (e: React.FormEvent) => Promise<void>
  isLoading: boolean
  error: string | null
}

const LoginPage: FC<LoginPageProps> = ({ loginForm, setLoginForm, handleLogin, isLoading, error }) => {
  return (
    <div className="min-h-screen bg-black text-white font-mono flex items-center justify-center">
      <div className="border border-white p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6 text-center">DENSHIMON LOGIN</h1>
        
        {error && (
          <div className="border border-red-400 bg-red-900/20 p-3 mb-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">USERNAME</label>
            <input
              type="text"
              value={loginForm.username}
              onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
              className="w-full bg-black border border-white p-2 font-mono focus:outline-none focus:border-green-400"
              placeholder="admin"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm mb-1">PASSWORD</label>
            <input
              type="password"
              value={loginForm.password}
              onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
              className="w-full bg-black border border-white p-2 font-mono focus:outline-none focus:border-green-400"
              placeholder="password"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-black border border-white p-2 hover:bg-white hover:text-black transition-colors font-mono disabled:opacity-50"
          >
            {isLoading ? 'AUTHENTICATING...' : 'LOGIN'}
          </button>
        </form>
        
        <div className="mt-6 text-xs text-gray-400 text-center">
          <p>Default: admin / password</p>
        </div>
      </div>
    </div>
  )
}

interface MainAppProps {
  currentUser: string | null
  handleLogout: () => void
}

const MainApp: FC<MainAppProps> = ({ currentUser, handleLogout }) => {
  return (
    <div className="min-h-screen bg-black text-white font-mono">
      {/* Header */}
      <header className="border-b border-white">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-xl font-bold">DENSHIMON</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm">
              <User size={16} className="inline mr-1" />
              {currentUser}
            </span>
            <button
              onClick={handleLogout}
              className="text-sm hover:text-red-400 transition-colors"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      <NavigationBar />

      {/* Main Content */}
      <main>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/gitops" element={<GitOps />} />
          <Route path="/pods" element={<PodsView />} />
          <Route path="/logs" element={<Logs />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>
    </div>
  )
}

const NavigationBar: FC = () => {
  const location = useLocation()
  
  const navItems = [
    { path: '/dashboard', icon: BarChart3, label: 'Dashboard' },
    { path: '/gitops', icon: GitBranch, label: 'GitOps' },
    { path: '/pods', icon: Server, label: 'Pods' },
    { path: '/logs', icon: FileText, label: 'Logs' },
    { path: '/settings', icon: SettingsIcon, label: 'Settings' },
  ]

  return (
    <nav className="border-b border-white">
      <div className="flex">
        {navItems.map((item, index) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center space-x-2 px-6 py-4 ${
              index < navItems.length - 1 ? 'border-r border-white' : ''
            } transition-colors font-mono ${
              location.pathname === item.path
                ? 'bg-white text-black'
                : 'hover:bg-white hover:text-black'
            }`}
          >
            <item.icon size={16} />
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}

const App: FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [currentUser, setCurrentUser] = useState<string | null>(null)
  const [loginForm, setLoginForm] = useState({ username: '', password: '' })
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [isInitializing, setIsInitializing] = useState<boolean>(true)

  useEffect(() => {
    // Check if user is already authenticated
    const token = localStorage.getItem('auth_token')
    if (token) {
      // Verify the token is still valid by making a test API call
      fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      .then(response => {
        if (response.ok) {
          setIsAuthenticated(true)
          setCurrentUser(localStorage.getItem('username') || 'admin')
        } else {
          // Token is invalid, clear it
          localStorage.removeItem('auth_token')
          localStorage.removeItem('username')
          setIsAuthenticated(false)
          setCurrentUser(null)
        }
      })
      .catch(() => {
        // Network error or other issue, clear token
        localStorage.removeItem('auth_token')
        localStorage.removeItem('username')
        setIsAuthenticated(false)
        setCurrentUser(null)
      })
      .finally(() => {
        setIsInitializing(false)
      })
    } else {
      setIsInitializing(false)
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginForm),
      })

      const data = await response.json()

      if (response.ok) {
        localStorage.setItem('auth_token', data.token)
        localStorage.setItem('username', data.user.username)
        setIsAuthenticated(true)
        setCurrentUser(data.user.username)
        setError(null)
      } else {
        setError(data.error || 'Login failed')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('username')
    setIsAuthenticated(false)
    setCurrentUser(null)
  }

  // Show loading screen while checking authentication
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-black text-white font-mono flex items-center justify-center">
        <div className="text-center">
          <div className="border border-white p-8">
            <h1 className="text-xl font-bold mb-4">DENSHIMON</h1>
            <p className="text-green-400">INITIALIZING...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={
          !isAuthenticated ? (
            <LoginPage 
              loginForm={loginForm}
              setLoginForm={setLoginForm}
              handleLogin={handleLogin}
              isLoading={isLoading}
              error={error}
            />
          ) : (
            <Navigate to="/dashboard" replace />
          )
        } />
        
        <Route path="/*" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <MainApp currentUser={currentUser} handleLogout={handleLogout} />
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  )
}

export default App