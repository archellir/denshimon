package api

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/archellir/denshimon/internal/k8s"
)

type ServicesHandlers struct {
	k8sClient *k8s.Client
}

func NewServicesHandlers(k8sClient *k8s.Client) *ServicesHandlers {
	return &ServicesHandlers{
		k8sClient: k8sClient,
	}
}

// ServiceMeshData represents the full service mesh topology
type ServiceMeshData struct {
	Services    []ServiceNode      `json:"services"`
	Connections []ServiceConnection `json:"connections"`
	Endpoints   []APIEndpoint      `json:"endpoints"`
	Flows       []TrafficFlow      `json:"flows"`
	Metrics     ServiceMeshMetrics `json:"metrics"`
	Timestamp   string             `json:"timestamp"`
}

type ServiceNode struct {
	ID        string                 `json:"id"`
	Name      string                 `json:"name"`
	Namespace string                 `json:"namespace"`
	Version   string                 `json:"version"`
	Type      string                 `json:"type"`
	Status    string                 `json:"status"`
	Instances int                    `json:"instances"`
	Metrics   ServiceMetrics         `json:"metrics"`
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
	Status           string  `json:"status"`
	FailureThreshold int     `json:"failureThreshold"`
	Timeout          int     `json:"timeout"`
	LastTripped      *string `json:"lastTripped,omitempty"`
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

type APIEndpoint struct {
	ID            string `json:"id"`
	ServiceID     string `json:"serviceId"`
	Path          string `json:"path"`
	Method        string `json:"method"`
	Metrics       struct {
		RequestRate float64 `json:"requestRate"`
		ErrorRate   float64 `json:"errorRate"`
		Latency     struct {
			P50 float64 `json:"p50"`
			P95 float64 `json:"p95"`
			P99 float64 `json:"p99"`
		} `json:"latency"`
		StatusCodes map[string]int `json:"statusCodes"`
	} `json:"metrics"`
	RateLimit      *RateLimit `json:"rateLimit,omitempty"`
	Authentication bool       `json:"authentication"`
	Deprecated     bool       `json:"deprecated"`
}

type RateLimit struct {
	Limit   int    `json:"limit"`
	Period  string `json:"period"`
	Current int    `json:"current"`
}

type TrafficFlow struct {
	ID           string   `json:"id"`
	Path         []string `json:"path"`
	RequestRate  float64  `json:"requestRate"`
	AvgLatency   float64  `json:"avgLatency"`
	ErrorRate    float64  `json:"errorRate"`
	CriticalPath bool     `json:"criticalPath"`
}

type ServiceMeshMetrics struct {
	Overview struct {
		TotalServices    int     `json:"totalServices"`
		TotalConnections int     `json:"totalConnections"`
		TotalRequestRate float64 `json:"totalRequestRate"`
		AvgLatency       float64 `json:"avgLatency"`
		ErrorRate        float64 `json:"errorRate"`
		MTLSCoverage     float64 `json:"mTLSCoverage"`
	} `json:"overview"`
	TopServices struct {
		ByRequestRate []ServiceNode `json:"byRequestRate"`
		ByLatency     []ServiceNode `json:"byLatency"`
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

// GetServiceMesh returns the complete service mesh topology and metrics
func (h *ServicesHandlers) GetServiceMesh(w http.ResponseWriter, r *http.Request) {
	// Generate mock service mesh data for VPS
	// In a real implementation, this would query Kubernetes services, deployments, etc.
	
	services := []ServiceNode{
		{
			ID:        "api-service",
			Name:      "api-service",
			Namespace: "production",
			Version:   "v1.2.0",
			Type:      "backend",
			Status:    "healthy",
			Instances: 2,
			Metrics: ServiceMetrics{
				RequestRate: 150.5,
				ErrorRate:   0.8,
				Latency: struct {
					P50 float64 `json:"p50"`
					P95 float64 `json:"p95"`
					P99 float64 `json:"p99"`
				}{P50: 12.5, P95: 45.2, P99: 120.8},
				SuccessRate: 99.2,
			},
			CircuitBreaker: CircuitBreakerInfo{
				Status:           "closed",
				FailureThreshold: 50,
				Timeout:          30000,
			},
		},
		{
			ID:        "web-frontend",
			Name:      "web-frontend", 
			Namespace: "production",
			Version:   "v2.1.0",
			Type:      "frontend",
			Status:    "healthy",
			Instances: 3,
			Metrics: ServiceMetrics{
				RequestRate: 320.2,
				ErrorRate:   1.2,
				Latency: struct {
					P50 float64 `json:"p50"`
					P95 float64 `json:"p95"`
					P99 float64 `json:"p99"`
				}{P50: 25.1, P95: 89.5, P99: 250.3},
				SuccessRate: 98.8,
			},
			CircuitBreaker: CircuitBreakerInfo{
				Status:           "closed",
				FailureThreshold: 50,
				Timeout:          30000,
			},
		},
		{
			ID:        "database",
			Name:      "postgres-db",
			Namespace: "production", 
			Version:   "v13.8",
			Type:      "database",
			Status:    "healthy",
			Instances: 1,
			Metrics: ServiceMetrics{
				RequestRate: 890.7,
				ErrorRate:   0.1,
				Latency: struct {
					P50 float64 `json:"p50"`
					P95 float64 `json:"p95"`
					P99 float64 `json:"p99"`
				}{P50: 3.2, P95: 12.8, P99: 28.5},
				SuccessRate: 99.9,
			},
			CircuitBreaker: CircuitBreakerInfo{
				Status:           "closed",
				FailureThreshold: 80,
				Timeout:          10000,
			},
		},
	}

	connections := []ServiceConnection{
		{
			ID:       "conn-1",
			Source:   "web-frontend",
			Target:   "api-service",
			Protocol: "HTTP",
			Metrics: struct {
				RequestRate      float64 `json:"requestRate"`
				ErrorRate        float64 `json:"errorRate"`
				Latency          float64 `json:"latency"`
				BytesTransferred int64   `json:"bytesTransferred"`
			}{
				RequestRate:      320.2,
				ErrorRate:        1.2,
				Latency:          15.8,
				BytesTransferred: 1048576,
			},
			Security: struct {
				Encrypted  bool    `json:"encrypted"`
				MTLS       bool    `json:"mTLS"`
				AuthPolicy *string `json:"authPolicy,omitempty"`
			}{
				Encrypted: true,
				MTLS:      true,
			},
			LoadBalancing: "round_robin",
		},
		{
			ID:       "conn-2",
			Source:   "api-service",
			Target:   "database",
			Protocol: "TCP",
			Metrics: struct {
				RequestRate      float64 `json:"requestRate"`
				ErrorRate        float64 `json:"errorRate"`
				Latency          float64 `json:"latency"`
				BytesTransferred int64   `json:"bytesTransferred"`
			}{
				RequestRate:      150.5,
				ErrorRate:        0.1,
				Latency:          3.2,
				BytesTransferred: 2097152,
			},
			Security: struct {
				Encrypted  bool    `json:"encrypted"`
				MTLS       bool    `json:"mTLS"`
				AuthPolicy *string `json:"authPolicy,omitempty"`
			}{
				Encrypted: true,
				MTLS:      false,
			},
			LoadBalancing: "least_conn",
		},
	}

	// Calculate overview metrics
	totalServices := len(services)
	totalConnections := len(connections)
	totalRequestRate := 0.0
	totalErrorRate := 0.0
	for _, service := range services {
		totalRequestRate += service.Metrics.RequestRate
		totalErrorRate += service.Metrics.ErrorRate
	}
	avgErrorRate := totalErrorRate / float64(totalServices)

	meshData := ServiceMeshData{
		Services:    services,
		Connections: connections,
		Endpoints:   []APIEndpoint{}, // TODO: Generate endpoints
		Flows:       []TrafficFlow{}, // TODO: Generate flows
		Metrics: ServiceMeshMetrics{
			Overview: struct {
				TotalServices    int     `json:"totalServices"`
				TotalConnections int     `json:"totalConnections"`
				TotalRequestRate float64 `json:"totalRequestRate"`
				AvgLatency       float64 `json:"avgLatency"`
				ErrorRate        float64 `json:"errorRate"`
				MTLSCoverage     float64 `json:"mTLSCoverage"`
			}{
				TotalServices:    totalServices,
				TotalConnections: totalConnections,
				TotalRequestRate: totalRequestRate,
				AvgLatency:       25.8,
				ErrorRate:        avgErrorRate,
				MTLSCoverage:     50.0,
			},
			TopServices: struct {
				ByRequestRate []ServiceNode `json:"byRequestRate"`
				ByLatency     []ServiceNode `json:"byLatency"`
				ByErrorRate   []ServiceNode `json:"byErrorRate"`
			}{
				ByRequestRate: services[:2], // Top 2 by request rate
				ByLatency:     services[:2], // Top 2 by latency  
				ByErrorRate:   services[:2], // Top 2 by error rate
			},
			Alerts: struct {
				CircuitBreakersOpen []ServiceNode       `json:"circuitBreakersOpen"`
				HighErrorRate       []ServiceNode       `json:"highErrorRate"`
				HighLatency         []ServiceNode       `json:"highLatency"`
				SecurityIssues      []ServiceConnection `json:"securityIssues"`
			}{
				CircuitBreakersOpen: []ServiceNode{},
				HighErrorRate:       []ServiceNode{},
				HighLatency:         []ServiceNode{},
				SecurityIssues:      []ServiceConnection{},
			},
			Trends: struct {
				RequestRateTrend string `json:"requestRateTrend"`
				LatencyTrend     string `json:"latencyTrend"`
				ErrorRateTrend   string `json:"errorRateTrend"`
			}{
				RequestRateTrend: "stable",
				LatencyTrend:     "stable", 
				ErrorRateTrend:   "stable",
			},
		},
		Timestamp: time.Now().UTC().Format(time.RFC3339),
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(meshData)
}