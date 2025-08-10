package api

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/archellir/denshimon/internal/auth"
	"github.com/archellir/denshimon/internal/k8s"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

type KubernetesHandlers struct {
	k8sClient *k8s.Client
}

type PodInfo struct {
	Name        string            `json:"name"`
	Namespace   string            `json:"namespace"`
	Status      string            `json:"status"`
	Ready       string            `json:"ready"`
	Restarts    int32             `json:"restarts"`
	Age         string            `json:"age"`
	Node        string            `json:"node"`
	IP          string            `json:"ip"`
	Labels      map[string]string `json:"labels"`
	Annotations map[string]string `json:"annotations"`
}

type NodeInfo struct {
	Name      string            `json:"name"`
	Status    string            `json:"status"`
	Roles     []string          `json:"roles"`
	Age       string            `json:"age"`
	Version   string            `json:"version"`
	OS        string            `json:"os"`
	Kernel    string            `json:"kernel"`
	Container string            `json:"container"`
	Labels    map[string]string `json:"labels"`
}

type DeploymentInfo struct {
	Name      string            `json:"name"`
	Namespace string            `json:"namespace"`
	Ready     string            `json:"ready"`
	UpToDate  int32             `json:"up_to_date"`
	Available int32             `json:"available"`
	Age       string            `json:"age"`
	Labels    map[string]string `json:"labels"`
}

func NewKubernetesHandlers(k8sClient *k8s.Client) *KubernetesHandlers {
	return &KubernetesHandlers{
		k8sClient: k8sClient,
	}
}

// GET /api/k8s/pods
func (h *KubernetesHandlers) ListPods(w http.ResponseWriter, r *http.Request) {
	if h.k8sClient == nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusServiceUnavailable)
		json.NewEncoder(w).Encode(map[string]string{
			"error": "Kubernetes client not available",
		})
		return
	}
	namespace := r.URL.Query().Get("namespace")
	if namespace == "" {
		namespace = "default"
	}

	pods, err := h.k8sClient.Clientset().CoreV1().Pods(namespace).List(context.Background(), metav1.ListOptions{})
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to list pods: %v", err), http.StatusInternalServerError)
		return
	}

	var podInfos []PodInfo
	for _, pod := range pods.Items {
		podInfo := PodInfo{
			Name:        pod.Name,
			Namespace:   pod.Namespace,
			Status:      string(pod.Status.Phase),
			Ready:       getPodReadyStatus(&pod),
			Restarts:    getPodRestarts(&pod),
			Age:         formatAge(pod.CreationTimestamp.Time),
			Node:        pod.Spec.NodeName,
			IP:          pod.Status.PodIP,
			Labels:      pod.Labels,
			Annotations: pod.Annotations,
		}
		podInfos = append(podInfos, podInfo)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(podInfos)
}

// GET /api/k8s/pods/{name}
func (h *KubernetesHandlers) GetPod(w http.ResponseWriter, r *http.Request) {
	name := r.PathValue("name")
	namespace := r.URL.Query().Get("namespace")
	if namespace == "" {
		namespace = "default"
	}

	pod, err := h.k8sClient.Clientset().CoreV1().Pods(namespace).Get(context.Background(), name, metav1.GetOptions{})
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to get pod: %v", err), http.StatusNotFound)
		return
	}

	podInfo := PodInfo{
		Name:        pod.Name,
		Namespace:   pod.Namespace,
		Status:      string(pod.Status.Phase),
		Ready:       getPodReadyStatus(pod),
		Restarts:    getPodRestarts(pod),
		Age:         formatAge(pod.CreationTimestamp.Time),
		Node:        pod.Spec.NodeName,
		IP:          pod.Status.PodIP,
		Labels:      pod.Labels,
		Annotations: pod.Annotations,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(podInfo)
}

// POST /api/k8s/pods/{name}/restart
func (h *KubernetesHandlers) RestartPod(w http.ResponseWriter, r *http.Request) {
	name := r.PathValue("name")
	namespace := r.URL.Query().Get("namespace")
	if namespace == "" {
		namespace = "default"
	}

	// Check permissions
	claims := auth.GetUserFromContext(r.Context())
	if claims == nil || !hasPermission(claims.Role, "pods", "update") {
		http.Error(w, "Insufficient permissions", http.StatusForbidden)
		return
	}

	// Delete pod to trigger restart (if controlled by deployment/replicaset)
	err := h.k8sClient.Clientset().CoreV1().Pods(namespace).Delete(context.Background(), name, metav1.DeleteOptions{})
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to restart pod: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Pod restart initiated"})
}

