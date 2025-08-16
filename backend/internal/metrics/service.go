package metrics

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"time"

	"github.com/archellir/denshimon/internal/k8s"
	"github.com/archellir/denshimon/internal/prometheus"
	corev1 "k8s.io/api/core/v1"
	metricsclient "k8s.io/metrics/pkg/client/clientset/versioned"
)

type Service struct {
	k8sClient         *k8s.Client
	metricsClient     metricsclient.Interface
	prometheusService *prometheus.Service
}

type ClusterMetrics struct {
	Timestamp        time.Time          `json:"timestamp"`
	TotalNodes       int                `json:"total_nodes"`
	ReadyNodes       int                `json:"ready_nodes"`
	TotalPods        int                `json:"total_pods"`
	RunningPods      int                `json:"running_pods"`
	PendingPods      int                `json:"pending_pods"`
	FailedPods       int                `json:"failed_pods"`
	TotalNamespaces  int                `json:"total_namespaces"`
	CPUUsage         ResourceMetrics    `json:"cpu_usage"`
	MemoryUsage      ResourceMetrics    `json:"memory_usage"`
	StorageUsage     ResourceMetrics    `json:"storage_usage"`
	NetworkMetrics   NetworkMetrics     `json:"network_metrics"`
	NodeMetrics      []NodeMetrics      `json:"node_metrics"`
	NamespaceMetrics []NamespaceMetrics `json:"namespace_metrics"`
}

type ResourceMetrics struct {
	Used         int64   `json:"used"`
	Total        int64   `json:"total"`
	Available    int64   `json:"available"`
	UsagePercent float64 `json:"usage_percent"`
}

type NetworkMetrics struct {
	BytesReceived      int64 `json:"bytes_received"`
	BytesTransmitted   int64 `json:"bytes_transmitted"`
	PacketsReceived    int64 `json:"packets_received"`
	PacketsTransmitted int64 `json:"packets_transmitted"`
}

type NodeMetrics struct {
	Name         string          `json:"name"`
	Status       string          `json:"status"`
	CPUUsage     ResourceMetrics `json:"cpu_usage"`
	MemoryUsage  ResourceMetrics `json:"memory_usage"`
	StorageUsage ResourceMetrics `json:"storage_usage"`
	PodCount     int             `json:"pod_count"`
	Age          string          `json:"age"`
	Version      string          `json:"version"`
	OS           string          `json:"os"`
	Architecture string          `json:"architecture"`
}

type NamespaceMetrics struct {
	Name        string          `json:"name"`
	PodCount    int             `json:"pod_count"`
	CPUUsage    ResourceMetrics `json:"cpu_usage"`
	MemoryUsage ResourceMetrics `json:"memory_usage"`
	Status      string          `json:"status"`
	Age         string          `json:"age"`
}

type PodMetrics struct {
	Name         string          `json:"name"`
	Namespace    string          `json:"namespace"`
	Status       string          `json:"status"`
	Node         string          `json:"node"`
	CPUUsage     ResourceMetrics `json:"cpu_usage"`
	MemoryUsage  ResourceMetrics `json:"memory_usage"`
	RestartCount int32           `json:"restart_count"`
	Age          string          `json:"age"`
	IP           string          `json:"ip"`
}

type TimeSeriesData struct {
	Timestamp time.Time `json:"timestamp"`
	Value     float64   `json:"value"`
}

type MetricsHistory struct {
	CPU    []TimeSeriesData `json:"cpu"`
	Memory []TimeSeriesData `json:"memory"`
	Pods   []TimeSeriesData `json:"pods"`
	Nodes  []TimeSeriesData `json:"nodes"`
}

func NewService(k8sClient *k8s.Client) *Service {
	s := &Service{
		k8sClient: k8sClient,
	}

	// Try to initialize metrics client if k8s client is available
	if k8sClient != nil {
		if metricsClient, err := metricsclient.NewForConfig(k8sClient.Config()); err == nil {
			s.metricsClient = metricsClient
		} else {
			slog.Warn("Failed to create metrics client", "error", err)
		}
	}

	// Initialize Prometheus service
	// Try cluster-internal service first, fallback to localhost for development
	prometheusURL := "http://prometheus-service.monitoring.svc.cluster.local:9090"
	s.prometheusService = prometheus.NewService(prometheusURL)

	return s
}

