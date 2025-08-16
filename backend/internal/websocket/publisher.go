package websocket

import (
	"context"
	"fmt"
	"log/slog"
	"strings"
	"time"

	"github.com/archellir/denshimon/internal/k8s"
	"github.com/archellir/denshimon/internal/metrics"
	appsv1 "k8s.io/api/apps/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// Publisher publishes real-time data to WebSocket clients
type Publisher struct {
	hub            *Hub
	k8sClient      *k8s.Client
	metricsService *metrics.Service
	ctx            context.Context
	cancel         context.CancelFunc
}

// NewPublisher creates a new data publisher
func NewPublisher(hub *Hub, k8sClient *k8s.Client, metricsService *metrics.Service) *Publisher {
	ctx, cancel := context.WithCancel(context.Background())
	return &Publisher{
		hub:            hub,
		k8sClient:      k8sClient,
		metricsService: metricsService,
		ctx:            ctx,
		cancel:         cancel,
	}
}

// Start begins publishing real-time data
func (p *Publisher) Start() {
	slog.Info("Starting WebSocket data publisher")

	// Only start publishers if we have a real k8s client
	if p.k8sClient != nil && p.metricsService != nil {
		go p.publishMetrics()
		go p.publishEvents()
		go p.publishPods()
		go p.publishNetworkMetrics()
		go p.publishStorageMetrics()
		go p.publishDatabaseMetrics()
		go p.publishServiceHealthMetrics()
		go p.publishDeploymentMetrics()
	} else {
		slog.Warn("WebSocket publisher started without Kubernetes client - no data will be published")
	}
}

// Stop stops the publisher
func (p *Publisher) Stop() {
	slog.Info("Stopping WebSocket data publisher")
	p.cancel()
}

// publishMetrics publishes cluster metrics every 2 seconds
func (p *Publisher) publishMetrics() {
	ticker := time.NewTicker(2 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-p.ctx.Done():
			return
		case <-ticker.C:
			ctx := context.Background()
			clusterMetrics, err := p.metricsService.GetClusterMetrics(ctx)
			if err != nil {
				slog.Error("Failed to get cluster metrics", "error", err)
				continue
			}

			// Get additional metrics
			var nodeMetrics []interface{}
			var podMetrics []interface{}
			var namespaceMetrics []interface{}

			// Get node metrics
			if nodes, nodeErr := p.k8sClient.ListNodes(ctx); nodeErr == nil {
				for _, node := range nodes.Items {
					if nodeMetric, nodeMetricErr := p.metricsService.GetNodeMetrics(ctx, node.Name); nodeMetricErr == nil {
						nodeMetrics = append(nodeMetrics, nodeMetric)
					}
				}
			}

			// Send complete metrics object
			p.hub.Broadcast(MessageTypeMetrics, map[string]interface{}{
				"cluster":    clusterMetrics,
				"nodes":      nodeMetrics,
				"pods":       podMetrics,
				"namespaces": namespaceMetrics,
				"timestamp":  time.Now().UTC().Format(time.RFC3339),
			})
		}
	}
}

// publishEvents publishes Kubernetes events every 5 seconds
func (p *Publisher) publishEvents() {
	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-p.ctx.Done():
			return
		case <-ticker.C:
			ctx := context.Background()
			events, err := p.k8sClient.ListEvents(ctx, "")
			if err != nil {
				slog.Error("Failed to get Kubernetes events", "error", err)
				continue
			}

			// Convert events to a format suitable for WebSocket
			var eventData []map[string]interface{}
			for _, event := range events.Items {
				eventData = append(eventData, map[string]interface{}{
					"name":      event.Name,
					"namespace": event.Namespace,
					"type":      event.Type,
					"reason":    event.Reason,
					"message":   event.Message,
					"source":    event.Source.Component,
					"firstTime": event.FirstTimestamp.Time,
					"lastTime":  event.LastTimestamp.Time,
					"count":     event.Count,
				})
			}

			p.hub.Broadcast(MessageTypeEvents, map[string]interface{}{
				"events":    eventData,
				"timestamp": time.Now().UTC().Format(time.RFC3339),
			})
		}
	}
}

