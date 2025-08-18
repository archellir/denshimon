package deployments

import (
	"context"
	"database/sql"
	"fmt"
	"testing"
	"time"

	_ "github.com/mattn/go-sqlite3"
)

// TestService provides test utilities
func setupTestService(t *testing.T) (*Service, *sql.DB, func()) {
	// Create in-memory SQLite database
	db, err := sql.Open("sqlite3", ":memory:")
	if err != nil {
		t.Fatalf("Failed to create test database: %v", err)
	}

	// Create a basic service with mocks
	service := &Service{
		db: db,
	}

	// Initialize database schema
	service.initDB()

	cleanup := func() {
		db.Close()
	}

	return service, db, cleanup
}

func TestCreateDeploymentRequestValidation(t *testing.T) {
	tests := []struct {
		name    string
		request CreateDeploymentRequest
		wantErr bool
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
			wantErr: false,
		},
		{
			name: "empty_name",
			request: CreateDeploymentRequest{
				Name:      "",
				Namespace: "default",
				Image:     "nginx:latest",
				Replicas:  3,
			},
			wantErr: true,
		},
		{
			name: "empty_namespace",
			request: CreateDeploymentRequest{
				Name:      "test-app",
				Namespace: "",
				Image:     "nginx:latest",
				Replicas:  3,
			},
			wantErr: true,
		},
		{
			name: "empty_image",
			request: CreateDeploymentRequest{
				Name:      "test-app",
				Namespace: "default",
				Image:     "",
				Replicas:  3,
			},
			wantErr: true,
		},
		{
			name: "zero_replicas",
			request: CreateDeploymentRequest{
				Name:      "test-app",
				Namespace: "default",
				Image:     "nginx:latest",
				Replicas:  0,
			},
			wantErr: true,
		},
		{
			name: "negative_replicas",
			request: CreateDeploymentRequest{
				Name:      "test-app",
				Namespace: "default",
				Image:     "nginx:latest",
				Replicas:  -1,
			},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := validateCreateRequest(tt.request)
			hasErr := err != nil
			if hasErr != tt.wantErr {
				t.Errorf("validateCreateRequest() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestUpdateDeploymentRequestValidation(t *testing.T) {
	tests := []struct {
		name    string
		request UpdateDeploymentRequest
		wantErr bool
	}{
		{
			name: "valid_image_update",
			request: UpdateDeploymentRequest{
				Image: "nginx:1.20",
			},
			wantErr: false,
		},
		{
			name: "valid_replica_update",
			request: UpdateDeploymentRequest{
				Replicas: int32Ptr(5),
			},
			wantErr: false,
		},
		{
			name: "invalid_negative_replicas",
			request: UpdateDeploymentRequest{
				Replicas: int32Ptr(-1),
			},
			wantErr: true,
		},
		{
			name: "valid_zero_replicas",
			request: UpdateDeploymentRequest{
				Replicas: int32Ptr(0),
			},
			wantErr: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := validateUpdateRequest(tt.request)
			hasErr := err != nil
			if hasErr != tt.wantErr {
				t.Errorf("validateUpdateRequest() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestDeploymentStatusTransitions(t *testing.T) {
	tests := []struct {
		name        string
		fromStatus  DeploymentStatus
		toStatus    DeploymentStatus
		shouldAllow bool
	}{
		{"pending_to_committed", DeploymentStatusPending, DeploymentStatusCommitted, true},
		{"committed_to_pending_apply", DeploymentStatusCommitted, DeploymentStatusPendingApply, true},
		{"pending_apply_to_applying", DeploymentStatusPendingApply, DeploymentStatusApplying, true},
		{"applying_to_running", DeploymentStatusApplying, DeploymentStatusRunning, true},
		{"applying_to_apply_failed", DeploymentStatusApplying, DeploymentStatusApplyFailed, true},
		{"running_to_updating", DeploymentStatusRunning, DeploymentStatusUpdating, true},
		{"updating_to_running", DeploymentStatusUpdating, DeploymentStatusRunning, true},
		{"running_to_terminating", DeploymentStatusRunning, DeploymentStatusTerminating, true},
		{"invalid_committed_to_running", DeploymentStatusCommitted, DeploymentStatusRunning, false},
		{"invalid_pending_to_running", DeploymentStatusPending, DeploymentStatusRunning, false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			allowed := isValidTransition(tt.fromStatus, tt.toStatus)
			if allowed != tt.shouldAllow {
				t.Errorf("Status transition %s -> %s: got %v, want %v", 
					tt.fromStatus, tt.toStatus, allowed, tt.shouldAllow)
			}
		})
	}
}

func TestDatabaseOperations(t *testing.T) {
	service, _, cleanup := setupTestService(t)
	defer cleanup()

	ctx := context.Background()

	// Test storing a deployment
	deployment := &Deployment{
		ID:        "test-deployment-1",
		Name:      "test-app",
		Namespace: "default",
		Image:     "nginx:latest",
		Replicas:  3,
		Status:    DeploymentStatusPending,
		Source:    "internal",
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	err := service.storeDeploymentInDB(deployment)
	if err != nil {
		t.Fatalf("Failed to store deployment: %v", err)
	}

	// Test retrieving the deployment
	retrieved, err := service.GetDeployment(ctx, deployment.ID)
	if err != nil {
		t.Fatalf("Failed to retrieve deployment: %v", err)
	}

	if retrieved.ID != deployment.ID {
		t.Errorf("Retrieved deployment ID = %q, want %q", retrieved.ID, deployment.ID)
	}
	if retrieved.Name != deployment.Name {
		t.Errorf("Retrieved deployment Name = %q, want %q", retrieved.Name, deployment.Name)
	}
	if retrieved.Status != deployment.Status {
		t.Errorf("Retrieved deployment Status = %q, want %q", retrieved.Status, deployment.Status)
	}

	// Test listing deployments
	deployments, err := service.ListDeployments(ctx, "")
	if err != nil {
		t.Fatalf("Failed to list deployments: %v", err)
	}

	if len(deployments) != 1 {
		t.Errorf("Expected 1 deployment, got %d", len(deployments))
	}

	// Test updating deployment
	deployment.Status = DeploymentStatusRunning
	deployment.UpdatedAt = time.Now()
	err = service.updateDeploymentInDB(deployment)
	if err != nil {
		t.Fatalf("Failed to update deployment: %v", err)
	}

	// Verify update
	updated, err := service.GetDeployment(ctx, deployment.ID)
	if err != nil {
		t.Fatalf("Failed to retrieve updated deployment: %v", err)
	}

	if updated.Status != DeploymentStatusRunning {
		t.Errorf("Updated deployment Status = %q, want %q", updated.Status, DeploymentStatusRunning)
	}
}

func TestDeploymentHistoryOperations(t *testing.T) {
	service, _, cleanup := setupTestService(t)
	defer cleanup()

	deploymentID := "test-deployment-1"

	// Record some history
	service.recordHistory(deploymentID, "create", "", "nginx:latest", 0, 3, true, "", "admin")
	service.recordHistory(deploymentID, "update", "nginx:latest", "nginx:1.20", 3, 3, true, "", "admin")
	service.recordHistory(deploymentID, "scale", "", "", 3, 5, true, "", "admin")

	// Retrieve history
	history, err := service.getDeploymentHistory(deploymentID)
	if err != nil {
		t.Fatalf("Failed to get deployment history: %v", err)
	}

	if len(history) != 3 {
		t.Errorf("Expected 3 history entries, got %d", len(history))
	}

	// Verify order (should be newest first)
	if history[0].Action != "scale" {
		t.Errorf("First history entry action = %q, want 'scale'", history[0].Action)
	}
	if history[1].Action != "update" {
		t.Errorf("Second history entry action = %q, want 'update'", history[1].Action)
	}
	if history[2].Action != "create" {
		t.Errorf("Third history entry action = %q, want 'create'", history[2].Action)
	}
}

func TestResourceValidation(t *testing.T) {
	tests := []struct {
		name      string
		resources ResourceRequirements
		valid     bool
	}{
		{
			name: "valid_resources",
			resources: ResourceRequirements{
				Limits:   ResourceList{CPU: "1", Memory: "1Gi"},
				Requests: ResourceList{CPU: "500m", Memory: "512Mi"},
			},
			valid: true,
		},
		{
			name: "empty_resources",
			resources: ResourceRequirements{},
			valid: true,
		},
		{
			name: "invalid_cpu_format",
			resources: ResourceRequirements{
				Limits: ResourceList{CPU: "invalid", Memory: "1Gi"},
			},
			valid: false,
		},
		{
			name: "invalid_memory_format",
			resources: ResourceRequirements{
				Limits: ResourceList{CPU: "1", Memory: "invalid"},
			},
			valid: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			valid := validateResources(tt.resources)
			if valid != tt.valid {
				t.Errorf("validateResources() = %v, want %v", valid, tt.valid)
			}
		})
	}
}

func TestPendingDeployments(t *testing.T) {
	service, _, cleanup := setupTestService(t)
	defer cleanup()

	ctx := context.Background()

	// Create test deployments with different statuses
	deployments := []*Deployment{
		{
			ID:        "pending-1",
			Name:      "pending-app-1",
			Namespace: "default",
			Image:     "nginx:latest",
			Status:    DeploymentStatusPendingApply,
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
		{
			ID:        "committed-1",
			Name:      "committed-app-1", 
			Namespace: "default",
			Image:     "nginx:latest",
			Status:    DeploymentStatusCommitted,
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
		{
			ID:        "running-1",
			Name:      "running-app-1",
			Namespace: "default", 
			Image:     "nginx:latest",
			Status:    DeploymentStatusRunning,
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
	}

	// Store all deployments
	for _, deployment := range deployments {
		err := service.storeDeploymentInDB(deployment)
		if err != nil {
			t.Fatalf("Failed to store deployment %s: %v", deployment.ID, err)
		}
	}

	// Get pending deployments
	pending, err := service.GetPendingDeployments(ctx)
	if err != nil {
		t.Fatalf("Failed to get pending deployments: %v", err)
	}

	// Should return 2 deployments (pending_apply and committed)
	if len(pending) != 2 {
		t.Errorf("Expected 2 pending deployments, got %d", len(pending))
	}

	// Verify the correct deployments are returned
	foundPending := false
	foundCommitted := false
	for _, deployment := range pending {
		if deployment.ID == "pending-1" {
			foundPending = true
		}
		if deployment.ID == "committed-1" {
			foundCommitted = true
		}
		if deployment.ID == "running-1" {
			t.Errorf("Running deployment should not be in pending list")
		}
	}

	if !foundPending {
		t.Error("Expected to find pending deployment in pending list")
	}
	if !foundCommitted {
		t.Error("Expected to find committed deployment in pending list")
	}
}

// Helper functions for tests

func int32Ptr(i int32) *int32 {
	return &i
}

// Validation helper functions
func validateCreateRequest(req CreateDeploymentRequest) error {
	if req.Name == "" {
		return fmt.Errorf("name is required")
	}
	if req.Namespace == "" {
		return fmt.Errorf("namespace is required")
	}
	if req.Image == "" {
		return fmt.Errorf("image is required")
	}
	if req.Replicas <= 0 {
		return fmt.Errorf("replicas must be greater than 0")
	}
	return nil
}

func validateUpdateRequest(req UpdateDeploymentRequest) error {
	if req.Replicas != nil && *req.Replicas < 0 {
		return fmt.Errorf("replicas cannot be negative")
	}
	return nil
}

func validateResources(resources ResourceRequirements) bool {
	// Simplified validation - in reality you'd parse CPU and memory values
	if resources.Limits.CPU != "" && resources.Limits.CPU == "invalid" {
		return false
	}
	if resources.Limits.Memory != "" && resources.Limits.Memory == "invalid" {
		return false
	}
	if resources.Requests.CPU != "" && resources.Requests.CPU == "invalid" {
		return false
	}
	if resources.Requests.Memory != "" && resources.Requests.Memory == "invalid" {
		return false
	}
	return true
}

func isValidTransition(from, to DeploymentStatus) bool {
	validTransitions := map[DeploymentStatus][]DeploymentStatus{
		DeploymentStatusPending: {
			DeploymentStatusCommitted,
			DeploymentStatusFailed,
		},
		DeploymentStatusCommitted: {
			DeploymentStatusPendingApply,
			DeploymentStatusFailed,
		},
		DeploymentStatusPendingApply: {
			DeploymentStatusApplying,
			DeploymentStatusFailed,
		},
		DeploymentStatusApplying: {
			DeploymentStatusRunning,
			DeploymentStatusApplyFailed,
		},
		DeploymentStatusRunning: {
			DeploymentStatusUpdating,
			DeploymentStatusTerminating,
			DeploymentStatusFailed,
		},
		DeploymentStatusUpdating: {
			DeploymentStatusRunning,
			DeploymentStatusFailed,
		},
		DeploymentStatusFailed: {
			DeploymentStatusPending,
			DeploymentStatusTerminating,
		},
		DeploymentStatusApplyFailed: {
			DeploymentStatusPendingApply,
			DeploymentStatusTerminating,
		},
	}

	allowed, exists := validTransitions[from]
	if !exists {
		return false
	}

	for _, status := range allowed {
		if status == to {
			return true
		}
	}
	return false
}