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

// GenericProvider implements the RegistryProvider interface for OCI-compliant registries
// Supports GitLab, Harbor, Quay.io, and other OCI registries
type GenericProvider struct {
	config providers.RegistryConfig
	client *http.Client
}

// NewGenericProvider creates a new generic OCI registry provider
func NewGenericProvider(config providers.RegistryConfig) (providers.RegistryProvider, error) {
	return &GenericProvider{
		config: config,
		client: &http.Client{
			Timeout: 30 * time.Second,
		},
	}, nil
}

// Type returns the provider type
func (g *GenericProvider) Type() string {
	return "generic"
}

// Connect establishes connection to the registry
func (g *GenericProvider) Connect(ctx context.Context, config providers.RegistryConfig) error {
	g.config = config
	return g.TestConnection(ctx)
}

// ListImages returns images using OCI Distribution API
func (g *GenericProvider) ListImages(ctx context.Context, namespace string) ([]providers.ContainerImage, error) {
	if namespace == "" {
		namespace = g.config.Namespace
	}
	
	// List repositories using OCI Distribution API
	url := fmt.Sprintf("%s/v2/_catalog", g.config.URL)
	
	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return nil, err
	}
	
	g.addAuth(req)
	
	resp, err := g.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("failed to list repositories: status %d", resp.StatusCode)
	}
	
	var catalog struct {
		Repositories []string `json:"repositories"`
	}
	
	if err := json.NewDecoder(resp.Body).Decode(&catalog); err != nil {
		return nil, err
	}
	
	images := []providers.ContainerImage{}
	
	// For each repository, get tags
	for _, repo := range catalog.Repositories {
		// Filter by namespace if specified
		if namespace != "" && !strings.HasPrefix(repo, namespace+"/") {
			continue
		}
		
		tags, err := g.GetImageTags(ctx, repo)
		if err != nil {
			continue // Skip repositories we can't access
		}
		
		registryHost := g.getRegistryHost()
		
		for _, tag := range tags {
			// Get manifest for more details
			manifest, err := g.getManifest(ctx, repo, tag)
			if err != nil {
				// Create basic image info without manifest details
				images = append(images, providers.ContainerImage{
					Registry:   registryHost,
					Repository: repo,
					Tag:        tag,
					Platform:   "linux/amd64",
					FullName:   fmt.Sprintf("%s/%s:%s", registryHost, repo, tag),
				})
				continue
			}
			
			images = append(images, providers.ContainerImage{
				Registry:   registryHost,
				Repository: repo,
				Tag:        tag,
				Digest:     manifest.Digest,
				Size:       manifest.Size,
				Created:    manifest.Created,
				Platform:   manifest.Platform,
				FullName:   fmt.Sprintf("%s/%s:%s", registryHost, repo, tag),
			})
		}
	}
	
	return images, nil
}

// GetImage returns details about a specific image
func (g *GenericProvider) GetImage(ctx context.Context, reference string) (*providers.ContainerImage, error) {
	// Parse reference (e.g., "namespace/app:v1.0")
	parts := strings.Split(reference, ":")
	if len(parts) != 2 {
		return nil, fmt.Errorf("invalid image reference: %s", reference)
	}
	
	repository := parts[0]
	tag := parts[1]
	
	manifest, err := g.getManifest(ctx, repository, tag)
	if err != nil {
		return nil, err
	}
	
	registryHost := g.getRegistryHost()
	
	return &providers.ContainerImage{
		Registry:   registryHost,
		Repository: repository,
		Tag:        tag,
		Digest:     manifest.Digest,
		Size:       manifest.Size,
		Created:    manifest.Created,
		Platform:   manifest.Platform,
		FullName:   fmt.Sprintf("%s/%s:%s", registryHost, repository, tag),
	}, nil
}

// GetImageTags returns available tags for an image
func (g *GenericProvider) GetImageTags(ctx context.Context, repository string) ([]string, error) {
	url := fmt.Sprintf("%s/v2/%s/tags/list", g.config.URL, repository)
	
	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return nil, err
	}
	
	g.addAuth(req)
	
	resp, err := g.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("failed to list tags: status %d", resp.StatusCode)
	}
	
	var result struct {
		Tags []string `json:"tags"`
	}
	
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}
	
	return result.Tags, nil
}

// GetAuthConfig returns authentication configuration for Kubernetes
func (g *GenericProvider) GetAuthConfig() (*providers.AuthConfig, error) {
	registryHost := g.getRegistryHost()
	
	if g.config.Username != "" && g.config.Password != "" {
		auth := base64.StdEncoding.EncodeToString([]byte(g.config.Username + ":" + g.config.Password))
		return &providers.AuthConfig{
			Username:      g.config.Username,
			Password:      g.config.Password,
			Auth:          auth,
			ServerAddress: registryHost,
		}, nil
	}
	
	if g.config.Token != "" {
		// Use Bearer token authentication
		auth := base64.StdEncoding.EncodeToString([]byte("_token:" + g.config.Token))
		return &providers.AuthConfig{
			Username:      "_token",
			Password:      g.config.Token,
			Auth:          auth,
			ServerAddress: registryHost,
		}, nil
	}
	
	return nil, nil
}

// TestConnection verifies the registry connection
func (g *GenericProvider) TestConnection(ctx context.Context) error {
	url := fmt.Sprintf("%s/v2/", g.config.URL)
	
	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return err
	}
	
	g.addAuth(req)
	
	resp, err := g.client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	
	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusUnauthorized {
		return fmt.Errorf("connection test failed: status %d", resp.StatusCode)
	}
	
	return nil
}

// Helper methods

func (g *GenericProvider) addAuth(req *http.Request) {
	if g.config.Token != "" {
		req.Header.Set("Authorization", "Bearer "+g.config.Token)
	} else if g.config.Username != "" && g.config.Password != "" {
		auth := base64.StdEncoding.EncodeToString([]byte(g.config.Username + ":" + g.config.Password))
		req.Header.Set("Authorization", "Basic "+auth)
	}
}

func (g *GenericProvider) getRegistryHost() string {
	host := g.config.URL
	host = strings.TrimPrefix(host, "https://")
	host = strings.TrimPrefix(host, "http://")
	host = strings.TrimSuffix(host, "/")
	return host
}

type manifestInfo struct {
	Digest   string
	Size     int64
	Created  time.Time
	Platform string
}

func (g *GenericProvider) getManifest(ctx context.Context, repository, tag string) (*manifestInfo, error) {
	url := fmt.Sprintf("%s/v2/%s/manifests/%s", g.config.URL, repository, tag)
	
	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return nil, err
	}
	
	req.Header.Set("Accept", "application/vnd.docker.distribution.manifest.v2+json")
	g.addAuth(req)
	
	resp, err := g.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("failed to get manifest: status %d", resp.StatusCode)
	}
	
	var manifest struct {
		Config struct {
			Size   int64  `json:"size"`
			Digest string `json:"digest"`
		} `json:"config"`
		Layers []struct {
			Size int64 `json:"size"`
		} `json:"layers"`
	}
	
	if err := json.NewDecoder(resp.Body).Decode(&manifest); err != nil {
		return nil, err
	}
	
	var totalSize int64
	for _, layer := range manifest.Layers {
		totalSize += layer.Size
	}
	
	return &manifestInfo{
		Digest:   resp.Header.Get("Docker-Content-Digest"),
		Size:     totalSize,
		Created:  time.Now(), // OCI spec doesn't guarantee creation time
		Platform: "linux/amd64",
	}, nil
}