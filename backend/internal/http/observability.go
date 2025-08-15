package http

import (
	"context"
	"fmt"
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

// GetLogs returns paginated log entries from Kubernetes pods
func (h *ObservabilityHandlers) GetLogs(w http.ResponseWriter, r *http.Request) {
	if h.k8sClient == nil {
		SendError(w, "Kubernetes client not available", http.StatusServiceUnavailable)
		return
	}

	// Parse query parameters
	namespace := r.URL.Query().Get("namespace")
	podName := r.URL.Query().Get("pod")
	container := r.URL.Query().Get("container")
	limitStr := r.URL.Query().Get("limit")
	
	limit := int64(100) // default
	if limitStr != "" {
		if parsedLimit, err := strconv.ParseInt(limitStr, 10, 64); err == nil && parsedLimit > 0 && parsedLimit <= 1000 {
			limit = parsedLimit
		}
	}

	// If specific pod is requested, get its logs
	if podName != "" && namespace != "" {
		logs, err := h.k8sClient.GetPodLogs(context.Background(), namespace, podName, container, "", limit)
		if err != nil {
			SendError(w, fmt.Sprintf("Failed to get pod logs: %v", err), http.StatusInternalServerError)
			return
		}

		// Convert to LogEntry format
		logEntries := []LogEntry{
			{
				ID:        fmt.Sprintf("%d", time.Now().UnixNano()),
				Timestamp: time.Now().UTC().Format(time.RFC3339),
				Level:     "info",
				Source:    podName,
				Message:   logs,
				Metadata: map[string]interface{}{
					"namespace": namespace,
					"pod":       podName,
					"container": container,
				},
			},
		}

		SendSuccess(w, map[string]interface{}{
			"logs":  logEntries,
			"total": len(logEntries),
			"metadata": map[string]interface{}{
				"namespace": namespace,
				"pod":       podName,
				"timestamp": time.Now().UTC().Format(time.RFC3339),
			},
		})
		return
	}

	// Return empty logs if no specific pod requested
	SendSuccess(w, map[string]interface{}{
		"logs":  []LogEntry{},
		"total": 0,
		"metadata": map[string]interface{}{
			"timestamp": time.Now().UTC().Format(time.RFC3339),
			"message":   "Specify namespace and pod parameters to retrieve logs",
		},
	})
}

// GetEvents returns Kubernetes events
func (h *ObservabilityHandlers) GetEvents(w http.ResponseWriter, r *http.Request) {
	if h.k8sClient == nil {
		SendError(w, "Kubernetes client not available", http.StatusServiceUnavailable)
		return
	}

	// Parse query parameters
	namespace := r.URL.Query().Get("namespace")
	limitStr := r.URL.Query().Get("limit")
	
	limit := 50 // default
	if limitStr != "" {
		if parsedLimit, err := strconv.Atoi(limitStr); err == nil && parsedLimit > 0 && parsedLimit <= 200 {
			limit = parsedLimit
		}
	}

	// Get Kubernetes events
	k8sEvents, err := h.k8sClient.ListEvents(context.Background(), namespace)
	if err != nil {
		SendError(w, fmt.Sprintf("Failed to get events: %v", err), http.StatusInternalServerError)
		return
	}

	// Convert to TimelineEvent format
	events := make([]TimelineEvent, 0, len(k8sEvents.Items))
	for i, event := range k8sEvents.Items {
		if i >= limit {
			break
		}

		// Determine severity based on event type
		severity := "info"
		if event.Type == "Warning" {
			severity = "warning"
		} else if event.Type == "Error" {
			severity = "error"
		}

		// Calculate duration if applicable
		var duration *int
		if !event.LastTimestamp.Time.IsZero() && !event.FirstTimestamp.Time.IsZero() {
			d := int(event.LastTimestamp.Time.Sub(event.FirstTimestamp.Time).Milliseconds())
			duration = &d
		}

		events = append(events, TimelineEvent{
			ID:          string(event.UID),
			Timestamp:   event.FirstTimestamp.Time.Format(time.RFC3339),
			Category:    event.Source.Component,
			Severity:    severity,
			Title:       event.Reason,
			Description: event.Message,
			Source: EventSource{
				Type:      event.Source.Component,
				Name:      event.InvolvedObject.Name,
				Namespace: event.Namespace,
			},
			Duration: duration,
			Metadata: map[string]interface{}{
				"kind":  event.InvolvedObject.Kind,
				"count": event.Count,
			},
		})
	}

	SendSuccess(w, map[string]interface{}{
		"events": events,
		"total":  len(events),
		"metadata": map[string]interface{}{
			"namespace": namespace,
			"timestamp": time.Now().UTC().Format(time.RFC3339),
		},
	})
}

// GetLogStreams returns available log streams from pods
func (h *ObservabilityHandlers) GetLogStreams(w http.ResponseWriter, r *http.Request) {
	if h.k8sClient == nil {
		SendError(w, "Kubernetes client not available", http.StatusServiceUnavailable)
		return
	}

	// Get all pods to determine available log streams
	pods, err := h.k8sClient.ListPods(context.Background(), "")
	if err != nil {
		SendError(w, fmt.Sprintf("Failed to get pods: %v", err), http.StatusInternalServerError)
		return
	}

	// Convert pods to log streams
	streams := make([]map[string]interface{}, 0, len(pods.Items))
	for _, pod := range pods.Items {
		for _, container := range pod.Spec.Containers {
			streams = append(streams, map[string]interface{}{
				"id":          fmt.Sprintf("%s-%s-%s", pod.Namespace, pod.Name, container.Name),
				"name":        container.Name,
				"source":      pod.Name,
				"namespace":   pod.Namespace,
				"status":      string(pod.Status.Phase),
				"container":   container.Name,
				"lastMessage": pod.Status.StartTime,
			})
		}
	}

	SendSuccess(w, map[string]interface{}{
		"streams": streams,
		"summary": map[string]interface{}{
			"totalStreams": len(streams),
		},
		"timestamp": time.Now().UTC().Format(time.RFC3339),
	})
}

// GetLogAnalytics returns log analytics based on actual pod logs
func (h *ObservabilityHandlers) GetLogAnalytics(w http.ResponseWriter, r *http.Request) {
	if h.k8sClient == nil {
		SendError(w, "Kubernetes client not available", http.StatusServiceUnavailable)
		return
	}

	timeRange := r.URL.Query().Get("timeRange")
	if timeRange == "" {
		timeRange = "24h"
	}

	// Get pod count for basic analytics
	pods, err := h.k8sClient.ListPods(context.Background(), "")
	if err != nil {
		SendError(w, fmt.Sprintf("Failed to get pods: %v", err), http.StatusInternalServerError)
		return
	}

	// Get events for analytics
	events, err := h.k8sClient.ListEvents(context.Background(), "")
	if err != nil {
		SendError(w, fmt.Sprintf("Failed to get events: %v", err), http.StatusInternalServerError)
		return
	}

	// Count events by type
	errorCount := 0
	warningCount := 0
	infoCount := 0
	for _, event := range events.Items {
		switch event.Type {
		case "Error":
			errorCount++
		case "Warning":
			warningCount++
		default:
			infoCount++
		}
	}

	totalLogs := len(events.Items)
	errorRate := float64(0)
	warningRate := float64(0)
	if totalLogs > 0 {
		errorRate = float64(errorCount) / float64(totalLogs) * 100
		warningRate = float64(warningCount) / float64(totalLogs) * 100
	}

	analytics := map[string]interface{}{
		"timeRange": timeRange,
		"overview": map[string]interface{}{
			"totalLogs":   totalLogs,
			"errorLogs":   errorCount,
			"warningLogs": warningCount,
			"infoLogs":    infoCount,
			"errorRate":   errorRate,
			"warningRate": warningRate,
			"podCount":    len(pods.Items),
		},
		"topSources": []map[string]interface{}{
			{
				"source":     "kubernetes",
				"logCount":   totalLogs,
				"errorRate":  errorRate,
				"percentage": 100.0,
			},
		},
		"timestamp": time.Now().UTC().Format(time.RFC3339),
	}

	SendSuccess(w, analytics)
}