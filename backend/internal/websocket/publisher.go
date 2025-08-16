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