func (s *Service) GetClusterMetrics(ctx context.Context) (*ClusterMetrics, error) {
	if s.k8sClient == nil {
		// Frontend handles mock data
		return nil, errors.New("kubernetes client not available - use frontend mock data")
	}

	metrics := &ClusterMetrics{
		Timestamp: time.Now(),
	}

	// Get nodes
	nodes, err := s.k8sClient.ListNodes(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to list nodes: %w", err)
	}

	metrics.TotalNodes = len(nodes.Items)
	readyNodes := 0
	for _, node := range nodes.Items {
		if s.isNodeReady(node) {
			readyNodes++
		}
	}
	metrics.ReadyNodes = readyNodes

	// Get pods across all namespaces
	pods, err := s.k8sClient.ListPods(ctx, "")
	if err != nil {
		return nil, fmt.Errorf("failed to list pods: %w", err)
	}

	metrics.TotalPods = len(pods.Items)
	runningPods, pendingPods, failedPods := 0, 0, 0
	for _, pod := range pods.Items {
		switch pod.Status.Phase {
		case corev1.PodRunning:
			runningPods++
		case corev1.PodPending:
			pendingPods++
		case corev1.PodFailed:
			failedPods++
		}
	}
	metrics.RunningPods = runningPods
	metrics.PendingPods = pendingPods
	metrics.FailedPods = failedPods

	// Get namespaces
	namespaces, err := s.k8sClient.ListNamespaces(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to list namespaces: %w", err)
	}
	metrics.TotalNamespaces = len(namespaces.Items)

	// Calculate resource metrics
	metrics.CPUUsage = s.calculateClusterCPU(nodes.Items)
	metrics.MemoryUsage = s.calculateClusterMemory(nodes.Items)
	metrics.StorageUsage = s.calculateClusterStorage(nodes.Items)

	// Get detailed node metrics
	nodeMetrics := make([]NodeMetrics, 0, len(nodes.Items))
	for _, node := range nodes.Items {
		nm := s.getNodeMetrics(ctx, node, pods.Items)
		nodeMetrics = append(nodeMetrics, nm)
	}
	metrics.NodeMetrics = nodeMetrics

	// Get namespace metrics
	namespaceMetrics := make([]NamespaceMetrics, 0, len(namespaces.Items))
	for _, ns := range namespaces.Items {
		nm := s.getNamespaceMetrics(ctx, ns, pods.Items)
		namespaceMetrics = append(namespaceMetrics, nm)
	}
	metrics.NamespaceMetrics = namespaceMetrics

	return metrics, nil
}

func (s *Service) GetNodeMetrics(ctx context.Context, nodeName string) (*NodeMetrics, error) {
	if s.k8sClient == nil {
		// Frontend handles mock data
		return nil, errors.New("kubernetes client not available - use frontend mock data")
	}

	node, err := s.k8sClient.GetNode(ctx, nodeName)
	if err != nil {
		return nil, fmt.Errorf("failed to get node: %w", err)
	}

	pods, err := s.k8sClient.ListPods(ctx, "")
	if err != nil {
		return nil, fmt.Errorf("failed to list pods: %w", err)
	}

	metrics := s.getNodeMetrics(ctx, *node, pods.Items)
	return &metrics, nil
}

func (s *Service) GetPodMetrics(ctx context.Context, namespace, podName string) (*PodMetrics, error) {
	if s.k8sClient == nil {
		// Frontend handles mock data
		return nil, errors.New("kubernetes client not available - use frontend mock data")
	}

	pod, err := s.k8sClient.GetPod(ctx, namespace, podName)
	if err != nil {
		return nil, fmt.Errorf("failed to get pod: %w", err)
	}

	metrics := s.getPodMetrics(ctx, *pod)
	return &metrics, nil
}

