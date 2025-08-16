import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, Link, useNavigate, useSearchParams } from 'react-router'
import type { FC } from 'react'
import { User, LogOut, Settings as SettingsIcon, Server, Package, Zap, GitBranch, Database, Eye, ChevronRight, ChevronDown, Clock, Search, HelpCircle } from 'lucide-react'
import Dashboard from '@components/Dashboard'
import useWebSocketMetricsStore from '@stores/webSocketMetricsStore'
import KeyboardShortcutsModal from '@components/common/KeyboardShortcutsModal'
import DashboardSettings from '@components/DashboardSettings'
import { useKeyboardNavigation } from '@hooks/useKeyboardNavigation'
import { initializeWebSocket } from '@services/websocket'
import { DEFAULT_TIME_RANGES, TimeRange, UI_MESSAGES, API_ENDPOINTS, DASHBOARD_SECTIONS, StorageKey, PrimaryTab, UI_LABELS, InfrastructureTab, WorkloadsTab, MeshTab, DeploymentsTab, DatabaseTab, ObservabilityTab } from '@constants'
import useSettingsStore from '@stores/settingsStore'
import { setupMockApi } from '@services/mockApi'

// Setup mock API in development
if (import.meta.env.DEV) {
  setupMockApi();
}

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
        <h1 className="text-2xl font-bold mb-6 text-center">SYSTEM LOGIN</h1>
        
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
            {isLoading ? UI_MESSAGES.AUTHENTICATING : UI_MESSAGES.LOGIN}
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
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>(TimeRange.ONE_HOUR)
  const [showShortcutsModal, setShowShortcutsModal] = useState<boolean>(false)
  const [showDashboardSettings, setShowDashboardSettings] = useState<boolean>(false)
  const [showHelp, setShowHelp] = useState<boolean>(() => {
    const saved = localStorage.getItem('denshimon-show-tab-description')
    return saved ? JSON.parse(saved) : false
  })
  const navigate = useNavigate()
  const { isSectionVisible } = useSettingsStore()
  const location = useLocation()
  const [searchParams] = useSearchParams()

  // Determine if timeframe selector should be visible based on current page
  const shouldShowTimeFrameSelector = () => {
    const currentPath = location.pathname.replace('/', '')
    const currentSecondaryTab = searchParams.get('tab') || ''

    // Infrastructure tabs that need timeframe selector
    if (currentPath === PrimaryTab.INFRASTRUCTURE) {
      return [
        InfrastructureTab.OVERVIEW,
        InfrastructureTab.NETWORK,
        InfrastructureTab.RESOURCES,
        InfrastructureTab.STORAGE
      ].includes(currentSecondaryTab as InfrastructureTab)
    }

    // Workloads tabs that need timeframe selector
    if (currentPath === PrimaryTab.WORKLOADS) {
      return currentSecondaryTab === WorkloadsTab.OVERVIEW
    }

    // Observability tabs that need timeframe selector
    if (currentPath === PrimaryTab.OBSERVABILITY) {
      return [
        ObservabilityTab.LOGS,
        ObservabilityTab.ANALYTICS
      ].includes(currentSecondaryTab as ObservabilityTab)
    }

    return false
  }

  // Initialize WebSocket connection
  useEffect(() => {
    const wsUrl = import.meta.env.VITE_WS_URL || API_ENDPOINTS.WEBSOCKET.DEFAULT_URL
    initializeWebSocket(wsUrl)
  }, [])

  // Save help state to localStorage
  useEffect(() => {
    localStorage.setItem('denshimon-show-tab-description', JSON.stringify(showHelp))
  }, [showHelp])

  // Handle refresh current view
  const handleRefresh = () => {
    // Trigger a page refresh or call specific refresh methods based on current tab
    window.location.reload()
  }

  // Handle escape - close modals
  const handleEscape = () => {
    if (showShortcutsModal) {
      setShowShortcutsModal(false)
    }
  }

  // Handle tab switching
  const handleTabSwitch = (tabId: string) => {
    const tabPaths = {
      [PrimaryTab.INFRASTRUCTURE]: `/${PrimaryTab.INFRASTRUCTURE}`,
      [PrimaryTab.WORKLOADS]: `/${PrimaryTab.WORKLOADS}`,
      [PrimaryTab.MESH]: `/${PrimaryTab.MESH}`,
      [PrimaryTab.DEPLOYMENTS]: `/${PrimaryTab.DEPLOYMENTS}`,
      [PrimaryTab.DATABASE]: `/${PrimaryTab.DATABASE}`,
      [PrimaryTab.OBSERVABILITY]: `/${PrimaryTab.OBSERVABILITY}`
    }
    
    if (tabPaths[tabId as keyof typeof tabPaths]) {
      navigate(tabPaths[tabId as keyof typeof tabPaths])
    }
  }

  // Keyboard navigation setup
  useKeyboardNavigation({
    onTabSwitch: handleTabSwitch,
    onRefresh: handleRefresh,
    onSearch: () => {}, // No longer needed since we have global search
    onEscape: handleEscape,
    onEnter: () => {}, // No longer needed
    disabled: false
  })

  // Handle ? key for help modal
  useEffect(() => {
    const handleHelpKey = (e: KeyboardEvent) => {
      if (e.key === '?' && !isInputFocused()) {
        e.preventDefault()
        setShowShortcutsModal(true)
      }
    }

    document.addEventListener('keydown', handleHelpKey)
    return () => document.removeEventListener('keydown', handleHelpKey)
  }, [])

  // Handle global search navigation
  useEffect(() => {
    const handleNavigateToPrimaryTab = (event: CustomEvent) => {
      const { primaryTab, secondaryTab } = event.detail;
      
      // Navigate to the primary tab with secondary tab in URL if specified
      if (secondaryTab) {
        navigate(`/${primaryTab}?tab=${secondaryTab}`);
      } else {
        handleTabSwitch(primaryTab);
      }
    };

    window.addEventListener('navigateToPrimaryTab', handleNavigateToPrimaryTab as EventListener);
    return () => {
      window.removeEventListener('navigateToPrimaryTab', handleNavigateToPrimaryTab as EventListener);
    };
  }, [navigate]);

  // Helper to check if input is focused (duplicate from hook but needed here)
  const isInputFocused = (): boolean => {
    const activeElement = document.activeElement
    if (!activeElement) return false
    
    const tagName = activeElement.tagName.toLowerCase()
    return ['input', 'textarea', 'select'].includes(tagName) || 
           activeElement.getAttribute('contenteditable') === 'true'
  }

  const timeRanges = DEFAULT_TIME_RANGES
  return (
    <div className="min-h-screen bg-black text-white font-mono">
      {/* Header */}
      <header className="border-b border-white">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-xl font-bold">DENSHIMON</h1>
          <div className="flex items-center space-x-4">
            {/* Global Time Range Selector */}
            {isSectionVisible(DASHBOARD_SECTIONS.TIME_RANGE_SELECTOR) && shouldShowTimeFrameSelector() && (
              <div className="flex items-center space-x-2">
                <Clock size={16} />
                <div className="flex space-x-0 border border-white">
                  {timeRanges.map((range) => (
                    <button
                      key={range.value}
                      onClick={() => setSelectedTimeRange(range.value)}
                      className={`px-3 py-1 border-r border-white last:border-r-0 font-mono text-xs transition-colors ${
                        selectedTimeRange === range.value
                          ? 'bg-white text-black'
                          : 'bg-black text-white hover:bg-white hover:text-black'
                      }`}
                    >
                      {range.label.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            
            <span className="text-sm">
              <User size={16} className="inline mr-1" />
              {currentUser}
            </span>
            {isSectionVisible(DASHBOARD_SECTIONS.KEYBOARD_SHORTCUTS) && (
              <button
                onClick={() => setShowShortcutsModal(true)}
                className="text-sm hover:text-white/70 transition-colors"
                title="Keyboard Shortcuts (?)"
              >
                <HelpCircle size={16} />
              </button>
            )}
            <button
              onClick={() => setShowDashboardSettings(true)}
              className="text-sm hover:text-white/70 transition-colors"
              title="Dashboard Settings"
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
      {isSectionVisible(DASHBOARD_SECTIONS.BREADCRUMBS) && (
        <Breadcrumb 
          secondaryTab={currentSecondaryTab}
          showHelp={showHelp}
          setShowHelp={setShowHelp}
        />
      )}

      {/* Main Content */}
      <main>
        <Routes>
          <Route path="/" element={<Navigate to={`/${PrimaryTab.DEPLOYMENTS}`} replace />} />
          <Route path={`/${PrimaryTab.DEPLOYMENTS}`} element={<Dashboard activePrimaryTab={PrimaryTab.DEPLOYMENTS} onSecondaryTabChange={setCurrentSecondaryTab} timeRange={selectedTimeRange} showHelp={showHelp} />} />
          <Route path={`/${PrimaryTab.DATABASE}`} element={<Dashboard activePrimaryTab={PrimaryTab.DATABASE} onSecondaryTabChange={setCurrentSecondaryTab} timeRange={selectedTimeRange} showHelp={showHelp} />} />
          <Route path={`/${PrimaryTab.OBSERVABILITY}`} element={<Dashboard activePrimaryTab={PrimaryTab.OBSERVABILITY} onSecondaryTabChange={setCurrentSecondaryTab} timeRange={selectedTimeRange} showHelp={showHelp} />} />
          <Route path={`/${PrimaryTab.INFRASTRUCTURE}`} element={<Dashboard activePrimaryTab={PrimaryTab.INFRASTRUCTURE} onSecondaryTabChange={setCurrentSecondaryTab} timeRange={selectedTimeRange} showHelp={showHelp} />} />
          <Route path={`/${PrimaryTab.WORKLOADS}`} element={<Dashboard activePrimaryTab={PrimaryTab.WORKLOADS} onSecondaryTabChange={setCurrentSecondaryTab} timeRange={selectedTimeRange} showHelp={showHelp} />} />
          <Route path={`/${PrimaryTab.MESH}`} element={<Dashboard activePrimaryTab={PrimaryTab.MESH} onSecondaryTabChange={setCurrentSecondaryTab} timeRange={selectedTimeRange} showHelp={showHelp} />} />
        </Routes>
      </main>

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal 
        isOpen={showShortcutsModal} 
        onClose={() => setShowShortcutsModal(false)} 
      />
      
      {/* Dashboard Settings Modal */}
      <DashboardSettings 
        isOpen={showDashboardSettings} 
        onClose={() => setShowDashboardSettings(false)} 
      />
    </div>
  )
}

const NavigationBar: FC = () => {
  const location = useLocation()
  const { isTabVisible } = useSettingsStore()
  const { isConnected } = useWebSocketMetricsStore()
  
  const allNavItems = [
    { path: `/${PrimaryTab.DEPLOYMENTS}`, icon: GitBranch, label: UI_LABELS.DEPLOYMENTS, tabId: PrimaryTab.DEPLOYMENTS },
    { path: `/${PrimaryTab.DATABASE}`, icon: Database, label: UI_LABELS.DATABASE, tabId: PrimaryTab.DATABASE },
    { path: `/${PrimaryTab.OBSERVABILITY}`, icon: Eye, label: UI_LABELS.OBSERVABILITY, tabId: PrimaryTab.OBSERVABILITY },
    { path: `/${PrimaryTab.INFRASTRUCTURE}`, icon: Server, label: UI_LABELS.INFRASTRUCTURE, tabId: PrimaryTab.INFRASTRUCTURE },
    { path: `/${PrimaryTab.WORKLOADS}`, icon: Package, label: UI_LABELS.WORKLOADS, tabId: PrimaryTab.WORKLOADS },
    { path: `/${PrimaryTab.MESH}`, icon: Zap, label: UI_LABELS.SERVICE_MESH, tabId: PrimaryTab.MESH },
  ]
  
  const navItems = allNavItems.filter(item => isTabVisible(item.tabId))

  return (
    <nav className="border-b border-white">
      <div className="flex items-center justify-between">
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
        
        {/* Global WebSocket Status Indicator */}
        <div className="px-6 py-4 border-l border-white">
          <div className="flex items-center space-x-2 text-xs font-mono">
            {isConnected ? (
              <>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-400">LIVE</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-red-400">OFFLINE</span>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

interface BreadcrumbProps {
  secondaryTab?: string
  showHelp: boolean
  setShowHelp: (show: boolean) => void
}

const Breadcrumb: FC<BreadcrumbProps> = ({ secondaryTab, showHelp, setShowHelp }) => {
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { isSectionVisible } = useSettingsStore()
  
  const navItems = [
    { path: `/${PrimaryTab.DEPLOYMENTS}`, label: UI_LABELS.DEPLOYMENTS },
    { path: `/${PrimaryTab.DATABASE}`, label: UI_LABELS.DATABASE },
    { path: `/${PrimaryTab.OBSERVABILITY}`, label: UI_LABELS.OBSERVABILITY },
    { path: `/${PrimaryTab.INFRASTRUCTURE}`, label: UI_LABELS.INFRASTRUCTURE },
    { path: `/${PrimaryTab.WORKLOADS}`, label: UI_LABELS.WORKLOADS },
    { path: `/${PrimaryTab.MESH}`, label: UI_LABELS.SERVICE_MESH },
  ]

  const currentItem = navItems.find(item => item.path === location.pathname)
  
  if (!currentItem) return null

  const secondaryTabLabels: Record<string, Record<string, string>> = {
    [PrimaryTab.INFRASTRUCTURE]: {
      [InfrastructureTab.OVERVIEW]: UI_LABELS.OVERVIEW,
      [InfrastructureTab.CONFIGURATION]: UI_LABELS.CONFIGURATION,
      [InfrastructureTab.NODES]: UI_LABELS.NODES, 
      [InfrastructureTab.RESOURCES]: UI_LABELS.RESOURCES,
      [InfrastructureTab.STORAGE]: UI_LABELS.STORAGE,
      [InfrastructureTab.NETWORK]: UI_LABELS.NETWORK,
      [InfrastructureTab.CERTIFICATES]: UI_LABELS.CERTIFICATES,
      [InfrastructureTab.BACKUP]: UI_LABELS.BACKUP
    },
    [PrimaryTab.WORKLOADS]: {
      [WorkloadsTab.OVERVIEW]: UI_LABELS.OVERVIEW,
      [WorkloadsTab.HIERARCHY]: UI_LABELS.HIERARCHY,
      [WorkloadsTab.PODS]: UI_LABELS.PODS,
      [WorkloadsTab.SERVICES]: UI_LABELS.SERVICES, 
      [WorkloadsTab.NAMESPACES]: UI_LABELS.NAMESPACES
    },
    [PrimaryTab.MESH]: {
      [MeshTab.TOPOLOGY]: UI_LABELS.TOPOLOGY,
      [MeshTab.SERVICES]: UI_LABELS.SERVICES,
      [MeshTab.ENDPOINTS]: UI_LABELS.ENDPOINTS,
      [MeshTab.FLOWS]: UI_LABELS.TRAFFIC_FLOW,
      [MeshTab.GATEWAY]: UI_LABELS.API_GATEWAY
    },
    [PrimaryTab.DEPLOYMENTS]: {
      [DeploymentsTab.DEPLOYMENTS]: UI_LABELS.DEPLOYMENTS,
      [DeploymentsTab.HISTORY]: UI_LABELS.HISTORY,
      [DeploymentsTab.IMAGES]: UI_LABELS.IMAGES,
      [DeploymentsTab.REGISTRIES]: UI_LABELS.REGISTRIES
    },
    [PrimaryTab.DATABASE]: {
      [DatabaseTab.CONNECTIONS]: UI_LABELS.CONNECTIONS,
      [DatabaseTab.BROWSER]: UI_LABELS.BROWSER,
      [DatabaseTab.QUERIES]: UI_LABELS.QUERIES,
      [DatabaseTab.MONITORING]: UI_LABELS.MONITORING
    },
    [PrimaryTab.OBSERVABILITY]: {
      [ObservabilityTab.LOGS]: UI_LABELS.LOGS,
      [ObservabilityTab.EVENTS]: UI_LABELS.EVENTS,
      [ObservabilityTab.STREAMS]: UI_LABELS.LIVE_STREAMS,
      [ObservabilityTab.ANALYTICS]: UI_LABELS.ANALYTICS,
      [ObservabilityTab.SERVICE_HEALTH]: UI_LABELS.SERVICE_HEALTH
    }
  }

  const primaryTab = location.pathname.replace('/', '')
  const currentSecondaryTab = searchParams.get('tab') || secondaryTab
  const secondaryLabel = currentSecondaryTab && secondaryTabLabels[primaryTab]?.[currentSecondaryTab]

  return (
    <div className="bg-black border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm font-mono text-gray-400">
            <span>SYSTEM</span>
            <ChevronRight size={14} />
            <span className="text-white">{currentItem.label}</span>
            {secondaryLabel && (
              <>
                <ChevronRight size={14} />
                <span className="text-gray-300">{secondaryLabel}</span>
              </>
            )}
            
            {/* Help Toggle Arrow */}
            <button
              onClick={() => setShowHelp(!showHelp)}
              className="ml-2 p-1 border border-gray-600 hover:border-white/50 hover:bg-white/10 transition-colors rounded"
              title={showHelp ? "Hide tab explanations" : "Show tab explanations"}
            >
              {showHelp ? (
                <ChevronDown size={16} strokeWidth={2.5} className="text-white hover:text-gray-200" />
              ) : (
                <ChevronRight size={16} strokeWidth={2.5} className="text-white hover:text-gray-200" />
              )}
            </button>
          </div>
          
          {/* Global Search Indicator */}
          {isSectionVisible(DASHBOARD_SECTIONS.SEARCH_BAR) && (
            <div className="flex items-center space-x-2 text-sm font-mono text-gray-400">
              <Search size={14} />
              <span>Press</span>
              <kbd className="px-1 py-0.5 bg-white/10 rounded text-xs">Cmd+K</kbd>
              <span>to search</span>
            </div>
          )}
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
    const token = localStorage.getItem(StorageKey.AUTH_TOKEN)
    if (token) {
      // Verify the token is still valid by making a test API call
      fetch(API_ENDPOINTS.AUTH.ME, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      .then(response => {
        if (response.ok) {
          setIsAuthenticated(true)
          setCurrentUser(localStorage.getItem(StorageKey.USERNAME) || 'admin')
        } else {
          // Token is invalid, clear it
          localStorage.removeItem(StorageKey.AUTH_TOKEN)
          localStorage.removeItem(StorageKey.USERNAME)
          setIsAuthenticated(false)
          setCurrentUser(null)
        }
      })
      .catch(() => {
        // Network error or other issue, clear token
        localStorage.removeItem(StorageKey.AUTH_TOKEN)
        localStorage.removeItem(StorageKey.USERNAME)
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
      const response = await fetch(API_ENDPOINTS.AUTH.LOGIN, {
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
    localStorage.removeItem(StorageKey.AUTH_TOKEN)
    localStorage.removeItem(StorageKey.USERNAME)
    setIsAuthenticated(false)
    setCurrentUser(null)
  }

  // Show loading screen while checking authentication
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-black text-white font-mono flex items-center justify-center">
        <div className="text-center">
          <div className="border border-white p-8">
            <h1 className="text-xl font-bold mb-4">SYSTEM</h1>
            <p className="text-green-400">{UI_MESSAGES.INITIALIZING}</p>
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
            <Navigate to={`/${PrimaryTab.DEPLOYMENTS}`} replace />
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