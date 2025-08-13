/**
 * Application Constants
 * Centralized constants and enums to avoid duplication throughout the codebase
 */

// ============================================================================
// STATUS ENUMS
// ============================================================================

// ============================================================================
// CONSOLIDATED STATUS SYSTEM - Unified from multiple overlapping enums
// ============================================================================

/**
 * Universal status enum - consolidated from HealthStatus, AlertSeverity
 * This covers all status scenarios across the application
 */
export enum Status {
  // Health states
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  
  // Severity levels
  CRITICAL = 'critical',
  WARNING = 'warning',
  ERROR = 'error',
  
  // Informational states  
  INFO = 'info',
  SUCCESS = 'success',
  
  // Processing states
  PENDING = 'pending',
  PROGRESSING = 'progressing',
  
  // Final states
  UNKNOWN = 'unknown',
  SUSPENDED = 'suspended',
  MISSING = 'missing'
}

/**
 * Sync-specific statuses for GitOps
 */
export enum SyncStatus {
  SYNCED = 'synced',
  OUT_OF_SYNC = 'out_of_sync',
  ERROR = Status.ERROR,
  PENDING = Status.PENDING,
  UNKNOWN = Status.UNKNOWN
}

/**
 * Pod lifecycle states
 */
export enum PodStatus {
  RUNNING = 'running',
  PENDING = Status.PENDING,
  FAILED = 'failed',
  SUCCEEDED = 'succeeded',
  TERMINATING = 'terminating',
  UNKNOWN = Status.UNKNOWN
}

/**
 * Node readiness states
 */
export enum NodeStatus {
  READY = 'ready',
  NOT_READY = 'notready',
  UNKNOWN = Status.UNKNOWN
}

/**
 * Network connection states
 */
export enum ConnectionStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  CONNECTING = 'connecting',
  DISCONNECTED = 'disconnected'
}

/**
 * Service status states
 */
export enum ServiceStatus {
  HEALTHY = 'healthy',
  WARNING = 'warning',
  ERROR = 'error',
  UNKNOWN = 'unknown'
}

/**
 * Circuit breaker states
 */
export enum CircuitBreakerStatus {
  CLOSED = 'closed',
  OPEN = 'open',
  HALF_OPEN = 'half-open'
}

export enum NetworkProtocol {
  HTTP = 'HTTP',
  GRPC = 'gRPC',
  TCP = 'TCP',
  UDP = 'UDP'
}


// ============================================================================
// TIME RANGE ENUMS
// ============================================================================

export enum TimeRange {
  FIVE_MINUTES = '5m',
  FIFTEEN_MINUTES = '15m',
  ONE_HOUR = '1h',
  SIX_HOURS = '6h',
  TWELVE_HOURS = '12h',
  TWENTY_FOUR_HOURS = '24h',
  FORTY_EIGHT_HOURS = '48h',
  SEVEN_DAYS = '7d',
  THIRTY_DAYS = '30d'
}

export const TIME_RANGE_LABELS: Record<TimeRange, string> = {
  [TimeRange.FIVE_MINUTES]: '5M',
  [TimeRange.FIFTEEN_MINUTES]: '15M',
  [TimeRange.ONE_HOUR]: '1H',
  [TimeRange.SIX_HOURS]: '6H',
  [TimeRange.TWELVE_HOURS]: '12H',
  [TimeRange.TWENTY_FOUR_HOURS]: '24H',
  [TimeRange.FORTY_EIGHT_HOURS]: '48H',
  [TimeRange.SEVEN_DAYS]: '7D',
  [TimeRange.THIRTY_DAYS]: '30D'
};

export const DEFAULT_TIME_RANGES = [
  { value: TimeRange.FIVE_MINUTES, label: TIME_RANGE_LABELS[TimeRange.FIVE_MINUTES] },
  { value: TimeRange.FIFTEEN_MINUTES, label: TIME_RANGE_LABELS[TimeRange.FIFTEEN_MINUTES] },
  { value: TimeRange.ONE_HOUR, label: TIME_RANGE_LABELS[TimeRange.ONE_HOUR] },
  { value: TimeRange.SIX_HOURS, label: TIME_RANGE_LABELS[TimeRange.SIX_HOURS] },
  { value: TimeRange.TWENTY_FOUR_HOURS, label: TIME_RANGE_LABELS[TimeRange.TWENTY_FOUR_HOURS] },
  { value: TimeRange.SEVEN_DAYS, label: TIME_RANGE_LABELS[TimeRange.SEVEN_DAYS] },
  { value: TimeRange.THIRTY_DAYS, label: TIME_RANGE_LABELS[TimeRange.THIRTY_DAYS] }
];

// ============================================================================
// HTTP METHOD ENUMS
// ============================================================================

export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH',
  HEAD = 'HEAD',
  OPTIONS = 'OPTIONS'
}

// ============================================================================
// KUBERNETES ENUMS
// ============================================================================

export enum ServiceType {
  CLUSTER_IP = 'ClusterIP',
  NODE_PORT = 'NodePort',
  LOAD_BALANCER = 'LoadBalancer',
  EXTERNAL_NAME = 'ExternalName'
}

