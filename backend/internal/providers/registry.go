package providers

import (
	"context"
	"fmt"
	"sync"
)

// ProviderFactory creates a new registry provider instance
type ProviderFactory func(config RegistryConfig) (RegistryProvider, error)

// ProviderRegistry manages registry providers
type ProviderRegistry struct {
	mu        sync.RWMutex
	providers map[string]ProviderFactory
}

// NewProviderRegistry creates a new provider registry
func NewProviderRegistry() *ProviderRegistry {
	return &ProviderRegistry{
		providers: make(map[string]ProviderFactory),
	}
}

// Register adds a new provider factory
func (r *ProviderRegistry) Register(providerType string, factory ProviderFactory) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.providers[providerType] = factory
}

// CreateProvider creates a new provider instance
func (r *ProviderRegistry) CreateProvider(providerType string, config RegistryConfig) (RegistryProvider, error) {
	r.mu.RLock()
	factory, exists := r.providers[providerType]
	r.mu.RUnlock()
	
	if !exists {
		return nil, fmt.Errorf("unknown provider type: %s", providerType)
	}
	
	return factory(config)
}

// ListProviderTypes returns available provider types
func (r *ProviderRegistry) ListProviderTypes() []string {
	r.mu.RLock()
	defer r.mu.RUnlock()
	
	types := make([]string, 0, len(r.providers))
	for t := range r.providers {
		types = append(types, t)
	}
	return types
}

// RegistryManager manages multiple registry connections
type RegistryManager struct {
	registry  *ProviderRegistry
	mu        sync.RWMutex
	providers map[string]RegistryProvider // registry ID -> provider instance
}

// NewRegistryManager creates a new registry manager
func NewRegistryManager(registry *ProviderRegistry) *RegistryManager {
	return &RegistryManager{
		registry:  registry,
		providers: make(map[string]RegistryProvider),
	}
}

// AddRegistry adds a new registry connection
func (m *RegistryManager) AddRegistry(ctx context.Context, reg Registry) error {
	provider, err := m.registry.CreateProvider(reg.Type, reg.Config)
	if err != nil {
		return fmt.Errorf("failed to create provider: %w", err)
	}
	
	if err := provider.Connect(ctx, reg.Config); err != nil {
		return fmt.Errorf("failed to connect to registry: %w", err)
	}
	
	m.mu.Lock()
	m.providers[reg.ID] = provider
	m.mu.Unlock()
	
	return nil
}

// GetProvider returns a registry provider by ID
func (m *RegistryManager) GetProvider(registryID string) (RegistryProvider, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	
	provider, exists := m.providers[registryID]
	if !exists {
		return nil, fmt.Errorf("registry not found: %s", registryID)
	}
	
	return provider, nil
}

// RemoveRegistry removes a registry connection
func (m *RegistryManager) RemoveRegistry(registryID string) {
	m.mu.Lock()
	defer m.mu.Unlock()
	delete(m.providers, registryID)
}

// ListRegistries returns all configured registry IDs
func (m *RegistryManager) ListRegistries() []string {
	m.mu.RLock()
	defer m.mu.RUnlock()
	
	ids := make([]string, 0, len(m.providers))
	for id := range m.providers {
		ids = append(ids, id)
	}
	return ids
}