// DELETE /api/k8s/pods/{name}
func (h *KubernetesHandlers) DeletePod(w http.ResponseWriter, r *http.Request) {
	name := r.PathValue("name")
	namespace := r.URL.Query().Get("namespace")
	if namespace == "" {
		namespace = "default"
	}

	// Check permissions
	claims := auth.GetUserFromContext(r.Context())
	if claims == nil || !hasPermission(claims.Role, "pods", "delete") {
		http.Error(w, "Insufficient permissions", http.StatusForbidden)
		return
	}

	err := h.k8sClient.Clientset().CoreV1().Pods(namespace).Delete(context.Background(), name, metav1.DeleteOptions{})
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to delete pod: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Pod deleted successfully"})
}

// GET /api/k8s/pods/{name}/logs
func (h *KubernetesHandlers) GetPodLogs(w http.ResponseWriter, r *http.Request) {
	name := r.PathValue("name")
	namespace := r.URL.Query().Get("namespace")
	if namespace == "" {
		namespace = "default"
	}

	// Parse query parameters
	container := r.URL.Query().Get("container")
	tailLines := r.URL.Query().Get("tail")
	follow := r.URL.Query().Get("follow") == "true"

	opts := &corev1.PodLogOptions{
		Container: container,
		Follow:    follow,
	}

	if tailLines != "" {
		if lines, err := strconv.ParseInt(tailLines, 10, 64); err == nil {
			opts.TailLines = &lines
		}
	}

	req := h.k8sClient.Clientset().CoreV1().Pods(namespace).GetLogs(name, opts)
	podLogs, err := req.Stream(context.Background())
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to get pod logs: %v", err), http.StatusInternalServerError)
		return
	}
	defer podLogs.Close()

	// Set headers for streaming
	w.Header().Set("Content-Type", "text/plain")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")

	// Stream logs to response
	buffer := make([]byte, 1024)
	for {
		n, err := podLogs.Read(buffer)
		if n > 0 {
			w.Write(buffer[:n])
			if f, ok := w.(http.Flusher); ok {
				f.Flush()
			}
		}
		if err != nil {
			break
		}
	}
}

// GET /api/k8s/nodes
func (h *KubernetesHandlers) ListNodes(w http.ResponseWriter, r *http.Request) {
	nodes, err := h.k8sClient.Clientset().CoreV1().Nodes().List(context.Background(), metav1.ListOptions{})
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to list nodes: %v", err), http.StatusInternalServerError)
		return
	}

	var nodeInfos []NodeInfo
	for _, node := range nodes.Items {
		nodeInfo := NodeInfo{
			Name:      node.Name,
			Status:    getNodeStatus(&node),
			Roles:     getNodeRoles(&node),
			Age:       formatAge(node.CreationTimestamp.Time),
			Version:   node.Status.NodeInfo.KubeletVersion,
			OS:        node.Status.NodeInfo.OSImage,
			Kernel:    node.Status.NodeInfo.KernelVersion,
			Container: node.Status.NodeInfo.ContainerRuntimeVersion,
			Labels:    node.Labels,
		}
		nodeInfos = append(nodeInfos, nodeInfo)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(nodeInfos)
}

// GET /api/k8s/deployments
func (h *KubernetesHandlers) ListDeployments(w http.ResponseWriter, r *http.Request) {
	namespace := r.URL.Query().Get("namespace")
	if namespace == "" {
		namespace = "default"
	}

	deployments, err := h.k8sClient.Clientset().AppsV1().Deployments(namespace).List(context.Background(), metav1.ListOptions{})
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to list deployments: %v", err), http.StatusInternalServerError)
		return
	}

	var deploymentInfos []DeploymentInfo
	for _, deployment := range deployments.Items {
		deploymentInfo := DeploymentInfo{
			Name:      deployment.Name,
			Namespace: deployment.Namespace,
			Ready:     fmt.Sprintf("%d/%d", deployment.Status.ReadyReplicas, deployment.Status.Replicas),
			UpToDate:  deployment.Status.UpdatedReplicas,
			Available: deployment.Status.AvailableReplicas,
			Age:       formatAge(deployment.CreationTimestamp.Time),
			Labels:    deployment.Labels,
		}
		deploymentInfos = append(deploymentInfos, deploymentInfo)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(deploymentInfos)
}

