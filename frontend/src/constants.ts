export enum Status {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  CRITICAL = 'critical',
  WARNING = 'warning',
  ERROR = 'error',
  INFO = 'info',
  SUCCESS = 'success',
  PENDING = 'pending',
  PROGRESSING = 'progressing',
  UNKNOWN = 'unknown',
  SUSPENDED = 'suspended',
  MISSING = 'missing',
  DOWN = 'down'
}

export enum SyncStatus {
  SYNCED = 'synced',
  OUT_OF_SYNC = 'out_of_sync',
  ERROR = Status.ERROR,
  PENDING = Status.PENDING,
  UNKNOWN = Status.UNKNOWN
}

export enum PodStatus {
  RUNNING = 'Running',
  PENDING = 'Pending',
  FAILED = 'failed',
  SUCCEEDED = 'succeeded',
  TERMINATING = 'terminating',
  UNKNOWN = Status.UNKNOWN
}

export enum NodeStatus {
  READY = 'ready',
  NOT_READY = 'notready',
  UNKNOWN = Status.UNKNOWN
}

export enum ConnectionStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  CONNECTING = 'connecting',
  DISCONNECTED = 'disconnected'
}

export enum WebSocketState {
  CONNECTING = ConnectionStatus.CONNECTING,
  CONNECTED = 'connected',
  DISCONNECTED = ConnectionStatus.DISCONNECTED,
  ERROR = Status.ERROR,
  RECONNECTING = 'reconnecting'
}

export enum TerminalMessageType {
  DATA = 'data',
  RESIZE = 'resize',
  CLOSE = 'close',
  ERROR = Status.ERROR
}

// NotificationSeverity removed - use Status enum instead

export enum FormFieldType {
  TEXT = 'text',
  PASSWORD = 'password',
  EMAIL = 'email',
  NUMBER = 'number',
  SELECT = 'select',
  CHECKBOX = 'checkbox',
  TEXTAREA = 'textarea'
}

export enum FormFieldName {
  USERNAME = 'username',
  PASSWORD = 'password',
  EMAIL = 'email',
  TOKEN = 'token',
  API_KEY = 'api_key',
  NAME = 'name',
  URL = 'url',
  TYPE = 'type',
  DESCRIPTION = 'description'
}

export enum StorageKey {
  AUTH_TOKEN = 'auth_token',
  USERNAME = 'username',
  USER_PREFERENCES = 'user_preferences',
  DASHBOARD_CONFIG = 'dashboard_config',
  THEME = 'theme',
  LAST_VISITED_TABS = 'last_visited_tabs',
  SETTINGS = 'denshimon_settings'
}

// ServiceStatus removed - use Status enum instead

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


// TIME RANGE ENUMS

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

// HTTP METHOD ENUMS

export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH',
  HEAD = 'HEAD',
  OPTIONS = 'OPTIONS'
}

// KUBERNETES ENUMS

export enum KubernetesServiceType {
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

// APPLICATION TABS AND NAVIGATION

export enum PrimaryTab {
  DEPLOYMENTS = 'deployments',
  DATABASE = 'database',
  OBSERVABILITY = 'observability',
  INFRASTRUCTURE = 'infrastructure',
  WORKLOADS = 'workloads',
  MESH = 'mesh'
}

export enum InfrastructureTab {
  OVERVIEW = 'overview',
  CONFIGURATION = 'configuration',
  BACKUP = 'backup',
  CERTIFICATES = 'certificates',
  NETWORK = 'network',
  RESOURCES = 'resources',
  STORAGE = 'storage',
  NODES = 'nodes'
}

export enum WorkloadsTab {
  OVERVIEW = 'overview',
  HIERARCHY = 'hierarchy',
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
  DEPLOYMENTS = 'deployments',
  HISTORY = 'history',
  IMAGES = 'images',
  REGISTRIES = 'registries'
}

export enum DatabaseTab {
  CONNECTIONS = 'connections',
  EXPLORER = 'explorer',
  MONITORING = 'monitoring'
}

export enum ObservabilityTab {
  SERVICE_HEALTH = 'service_health',
  LIVE_STREAMS = 'live_streams',
  LOG_DATA = 'log_data',
  ANALYTICS = 'analytics',
  SYSTEM_CHANGES = 'system_changes'
}

// NAMESPACE ENUMS

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

// TAILWIND COLOR CONSTANTS

// UNIFIED COLOR SYSTEM - Consolidated from TAILWIND_COLORS and COLORS

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
    [Status.MISSING]: 'text-gray-500',
    [Status.DOWN]: 'text-red-600'
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
    [Status.MISSING]: 'border-gray-500 text-gray-500',
    [Status.DOWN]: 'border-red-600 text-red-600'
  }
} as const;

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

