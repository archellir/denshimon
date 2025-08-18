package constants

import (
	"reflect"
	"testing"
)

func TestWebSocketMessageTypes(t *testing.T) {
	tests := []struct {
		name     string
		constant string
		expected string
	}{
		{"heartbeat", MessageTypeHeartbeat, "heartbeat"},
		{"connection", MessageTypeConnection, "connection"},
		{"metrics", MessageTypeMetrics, "metrics"},
		{"pods", MessageTypePods, "pods"},
		{"services", MessageTypeServices, "services"},
		{"logs", MessageTypeLogs, "logs"},
		{"events", MessageTypeEvents, "events"},
		{"workflows", MessageTypeWorkflows, "workflows"},
		{"deployments", MessageTypeDeployments, "deployments"},
		{"alerts", MessageTypeAlerts, "alerts"},
		{"gitea_webhook", MessageTypeGiteaWebhook, "gitea_webhook"},
		{"github_webhook", MessageTypeGithubWebhook, "github_webhook"},
		{"pipeline_update", MessageTypePipelineUpdate, "pipeline_update"},
		{"repository_sync", MessageTypeRepositorySync, "repository_sync"},
		{"application_sync", MessageTypeApplicationSync, "application_sync"},
		{"git_operation", MessageTypeGitOperation, "git_operation"},
		{"deployment_status", MessageTypeDeploymentStatus, "deployment_status"},
		{"service_health", MessageTypeServiceHealth, "service_health"},
		{"service_health_stats", MessageTypeServiceHealthStats, "service_health_stats"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if tt.constant != tt.expected {
				t.Errorf("WebSocket message type %s = %q, want %q", tt.name, tt.constant, tt.expected)
			}
		})
	}
}

func TestLogLevels(t *testing.T) {
	tests := []struct {
		name     string
		constant string
		expected string
	}{
		{"trace", LogLevelTrace, "trace"},
		{"debug", LogLevelDebug, "debug"},
		{"info", LogLevelInfo, "info"},
		{"warn", LogLevelWarn, "warn"},
		{"error", LogLevelError, "error"},
		{"fatal", LogLevelFatal, "fatal"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if tt.constant != tt.expected {
				t.Errorf("Log level %s = %q, want %q", tt.name, tt.constant, tt.expected)
			}
		})
	}
}

func TestEventSeverities(t *testing.T) {
	tests := []struct {
		name     string
		constant string
		expected string
	}{
		{"critical", EventSeverityCritical, "critical"},
		{"warning", EventSeverityWarning, "warning"},
		{"info", EventSeverityInfo, "info"},
		{"success", EventSeveritySuccess, "success"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if tt.constant != tt.expected {
				t.Errorf("Event severity %s = %q, want %q", tt.name, tt.constant, tt.expected)
			}
		})
	}
}

func TestEventCategories(t *testing.T) {
	tests := []struct {
		name     string
		constant string
		expected string
	}{
		{"node", EventCategoryNode, "node"},
		{"pod", EventCategoryPod, "pod"},
		{"service", EventCategoryService, "service"},
		{"config", EventCategoryConfig, "config"},
		{"security", EventCategorySecurity, "security"},
		{"network", EventCategoryNetwork, "network"},
		{"storage", EventCategoryStorage, "storage"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if tt.constant != tt.expected {
				t.Errorf("Event category %s = %q, want %q", tt.name, tt.constant, tt.expected)
			}
		})
	}
}

func TestRegistryTypes(t *testing.T) {
	tests := []struct {
		name     string
		constant string
		expected string
	}{
		{"dockerhub", RegistryTypeDockerHub, "dockerhub"},
		{"gitea", RegistryTypeGitea, "gitea"},
		{"gitlab", RegistryTypeGitlab, "gitlab"},
		{"generic", RegistryTypeGeneric, "generic"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if tt.constant != tt.expected {
				t.Errorf("Registry type %s = %q, want %q", tt.name, tt.constant, tt.expected)
			}
		})
	}
}

