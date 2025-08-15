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

type ServiceInfo struct {
	Name        string            `json:"name"`
	Namespace   string            `json:"namespace"`
	Type        string            `json:"type"`
	ClusterIP   string            `json:"cluster_ip"`
	ExternalIPs []string          `json:"external_ips"`
	Ports       []ServicePort     `json:"ports"`
	Age         string            `json:"age"`
	Labels      map[string]string `json:"labels"`
}

type ServicePort struct {
	Name       string `json:"name"`
	Protocol   string `json:"protocol"`
	Port       int32  `json:"port"`
	TargetPort string `json:"target_port"`
	NodePort   int32  `json:"node_port,omitempty"`
}

type EventInfo struct {
	Name      string            `json:"name"`
	Namespace string            `json:"namespace"`
	Type      string            `json:"type"`
	Reason    string            `json:"reason"`
	Object    string            `json:"object"`
	Message   string            `json:"message"`
	Count     int32             `json:"count"`
	FirstTime string            `json:"first_time"`
	LastTime  string            `json:"last_time"`
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
		// Return mock data for testing
		mockPods := getMockPods()
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(mockPods)
		return
	}
	namespace := r.URL.Query().Get("namespace")
	if namespace == "" {
		namespace = "default"
	}

	pods, err := h.k8sClient.Clientset().CoreV1().Pods(namespace).List(context.Background(), metav1.ListOptions{})
	if err != nil {
		SendError(w, http.StatusInternalServerError, fmt.Sprintf("Failed to list pods: %v", err))
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
		SendError(w, http.StatusNotFound, fmt.Sprintf("Failed to get pod: %v", err))
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
		SendError(w, http.StatusInternalServerError, fmt.Sprintf("Failed to restart pod: %v", err))
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
		SendError(w, http.StatusInternalServerError, fmt.Sprintf("Failed to delete pod: %v", err))
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
		SendError(w, http.StatusInternalServerError, fmt.Sprintf("Failed to get pod logs: %v", err))
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
	if h.k8sClient == nil {
		// Return mock data for testing
		mockNodes := getMockNodes()
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(mockNodes)
		return
	}

	nodes, err := h.k8sClient.Clientset().CoreV1().Nodes().List(context.Background(), metav1.ListOptions{})
	if err != nil {
		SendError(w, http.StatusInternalServerError, fmt.Sprintf("Failed to list nodes: %v", err))
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
	if h.k8sClient == nil {
		// Return mock data for testing
		mockDeployments := getMockDeployments()
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(mockDeployments)
		return
	}

	namespace := r.URL.Query().Get("namespace")
	if namespace == "" {
		namespace = "default"
	}

	deployments, err := h.k8sClient.Clientset().AppsV1().Deployments(namespace).List(context.Background(), metav1.ListOptions{})
	if err != nil {
		SendError(w, http.StatusInternalServerError, fmt.Sprintf("Failed to list deployments: %v", err))
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
		SendError(w, http.StatusNotFound, fmt.Sprintf("Failed to get deployment: %v", err))
		return
	}

	// Update replicas
	deployment.Spec.Replicas = &req.Replicas
	_, err = h.k8sClient.Clientset().AppsV1().Deployments(namespace).Update(context.Background(), deployment, metav1.UpdateOptions{})
	if err != nil {
		SendError(w, http.StatusInternalServerError, fmt.Sprintf("Failed to scale deployment: %v", err))
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
	if h.k8sClient == nil {
		// Mock mode - always healthy
		response := map[string]interface{}{
			"status":    "healthy",
			"mode":      "mock",
			"timestamp": time.Now().UTC().Format(time.RFC3339),
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
		return
	}

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

// GET /api/k8s/pods/exec - WebSocket terminal access
func (h *KubernetesHandlers) HandlePodExec(w http.ResponseWriter, r *http.Request) {
	if h.k8sClient == nil {
		http.Error(w, "Kubernetes client not available", http.StatusServiceUnavailable)
		return
	}

	h.k8sClient.HandlePodExec(w, r)
}

// GET /api/k8s/pods/logs/stream - Advanced log streaming
func (h *KubernetesHandlers) HandlePodLogs(w http.ResponseWriter, r *http.Request) {
	if h.k8sClient == nil {
		http.Error(w, "Kubernetes client not available", http.StatusServiceUnavailable)
		return
	}

	h.k8sClient.HandlePodLogs(w, r)
}

// POST /api/k8s/pods/portforward - Port forwarding
func (h *KubernetesHandlers) HandlePodPortForward(w http.ResponseWriter, r *http.Request) {
	if h.k8sClient == nil {
		http.Error(w, "Kubernetes client not available", http.StatusServiceUnavailable)
		return
	}

	h.k8sClient.HandlePodPortForward(w, r)
}

// POST /api/k8s/pods/files/upload - File upload to pod
func (h *KubernetesHandlers) HandleFileUpload(w http.ResponseWriter, r *http.Request) {
	if h.k8sClient == nil {
		http.Error(w, "Kubernetes client not available", http.StatusServiceUnavailable)
		return
	}

	h.k8sClient.HandleFileUpload(w, r)
}

// GET /api/k8s/pods/files/download - File download from pod
func (h *KubernetesHandlers) HandleFileDownload(w http.ResponseWriter, r *http.Request) {
	if h.k8sClient == nil {
		http.Error(w, "Kubernetes client not available", http.StatusServiceUnavailable)
		return
	}

	h.k8sClient.HandleFileDownload(w, r)
}

// GET /api/k8s/services
func (h *KubernetesHandlers) ListServices(w http.ResponseWriter, r *http.Request) {
	if h.k8sClient == nil {
		// Return mock data for testing
		mockServices := getMockServices()
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(mockServices)
		return
	}

	namespace := r.URL.Query().Get("namespace")
	if namespace == "" {
		namespace = "default"
	}

	services, err := h.k8sClient.Clientset().CoreV1().Services(namespace).List(context.Background(), metav1.ListOptions{})
	if err != nil {
		SendError(w, http.StatusInternalServerError, fmt.Sprintf("Failed to list services: %v", err))
		return
	}

	var serviceInfos []ServiceInfo
	for _, service := range services.Items {
		var ports []ServicePort
		for _, port := range service.Spec.Ports {
			servicePort := ServicePort{
				Name:       port.Name,
				Protocol:   string(port.Protocol),
				Port:       port.Port,
				TargetPort: port.TargetPort.String(),
			}
			if port.NodePort != 0 {
				servicePort.NodePort = port.NodePort
			}
			ports = append(ports, servicePort)
		}

		serviceInfo := ServiceInfo{
			Name:        service.Name,
			Namespace:   service.Namespace,
			Type:        string(service.Spec.Type),
			ClusterIP:   service.Spec.ClusterIP,
			ExternalIPs: service.Spec.ExternalIPs,
			Ports:       ports,
			Age:         formatAge(service.CreationTimestamp.Time),
			Labels:      service.Labels,
		}
		serviceInfos = append(serviceInfos, serviceInfo)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(serviceInfos)
}

// GET /api/k8s/events
func (h *KubernetesHandlers) ListEvents(w http.ResponseWriter, r *http.Request) {
	if h.k8sClient == nil {
		// Return mock data for testing
		mockEvents := getMockEvents()
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(mockEvents)
		return
	}

	namespace := r.URL.Query().Get("namespace")
	if namespace == "" {
		namespace = "default"
	}

	events, err := h.k8sClient.Clientset().CoreV1().Events(namespace).List(context.Background(), metav1.ListOptions{})
	if err != nil {
		SendError(w, http.StatusInternalServerError, fmt.Sprintf("Failed to list events: %v", err))
		return
	}

	var eventInfos []EventInfo
	for _, event := range events.Items {
		eventInfo := EventInfo{
			Name:      event.Name,
			Namespace: event.Namespace,
			Type:      event.Type,
			Reason:    event.Reason,
			Object:    fmt.Sprintf("%s/%s", event.InvolvedObject.Kind, event.InvolvedObject.Name),
			Message:   event.Message,
			Count:     event.Count,
			FirstTime: event.FirstTimestamp.Format(time.RFC3339),
			LastTime:  event.LastTimestamp.Format(time.RFC3339),
			Labels:    event.Labels,
		}
		eventInfos = append(eventInfos, eventInfo)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(eventInfos)
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

// Mock data functions for testing without k8s cluster
func getMockPods() []PodInfo {
	return []PodInfo{
		{
			Name:        "nginx-app-5d4c4b8f45-abc12",
			Namespace:   "denshimon-test",
			Status:      "Running",
			Ready:       "1/1",
			Restarts:    0,
			Age:         "2h",
			Node:        "worker-1",
			IP:          "10.244.1.15",
			Labels:      map[string]string{"app": "nginx", "version": "v1.0.0"},
			Annotations: map[string]string{"deployment.kubernetes.io/revision": "1"},
		},
		{
			Name:        "nginx-app-5d4c4b8f45-def34",
			Namespace:   "denshimon-test",
			Status:      "Running",
			Ready:       "1/1",
			Restarts:    0,
			Age:         "2h",
			Node:        "worker-2",
			IP:          "10.244.2.16",
			Labels:      map[string]string{"app": "nginx", "version": "v1.0.0"},
			Annotations: map[string]string{"deployment.kubernetes.io/revision": "1"},
		},
		{
			Name:        "nginx-app-5d4c4b8f45-ghi56",
			Namespace:   "denshimon-test",
			Status:      "Running",
			Ready:       "1/1",
			Restarts:    1,
			Age:         "2h",
			Node:        "worker-1",
			IP:          "10.244.1.17",
			Labels:      map[string]string{"app": "nginx", "version": "v1.0.0"},
			Annotations: map[string]string{"deployment.kubernetes.io/revision": "1"},
		},
		{
			Name:        "redis-cache-7b8c9d0e1f-xyz78",
			Namespace:   "denshimon-test",
			Status:      "Running",
			Ready:       "1/1",
			Restarts:    0,
			Age:         "3h",
			Node:        "worker-2",
			IP:          "10.244.2.18",
			Labels:      map[string]string{"app": "redis", "tier": "cache"},
			Annotations: map[string]string{"deployment.kubernetes.io/revision": "1"},
		},
		{
			Name:        "api-backend-6f7g8h9i0j-klm90",
			Namespace:   "production",
			Status:      "Running",
			Ready:       "1/1",
			Restarts:    0,
			Age:         "1d",
			Node:        "worker-3",
			IP:          "10.244.3.20",
			Labels:      map[string]string{"app": "api-backend", "environment": "production"},
			Annotations: map[string]string{"deployment.kubernetes.io/revision": "2"},
		},
		{
			Name:        "failing-pod-crash",
			Namespace:   "denshimon-test",
			Status:      "CrashLoopBackOff",
			Ready:       "0/1",
			Restarts:    15,
			Age:         "30m",
			Node:        "worker-1",
			IP:          "",
			Labels:      map[string]string{"app": "failing-example", "status": "crashloopbackoff"},
			Annotations: map[string]string{},
		},
		{
			Name:        "pending-pod-no-resources",
			Namespace:   "denshimon-test",
			Status:      "Pending",
			Ready:       "0/1",
			Restarts:    0,
			Age:         "45m",
			Node:        "",
			IP:          "",
			Labels:      map[string]string{"app": "pending-example", "status": "pending"},
			Annotations: map[string]string{},
		},
		{
			Name:        "prometheus-847c5d6e2f-nop12",
			Namespace:   "monitoring",
			Status:      "Running",
			Ready:       "1/1",
			Restarts:    0,
			Age:         "7d",
			Node:        "master-1",
			IP:          "10.244.0.25",
			Labels:      map[string]string{"app": "prometheus", "component": "monitoring"},
			Annotations: map[string]string{"deployment.kubernetes.io/revision": "1"},
		},
		{
			Name:        "grafana-958f6g7h3i-qrs34",
			Namespace:   "monitoring",
			Status:      "Running",
			Ready:       "1/1",
			Restarts:    2,
			Age:         "7d",
			Node:        "worker-1",
			IP:          "10.244.1.26",
			Labels:      map[string]string{"app": "grafana", "component": "monitoring"},
			Annotations: map[string]string{"deployment.kubernetes.io/revision": "1"},
		},
	}
}

func getMockNodes() []NodeInfo {
	return []NodeInfo{
		{
			Name:      "master-1",
			Status:    "Ready",
			Roles:     []string{"control-plane", "master"},
			Age:       "30d",
			Version:   "v1.29.2",
			OS:        "Ubuntu 22.04.4 LTS",
			Kernel:    "5.15.0-97-generic",
			Container: "containerd://1.7.13",
			Labels: map[string]string{
				"kubernetes.io/arch":                    "amd64",
				"kubernetes.io/os":                      "linux",
				"node-role.kubernetes.io/control-plane": "",
				"node-role.kubernetes.io/master":        "",
			},
		},
		{
			Name:      "worker-1",
			Status:    "Ready",
			Roles:     []string{"worker"},
			Age:       "30d",
			Version:   "v1.29.2",
			OS:        "Ubuntu 22.04.4 LTS",
			Kernel:    "5.15.0-97-generic",
			Container: "containerd://1.7.13",
			Labels: map[string]string{
				"kubernetes.io/arch": "amd64",
				"kubernetes.io/os":   "linux",
			},
		},
		{
			Name:      "worker-2",
			Status:    "Ready",
			Roles:     []string{"worker"},
			Age:       "30d",
			Version:   "v1.29.2",
			OS:        "Ubuntu 22.04.4 LTS",
			Kernel:    "5.15.0-97-generic",
			Container: "containerd://1.7.13",
			Labels: map[string]string{
				"kubernetes.io/arch": "amd64",
				"kubernetes.io/os":   "linux",
			},
		},
		{
			Name:      "worker-3",
			Status:    "NotReady",
			Roles:     []string{"worker"},
			Age:       "25d",
			Version:   "v1.29.2",
			OS:        "Ubuntu 22.04.4 LTS",
			Kernel:    "5.15.0-97-generic",
			Container: "containerd://1.7.13",
			Labels: map[string]string{
				"kubernetes.io/arch": "amd64",
				"kubernetes.io/os":   "linux",
			},
		},
	}
}

func getMockDeployments() []DeploymentInfo {
	return []DeploymentInfo{
		{
			Name:      "nginx-app",
			Namespace: "denshimon-test",
			Ready:     "3/3",
			UpToDate:  3,
			Available: 3,
			Age:       "2h",
			Labels:    map[string]string{"app": "nginx", "version": "v1.0.0"},
		},
		{
			Name:      "redis-cache",
			Namespace: "denshimon-test",
			Ready:     "1/1",
			UpToDate:  1,
			Available: 1,
			Age:       "3h",
			Labels:    map[string]string{"app": "redis", "tier": "cache"},
		},
		{
			Name:      "api-backend",
			Namespace: "production",
			Ready:     "5/5",
			UpToDate:  5,
			Available: 5,
			Age:       "1d",
			Labels:    map[string]string{"app": "api-backend", "environment": "production"},
		},
		{
			Name:      "unhealthy-app",
			Namespace: "denshimon-test",
			Ready:     "0/2",
			UpToDate:  2,
			Available: 0,
			Age:       "45m",
			Labels:    map[string]string{"app": "unhealthy", "status": "failing-healthchecks"},
		},
		{
			Name:      "prometheus",
			Namespace: "monitoring",
			Ready:     "1/1",
			UpToDate:  1,
			Available: 1,
			Age:       "7d",
			Labels:    map[string]string{"app": "prometheus", "component": "monitoring"},
		},
		{
			Name:      "grafana",
			Namespace: "monitoring",
			Ready:     "1/1",
			UpToDate:  1,
			Available: 1,
			Age:       "7d",
			Labels:    map[string]string{"app": "grafana", "component": "monitoring"},
		},
	}
}

func getMockServices() []ServiceInfo {
	return []ServiceInfo{
		{
			Name:        "nginx-service",
			Namespace:   "denshimon-test",
			Type:        "ClusterIP",
			ClusterIP:   "10.96.123.45",
			ExternalIPs: []string{},
			Ports: []ServicePort{
				{
					Name:       "http",
					Protocol:   "TCP",
					Port:       80,
					TargetPort: "8080",
				},
			},
			Age:    "2h",
			Labels: map[string]string{"app": "nginx", "service": "web"},
		},
		{
			Name:        "redis-service",
			Namespace:   "denshimon-test",
			Type:        "ClusterIP",
			ClusterIP:   "10.96.234.56",
			ExternalIPs: []string{},
			Ports: []ServicePort{
				{
					Name:       "redis",
					Protocol:   "TCP",
					Port:       6379,
					TargetPort: "6379",
				},
			},
			Age:    "3h",
			Labels: map[string]string{"app": "redis", "tier": "cache"},
		},
		{
			Name:        "api-backend-service",
			Namespace:   "production",
			Type:        "LoadBalancer",
			ClusterIP:   "10.96.345.67",
			ExternalIPs: []string{"203.0.113.10"},
			Ports: []ServicePort{
				{
					Name:       "api",
					Protocol:   "TCP",
					Port:       8080,
					TargetPort: "8080",
					NodePort:   30080,
				},
				{
					Name:       "metrics",
					Protocol:   "TCP",
					Port:       9090,
					TargetPort: "9090",
					NodePort:   30090,
				},
			},
			Age:    "1d",
			Labels: map[string]string{"app": "api-backend", "environment": "production"},
		},
		{
			Name:        "kubernetes",
			Namespace:   "default",
			Type:        "ClusterIP",
			ClusterIP:   "10.96.0.1",
			ExternalIPs: []string{},
			Ports: []ServicePort{
				{
					Name:       "https",
					Protocol:   "TCP",
					Port:       443,
					TargetPort: "6443",
				},
			},
			Age:    "30d",
			Labels: map[string]string{"component": "apiserver", "provider": "kubernetes"},
		},
		{
			Name:        "prometheus-service",
			Namespace:   "monitoring",
			Type:        "NodePort",
			ClusterIP:   "10.96.456.78",
			ExternalIPs: []string{},
			Ports: []ServicePort{
				{
					Name:       "web",
					Protocol:   "TCP",
					Port:       9090,
					TargetPort: "9090",
					NodePort:   31090,
				},
			},
			Age:    "7d",
			Labels: map[string]string{"app": "prometheus", "component": "monitoring"},
		},
	}
}

// GET /api/k8s/namespaces - List all namespaces
func (h *KubernetesHandlers) ListNamespaces(w http.ResponseWriter, r *http.Request) {
	if h.k8sClient == nil {
		// Return mock data for testing
		mockNamespaces := getMockNamespaces()
		SendSuccess(w, mockNamespaces)
		return
	}

	namespaces, err := h.k8sClient.Clientset().CoreV1().Namespaces().List(context.Background(), metav1.ListOptions{})
	if err != nil {
		SendError(w, http.StatusInternalServerError, fmt.Sprintf("Failed to list namespaces: %v", err))
		return
	}

	type NamespaceInfo struct {
		Name   string            `json:"name"`
		Status string            `json:"status"`
		Age    string            `json:"age"`
		Labels map[string]string `json:"labels"`
	}

	var namespaceInfos []NamespaceInfo
	for _, ns := range namespaces.Items {
		namespaceInfo := NamespaceInfo{
			Name:   ns.Name,
			Status: string(ns.Status.Phase),
			Age:    formatAge(ns.CreationTimestamp.Time),
			Labels: ns.Labels,
		}
		namespaceInfos = append(namespaceInfos, namespaceInfo)
	}

	SendSuccess(w, namespaceInfos)
}

// GET /api/k8s/storage - Get storage information
func (h *KubernetesHandlers) GetStorageInfo(w http.ResponseWriter, r *http.Request) {
	if h.k8sClient == nil {
		// Return mock data for testing
		mockStorage := getMockStorageInfo()
		SendSuccess(w, mockStorage)
		return
	}

	// Get persistent volumes
	pvs, err := h.k8sClient.Clientset().CoreV1().PersistentVolumes().List(context.Background(), metav1.ListOptions{})
	if err != nil {
		SendError(w, http.StatusInternalServerError, fmt.Sprintf("Failed to list persistent volumes: %v", err))
		return
	}

	// Get persistent volume claims
	pvcs, err := h.k8sClient.Clientset().CoreV1().PersistentVolumeClaims("").List(context.Background(), metav1.ListOptions{})
	if err != nil {
		SendError(w, http.StatusInternalServerError, fmt.Sprintf("Failed to list persistent volume claims: %v", err))
		return
	}

	type StorageInfo struct {
		PersistentVolumes      []map[string]interface{} `json:"persistentVolumes"`
		PersistentVolumeClaims []map[string]interface{} `json:"persistentVolumeClaims"`
		StorageClasses         []map[string]interface{} `json:"storageClasses"`
	}

	storageInfo := StorageInfo{
		PersistentVolumes:      []map[string]interface{}{},
		PersistentVolumeClaims: []map[string]interface{}{},
		StorageClasses:         []map[string]interface{}{},
	}

	// Process PVs
	for _, pv := range pvs.Items {
		pvInfo := map[string]interface{}{
			"name":          pv.Name,
			"status":        string(pv.Status.Phase),
			"capacity":      pv.Spec.Capacity,
			"accessModes":   pv.Spec.AccessModes,
			"reclaimPolicy": string(pv.Spec.PersistentVolumeReclaimPolicy),
			"age":           formatAge(pv.CreationTimestamp.Time),
		}
		storageInfo.PersistentVolumes = append(storageInfo.PersistentVolumes, pvInfo)
	}

	// Process PVCs
	for _, pvc := range pvcs.Items {
		pvcInfo := map[string]interface{}{
			"name":         pvc.Name,
			"namespace":    pvc.Namespace,
			"status":       string(pvc.Status.Phase),
			"capacity":     pvc.Status.Capacity,
			"accessModes":  pvc.Spec.AccessModes,
			"storageClass": pvc.Spec.StorageClassName,
			"age":          formatAge(pvc.CreationTimestamp.Time),
		}
		storageInfo.PersistentVolumeClaims = append(storageInfo.PersistentVolumeClaims, pvcInfo)
	}

	SendSuccess(w, storageInfo)
}

func getMockNamespaces() []map[string]interface{} {
	return []map[string]interface{}{
		{
			"name":   "default",
			"status": "Active",
			"age":    "30d",
			"labels": map[string]string{},
		},
		{
			"name":   "kube-system",
			"status": "Active",
			"age":    "30d",
			"labels": map[string]string{},
		},
		{
			"name":   "production",
			"status": "Active",
			"age":    "25d",
			"labels": map[string]string{"environment": "production"},
		},
		{
			"name":   "denshimon-test",
			"status": "Active",
			"age":    "7d",
			"labels": map[string]string{"environment": "test"},
		},
		{
			"name":   "monitoring",
			"status": "Active",
			"age":    "15d",
			"labels": map[string]string{"purpose": "monitoring"},
		},
	}
}

func getMockStorageInfo() map[string]interface{} {
	return map[string]interface{}{
		"persistentVolumes": []map[string]interface{}{
			{
				"name":          "pv-vps-storage-1",
				"status":        "Bound",
				"capacity":      map[string]string{"storage": "50Gi"},
				"accessModes":   []string{"ReadWriteOnce"},
				"reclaimPolicy": "Retain",
				"age":           "15d",
			},
			{
				"name":          "pv-vps-storage-2",
				"status":        "Available",
				"capacity":      map[string]string{"storage": "100Gi"},
				"accessModes":   []string{"ReadWriteOnce"},
				"reclaimPolicy": "Delete",
				"age":           "10d",
			},
		},
		"persistentVolumeClaims": []map[string]interface{}{
			{
				"name":         "data-postgres-0",
				"namespace":    "production",
				"status":       "Bound",
				"capacity":     map[string]string{"storage": "20Gi"},
				"accessModes":  []string{"ReadWriteOnce"},
				"storageClass": "vps-ssd",
				"age":          "15d",
			},
			{
				"name":         "redis-data",
				"namespace":    "denshimon-test",
				"status":       "Bound",
				"capacity":     map[string]string{"storage": "5Gi"},
				"accessModes":  []string{"ReadWriteOnce"},
				"storageClass": "vps-ssd",
				"age":          "3h",
			},
		},
		"storageClasses": []map[string]interface{}{
			{
				"name":              "vps-ssd",
				"provisioner":       "kubernetes.io/host-path",
				"reclaimPolicy":     "Delete",
				"volumeBindingMode": "Immediate",
				"age":               "30d",
			},
		},
	}
}

func getMockEvents() []EventInfo {
	return []EventInfo{
		{
			Name:      "nginx-app-5d4c4b8f45-abc12.17d2a1b2c3d4e5f6",
			Namespace: "denshimon-test",
			Type:      "Normal",
			Reason:    "Scheduled",
			Object:    "Pod/nginx-app-5d4c4b8f45-abc12",
			Message:   "Successfully assigned denshimon-test/nginx-app-5d4c4b8f45-abc12 to worker-1",
			Count:     1,
			FirstTime: time.Now().Add(-2 * time.Hour).Format(time.RFC3339),
			LastTime:  time.Now().Add(-2 * time.Hour).Format(time.RFC3339),
			Labels:    map[string]string{},
		},
		{
			Name:      "nginx-app-5d4c4b8f45-abc12.17d2a1b2c3d4e5f7",
			Namespace: "denshimon-test",
			Type:      "Normal",
			Reason:    "Pulling",
			Object:    "Pod/nginx-app-5d4c4b8f45-abc12",
			Message:   "Pulling image \"nginx:1.21\"",
			Count:     1,
			FirstTime: time.Now().Add(-2 * time.Hour).Format(time.RFC3339),
			LastTime:  time.Now().Add(-2 * time.Hour).Format(time.RFC3339),
			Labels:    map[string]string{},
		},
		{
			Name:      "nginx-app-5d4c4b8f45-abc12.17d2a1b2c3d4e5f8",
			Namespace: "denshimon-test",
			Type:      "Normal",
			Reason:    "Pulled",
			Object:    "Pod/nginx-app-5d4c4b8f45-abc12",
			Message:   "Successfully pulled image \"nginx:1.21\"",
			Count:     1,
			FirstTime: time.Now().Add(-2 * time.Hour).Format(time.RFC3339),
			LastTime:  time.Now().Add(-2 * time.Hour).Format(time.RFC3339),
			Labels:    map[string]string{},
		},
		{
			Name:      "nginx-app-5d4c4b8f45-abc12.17d2a1b2c3d4e5f9",
			Namespace: "denshimon-test",
			Type:      "Normal",
			Reason:    "Created",
			Object:    "Pod/nginx-app-5d4c4b8f45-abc12",
			Message:   "Created container nginx",
			Count:     1,
			FirstTime: time.Now().Add(-2 * time.Hour).Format(time.RFC3339),
			LastTime:  time.Now().Add(-2 * time.Hour).Format(time.RFC3339),
			Labels:    map[string]string{},
		},
		{
			Name:      "nginx-app-5d4c4b8f45-abc12.17d2a1b2c3d4e5fa",
			Namespace: "denshimon-test",
			Type:      "Normal",
			Reason:    "Started",
			Object:    "Pod/nginx-app-5d4c4b8f45-abc12",
			Message:   "Started container nginx",
			Count:     1,
			FirstTime: time.Now().Add(-2 * time.Hour).Format(time.RFC3339),
			LastTime:  time.Now().Add(-2 * time.Hour).Format(time.RFC3339),
			Labels:    map[string]string{},
		},
		{
			Name:      "failing-pod-crash.17d2a1b2c3d4e5fb",
			Namespace: "denshimon-test",
			Type:      "Warning",
			Reason:    "BackOff",
			Object:    "Pod/failing-pod-crash",
			Message:   "Back-off restarting failed container",
			Count:     15,
			FirstTime: time.Now().Add(-30 * time.Minute).Format(time.RFC3339),
			LastTime:  time.Now().Add(-1 * time.Minute).Format(time.RFC3339),
			Labels:    map[string]string{},
		},
		{
			Name:      "pending-pod-no-resources.17d2a1b2c3d4e5fc",
			Namespace: "denshimon-test",
			Type:      "Warning",
			Reason:    "FailedScheduling",
			Object:    "Pod/pending-pod-no-resources",
			Message:   "0/3 nodes are available: 3 Insufficient memory.",
			Count:     5,
			FirstTime: time.Now().Add(-45 * time.Minute).Format(time.RFC3339),
			LastTime:  time.Now().Add(-30 * time.Minute).Format(time.RFC3339),
			Labels:    map[string]string{},
		},
		{
			Name:      "nginx-app.17d2a1b2c3d4e5fd",
			Namespace: "denshimon-test",
			Type:      "Normal",
			Reason:    "ScalingReplicaSet",
			Object:    "Deployment/nginx-app",
			Message:   "Scaled up replica set nginx-app-5d4c4b8f45 to 3",
			Count:     1,
			FirstTime: time.Now().Add(-2 * time.Hour).Format(time.RFC3339),
			LastTime:  time.Now().Add(-2 * time.Hour).Format(time.RFC3339),
			Labels:    map[string]string{},
		},
	}
}
