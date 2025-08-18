package deployments

import (
	"encoding/json"
	"testing"
	"time"
)

func TestDeploymentStatus(t *testing.T) {
	tests := []struct {
		name     string
		status   DeploymentStatus
		expected string
	}{
		{"pending", DeploymentStatusPending, "pending"},
		{"committed", DeploymentStatusCommitted, "committed"},
		{"pending_apply", DeploymentStatusPendingApply, "pending_apply"},
		{"applying", DeploymentStatusApplying, "applying"},
		{"running", DeploymentStatusRunning, "running"},
		{"failed", DeploymentStatusFailed, "failed"},
		{"apply_failed", DeploymentStatusApplyFailed, "apply_failed"},
		{"updating", DeploymentStatusUpdating, "updating"},
		{"terminating", DeploymentStatusTerminating, "terminating"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if string(tt.status) != tt.expected {
				t.Errorf("DeploymentStatus %s = %q, want %q", tt.name, string(tt.status), tt.expected)
			}
		})
	}
}

func TestDeploymentJSONMarshaling(t *testing.T) {
	now := time.Now()
	appliedAt := now.Add(-time.Hour)

	deployment := Deployment{
		ID:                "test-deployment-1",
		Name:              "test-app",
		Namespace:         "default",
		Image:             "nginx:latest",
		RegistryID:        "registry-1",
		Replicas:          3,
		AvailableReplicas: 3,
		ReadyReplicas:     3,
		NodeSelector:      map[string]string{"node-type": "worker"},
		Strategy: DeploymentStrategy{
			Type:           "RollingUpdate",
			MaxSurge:       1,
			MaxUnavailable: 1,
			NodeSpread:     true,
			ZoneSpread:     false,
		},
		Status: DeploymentStatusRunning,
		Pods: []PodInfo{
			{
				Name:      "test-app-pod-1",
				Phase:     "Running",
				Ready:     true,
				Restarts:  0,
				NodeName:  "worker-1",
				CreatedAt: now,
				IP:        "10.0.0.1",
				Labels:    map[string]string{"app": "test-app"},
			},
		},
		NodeDistribution: map[string]int{"worker-1": 1, "worker-2": 2},
		Resources: ResourceRequirements{
			Limits:   ResourceList{CPU: "500m", Memory: "512Mi"},
			Requests: ResourceList{CPU: "250m", Memory: "256Mi"},
		},
		Environment: map[string]string{"ENV": "production", "DEBUG": "false"},
		Source:      "internal",
		Author:      "admin",
		AppliedBy:   "admin",
		AppliedAt:   &appliedAt,
		ServiceType: "web",
		CreatedAt:   now,
		UpdatedAt:   now,
	}

	// Test JSON marshaling
	jsonData, err := json.Marshal(deployment)
	if err != nil {
		t.Fatalf("Failed to marshal deployment to JSON: %v", err)
	}

	// Test JSON unmarshaling
	var unmarshaled Deployment
	err = json.Unmarshal(jsonData, &unmarshaled)
	if err != nil {
		t.Fatalf("Failed to unmarshal deployment from JSON: %v", err)
	}

	// Verify key fields
	if unmarshaled.ID != deployment.ID {
		t.Errorf("ID mismatch: got %q, want %q", unmarshaled.ID, deployment.ID)
	}
	if unmarshaled.Status != deployment.Status {
		t.Errorf("Status mismatch: got %q, want %q", unmarshaled.Status, deployment.Status)
	}
	if unmarshaled.Replicas != deployment.Replicas {
		t.Errorf("Replicas mismatch: got %d, want %d", unmarshaled.Replicas, deployment.Replicas)
	}
	if len(unmarshaled.Pods) != len(deployment.Pods) {
		t.Errorf("Pods count mismatch: got %d, want %d", len(unmarshaled.Pods), len(deployment.Pods))
	}
}

func TestCreateDeploymentRequestValidation(t *testing.T) {
	tests := []struct {
		name    string
		request CreateDeploymentRequest
		valid   bool
	}{
		{
			name: "valid_request",
			request: CreateDeploymentRequest{
				Name:      "test-app",
				Namespace: "default",
				Image:     "nginx:latest",
				Replicas:  3,
				Strategy: DeploymentStrategy{
					Type: "RollingUpdate",
				},
			},
			valid: true,
		},
		{
			name: "empty_name",
			request: CreateDeploymentRequest{
				Name:      "",
				Namespace: "default",
				Image:     "nginx:latest",
				Replicas:  3,
			},
			valid: false,
		},
		{
			name: "zero_replicas",
			request: CreateDeploymentRequest{
				Name:      "test-app",
				Namespace: "default",
				Image:     "nginx:latest",
				Replicas:  0,
			},
			valid: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			isValid := validateCreateDeploymentRequest(tt.request)
			if isValid != tt.valid {
				t.Errorf("Validation for %s: got %v, want %v", tt.name, isValid, tt.valid)
			}
		})
	}
}