func TestRegistryStatus(t *testing.T) {
	tests := []struct {
		name     string
		constant string
		expected string
	}{
		{"pending", RegistryStatusPending, "pending"},
		{"connected", RegistryStatusConnected, "connected"},
		{"error", RegistryStatusError, "error"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if tt.constant != tt.expected {
				t.Errorf("Registry status %s = %q, want %q", tt.name, tt.constant, tt.expected)
			}
		})
	}
}

func TestDeploymentStatus(t *testing.T) {
	tests := []struct {
		name     string
		constant string
		expected string
	}{
		{"pending", DeploymentStatusPending, "pending"},
		{"committed", DeploymentStatusCommitted, "committed"},
		{"pending_apply", DeploymentStatusPendingApply, "pending_apply"},
		{"applying", DeploymentStatusApplying, "applying"},
		{"running", DeploymentStatusRunning, "running"},
		{"failed", DeploymentStatusFailed, "failed"},
		{"apply_failed", DeploymentStatusApplyFailed, "apply_failed"},
		{"updating", DeploymentStatusUpdating, "updating"},
		{"terminating", DeploymentStatusTerminating, "terminating"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if tt.constant != tt.expected {
				t.Errorf("Deployment status %s = %q, want %q", tt.name, tt.constant, tt.expected)
			}
		})
	}
}

func TestDeploymentStrategy(t *testing.T) {
	tests := []struct {
		name     string
		constant string
		expected string
	}{
		{"rolling_update", DeploymentStrategyRollingUpdate, "RollingUpdate"},
		{"recreate", DeploymentStrategyRecreate, "Recreate"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if tt.constant != tt.expected {
				t.Errorf("Deployment strategy %s = %q, want %q", tt.name, tt.constant, tt.expected)
			}
		})
	}
}

func TestDeploymentActions(t *testing.T) {
	tests := []struct {
		name     string
		constant string
		expected string
	}{
		{"create", DeploymentActionCreate, "create"},
		{"update", DeploymentActionUpdate, "update"},
		{"scale", DeploymentActionScale, "scale"},
		{"delete", DeploymentActionDelete, "delete"},
		{"restart", DeploymentActionRestart, "restart"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if tt.constant != tt.expected {
				t.Errorf("Deployment action %s = %q, want %q", tt.name, tt.constant, tt.expected)
			}
		})
	}
}

func TestStatusEnum(t *testing.T) {
	tests := []struct {
		name     string
		constant string
		expected string
	}{
		{"healthy", StatusHealthy, "healthy"},
		{"degraded", StatusDegraded, "degraded"},
		{"critical", StatusCritical, "critical"},
		{"warning", StatusWarning, "warning"},
		{"error", StatusError, "error"},
		{"info", StatusInfo, "info"},
		{"success", StatusSuccess, "success"},
		{"pending", StatusPending, "pending"},
		{"progressing", StatusProgressing, "progressing"},
		{"unknown", StatusUnknown, "unknown"},
		{"suspended", StatusSuspended, "suspended"},
		{"missing", StatusMissing, "missing"},
		{"down", StatusDown, "down"},
		{"high", StatusHigh, "high"},
		{"medium", StatusMedium, "medium"},
		{"low", StatusLow, "low"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if tt.constant != tt.expected {
				t.Errorf("Status %s = %q, want %q", tt.name, tt.constant, tt.expected)
			}
		})
	}
}

func TestTimeRanges(t *testing.T) {
	tests := []struct {
		name     string
		constant string
		expected string
	}{
		{"5m", TimeRange5m, "5m"},
		{"15m", TimeRange15m, "15m"},
		{"1h", TimeRange1h, "1h"},
		{"6h", TimeRange6h, "6h"},
		{"12h", TimeRange12h, "12h"},
		{"24h", TimeRange24h, "24h"},
		{"48h", TimeRange48h, "48h"},
		{"7d", TimeRange7d, "7d"},
		{"30d", TimeRange30d, "30d"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if tt.constant != tt.expected {
				t.Errorf("Time range %s = %q, want %q", tt.name, tt.constant, tt.expected)
			}
		})
	}
}

