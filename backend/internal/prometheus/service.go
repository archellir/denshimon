// Package prometheus provides high-level services for retrieving and processing
// metrics data from Prometheus. This service layer translates PromQL queries
// into structured data that the denshimon application can use for its monitoring
// dashboards.
//
// The service handles three main types of metrics:
// - Network metrics: bandwidth, protocol breakdown, top talkers
// - Storage metrics: volume IOPS, throughput, latency, capacity
// - Cluster metrics: CPU/memory usage, pod counts, node status
//
// All metrics support time-series data for historical charts and instant
// values for current status displays.
package prometheus

import (
	"context"
	"fmt"
	"strconv"
	"time"
)

// Service provides high-level access to Prometheus metrics data.
// It encapsulates the Prometheus client and provides structured methods
// for retrieving specific types of metrics used by denshimon dashboards.
type Service struct {
	client *Client
}

// MetricPoint represents a single data point in a time series.
// Used for building charts and historical analysis in the frontend.
type MetricPoint struct {
	Timestamp time.Time `json:"timestamp"`
	Value     float64   `json:"value"`
}

// NetworkMetrics contains comprehensive network traffic data for the cluster.
// This data powers the network dashboard showing bandwidth usage, top talkers,
// and protocol breakdown charts.
type NetworkMetrics struct {
	IngressBytes  []MetricPoint `json:"ingress_bytes"`  // Incoming traffic over time
	EgressBytes   []MetricPoint `json:"egress_bytes"`   // Outgoing traffic over time
	Connections   int64         `json:"connections"`    // Current active connections
	TopTalkers    []TopTalker   `json:"top_talkers"`    // Pods with highest traffic
	ProtocolStats []Protocol    `json:"protocol_stats"` // Traffic breakdown by protocol
}

// TopTalker represents a pod with significant network traffic.
// Used in the network dashboard to identify high-traffic workloads.
type TopTalker struct {
	PodName       string  `json:"pod_name"`
	Namespace     string  `json:"namespace"`
	IngressBytes  int64   `json:"ingress_bytes"`
	EgressBytes   int64   `json:"egress_bytes"`
	TotalBytes    int64   `json:"total_bytes"`
	Connections   int     `json:"connections"`
}

// Protocol represents network traffic statistics for a specific protocol.
// Used to show traffic breakdown (HTTP/HTTPS, gRPC, TCP, UDP) in pie charts.
type Protocol struct {
	Name       string  `json:"protocol"`
	Bytes      int64   `json:"bytes"`
	Percentage float64 `json:"percentage"`
}

// StorageMetrics contains detailed storage performance data for all volumes.
// This powers the storage dashboard with I/O metrics, capacity usage, and
// performance analysis for persistent volumes.
type StorageMetrics struct {
	Volumes []VolumeMetrics `json:"volumes"`
}

// VolumeMetrics represents comprehensive storage metrics for a single volume.
// Includes capacity, performance (IOPS, throughput, latency), and health status.
// This data is collected by the custom storage-exporter DaemonSet.
type VolumeMetrics struct {
	Name                string  `json:"name"`                  // PVC name
	Namespace           string  `json:"namespace"`             // Kubernetes namespace
	Type                string  `json:"type"`                  // Storage type (ssd, hdd, nvme)
	CapacityBytes       int64   `json:"capacity_bytes"`        // Total volume capacity
	UsedBytes           int64   `json:"used_bytes"`            // Currently used space
	AvailableBytes      int64   `json:"available_bytes"`       // Available space
	UsagePercent        float64 `json:"usage_percent"`         // Usage percentage
	ReadIOPS            float64 `json:"read_iops"`             // Read operations per second
	WriteIOPS           float64 `json:"write_iops"`            // Write operations per second
	ReadThroughputBytes float64 `json:"read_throughput_bytes"` // Read bandwidth (bytes/sec)
	WriteThroughputBytes float64 `json:"write_throughput_bytes"` // Write bandwidth (bytes/sec)
	ReadLatencySeconds  float64 `json:"read_latency_seconds"`  // Average read latency
	WriteLatencySeconds float64 `json:"write_latency_seconds"` // Average write latency
	Status              string  `json:"status"`                // Health status (healthy, degraded, critical)
}

