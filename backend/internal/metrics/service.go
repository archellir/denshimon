package metrics

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/archellir/denshimon/internal/k8s"
	corev1 "k8s.io/api/core/v1"
	metricsclient "k8s.io/metrics/pkg/client/clientset/versioned"
)

type Service struct {
	k8sClient     *k8s.Client
	metricsClient metricsclient.Interface
}

type ClusterMetrics struct {
	Timestamp        time.Time         `json:"timestamp"`
	TotalNodes       int               `json:"total_nodes"`
	ReadyNodes       int               `json:"ready_nodes"`
	TotalPods        int               `json:"total_pods"`
	RunningPods      int               `json:"running_pods"`
	PendingPods      int               `json:"pending_pods"`
	FailedPods       int               `json:"failed_pods"`
	TotalNamespaces  int               `json:"total_namespaces"`
	CPUUsage         ResourceMetrics   `json:"cpu_usage"`
	MemoryUsage      ResourceMetrics   `json:"memory_usage"`
	StorageUsage     ResourceMetrics   `json:"storage_usage"`
	NetworkMetrics   NetworkMetrics    `json:"network_metrics"`
	NodeMetrics      []NodeMetrics     `json:"node_metrics"`
	NamespaceMetrics []NamespaceMetrics `json:"namespace_metrics"`
}

type ResourceMetrics struct {
	Used      int64   `json:"used"`
	Total     int64   `json:"total"`
	Available int64   `json:"available"`
	UsagePercent float64 `json:"usage_percent"`
}

type NetworkMetrics struct {
	BytesReceived    int64 `json:"bytes_received"`
	BytesTransmitted int64 `json:"bytes_transmitted"`
	PacketsReceived  int64 `json:"packets_received"`
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
			log.Printf("Failed to create metrics client: %v", err)
		}
	}

	return s
}