func (s *Service) GetMetricsHistory(ctx context.Context, duration time.Duration) (*MetricsHistory, error) {
	if s.prometheusService == nil || !s.prometheusService.IsHealthy(ctx) {
		// Fallback to mock data if Prometheus is not available
		return nil, errors.New("prometheus not available - use frontend mock data")
	}

	// Get cluster metrics from Prometheus
	clusterMetrics, err := s.prometheusService.GetClusterMetrics(ctx, duration)
	if err != nil {
		slog.Warn("Failed to get cluster metrics from Prometheus", "error", err)
		return nil, errors.New("prometheus query failed - use frontend mock data")
	}

	// Convert prometheus metrics to our format
	history := &MetricsHistory{
		CPU:    make([]TimeSeriesData, len(clusterMetrics.CPUUsage)),
		Memory: make([]TimeSeriesData, len(clusterMetrics.MemoryUsage)),
		Pods:   make([]TimeSeriesData, len(clusterMetrics.PodCounts)),
		Nodes:  make([]TimeSeriesData, len(clusterMetrics.NodeCounts)),
	}

	for i, point := range clusterMetrics.CPUUsage {
		history.CPU[i] = TimeSeriesData{
			Timestamp: point.Timestamp,
			Value:     point.Value,
		}
	}

	for i, point := range clusterMetrics.MemoryUsage {
		history.Memory[i] = TimeSeriesData{
			Timestamp: point.Timestamp,
			Value:     point.Value,
		}
	}

	for i, point := range clusterMetrics.PodCounts {
		history.Pods[i] = TimeSeriesData{
			Timestamp: point.Timestamp,
			Value:     point.Value,
		}
	}

	for i, point := range clusterMetrics.NodeCounts {
		history.Nodes[i] = TimeSeriesData{
			Timestamp: point.Timestamp,
			Value:     point.Value,
		}
	}

	return history, nil
}

func (s *Service) GetNetworkMetrics(ctx context.Context, duration time.Duration) (*prometheus.NetworkMetrics, error) {
	if s.prometheusService == nil || !s.prometheusService.IsHealthy(ctx) {
		return nil, errors.New("prometheus not available - use frontend mock data")
	}

	return s.prometheusService.GetNetworkMetrics(ctx, duration)
}

func (s *Service) GetStorageMetrics(ctx context.Context) (*prometheus.StorageMetrics, error) {
	if s.prometheusService == nil || !s.prometheusService.IsHealthy(ctx) {
		return nil, errors.New("prometheus not available - use frontend mock data")
	}

	return s.prometheusService.GetStorageMetrics(ctx)
}

func (s *Service) isNodeReady(node corev1.Node) bool {
	for _, condition := range node.Status.Conditions {
		if condition.Type == corev1.NodeReady {
			return condition.Status == corev1.ConditionTrue
		}
	}
	return false
}

func (s *Service) calculateClusterCPU(nodes []corev1.Node) ResourceMetrics {
	var total, used int64

	for _, node := range nodes {
		if cpu := node.Status.Allocatable[corev1.ResourceCPU]; !cpu.IsZero() {
			total += cpu.MilliValue()
		}

		// For actual usage, we'd need metrics server data
		// For now, simulate some usage
		cpuAllocatable := node.Status.Allocatable[corev1.ResourceCPU]
		used += int64(float64(cpuAllocatable.MilliValue()) * 0.3)
	}

	available := total - used
	usagePercent := 0.0
	if total > 0 {
		usagePercent = float64(used) / float64(total) * 100
	}

	return ResourceMetrics{
		Used:         used,
		Total:        total,
		Available:    available,
		UsagePercent: usagePercent,
	}
}

func (s *Service) calculateClusterMemory(nodes []corev1.Node) ResourceMetrics {
	var total, used int64

	for _, node := range nodes {
		if memory := node.Status.Allocatable[corev1.ResourceMemory]; !memory.IsZero() {
			total += memory.Value()
		}

		// For actual usage, we'd need metrics server data
		// For now, simulate some usage
		memAllocatable := node.Status.Allocatable[corev1.ResourceMemory]
		used += int64(float64(memAllocatable.Value()) * 0.4)
	}

	available := total - used
	usagePercent := 0.0
	if total > 0 {
		usagePercent = float64(used) / float64(total) * 100
	}

	return ResourceMetrics{
		Used:         used,
		Total:        total,
		Available:    available,
		UsagePercent: usagePercent,
	}
}

func (s *Service) calculateClusterStorage(nodes []corev1.Node) ResourceMetrics {
	var total, used int64

	for _, node := range nodes {
		if storage := node.Status.Allocatable[corev1.ResourceEphemeralStorage]; !storage.IsZero() {
			total += storage.Value()
		}

		// Simulate storage usage
		storageAllocatable := node.Status.Allocatable[corev1.ResourceEphemeralStorage]
		used += int64(float64(storageAllocatable.Value()) * 0.25)
	}

	available := total - used
	usagePercent := 0.0
	if total > 0 {
		usagePercent = float64(used) / float64(total) * 100
	}

	return ResourceMetrics{
		Used:         used,
		Total:        total,
		Available:    available,
		UsagePercent: usagePercent,
	}
}

