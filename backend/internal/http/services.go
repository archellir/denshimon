package http

import (
	"context"
	"net/http"
	"strings"
	"time"

	corev1 "k8s.io/api/core/v1"
	"github.com/archellir/denshimon/internal/k8s"
	"github.com/archellir/denshimon/pkg/response"
)

type ServicesHandlers struct {
	k8sClient *k8s.Client
}

func NewServicesHandlers(k8sClient *k8s.Client) *ServicesHandlers {
	return &ServicesHandlers{
		k8sClient: k8sClient,
	}
}

type ServiceMeshData struct {
	Services    []ServiceNode        `json:"services"`
	Connections []ServiceConnection  `json:"connections"`
	Metrics     ServiceMeshMetrics   `json:"metrics"`
	Timestamp   string               `json:"timestamp"`
}

type ServiceNode struct {
	ID             string             `json:"id"`
	Name           string             `json:"name"`
	Namespace      string             `json:"namespace"`
	Version        string             `json:"version"`
	Type           string             `json:"type"`
	Status         string             `json:"status"`
	Instances      int                `json:"instances"`
	Metrics        ServiceMetrics     `json:"metrics"`
	CircuitBreaker CircuitBreakerInfo `json:"circuitBreaker"`
}

type ServiceMetrics struct {
	RequestRate float64 `json:"requestRate"`
	ErrorRate   float64 `json:"errorRate"`
	Latency     struct {
		P50 float64 `json:"p50"`
		P95 float64 `json:"p95"`
		P99 float64 `json:"p99"`
	} `json:"latency"`
	SuccessRate float64 `json:"successRate"`
}

type CircuitBreakerInfo struct {
	Status           string `json:"status"`
	FailureThreshold int    `json:"failureThreshold"`
	Timeout          int    `json:"timeout"`
	LastTripped      *int64 `json:"lastTripped,omitempty"`
}

type ServiceConnection struct {
	ID       string `json:"id"`
	Source   string `json:"source"`
	Target   string `json:"target"`
	Protocol string `json:"protocol"`
	Metrics  struct {
		RequestRate      float64 `json:"requestRate"`
		ErrorRate        float64 `json:"errorRate"`
		Latency          float64 `json:"latency"`
		BytesTransferred int64   `json:"bytesTransferred"`
	} `json:"metrics"`
	Security struct {
		Encrypted  bool    `json:"encrypted"`
		MTLS       bool    `json:"mTLS"`
		AuthPolicy *string `json:"authPolicy,omitempty"`
	} `json:"security"`
	LoadBalancing string `json:"loadBalancing"`
}

type ServiceFlow struct {
	ID           string   `json:"id"`
	Path         []string `json:"path"`
	RequestRate  float64  `json:"requestRate"`
	AvgLatency   float64  `json:"avgLatency"`
	ErrorRate    float64  `json:"errorRate"`
	CriticalPath bool     `json:"criticalPath"`
}

type ServiceEndpoint struct {
	ID             string  `json:"id"`
	ServiceID      string  `json:"serviceId"`
	Path           string  `json:"path"`
	Method         string  `json:"method"`
	Authentication bool    `json:"authentication"`
	RateLimit      *struct {
		Limit  int    `json:"limit"`
		Period string `json:"period"`
	} `json:"rateLimit,omitempty"`
	Deprecated bool           `json:"deprecated"`
	Metrics    ServiceMetrics `json:"metrics"`
}

type ServiceMeshMetrics struct {
	Overview struct {
		TotalServices       int     `json:"totalServices"`
		HealthyServices     int     `json:"healthyServices"`
		TotalRequestRate    float64 `json:"totalRequestRate"`
		AvgLatency          float64 `json:"avgLatency"`
		ErrorRate           float64 `json:"errorRate"`
		MTLSCoverage        float64 `json:"mTLSCoverage"`
		ActiveConnections   int     `json:"activeConnections"`
		CircuitBreakersOpen int     `json:"circuitBreakersOpen"`
	} `json:"overview"`
	TopServices struct {
		ByRequestRate []ServiceNode `json:"byRequestRate"`
		ByErrorRate   []ServiceNode `json:"byErrorRate"`
	} `json:"topServices"`
	Alerts struct {
		CircuitBreakersOpen []ServiceNode       `json:"circuitBreakersOpen"`
		HighErrorRate       []ServiceNode       `json:"highErrorRate"`
		HighLatency         []ServiceNode       `json:"highLatency"`
		SecurityIssues      []ServiceConnection `json:"securityIssues"`
	} `json:"alerts"`
	Trends struct {
		RequestRateTrend string `json:"requestRateTrend"`
		LatencyTrend     string `json:"latencyTrend"`
		ErrorRateTrend   string `json:"errorRateTrend"`
	} `json:"trends"`
}

