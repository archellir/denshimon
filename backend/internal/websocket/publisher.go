package websocket

import (
	"context"
	"log/slog"
	"math/rand"
	"time"

	"github.com/archellir/denshimon/internal/k8s"
	"github.com/archellir/denshimon/internal/metrics"
)

// Publisher publishes real-time data to WebSocket clients
type Publisher struct {
	hub           *Hub
	k8sClient     *k8s.Client
	metricsService *metrics.Service
	ctx           context.Context
	cancel        context.CancelFunc
}

// NewPublisher creates a new data publisher
func NewPublisher(hub *Hub, k8sClient *k8s.Client, metricsService *metrics.Service) *Publisher {
	ctx, cancel := context.WithCancel(context.Background())
	return &Publisher{
		hub:           hub,
		k8sClient:     k8sClient,
		metricsService: metricsService,
		ctx:           ctx,
		cancel:        cancel,
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
	go p.publishAlerts()
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
				clusterMetrics, err := p.metricsService.GetClusterMetrics(context.Background())
				if err == nil {
					p.hub.Broadcast(MessageTypeMetrics, map[string]interface{}{
						"cluster":    clusterMetrics,
						"timestamp": time.Now().UTC().Format(time.RFC3339),
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
				"usage_percent": 40 + rand.Float64()*40, // 40-80%
				"cores_used":    4 + rand.Float64()*4,   // 4-8 cores
				"cores_total":   12,
			},
			"memory_usage": map[string]interface{}{
				"usage_percent": 50 + rand.Float64()*30, // 50-80%
				"used_bytes":    8000000000 + rand.Int63n(4000000000), // 8-12GB
				"total_bytes":   16000000000,
			},
			"ready_nodes":  3,
			"total_nodes":  3,
			"running_pods": 45 + rand.Intn(10),
			"total_pods":   60,
		},
		"timestamp": time.Now().UTC().Format(time.RFC3339),
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

	return map[string]interface{}{
		"id":        time.Now().UnixNano(),
		"timestamp": time.Now().UTC().Format(time.RFC3339),
		"level":     levels[rand.Intn(len(levels))],
		"source":    sources[rand.Intn(len(sources))],
		"message":   messages[rand.Intn(len(messages))],
		"metadata": map[string]interface{}{
			"namespace": namespaces[rand.Intn(len(namespaces))],
			"pod":       "app-" + randomStringForPublisher(8),
			"node":      "node-" + randomStringForPublisher(4),
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
	types := []string{"Normal", "Warning"}
	reasons := []string{"Created", "Started", "Pulled", "Scheduled", "Failed", "Killing"}
	objects := []string{"Pod", "Service", "Deployment", "ReplicaSet"}
	namespaces := []string{"production", "staging", "monitoring", "default"}

	return map[string]interface{}{
		"id":        randomStringForPublisher(16),
		"type":      types[rand.Intn(len(types))],
		"reason":    reasons[rand.Intn(len(reasons))],
		"object":    objects[rand.Intn(len(objects))],
		"namespace": namespaces[rand.Intn(len(namespaces))],
		"message":   "Successfully assigned pod to node",
		"timestamp": time.Now().UTC().Format(time.RFC3339),
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

// randomStringForPublisher generates a random string for testing
func randomStringForPublisher(length int) string {
	const charset = "abcdefghijklmnopqrstuvwxyz0123456789"
	b := make([]byte, length)
	for i := range b {
		b[i] = charset[rand.Intn(len(charset))]
	}
	return string(b)
}