func (s *Service) getNodeMetrics(ctx context.Context, node corev1.Node, pods []corev1.Pod) NodeMetrics {
	status := "NotReady"
	if s.isNodeReady(node) {
		status = "Ready"
	}

	// Count pods on this node
	podCount := 0
	for _, pod := range pods {
		if pod.Spec.NodeName == node.Name {
			podCount++
		}
	}

	// Calculate node age
	age := time.Since(node.CreationTimestamp.Time).Truncate(time.Second).String()

	return NodeMetrics{
		Name:         node.Name,
		Status:       status,
		CPUUsage:     s.getNodeResourceMetrics(node, corev1.ResourceCPU),
		MemoryUsage:  s.getNodeResourceMetrics(node, corev1.ResourceMemory),
		StorageUsage: s.getNodeResourceMetrics(node, corev1.ResourceEphemeralStorage),
		PodCount:     podCount,
		Age:          age,
		Version:      node.Status.NodeInfo.KubeletVersion,
		OS:           node.Status.NodeInfo.OperatingSystem,
		Architecture: node.Status.NodeInfo.Architecture,
	}
}

func (s *Service) getNodeResourceMetrics(node corev1.Node, resourceName corev1.ResourceName) ResourceMetrics {
	capacity := node.Status.Capacity[resourceName]

	total := capacity.Value()
	if resourceName == corev1.ResourceCPU {
		total = capacity.MilliValue()
	}

	// Simulate usage (in production, would come from metrics server)
	used := int64(float64(total) * 0.35)
	available := total - used

	usagePercent := 0.0
	if total > 0 {
		usagePercent = float64(used) / float64(total) * 100
	}

	return ResourceMetrics{
		Used:         used,
		Total:        total,
		Available:    available,
		UsagePercent: usagePercent,
	}
}

func (s *Service) getNamespaceMetrics(ctx context.Context, namespace corev1.Namespace, pods []corev1.Pod) NamespaceMetrics {
	// Count pods in this namespace
	podCount := 0
	for _, pod := range pods {
		if pod.Namespace == namespace.Name {
			podCount++
		}
	}

	// Calculate namespace age
	age := time.Since(namespace.CreationTimestamp.Time).Truncate(time.Second).String()

	status := "Active"
	if namespace.Status.Phase != corev1.NamespaceActive {
		status = string(namespace.Status.Phase)
	}

	return NamespaceMetrics{
		Name:     namespace.Name,
		PodCount: podCount,
		CPUUsage: ResourceMetrics{
			Used:         int64(podCount * 100), // Simple estimate based on pod count
			Total:        int64(podCount * 300),
			Available:    int64(podCount * 200),
			UsagePercent: 33.3,
		},
		MemoryUsage: ResourceMetrics{
			Used:         int64(podCount * 128 * 1024 * 1024), // Simple estimate based on pod count
			Total:        int64(podCount * 512 * 1024 * 1024),
			Available:    int64(podCount * 384 * 1024 * 1024),
			UsagePercent: 25.0,
		},
		Status: status,
		Age:    age,
	}
}

func (s *Service) getPodMetrics(ctx context.Context, pod corev1.Pod) PodMetrics {
	age := time.Since(pod.CreationTimestamp.Time).Truncate(time.Second).String()

	restartCount := int32(0)
	for _, containerStatus := range pod.Status.ContainerStatuses {
		restartCount += containerStatus.RestartCount
	}

	return PodMetrics{
		Name:      pod.Name,
		Namespace: pod.Namespace,
		Status:    string(pod.Status.Phase),
		Node:      pod.Spec.NodeName,
		CPUUsage: ResourceMetrics{
			Used:         100, // Would come from metrics server in production
			Total:        500,
			Available:    400,
			UsagePercent: 20.0,
		},
		MemoryUsage: ResourceMetrics{
			Used:         128 * 1024 * 1024,
			Total:        512 * 1024 * 1024,
			Available:    384 * 1024 * 1024,
			UsagePercent: 25.0,
		},
		RestartCount: restartCount,
		Age:          age,
		IP:           pod.Status.PodIP,
	}
}