// ClusterMetrics contains time-series data for overall cluster resource usage.
// This powers the cluster overview dashboard with historical trends and
// capacity planning information.
type ClusterMetrics struct {
	CPUUsage     []MetricPoint `json:"cpu_usage"`     // CPU usage percentage over time
	MemoryUsage  []MetricPoint `json:"memory_usage"`  // Memory usage percentage over time
	StorageUsage []MetricPoint `json:"storage_usage"` // Storage usage percentage over time
	PodCounts    []MetricPoint `json:"pod_counts"`    // Total pod count over time
	NodeCounts   []MetricPoint `json:"node_counts"`   // Total node count over time
}

// NewService creates a new Prometheus service instance.
// The prometheusURL should point to the Prometheus server, typically:
// "http://prometheus-service.monitoring.svc.cluster.local:9090"
func NewService(prometheusURL string) *Service {
	return &Service{
		client: NewClient(prometheusURL),
	}
}

// IsHealthy checks if the Prometheus server is accessible.
// Used by the metrics service to determine fallback behavior.
func (s *Service) IsHealthy(ctx context.Context) bool {
	return s.client.IsHealthy(ctx)
}

// GetNetworkMetrics retrieves comprehensive network traffic data for the specified duration.
// This includes ingress/egress bandwidth over time, current connection counts,
// top talking pods, and protocol breakdown statistics.
//
// The duration parameter controls the time range for historical data.
// Common values: 15*time.Minute, time.Hour, 6*time.Hour, 24*time.Hour
//
// Returns NetworkMetrics with time-series data for dashboard charts.
func (s *Service) GetNetworkMetrics(ctx context.Context, duration time.Duration) (*NetworkMetrics, error) {
	end := time.Now()
	start := end.Add(-duration)
	step := duration / 60 // 60 data points

	// Get ingress traffic
	ingressQuery := `sum(rate(container_network_receive_bytes_total[5m])) by (pod)`
	ingressResult, err := s.client.QueryRange(ctx, ingressQuery, start, end, step)
	if err != nil {
		return nil, fmt.Errorf("failed to query ingress traffic: %w", err)
	}

	// Get egress traffic  
	egressQuery := `sum(rate(container_network_transmit_bytes_total[5m])) by (pod)`
	egressResult, err := s.client.QueryRange(ctx, egressQuery, start, end, step)
	if err != nil {
		return nil, fmt.Errorf("failed to query egress traffic: %w", err)
	}

	// Get connection count
	connectionsQuery := `sum(node_netstat_Tcp_CurrEstab)`
	connectionsResult, err := s.client.Query(ctx, connectionsQuery)
	if err != nil {
		return nil, fmt.Errorf("failed to query connections: %w", err)
	}

	metrics := &NetworkMetrics{
		IngressBytes: parseTimeSeriesMetrics(ingressResult),
		EgressBytes:  parseTimeSeriesMetrics(egressResult),
		Connections:  parseScalarMetric(connectionsResult),
		TopTalkers:   []TopTalker{}, // TODO: Implement when we have pod-level network metrics
		ProtocolStats: []Protocol{}, // TODO: Implement with service mesh metrics
	}

	return metrics, nil
}

// GetStorageMetrics retrieves detailed storage performance data for all volumes.
// This includes IOPS, throughput, latency, and capacity metrics for each
// persistent volume in the cluster.
//
// The data comes from the custom storage-exporter DaemonSet which reads
// /proc/diskstats and /sys/block to provide detailed I/O statistics.
//
// Returns StorageMetrics with per-volume performance data for the storage dashboard.
func (s *Service) GetStorageMetrics(ctx context.Context) (*StorageMetrics, error) {
	// Query storage metrics from our custom exporter
	volumeQuery := `{__name__=~"storage_volume_.*"}`
	result, err := s.client.Query(ctx, volumeQuery)
	if err != nil {
		return nil, fmt.Errorf("failed to query storage metrics: %w", err)
	}

	volumes := make(map[string]*VolumeMetrics)
	
	for _, metric := range result.Data.Result {
		volumeName := metric.Metric["volume"]
		if volumeName == "" {
			continue
		}

		if volumes[volumeName] == nil {
			volumes[volumeName] = &VolumeMetrics{
				Name:      volumeName,
				Namespace: metric.Metric["namespace"],
				Type:      metric.Metric["type"],
				Status:    metric.Metric["status"],
			}
		}

		value := parseMetricValue(metric.Value)
		
		// Map metrics based on metric name
		for metricName := range metric.Metric {
			if metricName == "__name__" {
				switch metric.Metric[metricName] {
				case "storage_volume_capacity_bytes":
					volumes[volumeName].CapacityBytes = int64(value)
				case "storage_volume_used_bytes":
					volumes[volumeName].UsedBytes = int64(value)
				case "storage_volume_available_bytes":
					volumes[volumeName].AvailableBytes = int64(value)
				case "storage_volume_usage_percent":
					volumes[volumeName].UsagePercent = value
				case "storage_volume_read_iops":
					volumes[volumeName].ReadIOPS = value
				case "storage_volume_write_iops":
					volumes[volumeName].WriteIOPS = value
				case "storage_volume_read_throughput_bytes":
					volumes[volumeName].ReadThroughputBytes = value
				case "storage_volume_write_throughput_bytes":
					volumes[volumeName].WriteThroughputBytes = value
				case "storage_volume_read_latency_seconds":
					volumes[volumeName].ReadLatencySeconds = value
				case "storage_volume_write_latency_seconds":
					volumes[volumeName].WriteLatencySeconds = value
				}
			}
		}
	}

	volumeList := make([]VolumeMetrics, 0, len(volumes))
	for _, vol := range volumes {
		volumeList = append(volumeList, *vol)
	}

	return &StorageMetrics{Volumes: volumeList}, nil
}