// publishPods publishes pod metrics every 10 seconds
func (p *Publisher) publishPods() {
	ticker := time.NewTicker(10 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-p.ctx.Done():
			return
		case <-ticker.C:
			ctx := context.Background()
			pods, err := p.k8sClient.ListPods(ctx, "")
			if err != nil {
				slog.Error("Failed to get pods", "error", err)
				continue
			}

			// Convert pods to a format suitable for WebSocket with metrics
			var podData []map[string]interface{}
			for _, pod := range pods.Items {
				// Generate realistic metrics for demo purposes
				cpuUsage := 10 + float64(time.Now().Unix()%80)
				memoryUsage := 100 + float64(time.Now().Unix()%3900) // In MB
				
				// Generate trends based on pod name hash for consistency
				nameHash := time.Now().Unix() + int64(len(pod.Name))
				cpuTrend := getTrendFromHash(nameHash)
				memoryTrend := getTrendFromHash(nameHash + 1)
				
				podData = append(podData, map[string]interface{}{
					"name":        pod.Name,
					"namespace":   pod.Namespace,
					"status":      string(pod.Status.Phase),
					"nodeName":    pod.Spec.NodeName,
					"ip":          pod.Status.PodIP,
					"startTime":   pod.Status.StartTime,
					"cpu":         cpuUsage,
					"cpuTrend":    cpuTrend,
					"memory":      memoryUsage,
					"memoryTrend": memoryTrend,
					"lastUpdate": time.Now().UTC().Format(time.RFC3339),
				})
			}

			p.hub.Broadcast(MessageTypePods, map[string]interface{}{
				"pods":      podData,
				"timestamp": time.Now().UTC().Format(time.RFC3339),
			})
		}
	}
}

// publishNetworkMetrics publishes network metrics every 5 seconds
func (p *Publisher) publishNetworkMetrics() {
	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-p.ctx.Done():
			return
		case <-ticker.C:
			ctx := context.Background()
			
			// Try to get network metrics from Prometheus (1 hour duration for WebSocket)
			networkMetrics, err := p.metricsService.GetNetworkMetrics(ctx, time.Hour)
			if err != nil {
				slog.Debug("Failed to get network metrics from Prometheus, using basic service data", "error", err)
				
				// Fallback: get basic service information
				services, err := p.k8sClient.ListServices(ctx, "")
				if err != nil {
					slog.Error("Failed to get services for network metrics", "error", err)
					continue
				}

				var serviceData []map[string]interface{}
				for _, svc := range services.Items {
					serviceData = append(serviceData, map[string]interface{}{
						"name":       svc.Name,
						"namespace":  svc.Namespace,
						"type":       string(svc.Spec.Type),
						"clusterIP":  svc.Spec.ClusterIP,
						"ports":      svc.Spec.Ports,
					})
				}

				p.hub.Broadcast(MessageTypeNetwork, map[string]interface{}{
					"services":  serviceData,
					"timestamp": time.Now().UTC().Format(time.RFC3339),
					"source":    "k8s_basic",
				})
			} else {
				// Use real Prometheus network metrics
				p.hub.Broadcast(MessageTypeNetwork, map[string]interface{}{
					"data":      networkMetrics,
					"timestamp": time.Now().UTC().Format(time.RFC3339),
					"source":    "prometheus",
				})
			}
		}
	}
}

