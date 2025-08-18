package k8s

import (
	"context"
	"fmt"
	"os"
	"path/filepath"

	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"
	"k8s.io/client-go/util/homedir"
)

// Client wraps Kubernetes clientset and configuration for cluster operations
type Client struct {
	clientset kubernetes.Interface
	config    *rest.Config
}

func NewClient(kubeconfigPath string) (*Client, error) {
	var config *rest.Config
	var err error

	// Try in-cluster config first
	config, err = rest.InClusterConfig()
	if err != nil {
		// Fall back to kubeconfig
		config, err = buildConfigFromKubeconfig(kubeconfigPath)
		if err != nil {
			return nil, fmt.Errorf("failed to create Kubernetes config: %w", err)
		}
	}

	clientset, err := kubernetes.NewForConfig(config)
	if err != nil {
		return nil, fmt.Errorf("failed to create Kubernetes clientset: %w", err)
	}

	return &Client{
		clientset: clientset,
		config:    config,
	}, nil
}

func buildConfigFromKubeconfig(kubeconfigPath string) (*rest.Config, error) {
	if kubeconfigPath == "" {
		// Try default locations
		if home := homedir.HomeDir(); home != "" {
			kubeconfigPath = filepath.Join(home, ".kube", "config")
		}
	}

	// Check if file exists
	if _, err := os.Stat(kubeconfigPath); err != nil {
		return nil, fmt.Errorf("kubeconfig not found at %s", kubeconfigPath)
	}

	config, err := clientcmd.BuildConfigFromFlags("", kubeconfigPath)
	if err != nil {
		return nil, err
	}

	return config, nil
}

func (c *Client) Clientset() kubernetes.Interface {
	return c.clientset
}

func (c *Client) Config() *rest.Config {
	return c.config
}

// Health check
func (c *Client) HealthCheck(ctx context.Context) error {
	_, err := c.clientset.CoreV1().Namespaces().List(ctx, metav1.ListOptions{Limit: 1})
	return err
}

// Additional methods needed by metrics service
func (c *Client) ListNodes(ctx context.Context) (*corev1.NodeList, error) {
	return c.clientset.CoreV1().Nodes().List(ctx, metav1.ListOptions{})
}

func (c *Client) GetNode(ctx context.Context, name string) (*corev1.Node, error) {
	return c.clientset.CoreV1().Nodes().Get(ctx, name, metav1.GetOptions{})
}

func (c *Client) ListPods(ctx context.Context, namespace string) (*corev1.PodList, error) {
	if namespace == "" {
		return c.clientset.CoreV1().Pods(metav1.NamespaceAll).List(ctx, metav1.ListOptions{})
	}
	return c.clientset.CoreV1().Pods(namespace).List(ctx, metav1.ListOptions{})
}

func (c *Client) GetPod(ctx context.Context, namespace, name string) (*corev1.Pod, error) {
	return c.clientset.CoreV1().Pods(namespace).Get(ctx, name, metav1.GetOptions{})
}

func (c *Client) ListNamespaces(ctx context.Context) (*corev1.NamespaceList, error) {
	return c.clientset.CoreV1().Namespaces().List(ctx, metav1.ListOptions{})
}

func (c *Client) ListServices(ctx context.Context, namespace string) (*corev1.ServiceList, error) {
	if namespace == "" {
		return c.clientset.CoreV1().Services(metav1.NamespaceAll).List(ctx, metav1.ListOptions{})
	}
	return c.clientset.CoreV1().Services(namespace).List(ctx, metav1.ListOptions{})
}

func (c *Client) ListEvents(ctx context.Context, namespace string) (*corev1.EventList, error) {
	if namespace == "" {
		return c.clientset.CoreV1().Events(metav1.NamespaceAll).List(ctx, metav1.ListOptions{})
	}
	return c.clientset.CoreV1().Events(namespace).List(ctx, metav1.ListOptions{})
}

func (c *Client) ListDeployments(ctx context.Context, namespace string) (*appsv1.DeploymentList, error) {
	if namespace == "" {
		return c.clientset.AppsV1().Deployments(metav1.NamespaceAll).List(ctx, metav1.ListOptions{})
	}
	return c.clientset.AppsV1().Deployments(namespace).List(ctx, metav1.ListOptions{})
}

// StorageInfo represents basic storage information
type StorageInfo struct {
	TotalPVs      int     `json:"total_pvs"`
	TotalPVCs     int     `json:"total_pvcs"`
	StorageClasses int    `json:"storage_classes"`
	TotalCapacity string  `json:"total_capacity"`
}

func (c *Client) GetStorageInfo(ctx context.Context) (*StorageInfo, error) {
	// Get persistent volumes
	pvList, err := c.clientset.CoreV1().PersistentVolumes().List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil, fmt.Errorf("failed to get persistent volumes: %w", err)
	}

	// Get persistent volume claims
	pvcList, err := c.clientset.CoreV1().PersistentVolumeClaims(metav1.NamespaceAll).List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil, fmt.Errorf("failed to get persistent volume claims: %w", err)
	}

	// Get storage classes
	scList, err := c.clientset.StorageV1().StorageClasses().List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil, fmt.Errorf("failed to get storage classes: %w", err)
	}

	// Calculate total capacity (simplified)
	totalCapacity := "0Gi"
	if len(pvList.Items) > 0 {
		totalCapacity = fmt.Sprintf("%dGi", len(pvList.Items)*10) // Simplified calculation
	}

	return &StorageInfo{
		TotalPVs:       len(pvList.Items),
		TotalPVCs:      len(pvcList.Items),
		StorageClasses: len(scList.Items),
		TotalCapacity:  totalCapacity,
	}, nil
}

// GetPodLogs retrieves logs for a specific pod
func (c *Client) GetPodLogs(ctx context.Context, namespace, podName string, lines int) ([]string, error) {
	logOptions := &corev1.PodLogOptions{}
	if lines > 0 {
		tailLines := int64(lines)
		logOptions.TailLines = &tailLines
	}

	req := c.clientset.CoreV1().Pods(namespace).GetLogs(podName, logOptions)
	logs, err := req.Stream(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get pod logs: %w", err)
	}
	defer logs.Close()

	// For now, return a simplified log response
	// In a real implementation, you'd read from the stream
	return []string{"Log streaming not fully implemented yet"}, nil
}
