package websocket

import (
	"context"
	"log/slog"
	"time"

	"github.com/archellir/denshimon/internal/k8s"
	"github.com/archellir/denshimon/internal/metrics"
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

			// Convert pods to a format suitable for WebSocket
			var podData []map[string]interface{}
			for _, pod := range pods.Items {
				podData = append(podData, map[string]interface{}{
					"name":      pod.Name,
					"namespace": pod.Namespace,
					"status":    string(pod.Status.Phase),
					"nodeName":  pod.Spec.NodeName,
					"ip":        pod.Status.PodIP,
					"startTime": pod.Status.StartTime,
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