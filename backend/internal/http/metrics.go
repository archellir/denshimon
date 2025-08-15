package http

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/archellir/denshimon/internal/metrics"
)

type MetricsHandlers struct {
	metricsService *metrics.Service
}

func NewMetricsHandlers(metricsService *metrics.Service) *MetricsHandlers {
	return &MetricsHandlers{
		metricsService: metricsService,
	}
}

// GET /api/metrics/cluster
func (h *MetricsHandlers) GetClusterMetrics(w http.ResponseWriter, r *http.Request) {
	if h.metricsService == nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusServiceUnavailable)
		json.NewEncoder(w).Encode(map[string]string{
			"error": "Metrics service not available",
		})
		return
	}

	clusterMetrics, err := h.metricsService.GetClusterMetrics(r.Context())
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{
			"error": "Failed to get cluster metrics",
		})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(clusterMetrics)
}

// GET /api/metrics/nodes
func (h *MetricsHandlers) GetNodesMetrics(w http.ResponseWriter, r *http.Request) {
	if h.metricsService == nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusServiceUnavailable)
		json.NewEncoder(w).Encode(map[string]string{
			"error": "Metrics service not available",
		})
		return
	}

	// Get node name from query parameter
	nodeName := r.URL.Query().Get("node")

	if nodeName != "" {
		// Get specific node metrics
		nodeMetrics, err := h.metricsService.GetNodeMetrics(r.Context(), nodeName)
		if err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{
				"error": "Failed to get node metrics",
			})
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(nodeMetrics)
		return
	}

	// Get all nodes metrics via cluster metrics
	clusterMetrics, err := h.metricsService.GetClusterMetrics(r.Context())
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{
			"error": "Failed to get nodes metrics",
		})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"nodes": clusterMetrics.NodeMetrics,
	})
}

// GET /api/metrics/pods
func (h *MetricsHandlers) GetPodsMetrics(w http.ResponseWriter, r *http.Request) {
	if h.metricsService == nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusServiceUnavailable)
		json.NewEncoder(w).Encode(map[string]string{
			"error": "Metrics service not available",
		})
		return
	}

	namespace := r.URL.Query().Get("namespace")
	podName := r.URL.Query().Get("pod")

	if namespace != "" && podName != "" {
		// Get specific pod metrics
		podMetrics, err := h.metricsService.GetPodMetrics(r.Context(), namespace, podName)
		if err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{
				"error": "Failed to get pod metrics",
			})
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(podMetrics)
		return
	}

	// Return basic pod count metrics from cluster metrics
	clusterMetrics, err := h.metricsService.GetClusterMetrics(r.Context())
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{
			"error": "Failed to get pods metrics",
		})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"total_pods":   clusterMetrics.TotalPods,
		"running_pods": clusterMetrics.RunningPods,
		"pending_pods": clusterMetrics.PendingPods,
		"failed_pods":  clusterMetrics.FailedPods,
		"namespaces":   clusterMetrics.NamespaceMetrics,
	})
}

// GET /api/metrics/history
func (h *MetricsHandlers) GetMetricsHistory(w http.ResponseWriter, r *http.Request) {
	if h.metricsService == nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusServiceUnavailable)
		json.NewEncoder(w).Encode(map[string]string{
			"error": "Metrics service not available",
		})
		return
	}

	// Parse duration parameter (default to 1 hour)
	durationStr := r.URL.Query().Get("duration")
	duration := time.Hour

	if durationStr != "" {
		if d, err := time.ParseDuration(durationStr); err == nil {
			duration = d
		}
	}

	history, err := h.metricsService.GetMetricsHistory(r.Context(), duration)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{
			"error": "Failed to get metrics history",
		})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(history)
}

// GET /api/metrics/namespaces
func (h *MetricsHandlers) GetNamespacesMetrics(w http.ResponseWriter, r *http.Request) {
	if h.metricsService == nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusServiceUnavailable)
		json.NewEncoder(w).Encode(map[string]string{
			"error": "Metrics service not available",
		})
		return
	}

	clusterMetrics, err := h.metricsService.GetClusterMetrics(r.Context())
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{
			"error": "Failed to get namespaces metrics",
		})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"total_namespaces": clusterMetrics.TotalNamespaces,
		"namespaces":       clusterMetrics.NamespaceMetrics,
	})
}

// GET /api/metrics/resources
func (h *MetricsHandlers) GetResourceMetrics(w http.ResponseWriter, r *http.Request) {
	if h.metricsService == nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusServiceUnavailable)
		json.NewEncoder(w).Encode(map[string]string{
			"error": "Metrics service not available",
		})
		return
	}

	clusterMetrics, err := h.metricsService.GetClusterMetrics(r.Context())
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{
			"error": "Failed to get resource metrics",
		})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"cpu":     clusterMetrics.CPUUsage,
		"memory":  clusterMetrics.MemoryUsage,
		"storage": clusterMetrics.StorageUsage,
		"network": clusterMetrics.NetworkMetrics,
	})
}

// GET /api/metrics/health
func (h *MetricsHandlers) GetHealthMetrics(w http.ResponseWriter, r *http.Request) {
	if h.metricsService == nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusServiceUnavailable)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"status":     "unavailable",
			"message":    "Metrics service not available",
			"k8s_client": false,
			"timestamp":  time.Now(),
		})
		return
	}

	clusterMetrics, err := h.metricsService.GetClusterMetrics(r.Context())
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusServiceUnavailable)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"status":     "error",
			"message":    "Failed to get cluster metrics",
			"error":      err.Error(),
			"k8s_client": true,
			"timestamp":  time.Now(),
		})
		return
	}

	healthyNodesPercent := float64(clusterMetrics.ReadyNodes) / float64(clusterMetrics.TotalNodes) * 100
	runningPodsPercent := float64(clusterMetrics.RunningPods) / float64(clusterMetrics.TotalPods) * 100

	status := "healthy"
	if healthyNodesPercent < 80 || runningPodsPercent < 80 {
		status = "degraded"
	}
	if healthyNodesPercent < 50 || runningPodsPercent < 50 {
		status = "unhealthy"
	}

	SendSuccess(w, map[string]interface{}{
		"status":                status,
		"k8s_client":            true,
		"nodes_healthy_percent": healthyNodesPercent,
		"pods_running_percent":  runningPodsPercent,
		"total_nodes":           clusterMetrics.TotalNodes,
		"ready_nodes":           clusterMetrics.ReadyNodes,
		"total_pods":            clusterMetrics.TotalPods,
		"running_pods":          clusterMetrics.RunningPods,
		"cpu_usage_percent":     clusterMetrics.CPUUsage.UsagePercent,
		"memory_usage_percent":  clusterMetrics.MemoryUsage.UsagePercent,
		"timestamp":             time.Now(),
	})
}

// GET /api/metrics/network - Get network metrics
func (h *MetricsHandlers) GetNetworkMetrics(w http.ResponseWriter, r *http.Request) {
	if h.metricsService == nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusServiceUnavailable)
		json.NewEncoder(w).Encode(map[string]string{
			"error": "Metrics service not available",
		})
		return
	}

	// Get real network metrics from cluster
	clusterMetrics, err := h.metricsService.GetClusterMetrics(r.Context())
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{
			"error": "Failed to get network metrics",
		})
		return
	}

	// Return network-related metrics from cluster
	networkMetrics := map[string]interface{}{
		"network":   clusterMetrics.NetworkMetrics,
		"timestamp": time.Now().UTC().Format(time.RFC3339),
	}

	SendSuccess(w, networkMetrics)
}
