package api

import (
	"encoding/json"
	"fmt"
	"math/rand"
	"net/http"
	"strconv"
	"time"

	"github.com/archellir/denshimon/internal/k8s"
)

type ObservabilityHandlers struct {
	k8sClient *k8s.Client
}

func NewObservabilityHandlers(k8sClient *k8s.Client) *ObservabilityHandlers {
	return &ObservabilityHandlers{
		k8sClient: k8sClient,
	}
}

// LogEntry represents a log entry matching frontend LogEntry interface
type LogEntry struct {
	ID        string                 `json:"id"`
	Timestamp string                 `json:"timestamp"`
	Level     string                 `json:"level"`
	Source    string                 `json:"source"`
	Message   string                 `json:"message"`
	User      string                 `json:"user,omitempty"`
	Action    string                 `json:"action,omitempty"`
	Metadata  map[string]interface{} `json:"metadata,omitempty"`
}

// TimelineEvent represents an event matching frontend TimelineEvent interface
type TimelineEvent struct {
	ID          string                 `json:"id"`
	Timestamp   string                 `json:"timestamp"`
	Category    string                 `json:"category"`
	Severity    string                 `json:"severity"`
	Title       string                 `json:"title"`
	Description string                 `json:"description"`
	Source      EventSource            `json:"source"`
	Impact      *EventImpact           `json:"impact,omitempty"`
	Duration    *int                   `json:"duration,omitempty"`
	Resolved    *bool                  `json:"resolved,omitempty"`
	Metadata    map[string]interface{} `json:"metadata,omitempty"`
}

type EventSource struct {
	Type      string `json:"type"`
	Name      string `json:"name"`
	Namespace string `json:"namespace,omitempty"`
}

type EventImpact struct {
	Affected int    `json:"affected"`
	Total    int    `json:"total"`
	Unit     string `json:"unit"`
}

// GetLogs returns paginated log entries for the VPS
func (h *ObservabilityHandlers) GetLogs(w http.ResponseWriter, r *http.Request) {
	// Parse query parameters
	limitStr := r.URL.Query().Get("limit")
	limit := 100 // default
	if limitStr != "" {
		if parsedLimit, err := strconv.Atoi(limitStr); err == nil && parsedLimit > 0 && parsedLimit <= 1000 {
			limit = parsedLimit
		}
	}

	level := r.URL.Query().Get("level")
	source := r.URL.Query().Get("source")
	namespace := r.URL.Query().Get("namespace")

	// Generate mock logs for VPS (in real implementation, would query actual logs)
	logs := generateMockLogs(limit, level, source, namespace)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"logs":  logs,
		"total": len(logs),
		"metadata": map[string]interface{}{
			"vps_node":   "vps-main",
			"generated":  true,
			"timestamp": time.Now().UTC().Format(time.RFC3339),
		},
	})
}

// GetEvents returns timeline events for the VPS
func (h *ObservabilityHandlers) GetEvents(w http.ResponseWriter, r *http.Request) {
	// Parse query parameters
	limitStr := r.URL.Query().Get("limit")
	limit := 50 // default
	if limitStr != "" {
		if parsedLimit, err := strconv.Atoi(limitStr); err == nil && parsedLimit > 0 && parsedLimit <= 200 {
			limit = parsedLimit
		}
	}

	category := r.URL.Query().Get("category")
	severity := r.URL.Query().Get("severity")
	timeRange := r.URL.Query().Get("timeRange")
	if timeRange == "" {
		timeRange = "24h"
	}

	// Generate mock events for VPS (in real implementation, would query K8s events)
	events := generateMockEvents(limit, category, severity, timeRange)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"events": events,
		"total":  len(events),
		"metadata": map[string]interface{}{
			"vps_node":   "vps-main",
			"time_range": timeRange,
			"generated":  true,
			"timestamp":  time.Now().UTC().Format(time.RFC3339),
		},
	})
}

