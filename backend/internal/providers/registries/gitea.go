package registries

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/archellir/denshimon/internal/providers"
)

// GiteaProvider implements the RegistryProvider interface for Gitea packages
type GiteaProvider struct {
	config providers.RegistryConfig
	client *http.Client
}

// NewGiteaProvider creates a new Gitea provider
func NewGiteaProvider(config providers.RegistryConfig) (providers.RegistryProvider, error) {
	return &GiteaProvider{
		config: config,
		client: &http.Client{
			Timeout: 30 * time.Second,
		},
	}, nil
}

// Type returns the provider type
func (g *GiteaProvider) Type() string {
	return "gitea"
}

// Connect establishes connection to Gitea
func (g *GiteaProvider) Connect(ctx context.Context, config providers.RegistryConfig) error {
	g.config = config
	return g.TestConnection(ctx)
}

// ListImages returns container images from Gitea packages
func (g *GiteaProvider) ListImages(ctx context.Context, namespace string) ([]providers.ContainerImage, error) {
	if namespace == "" {
		namespace = g.config.Namespace
	}

	// Gitea API endpoint for packages
	url := fmt.Sprintf("%s/api/v1/packages/%s?type=container", g.config.URL, namespace)

	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return nil, err
	}

	// Add authentication if token is provided
	if g.config.Token != "" {
		req.Header.Set("Authorization", "token "+g.config.Token)
	}

	resp, err := g.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("failed to list packages: status %d", resp.StatusCode)
	}

	var packages []struct {
		ID         int64     `json:"id"`
		Owner      string    `json:"owner"`
		Type       string    `json:"type"`
		Name       string    `json:"name"`
		Version    string    `json:"version"`
		CreatedAt  time.Time `json:"created_at"`
		Size       int64     `json:"size"`
		Repository string    `json:"repository"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&packages); err != nil {
		return nil, err
	}

	images := make([]providers.ContainerImage, 0, len(packages))
	for _, pkg := range packages {
		if pkg.Type != "container" {
			continue
		}

		registryURL := strings.TrimPrefix(g.config.URL, "https://")
		registryURL = strings.TrimPrefix(registryURL, "http://")

		images = append(images, providers.ContainerImage{
			Registry:   registryURL,
			Repository: fmt.Sprintf("%s/%s", namespace, pkg.Name),
			Tag:        pkg.Version,
			Size:       pkg.Size,
			Created:    pkg.CreatedAt,
			Platform:   "linux/amd64",
			FullName:   fmt.Sprintf("%s/%s/%s:%s", registryURL, namespace, pkg.Name, pkg.Version),
		})
	}

	return images, nil
}

// GetImage returns details about a specific image
func (g *GiteaProvider) GetImage(ctx context.Context, reference string) (*providers.ContainerImage, error) {
	// Parse reference (e.g., "org/app:v1.0")
	parts := strings.Split(reference, ":")
	if len(parts) != 2 {
		return nil, fmt.Errorf("invalid image reference: %s", reference)
	}

	repoParts := strings.Split(parts[0], "/")
	if len(repoParts) != 2 {
		return nil, fmt.Errorf("invalid repository format: %s", parts[0])
	}

	namespace := repoParts[0]
	name := repoParts[1]
	version := parts[1]

	// Gitea API endpoint for specific package
	url := fmt.Sprintf("%s/api/v1/packages/%s/container/%s/%s",
		g.config.URL, namespace, name, version)

	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return nil, err
	}

	if g.config.Token != "" {
		req.Header.Set("Authorization", "token "+g.config.Token)
	}

	resp, err := g.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("image not found: %s", reference)
	}

	var pkg struct {
		ID        int64     `json:"id"`
		Name      string    `json:"name"`
		Version   string    `json:"version"`
		Size      int64     `json:"size"`
		CreatedAt time.Time `json:"created_at"`
		Metadata  struct {
			Digest   string `json:"digest"`
			Platform string `json:"platform"`
		} `json:"metadata"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&pkg); err != nil {
		return nil, err
	}

	registryURL := strings.TrimPrefix(g.config.URL, "https://")
	registryURL = strings.TrimPrefix(registryURL, "http://")

	return &providers.ContainerImage{
		Registry:   registryURL,
		Repository: fmt.Sprintf("%s/%s", namespace, name),
		Tag:        version,
		Digest:     pkg.Metadata.Digest,
		Size:       pkg.Size,
		Created:    pkg.CreatedAt,
		Platform:   pkg.Metadata.Platform,
		FullName:   fmt.Sprintf("%s/%s/%s:%s", registryURL, namespace, name, version),
	}, nil
}

// GetImageTags returns available tags for an image
func (g *GiteaProvider) GetImageTags(ctx context.Context, repository string) ([]string, error) {
	parts := strings.Split(repository, "/")
	if len(parts) != 2 {
		return nil, fmt.Errorf("invalid repository format: %s", repository)
	}

	namespace := parts[0]
	name := parts[1]

	// List all versions of the package
	url := fmt.Sprintf("%s/api/v1/packages/%s/container/%s",
		g.config.URL, namespace, name)

	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return nil, err
	}

	if g.config.Token != "" {
		req.Header.Set("Authorization", "token "+g.config.Token)
	}

	resp, err := g.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var versions []struct {
		Version string `json:"version"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&versions); err != nil {
		return nil, err
	}

	tags := make([]string, len(versions))
	for i, v := range versions {
		tags[i] = v.Version
	}

	return tags, nil
}

// GetAuthConfig returns authentication configuration for Kubernetes
func (g *GiteaProvider) GetAuthConfig() (*providers.AuthConfig, error) {
	registryURL := strings.TrimPrefix(g.config.URL, "https://")
	registryURL = strings.TrimPrefix(registryURL, "http://")

	if g.config.Username != "" && g.config.Password != "" {
		auth := base64.StdEncoding.EncodeToString([]byte(g.config.Username + ":" + g.config.Password))
		return &providers.AuthConfig{
			Username:      g.config.Username,
			Password:      g.config.Password,
			Auth:          auth,
			ServerAddress: registryURL,
		}, nil
	}

	if g.config.Token != "" {
		// Use token as password with username as token
		auth := base64.StdEncoding.EncodeToString([]byte("token:" + g.config.Token))
		return &providers.AuthConfig{
			Username:      "token",
			Password:      g.config.Token,
			Auth:          auth,
			ServerAddress: registryURL,
		}, nil
	}

	return nil, nil
}

// TestConnection verifies the Gitea connection
func (g *GiteaProvider) TestConnection(ctx context.Context) error {
	url := fmt.Sprintf("%s/api/v1/version", g.config.URL)

	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return err
	}

	resp, err := g.client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("connection test failed: status %d", resp.StatusCode)
	}

	return nil
}
