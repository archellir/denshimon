import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, Link } from 'react-router'
import type { FC } from 'react'
import { User, LogOut, Settings as SettingsIcon, Server, Package, Zap, GitBranch, Eye, ChevronRight, Clock, Search } from 'lucide-react'
import Dashboard from '@components/Dashboard'
import WebSocketStatus from '@components/common/WebSocketStatus'
import { initializeWebSocket } from '@services/websocket'
import './debug-mock' // Import debug script

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
  const [currentSecondaryTab, setCurrentSecondaryTab] = useState<string>('')
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('1h')
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Initialize WebSocket connection
  useEffect(() => {
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws'
    initializeWebSocket(wsUrl)
  }, [])

  const timeRanges = [
    { value: '5m', label: '5m' },
    { value: '15m', label: '15m' },
    { value: '1h', label: '1h' },
    { value: '6h', label: '6h' },
    { value: '24h', label: '24h' },
    { value: '7d', label: '7d' },
    { value: '30d', label: '30d' },
  ]
  return (
    <div className="min-h-screen bg-black text-white font-mono">
      {/* Header */}
      <header className="border-b border-white">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-xl font-bold">DENSHIMON</h1>
          <div className="flex items-center space-x-4">
            {/* Time Range Selector */}
            <div className="flex items-center space-x-2">
              <Clock size={16} />
              <select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value)}
                className="bg-black border border-white text-white text-sm font-mono px-2 py-1 focus:outline-none focus:border-green-400"
              >
                {timeRanges.map((range) => (
                  <option key={range.value} value={range.value}>
                    {range.label}
                  </option>
                ))}
              </select>
            </div>
            
            {/* WebSocket Status */}
            <WebSocketStatus />
            
            <span className="text-sm">
              <User size={16} className="inline mr-1" />
              {currentUser}
            </span>
            <button
              className="text-sm hover:text-white/70 transition-colors"
              title="Settings"
            >
              <SettingsIcon size={16} />
            </button>
            <button
              onClick={handleLogout}
              className="text-sm hover:text-red-400 transition-colors"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Primary Navigation */}
      <NavigationBar />

      {/* Breadcrumb Navigation */}
      <Breadcrumb 
        secondaryTab={currentSecondaryTab} 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Main Content */}
      <main>
        <Routes>
          <Route path="/" element={<Navigate to="/infrastructure" replace />} />
          <Route path="/infrastructure" element={<Dashboard activePrimaryTab="infrastructure" onSecondaryTabChange={setCurrentSecondaryTab} />} />
          <Route path="/workloads" element={<Dashboard activePrimaryTab="workloads" onSecondaryTabChange={setCurrentSecondaryTab} />} />
          <Route path="/mesh" element={<Dashboard activePrimaryTab="mesh" onSecondaryTabChange={setCurrentSecondaryTab} />} />
          <Route path="/deployments" element={<Dashboard activePrimaryTab="deployments" onSecondaryTabChange={setCurrentSecondaryTab} />} />
          <Route path="/observability" element={<Dashboard activePrimaryTab="observability" onSecondaryTabChange={setCurrentSecondaryTab} />} />
        </Routes>
      </main>
    </div>
  )
}

const NavigationBar: FC = () => {
  const location = useLocation()
  
  const navItems = [
    { path: '/infrastructure', icon: Server, label: 'Infrastructure' },
    { path: '/workloads', icon: Package, label: 'Workloads' },
    { path: '/mesh', icon: Zap, label: 'Service Mesh' },
    { path: '/deployments', icon: GitBranch, label: 'Deployments' },
    { path: '/observability', icon: Eye, label: 'Observability' },
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

interface BreadcrumbProps {
  secondaryTab?: string
  searchQuery: string
  onSearchChange: (query: string) => void
}

const Breadcrumb: FC<BreadcrumbProps> = ({ secondaryTab, searchQuery, onSearchChange }) => {
  const location = useLocation()
  
  const navItems = [
    { path: '/infrastructure', label: 'Infrastructure' },
    { path: '/workloads', label: 'Workloads' },
    { path: '/mesh', label: 'Service Mesh' },
    { path: '/deployments', label: 'Deployments' },
    { path: '/observability', label: 'Observability' },
  ]

  const currentItem = navItems.find(item => item.path === location.pathname)
  
  if (!currentItem) return null

  const secondaryTabLabels: Record<string, Record<string, string>> = {
    infrastructure: {
      overview: 'Overview',
      nodes: 'Nodes', 
      resources: 'Resources',
      network: 'Network'
    },
    workloads: {
      overview: 'Overview',
      pods: 'Pods',
      services: 'Services', 
      namespaces: 'Namespaces'
    },
    mesh: {
      topology: 'Topology',
      services: 'Services',
      endpoints: 'Endpoints',
      flows: 'Flows'
    },
    deployments: {
      applications: 'Applications',
      repositories: 'Repositories',
      sync: 'Sync Status'
    },
    observability: {
      logs: 'Logs',
      events: 'Events'
    }
  }

  const primaryTab = location.pathname.replace('/', '')
  const secondaryLabel = secondaryTab && secondaryTabLabels[primaryTab]?.[secondaryTab]

  return (
    <div className="bg-black border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm font-mono text-gray-400">
            <span>DENSHIMON</span>
            <ChevronRight size={14} />
            <span className="text-white">{currentItem.label}</span>
            {secondaryLabel && (
              <>
                <ChevronRight size={14} />
                <span className="text-gray-300">{secondaryLabel}</span>
              </>
            )}
          </div>
          
          {/* Global Search Bar */}
          <div className="flex items-center space-x-2">
            <Search size={14} className="text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search resources..."
              className="bg-black border border-white/30 text-white text-sm font-mono px-2 py-1 w-64 focus:outline-none focus:border-green-400 placeholder-gray-500"
            />
          </div>
        </div>
      </div>
    </div>
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