export const METHOD_COLORS = {
  [HttpMethod.GET]: 'border-green-500 text-green-500',
  [HttpMethod.POST]: 'border-blue-500 text-blue-500',
  [HttpMethod.PUT]: 'border-yellow-500 text-yellow-500',
  [HttpMethod.DELETE]: 'border-red-500 text-red-500',
  [HttpMethod.PATCH]: 'border-purple-500 text-purple-500',
  [HttpMethod.HEAD]: 'border-gray-500 text-gray-500',
  [HttpMethod.OPTIONS]: 'border-gray-500 text-gray-500'
} as const;

export const DIRECTION_COLORS = {
  OUTBOUND: 'text-blue-400',
  INBOUND: 'text-green-400'
} as const;


// UI MESSAGE CONSTANTS

export const UI_MESSAGES = {
  // Loading states
  LOADING: 'LOADING...',
  LOADING_HISTORY: 'LOADING HISTORY...',
  LOADING_METRICS: 'Fetching metrics',
  LOADING_LOGS: 'Loading logs...',
  LOADING_EVENTS: 'Loading events...',
  LOADING_TIMELINE: 'Loading timeline...',
  INITIALIZING: 'INITIALIZING...',
  AUTHENTICATING: 'AUTHENTICATING...',
  
  // Status messages
  ERROR: 'ERROR',
  SUCCESS: 'SUCCESS',
  RETRY: 'RETRY',
  LIVE_UPDATES: 'LIVE UPDATES',
  
  // No data states
  NO_DATA: 'NO DATA AVAILABLE',
  CHART_NO_DATA: 'NO CHART DATA AVAILABLE',
  NETWORK_NO_DATA: 'NO NETWORK DATA AVAILABLE',
  PROTOCOL_NO_DATA: 'NO PROTOCOL DATA',
  TOP_TALKERS_NO_DATA: 'NO TOP TALKERS DATA',
  NO_CONTAINER_LOGS: 'NO LOGS FOUND',
  NO_CONTAINER_EVENTS: 'NO EVENTS FOUND',
  NO_CONTAINER_SERVICES: 'NO SERVICES FOUND',
  NO_DEPLOYMENTS: 'NO DEPLOYMENTS FOUND',
  NO_REGISTRIES: 'NO REGISTRIES CONFIGURED',
  NO_IMAGES: 'NO IMAGES FOUND',
  
  // Error states
  RENDER_ERROR: 'RENDER ERROR',
  COMPONENT_FAILED: 'Component failed to render',
  CHECK_CONSOLE: 'Check console for details',
  API_ERROR: 'API request failed',
  NETWORK_ERROR: 'Network connection error',
  AUTH_ERROR: 'Authentication failed',
  
  // Actions
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  CLOSE: 'CLOSE',
  SAVE: 'SAVE',
  SAVING: 'SAVING...',
  CANCEL: 'CANCEL',
  DELETE: 'DELETE',
  EDIT: 'EDIT',
  ADD: 'ADD',
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  SUBMIT: 'SUBMIT',
  REFRESH: 'REFRESH',
  CLEAR_FILTERS: 'CLEAR FILTERS',
  EXPAND_ALL: 'EXPAND ALL',
  COLLAPSE_ALL: 'COLLAPSE ALL',
  RESUME: 'RESUME',
  PAUSE: 'PAUSE',
  CLEAR: 'CLEAR',
  
  // Connection states
  CONNECTING: 'CONNECTING...',
  CONNECTED: 'CONNECTED',
  DISCONNECTED: 'DISCONNECTED',
  RECONNECTING: 'RECONNECTING...',
  CONNECTION_LOST: 'CONNECTION LOST',
  CONNECTION_RESTORED: 'CONNECTION RESTORED',
  LIVE: 'LIVE',
  OFFLINE: 'OFFLINE',
  UNKNOWN: 'UNKNOWN',
  REAL_TIME_UPDATES: 'Real-time updates',
  
  // Form validation
  REQUIRED_FIELD: 'This field is required',
  INVALID_EMAIL: 'Invalid email address',
  INVALID_URL: 'Invalid URL format',
  PASSWORD_TOO_SHORT: 'Password must be at least 8 characters',
  
  // Generic responses
  OPERATION_SUCCESSFUL: 'Operation completed successfully',
  OPERATION_FAILED: 'Operation failed',
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Access forbidden',
  NOT_FOUND: 'Resource not found',
  INTERNAL_ERROR: 'Internal server error',
  
  // Confirmation messages
  CONFIRM_DELETE: 'Are you sure you want to delete this item?',
  CONFIRM_LOGOUT: 'Are you sure you want to logout?',
  UNSAVED_CHANGES: 'You have unsaved changes. Continue?'
} as const;

// CONSOLIDATED UI LABELS - Merged from LABELS, QUICK_STATS_LABELS, etc.

