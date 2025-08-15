package websocket

import (
	"context"
	"fmt"
	"log/slog"
	"math/rand"
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

	// Start different publishers with different intervals
	go p.publishMetrics()
	go p.publishLogs()
	go p.publishWorkflows()
	go p.publishEvents()
	go p.publishPods()
	go p.publishServices()
	go p.publishAlerts()
	go p.publishGitOpsEvents()
	go p.publishNetworkMetrics()
	go p.publishStorageMetrics()
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
			if p.k8sClient != nil && p.metricsService != nil {
				// Get real metrics from Kubernetes
				ctx := context.Background()
				clusterMetrics, err := p.metricsService.GetClusterMetrics(ctx)

				// Get additional metrics that frontend expects
				var nodeMetrics []interface{}
				var podMetrics []interface{}
				var namespaceMetrics []interface{}

				if err == nil {
					// Try to get node metrics (single VPS)
					if nodes, nodeErr := p.k8sClient.ListNodes(ctx); nodeErr == nil {
						for _, node := range nodes.Items {
							if nodeMetric, nodeMetricErr := p.metricsService.GetNodeMetrics(ctx, node.Name); nodeMetricErr == nil {
								nodeMetrics = append(nodeMetrics, nodeMetric)
							}
						}
					}

					// Send complete metrics object that frontend expects
					p.hub.Broadcast(MessageTypeMetrics, map[string]interface{}{
						"cluster":    clusterMetrics,
						"nodes":      nodeMetrics,
						"pods":       podMetrics,
						"namespaces": namespaceMetrics,
						"timestamp":  time.Now().UTC().Format(time.RFC3339),
					})
				}
			} else {
				// Generate mock metrics for development
				p.hub.Broadcast(MessageTypeMetrics, p.generateMockMetrics())
			}
		}
	}
}

// publishLogs publishes log entries every 1-3 seconds
func (p *Publisher) publishLogs() {
	for {
		select {
		case <-p.ctx.Done():
			return
		default:
			// Random interval between 1-3 seconds
			time.Sleep(time.Duration(1000+rand.Intn(2000)) * time.Millisecond)

			logEntry := p.generateMockLogEntry()
			p.hub.Broadcast(MessageTypeLogs, logEntry)
		}
	}
}

// publishWorkflows publishes workflow updates every 5-10 seconds
func (p *Publisher) publishWorkflows() {
	for {
		select {
		case <-p.ctx.Done():
			return
		default:
			// Random interval between 5-10 seconds
			time.Sleep(time.Duration(5000+rand.Intn(5000)) * time.Millisecond)

			workflow := p.generateMockWorkflow()
			p.hub.Broadcast(MessageTypeWorkflows, workflow)
		}
	}
}

// publishEvents publishes Kubernetes events every 3-7 seconds
func (p *Publisher) publishEvents() {
	for {
		select {
		case <-p.ctx.Done():
			return
		default:
			// Random interval between 3-7 seconds
			time.Sleep(time.Duration(3000+rand.Intn(4000)) * time.Millisecond)

			event := p.generateMockEvent()
			p.hub.Broadcast(MessageTypeEvents, event)
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
			pods := p.generateMockPodMetrics()
			p.hub.Broadcast(MessageTypePods, pods)
		}
	}
}

// publishAlerts publishes alerts occasionally
func (p *Publisher) publishAlerts() {
	for {
		select {
		case <-p.ctx.Done():
			return
		default:
			// Random interval between 10-30 seconds
			time.Sleep(time.Duration(10000+rand.Intn(20000)) * time.Millisecond)

			// Only send alert 20% of the time
			if rand.Float32() < 0.2 {
				alert := p.generateMockAlert()
				p.hub.Broadcast(MessageTypeAlerts, alert)
			}
		}
	}
}

// Mock data generators (for development and demonstration)

