package providers

import (
	"context"
	"fmt"
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
	Username      string `json:"username,omitempty"`
	Password      string `json:"password,omitempty"`
	Auth          string `json:"auth,omitempty"` // Base64 encoded username:password
	Email         string `json:"email,omitempty"`
	ServerAddress string `json:"serveraddress,omitempty"`
}

// Registry represents a configured registry in the system
type Registry struct {
	ID        string         `json:"id"`
	Name      string         `json:"name"`
	Type      string         `json:"type"` // dockerhub, gitea, gitlab, generic
	Config    RegistryConfig `json:"config"`
	LastSync  *time.Time     `json:"last_sync,omitempty"`
	Status    string         `json:"status"`
	Error     string         `json:"error,omitempty"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
}

// RegistryManager manages container registry providers
type RegistryManager struct {
	providers map[string]RegistryProvider
}

// NewRegistryManager creates a new registry manager with the given providers
func NewRegistryManager(providerRegistry *ProviderRegistry) *RegistryManager {
	return &RegistryManager{
		providers: providerRegistry.registries,
	}
}

// ProviderRegistry holds factory functions for creating registry providers
type ProviderRegistry struct {
	registries map[string]RegistryProvider
	factories  map[string]func(RegistryConfig) (RegistryProvider, error)
}

// NewProviderRegistry creates a new provider registry
func NewProviderRegistry() *ProviderRegistry {
	return &ProviderRegistry{
		registries: make(map[string]RegistryProvider),
		factories:  make(map[string]func(RegistryConfig) (RegistryProvider, error)),
	}
}

// Register registers a provider factory function
func (pr *ProviderRegistry) Register(providerType string, factory func(RegistryConfig) (RegistryProvider, error)) {
	pr.factories[providerType] = factory
}

// GetProvider returns a registry provider by ID
func (rm *RegistryManager) GetProvider(registryID string) (RegistryProvider, error) {
	provider, exists := rm.providers[registryID]
	if !exists {
		return nil, fmt.Errorf("registry provider not found: %s", registryID)
	}
	return provider, nil
}

// AddRegistry adds a new registry provider
func (rm *RegistryManager) AddRegistry(ctx context.Context, registry Registry) error {
	// This would typically save to database and create the provider
	// For now, just return nil (success)
	return nil
}

// RemoveRegistry removes a registry provider
func (rm *RegistryManager) RemoveRegistry(ctx context.Context, registryID string) error {
	delete(rm.providers, registryID)
	return nil
}

// ListRegistries returns all configured registry IDs
func (rm *RegistryManager) ListRegistries() []string {
	ids := make([]string, 0, len(rm.providers))
	for id := range rm.providers {
		ids = append(ids, id)
	}
	return ids
}