func TestScaleDeploymentRequest(t *testing.T) {
	request := ScaleDeploymentRequest{
		Replicas: 5,
	}

	if request.Replicas != 5 {
		t.Errorf("ScaleDeploymentRequest.Replicas = %d, want 5", request.Replicas)
	}

	// Test JSON marshaling
	jsonData, err := json.Marshal(request)
	if err != nil {
		t.Fatalf("Failed to marshal ScaleDeploymentRequest: %v", err)
	}

	var unmarshaled ScaleDeploymentRequest
	err = json.Unmarshal(jsonData, &unmarshaled)
	if err != nil {
		t.Fatalf("Failed to unmarshal ScaleDeploymentRequest: %v", err)
	}

	if unmarshaled.Replicas != request.Replicas {
		t.Errorf("Unmarshaled replicas = %d, want %d", unmarshaled.Replicas, request.Replicas)
	}
}

func TestUpdateDeploymentRequest(t *testing.T) {
	replicas := int32(5)
	request := UpdateDeploymentRequest{
		Image:    "nginx:1.20",
		Replicas: &replicas,
		Resources: &ResourceRequirements{
			Limits: ResourceList{CPU: "1", Memory: "1Gi"},
		},
		Environment: map[string]string{"NEW_VAR": "value"},
	}

	if request.Image != "nginx:1.20" {
		t.Errorf("UpdateDeploymentRequest.Image = %q, want %q", request.Image, "nginx:1.20")
	}

	if *request.Replicas != 5 {
		t.Errorf("UpdateDeploymentRequest.Replicas = %d, want 5", *request.Replicas)
	}

	if request.Resources.Limits.CPU != "1" {
		t.Errorf("UpdateDeploymentRequest.Resources.Limits.CPU = %q, want %q", request.Resources.Limits.CPU, "1")
	}
}

func TestNodeInfo(t *testing.T) {
	node := NodeInfo{
		Name:     "worker-1",
		Ready:    true,
		Roles:    []string{"worker"},
		Version:  "v1.28.0",
		OS:       "linux",
		Arch:     "amd64",
		Zone:     "us-west-1a",
		Region:   "us-west-1",
		Labels:   map[string]string{"node-type": "worker"},
		Capacity: ResourceList{CPU: "4", Memory: "8Gi"},
		Allocatable: ResourceList{CPU: "3.8", Memory: "7.5Gi"},
		PodCount: 15,
	}

	// Test JSON marshaling
	jsonData, err := json.Marshal(node)
	if err != nil {
		t.Fatalf("Failed to marshal NodeInfo: %v", err)
	}

	var unmarshaled NodeInfo
	err = json.Unmarshal(jsonData, &unmarshaled)
	if err != nil {
		t.Fatalf("Failed to unmarshal NodeInfo: %v", err)
	}

	if unmarshaled.Name != node.Name {
		t.Errorf("NodeInfo.Name = %q, want %q", unmarshaled.Name, node.Name)
	}
	if unmarshaled.Ready != node.Ready {
		t.Errorf("NodeInfo.Ready = %v, want %v", unmarshaled.Ready, node.Ready)
	}
	if len(unmarshaled.Roles) != len(node.Roles) {
		t.Errorf("NodeInfo.Roles length = %d, want %d", len(unmarshaled.Roles), len(node.Roles))
	}
}

func TestAutoScaler(t *testing.T) {
	cpuPercent := int32(80)
	memoryPercent := int32(75)

	autoscaler := AutoScaler{
		ID:                  "hpa-1",
		DeploymentID:        "deployment-1",
		MinReplicas:         2,
		MaxReplicas:         10,
		TargetCPUPercent:    &cpuPercent,
		TargetMemoryPercent: &memoryPercent,
		Enabled:             true,
		CreatedAt:           time.Now(),
	}

	// Test JSON marshaling
	jsonData, err := json.Marshal(autoscaler)
	if err != nil {
		t.Fatalf("Failed to marshal AutoScaler: %v", err)
	}

	var unmarshaled AutoScaler
	err = json.Unmarshal(jsonData, &unmarshaled)
	if err != nil {
		t.Fatalf("Failed to unmarshal AutoScaler: %v", err)
	}

	if unmarshaled.MinReplicas != autoscaler.MinReplicas {
		t.Errorf("AutoScaler.MinReplicas = %d, want %d", unmarshaled.MinReplicas, autoscaler.MinReplicas)
	}
	if unmarshaled.MaxReplicas != autoscaler.MaxReplicas {
		t.Errorf("AutoScaler.MaxReplicas = %d, want %d", unmarshaled.MaxReplicas, autoscaler.MaxReplicas)
	}
	if *unmarshaled.TargetCPUPercent != *autoscaler.TargetCPUPercent {
		t.Errorf("AutoScaler.TargetCPUPercent = %d, want %d", *unmarshaled.TargetCPUPercent, *autoscaler.TargetCPUPercent)
	}
}