func (p *Publisher) generateMockMetrics() map[string]interface{} {
	return map[string]interface{}{
		"cluster": map[string]interface{}{
			"cpu_usage": map[string]interface{}{
				"usage_percent": 65 + rand.Float64()*20,   // 65-85% (realistic for VPS)
				"used":          5200 + rand.Int63n(1600), // 5.2-6.8 cores
				"total":         8000,                     // 8 cores
				"available":     1800 - rand.Int63n(1600),
				"usage":         5.2 + rand.Float64()*1.6,
				"unit":          "m",
			},
			"memory_usage": map[string]interface{}{
				"usage_percent": 75 + rand.Float64()*15,                // 75-90% (realistic for VPS)
				"used":          12884901888 + rand.Int63n(2147483648), // 12-14GB
				"total":         17179869184,                           // 16GB
				"available":     4294967296 - rand.Int63n(2147483648),
				"usage":         12884901888 + rand.Int63n(2147483648),
				"unit":          "bytes",
			},
			"ready_nodes":      1, // Single VPS
			"total_nodes":      1,
			"running_pods":     15 + rand.Intn(5), // 15-20 pods
			"pending_pods":     rand.Intn(2),      // 0-1 pending
			"failed_pods":      rand.Intn(2),      // 0-1 failed
			"total_pods":       20,
			"healthy_pods":     15 + rand.Intn(5),
			"unhealthy_pods":   rand.Intn(2),
			"total_namespaces": 5,
		},
		"nodes": []map[string]interface{}{
			{
				"name":         "vps-main",
				"status":       "Ready",
				"version":      "v1.28.2",
				"os":           "Ubuntu 22.04.3 LTS",
				"architecture": "amd64",
				"age":          "15d",
				"pod_count":    18,
				"cpu_usage": map[string]interface{}{
					"used":          5200,
					"total":         8000,
					"available":     2800,
					"usage_percent": 65.0,
					"usage":         5.2,
					"unit":          "m",
				},
				"memory_usage": map[string]interface{}{
					"used":          12884901888,
					"total":         17179869184,
					"available":     4294967296,
					"usage_percent": 75.0,
					"usage":         12884901888,
					"unit":          "bytes",
				},
				"storage_usage": map[string]interface{}{
					"used":          96636764160,
					"total":         214748364800,
					"available":     118111600640,
					"usage_percent": 45.0,
					"usage":         96636764160,
					"unit":          "bytes",
				},
				"last_updated": time.Now().UTC().Format(time.RFC3339),
			},
		},
		"pods":       []map[string]interface{}{}, // Empty for now
		"namespaces": []map[string]interface{}{}, // Empty for now
		"timestamp":  time.Now().UTC().Format(time.RFC3339),
	}
}

func (p *Publisher) generateMockLogEntry() map[string]interface{} {
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
	}

	// Generate VPS-specific log entry matching frontend LogEntry interface
	return map[string]interface{}{
		"id":        fmt.Sprintf("%d", time.Now().UnixNano()),
		"timestamp": time.Now().UTC().Format(time.RFC3339),
		"level":     levels[rand.Intn(len(levels))],
		"source":    sources[rand.Intn(len(sources))],
		"message":   messages[rand.Intn(len(messages))],
		"user":      "system",
		"action":    "log_entry",
		"metadata": map[string]interface{}{
			"namespace": namespaces[rand.Intn(len(namespaces))],
			"pod":       "app-" + randomStringForPublisher(8),
			"node":      "vps-main", // Single VPS node
			"ip":        "10.0.0." + fmt.Sprintf("%d", rand.Intn(255)+1),
			"duration":  rand.Intn(1000) + 50, // milliseconds
		},
	}
}

func (p *Publisher) generateMockWorkflow() map[string]interface{} {
	statuses := []string{"in_progress", "completed", "failed", "queued"}
	conclusions := []string{"success", "failure", "neutral"}
	repositories := []string{"web-frontend", "api-backend", "mobile-app", "data-processor"}

	return map[string]interface{}{
		"id":         "workflow-" + randomStringForPublisher(8),
		"name":       []string{"CI/CD Pipeline", "Security Scan", "Deploy to Production", "Run Tests"}[rand.Intn(4)],
		"repository": "company/" + repositories[rand.Intn(len(repositories))],
		"branch":     []string{"main", "develop", "feature/auth", "hotfix/security"}[rand.Intn(4)],
		"status":     statuses[rand.Intn(len(statuses))],
		"conclusion": conclusions[rand.Intn(len(conclusions))],
		"run_number": rand.Intn(100) + 1,
		"timestamp":  time.Now().UTC().Format(time.RFC3339),
		"commit": map[string]interface{}{
			"hash":    randomStringForPublisher(7),
			"message": "feat: implement new feature",
			"author":  []string{"john.doe", "jane.smith", "mike.wilson"}[rand.Intn(3)],
		},
	}
}