// PATCH /api/k8s/deployments/{name}/scale
func (h *KubernetesHandlers) ScaleDeployment(w http.ResponseWriter, r *http.Request) {
	name := r.PathValue("name")
	namespace := r.URL.Query().Get("namespace")
	if namespace == "" {
		namespace = "default"
	}

	// Check permissions
	claims := auth.GetUserFromContext(r.Context())
	if claims == nil || !hasPermission(claims.Role, "deployments", "update") {
		http.Error(w, "Insufficient permissions", http.StatusForbidden)
		return
	}

	var req struct {
		Replicas int32 `json:"replicas"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Get current deployment
	deployment, err := h.k8sClient.Clientset().AppsV1().Deployments(namespace).Get(context.Background(), name, metav1.GetOptions{})
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to get deployment: %v", err), http.StatusNotFound)
		return
	}

	// Update replicas
	deployment.Spec.Replicas = &req.Replicas
	_, err = h.k8sClient.Clientset().AppsV1().Deployments(namespace).Update(context.Background(), deployment, metav1.UpdateOptions{})
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to scale deployment: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message":  "Deployment scaled successfully",
		"replicas": req.Replicas,
	})
}

// GET /api/k8s/health
func (h *KubernetesHandlers) HealthCheck(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Try to list namespaces as a health check
	_, err := h.k8sClient.Clientset().CoreV1().Namespaces().List(ctx, metav1.ListOptions{Limit: 1})

	status := "healthy"
	statusCode := http.StatusOK

	if err != nil {
		status = "unhealthy"
		statusCode = http.StatusServiceUnavailable
	}

	response := map[string]interface{}{
		"status":    status,
		"timestamp": time.Now().UTC().Format(time.RFC3339),
	}

	if err != nil {
		response["error"] = err.Error()
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(response)
}

// Helper functions
func getPodReadyStatus(pod *corev1.Pod) string {
	ready := 0
	total := len(pod.Status.ContainerStatuses)

	for _, status := range pod.Status.ContainerStatuses {
		if status.Ready {
			ready++
		}
	}

	return fmt.Sprintf("%d/%d", ready, total)
}

func getPodRestarts(pod *corev1.Pod) int32 {
	var restarts int32
	for _, status := range pod.Status.ContainerStatuses {
		restarts += status.RestartCount
	}
	return restarts
}

func getNodeStatus(node *corev1.Node) string {
	for _, condition := range node.Status.Conditions {
		if condition.Type == corev1.NodeReady {
			if condition.Status == corev1.ConditionTrue {
				return "Ready"
			}
			return "NotReady"
		}
	}
	return "Unknown"
}

func getNodeRoles(node *corev1.Node) []string {
	var roles []string
	for label := range node.Labels {
		if strings.HasPrefix(label, "node-role.kubernetes.io/") {
			role := strings.TrimPrefix(label, "node-role.kubernetes.io/")
			if role == "" {
				role = "master"
			}
			roles = append(roles, role)
		}
	}
	if len(roles) == 0 {
		roles = append(roles, "worker")
	}
	return roles
}

func formatAge(creationTime time.Time) string {
	duration := time.Since(creationTime)
	days := int(duration.Hours() / 24)
	hours := int(duration.Hours()) % 24
	minutes := int(duration.Minutes()) % 60

	if days > 0 {
		return fmt.Sprintf("%dd", days)
	} else if hours > 0 {
		return fmt.Sprintf("%dh", hours)
	} else {
		return fmt.Sprintf("%dm", minutes)
	}
}

func hasPermission(role, resource, action string) bool {
	permissions := map[string]map[string][]string{
		"admin": {
			"pods":        {"create", "read", "update", "delete", "exec"},
			"deployments": {"create", "read", "update", "delete", "scale"},
			"nodes":       {"read"},
		},
		"operator": {
			"pods":        {"read", "update", "delete"},
			"deployments": {"read", "update", "scale"},
			"nodes":       {"read"},
		},
		"viewer": {
			"pods":        {"read"},
			"deployments": {"read"},
			"nodes":       {"read"},
		},
	}

	if rolePerms, ok := permissions[role]; ok {
		if actions, ok := rolePerms[resource]; ok {
			for _, a := range actions {
				if a == action {
					return true
				}
			}
		}
	}
	return false
}
