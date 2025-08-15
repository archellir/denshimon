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

// DockerHubProvider implements the RegistryProvider interface for Docker Hub
type DockerHubProvider struct {
	config    providers.RegistryConfig
	client    *http.Client
	authToken string
}

// NewDockerHubProvider creates a new Docker Hub provider
func NewDockerHubProvider(config providers.RegistryConfig) (providers.RegistryProvider, error) {
	return &DockerHubProvider{
		config: config,
		client: &http.Client{
			Timeout: 30 * time.Second,
		},
	}, nil
}

// Type returns the provider type
func (d *DockerHubProvider) Type() string {
	return "dockerhub"
}

// Connect establishes connection to Docker Hub
func (d *DockerHubProvider) Connect(ctx context.Context, config providers.RegistryConfig) error {
	d.config = config

	// If credentials are provided, get auth token
	if config.Username != "" && config.Password != "" {
		token, err := d.authenticate(ctx)
		if err != nil {
			return fmt.Errorf("authentication failed: %w", err)
		}
		d.authToken = token
	}

	return nil
}

// authenticate gets an auth token from Docker Hub
func (d *DockerHubProvider) authenticate(ctx context.Context) (string, error) {
	authURL := "https://hub.docker.com/v2/users/login/"
	payload := map[string]string{
		"username": d.config.Username,
		"password": d.config.Password,
	}

	data, err := json.Marshal(payload)
	if err != nil {
		return "", err
	}

	req, err := http.NewRequestWithContext(ctx, "POST", authURL, strings.NewReader(string(data)))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := d.client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("authentication failed with status: %d", resp.StatusCode)
	}

	var result struct {
		Token string `json:"token"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", err
	}

	return result.Token, nil
}

// ListImages returns images from Docker Hub
func (d *DockerHubProvider) ListImages(ctx context.Context, namespace string) ([]providers.ContainerImage, error) {
	if namespace == "" {
		namespace = d.config.Namespace
	}
	if namespace == "" {
		namespace = "library" // Docker Hub official images
	}

	url := fmt.Sprintf("https://hub.docker.com/v2/namespaces/%s/repositories", namespace)

	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return nil, err
	}

	if d.authToken != "" {
		req.Header.Set("Authorization", "Bearer "+d.authToken)
	}

	resp, err := d.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var result struct {
		Results []struct {
			Name        string    `json:"name"`
			Description string    `json:"description"`
			PullCount   int       `json:"pull_count"`
			LastUpdated time.Time `json:"last_updated"`
		} `json:"results"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	images := make([]providers.ContainerImage, 0, len(result.Results))
	for _, repo := range result.Results {
		// Get tags for each repository
		tags, err := d.GetImageTags(ctx, fmt.Sprintf("%s/%s", namespace, repo.Name))
		if err != nil {
			continue // Skip if we can't get tags
		}

		for _, tag := range tags {
			images = append(images, providers.ContainerImage{
				Registry:   "docker.io",
				Repository: fmt.Sprintf("%s/%s", namespace, repo.Name),
				Tag:        tag,
				Created:    repo.LastUpdated,
				FullName:   fmt.Sprintf("docker.io/%s/%s:%s", namespace, repo.Name, tag),
			})
		}
	}

	return images, nil
}

// GetImage returns details about a specific image
func (d *DockerHubProvider) GetImage(ctx context.Context, reference string) (*providers.ContainerImage, error) {
	// Parse reference (e.g., "nginx:latest" or "myuser/myapp:v1.0")
	parts := strings.Split(reference, ":")
	if len(parts) != 2 {
		return nil, fmt.Errorf("invalid image reference: %s", reference)
	}

	repository := parts[0]
	tag := parts[1]

	// Add library prefix for official images
	if !strings.Contains(repository, "/") {
		repository = "library/" + repository
	}

	url := fmt.Sprintf("https://hub.docker.com/v2/repositories/%s/tags/%s", repository, tag)

	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return nil, err
	}

	if d.authToken != "" {
		req.Header.Set("Authorization", "Bearer "+d.authToken)
	}

	resp, err := d.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("image not found: %s", reference)
	}

	var tagInfo struct {
		Name        string    `json:"name"`
		FullSize    int64     `json:"full_size"`
		LastUpdated time.Time `json:"last_updated"`
		Digest      string    `json:"digest"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&tagInfo); err != nil {
		return nil, err
	}

	return &providers.ContainerImage{
		Registry:   "docker.io",
		Repository: repository,
		Tag:        tag,
		Digest:     tagInfo.Digest,
		Size:       tagInfo.FullSize,
		Created:    tagInfo.LastUpdated,
		Platform:   "linux/amd64",
		FullName:   fmt.Sprintf("docker.io/%s:%s", repository, tag),
	}, nil
}

// GetImageTags returns available tags for an image
func (d *DockerHubProvider) GetImageTags(ctx context.Context, repository string) ([]string, error) {
	// Add library prefix for official images
	if !strings.Contains(repository, "/") {
		repository = "library/" + repository
	}

	url := fmt.Sprintf("https://hub.docker.com/v2/repositories/%s/tags", repository)

	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return nil, err
	}

	if d.authToken != "" {
		req.Header.Set("Authorization", "Bearer "+d.authToken)
	}

	resp, err := d.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var result struct {
		Results []struct {
			Name string `json:"name"`
		} `json:"results"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	tags := make([]string, len(result.Results))
	for i, tag := range result.Results {
		tags[i] = tag.Name
	}

	return tags, nil
}

// GetAuthConfig returns authentication configuration for Kubernetes
func (d *DockerHubProvider) GetAuthConfig() (*providers.AuthConfig, error) {
	if d.config.Username == "" || d.config.Password == "" {
		return nil, nil // No auth needed for public images
	}

	auth := base64.StdEncoding.EncodeToString([]byte(d.config.Username + ":" + d.config.Password))

	return &providers.AuthConfig{
		Username:      d.config.Username,
		Password:      d.config.Password,
		Auth:          auth,
		ServerAddress: "https://index.docker.io/v1/",
	}, nil
}

// TestConnection verifies the Docker Hub connection
func (d *DockerHubProvider) TestConnection(ctx context.Context) error {
	// Try to list images in a small namespace
	_, err := d.ListImages(ctx, "library")
	return err
}