func (p *Publisher) generateMockEvent() map[string]interface{} {
	categories := []string{"node", "pod", "service", "config", "security", "network", "storage"}
	severities := []string{"critical", "warning", "info", "success"}
	titles := []string{
		"Pod Created", "Service Updated", "Node Ready", "Config Applied",
		"Security Policy Updated", "Network Route Added", "Storage Provisioned",
		"Deployment Scaled", "Container Started", "Health Check Passed",
	}
	descriptions := []string{
		"Successfully created new pod on VPS",
		"Service configuration updated successfully",
		"VPS node is ready and healthy",
		"Configuration changes applied",
		"Security policy enforcement enabled",
		"Network connectivity established",
		"Storage volume mounted successfully",
	}
	namespaces := []string{"production", "staging", "monitoring", "kube-system", "default"}

	// Generate VPS-specific event matching frontend TimelineEvent interface
	category := categories[rand.Intn(len(categories))]
	severity := severities[rand.Intn(len(severities))]

	return map[string]interface{}{
		"id":          randomStringForPublisher(16),
		"timestamp":   time.Now().UTC().Format(time.RFC3339),
		"category":    category,
		"severity":    severity,
		"title":       titles[rand.Intn(len(titles))],
		"description": descriptions[rand.Intn(len(descriptions))],
		"source": map[string]interface{}{
			"type":      category,
			"name":      "vps-" + randomStringForPublisher(4),
			"namespace": namespaces[rand.Intn(len(namespaces))],
		},
		"impact": map[string]interface{}{
			"affected": rand.Intn(5) + 1,
			"total":    10,
			"unit":     "pods",
		},
		"duration": rand.Intn(300000) + 30000, // 30s to 5min in milliseconds
		"resolved": rand.Float32() > 0.3,      // 70% chance of being resolved
		"metadata": map[string]interface{}{
			"node":       "vps-main",
			"cluster":    "single-vps",
			"event_type": "kubernetes",
		},
	}
}

func (p *Publisher) generateMockPodMetrics() []map[string]interface{} {
	pods := make([]map[string]interface{}, 0, 10)
	namespaces := []string{"production", "staging", "monitoring", "default"}

	for i := 0; i < 5+rand.Intn(5); i++ {
		pods = append(pods, map[string]interface{}{
			"name":      "app-" + randomStringForPublisher(8),
			"namespace": namespaces[rand.Intn(len(namespaces))],
			"cpu":       rand.Float64() * 100,
			"memory":    rand.Float64() * 4000, // MB
			"status":    []string{"Running", "Pending", "Failed"}[rand.Intn(3)],
			"node":      "node-" + randomStringForPublisher(4),
		})
	}

	return pods
}

func (p *Publisher) generateMockAlert() map[string]interface{} {
	severities := []string{"critical", "warning", "info"}
	sources := []string{"prometheus", "kubernetes", "application"}

	titles := []string{
		"High CPU usage detected",
		"Memory usage exceeds threshold",
		"Pod restart detected",
		"Service unhealthy",
		"Disk space low",
		"Network connectivity issue",
	}

	return map[string]interface{}{
		"id":          randomStringForPublisher(16),
		"severity":    severities[rand.Intn(len(severities))],
		"title":       titles[rand.Intn(len(titles))],
		"description": "Alert description with details about the issue",
		"source":      sources[rand.Intn(len(sources))],
		"timestamp":   time.Now().UTC().Format(time.RFC3339),
		"resolved":    false,
		"metadata": map[string]interface{}{
			"namespace": []string{"production", "staging"}[rand.Intn(2)],
			"service":   "app-service-" + randomStringForPublisher(4),
		},
	}
}

// publishServices publishes service mesh updates every 6 seconds
func (p *Publisher) publishServices() {
	ticker := time.NewTicker(6 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-p.ctx.Done():
			return
		case <-ticker.C:
			serviceUpdate := p.generateMockServiceUpdate()
			p.hub.Broadcast(MessageTypeServices, serviceUpdate)
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
			// In production, would get real network metrics
			// For now, generate mock data
			networkMetrics := p.generateMockNetworkMetrics()
			p.hub.Broadcast(MessageTypeNetwork, networkMetrics)
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
			// In production, would get real storage metrics from k8s
			// For now, generate mock data
			storageMetrics := p.generateMockStorageMetrics()
			p.hub.Broadcast(MessageTypeStorage, storageMetrics)
		}
	}
}

