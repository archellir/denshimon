package http

import (
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

	SendSuccess(w, map[string]interface{}{
		"logs":  logs,
		"total": len(logs),
		"metadata": map[string]interface{}{
			"vps_node":  "vps-main",
			"generated": true,
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

	SendSuccess(w, map[string]interface{}{
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
		resolved := rand.Float32() > 0.3      // 70% chance of being resolved

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

// GetLogStreams returns available log streams
func (h *ObservabilityHandlers) GetLogStreams(w http.ResponseWriter, r *http.Request) {
	streams := []map[string]interface{}{
		{
			"id":          "stream-kubernetes-api",
			"name":        "Kubernetes API Server",
			"source":      "kubernetes-api",
			"namespace":   "kube-system",
			"status":      "active",
			"logLevel":    "info",
			"messageRate": 45.2,
			"errorRate":   0.8,
			"retention":   "7d",
			"size":        "2.3GB",
			"lastMessage": time.Now().Add(-30 * time.Second).UTC().Format(time.RFC3339),
		},
		{
			"id":          "stream-nginx-ingress",
			"name":        "NGINX Ingress Controller",
			"source":      "nginx-ingress",
			"namespace":   "ingress-nginx",
			"status":      "active",
			"logLevel":    "info",
			"messageRate": 125.7,
			"errorRate":   2.1,
			"retention":   "7d",
			"size":        "8.9GB",
			"lastMessage": time.Now().Add(-5 * time.Second).UTC().Format(time.RFC3339),
		},
		{
			"id":          "stream-application",
			"name":        "Application Logs",
			"source":      "application",
			"namespace":   "production",
			"status":      "active",
			"logLevel":    "debug",
			"messageRate": 320.5,
			"errorRate":   5.3,
			"retention":   "14d",
			"size":        "15.2GB",
			"lastMessage": time.Now().Add(-1 * time.Second).UTC().Format(time.RFC3339),
		},
		{
			"id":          "stream-database",
			"name":        "PostgreSQL Database",
			"source":      "database",
			"namespace":   "production",
			"status":      "active",
			"logLevel":    "warn",
			"messageRate": 25.8,
			"errorRate":   0.3,
			"retention":   "30d",
			"size":        "4.7GB",
			"lastMessage": time.Now().Add(-45 * time.Second).UTC().Format(time.RFC3339),
		},
		{
			"id":          "stream-redis",
			"name":        "Redis Cache",
			"source":      "redis",
			"namespace":   "production",
			"status":      "active",
			"logLevel":    "info",
			"messageRate": 15.2,
			"errorRate":   0.1,
			"retention":   "7d",
			"size":        "1.1GB",
			"lastMessage": time.Now().Add(-60 * time.Second).UTC().Format(time.RFC3339),
		},
		{
			"id":          "stream-monitoring",
			"name":        "Monitoring Stack",
			"source":      "monitoring",
			"namespace":   "monitoring",
			"status":      "active",
			"logLevel":    "info",
			"messageRate": 67.3,
			"errorRate":   1.2,
			"retention":   "14d",
			"size":        "6.8GB",
			"lastMessage": time.Now().Add(-15 * time.Second).UTC().Format(time.RFC3339),
		},
		{
			"id":          "stream-system",
			"name":        "VPS System Logs",
			"source":      "system",
			"namespace":   "kube-system",
			"status":      "warning",
			"logLevel":    "error",
			"messageRate": 8.7,
			"errorRate":   8.7,
			"retention":   "30d",
			"size":        "500MB",
			"lastMessage": time.Now().Add(-120 * time.Second).UTC().Format(time.RFC3339),
		},
	}

	SendSuccess(w, map[string]interface{}{
		"streams": streams,
		"summary": map[string]interface{}{
			"totalStreams":     len(streams),
			"activeStreams":    6,
			"warningStreams":   1,
			"errorStreams":     0,
			"totalMessageRate": 618.4,
			"totalErrorRate":   18.5,
			"totalSize":        "39.5GB",
			"avgRetention":     "14d",
		},
		"vpsInfo": map[string]interface{}{
			"node":        "vps-main",
			"cluster":     "single-vps",
			"logDriver":   "journald",
			"aggregator":  "fluent-bit",
			"storage":     "local-ssd",
			"compression": "gzip",
		},
		"timestamp": time.Now().UTC().Format(time.RFC3339),
	})
}

// GetLogAnalytics returns log analytics and insights
func (h *ObservabilityHandlers) GetLogAnalytics(w http.ResponseWriter, r *http.Request) {
	timeRange := r.URL.Query().Get("timeRange")
	if timeRange == "" {
		timeRange = "24h"
	}

	analytics := map[string]interface{}{
		"timeRange": timeRange,
		"overview": map[string]interface{}{
			"totalLogs":   2547389,
			"errorLogs":   12847,
			"warningLogs": 58392,
			"infoLogs":    2156780,
			"debugLogs":   319370,
			"errorRate":   0.5,
			"warningRate": 2.3,
			"avgLogSize":  256,
			"peakHour":    "14:00",
			"quietHour":   "03:00",
		},
		"trends": map[string]interface{}{
			"logVolumeChange":   "+15.2%",
			"errorRateChange":   "-8.7%",
			"warningRateChange": "+3.1%",
			"peakVolumeTime":    "14:30",
			"trend":             "increasing",
		},
		"patterns": []map[string]interface{}{
			{
				"pattern":   "Connection timeout",
				"frequency": 347,
				"severity":  "warning",
				"source":    "nginx-ingress",
				"trend":     "stable",
				"impact":    "medium",
				"lastSeen":  time.Now().Add(-15 * time.Minute).UTC().Format(time.RFC3339),
			},
			{
				"pattern":   "Database slow query",
				"frequency": 89,
				"severity":  "warning",
				"source":    "database",
				"trend":     "decreasing",
				"impact":    "low",
				"lastSeen":  time.Now().Add(-45 * time.Minute).UTC().Format(time.RFC3339),
			},
			{
				"pattern":   "Pod restart",
				"frequency": 23,
				"severity":  "error",
				"source":    "kubernetes-api",
				"trend":     "stable",
				"impact":    "high",
				"lastSeen":  time.Now().Add(-2 * time.Hour).UTC().Format(time.RFC3339),
			},
			{
				"pattern":   "Memory usage high",
				"frequency": 156,
				"severity":  "warning",
				"source":    "system",
				"trend":     "increasing",
				"impact":    "medium",
				"lastSeen":  time.Now().Add(-30 * time.Minute).UTC().Format(time.RFC3339),
			},
			{
				"pattern":   "Authentication failure",
				"frequency": 67,
				"severity":  "error",
				"source":    "application",
				"trend":     "stable",
				"impact":    "medium",
				"lastSeen":  time.Now().Add(-20 * time.Minute).UTC().Format(time.RFC3339),
			},
		},
		"topSources": []map[string]interface{}{
			{
				"source":     "application",
				"logCount":   1152847,
				"errorRate":  0.8,
				"percentage": 45.2,
			},
			{
				"source":     "nginx-ingress",
				"logCount":   678945,
				"errorRate":  1.2,
				"percentage": 26.7,
			},
			{
				"source":     "kubernetes-api",
				"logCount":   456782,
				"errorRate":  0.3,
				"percentage": 17.9,
			},
			{
				"source":     "monitoring",
				"logCount":   158923,
				"errorRate":  0.2,
				"percentage": 6.2,
			},
			{
				"source":     "database",
				"logCount":   99892,
				"errorRate":  0.1,
				"percentage": 3.9,
			},
		},
		"alerts": []map[string]interface{}{
			{
				"id":           "alert-1",
				"type":         "error_rate_spike",
				"severity":     "warning",
				"source":       "nginx-ingress",
				"message":      "Error rate increased by 25% in the last hour",
				"threshold":    "5%",
				"current":      "6.3%",
				"triggered":    time.Now().Add(-45 * time.Minute).UTC().Format(time.RFC3339),
				"acknowledged": false,
			},
			{
				"id":           "alert-2",
				"type":         "log_volume_spike",
				"severity":     "info",
				"source":       "application",
				"message":      "Log volume increased significantly during peak hours",
				"threshold":    "1000/min",
				"current":      "1350/min",
				"triggered":    time.Now().Add(-2 * time.Hour).UTC().Format(time.RFC3339),
				"acknowledged": true,
			},
			{
				"id":           "alert-3",
				"type":         "repeated_errors",
				"severity":     "critical",
				"source":       "database",
				"message":      "Connection pool exhausted errors repeating",
				"threshold":    "10 occurrences",
				"current":      "15 occurrences",
				"triggered":    time.Now().Add(-30 * time.Minute).UTC().Format(time.RFC3339),
				"acknowledged": false,
			},
		},
		"recommendations": []map[string]interface{}{
			{
				"type":        "optimization",
				"priority":    "high",
				"title":       "Optimize Database Queries",
				"description": "Slow query patterns detected. Consider adding indexes or query optimization.",
				"impact":      "Reduce 45% of database warning logs",
				"effort":      "medium",
			},
			{
				"type":        "configuration",
				"priority":    "medium",
				"title":       "Adjust NGINX Timeout Settings",
				"description": "Connection timeout patterns suggest tuning proxy timeouts.",
				"impact":      "Reduce 25% of nginx warning logs",
				"effort":      "low",
			},
			{
				"type":        "monitoring",
				"priority":    "low",
				"title":       "Add Memory Usage Alerting",
				"description": "Set up proactive alerts for memory usage to prevent pod restarts.",
				"impact":      "Prevent 80% of restart-related errors",
				"effort":      "low",
			},
		},
		"performance": map[string]interface{}{
			"ingestionRate":    "2.1MB/s",
			"processingTime":   "125ms",
			"indexingDelay":    "45ms",
			"queryTime":        "8ms",
			"storageUsed":      "39.5GB",
			"storageLimit":     "200GB",
			"retentionPolicy":  "14 days",
			"compressionRatio": "3.2:1",
		},
		"timestamp": time.Now().UTC().Format(time.RFC3339),
	}

	SendSuccess(w, analytics)
}