// generateMockLogs creates mock log entries for VPS
func generateMockLogs(limit int, levelFilter, sourceFilter, namespaceFilter string) []LogEntry {
	levels := []string{"info", "warn", "error", "debug"}
	sources := []string{"kubernetes-api", "nginx-ingress", "application", "database", "redis"}
	namespaces := []string{"production", "staging", "monitoring", "kube-system", "default"}
	
	messages := []string{
		"Request processed successfully",
		"Database connection established", 
		"Configuration reloaded",
		"Health check passed",
		"Authentication successful",
		"Cache invalidated",
		"Metrics collected",
		"Backup completed",
		"Pod scheduled successfully",
		"Service endpoint updated",
		"VPS resource utilization normal",
		"Container memory usage optimal",
		"Network connectivity stable",
		"Storage I/O performance good",
	}

	logs := make([]LogEntry, 0, limit)
	
	for i := 0; i < limit; i++ {
		level := levels[rand.Intn(len(levels))]
		source := sources[rand.Intn(len(sources))]
		namespace := namespaces[rand.Intn(len(namespaces))]
		
		// Apply filters
		if levelFilter != "" && level != levelFilter {
			continue
		}
		if sourceFilter != "" && source != sourceFilter {
			continue
		}
		if namespaceFilter != "" && namespace != namespaceFilter {
			continue
		}

		// Generate timestamp within last 24 hours
		timestamp := time.Now().Add(-time.Duration(rand.Intn(24*60)) * time.Minute)
		
		log := LogEntry{
			ID:        fmt.Sprintf("%d", timestamp.UnixNano()),
			Timestamp: timestamp.UTC().Format(time.RFC3339),
			Level:     level,
			Source:    source,
			Message:   messages[rand.Intn(len(messages))],
			User:      "system",
			Action:    "log_entry",
			Metadata: map[string]interface{}{
				"namespace": namespace,
				"pod":       "app-" + randomString(8),
				"node":      "vps-main",
				"ip":        fmt.Sprintf("10.0.0.%d", rand.Intn(255)+1),
				"duration":  rand.Intn(1000) + 50,
			},
		}
		
		logs = append(logs, log)
	}
	
	return logs
}

// generateMockEvents creates mock timeline events for VPS
func generateMockEvents(limit int, categoryFilter, severityFilter, timeRange string) []TimelineEvent {
	categories := []string{"node", "pod", "service", "config", "security", "network", "storage"}
	severities := []string{"critical", "warning", "info", "success"}
	titles := []string{
		"Pod Created", "Service Updated", "Node Ready", "Config Applied",
		"Security Policy Updated", "Network Route Added", "Storage Provisioned",
		"Deployment Scaled", "Container Started", "Health Check Passed",
		"VPS Memory Optimized", "CPU Utilization Improved", "Disk Space Cleaned",
	}
	descriptions := []string{
		"Successfully created new pod on VPS",
		"Service configuration updated successfully",
		"VPS node is ready and healthy",
		"Configuration changes applied",
		"Security policy enforcement enabled",
		"Network connectivity established",
		"Storage volume mounted successfully",
		"VPS resources optimized for performance",
		"Container orchestration completed",
		"System health verification passed",
	}
	namespaces := []string{"production", "staging", "monitoring", "kube-system", "default"}

	events := make([]TimelineEvent, 0, limit)
	
	// Parse time range
	var timeRangeHours int
	switch timeRange {
	case "1h":
		timeRangeHours = 1
	case "6h":
		timeRangeHours = 6
	case "24h":
		timeRangeHours = 24
	case "7d":
		timeRangeHours = 24 * 7
	default:
		timeRangeHours = 24
	}
	
	for i := 0; i < limit; i++ {
		category := categories[rand.Intn(len(categories))]
		severity := severities[rand.Intn(len(severities))]
		
		// Apply filters
		if categoryFilter != "" && category != categoryFilter {
			continue
		}
		if severityFilter != "" && severity != severityFilter {
			continue
		}

		// Generate timestamp within specified range
		timestamp := time.Now().Add(-time.Duration(rand.Intn(timeRangeHours*60)) * time.Minute)
		
		duration := rand.Intn(300000) + 30000 // 30s to 5min in milliseconds
		resolved := rand.Float32() > 0.3       // 70% chance of being resolved
		
		event := TimelineEvent{
			ID:          randomString(16),
			Timestamp:   timestamp.UTC().Format(time.RFC3339),
			Category:    category,
			Severity:    severity,
			Title:       titles[rand.Intn(len(titles))],
			Description: descriptions[rand.Intn(len(descriptions))],
			Source: EventSource{
				Type:      category,
				Name:      "vps-" + randomString(4),
				Namespace: namespaces[rand.Intn(len(namespaces))],
			},
			Impact: &EventImpact{
				Affected: rand.Intn(5) + 1,
				Total:    10,
				Unit:     "pods",
			},
			Duration: &duration,
			Resolved: &resolved,
			Metadata: map[string]interface{}{
				"node":       "vps-main",
				"cluster":    "single-vps",
				"event_type": "kubernetes",
			},
		}
		
		events = append(events, event)
	}
	
	return events
}

// randomString generates a random string of specified length
func randomString(length int) string {
	const charset = "abcdefghijklmnopqrstuvwxyz0123456789"
	b := make([]byte, length)
	for i := range b {
		b[i] = charset[rand.Intn(len(charset))]
	}
	return string(b)
}