// publishGitOpsEvents publishes GitOps-related events (webhooks, pipeline updates)
func (p *Publisher) publishGitOpsEvents() {
	ticker := time.NewTicker(15 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-p.ctx.Done():
			return
		case <-ticker.C:
			// Randomly generate different types of GitOps events
			eventType := rand.Intn(3)
			switch eventType {
			case 0:
				// Gitea webhook event
				giteaEvent := p.generateMockGiteaWebhook()
				p.hub.Broadcast(MessageTypeGiteaWebhook, giteaEvent)
			case 1:
				// GitHub webhook event
				githubEvent := p.generateMockGithubWebhook()
				p.hub.Broadcast(MessageTypeGithubWebhook, githubEvent)
			case 2:
				// Pipeline update event
				pipelineEvent := p.generateMockPipelineUpdate()
				p.hub.Broadcast(MessageTypePipelineUpdate, pipelineEvent)
			}
		}
	}
}

// GitOps mock data generators

func (p *Publisher) generateMockServiceUpdate() map[string]interface{} {
	serviceIds := []string{"api-service", "web-frontend", "database", "redis", "nginx-ingress"}
	statuses := []string{"healthy", "warning", "critical"}

	return map[string]interface{}{
		"serviceId": serviceIds[rand.Intn(len(serviceIds))],
		"status":    statuses[rand.Intn(len(statuses))],
		"metrics": map[string]interface{}{
			"requestRate": 50 + rand.Intn(200),
			"errorRate":   rand.Float64() * 5,
			"latency": map[string]interface{}{
				"p95": 50 + rand.Intn(150),
			},
		},
		"circuitBreakerStatus": []string{"closed", "open", "half-open"}[rand.Intn(3)],
		"timestamp":            time.Now().UTC().Format(time.RFC3339),
	}
}

func (p *Publisher) generateMockGiteaWebhook() map[string]interface{} {
	actions := []string{"opened", "closed", "synchronized", "pushed", "created", "completed", "started"}
	repositoryNames := []string{"k8s-configs", "app-manifests", "infrastructure", "frontend-apps", "backend-services"}

	return map[string]interface{}{
		"action": actions[rand.Intn(len(actions))],
		"repository": map[string]interface{}{
			"id":        rand.Intn(1000) + 1,
			"name":      repositoryNames[rand.Intn(len(repositoryNames))],
			"full_name": "company/" + repositoryNames[rand.Intn(len(repositoryNames))],
			"html_url":  "https://gitea.company.com/company/" + repositoryNames[rand.Intn(len(repositoryNames))],
		},
		"workflow_run": map[string]interface{}{
			"id":          "run-" + randomStringForPublisher(8),
			"name":        "Build and Push Image",
			"status":      []string{"success", "running", "failure"}[rand.Intn(3)],
			"head_sha":    randomStringForPublisher(7),
			"head_branch": []string{"main", "production", "develop"}[rand.Intn(3)],
			"run_number":  rand.Intn(100) + 1,
		},
		"timestamp": time.Now().UTC().Format(time.RFC3339),
	}
}

func (p *Publisher) generateMockGithubWebhook() map[string]interface{} {
	actions := []string{"push", "pull_request", "release", "create", "delete"}
	repositoryNames := []string{"k8s-configs", "app-manifests", "infrastructure", "frontend-apps", "backend-services"}

	return map[string]interface{}{
		"action": actions[rand.Intn(len(actions))],
		"repository": map[string]interface{}{
			"id":        rand.Intn(1000) + 1,
			"name":      repositoryNames[rand.Intn(len(repositoryNames))],
			"full_name": "company/" + repositoryNames[rand.Intn(len(repositoryNames))],
			"html_url":  "https://github.com/company/" + repositoryNames[rand.Intn(len(repositoryNames))],
		},
		"ref": "refs/heads/main",
		"commits": []map[string]interface{}{
			{
				"id":      randomStringForPublisher(7),
				"message": "feat: update application configuration",
				"author": map[string]interface{}{
					"name":  "Developer",
					"email": "dev@company.com",
				},
				"timestamp": time.Now().UTC().Format(time.RFC3339),
			},
		},
		"timestamp": time.Now().UTC().Format(time.RFC3339),
	}
}