// Service classification constants
const (
	InfraServiceTypeLabel = "infra/service-type"
)

// Service type mappings for common patterns
var serviceTypeMappings = map[string]string{
	"frontend":  "frontend",
	"ui":        "frontend",
	"web":       "frontend",
	"backend":   "backend",
	"api":       "backend",
	"server":    "backend",
	"database":  "database",
	"db":        "database",
	"postgres":  "database",
	"mysql":     "database",
	"mongodb":   "database",
	"cache":     "cache",
	"redis":     "cache",
	"memcached": "cache",
	"gateway":   "gateway",
	"proxy":     "gateway",
	"ingress":   "gateway",
	"sidecar":   "sidecar",
	"mesh":      "sidecar",
}

// extractServiceType determines the service type from Kubernetes labels
func extractServiceType(service *corev1.Service) string {
	if service.Labels == nil {
		return inferServiceTypeFromName(service.Name)
	}

	// Check for explicit infra/service-type label
	if serviceType, exists := service.Labels[InfraServiceTypeLabel]; exists {
		return serviceType
	}

	// Fallback to name-based inference
	return inferServiceTypeFromName(service.Name)
}

// inferServiceTypeFromName attempts to infer service type from service name
func inferServiceTypeFromName(serviceName string) string {
	lowerName := strings.ToLower(serviceName)
	
	for pattern, serviceType := range serviceTypeMappings {
		if strings.Contains(lowerName, pattern) {
			return serviceType
		}
	}
	
	// Default to backend if no pattern matches
	return "backend"
}

// convertK8sServicesToNodes converts Kubernetes services to ServiceNode structs
func (h *ServicesHandlers) convertK8sServicesToNodes(k8sServices []corev1.Service) []ServiceNode {
	var services []ServiceNode
	
	for _, svc := range k8sServices {
		// Skip system services
		if strings.HasPrefix(svc.Namespace, "kube-") {
			continue
		}
		
		serviceType := extractServiceType(&svc)
		
		// Generate mock metrics for now - in real implementation would query actual metrics
		node := ServiceNode{
			ID:        svc.Name,
			Name:      svc.Name,
			Namespace: svc.Namespace,
			Version:   getServiceVersion(&svc),
			Type:      serviceType,
			Status:    "healthy", // Would be determined from actual health checks
			Instances: getServiceInstances(&svc),
			Metrics:   generateMockMetricsForType(serviceType),
			CircuitBreaker: CircuitBreakerInfo{
				Status:           "closed",
				FailureThreshold: 50,
				Timeout:          30000,
			},
		}
		
		services = append(services, node)
	}
	
	return services
}

// getServiceVersion extracts version from service labels or annotations
func getServiceVersion(service *corev1.Service) string {
	if service.Labels != nil {
		if version, exists := service.Labels["app.kubernetes.io/version"]; exists {
			return version
		}
		if version, exists := service.Labels["version"]; exists {
			return version
		}
	}
	
	if service.Annotations != nil {
		if version, exists := service.Annotations["version"]; exists {
			return version
		}
	}
	
	return "v1.0.0" // Default version
}

// getServiceInstances estimates service instances (simplified)
func getServiceInstances(service *corev1.Service) int {
	// In real implementation, would query associated deployment/replicaset
	return 1 // Default to 1 instance
}