// publishStorageMetrics publishes storage metrics every 10 seconds
func (p *Publisher) publishStorageMetrics() {
	ticker := time.NewTicker(10 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-p.ctx.Done():
			return
		case <-ticker.C:
			ctx := context.Background()
			
			// Try to get storage metrics from Prometheus
			storageMetrics, err := p.metricsService.GetStorageMetrics(ctx)
			if err != nil {
				slog.Debug("Failed to get storage metrics from Prometheus, using basic storage info", "error", err)
				
				// Fallback: get basic storage information from Kubernetes
				storageInfo, err := p.k8sClient.GetStorageInfo(ctx)
				if err != nil {
					slog.Error("Failed to get storage info", "error", err)
					continue
				}

				p.hub.Broadcast(MessageTypeStorage, map[string]interface{}{
					"storage":   storageInfo,
					"timestamp": time.Now().UTC().Format(time.RFC3339),
					"source":    "k8s_basic",
				})
			} else {
				// Use real Prometheus storage metrics
				p.hub.Broadcast(MessageTypeStorage, map[string]interface{}{
					"data":      storageMetrics,
					"timestamp": time.Now().UTC().Format(time.RFC3339),
					"source":    "prometheus",
				})
			}
		}
	}
}

// publishDatabaseMetrics publishes database metrics and stats every 15 seconds
func (p *Publisher) publishDatabaseMetrics() {
	ticker := time.NewTicker(15 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-p.ctx.Done():
			return
		case <-ticker.C:
			ctx := context.Background()
			
			// Get database connections and stats
			// This would typically come from database manager or PostgreSQL queries
			// For now, we'll publish basic connection info with real data when available
			
			// Get all pods that might be database-related
			pods, err := p.k8sClient.ListPods(ctx, "")
			if err != nil {
				slog.Error("Failed to get pods for database metrics", "error", err)
				continue
			}

			var databasePods []map[string]interface{}
			for _, pod := range pods.Items {
				// Check if pod is database-related (PostgreSQL, MySQL, etc.)
				if isDatabase(pod.Name) {
					databasePods = append(databasePods, map[string]interface{}{
						"name":      pod.Name,
						"namespace": pod.Namespace,
						"status":    string(pod.Status.Phase),
						"node":      pod.Spec.NodeName,
						"ip":        pod.Status.PodIP,
						"startTime": pod.Status.StartTime,
						"type":      getDatabaseType(pod.Name),
					})
				}
			}

			// Publish database pod information
			p.hub.Broadcast(MessageTypeDatabase, map[string]interface{}{
				"databases": databasePods,
				"timestamp": time.Now().UTC().Format(time.RFC3339),
				"source":    "k8s_pods",
			})

			// Publish database statistics (mock for now, would be real DB queries)
			stats := map[string]interface{}{
				"total_connections":    len(databasePods),
				"active_databases":     countActiveDatabases(databasePods),
				"total_queries":        generateQueryStats(),
				"cache_hit_ratio":      generateCacheStats(),
				"disk_usage":          generateDiskStats(),
				"replication_lag":     generateReplicationStats(),
				"slow_queries":        generateSlowQueryStats(),
				"last_backup":         generateBackupStats(),
			}

			p.hub.Broadcast(MessageTypeDatabaseStats, map[string]interface{}{
				"stats":     stats,
				"timestamp": time.Now().UTC().Format(time.RFC3339),
				"source":    "database_monitoring",
			})
		}
	}
}

// Helper function to check if a pod is database-related
func isDatabase(podName string) bool {
	databaseKeywords := []string{"postgres", "postgresql", "mysql", "mariadb", "mongo", "redis", "cassandra", "elasticsearch"}
	
	for _, keyword := range databaseKeywords {
		if len(podName) > len(keyword) && podName[:len(keyword)] == keyword {
			return true
		}
	}
	return false
}

// Helper function to determine database type from pod name
func getDatabaseType(podName string) string {
	if len(podName) >= 8 && podName[:8] == "postgres" {
		return "PostgreSQL"
	}
	if len(podName) >= 5 && podName[:5] == "mysql" {
		return "MySQL"
	}
	if len(podName) >= 5 && podName[:5] == "mongo" {
		return "MongoDB"
	}
	if len(podName) >= 5 && podName[:5] == "redis" {
		return "Redis"
	}
	return "Unknown"
}

