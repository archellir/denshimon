package deployments

import (
	"time"
)

// Deployment represents a deployed application in Kubernetes
type Deployment struct {
	ID                string               `json:"id"`
	Name              string               `json:"name"`
	Namespace         string               `json:"namespace"`
	Image             string               `json:"image"`
	RegistryID        string               `json:"registry_id"`
	Replicas          int32                `json:"replicas"`
	AvailableReplicas int32                `json:"available_replicas"`
	ReadyReplicas     int32                `json:"ready_replicas"`
	NodeSelector      map[string]string    `json:"node_selector,omitempty"`
	Strategy          DeploymentStrategy   `json:"strategy"`
	Status            DeploymentStatus     `json:"status"`
	Pods              []PodInfo            `json:"pods"`
	NodeDistribution  map[string]int       `json:"node_distribution"`
	Resources         ResourceRequirements `json:"resources,omitempty"`
	Environment       map[string]string    `json:"environment,omitempty"`
	// GitOps tracking fields
	Source           string    `json:"source"`            // "internal" or "external"
	Author           string    `json:"author,omitempty"`  // Who created (for external)
	GitCommitSHA     string    `json:"git_commit_sha,omitempty"`
	ManifestPath     string    `json:"manifest_path,omitempty"`
	AppliedBy        string    `json:"applied_by,omitempty"`
	AppliedAt        *time.Time `json:"applied_at,omitempty"`
	ServiceType      string    `json:"service_type,omitempty"` // For infra/service-type label
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
}

// DeploymentStrategy defines how deployments are rolled out
type DeploymentStrategy struct {
	Type           string `json:"type"` // "RollingUpdate" or "Recreate"
	MaxSurge       int32  `json:"max_surge,omitempty"`
	MaxUnavailable int32  `json:"max_unavailable,omitempty"`
	NodeSpread     bool   `json:"node_spread"` // Spread across nodes
	ZoneSpread     bool   `json:"zone_spread"` // Spread across zones
}

// DeploymentStatus represents the current status of a deployment
type DeploymentStatus string

const (
	DeploymentStatusPending      DeploymentStatus = "pending"
	DeploymentStatusCommitted    DeploymentStatus = "committed"     // NEW - committed to git
	DeploymentStatusPendingApply DeploymentStatus = "pending_apply" // NEW - ready to apply
	DeploymentStatusApplying     DeploymentStatus = "applying"      // NEW - currently applying
	DeploymentStatusRunning      DeploymentStatus = "running"
	DeploymentStatusFailed       DeploymentStatus = "failed"
	DeploymentStatusApplyFailed  DeploymentStatus = "apply_failed"  // NEW - apply failed
	DeploymentStatusUpdating     DeploymentStatus = "updating"
	DeploymentStatusTerminating  DeploymentStatus = "terminating"
)

// PodInfo contains information about a pod in the deployment
type PodInfo struct {
	Name      string            `json:"name"`
	Phase     string            `json:"phase"`
	Ready     bool              `json:"ready"`
	Restarts  int32             `json:"restarts"`
	NodeName  string            `json:"node_name"`
	CreatedAt time.Time         `json:"created_at"`
	IP        string            `json:"ip"`
	Labels    map[string]string `json:"labels"`
}

// ResourceRequirements defines resource limits and requests
type ResourceRequirements struct {
	Limits   ResourceList `json:"limits,omitempty"`
	Requests ResourceList `json:"requests,omitempty"`
}

// ResourceList defines CPU and memory resources
type ResourceList struct {
	CPU    string `json:"cpu,omitempty"`
	Memory string `json:"memory,omitempty"`
}

// CreateDeploymentRequest represents a request to create a new deployment
type CreateDeploymentRequest struct {
	Name         string               `json:"name"`
	Namespace    string               `json:"namespace"`
	Image        string               `json:"image"`
	RegistryID   string               `json:"registry_id"`
	Replicas     int32                `json:"replicas"`
	NodeSelector map[string]string    `json:"node_selector,omitempty"`
	Strategy     DeploymentStrategy   `json:"strategy"`
	Resources    ResourceRequirements `json:"resources,omitempty"`
	Environment  map[string]string    `json:"environment,omitempty"`
	ServiceType  string               `json:"service_type,omitempty"` // For infra/service-type label
}

// ScaleDeploymentRequest represents a request to scale a deployment
type ScaleDeploymentRequest struct {
	Replicas int32 `json:"replicas"`
}

// UpdateDeploymentRequest represents a request to update a deployment
type UpdateDeploymentRequest struct {
	Image       string                `json:"image,omitempty"`
	Replicas    *int32                `json:"replicas,omitempty"`
	Resources   *ResourceRequirements `json:"resources,omitempty"`
	Environment map[string]string     `json:"environment,omitempty"`
}

// NodeInfo contains information about a Kubernetes node
type NodeInfo struct {
	Name        string            `json:"name"`
	Ready       bool              `json:"ready"`
	Roles       []string          `json:"roles"`
	Version     string            `json:"version"`
	OS          string            `json:"os"`
	Arch        string            `json:"arch"`
	Zone        string            `json:"zone,omitempty"`
	Region      string            `json:"region,omitempty"`
	Labels      map[string]string `json:"labels"`
	Capacity    ResourceList      `json:"capacity"`
	Allocatable ResourceList      `json:"allocatable"`
	PodCount    int               `json:"pod_count"`
}

// AutoScaler represents horizontal pod autoscaler configuration
type AutoScaler struct {
	ID                  string    `json:"id"`
	DeploymentID        string    `json:"deployment_id"`
	MinReplicas         int32     `json:"min_replicas"`
	MaxReplicas         int32     `json:"max_replicas"`
	TargetCPUPercent    *int32    `json:"target_cpu_percent,omitempty"`
	TargetMemoryPercent *int32    `json:"target_memory_percent,omitempty"`
	Enabled             bool      `json:"enabled"`
	CreatedAt           time.Time `json:"created_at"`
}

// CreateAutoScalerRequest represents a request to create an autoscaler
type CreateAutoScalerRequest struct {
	DeploymentID        string `json:"deployment_id"`
	MinReplicas         int32  `json:"min_replicas"`
	MaxReplicas         int32  `json:"max_replicas"`
	TargetCPUPercent    *int32 `json:"target_cpu_percent,omitempty"`
	TargetMemoryPercent *int32 `json:"target_memory_percent,omitempty"`
}

// DeploymentHistory represents the history of deployment changes
type DeploymentHistory struct {
	ID           string                 `json:"id"`
	DeploymentID string                 `json:"deployment_id"`
	Action       string                 `json:"action"` // create, update, scale, delete
	OldImage     string                 `json:"old_image,omitempty"`
	NewImage     string                 `json:"new_image,omitempty"`
	OldReplicas  int32                  `json:"old_replicas,omitempty"`
	NewReplicas  int32                  `json:"new_replicas,omitempty"`
	Success      bool                   `json:"success"`
	Error        string                 `json:"error,omitempty"`
	User         string                 `json:"user,omitempty"`
	Timestamp    time.Time              `json:"timestamp"`
	Metadata     map[string]interface{} `json:"metadata,omitempty"`
}