func TestCommonNamespaces(t *testing.T) {
	expectedNamespaces := []string{
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

	if !reflect.DeepEqual(CommonNamespaces, expectedNamespaces) {
		t.Errorf("CommonNamespaces = %v, want %v", CommonNamespaces, expectedNamespaces)
	}

	// Test that all expected namespaces are present
	for _, expected := range expectedNamespaces {
		found := false
		for _, actual := range CommonNamespaces {
			if actual == expected {
				found = true
				break
			}
		}
		if !found {
			t.Errorf("Expected namespace %q not found in CommonNamespaces", expected)
		}
	}
}

func TestLogSources(t *testing.T) {
	expectedSources := []string{
		"kubernetes-api",
		"nginx-ingress",
		"application",
		"database",
		"redis",
		"monitoring",
		"system",
	}

	if !reflect.DeepEqual(LogSources, expectedSources) {
		t.Errorf("LogSources = %v, want %v", LogSources, expectedSources)
	}

	// Test that all expected sources are present
	for _, expected := range expectedSources {
		found := false
		for _, actual := range LogSources {
			if actual == expected {
				found = true
				break
			}
		}
		if !found {
			t.Errorf("Expected log source %q not found in LogSources", expected)
		}
	}
}

func TestVPSDefaults(t *testing.T) {
	tests := []struct {
		name     string
		constant interface{}
		expected interface{}
	}{
		{"DefaultVPSNode", DefaultVPSNode, "vps-main"},
		{"DefaultVPSCores", DefaultVPSCores, 8},
		{"DefaultVPSMemoryGB", DefaultVPSMemoryGB, 16},
		{"DefaultVPSStorageGB", DefaultVPSStorageGB, 200},
		{"DefaultMaxPods", DefaultMaxPods, 110},
		{"DefaultMaxServices", DefaultMaxServices, 50},
		{"DefaultMaxNamespaces", DefaultMaxNamespaces, 10},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if tt.constant != tt.expected {
				t.Errorf("VPS default %s = %v, want %v", tt.name, tt.constant, tt.expected)
			}
		})
	}
}

func TestDefaultLimits(t *testing.T) {
	tests := []struct {
		name     string
		constant int
		expected int
	}{
		{"DefaultLogLimit", DefaultLogLimit, 200},
		{"DefaultEventLimit", DefaultEventLimit, 100},
		{"DefaultMetricsLimit", DefaultMetricsLimit, 100},
		{"MaxLogLimit", MaxLogLimit, 1000},
		{"MaxEventLimit", MaxEventLimit, 500},
		{"MaxMetricsLimit", MaxMetricsLimit, 1000},
		{"WebSocketBufferSize", WebSocketBufferSize, 256},
		{"WebSocketMaxMessages", WebSocketMaxMessages, 1000},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if tt.constant != tt.expected {
				t.Errorf("Default limit %s = %d, want %d", tt.name, tt.constant, tt.expected)
			}
		})
	}
}

// Test that constants are properly typed as strings (not untyped constants)
func TestConstantTypes(t *testing.T) {
	tests := []struct {
		name  string
		value interface{}
	}{
		{"MessageTypeHeartbeat", MessageTypeHeartbeat},
		{"LogLevelInfo", LogLevelInfo},
		{"EventSeverityCritical", EventSeverityCritical},
		{"RegistryTypeDockerHub", RegistryTypeDockerHub},
		{"DeploymentStatusRunning", DeploymentStatusRunning},
		{"StatusHealthy", StatusHealthy},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if reflect.TypeOf(tt.value).Kind() != reflect.String {
				t.Errorf("Constant %s is not a string type, got %s", tt.name, reflect.TypeOf(tt.value))
			}
		})
	}
}

// Benchmark constant access
func BenchmarkConstantAccess(b *testing.B) {
	for i := 0; i < b.N; i++ {
		_ = MessageTypeHeartbeat
		_ = LogLevelInfo
		_ = DeploymentStatusRunning
		_ = StatusHealthy
	}
}