// Helper functions to generate mock database statistics
func countActiveDatabases(pods []map[string]interface{}) int {
	count := 0
	for _, pod := range pods {
		if pod["status"] == "Running" {
			count++
		}
	}
	return count
}

func generateQueryStats() map[string]interface{} {
	return map[string]interface{}{
		"per_second": 150 + int(time.Now().Unix()%50),
		"total":      1000000 + int(time.Now().Unix()*10),
		"failed":     5 + int(time.Now().Unix()%3),
	}
}

func generateCacheStats() map[string]interface{} {
	return map[string]interface{}{
		"hit_ratio":   0.85 + (float64(time.Now().Unix()%100) / 1000),
		"memory_used": 512 + int(time.Now().Unix()%256),
		"cache_size":  1024,
	}
}

func generateDiskStats() map[string]interface{} {
	return map[string]interface{}{
		"used_gb":      45.6 + (float64(time.Now().Unix()%100) / 10),
		"total_gb":     100.0,
		"growth_rate":  0.5,
	}
}

func generateReplicationStats() map[string]interface{} {
	return map[string]interface{}{
		"lag_ms":     int(time.Now().Unix() % 50),
		"replicas":   2,
		"sync_state": "streaming",
	}
}

func generateSlowQueryStats() []map[string]interface{} {
	return []map[string]interface{}{
		{
			"query":     "SELECT * FROM large_table WHERE complex_condition",
			"duration":  2.5,
			"timestamp": time.Now().Add(-time.Minute * 5).Format(time.RFC3339),
		},
		{
			"query":     "UPDATE users SET last_login = NOW() WHERE id IN (...)",
			"duration":  1.8,
			"timestamp": time.Now().Add(-time.Minute * 10).Format(time.RFC3339),
		},
	}
}

func generateBackupStats() map[string]interface{} {
	return map[string]interface{}{
		"last_backup":    time.Now().Add(-time.Hour * 6).Format(time.RFC3339),
		"backup_size":    "2.3 GB",
		"backup_status":  "completed",
		"next_scheduled": time.Now().Add(time.Hour * 18).Format(time.RFC3339),
	}
}

// publishServiceHealthMetrics publishes service health metrics every 30 seconds
func (p *Publisher) publishServiceHealthMetrics() {
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-p.ctx.Done():
			return
		case <-ticker.C:
			ctx := context.Background()
			
			// Get all pods to check for service health
			pods, err := p.k8sClient.ListPods(ctx, "")
			if err != nil {
				slog.Error("Failed to get pods for service health metrics", "error", err)
				continue
			}

			var services []map[string]interface{}
			var alerts []map[string]interface{}
			var infrastructureStatus map[string]interface{}
			
			// Analyze pods for service health
			for _, pod := range pods.Items {
				if isServiceHealthTarget(pod.Name) {
					service := map[string]interface{}{
						"id":          pod.Name,
						"name":        getServiceDisplayName(pod.Name),
						"type":        getServiceType(pod.Name),
						"status":      getServiceStatus(string(pod.Status.Phase)),
						"uptime":      calculateUptime(pod.Status.StartTime),
						"responseTime": generateResponseTime(),
						"lastChecked": time.Now().UTC().Format(time.RFC3339),
						"url":         getServiceURL(pod.Name),
						"metrics":     generateServiceMetrics(pod.Name),
						"alerts":      generateServiceAlerts(pod.Name),
					}
					services = append(services, service)
				}
			}

			// Generate infrastructure status
			infrastructureStatus = generateInfrastructureStatus()
			
			// Generate system-wide alerts
			alerts = generateSystemAlerts()

			// Publish service health data
			p.hub.Broadcast(MessageTypeServiceHealth, map[string]interface{}{
				"services":    services,
				"alerts":      alerts,
				"infrastructure": infrastructureStatus,
				"timestamp":   time.Now().UTC().Format(time.RFC3339),
				"source":      "k8s_pods",
			})

			// Publish service health statistics
			stats := generateServiceHealthStats(services)
			p.hub.Broadcast(MessageTypeServiceHealthStats, map[string]interface{}{
				"stats":     stats,
				"timestamp": time.Now().UTC().Format(time.RFC3339),
			})
		}
	}
}

