package api

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
			"status":      "unavailable",
			"message":     "Metrics service not available",
			"k8s_client":  false,
			"timestamp":   time.Now(),
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
	// Mock network metrics for VPS deployment
	networkMetrics := map[string]interface{}{
		"interfaces": []map[string]interface{}{
			{
				"name":        "eth0",
				"status":      "up",
				"ipAddress":   "10.0.0.100",
				"mtu":         1500,
				"bytesIn":     1073741824,  // 1GB
				"bytesOut":    536870912,   // 512MB
				"packetsIn":   1000000,
				"packetsOut":  750000,
				"errorsIn":    0,
				"errorsOut":   0,
				"droppedIn":   5,
				"droppedOut":  2,
				"throughputIn": 25.6,      // Mbps
				"throughputOut": 18.3,     // Mbps
			},
			{
				"name":        "lo",
				"status":      "up",
				"ipAddress":   "127.0.0.1",
				"mtu":         65536,
				"bytesIn":     104857600,   // 100MB
				"bytesOut":    104857600,   // 100MB
				"packetsIn":   50000,
				"packetsOut":  50000,
				"errorsIn":    0,
				"errorsOut":   0,
				"droppedIn":   0,
				"droppedOut":  0,
				"throughputIn": 5.2,       // Mbps
				"throughputOut": 5.2,      // Mbps
			},
		},
		"kubernetes": map[string]interface{}{
			"podNetworking": map[string]interface{}{
				"cniPlugin":      "flannel",
				"podCIDR":        "10.244.0.0/16",
				"serviceCIDR":    "10.96.0.0/12",
				"dnsClusterIP":   "10.96.0.10",
				"activeIPs":      847,
				"availableIPs":   65289,
			},
			"services": map[string]interface{}{
				"totalServices":  25,
				"clusterIPs":     20,
				"nodePort":       3,
				"loadBalancer":   1,
				"externalName":   1,
			},
			"ingress": map[string]interface{}{
				"controller":    "nginx",
				"totalRules":    15,
				"tlsEnabled":    true,
				"certificates": 3,
			},
		},
		"connections": map[string]interface{}{
			"established": 342,
			"timeWait":     89,
			"closeWait":    12,
			"synSent":      5,
			"synRecv":      3,
			"finWait1":     8,
			"finWait2":     2,
			"listening":    47,
		},
		"bandwidth": map[string]interface{}{
			"totalUsage":     43.9,      // Mbps
			"inbound":        25.6,      // Mbps
			"outbound":       18.3,      // Mbps
			"peakUsage":      89.2,      // Mbps
			"avgUsage":       35.7,      // Mbps
			"utilization":    17.45,     // % of 1Gbps
		},
		"protocols": map[string]interface{}{
			"tcp": map[string]interface{}{
				"connections": 425,
				"bytesIn":     536870912,
				"bytesOut":    268435456,
				"retransmits": 25,
			},
			"udp": map[string]interface{}{
				"packets":  50000,
				"bytesIn":  10485760,
				"bytesOut": 5242880,
				"errors":   2,
			},
			"icmp": map[string]interface{}{
				"packets": 1500,
				"bytes":   150000,
				"errors":  0,
			},
		},
		"security": map[string]interface{}{
			"networkPolicies": 8,
			"deniedConnections": 127,
			"allowedConnections": 15342,
			"suspiciousTraffic": 3,
			"firewallRules": 45,
		},
		"latency": map[string]interface{}{
			"internalPods": map[string]float64{
				"avg": 0.5,
				"p95": 1.2,
				"p99": 2.8,
			},
			"externalServices": map[string]float64{
				"avg": 45.2,
				"p95": 120.5,
				"p99": 350.8,
			},
			"dns": map[string]float64{
				"avg": 2.1,
				"p95": 8.5,
				"p99": 25.3,
			},
		},
		"timestamp": time.Now().UTC().Format(time.RFC3339),
	}
	
	SendSuccess(w, networkMetrics)
}