export enum StorageType {
  SSD = 'ssd',
  HDD = 'hdd',
  NVME = 'nvme'
}

export enum ReclaimPolicy {
  DELETE = 'Delete',
  RETAIN = 'Retain',
  RECYCLE = 'Recycle'
}

// ============================================================================
// APPLICATION TABS AND NAVIGATION
// ============================================================================

export enum PrimaryTab {
  INFRASTRUCTURE = 'infrastructure',
  WORKLOADS = 'workloads',
  MESH = 'mesh',
  DEPLOYMENTS = 'deployments',
  OBSERVABILITY = 'observability'
}

export enum InfrastructureTab {
  OVERVIEW = 'overview',
  NODES = 'nodes',
  RESOURCES = 'resources',
  STORAGE = 'storage',
  HIERARCHY = 'hierarchy',
  NETWORK = 'network'
}

export enum WorkloadsTab {
  OVERVIEW = 'overview',
  PODS = 'pods',
  SERVICES = 'services',
  NAMESPACES = 'namespaces'
}

export enum MeshTab {
  TOPOLOGY = 'topology',
  SERVICES = 'services',
  ENDPOINTS = 'endpoints',
  FLOWS = 'flows',
  GATEWAY = 'gateway'
}

export enum DeploymentsTab {
  APPLICATIONS = 'applications',
  REPOSITORIES = 'repositories',
  GITEA = 'gitea',
  PIPELINE = 'pipeline'
}

export enum ObservabilityTab {
  LOGS = 'logs',
  EVENTS = 'events',
  STREAMS = 'streams',
  ANALYTICS = 'analytics'
}

// ============================================================================
// NAMESPACE ENUMS
// ============================================================================

export enum CommonNamespace {
  PRODUCTION = 'production',
  STAGING = 'staging',
  DEVELOPMENT = 'development',
  KUBE_SYSTEM = 'kube-system',
  KUBE_PUBLIC = 'kube-public',
  DEFAULT = 'default',
  MONITORING = 'monitoring',
  BACKUP = 'backup',
  FRONTEND = 'frontend',
  BACKEND = 'backend',
  INTERNAL = 'internal'
}

// ============================================================================
// TAILWIND COLOR CONSTANTS
// ============================================================================

// ============================================================================
// UNIFIED COLOR SYSTEM - Consolidated from TAILWIND_COLORS and COLORS
// ============================================================================

/**
 * Status-based colors using the unified Status enum
 */
export const STATUS_COLORS = {
  TEXT: {
    [Status.CRITICAL]: 'text-red-500',
    [Status.ERROR]: 'text-red-500',
    [Status.WARNING]: 'text-yellow-500',
    [Status.SUCCESS]: 'text-green-500',
    [Status.HEALTHY]: 'text-green-500',
    [Status.INFO]: 'text-blue-500',
    [Status.PENDING]: 'text-yellow-500',
    [Status.UNKNOWN]: 'text-gray-500',
    [Status.DEGRADED]: 'text-yellow-500',
    [Status.PROGRESSING]: 'text-blue-500',
    [Status.SUSPENDED]: 'text-gray-500',
    [Status.MISSING]: 'text-gray-500'
  },
  BORDER: {
    [Status.CRITICAL]: 'border-red-500 text-red-500',
    [Status.ERROR]: 'border-red-500 text-red-500',
    [Status.WARNING]: 'border-yellow-500 text-yellow-500',
    [Status.SUCCESS]: 'border-green-500 text-green-500',
    [Status.HEALTHY]: 'border-green-500 text-green-500',
    [Status.INFO]: 'border-blue-500 text-blue-500',
    [Status.PENDING]: 'border-yellow-500 text-yellow-500',
    [Status.UNKNOWN]: 'border-gray-500 text-gray-500',
    [Status.DEGRADED]: 'border-yellow-500 text-yellow-500',
    [Status.PROGRESSING]: 'border-blue-500 text-blue-500',
    [Status.SUSPENDED]: 'border-gray-500 text-gray-500',
    [Status.MISSING]: 'border-gray-500 text-gray-500'
  }
} as const;

/**
 * Protocol-specific colors
 */
export const PROTOCOL_COLORS = {
  TEXT: {
    [NetworkProtocol.HTTP]: 'text-blue-500',
    [NetworkProtocol.GRPC]: 'text-green-500',
    [NetworkProtocol.TCP]: 'text-yellow-500',
    [NetworkProtocol.UDP]: 'text-purple-500',
    DEFAULT: 'text-gray-500'
  },
  BORDER: {
    [NetworkProtocol.HTTP]: 'border-blue-500 text-blue-500',
    [NetworkProtocol.GRPC]: 'border-green-500 text-green-500',
    [NetworkProtocol.TCP]: 'border-yellow-500 text-yellow-500',
    [NetworkProtocol.UDP]: 'border-purple-500 text-purple-500',
    DEFAULT: 'border-gray-500 text-gray-500'
  }
} as const;

/**
 * HTTP Method colors
 */