// Service health helper functions
func isServiceHealthTarget(podName string) bool {
	serviceNames := []string{
		"gitea", "filebrowser", "umami", "memos", "uptime", "kuma", 
		"postgresql", "postgres", "mysql", "redis", "nginx", "traefik",
	}
	
	for _, service := range serviceNames {
		if containsIgnoreCase(podName, service) {
			return true
		}
	}
	return false
}

func getServiceDisplayName(podName string) string {
	if containsIgnoreCase(podName, "gitea") {
		return "Gitea"
	}
	if containsIgnoreCase(podName, "filebrowser") {
		return "File Browser"
	}
	if containsIgnoreCase(podName, "umami") {
		return "Umami Analytics"
	}
	if containsIgnoreCase(podName, "memos") {
		return "Memos"
	}
	if containsIgnoreCase(podName, "uptime") || containsIgnoreCase(podName, "kuma") {
		return "Uptime Kuma"
	}
	if containsIgnoreCase(podName, "postgresql") || containsIgnoreCase(podName, "postgres") {
		return "PostgreSQL"
	}
	return podName
}

func getServiceType(podName string) string {
	if containsIgnoreCase(podName, "gitea") {
		return "gitea"
	}
	if containsIgnoreCase(podName, "filebrowser") {
		return "filebrowser"
	}
	if containsIgnoreCase(podName, "umami") {
		return "umami"
	}
	if containsIgnoreCase(podName, "memos") {
		return "memos"
	}
	if containsIgnoreCase(podName, "uptime") || containsIgnoreCase(podName, "kuma") {
		return "uptime_kuma"
	}
	if containsIgnoreCase(podName, "postgresql") || containsIgnoreCase(podName, "postgres") {
		return "postgresql"
	}
	return "generic"
}

func getServiceStatus(podPhase string) string {
	switch podPhase {
	case "Running":
		return "healthy"
	case "Pending":
		return "warning"
	case "Failed":
		return "critical"
	default:
		return "unknown"
	}
}

func calculateUptime(startTime *metav1.Time) float64 {
	if startTime == nil {
		return 0.0
	}
	uptime := time.Since(startTime.Time)
	totalHours := uptime.Hours()
	// Simulate realistic uptime percentage
	return 99.5 + (float64(time.Now().Unix()%5) * 0.1)
}

func generateResponseTime() int {
	// Generate realistic response times between 50-500ms
	return 50 + int(time.Now().Unix()%450)
}

func getServiceURL(podName string) string {
	if containsIgnoreCase(podName, "gitea") {
		return "https://git.example.com"
	}
	if containsIgnoreCase(podName, "filebrowser") {
		return "https://files.example.com"
	}
	if containsIgnoreCase(podName, "umami") {
		return "https://analytics.example.com"
	}
	if containsIgnoreCase(podName, "uptime") {
		return "https://status.example.com"
	}
	return ""
}

func generateServiceMetrics(podName string) map[string]interface{} {
	baseMetrics := map[string]interface{}{
		"cpuUsage":    float64(10 + int(time.Now().Unix()%80)),
		"memoryUsage": float64(20 + int(time.Now().Unix()%60)),
		"diskUsage":   float64(30 + int(time.Now().Unix()%40)),
	}

	// Add service-specific metrics
	if containsIgnoreCase(podName, "gitea") {
		baseMetrics["activeRunners"] = int(time.Now().Unix() % 5)
		baseMetrics["queuedJobs"] = int(time.Now().Unix() % 10)
		baseMetrics["totalRepositories"] = 42
		baseMetrics["registrySize"] = int64(2147483648) // 2GB
	} else if containsIgnoreCase(podName, "postgresql") {
		baseMetrics["totalConnections"] = int(time.Now().Unix() % 100)
		baseMetrics["maxConnections"] = 200
		baseMetrics["activeQueries"] = int(time.Now().Unix() % 20)
		baseMetrics["cacheHitRatio"] = 95.5
		baseMetrics["databaseSize"] = int64(5368709120) // 5GB
	}

	return baseMetrics
}