export const UI_LABELS = {
  // Primary Navigation
  INFRASTRUCTURE: 'Infrastructure',
  WORKLOADS: 'Workloads',
  SERVICE_MESH: 'Service Mesh',
  DEPLOYMENTS: 'Deployments',
  DATABASE: 'Database',
  OBSERVABILITY: 'Observability',
  
  // Secondary Navigation
  OVERVIEW: 'Overview',
  NODES: 'Nodes',
  RESOURCES: 'Resources',
  STORAGE: 'Storage',
  HIERARCHY: 'Hierarchy',
  NETWORK: 'Network',
  CERTIFICATES: 'Certificates',
  BACKUP: 'Backup & Recovery',
  PODS: 'Pods',
  SERVICES: 'Services',
  NAMESPACES: 'Namespaces',
  TOPOLOGY: 'Topology',
  ENDPOINTS: 'Endpoints',
  TRAFFIC_FLOW: 'Traffic Flow',
  API_GATEWAY: 'API Gateway',
  REGISTRIES: 'Registries',
  IMAGES: 'Images',
  HISTORY: 'History',
  CONFIGURATION: 'Configuration',
  LOG_DATA: 'Log Data',
  SYSTEM_CHANGES: 'System Changes',
  LIVE_STREAMS: 'Live Streams',
  ANALYTICS: 'Analytics',
  SERVICE_HEALTH: 'Service Health',
  
  // Database Navigation
  CONNECTIONS: 'Connections',
  BROWSER: 'Browser',
  QUERIES: 'Queries',
  MONITORING: 'Monitoring',
  
  // Container Labels
  CONTAINER_LOGS: 'LOGS',
  CONTAINER_EVENTS: 'EVENTS',
  CONTAINER_SERVICES: 'SERVICES',
  CONTAINER_PODS: 'PODS',
  CONTAINER_NODE: 'NODE',
  CONTAINER_SERVICE_ARCHITECTURE: 'SERVICE ARCHITECTURE',
  CONTAINER_DEPLOYMENTS: 'DEPLOYMENTS',
  CONTAINER_SOURCES: 'SOURCES',
  LAST_UPDATE: 'LAST UPDATE',
  TREND: 'TREND',
  STRATEGY: 'Strategy',
  STARTED: 'Started',
  ETA: 'ETA',
  REPLICAS: 'Replicas',
  READY: 'Ready',
  UPDATED: 'Updated',
  AVAILABLE: 'Available',
  
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
  SLO_HEALTH: 'SLO Health',
  
  // Filter Labels
  ALL_LEVELS: 'ALL LEVELS',
  ALL_SOURCES: 'ALL SOURCES',
  ALL_NAMESPACES: 'ALL NAMESPACES',
  ALL_CATEGORIES: 'ALL CATEGORIES',
  ALL_SEVERITIES: 'ALL SEVERITIES',
  
  // Log Levels
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
  FATAL: 'FATAL',
  
  // Event Severities
  CRITICAL: 'CRITICAL',
  WARNING: 'WARNING',
  SUCCESS: 'SUCCESS',
  
  // Event Categories  
  NODE_CATEGORY: 'NODE',
  POD_CATEGORY: 'POD', 
  SERVICE_CATEGORY: 'SERVICE',
  CONFIG_CATEGORY: 'CONFIG',
  SECURITY_CATEGORY: 'SECURITY',
  NETWORK_CATEGORY: 'NETWORK',
  STORAGE_CATEGORY: 'STORAGE'
} as const;


// MOCK DATA AND PERFORMANCE THRESHOLDS - Consolidated

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



// DASHBOARD SETTINGS

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
    [PrimaryTab.DATABASE]: true,
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
  [PrimaryTab.DATABASE]: UI_LABELS.DATABASE,
  [PrimaryTab.OBSERVABILITY]: UI_LABELS.OBSERVABILITY,
} as const;

// API ENDPOINTS - Consolidated with base paths to reduce duplication

