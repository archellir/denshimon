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
  GITEA = 'gitea'
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
  WEBSOCKET_STATUS: 'websocketStatus'
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
    WEBHOOK: `${API_BASE_PATHS.GITEA}/webhook`
  },
  GITOPS: {
    BASE: API_BASE_PATHS.GITOPS,
    REPOSITORIES: `${API_BASE_PATHS.GITOPS}/repositories`,
    REPOSITORY: (id: string) => `${API_BASE_PATHS.GITOPS}/repositories/${id}`,
    REPOSITORY_SYNC: (id: string) => `${API_BASE_PATHS.GITOPS}/repositories/${id}/sync`,
    APPLICATIONS: `${API_BASE_PATHS.GITOPS}/applications`,
    APPLICATION: (id: string) => `${API_BASE_PATHS.GITOPS}/applications/${id}`,
    APPLICATION_SYNC: (id: string) => `${API_BASE_PATHS.GITOPS}/applications/${id}/sync`
  },
  WEBSOCKET: {
    BASE: API_BASE_PATHS.WEBSOCKET,
    DEFAULT_URL: 'ws://localhost:8080/ws'
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
  LOGS = 'logs',
  EVENTS = 'events',
  WORKFLOWS = 'workflows',
  DEPLOYMENTS = 'deployments',
  ALERTS = 'alerts'
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
// BASE COLOR PALETTE - Consolidated color system
// ============================================================================

export const BASE_COLORS = {
  // Tailwind color values
  RED: '#ef4444',    // red-500
  YELLOW: '#eab308', // yellow-500
  GREEN: '#22c55e',  // green-500
  BLUE: '#3b82f6',   // blue-500
  PURPLE: '#a855f7', // purple-500
  GRAY: '#6b7280',   // gray-500
  BLUE_400: '#60a5fa', // blue-400
  GREEN_400: '#4ade80', // green-400
  WHITE: '#ffffff',
  BLACK: '#000000',
  
  // Terminal/Matrix theme colors
  MATRIX_GREEN: '#00FF00',
  CYAN: '#00FFFF',
  MAGENTA: '#FF00FF'
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