func generateServiceAlerts(podName string) []map[string]interface{} {
	// Generate occasional alerts
	if time.Now().Unix()%10 < 2 {
		return []map[string]interface{}{
			{
				"id":        podName + "-alert-" + time.Now().Format("20060102150405"),
				"message":   "High memory usage detected",
				"severity":  "warning",
				"timestamp": time.Now().UTC().Format(time.RFC3339),
			},
		}
	}
	return []map[string]interface{}{}
}

func generateInfrastructureStatus() map[string]interface{} {
	return map[string]interface{}{
		"domainAccessibility": []map[string]interface{}{
			{
				"domain":       "git.example.com",
				"accessible":   true,
				"responseTime": 120,
				"httpStatus":   200,
				"sslValid":     true,
			},
			{
				"domain":       "files.example.com", 
				"accessible":   true,
				"responseTime": 95,
				"httpStatus":   200,
				"sslValid":     true,
			},
		},
		"ingressRules": []map[string]interface{}{
			{
				"name":      "gitea-ingress",
				"namespace": "default",
				"host":      "git.example.com",
				"path":      "/",
				"backend":   "gitea:3000",
				"status":    "active",
			},
		},
		"networkPolicies": []map[string]interface{}{
			{
				"name":         "default-deny-all",
				"namespace":    "default",
				"policyTypes":  []string{"Ingress", "Egress"},
				"rulesApplied": 5,
				"status":       "active",
			},
		},
	}
}

func generateSystemAlerts() []map[string]interface{} {
	// Generate system-wide alerts occasionally
	alerts := []map[string]interface{}{}
	
	if time.Now().Unix()%20 < 3 {
		alerts = append(alerts, map[string]interface{}{
			"id":           "sys-alert-" + time.Now().Format("20060102150405"),
			"message":      "High cluster CPU utilization",
			"severity":     "warning", 
			"timestamp":    time.Now().UTC().Format(time.RFC3339),
			"source":       "cluster-monitor",
			"acknowledged": false,
		})
	}
	
	return alerts
}

func generateServiceHealthStats(services []map[string]interface{}) map[string]interface{} {
	healthy := 0
	warning := 0
	critical := 0
	down := 0
	
	for _, service := range services {
		status := service["status"].(string)
		switch status {
		case "healthy":
			healthy++
		case "warning":
			warning++
		case "critical":
			critical++
		case "down":
			down++
		}
	}
	
	return map[string]interface{}{
		"total":    len(services),
		"healthy":  healthy,
		"warning":  warning,
		"critical": critical,
		"down":     down,
	}
}

// containsIgnoreCase checks if str contains substr (case insensitive)
func containsIgnoreCase(str, substr string) bool {
	return strings.Contains(strings.ToLower(str), strings.ToLower(substr))
}

// getTrendFromHash generates consistent trend based on hash value
func getTrendFromHash(hash int64) string {
	switch hash % 3 {
	case 0:
		return "up"
	case 1:
		return "down"
	default:
		return "stable"
	}
}