export const METHOD_COLORS = {
  [HttpMethod.GET]: 'border-green-500 text-green-500',
  [HttpMethod.POST]: 'border-blue-500 text-blue-500',
  [HttpMethod.PUT]: 'border-yellow-500 text-yellow-500',
  [HttpMethod.DELETE]: 'border-red-500 text-red-500',
  [HttpMethod.PATCH]: 'border-purple-500 text-purple-500',
  [HttpMethod.HEAD]: 'border-gray-500 text-gray-500',
  [HttpMethod.OPTIONS]: 'border-gray-500 text-gray-500'
} as const;

/**
 * Direction colors for traffic flow
 */
export const DIRECTION_COLORS = {
  OUTBOUND: 'text-blue-400',
  INBOUND: 'text-green-400'
} as const;


// ============================================================================
// UI MESSAGE CONSTANTS
// ============================================================================

export const UI_MESSAGES = {
  LOADING: 'LOADING...',
  ERROR: 'ERROR',
  SUCCESS: 'SUCCESS',
  RETRY: 'RETRY',
  NO_DATA: 'NO DATA AVAILABLE',
  LOADING_HISTORY: 'LOADING HISTORY...',
  LOADING_METRICS: 'Fetching cluster metrics',
  LIVE_UPDATES: 'LIVE UPDATES',
  CHART_NO_DATA: 'NO CHART DATA AVAILABLE',
  NETWORK_NO_DATA: 'NO NETWORK DATA AVAILABLE',
  PROTOCOL_NO_DATA: 'NO PROTOCOL DATA',
  TOP_TALKERS_NO_DATA: 'NO TOP TALKERS DATA',
  RENDER_ERROR: 'RENDER ERROR',
  COMPONENT_FAILED: 'Component failed to render',
  CHECK_CONSOLE: 'Check console for details',
  AUTHENTICATING: 'AUTHENTICATING...',
  LOGIN: 'LOGIN',
  INITIALIZING: 'INITIALIZING...',
  CLOSE: 'CLOSE'
} as const;

// ============================================================================
// CONSOLIDATED UI LABELS - Merged from LABELS, QUICK_STATS_LABELS, etc.
// ============================================================================

export const UI_LABELS = {
  // Primary Navigation
  INFRASTRUCTURE: 'Infrastructure',
  WORKLOADS: 'Workloads',
  SERVICE_MESH: 'Service Mesh',
  DEPLOYMENTS: 'Deployments',
  OBSERVABILITY: 'Observability',
  
  // Secondary Navigation
  OVERVIEW: 'Overview',
  NODES: 'Nodes',
  RESOURCES: 'Resources',
  STORAGE: 'Storage',
  HIERARCHY: 'Hierarchy',
  NETWORK: 'Network',
  PODS: 'Pods',
  SERVICES: 'Services',
  NAMESPACES: 'Namespaces',
  TOPOLOGY: 'Topology',
  ENDPOINTS: 'Endpoints',
  TRAFFIC_FLOW: 'Traffic Flow',
  API_GATEWAY: 'API Gateway',
  APPLICATIONS: 'Applications',
  REPOSITORIES: 'Repositories',
  GITEA_ACTIONS: 'Gitea Actions',
  PIPELINE: 'Pipeline',
  LOGS: 'Log Data',
  EVENTS: 'System Changes',
  LIVE_STREAMS: 'Live Streams',
  ANALYTICS: 'Analytics',
  
  // Metrics and Stats
  CPU: 'CPU',
  MEMORY: 'Memory',
  RUNNING_PODS: 'Running Pods',
  FAILED_PODS: 'Failed Pods',
  ACTIVE_SERVICES: 'Active Services',
  REQUEST_RATE: 'Request Rate',
  SUCCESS_RATE: 'Success Rate',
  P99_LATENCY: 'P99 Latency',
  RECENT_DEPLOYS: 'Recent Deploys',
  ACTIVE_ALERTS: 'Active Alerts',
  LOG_EVENTS: 'Log Events',
  ERROR_RATE: 'Error Rate',
  SLO_HEALTH: 'SLO Health'
} as const;


// ============================================================================
// MOCK DATA AND PERFORMANCE THRESHOLDS - Consolidated
// ============================================================================

export const SERVICE_IDS = [
  'svc-auth',
  'svc-api', 
  'svc-web',
  'svc-db',
  'svc-cache',
  'svc-gateway'
] as const;

export const MOCK_DATA = {
  WORKLOADS: {
    DEPLOYMENT_COUNT: 12,
    SERVICE_COUNT: 8,
    NAMESPACE_COUNT: 5,
  },
  MESH: {
    ACTIVE_SERVICES: 15,
    REQUEST_RATE: 2450, // requests per minute
    SUCCESS_RATE: 99.2, // percentage
    P99_LATENCY: 85, // milliseconds
  },
  DEPLOYMENTS: {
    TOTAL_APPLICATIONS: 8,
    REPOSITORIES: 5,
    RECENT_DEPLOYMENTS: 12, // last 24h
    SUCCESS_RATE: 94.5, // percentage
  },
  OBSERVABILITY: {
    ACTIVE_ALERTS: 3,
    LOG_EVENTS_PER_MIN: 1250,
    ERROR_RATE: 2.8, // percentage
    SLO_HEALTH: 98.5, // percentage of SLOs met
  },
} as const;