func (p *Publisher) generateMockPipelineUpdate() map[string]interface{} {
	updateTypes := []string{"mirror_sync", "action_status", "image_push", "deployment_status"}
	repositoryIds := []string{"repo-1", "repo-2", "repo-3", "repo-4", "repo-5"}
	statuses := []string{"synced", "syncing", "success", "failure", "pending", "in_progress"}

	return map[string]interface{}{
		"type":          updateTypes[rand.Intn(len(updateTypes))],
		"repository_id": repositoryIds[rand.Intn(len(repositoryIds))],
		"status":        statuses[rand.Intn(len(statuses))],
		"timestamp":     time.Now().UTC().Format(time.RFC3339),
		"metadata": map[string]interface{}{
			"commit_sha": randomStringForPublisher(7),
			"branch":     []string{"main", "production", "develop"}[rand.Intn(3)],
			"duration":   30 + rand.Intn(300),
		},
	}
}

// generateMockNetworkMetrics creates mock network metrics data
func (p *Publisher) generateMockNetworkMetrics() map[string]interface{} {
	// Simulate realistic network metrics with some variation
	baseInbound := 25.6
	baseOutbound := 18.3
	variation := rand.Float64() * 10 - 5 // +/- 5 Mbps variation

	return map[string]interface{}{
		"interfaces": []map[string]interface{}{
			{
				"name":          "eth0",
				"status":        "up",
				"ipAddress":     "10.0.0.100",
				"mtu":           1500,
				"bytesIn":       1073741824 + rand.Int63n(268435456), // 1-1.25GB
				"bytesOut":      536870912 + rand.Int63n(134217728),   // 512-640MB
				"packetsIn":     1000000 + rand.Intn(100000),
				"packetsOut":    750000 + rand.Intn(50000),
				"errorsIn":      rand.Intn(10),
				"errorsOut":     rand.Intn(5),
				"droppedIn":     rand.Intn(20),
				"droppedOut":    rand.Intn(10),
				"throughputIn":  baseInbound + variation,
				"throughputOut": baseOutbound + variation/2,
			},
		},
		"bandwidth": map[string]interface{}{
			"totalUsage":  (baseInbound + baseOutbound) + variation,
			"inbound":     baseInbound + variation,
			"outbound":    baseOutbound + variation/2,
			"peakUsage":   89.2 + rand.Float64()*20,
			"avgUsage":    35.7 + rand.Float64()*10,
			"utilization": 17.45 + rand.Float64()*5,
		},
		"connections": map[string]interface{}{
			"established": 342 + rand.Intn(100),
			"timeWait":    89 + rand.Intn(30),
			"closeWait":   12 + rand.Intn(10),
			"synSent":     5 + rand.Intn(5),
			"synRecv":     3 + rand.Intn(3),
			"listening":   47,
		},
		"protocols": map[string]interface{}{
			"tcp": map[string]interface{}{
				"connections": 425 + rand.Intn(75),
				"bytesIn":     536870912 + rand.Int63n(134217728),
				"bytesOut":    268435456 + rand.Int63n(67108864),
				"retransmits": 25 + rand.Intn(15),
			},
			"udp": map[string]interface{}{
				"packets":  50000 + rand.Intn(10000),
				"bytesIn":  10485760 + rand.Int63n(2097152),
				"bytesOut": 5242880 + rand.Int63n(1048576),
				"errors":   rand.Intn(5),
			},
		},
		"latency": map[string]interface{}{
			"internalPods": map[string]float64{
				"avg": 0.5 + rand.Float64()*0.3,
				"p95": 1.2 + rand.Float64()*0.5,
				"p99": 2.8 + rand.Float64()*1.0,
			},
			"externalServices": map[string]float64{
				"avg": 45.2 + rand.Float64()*10,
				"p95": 120.5 + rand.Float64()*30,
				"p99": 350.8 + rand.Float64()*50,
			},
		},
		"timestamp": time.Now().UTC().Format(time.RFC3339),
	}
}