// generateMockMetricsForType generates realistic metrics based on service type
func generateMockMetricsForType(serviceType string) ServiceMetrics {
	switch serviceType {
	case "frontend":
		return ServiceMetrics{
			RequestRate: 200.0 + float64(time.Now().UnixNano()%100),
			ErrorRate:   0.5 + float64(time.Now().UnixNano()%20)/10.0,
			Latency: struct {
				P50 float64 `json:"p50"`
				P95 float64 `json:"p95"`
				P99 float64 `json:"p99"`
			}{
				P50: 20.0 + float64(time.Now().UnixNano()%30),
				P95: 60.0 + float64(time.Now().UnixNano()%100),
				P99: 150.0 + float64(time.Now().UnixNano()%200),
			},
			SuccessRate: 97.0 + float64(time.Now().UnixNano()%25)/10.0,
		}
	case "database":
		return ServiceMetrics{
			RequestRate: 50.0 + float64(time.Now().UnixNano()%100),
			ErrorRate:   0.1 + float64(time.Now().UnixNano()%5)/10.0,
			Latency: struct {
				P50 float64 `json:"p50"`
				P95 float64 `json:"p95"`
				P99 float64 `json:"p99"`
			}{
				P50: 5.0 + float64(time.Now().UnixNano()%15),
				P95: 15.0 + float64(time.Now().UnixNano()%30),
				P99: 40.0 + float64(time.Now().UnixNano()%80),
			},
			SuccessRate: 99.0 + float64(time.Now().UnixNano()%9)/10.0,
		}
	default: // backend, cache, gateway, sidecar
		return ServiceMetrics{
			RequestRate: 100.0 + float64(time.Now().UnixNano()%200),
			ErrorRate:   0.3 + float64(time.Now().UnixNano()%15)/10.0,
			Latency: struct {
				P50 float64 `json:"p50"`
				P95 float64 `json:"p95"`
				P99 float64 `json:"p99"`
			}{
				P50: 10.0 + float64(time.Now().UnixNano()%25),
				P95: 30.0 + float64(time.Now().UnixNano()%70),
				P99: 80.0 + float64(time.Now().UnixNano()%150),
			},
			SuccessRate: 98.0 + float64(time.Now().UnixNano()%18)/10.0,
		}
	}
}

// GetServiceMesh returns the complete service mesh topology and metrics
func (h *ServicesHandlers) GetServiceMesh(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	
	// Get real Kubernetes services
	servicesList, err := h.k8sClient.ListServices(ctx, "")
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "Failed to list Kubernetes services", err)
		return
	}
	
	// Convert Kubernetes services to ServiceNodes with label-based types
	services := h.convertK8sServicesToNodes(servicesList.Items)
	
	// Generate connections based on service relationships (simplified)
	connections := h.generateServiceConnections(services)
	
	// Calculate metrics from real services
	metrics := h.calculateServiceMeshMetrics(services, connections)
	
	// Build service mesh data response
	meshData := ServiceMeshData{
		Services:    services,
		Connections: connections,
		Metrics:     metrics,
		Timestamp:   time.Now().UTC().Format(time.RFC3339),
	}

	response.SendSuccess(w, meshData)
}

// generateServiceConnections creates connections between services based on common patterns
func (h *ServicesHandlers) generateServiceConnections(services []ServiceNode) []ServiceConnection {
	var connections []ServiceConnection
	
	// Simple heuristic: connect frontends to backends, backends to databases
	var frontends, backends, databases []ServiceNode
	
	for _, svc := range services {
		switch svc.Type {
		case "frontend":
			frontends = append(frontends, svc)
		case "backend":
			backends = append(backends, svc)
		case "database":
			databases = append(databases, svc)
		}
	}
	
	// Connect frontends to backends
	for _, frontend := range frontends {
		for _, backend := range backends {
			connections = append(connections, h.createConnection(frontend.ID, backend.ID, "HTTP"))
		}
	}
	
	// Connect backends to databases
	for _, backend := range backends {
		for _, database := range databases {
			connections = append(connections, h.createConnection(backend.ID, database.ID, "TCP"))
		}
	}
	
	return connections
}

// createConnection creates a service connection with realistic metrics
func (h *ServicesHandlers) createConnection(source, target, protocol string) ServiceConnection {
	now := time.Now().UnixNano()
	return ServiceConnection{
		ID:       source + "-" + target,
		Source:   source,
		Target:   target,
		Protocol: protocol,
		Metrics: struct {
			RequestRate      float64 `json:"requestRate"`
			ErrorRate        float64 `json:"errorRate"`
			Latency          float64 `json:"latency"`
			BytesTransferred int64   `json:"bytesTransferred"`
		}{
			RequestRate:      50.0 + float64(now%200),
			ErrorRate:        0.1 + float64(now%20)/10.0,
			Latency:          5.0 + float64(now%50),
			BytesTransferred: int64(1024 * (1 + now%1000)),
		},
		Security: struct {
			Encrypted  bool    `json:"encrypted"`
			MTLS       bool    `json:"mTLS"`
			AuthPolicy *string `json:"authPolicy,omitempty"`
		}{
			Encrypted: true,
			MTLS:      (now%10) > 3, // 70% have mTLS
		},
		LoadBalancing: []string{"round_robin", "least_conn", "ip_hash"}[now%3],
	}
}