export const THRESHOLDS = {
  CPU: { WARNING: 80, CRITICAL: 95 },
  MEMORY: { WARNING: 80, CRITICAL: 95 },
  ERROR_RATE: { HEALTHY: 1, WARNING: 5 },
  SUCCESS_RATE: { HEALTHY: 99, WARNING: 95 },
  DEPLOYMENT_SUCCESS_RATE: { HEALTHY: 95, WARNING: 80 },
  LATENCY: { HEALTHY: 100, WARNING: 500 },
  REQUEST_RATE: { HEALTHY: 1000, WARNING: 100 },
  LOG_EVENTS: { MIN_HEALTHY: 500, MAX_HEALTHY: 5000, MIN_WARNING: 100 },
  ALERTS: { HEALTHY: 0, WARNING: 5 },
  SLO_HEALTH: { HEALTHY: 99, WARNING: 95 },
  RECENT_DEPLOYMENTS: { HEALTHY: 5, WARNING: 1 },
} as const;



// ============================================================================
// DASHBOARD SETTINGS
// ============================================================================

export const DASHBOARD_SECTIONS = {
  QUICK_STATS: 'quickStats',
  SECONDARY_TABS: 'secondaryTabs',
  BREADCRUMBS: 'breadcrumbs',
  LIVE_UPDATES_INDICATOR: 'liveUpdatesIndicator',
  TIME_RANGE_SELECTOR: 'timeRangeSelector',
  SEARCH_BAR: 'searchBar',
  KEYBOARD_SHORTCUTS: 'keyboardShortcuts',
  WEBSOCKET_STATUS: 'websocketStatus',
  NOTIFICATIONS: 'notifications'
} as const;

export const DEFAULT_DASHBOARD_CONFIG = {
  sections: {
    [DASHBOARD_SECTIONS.QUICK_STATS]: true,
    [DASHBOARD_SECTIONS.SECONDARY_TABS]: true,
    [DASHBOARD_SECTIONS.BREADCRUMBS]: true,
    [DASHBOARD_SECTIONS.LIVE_UPDATES_INDICATOR]: true,
    [DASHBOARD_SECTIONS.TIME_RANGE_SELECTOR]: true,
    [DASHBOARD_SECTIONS.SEARCH_BAR]: true,
    [DASHBOARD_SECTIONS.KEYBOARD_SHORTCUTS]: true,
    [DASHBOARD_SECTIONS.WEBSOCKET_STATUS]: true,
    [DASHBOARD_SECTIONS.NOTIFICATIONS]: true,
  },
  tabs: {
    [PrimaryTab.INFRASTRUCTURE]: true,
    [PrimaryTab.WORKLOADS]: true,
    [PrimaryTab.MESH]: true,
    [PrimaryTab.DEPLOYMENTS]: true,
    [PrimaryTab.OBSERVABILITY]: true,
  }
} as const;

export const DASHBOARD_SECTION_LABELS = {
  [DASHBOARD_SECTIONS.QUICK_STATS]: 'Status Overview',
  [DASHBOARD_SECTIONS.SECONDARY_TABS]: 'Sub Navigation',
  [DASHBOARD_SECTIONS.BREADCRUMBS]: 'Path Navigation',
  [DASHBOARD_SECTIONS.LIVE_UPDATES_INDICATOR]: 'Live Status',
  [DASHBOARD_SECTIONS.TIME_RANGE_SELECTOR]: 'Time Controls',
  [DASHBOARD_SECTIONS.SEARCH_BAR]: 'Search Interface',
  [DASHBOARD_SECTIONS.KEYBOARD_SHORTCUTS]: 'Hotkeys',
  [DASHBOARD_SECTIONS.WEBSOCKET_STATUS]: 'Connection Status',
  [DASHBOARD_SECTIONS.NOTIFICATIONS]: 'Alert Notifications',
} as const;

export const DASHBOARD_TAB_LABELS = {
  [PrimaryTab.INFRASTRUCTURE]: UI_LABELS.INFRASTRUCTURE,
  [PrimaryTab.WORKLOADS]: UI_LABELS.WORKLOADS,
  [PrimaryTab.MESH]: UI_LABELS.SERVICE_MESH,
  [PrimaryTab.DEPLOYMENTS]: UI_LABELS.DEPLOYMENTS,
  [PrimaryTab.OBSERVABILITY]: UI_LABELS.OBSERVABILITY,
} as const;

// ============================================================================
// API ENDPOINTS - Consolidated with base paths to reduce duplication
// ============================================================================