// GetClusterMetrics retrieves time-series data for overall cluster resource usage.
// This includes CPU, memory, storage usage percentages, and counts of pods/nodes
// over the specified time duration.
//
// Used by the cluster overview dashboard to show historical trends and current
// capacity utilization. Data comes from node-exporter and kube-state-metrics.
//
// Returns ClusterMetrics with time-series data for resource usage charts.
func (s *Service) GetClusterMetrics(ctx context.Context, duration time.Duration) (*ClusterMetrics, error) {
	end := time.Now()
	start := end.Add(-duration)
	step := duration / 60

	// CPU usage
	cpuQuery := `100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)`
	cpuResult, err := s.client.QueryRange(ctx, cpuQuery, start, end, step)
	if err != nil {
		return nil, fmt.Errorf("failed to query CPU metrics: %w", err)
	}

	// Memory usage
	memoryQuery := `(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100`
	memoryResult, err := s.client.QueryRange(ctx, memoryQuery, start, end, step)
	if err != nil {
		return nil, fmt.Errorf("failed to query memory metrics: %w", err)
	}

	// Storage usage
	storageQuery := `100 - ((node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"}) * 100)`
	storageResult, err := s.client.QueryRange(ctx, storageQuery, start, end, step)
	if err != nil {
		return nil, fmt.Errorf("failed to query storage metrics: %w", err)
	}

	// Pod counts
	podQuery := `count(kube_pod_info)`
	podResult, err := s.client.QueryRange(ctx, podQuery, start, end, step)
	if err != nil {
		return nil, fmt.Errorf("failed to query pod metrics: %w", err)
	}

	// Node counts
	nodeQuery := `count(kube_node_info)`
	nodeResult, err := s.client.QueryRange(ctx, nodeQuery, start, end, step)
	if err != nil {
		return nil, fmt.Errorf("failed to query node metrics: %w", err)
	}

	return &ClusterMetrics{
		CPUUsage:     parseTimeSeriesMetrics(cpuResult),
		MemoryUsage:  parseTimeSeriesMetrics(memoryResult),
		StorageUsage: parseTimeSeriesMetrics(storageResult),
		PodCounts:    parseTimeSeriesMetrics(podResult),
		NodeCounts:   parseTimeSeriesMetrics(nodeResult),
	}, nil
}

func parseTimeSeriesMetrics(result *QueryResult) []MetricPoint {
	if len(result.Data.Result) == 0 {
		return []MetricPoint{}
	}

	var points []MetricPoint
	for _, series := range result.Data.Result {
		if series.Values != nil {
			for _, valueArray := range series.Values {
				if len(valueArray) >= 2 {
					timestamp := time.Unix(int64(valueArray[0].(float64)), 0)
					value, _ := strconv.ParseFloat(valueArray[1].(string), 64)
					points = append(points, MetricPoint{
						Timestamp: timestamp,
						Value:     value,
					})
				}
			}
		}
	}
	return points
}

func parseScalarMetric(result *QueryResult) int64 {
	if len(result.Data.Result) == 0 || len(result.Data.Result[0].Value) < 2 {
		return 0
	}

	value, _ := strconv.ParseFloat(result.Data.Result[0].Value[1].(string), 64)
	return int64(value)
}

func parseMetricValue(value []interface{}) float64 {
	if len(value) < 2 {
		return 0
	}
	
	result, _ := strconv.ParseFloat(value[1].(string), 64)
	return result
}