// calculateServiceMeshMetrics calculates overall mesh metrics from services
func (h *ServicesHandlers) calculateServiceMeshMetrics(services []ServiceNode, connections []ServiceConnection) ServiceMeshMetrics {
	var totalRequestRate, totalErrorRate float64
	var latencies []float64
	var healthyServices, totalServices int
	
	totalServices = len(services)
	
	for _, svc := range services {
		totalRequestRate += svc.Metrics.RequestRate
		totalErrorRate += svc.Metrics.ErrorRate
		latencies = append(latencies, svc.Metrics.Latency.P95)
		
		if svc.Status == "healthy" {
			healthyServices++
		}
	}
	
	// Calculate average latency
	var avgLatency float64
	if len(latencies) > 0 {
		for _, latency := range latencies {
			avgLatency += latency
		}
		avgLatency /= float64(len(latencies))
	}
	
	// Calculate average error rate
	var avgErrorRate float64
	if totalServices > 0 {
		avgErrorRate = totalErrorRate / float64(totalServices)
	}
	
	// Count mTLS connections
	var mTLSConnections int
	for _, conn := range connections {
		if conn.Security.MTLS {
			mTLSConnections++
		}
	}
	
	var mTLSCoverage float64
	if len(connections) > 0 {
		mTLSCoverage = float64(mTLSConnections) / float64(len(connections)) * 100
	}
	
	return ServiceMeshMetrics{
		Overview: struct {
			TotalServices       int     `json:"totalServices"`
			HealthyServices     int     `json:"healthyServices"`
			TotalRequestRate    float64 `json:"totalRequestRate"`
			AvgLatency          float64 `json:"avgLatency"`
			ErrorRate           float64 `json:"errorRate"`
			MTLSCoverage        float64 `json:"mTLSCoverage"`
			ActiveConnections   int     `json:"activeConnections"`
			CircuitBreakersOpen int     `json:"circuitBreakersOpen"`
		}{
			TotalServices:       totalServices,
			HealthyServices:     healthyServices,
			TotalRequestRate:    totalRequestRate,
			AvgLatency:          avgLatency,
			ErrorRate:           avgErrorRate,
			MTLSCoverage:        mTLSCoverage,
			ActiveConnections:   len(connections),
			CircuitBreakersOpen: 0, // Would calculate from circuit breaker status
		},
		TopServices: struct {
			ByRequestRate []ServiceNode `json:"byRequestRate"`
			ByErrorRate   []ServiceNode `json:"byErrorRate"`
		}{
			ByRequestRate: h.getTopServicesByRequestRate(services, 5),
			ByErrorRate:   h.getTopServicesByErrorRate(services, 5),
		},
		Alerts: struct {
			CircuitBreakersOpen []ServiceNode       `json:"circuitBreakersOpen"`
			HighErrorRate       []ServiceNode       `json:"highErrorRate"`
			HighLatency         []ServiceNode       `json:"highLatency"`
			SecurityIssues      []ServiceConnection `json:"securityIssues"`
		}{
			CircuitBreakersOpen: h.getServicesWithOpenCircuitBreakers(services),
			HighErrorRate:       h.getServicesWithHighErrorRate(services),
			HighLatency:         h.getServicesWithHighLatency(services),
			SecurityIssues:      h.getConnectionsWithSecurityIssues(connections),
		},
		Trends: struct {
			RequestRateTrend string `json:"requestRateTrend"`
			LatencyTrend     string `json:"latencyTrend"`
			ErrorRateTrend   string `json:"errorRateTrend"`
		}{
			RequestRateTrend: "increasing",
			LatencyTrend:     "stable",
			ErrorRateTrend:   "stable",
		},
	}
}