func TestDeploymentHistoryJSON(t *testing.T) {
	history := DeploymentHistory{
		ID:           "history-1",
		DeploymentID: "deployment-1",
		Action:       "update",
		OldImage:     "nginx:1.19",
		NewImage:     "nginx:1.20",
		OldReplicas:  3,
		NewReplicas:  5,
		Success:      true,
		User:         "admin",
		Timestamp:    time.Now(),
		Metadata:     map[string]interface{}{"reason": "scaling up for traffic"},
	}

	// Test JSON marshaling
	jsonData, err := json.Marshal(history)
	if err != nil {
		t.Fatalf("Failed to marshal DeploymentHistory: %v", err)
	}

	var unmarshaled DeploymentHistory
	err = json.Unmarshal(jsonData, &unmarshaled)
	if err != nil {
		t.Fatalf("Failed to unmarshal DeploymentHistory: %v", err)
	}

	if unmarshaled.Action != history.Action {
		t.Errorf("DeploymentHistory.Action = %q, want %q", unmarshaled.Action, history.Action)
	}
	if unmarshaled.OldImage != history.OldImage {
		t.Errorf("DeploymentHistory.OldImage = %q, want %q", unmarshaled.OldImage, history.OldImage)
	}
	if unmarshaled.NewImage != history.NewImage {
		t.Errorf("DeploymentHistory.NewImage = %q, want %q", unmarshaled.NewImage, history.NewImage)
	}
}

func TestPodInfo(t *testing.T) {
	pod := PodInfo{
		Name:      "test-pod-1",
		Phase:     "Running",
		Ready:     true,
		Restarts:  2,
		NodeName:  "worker-1",
		CreatedAt: time.Now(),
		IP:        "10.0.0.1",
		Labels:    map[string]string{"app": "test", "version": "v1"},
	}

	// Test JSON marshaling
	jsonData, err := json.Marshal(pod)
	if err != nil {
		t.Fatalf("Failed to marshal PodInfo: %v", err)
	}

	var unmarshaled PodInfo
	err = json.Unmarshal(jsonData, &unmarshaled)
	if err != nil {
		t.Fatalf("Failed to unmarshal PodInfo: %v", err)
	}

	if unmarshaled.Name != pod.Name {
		t.Errorf("PodInfo.Name = %q, want %q", unmarshaled.Name, pod.Name)
	}
	if unmarshaled.Phase != pod.Phase {
		t.Errorf("PodInfo.Phase = %q, want %q", unmarshaled.Phase, pod.Phase)
	}
	if unmarshaled.Ready != pod.Ready {
		t.Errorf("PodInfo.Ready = %v, want %v", unmarshaled.Ready, pod.Ready)
	}
}

func TestResourceRequirements(t *testing.T) {
	resources := ResourceRequirements{
		Limits: ResourceList{
			CPU:    "1",
			Memory: "1Gi",
		},
		Requests: ResourceList{
			CPU:    "500m",
			Memory: "512Mi",
		},
	}

	// Test JSON marshaling
	jsonData, err := json.Marshal(resources)
	if err != nil {
		t.Fatalf("Failed to marshal ResourceRequirements: %v", err)
	}

	var unmarshaled ResourceRequirements
	err = json.Unmarshal(jsonData, &unmarshaled)
	if err != nil {
		t.Fatalf("Failed to unmarshal ResourceRequirements: %v", err)
	}

	if unmarshaled.Limits.CPU != resources.Limits.CPU {
		t.Errorf("ResourceRequirements.Limits.CPU = %q, want %q", unmarshaled.Limits.CPU, resources.Limits.CPU)
	}
	if unmarshaled.Requests.Memory != resources.Requests.Memory {
		t.Errorf("ResourceRequirements.Requests.Memory = %q, want %q", unmarshaled.Requests.Memory, resources.Requests.Memory)
	}
}

// Helper function for testing types validation
func validateCreateDeploymentRequest(req CreateDeploymentRequest) bool {
	if req.Name == "" {
		return false
	}
	if req.Namespace == "" {
		return false
	}
	if req.Image == "" {
		return false
	}
	if req.Replicas <= 0 {
		return false
	}
	return true
}

// Benchmark tests
func BenchmarkDeploymentJSONMarshal(b *testing.B) {
	deployment := Deployment{
		ID:        "test-deployment",
		Name:      "test-app",
		Namespace: "default",
		Image:     "nginx:latest",
		Replicas:  3,
		Status:    DeploymentStatusRunning,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, err := json.Marshal(deployment)
		if err != nil {
			b.Fatal(err)
		}
	}
}

func BenchmarkDeploymentJSONUnmarshal(b *testing.B) {
	deployment := Deployment{
		ID:        "test-deployment",
		Name:      "test-app",
		Namespace: "default",
		Image:     "nginx:latest",
		Replicas:  3,
		Status:    DeploymentStatusRunning,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	jsonData, _ := json.Marshal(deployment)

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		var unmarshaled Deployment
		err := json.Unmarshal(jsonData, &unmarshaled)
		if err != nil {
			b.Fatal(err)
		}
	}
}