// generateMockStorageMetrics creates mock storage metrics data
func (p *Publisher) generateMockStorageMetrics() map[string]interface{} {
	// Simulate realistic storage metrics with some variation
	totalStorage := int64(214748364800) // 200GB
	usedBase := int64(96636764160)      // ~90GB base usage
	variation := rand.Int63n(10737418240) // +/- 10GB variation

	usedStorage := usedBase + variation
	availableStorage := totalStorage - usedStorage
	usagePercent := float64(usedStorage) / float64(totalStorage) * 100

	return map[string]interface{}{
		"volumes": []map[string]interface{}{
			{
				"name":         "pvc-data-postgres",
				"namespace":    "production",
				"storageClass": "local-path",
				"capacity":     53687091200, // 50GB
				"used":         32212254720 + rand.Int63n(5368709120), // 30-35GB
				"available":    21474836480 - rand.Int63n(5368709120),
				"status":       "Bound",
				"accessMode":   "ReadWriteOnce",
				"reclaimPolicy": "Retain",
				"mountedBy":    "postgres-database-1a2b3c4d-jkl012",
			},
			{
				"name":         "pvc-cache-redis",
				"namespace":    "production",
				"storageClass": "local-path",
				"capacity":     10737418240, // 10GB
				"used":         2147483648 + rand.Int63n(1073741824), // 2-3GB
				"available":    8589934592 - rand.Int63n(1073741824),
				"status":       "Bound",
				"accessMode":   "ReadWriteOnce",
				"reclaimPolicy": "Delete",
				"mountedBy":    "redis-cache-6a8b9c0d-ghi789",
			},
			{
				"name":         "pvc-logs-fluentd",
				"namespace":    "monitoring",
				"storageClass": "local-path",
				"capacity":     21474836480, // 20GB
				"used":         8589934592 + rand.Int63n(2147483648), // 8-10GB
				"available":    12884901888 - rand.Int63n(2147483648),
				"status":       "Bound",
				"accessMode":   "ReadWriteMany",
				"reclaimPolicy": "Retain",
				"mountedBy":    "fluentd-aggregator",
			},
		},
		"storageClasses": []map[string]interface{}{
			{
				"name":         "local-path",
				"provisioner":  "rancher.io/local-path",
				"volumeCount":  15,
				"totalCapacity": totalStorage,
				"usedCapacity":  usedStorage,
				"reclaimPolicy": "Delete",
				"volumeBindingMode": "WaitForFirstConsumer",
			},
		},
		"overview": map[string]interface{}{
			"totalCapacity":      totalStorage,
			"usedCapacity":       usedStorage,
			"availableCapacity":  availableStorage,
			"usagePercent":       usagePercent,
			"volumeCount":        15,
			"boundVolumes":       12,
			"unboundVolumes":     3,
			"provisioningVolumes": 0,
			"failedVolumes":      0,
		},
		"ioMetrics": map[string]interface{}{
			"readOps":        1250 + rand.Intn(500),
			"writeOps":       890 + rand.Intn(300),
			"readBandwidth":  125.6 + rand.Float64()*50, // MB/s
			"writeBandwidth": 89.3 + rand.Float64()*30,  // MB/s
			"avgLatency":     2.5 + rand.Float64()*1.5,  // ms
			"iops":           2140 + rand.Intn(500),
		},
		"diskHealth": map[string]interface{}{
			"healthy":      true,
			"temperature":  42 + rand.Intn(10), // Celsius
			"smartStatus":  "PASSED",
			"errorCount":   rand.Intn(5),
			"warningCount": rand.Intn(10),
			"uptime":       "15d 8h 32m",
			"lastCheck":    time.Now().Add(-5 * time.Minute).UTC().Format(time.RFC3339),
		},
		"quotas": []map[string]interface{}{
			{
				"namespace":    "production",
				"hardLimit":    107374182400, // 100GB
				"used":         45097156608 + rand.Int63n(5368709120), // 42-47GB
				"requestCount": 8,
				"limitCount":   10,
			},
			{
				"namespace":    "monitoring",
				"hardLimit":    53687091200, // 50GB
				"used":         21474836480 + rand.Int63n(5368709120), // 20-25GB
				"requestCount": 5,
				"limitCount":   8,
			},
		},
		"timestamp": time.Now().UTC().Format(time.RFC3339),
	}
}

// randomStringForPublisher generates a random string for testing
func randomStringForPublisher(length int) string {
	const charset = "abcdefghijklmnopqrstuvwxyz0123456789"
	b := make([]byte, length)
	for i := range b {
		b[i] = charset[rand.Intn(len(charset))]
	}
	return string(b)
}
