/**
 * Application Constants
 * Centralized constants and enums to avoid duplication throughout the codebase
 */

// ============================================================================
// STATUS ENUMS
// ============================================================================

export enum HealthStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  CRITICAL = 'critical',
  WARNING = 'warning',
  ERROR = 'error',
  PENDING = 'pending',
  UNKNOWN = 'unknown'
}

export enum PodStatus {
  RUNNING = 'running',
  PENDING = 'pending',
  FAILED = 'failed',
  SUCCEEDED = 'succeeded',
  TERMINATING = 'terminating',
  UNKNOWN = 'unknown'
}

export enum NodeStatus {
  READY = 'ready',
  NOT_READY = 'notready',
  UNKNOWN = 'unknown'
}

export enum ConnectionStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  CONNECTING = 'connecting',
  DISCONNECTED = 'disconnected'
}

export enum AlertSeverity {
  CRITICAL = 'critical',
  WARNING = 'warning',
  INFO = 'info',
  SUCCESS = 'success'
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
  INITIALIZING: 'INITIALIZING...'
} as const;

export const LABELS = {
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
  LOGS: 'Logs',
  EVENTS: 'Events',
  LIVE_STREAMS: 'Live Streams',
  ANALYTICS: 'Analytics',
  INFRASTRUCTURE: 'Infrastructure',
  WORKLOADS: 'Workloads',
  SERVICE_MESH: 'Service Mesh',
  DEPLOYMENTS: 'Deployments',
  OBSERVABILITY: 'Observability'
} as const;

// ============================================================================
// API ENDPOINTS
// ============================================================================

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    ME: '/api/auth/me',
    LOGOUT: '/api/auth/logout'
  },
  METRICS: {
    CLUSTER: '/api/metrics/cluster',
    NODES: '/api/metrics/nodes',
    PODS: '/api/metrics/pods',
    HISTORY: '/api/metrics/history'
  },
  KUBERNETES: {
    PODS: '/api/k8s/pods',
    SERVICES: '/api/k8s/services',
    NODES: '/api/k8s/nodes',
    NAMESPACES: '/api/k8s/namespaces'
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
// COLOR CONSTANTS
// ============================================================================

export const COLORS = {
  // Status colors
  GREEN: '#00FF00',
  YELLOW: '#FFFF00',
  RED: '#FF0000',
  CYAN: '#00FFFF',
  WHITE: '#FFFFFF',
  BLACK: '#000000',
  
  // Chart colors
  SUCCESS: '#00ff00',
  WARNING: '#ffff00',
  ERROR: '#ff0000',
  INFO: '#00ffff',
  
  // Protocol colors (for network charts)
  HTTP: '#00FF00',
  HTTPS: '#FFFF00',
  TCP: '#00FFFF',
  UDP: '#FF00FF'
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