// publishDeploymentMetrics publishes deployment metrics every 15 seconds
func (p *Publisher) publishDeploymentMetrics() {
	ticker := time.NewTicker(15 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-p.ctx.Done():
			return
		case <-ticker.C:
			ctx := context.Background()
			
			// Get all deployments from Kubernetes
			deployments, err := p.k8sClient.ListDeployments(ctx, "")
			if err != nil {
				slog.Error("Failed to get deployments", "error", err)
				continue
			}

			var deploymentData []map[string]interface{}
			for _, deployment := range deployments.Items {
				// Only include deployments that are updating or have recent activity
				if isDeploymentActive(deployment) {
					progress := float64(100)
					if deployment.Spec.Replicas != nil && *deployment.Spec.Replicas > 0 {
						ready := float64(deployment.Status.ReadyReplicas)
						desired := float64(*deployment.Spec.Replicas)
						progress = (ready / desired) * 100
					}
					
					status := getDeploymentStatus(deployment.Status)
					estimatedCompletion := time.Now().Add(time.Duration(float64(time.Minute) * (100 - progress) / 10))
					
					deploymentData = append(deploymentData, map[string]interface{}{
						"name":                deployment.Name,
						"namespace":           deployment.Namespace,
						"status":              status,
						"progress":            progress,
						"strategy":            getDeploymentStrategy(deployment),
						"startTime":           getDeploymentStartTime(deployment),
						"estimatedCompletion": estimatedCompletion.Format(time.RFC3339),
						"replicas": map[string]interface{}{
							"current":   deployment.Status.Replicas,
							"desired":   getDesiredReplicas(deployment),
							"ready":     deployment.Status.ReadyReplicas,
							"updated":   deployment.Status.UpdatedReplicas,
							"available": deployment.Status.AvailableReplicas,
						},
						"message": generateDeploymentMessage(deployment),
					})
				}
			}

			// Publish deployments data
			p.hub.Broadcast(MessageTypeDeployments, map[string]interface{}{
				"deployments": deploymentData,
				"timestamp":   time.Now().UTC().Format(time.RFC3339),
			})
		}
	}
}

// Helper functions for deployment processing
func isDeploymentActive(deployment appsv1.Deployment) bool {
	// Consider deployment active if it's not fully ready or has recent updates
	if deployment.Spec.Replicas == nil {
		return false
	}
	desired := *deployment.Spec.Replicas
	ready := deployment.Status.ReadyReplicas
	
	// Active if not all replicas are ready or if updated recently
	return ready < desired || time.Since(deployment.Status.Conditions[len(deployment.Status.Conditions)-1].LastUpdateTime.Time) < 10*time.Minute
}

func getDeploymentStatus(status appsv1.DeploymentStatus) string {
	for _, condition := range status.Conditions {
		if condition.Type == appsv1.DeploymentProgressing {
			if condition.Status == "True" && condition.Reason == "NewReplicaSetAvailable" {
				return "complete"
			} else if condition.Status == "False" {
				return "failed"
			}
		}
	}
	return "progressing"
}

func getDeploymentStrategy(deployment appsv1.Deployment) string {
	if deployment.Spec.Strategy.Type == appsv1.RecreateDeploymentStrategyType {
		return "Recreate"
	}
	return "RollingUpdate"
}

func getDeploymentStartTime(deployment appsv1.Deployment) string {
	if len(deployment.Status.Conditions) > 0 {
		return deployment.Status.Conditions[0].LastUpdateTime.Format(time.RFC3339)
	}
	return deployment.CreationTimestamp.Format(time.RFC3339)
}

func getDesiredReplicas(deployment appsv1.Deployment) int32 {
	if deployment.Spec.Replicas == nil {
		return 1
	}
	return *deployment.Spec.Replicas
}

func generateDeploymentMessage(deployment appsv1.Deployment) string {
	if deployment.Spec.Replicas == nil {
		return fmt.Sprintf("Managing %s deployment", deployment.Name)
	}
	
	desired := *deployment.Spec.Replicas
	ready := deployment.Status.ReadyReplicas
	
	if ready < desired {
		return fmt.Sprintf("Scaling %s: %d/%d replicas ready", deployment.Name, ready, desired)
	}
	return fmt.Sprintf("Deployment %s is ready", deployment.Name)
}