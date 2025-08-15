package constants

// WebSocket Message Types - matching frontend WebSocketEventType
const (
	MessageTypeHeartbeat      = "heartbeat"
	MessageTypeConnection     = "connection"
	MessageTypeMetrics        = "metrics"
	MessageTypePods           = "pods"
	MessageTypeServices       = "services"
	MessageTypeLogs           = "logs"
	MessageTypeEvents         = "events"
	MessageTypeWorkflows      = "workflows"
	MessageTypeDeployments    = "deployments"
	MessageTypeAlerts         = "alerts"
	MessageTypeGiteaWebhook   = "gitea_webhook"
	MessageTypeGithubWebhook  = "github_webhook"
	MessageTypePipelineUpdate = "pipeline_update"
)

// Log Levels - matching frontend LogLevel enum
const (
	LogLevelTrace = "trace"
	LogLevelDebug = "debug"
	LogLevelInfo  = "info"
	LogLevelWarn  = "warn"
	LogLevelError = "error"
	LogLevelFatal = "fatal"
)

// Event Severities - matching frontend EventSeverity enum
const (
	EventSeverityCritical = "critical"
	EventSeverityWarning  = "warning"
	EventSeverityInfo     = "info"
	EventSeveritySuccess  = "success"
)

// Event Categories - matching frontend EventCategory enum
const (
	EventCategoryNode     = "node"
	EventCategoryPod      = "pod"
	EventCategoryService  = "service"
	EventCategoryConfig   = "config"
	EventCategorySecurity = "security"
	EventCategoryNetwork  = "network"
	EventCategoryStorage  = "storage"
)

// Registry Types - matching frontend RegistryType enum
const (
	RegistryTypeDockerHub = "dockerhub"
	RegistryTypeGitea     = "gitea"
	RegistryTypeGitlab    = "gitlab"
	RegistryTypeGeneric   = "generic"
)

// Registry Status - matching frontend RegistryStatus enum
const (
	RegistryStatusPending   = "pending"
	RegistryStatusConnected = "connected"
	RegistryStatusError     = "error"
)

// Deployment Status - matching frontend DeploymentStatus enum
const (
	DeploymentStatusPending     = "pending"
	DeploymentStatusRunning     = "running"
	DeploymentStatusFailed      = "failed"
	DeploymentStatusUpdating    = "updating"
	DeploymentStatusTerminating = "terminating"
)

// Deployment Strategy - matching frontend DeploymentStrategy enum
const (
	DeploymentStrategyRollingUpdate = "RollingUpdate"
	DeploymentStrategyRecreate      = "Recreate"
)

// Deployment Actions - matching frontend DeploymentAction enum
const (
	DeploymentActionCreate  = "create"
	DeploymentActionUpdate  = "update"
	DeploymentActionScale   = "scale"
	DeploymentActionDelete  = "delete"
	DeploymentActionRestart = "restart"
)

// Pod Status
const (
	PodStatusRunning     = "running"
	PodStatusPending     = "pending"
	PodStatusFailed      = "failed"
	PodStatusSucceeded   = "succeeded"
	PodStatusTerminating = "terminating"
	PodStatusUnknown     = "unknown"
)

// Service Status
const (
	ServiceStatusHealthy = "healthy"
	ServiceStatusWarning = "warning"
	ServiceStatusError   = "error"
	ServiceStatusUnknown = "unknown"
)

// Circuit Breaker Status
const (
	CircuitBreakerStatusClosed   = "closed"
	CircuitBreakerStatusOpen     = "open"
	CircuitBreakerStatusHalfOpen = "half-open"
)

// Node Status
const (
	NodeStatusReady    = "ready"
	NodeStatusNotReady = "notready"
	NodeStatusUnknown  = "unknown"
)

// Common namespaces
var CommonNamespaces = []string{
	"production",
	"staging",
	"development",
	"kube-system",
	"kube-public",
	"default",
	"monitoring",
	"backup",
	"frontend",
	"backend",
	"internal",
}

// Log sources for VPS services
var LogSources = []string{
	"kubernetes-api",
	"nginx-ingress",
	"application",
	"database",
	"redis",
	"monitoring",
	"system",
}

// Default VPS configuration
const (
	DefaultVPSNode       = "vps-main"
	DefaultVPSCores      = 8
	DefaultVPSMemoryGB   = 16
	DefaultVPSStorageGB  = 200
	DefaultMaxPods       = 110
	DefaultMaxServices   = 50
	DefaultMaxNamespaces = 10
)

// API Response status codes
const (
	StatusSuccess = "success"
	StatusError   = "error"
	StatusPending = "pending"
)

// Time ranges
const (
	TimeRange5m  = "5m"
	TimeRange15m = "15m"
	TimeRange1h  = "1h"
	TimeRange6h  = "6h"
	TimeRange12h = "12h"
	TimeRange24h = "24h"
	TimeRange48h = "48h"
	TimeRange7d  = "7d"
	TimeRange30d = "30d"
)

// Default limits
const (
	DefaultLogLimit      = 200
	DefaultEventLimit    = 100
	DefaultMetricsLimit  = 100
	MaxLogLimit          = 1000
	MaxEventLimit        = 500
	MaxMetricsLimit      = 1000
	WebSocketBufferSize  = 256
	WebSocketMaxMessages = 1000
)