// Helper functions for metrics calculation
func (h *ServicesHandlers) getTopServicesByRequestRate(services []ServiceNode, limit int) []ServiceNode {
	// Sort services by request rate (descending) and return top N
	sorted := make([]ServiceNode, len(services))
	copy(sorted, services)
	
	for i := 0; i < len(sorted)-1; i++ {
		for j := 0; j < len(sorted)-i-1; j++ {
			if sorted[j].Metrics.RequestRate < sorted[j+1].Metrics.RequestRate {
				sorted[j], sorted[j+1] = sorted[j+1], sorted[j]
			}
		}
	}
	
	if len(sorted) > limit {
		return sorted[:limit]
	}
	return sorted
}

func (h *ServicesHandlers) getTopServicesByErrorRate(services []ServiceNode, limit int) []ServiceNode {
	// Sort services by error rate (descending) and return top N
	sorted := make([]ServiceNode, len(services))
	copy(sorted, services)
	
	for i := 0; i < len(sorted)-1; i++ {
		for j := 0; j < len(sorted)-i-1; j++ {
			if sorted[j].Metrics.ErrorRate < sorted[j+1].Metrics.ErrorRate {
				sorted[j], sorted[j+1] = sorted[j+1], sorted[j]
			}
		}
	}
	
	if len(sorted) > limit {
		return sorted[:limit]
	}
	return sorted
}

func (h *ServicesHandlers) getServicesWithOpenCircuitBreakers(services []ServiceNode) []ServiceNode {
	var result []ServiceNode
	for _, svc := range services {
		if svc.CircuitBreaker.Status == "open" {
			result = append(result, svc)
		}
	}
	return result
}

func (h *ServicesHandlers) getServicesWithHighErrorRate(services []ServiceNode) []ServiceNode {
	var result []ServiceNode
	for _, svc := range services {
		if svc.Metrics.ErrorRate > 5.0 { // 5% error rate threshold
			result = append(result, svc)
		}
	}
	return result
}

func (h *ServicesHandlers) getServicesWithHighLatency(services []ServiceNode) []ServiceNode {
	var result []ServiceNode
	for _, svc := range services {
		if svc.Metrics.Latency.P95 > 100.0 { // 100ms P95 latency threshold
			result = append(result, svc)
		}
	}
	return result
}

func (h *ServicesHandlers) getConnectionsWithSecurityIssues(connections []ServiceConnection) []ServiceConnection {
	var result []ServiceConnection
	for _, conn := range connections {
		if !conn.Security.Encrypted || !conn.Security.MTLS {
			result = append(result, conn)
		}
	}
	return result
}

// GetServiceTopology returns the service topology
func (h *ServicesHandlers) GetServiceTopology(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	
	// Get real Kubernetes services
	servicesList, err := h.k8sClient.ListServices(ctx, "")
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "Failed to list Kubernetes services", err)
		return
	}
	
	// Convert to topology format
	nodes := []map[string]interface{}{}
	edges := []map[string]interface{}{}
	
	for _, svc := range servicesList.Items {
		if strings.HasPrefix(svc.Namespace, "kube-") {
			continue
		}
		
		nodes = append(nodes, map[string]interface{}{
			"id":        svc.Name,
			"name":      svc.Name,
			"type":      extractServiceType(&svc),
			"namespace": svc.Namespace,
		})
	}
	
	topology := map[string]interface{}{
		"nodes": nodes,
		"edges": edges,
		"metrics": map[string]interface{}{
			"totalNodes": len(nodes),
			"totalEdges": len(edges),
		},
	}

	response.SendSuccess(w, topology)
}

// GetServiceEndpoints returns service endpoints information  
func (h *ServicesHandlers) GetServiceEndpoints(w http.ResponseWriter, r *http.Request) {
	// Return empty endpoints for now - would integrate with service discovery
	endpoints := []map[string]interface{}{}
	
	response.SendSuccess(w, endpoints)
}

// GetServiceFlows returns traffic flow information
func (h *ServicesHandlers) GetServiceFlows(w http.ResponseWriter, r *http.Request) {
	flows := []map[string]interface{}{}
	
	response.SendSuccess(w, flows)
}

// GetServiceGateway returns gateway configuration and metrics
func (h *ServicesHandlers) GetServiceGateway(w http.ResponseWriter, r *http.Request) {
	gateway := map[string]interface{}{
		"status": "healthy",
		"version": "v1.2.0",
		"uptime": "15d 6h 32m",
	}

	response.SendSuccess(w, gateway)
}