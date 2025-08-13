package providers

import (
	"context"
	"time"
)

// RegistryProvider defines the interface for container registry providers
type RegistryProvider interface {
	// Type returns the provider type (dockerhub, gitea, gitlab, etc.)
	Type() string
	
	// Connect establishes connection to the registry
	Connect(ctx context.Context, config RegistryConfig) error
	
	// ListImages returns available images
	ListImages(ctx context.Context, namespace string) ([]ContainerImage, error)
	
	// GetImage returns details about a specific image
	GetImage(ctx context.Context, reference string) (*ContainerImage, error)
	
	// GetImageTags returns available tags for an image
	GetImageTags(ctx context.Context, repository string) ([]string, error)
	
	// GetAuthConfig returns authentication configuration for Kubernetes
	GetAuthConfig() (*AuthConfig, error)
	
	// TestConnection verifies the registry connection
	TestConnection(ctx context.Context) error
}

// RegistryConfig holds configuration for a registry
type RegistryConfig struct {
	URL       string            `json:"url"`
	Namespace string            `json:"namespace,omitempty"`
	Username  string            `json:"username,omitempty"`
	Password  string            `json:"password,omitempty"`
	Token     string            `json:"token,omitempty"`
	Insecure  bool              `json:"insecure,omitempty"`
	Extra     map[string]string `json:"extra,omitempty"`
}

// ContainerImage represents a container image
type ContainerImage struct {
	Registry   string    `json:"registry"`
	Repository string    `json:"repository"`
	Tag        string    `json:"tag"`
	Digest     string    `json:"digest"`
	Size       int64     `json:"size"`
	Created    time.Time `json:"created"`
	Platform   string    `json:"platform"`
	FullName   string    `json:"full_name"` // Full image reference
}

// AuthConfig holds authentication details for pulling images
type AuthConfig struct {
	Username string `json:"username,omitempty"`
	Password string `json:"password,omitempty"`
	Auth     string `json:"auth,omitempty"`     // Base64 encoded username:password
	Email    string `json:"email,omitempty"`
	ServerAddress string `json:"serveraddress,omitempty"`
}

// Registry represents a configured registry in the system
type Registry struct {
	ID          string          `json:"id"`
	Name        string          `json:"name"`
	Type        string          `json:"type"` // dockerhub, gitea, gitlab, generic
	Config      RegistryConfig  `json:"config"`
	LastSync    *time.Time      `json:"last_sync,omitempty"`
	Status      string          `json:"status"`
	Error       string          `json:"error,omitempty"`
	CreatedAt   time.Time       `json:"created_at"`
	UpdatedAt   time.Time       `json:"updated_at"`
}