export const API_BASE_PATHS = {
  AUTH: '/api/auth',
  METRICS: '/api/metrics', 
  KUBERNETES: '/api/k8s',
  SERVICES: '/api/services',
  OBSERVABILITY: '/api',
  DEPLOYMENTS: '/api/deployments',
  DATABASES: '/api/databases',
  GITEA: '/api/gitea',
  GITOPS: '/api/gitops',
  BACKUP: '/api/backup',
  INFRASTRUCTURE: '/api/infrastructure',
  CERTIFICATES: '/api/certificates',
  WEBSOCKET: '/ws'
} as const;

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_BASE_PATHS.AUTH}/login`,
    ME: `${API_BASE_PATHS.AUTH}/me`,
    LOGOUT: `${API_BASE_PATHS.AUTH}/logout`,
    REFRESH: `${API_BASE_PATHS.AUTH}/refresh`,
    USERS: `${API_BASE_PATHS.AUTH}/users`,
    USER: (id: string) => `${API_BASE_PATHS.AUTH}/users/${id}`
  },
  METRICS: {
    CLUSTER: `${API_BASE_PATHS.METRICS}/cluster`,
    NODES: `${API_BASE_PATHS.METRICS}/nodes`,
    PODS: `${API_BASE_PATHS.METRICS}/pods`,
    NAMESPACES: `${API_BASE_PATHS.METRICS}/namespaces`,
    HISTORY: `${API_BASE_PATHS.METRICS}/history`,
    RESOURCES: `${API_BASE_PATHS.METRICS}/resources`,
    HEALTH: `${API_BASE_PATHS.METRICS}/health`
  },
  KUBERNETES: {
    PODS: `${API_BASE_PATHS.KUBERNETES}/pods`,
    POD: (name: string) => `${API_BASE_PATHS.KUBERNETES}/pods/${name}`,
    POD_RESTART: (name: string) => `${API_BASE_PATHS.KUBERNETES}/pods/${name}/restart`,
    POD_LOGS: (name: string) => `${API_BASE_PATHS.KUBERNETES}/pods/${name}/logs`,
    DEPLOYMENTS: `${API_BASE_PATHS.KUBERNETES}/deployments`,
    DEPLOYMENT_SCALE: (name: string) => `${API_BASE_PATHS.KUBERNETES}/deployments/${name}/scale`,
    SERVICES: `${API_BASE_PATHS.KUBERNETES}/services`,
    NODES: `${API_BASE_PATHS.KUBERNETES}/nodes`,
    NAMESPACES: `${API_BASE_PATHS.KUBERNETES}/namespaces`,
    STORAGE: `${API_BASE_PATHS.KUBERNETES}/storage`,
    EVENTS: `${API_BASE_PATHS.KUBERNETES}/events`,
    HEALTH: `${API_BASE_PATHS.KUBERNETES}/health`
  },
  SERVICES: {
    MESH: `${API_BASE_PATHS.SERVICES}/mesh`
  },
  OBSERVABILITY: {
    BASE: API_BASE_PATHS.OBSERVABILITY,
    LOG_DATA: `${API_BASE_PATHS.OBSERVABILITY}/log_data`,
    LIVE_STREAMS: `${API_BASE_PATHS.OBSERVABILITY}/live_streams`,
    LOG_ANALYTICS: `${API_BASE_PATHS.OBSERVABILITY}/log_data/analytics`,
    SYSTEM_CHANGES: `${API_BASE_PATHS.OBSERVABILITY}/system_changes`,
    SLOS: `${API_BASE_PATHS.OBSERVABILITY}/slos`,
    METRICS_HISTORY: `${API_BASE_PATHS.OBSERVABILITY}/metrics/history`
  },
  DEPLOYMENTS: {
    BASE: API_BASE_PATHS.DEPLOYMENTS,
    CREATE: API_BASE_PATHS.DEPLOYMENTS,
    PENDING: `${API_BASE_PATHS.DEPLOYMENTS}/pending`,
    BATCH_APPLY: `${API_BASE_PATHS.DEPLOYMENTS}/batch-apply`,
    REGISTRIES: `${API_BASE_PATHS.DEPLOYMENTS}/registries`,
    REGISTRY: (id: string) => `${API_BASE_PATHS.DEPLOYMENTS}/registries/${id}`,
    REGISTRY_TEST: (id: string) => `${API_BASE_PATHS.DEPLOYMENTS}/registries/${id}/test`,
    IMAGES: `${API_BASE_PATHS.DEPLOYMENTS}/images`,
    IMAGES_SEARCH: `${API_BASE_PATHS.DEPLOYMENTS}/images/search`,
    IMAGE_TAGS: (image: string) => `${API_BASE_PATHS.DEPLOYMENTS}/images/${image}/tags`,
    DEPLOYMENTS: API_BASE_PATHS.DEPLOYMENTS,
    DEPLOYMENT: (id: string) => `${API_BASE_PATHS.DEPLOYMENTS}/${id}`,
    DEPLOYMENT_SCALE: (id: string) => `${API_BASE_PATHS.DEPLOYMENTS}/${id}/scale`,
    DEPLOYMENT_RESTART: (id: string) => `${API_BASE_PATHS.DEPLOYMENTS}/${id}/restart`,
    DEPLOYMENT_PODS: (id: string) => `${API_BASE_PATHS.DEPLOYMENTS}/${id}/pods`,
    DEPLOYMENT_HISTORY: (id: string) => `${API_BASE_PATHS.DEPLOYMENTS}/${id}/history`,
    NODES: `${API_BASE_PATHS.DEPLOYMENTS}/nodes`
  },
  DATABASES: {
    BASE: API_BASE_PATHS.DATABASES,
    CONNECTIONS: `${API_BASE_PATHS.DATABASES}/connections`,
    CONNECTION: (id: string) => `${API_BASE_PATHS.DATABASES}/connections/${id}`,
    CONNECTION_CONNECT: (id: string) => `${API_BASE_PATHS.DATABASES}/connections/${id}/connect`,
    CONNECTION_DISCONNECT: (id: string) => `${API_BASE_PATHS.DATABASES}/connections/${id}/disconnect`,
    CONNECTION_TEST: `${API_BASE_PATHS.DATABASES}/connections/test`,
    DATABASES: (id: string) => `${API_BASE_PATHS.DATABASES}/connections/${id}/databases`,
    TABLES: (id: string, database: string) => `${API_BASE_PATHS.DATABASES}/connections/${id}/databases/${database}/tables`,
    COLUMNS: (id: string, database: string, table: string) => `${API_BASE_PATHS.DATABASES}/connections/${id}/databases/${database}/tables/${table}/columns`,
    QUERY: (id: string) => `${API_BASE_PATHS.DATABASES}/connections/${id}/query`,
    TABLE_DATA: (id: string, table: string) => `${API_BASE_PATHS.DATABASES}/connections/${id}/tables/${table}/data`,
    ROW_UPDATE: (id: string, table: string) => `${API_BASE_PATHS.DATABASES}/connections/${id}/tables/${table}/rows`,
    ROW_DELETE: (id: string, table: string) => `${API_BASE_PATHS.DATABASES}/connections/${id}/tables/${table}/rows`,
    ROW_INSERT: (id: string, table: string) => `${API_BASE_PATHS.DATABASES}/connections/${id}/tables/${table}/rows`,
    STATS: (id: string) => `${API_BASE_PATHS.DATABASES}/connections/${id}/stats`,
    TYPES: `${API_BASE_PATHS.DATABASES}/types`,
    SAVED_QUERIES: `${API_BASE_PATHS.DATABASES}/saved-queries`,
    SAVED_QUERY: (id: string) => `${API_BASE_PATHS.DATABASES}/saved-queries/${id}`
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
    // Base Infrastructure Repository (single repo)
    BASE_REPOSITORY: `${API_BASE_PATHS.GITOPS}/base-repository`,
    SYNC: (id: string) => `${API_BASE_PATHS.GITOPS}/repositories/${id}/sync`,
    // Repository Management
    REPOSITORIES: `${API_BASE_PATHS.GITOPS}/repositories`,
    REPOSITORY: (id: string) => `${API_BASE_PATHS.GITOPS}/repositories/${id}`,
    REPOSITORY_SYNC: (id: string) => `${API_BASE_PATHS.GITOPS}/repositories/${id}/sync`,
    MIRROR_SYNC: (id: string) => `${API_BASE_PATHS.GITOPS}/repositories/${id}/mirror-sync`,
    // Git Operations
    REPOSITORY_PULL: (id: string) => `${API_BASE_PATHS.GITOPS}/repositories/${id}/pull`,
    REPOSITORY_STATUS: (id: string) => `${API_BASE_PATHS.GITOPS}/repositories/${id}/status`,
    REPOSITORY_COMMIT: (id: string) => `${API_BASE_PATHS.GITOPS}/repositories/${id}/commit`,
    REPOSITORY_DIFF: (id: string) => `${API_BASE_PATHS.GITOPS}/repositories/${id}/diff`,
    // Application Management  
    APPLICATIONS: `${API_BASE_PATHS.GITOPS}/applications`,
    APPLICATION: (id: string) => `${API_BASE_PATHS.GITOPS}/applications/${id}`,
    APPLICATION_SYNC: (id: string) => `${API_BASE_PATHS.GITOPS}/applications/${id}/sync`,
    APPLICATION_DEPLOY: (id: string) => `${API_BASE_PATHS.GITOPS}/applications/${id}/deploy`,
    APPLICATION_ROLLBACK: (id: string) => `${API_BASE_PATHS.GITOPS}/applications/${id}/rollback`,
    APPLICATION_ROLLBACK_TARGETS: (id: string) => `${API_BASE_PATHS.GITOPS}/applications/${id}/rollback-targets`,
    APPLICATION_HISTORY: (id: string) => `${API_BASE_PATHS.GITOPS}/applications/${id}/history`,
    // Webhook Support
    WEBHOOK: `${API_BASE_PATHS.GITOPS}/webhook`,
    WEBHOOK_CONFIG: `${API_BASE_PATHS.GITOPS}/webhook/config`,
    // Deployment History
    DEPLOYMENT_HISTORY: `${API_BASE_PATHS.GITOPS}/deployments`,
    DEPLOYMENT_HISTORY_BY_APP: (applicationId: string) => `${API_BASE_PATHS.GITOPS}/deployments?application_id=${applicationId}`,
    DEPLOYMENT: (id: string) => `${API_BASE_PATHS.GITOPS}/deployments/${id}`,
    // Manifest and Template Management
    MANIFESTS_GENERATE: `${API_BASE_PATHS.GITOPS}/manifests/generate`,
    MANIFESTS_VALIDATE: `${API_BASE_PATHS.GITOPS}/manifests/validate`,
    MANIFESTS_TYPES: `${API_BASE_PATHS.GITOPS}/manifests/types`,
    TEMPLATES: `${API_BASE_PATHS.GITOPS}/templates`,
    TEMPLATE: (id: string) => `${API_BASE_PATHS.GITOPS}/templates/${id}`,
    // Monitoring and Alerts
    HEALTH_METRICS: `${API_BASE_PATHS.GITOPS}/health/metrics`,
    HEALTH_CHECK: `${API_BASE_PATHS.GITOPS}/health/check`,
    ALERTS: `${API_BASE_PATHS.GITOPS}/alerts`,
    ALERT_ACKNOWLEDGE: `${API_BASE_PATHS.GITOPS}/alerts/acknowledge`,
    ALERT_RESOLVE: `${API_BASE_PATHS.GITOPS}/alerts/resolve`,
    // Sync Operations
    SYNC_STATUS: `${API_BASE_PATHS.GITOPS}/sync/status`,
    SYNC_START: `${API_BASE_PATHS.GITOPS}/sync/start`,
    SYNC_FORCE: `${API_BASE_PATHS.GITOPS}/sync/force`,
  },
  BACKUP: {
    BASE: API_BASE_PATHS.BACKUP,
    JOBS: `${API_BASE_PATHS.BACKUP}/jobs`,
    HISTORY: `${API_BASE_PATHS.BACKUP}/history`,
    STORAGE: `${API_BASE_PATHS.BACKUP}/storage`,
    STATISTICS: `${API_BASE_PATHS.BACKUP}/statistics`,
    RECOVERIES_ACTIVE: `${API_BASE_PATHS.BACKUP}/recoveries/active`,
    ALERTS: `${API_BASE_PATHS.BACKUP}/alerts`,
    JOB: (id: string) => `${API_BASE_PATHS.BACKUP}/jobs/${id}`,
    JOB_RUN: (id: string) => `${API_BASE_PATHS.BACKUP}/jobs/${id}/run`,
    JOB_CANCEL: (id: string) => `${API_BASE_PATHS.BACKUP}/jobs/${id}/cancel`,
    VERIFY: (id: string) => `${API_BASE_PATHS.BACKUP}/backups/${id}/verify`,
    RECOVERY: (id: string) => `${API_BASE_PATHS.BACKUP}/backups/${id}/recover`,
    DELETE: (id: string) => `${API_BASE_PATHS.BACKUP}/backups/${id}`,
    SCHEDULE: (id: string) => `${API_BASE_PATHS.BACKUP}/jobs/${id}/schedule`
  },
  INFRASTRUCTURE: {
    BASE: API_BASE_PATHS.INFRASTRUCTURE,
    SERVICES: `${API_BASE_PATHS.INFRASTRUCTURE}/services`,
    STATUS: `${API_BASE_PATHS.INFRASTRUCTURE}/status`,
    ALERTS: `${API_BASE_PATHS.INFRASTRUCTURE}/alerts`,
    ALERT_ACKNOWLEDGE: (alertId: string) => `${API_BASE_PATHS.INFRASTRUCTURE}/alerts/${alertId}/acknowledge`,
    REFRESH: `${API_BASE_PATHS.INFRASTRUCTURE}/refresh`
  },
  CERTIFICATES: {
    BASE: API_BASE_PATHS.CERTIFICATES,
    LIST: API_BASE_PATHS.CERTIFICATES,
    STATS: `${API_BASE_PATHS.CERTIFICATES}/stats`,
    ALERTS: `${API_BASE_PATHS.CERTIFICATES}/alerts`,
    DOMAINS: `${API_BASE_PATHS.CERTIFICATES}/domains`,
    REFRESH: `${API_BASE_PATHS.CERTIFICATES}/refresh`,
    RENEW: (id: string) => `${API_BASE_PATHS.CERTIFICATES}/${id}/renew`,
    VERIFY: (id: string) => `${API_BASE_PATHS.CERTIFICATES}/${id}/verify`
  },
  WEBSOCKET: {
    BASE: API_BASE_PATHS.WEBSOCKET,
    DEFAULT_URL: 'ws://localhost:5173/ws' // Vite dev server with proxy
  }
} as const;

// WEBSOCKET EVENT TYPES

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
  PIPELINE_UPDATE = 'pipeline_update',
  // GitOps-specific events
  REPOSITORY_SYNC = 'repository_sync',
  APPLICATION_SYNC = 'application_sync',
  GIT_OPERATION = 'git_operation',
  DEPLOYMENT_STATUS = 'deployment_status',
  // Service Health events
  SERVICE_HEALTH = 'service_health',
  SERVICE_HEALTH_STATS = 'service_health_stats'
}

// GITEA ENUMS

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

// GITOPS ENUMS

export enum GitOpsRepositoryStatus {
  PENDING = Status.PENDING,
  ACTIVE = 'active',
  ERROR = Status.ERROR,
  SYNCING = 'syncing'
}

export enum GitOpsApplicationHealth {
  HEALTHY = Status.HEALTHY,
  DEGRADED = Status.DEGRADED,
  SUSPENDED = Status.SUSPENDED,
  MISSING = Status.MISSING,
  UNKNOWN = Status.UNKNOWN
}

export enum GitOpsApplicationSyncStatus {
  SYNCED = SyncStatus.SYNCED,
  OUT_OF_SYNC = SyncStatus.OUT_OF_SYNC,
  UNKNOWN = SyncStatus.UNKNOWN
}

export enum GitOpsDeploymentStatus {
  DEPLOYED = 'deployed',
  FAILED = 'failed',
  PENDING = Status.PENDING,
  ROLLED_BACK = 'rolled_back'
}

export enum GitOpsResourceType {
  DEPLOYMENT = 'Deployment',
  SERVICE = 'Service',
  INGRESS = 'Ingress',
  CONFIG_MAP = 'ConfigMap',
  HPA = 'HorizontalPodAutoscaler',
  FULL = 'Full'
}

// CHART TYPES

export enum ChartType {
  LINE = 'line',
  BAR = 'bar',
  AREA = 'area',
  PIE = 'pie',
  DONUT = 'donut',
  SCATTER = 'scatter',
  MONOTONE = 'monotone'
}

// VIEW TYPES

export enum ViewType {
  TABLE = 'table',
  CARD = 'card',
  LIST = 'list',
  GRID = 'grid'
}

// SORT DIRECTIONS

export enum SortDirection {
  ASC = 'asc',
  DESC = 'desc'
}

// LOG LEVELS AND OBSERVABILITY ENUMS

export enum LogLevel {
  TRACE = 'trace',
  DEBUG = 'debug',
  INFO = Status.INFO,
  WARN = 'warn',
  ERROR = Status.ERROR,
  FATAL = 'fatal'
}

export enum LiveStreamViewMode {
  PODS = 'pods',
  LOGS = 'logs',
  DEPLOYMENTS = 'deployments'
}

export enum DeploymentProgressStatus {
  COMPLETE = 'complete',
  PROGRESSING = Status.PROGRESSING,
  FAILED = 'failed'
}

// EventSeverity removed - use Status enum instead

export enum EventCategory {
  NODE = 'node',
  POD = 'pod',
  SERVICE = 'service',
  CONFIG = 'config',
  SECURITY = 'security',
  NETWORK = 'network',
  STORAGE = 'storage'
}

export enum LogSource {
  KUBERNETES_API = 'kubernetes-api',
  NGINX_INGRESS = 'nginx-ingress',
  APPLICATION = 'application',
  DATABASE = 'database',
  REDIS = 'redis',
  MONITORING = 'monitoring',
  SYSTEM = 'system'
}

// APPLICATION SERVICE TYPES (Mesh/Architecture)

export enum ServiceType {
  FRONTEND = 'frontend',
  BACKEND = 'backend', 
  DATABASE = 'database',
  CACHE = 'cache',
  GATEWAY = 'gateway',
  SIDECAR = 'sidecar'
}

// Kubernetes label convention for service classification
export const SERVICE_CLASSIFICATION_LABELS = {
  INFRA_SERVICE_TYPE: 'infra/service-type'
} as const;

// Label value mappings for standard Kubernetes labels to denshimon service types
export const LABEL_VALUE_MAPPINGS = {
  'frontend': ServiceType.FRONTEND,
  'ui': ServiceType.FRONTEND,
  'web': ServiceType.FRONTEND,
  'backend': ServiceType.BACKEND,
  'api': ServiceType.BACKEND,
  'server': ServiceType.BACKEND,
  'database': ServiceType.DATABASE,
  'db': ServiceType.DATABASE,
  'postgres': ServiceType.DATABASE,
  'mysql': ServiceType.DATABASE,
  'mongodb': ServiceType.DATABASE,
  'cache': ServiceType.CACHE,
  'redis': ServiceType.CACHE,
  'memcached': ServiceType.CACHE,
  'gateway': ServiceType.GATEWAY,
  'proxy': ServiceType.GATEWAY,
  'ingress': ServiceType.GATEWAY,
  'sidecar': ServiceType.SIDECAR,
  'mesh': ServiceType.SIDECAR
} as const;

export enum ServiceFilterType {
  ALL = 'all',
  FRONTEND = 'frontend',
  BACKEND = 'backend',
  DATABASE = 'database',
  CACHE = 'cache',
  GATEWAY = 'gateway'
}

// DEPLOYMENT AND REGISTRY ENUMS

export enum RegistryType {
  DOCKERHUB = 'dockerhub',
  GITEA = 'gitea',
  GITLAB = 'gitlab',
  GENERIC = 'generic'
}

export enum RegistryStatus {
  PENDING = Status.PENDING,
  CONNECTED = 'connected',
  ERROR = Status.ERROR
}

export enum DeploymentStatus {
  PENDING = Status.PENDING,
  RUNNING = 'running',
  FAILED = 'failed',
  UPDATING = 'updating',
  TERMINATING = 'terminating'
}

export enum DeploymentStrategy {
  ROLLING_UPDATE = 'RollingUpdate',
  RECREATE = 'Recreate'
}

export enum DeploymentAction {
  CREATE = 'create',
  UPDATE = 'update',
  SCALE = 'scale',
  DELETE = 'delete',
  RESTART = 'restart'
}

// GRAPH VISUALIZATION ENUMS

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
  CRITICAL = Status.CRITICAL
}

// UNIFIED COLOR SYSTEM - Consolidated colors organized by purpose

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

// GRAPH CONFIGURATION

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
    MAX_HEIGHT: 700
  }
} as const;

// SERVICE MESH ANALYSIS CONSTANTS

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

// CSS CLASS CONSTANTS

export const CSS_CLASSES = {
  FORM: {
    INPUT_BASE: 'w-full bg-black border border-white text-white px-3 py-2 font-mono focus:outline-none focus:border-green-400',
    LABEL_BASE: 'block text-sm font-mono text-gray-400 mb-2',
    BUTTON_PRIMARY: 'flex items-center space-x-2 px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-mono',
    BUTTON_SECONDARY: 'px-6 py-2 border border-white text-white hover:bg-white hover:text-black transition-colors font-mono',
    SELECT_BASE: 'w-full bg-black border border-white text-white px-3 py-2 font-mono focus:outline-none focus:border-green-400'
  }
} as const;

// CANVAS AND FONT CONSTANTS

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

// SIZE CONSTANTS

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

// KEYBOARD SHORTCUTS

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

// DEFAULT VALUES

export const DEFAULTS = {
  TIME_RANGE: TimeRange.ONE_HOUR,
  REFRESH_INTERVAL: 30000, // 30 seconds
  WEBSOCKET_RETRY_DELAY: 5000, // 5 seconds
  API_TIMEOUT: 10000, // 10 seconds
  CHART_ANIMATION_DURATION: 300,
  PAGINATION_PAGE_SIZE: 10
} as const;

// VALIDATION CONSTANTS

export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 8,
  MAX_USERNAME_LENGTH: 50,
  MAX_NAMESPACE_LENGTH: 63,
  MAX_LABEL_VALUE_LENGTH: 63
} as const;

// UTILITY FUNCTIONS FOR CONSTANTS

export const getStatusColor = (status: Status | LogLevel, type: 'text' | 'border' = 'text'): string => {
  const colorMap = type === 'text' ? STATUS_COLORS.TEXT : STATUS_COLORS.BORDER;
  return colorMap[status as keyof typeof colorMap] || (type === 'text' ? 'text-gray-500' : 'border-gray-500 text-gray-500');
};

export const LOG_LEVEL_CONFIG = {
  [LogLevel.ERROR]: { color: 'text-red-400 border-red-400 bg-red-900/10', icon: 'AlertCircle' },
  [LogLevel.WARN]: { color: 'text-yellow-400 border-yellow-400 bg-yellow-900/10', icon: 'AlertTriangle' },
  [LogLevel.INFO]: { color: 'text-blue-400 border-blue-400 bg-blue-900/10', icon: 'Info' },
  [LogLevel.DEBUG]: { color: 'text-gray-400 border-gray-400 bg-gray-900/10', icon: 'Bug' },
} as const;

export const EVENT_SEVERITY_CONFIG = {
  [Status.CRITICAL]: { color: 'border-red-500 text-red-500', icon: 'AlertCircle' },
  [Status.WARNING]: { color: 'border-yellow-500 text-yellow-500', icon: 'AlertTriangle' },
  [Status.INFO]: { color: 'border-blue-500 text-blue-500', icon: 'Info' },
  [Status.SUCCESS]: { color: 'border-green-500 text-green-500', icon: 'CheckCircle' },
} as const;

// UNIT CONSTANTS

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