export const API_BASE_PATHS = {
  AUTH: '/api/auth',
  METRICS: '/api/metrics',
  KUBERNETES: '/api/k8s',
  GITEA: '/api/gitea',
  GITOPS: '/api/gitops',
  WEBSOCKET: '/ws'
} as const;

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_BASE_PATHS.AUTH}/login`,
    ME: `${API_BASE_PATHS.AUTH}/me`,
    LOGOUT: `${API_BASE_PATHS.AUTH}/logout`
  },
  METRICS: {
    CLUSTER: `${API_BASE_PATHS.METRICS}/cluster`,
    NODES: `${API_BASE_PATHS.METRICS}/nodes`,
    PODS: `${API_BASE_PATHS.METRICS}/pods`,
    NAMESPACES: `${API_BASE_PATHS.METRICS}/namespaces`,
    HISTORY: `${API_BASE_PATHS.METRICS}/history`
  },
  KUBERNETES: {
    PODS: `${API_BASE_PATHS.KUBERNETES}/pods`,
    SERVICES: `${API_BASE_PATHS.KUBERNETES}/services`,
    NODES: `${API_BASE_PATHS.KUBERNETES}/nodes`,
    NAMESPACES: `${API_BASE_PATHS.KUBERNETES}/namespaces`
  },
  GITEA: {
    BASE: API_BASE_PATHS.GITEA,
    REPOSITORIES: `${API_BASE_PATHS.GITEA}/repositories`,
    REPOSITORY: (owner: string, repo: string) => `${API_BASE_PATHS.GITEA}/repositories/${owner}/${repo}`,
    COMMITS: (owner: string, repo: string) => `${API_BASE_PATHS.GITEA}/repositories/${owner}/${repo}/commits`,
    BRANCHES: (owner: string, repo: string) => `${API_BASE_PATHS.GITEA}/repositories/${owner}/${repo}/branches`,
    PULLS: (owner: string, repo: string) => `${API_BASE_PATHS.GITEA}/repositories/${owner}/${repo}/pulls`,
    RELEASES: (owner: string, repo: string) => `${API_BASE_PATHS.GITEA}/repositories/${owner}/${repo}/releases`,
    ACTIONS_RUNS: (owner: string, repo: string) => `${API_BASE_PATHS.GITEA}/repositories/${owner}/${repo}/actions/runs`,
    DEPLOY: (owner: string, repo: string) => `${API_BASE_PATHS.GITEA}/repositories/${owner}/${repo}/deploy`,
    WEBHOOK: `${API_BASE_PATHS.GITEA}/webhook`,
    // Enhanced Gitea Actions Integration
    ACTIONS: `${API_BASE_PATHS.GITEA}/actions`,
    ACTIONS_BY_REPO: (repositoryId: string) => `${API_BASE_PATHS.GITEA}/actions?repository_id=${repositoryId}`,
    TRIGGER_ACTION: (repositoryId: string) => `${API_BASE_PATHS.GITEA}/repositories/${repositoryId}/actions/trigger`,
    ACTION_LOGS: (actionId: string) => `${API_BASE_PATHS.GITEA}/actions/${actionId}/logs`,
    // Container Images from Gitea Packages
    IMAGES: `${API_BASE_PATHS.GITEA}/packages/images`,
    IMAGES_BY_REPO: (repositoryId: string) => `${API_BASE_PATHS.GITEA}/packages/images?repository_id=${repositoryId}`,
    IMAGE: (imageId: string) => `${API_BASE_PATHS.GITEA}/packages/images/${imageId}`,
  },
  GITOPS: {
    BASE: API_BASE_PATHS.GITOPS,
    // Repository Management
    REPOSITORIES: `${API_BASE_PATHS.GITOPS}/repositories`,
    REPOSITORY: (id: string) => `${API_BASE_PATHS.GITOPS}/repositories/${id}`,
    REPOSITORY_SYNC: (id: string) => `${API_BASE_PATHS.GITOPS}/repositories/${id}/sync`,
    MIRROR_SYNC: (id: string) => `${API_BASE_PATHS.GITOPS}/repositories/${id}/mirror-sync`,
    // Application Management  
    APPLICATIONS: `${API_BASE_PATHS.GITOPS}/applications`,
    APPLICATION: (id: string) => `${API_BASE_PATHS.GITOPS}/applications/${id}`,
    APPLICATION_SYNC: (id: string) => `${API_BASE_PATHS.GITOPS}/applications/${id}/sync`,
    APPLICATION_DEPLOY: (id: string) => `${API_BASE_PATHS.GITOPS}/applications/${id}/deploy`,
    APPLICATION_ROLLBACK: (id: string) => `${API_BASE_PATHS.GITOPS}/applications/${id}/rollback`,
    // Deployment History
    DEPLOYMENT_HISTORY: `${API_BASE_PATHS.GITOPS}/deployments`,
    DEPLOYMENT_HISTORY_BY_APP: (applicationId: string) => `${API_BASE_PATHS.GITOPS}/deployments?application_id=${applicationId}`,
    DEPLOYMENT: (id: string) => `${API_BASE_PATHS.GITOPS}/deployments/${id}`,
  },
  WEBSOCKET: {
    BASE: API_BASE_PATHS.WEBSOCKET,
    DEFAULT_URL: 'ws://localhost:5173/ws' // Vite dev server with proxy
  }
} as const;

// ============================================================================
// WEBSOCKET EVENT TYPES
// ============================================================================

export enum WebSocketEventType {
  HEARTBEAT = 'heartbeat',
  CONNECTION = 'connection',
  METRICS = 'metrics',
  PODS = 'pods',
  SERVICES = 'services',
  LOGS = 'logs',
  EVENTS = 'events',
  WORKFLOWS = 'workflows',
  DEPLOYMENTS = 'deployments',
  ALERTS = 'alerts',
  GITEA_WEBHOOK = 'gitea_webhook',
  GITHUB_WEBHOOK = 'github_webhook',
  PIPELINE_UPDATE = 'pipeline_update'
}

// ============================================================================
// GITEA ENUMS
// ============================================================================

export enum GiteaPullRequestState {
  OPEN = 'open',
  CLOSED = 'closed',
  ALL = 'all'
}

export enum GiteaWorkflowStatus {
  QUEUED = 'queued',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed'
}

export enum GiteaWorkflowConclusion {
  SUCCESS = Status.SUCCESS,
  FAILURE = 'failure',
  CANCELLED = 'cancelled',
  SKIPPED = 'skipped'
}

// ============================================================================
// CHART TYPES
// ============================================================================

export enum ChartType {
  LINE = 'line',
  BAR = 'bar',
  AREA = 'area',
  PIE = 'pie',
  DONUT = 'donut',
  SCATTER = 'scatter',
  MONOTONE = 'monotone'
}

// ============================================================================
// VIEW TYPES
// ============================================================================

export enum ViewType {
  TABLE = 'table',
  CARD = 'card',
  LIST = 'list',
  GRID = 'grid'
}

// ============================================================================
// SORT DIRECTIONS
// ============================================================================

export enum SortDirection {
  ASC = 'asc',
  DESC = 'desc'
}

// ============================================================================
// LOG LEVELS
// ============================================================================

export enum LogLevel {
  TRACE = 'trace',
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal'
}

// ============================================================================
// SERVICE TYPES
// ============================================================================

export enum ServiceType {
  FRONTEND = 'frontend',
  BACKEND = 'backend', 
  DATABASE = 'database',
  CACHE = 'cache',
  GATEWAY = 'gateway',
  SIDECAR = 'sidecar'
}

export enum ServiceFilterType {
  ALL = 'all',
  FRONTEND = 'frontend',
  BACKEND = 'backend',
  DATABASE = 'database',
  CACHE = 'cache',
  GATEWAY = 'gateway'
}

// ============================================================================
// GRAPH VISUALIZATION ENUMS
// ============================================================================

export enum GraphViewMode {
  GRAPH = 'graph',
  GRID = 'grid'
}

export enum GraphVisualizationLayer {
  SERVICE_TYPES = 'serviceTypes',
  DEPENDENCY_PATHS = 'dependencyPaths',
  CRITICAL_PATH = 'criticalPath',
  SINGLE_POINTS_OF_FAILURE = 'singlePointsOfFailure',
  LATENCY_HEATMAP = 'latencyHeatmap',
  CIRCUIT_BREAKERS = 'circuitBreakers'
}

export enum LatencyCategory {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  MODERATE = 'moderate',
  SLOW = 'slow',
  CRITICAL = 'critical'
}

// ============================================================================
// UNIFIED COLOR SYSTEM - Consolidated colors organized by purpose
// ============================================================================

export const COLORS = {
  // Core color palette
  PRIMARY: {
    WHITE: '#ffffff',
    BLACK: '#000000',
    RED: '#ef4444',      // red-500
    YELLOW: '#eab308',   // yellow-500
    GREEN: '#22c55e',    // green-500
    BLUE: '#3b82f6',     // blue-500
    PURPLE: '#a855f7',   // purple-500
    ORANGE: '#f97316',   // orange-500
    CYAN: '#06b6d4',     // cyan-500
    GRAY: '#6b7280',     // gray-500
  },
  
  // Service type specific colors
  SERVICE_TYPES: {
    FRONTEND: '#10b981',   // green-500
    BACKEND: '#3b82f6',    // blue-500
    DATABASE: '#8b5cf6',   // purple-500
    CACHE: '#f97316',      // orange-500
    GATEWAY: '#06b6d4',    // cyan-500
    SIDECAR: '#6b7280',    // gray-500
  },
  
  // Status colors
  STATUS: {
    HEALTHY: '#22c55e',    // green-500
    WARNING: '#eab308',    // yellow-500
    ERROR: '#ef4444',      // red-500
    UNKNOWN: '#6b7280',    // gray-500
  },
  
  // Traffic and network colors
  TRAFFIC: {
    HEALTHY: '#00FF00',    // Matrix green
    MTLS: '#00FFFF',       // Cyan bright
    WARNING: '#eab308',    // yellow-500
    ERROR: '#ef4444',      // red-500
  },
  
  // Latency heatmap colors
  LATENCY: {
    EXCELLENT: '#22c55e',  // green-500 - < 50ms
    GOOD: '#3b82f6',       // blue-500 - 50-100ms
    MODERATE: '#eab308',   // yellow-500 - 100-200ms
    SLOW: '#f97316',       // orange-500 - 200-500ms
    CRITICAL: '#ef4444',   // red-500 - > 500ms
  },
  
  // Canvas and rendering colors with alpha variants
  CANVAS: {
    WHITE: '#ffffff',
    WHITE_80: '#ffffff80',
    WHITE_30: '#ffffff30',
    TRANSPARENT_BLACK: '#00000099',
    ERROR_RED: '#ef4444',
    ERROR_RED_60: '#ef444460',
    MTLS_GREEN_60: '#10b98160',
    ENCRYPTED_BLUE_60: '#3b82f660',
  },
  
  // Special theme colors
  THEME: {
    MATRIX_GREEN: '#00FF00',
    CYAN_BRIGHT: '#00FFFF',
    MAGENTA: '#FF00FF',
  }
} as const;

// Legacy color objects for backward compatibility (deprecated)
export const BASE_COLORS = COLORS.PRIMARY;
export const SERVICE_TYPE_COLORS = {
  [ServiceType.FRONTEND]: COLORS.SERVICE_TYPES.FRONTEND,
  [ServiceType.BACKEND]: COLORS.SERVICE_TYPES.BACKEND,
  [ServiceType.DATABASE]: COLORS.SERVICE_TYPES.DATABASE,
  [ServiceType.CACHE]: COLORS.SERVICE_TYPES.CACHE,
  [ServiceType.GATEWAY]: COLORS.SERVICE_TYPES.GATEWAY,
  [ServiceType.SIDECAR]: COLORS.SERVICE_TYPES.SIDECAR,
} as const;
export const TRAFFIC_COLORS = COLORS.TRAFFIC;
export const LATENCY_HEATMAP_COLORS = COLORS.LATENCY;

export const SERVICE_ICONS = {
  [ServiceType.FRONTEND]: '◈',
  [ServiceType.BACKEND]: '▣',
  [ServiceType.DATABASE]: '◉',
  [ServiceType.CACHE]: '◊',
  [ServiceType.GATEWAY]: '⬢',
  [ServiceType.SIDECAR]: '◆'
} as const;

// ============================================================================
// GRAPH CONFIGURATION
// ============================================================================

export const GRAPH_CONFIG = {
  NODE: {
    BASE_SIZE: 2.5,
    SCALE_FACTOR: 0.6,
    MIN_ZOOM: 0.1,
    MAX_ZOOM: 10,
    SELECTION_MULTIPLIER: 1.5,
    SPOF_MULTIPLIER: 1.3,
    FONT_SIZE: 12,
    ICON_SIZE_RATIO: 0.6,
    ICON_FONT_MULTIPLIER: 2,
    LABEL_OFFSET: 4,
    LABEL_PADDING: 2,
    ERROR_INDICATOR_OFFSET: 0.7,
    ERROR_INDICATOR_SIZE: 1.5
  },
  PHYSICS: {
    CHARGE_STRENGTH: -8,
    LINK_DISTANCE: 4,
    COOLDOWN_TICKS: 100,
    ALPHA_DECAY: 0.02,
    VELOCITY_DECAY: 0.3
  },
  RINGS: {
    CRITICAL_PATH_OFFSET: 1.5,
    CRITICAL_PATH_WIDTH: 1,
    CRITICAL_PATH_DASH: [2, 2],
    SPOF_OFFSET: 1.2,
    SPOF_WIDTH: 0.8,
    SPOF_DASH: [1, 1],
    DEPENDENCY_OFFSET: 0.8,
    DEPENDENCY_WIDTH: 0.5,
    SELECTION_OFFSET: 0.5,
    SELECTION_WIDTH_SELECTED: 0.8,
    SELECTION_WIDTH_HOVER: 0.5,
    CIRCUIT_BREAKER_OFFSET: 1.8,
    CIRCUIT_BREAKER_WIDTH: 0.8,
    CIRCUIT_BREAKER_DASH: [1.5, 1.5]
  },
  ANIMATION: {
    FRAME_INTERVAL: 50,
    PARTICLE_SIZE: 2,
    GLOW_SIZE: 4,
    AUTO_FIT_DELAY: 500,
    AUTO_FIT_PADDING: 50,
    AUTO_ROTATE_INTERVAL: 10000,
    AUTO_ROTATE_ZOOM: 1,
    AUTO_ROTATE_DURATION: 1000
  },
  TRAFFIC: {
    ERROR_THRESHOLD_HIGH: 5,
    ERROR_THRESHOLD_MEDIUM: 2,
    PARTICLE_OPACITY: '33',
    LINK_WIDTH_MULTIPLIER: 2,
    DEPENDENCY_LINK_WIDTH_MULTIPLIER: 1.5,
    MIN_LINK_WIDTH: 0.5
  },
  LATENCY: {
    EXCELLENT_THRESHOLD: 50,
    GOOD_THRESHOLD: 100,
    MODERATE_THRESHOLD: 200,
    SLOW_THRESHOLD: 500
  },
  ARROWS: {
    LENGTH: 10,
    ANGLE: Math.PI / 6,
    OFFSET: 5
  },
  DIMENSIONS: {
    DEFAULT_WIDTH: 800,
    DEFAULT_HEIGHT: 600,
    MAX_HEIGHT: 600
  }
} as const;

// ============================================================================
// SERVICE MESH ANALYSIS CONSTANTS
// ============================================================================

export const MESH_ANALYSIS = {
  SPOF_DETECTION: {
    DATABASE_CONNECTION_THRESHOLD: 2,
    GATEWAY_CONNECTION_THRESHOLD: 3,
    HIGH_TRAFFIC_THRESHOLD: 100,
    CRITICAL_ERROR_RATE: 5
  },
  CRITICAL_PATH: {
    GATEWAY_WEIGHT_MULTIPLIER: 2,
    MIN_SERVICES_FOR_ANALYSIS: 2
  },
  DEPENDENCY_ANALYSIS: {
    MAX_PATH_DEPTH: 10,
    CIRCULAR_DEPENDENCY_LIMIT: 100
  }
} as const;

// ============================================================================
// CSS CLASS CONSTANTS
// ============================================================================

export const CSS_CLASSES = {
  COMMON: {
    BORDER_WHITE: 'border-white',
    BORDER_WHITE_20: 'border-white/20',
    BORDER_WHITE_30: 'border-white/30',
    BG_BLACK: 'bg-black',
    BG_WHITE_5: 'bg-white/5',
    BG_WHITE_10: 'bg-white/10',
    TEXT_WHITE: 'text-white',
    TEXT_BLACK: 'text-black',
    FONT_MONO: 'font-mono',
    TRANSITION_COLORS: 'transition-colors'
  },
  STATUS: {
    GREEN_500: 'bg-green-500',
    YELLOW_500: 'bg-yellow-500',
    RED_500: 'bg-red-500',
    TEXT_GREEN_500: 'text-green-500',
    TEXT_YELLOW_500: 'text-yellow-500',
    TEXT_RED_500: 'text-red-500',
    TEXT_GRAY_500: 'text-gray-500'
  },
  LAYOUT: {
    FLEX: 'flex',
    FLEX_COL: 'flex-col',
    ITEMS_CENTER: 'items-center',
    JUSTIFY_CENTER: 'justify-center',
    JUSTIFY_BETWEEN: 'justify-between',
    GAP_1: 'gap-1',
    GAP_2: 'gap-2',
    SPACE_Y_1: 'space-y-1',
    SPACE_Y_2: 'space-y-2'
  },
  SIZE: {
    W_2: 'w-2',
    H_2: 'h-2',
    W_3: 'w-3',
    H_3: 'h-3',
    W_1_5: 'w-1.5',
    H_1_5: 'h-1.5',
    ROUNDED_FULL: 'rounded-full'
  }
} as const;

// ============================================================================
// CANVAS AND FONT CONSTANTS
// ============================================================================

export const CANVAS_CONSTANTS = {
  FONTS: {
    JETBRAINS_MONO: "'JetBrains Mono', monospace",
    ARIAL: 'Arial'
  },
  COLORS: COLORS.CANVAS,
  TEXT_ALIGN: {
    CENTER: 'center' as const,
    LEFT: 'left' as const,
    RIGHT: 'right' as const
  },
  TEXT_BASELINE: {
    TOP: 'top' as const,
    MIDDLE: 'middle' as const,
    BOTTOM: 'bottom' as const
  }
} as const;

// ============================================================================
// SIZE CONSTANTS
// ============================================================================

export const SIZES = {
  ICON: {
    SMALL: 14,
    MEDIUM: 16,
    LARGE: 20
  },
  CHART: {
    HEIGHT: 200,
    HEIGHT_LARGE: 400
  }
} as const;

// ============================================================================
// KEYBOARD SHORTCUTS
// ============================================================================

export const KEYBOARD_SHORTCUTS = {
  SEARCH: '/',
  SEARCH_ALT: 'Ctrl+F',
  REFRESH: 'r',
  ESCAPE: 'Escape',
  HELP: '?',
  INFRASTRUCTURE: 'i',
  WORKLOADS: 'w',
  SERVICE_MESH: 's',
  DEPLOYMENTS: 'd',
  OBSERVABILITY: 'o'
} as const;

// ============================================================================
// DEFAULT VALUES
// ============================================================================

export const DEFAULTS = {
  TIME_RANGE: TimeRange.ONE_HOUR,
  REFRESH_INTERVAL: 30000, // 30 seconds
  WEBSOCKET_RETRY_DELAY: 5000, // 5 seconds
  API_TIMEOUT: 10000, // 10 seconds
  CHART_ANIMATION_DURATION: 300,
  PAGINATION_PAGE_SIZE: 10
} as const;

// ============================================================================
// VALIDATION CONSTANTS
// ============================================================================

export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 8,
  MAX_USERNAME_LENGTH: 50,
  MAX_NAMESPACE_LENGTH: 63,
  MAX_LABEL_VALUE_LENGTH: 63
} as const;

// ============================================================================
// UNIT CONSTANTS
// ============================================================================

export const UNITS = {
  BYTES: ['B', 'KB', 'MB', 'GB', 'TB', 'PB'],
  TIME: {
    MILLISECONDS: 'ms',
    SECONDS: 's',
    MINUTES: 'm',
    HOURS: 'h',
    DAYS: 'd'
  },
  NETWORK: {
    BYTES_PER_SECOND: 'B/s',
    KILOBYTES_PER_SECOND: 'KB/s',
    MEGABYTES_PER_SECOND: 'MB/s',
    GIGABYTES_PER_SECOND: 'GB/s'
  },
  CPU: {
    MILLICORES: 'm',
    CORES: 'cores',
    PERCENTAGE: '%'
  },
  MEMORY: {
    BYTES: 'B',
    KILOBYTES: 'KB',
    MEGABYTES: 'MB',
    GIGABYTES: 'GB',
    PERCENTAGE: '%'
  }
} as const;