func (s *Service) GetClusterMetrics(ctx context.Context) (*ClusterMetrics, error) {
	if s.k8sClient == nil {
		// Return mock data for testing
		return s.getMockClusterMetrics(), nil
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
		// Return mock data for testing
		mockNodes, _ := s.getMockNodeMetrics()
		for _, node := range mockNodes {
			if node.Name == nodeName {
				return &node, nil
			}
		}
		return nil, fmt.Errorf("node not found")
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
		// Return mock data for testing
		return &PodMetrics{
			Name:      podName,
			Namespace: namespace,
			Status:    "Running",
			Node:      "worker-1",
			CPUUsage: ResourceMetrics{
				Used:         100,
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
			RestartCount: 0,
			Age:          "2h",
			IP:           "10.244.1.15",
		}, nil
	}

	pod, err := s.k8sClient.GetPod(ctx, namespace, podName)
	if err != nil {
		return nil, fmt.Errorf("failed to get pod: %w", err)
	}

	metrics := s.getPodMetrics(ctx, *pod)
	return &metrics, nil
}

func (s *Service) GetMetricsHistory(ctx context.Context, duration time.Duration) (*MetricsHistory, error) {
	// For now, return mock historical data
	// In production, this would query a metrics database like Prometheus
	history := &MetricsHistory{
		CPU:    make([]TimeSeriesData, 0),
		Memory: make([]TimeSeriesData, 0),
		Pods:   make([]TimeSeriesData, 0),
		Nodes:  make([]TimeSeriesData, 0),
	}

	// Generate sample data points for the last hour
	now := time.Now()
	for i := 60; i >= 0; i-- {
		timestamp := now.Add(-time.Duration(i) * time.Minute)
		
		history.CPU = append(history.CPU, TimeSeriesData{
			Timestamp: timestamp,
			Value:     30 + float64(i%20),
		})
		
		history.Memory = append(history.Memory, TimeSeriesData{
			Timestamp: timestamp,
			Value:     45 + float64(i%15),
		})
		
		history.Pods = append(history.Pods, TimeSeriesData{
			Timestamp: timestamp,
			Value:     float64(20 + i%10),
		})
		
		history.Nodes = append(history.Nodes, TimeSeriesData{
			Timestamp: timestamp,
			Value:     float64(3 + i%2),
		})
	}

	return history, nil
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
			Used:         int64(podCount * 100), // Mock CPU usage
			Total:        int64(podCount * 300),
			Available:    int64(podCount * 200),
			UsagePercent: 33.3,
		},
		MemoryUsage: ResourceMetrics{
			Used:         int64(podCount * 128 * 1024 * 1024), // Mock memory usage
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
			Used:         100,  // Mock values - would come from metrics server
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

// Mock data functions for testing without k8s cluster
func (s *Service) getMockClusterMetrics() *ClusterMetrics {
	mockNodes, _ := s.getMockNodeMetrics()
	return &ClusterMetrics{
		Timestamp:       time.Now(),
		TotalNodes:      4,
		ReadyNodes:      3,
		TotalPods:       9,
		RunningPods:     7,
		PendingPods:     1,
		FailedPods:      1,
		TotalNamespaces: 3,
		CPUUsage: ResourceMetrics{
			Used:         2400,
			Total:        8000,
			Available:    5600,
			UsagePercent: 30.0,
		},
		MemoryUsage: ResourceMetrics{
			Used:         4 * 1024 * 1024 * 1024,
			Total:        16 * 1024 * 1024 * 1024,
			Available:    12 * 1024 * 1024 * 1024,
			UsagePercent: 25.0,
		},
		StorageUsage: ResourceMetrics{
			Used:         50 * 1024 * 1024 * 1024,
			Total:        100 * 1024 * 1024 * 1024,
			Available:    50 * 1024 * 1024 * 1024,
			UsagePercent: 50.0,
		},
		NetworkMetrics: NetworkMetrics{
			BytesReceived:      1024 * 1024 * 100,
			BytesTransmitted:   1024 * 1024 * 80,
			PacketsReceived:    10000,
			PacketsTransmitted: 8000,
		},
		NodeMetrics: mockNodes,
	}
}

func (s *Service) getMockNodeMetrics() ([]NodeMetrics, error) {
	return []NodeMetrics{
		{
			Name:   "master-1",
			Status: "Ready",
			CPUUsage: ResourceMetrics{
				Used:         800,
				Total:        2000,
				Available:    1200,
				UsagePercent: 40.0,
			},
			MemoryUsage: ResourceMetrics{
				Used:         2 * 1024 * 1024 * 1024,
				Total:        4 * 1024 * 1024 * 1024,
				Available:    2 * 1024 * 1024 * 1024,
				UsagePercent: 50.0,
			},
			StorageUsage: ResourceMetrics{
				Used:         20 * 1024 * 1024 * 1024,
				Total:        30 * 1024 * 1024 * 1024,
				Available:    10 * 1024 * 1024 * 1024,
				UsagePercent: 66.7,
			},
			PodCount:     3,
			Age:          "30d",
			Version:      "v1.29.2",
			OS:           "Ubuntu 22.04.4 LTS",
			Architecture: "amd64",
		},
		{
			Name:   "worker-1",
			Status: "Ready",
			CPUUsage: ResourceMetrics{
				Used:         600,
				Total:        2000,
				Available:    1400,
				UsagePercent: 30.0,
			},
			MemoryUsage: ResourceMetrics{
				Used:         1 * 1024 * 1024 * 1024,
				Total:        4 * 1024 * 1024 * 1024,
				Available:    3 * 1024 * 1024 * 1024,
				UsagePercent: 25.0,
			},
			StorageUsage: ResourceMetrics{
				Used:         15 * 1024 * 1024 * 1024,
				Total:        30 * 1024 * 1024 * 1024,
				Available:    15 * 1024 * 1024 * 1024,
				UsagePercent: 50.0,
			},
			PodCount:     2,
			Age:          "30d",
			Version:      "v1.29.2",
			OS:           "Ubuntu 22.04.4 LTS",
			Architecture: "amd64",
		},
		{
			Name:   "worker-2",
			Status: "Ready",
			CPUUsage: ResourceMetrics{
				Used:         500,
				Total:        2000,
				Available:    1500,
				UsagePercent: 25.0,
			},
			MemoryUsage: ResourceMetrics{
				Used:         512 * 1024 * 1024,
				Total:        4 * 1024 * 1024 * 1024,
				Available:    3584 * 1024 * 1024,
				UsagePercent: 12.5,
			},
			StorageUsage: ResourceMetrics{
				Used:         10 * 1024 * 1024 * 1024,
				Total:        20 * 1024 * 1024 * 1024,
				Available:    10 * 1024 * 1024 * 1024,
				UsagePercent: 50.0,
			},
			PodCount:     2,
			Age:          "30d",
			Version:      "v1.29.2",
			OS:           "Ubuntu 22.04.4 LTS",
			Architecture: "amd64",
		},
		{
			Name:   "worker-3",
			Status: "NotReady",
			CPUUsage: ResourceMetrics{
				Used:         500,
				Total:        2000,
				Available:    1500,
				UsagePercent: 25.0,
			},
			MemoryUsage: ResourceMetrics{
				Used:         512 * 1024 * 1024,
				Total:        4 * 1024 * 1024 * 1024,
				Available:    3584 * 1024 * 1024,
				UsagePercent: 12.5,
			},
			StorageUsage: ResourceMetrics{
				Used:         5 * 1024 * 1024 * 1024,
				Total:        20 * 1024 * 1024 * 1024,
				Available:    15 * 1024 * 1024 * 1024,
				UsagePercent: 25.0,
			},
			PodCount:     2,
			Age:          "25d",
			Version:      "v1.29.2",
			OS:           "Ubuntu 22.04.4 LTS",
			Architecture: "amd64",
		},
	}, nil
}

func (s *Service) getMockMetricsHistory() *MetricsHistory {
	now := time.Now()
	history := &MetricsHistory{
		CPU:    []TimeSeriesData{},
		Memory: []TimeSeriesData{},
		Pods:   []TimeSeriesData{},
		Nodes:  []TimeSeriesData{},
	}

	// Generate mock time series data for the last hour
	for i := 60; i >= 0; i-- {
		timestamp := now.Add(-time.Duration(i) * time.Minute)
		
		// CPU usage fluctuating between 20-40%
		history.CPU = append(history.CPU, TimeSeriesData{
			Timestamp: timestamp,
			Value:     20.0 + float64(i%20),
		})
		
		// Memory usage fluctuating between 40-60%
		history.Memory = append(history.Memory, TimeSeriesData{
			Timestamp: timestamp,
			Value:     40.0 + float64(i%20),
		})
		
		// Pod count varying between 7-10
		history.Pods = append(history.Pods, TimeSeriesData{
			Timestamp: timestamp,
			Value:     float64(7 + i%4),
		})
		
		// Node count stable at 4
		history.Nodes = append(history.Nodes, TimeSeriesData{
			Timestamp: timestamp,
			Value:     4.0,
		})
	}

	return history
}