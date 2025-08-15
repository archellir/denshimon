// Package config provides configuration management for GitOps functionality.
// It handles environment variable loading and validation for GitOps operations.
package config

import (
	"os"
	"strconv"
	"time"
)

// GitOpsConfig holds all GitOps-related configuration
type GitOpsConfig struct {
	BaseRepoURL    string        `json:"base_repo_url"`
	LocalPath      string        `json:"local_path"`
	Branch         string        `json:"branch"`
	Username       string        `json:"username"`
	Token          string        `json:"token"`
	AutoSync       bool          `json:"auto_sync"`
	SyncInterval   time.Duration `json:"sync_interval"`
	ManifestPath   string        `json:"manifest_path"`
	CommitMessage  string        `json:"commit_message"`
}

// LoadGitOpsConfig loads GitOps configuration from environment variables
func LoadGitOpsConfig() *GitOpsConfig {
	config := &GitOpsConfig{
		BaseRepoURL:   getEnv("GITOPS_BASE_REPO_URL", ""),
		LocalPath:     getEnv("GITOPS_LOCAL_PATH", "/tmp/base_infrastructure"),
		Branch:        getEnv("GITOPS_BRANCH", "main"),
		Username:      getEnv("GITOPS_USERNAME", ""),
		Token:         getEnv("GITOPS_TOKEN", ""),
		ManifestPath:  getEnv("GITOPS_MANIFEST_PATH", "k8s"),
		CommitMessage: getEnv("GITOPS_COMMIT_MESSAGE", "feat(gitops): sync kubernetes deployment"),
	}

	// Parse AutoSync boolean
	if autoSync := getEnv("GITOPS_AUTO_SYNC", "true"); autoSync != "" {
		if parsed, err := strconv.ParseBool(autoSync); err == nil {
			config.AutoSync = parsed
		} else {
			config.AutoSync = true // default
		}
	}

	// Parse SyncInterval duration
	if interval := getEnv("GITOPS_SYNC_INTERVAL", "300s"); interval != "" {
		if parsed, err := time.ParseDuration(interval); err == nil {
			config.SyncInterval = parsed
		} else {
			config.SyncInterval = 5 * time.Minute // default
		}
	}

	return config
}

// IsValid checks if the GitOps configuration is valid
func (c *GitOpsConfig) IsValid() bool {
	return c.BaseRepoURL != ""
}

// IsEnabled returns true if GitOps is properly configured and enabled
func (c *GitOpsConfig) IsEnabled() bool {
	return c.IsValid() && c.BaseRepoURL != ""
}

// GetAuthConfig returns Git authentication configuration
func (c *GitOpsConfig) GetAuthConfig() map[string]string {
	auth := make(map[string]string)
	
	if c.Username != "" {
		auth["username"] = c.Username
	}
	
	if c.Token != "" {
		auth["token"] = c.Token
	}
	
	return auth
}

// RegistryConfig holds container registry configuration
type RegistryConfig struct {
	Type      string `json:"type"`
	URL       string `json:"url"`
	Username  string `json:"username"`
	Token     string `json:"token"`
	Namespace string `json:"namespace"`
}

// LoadDefaultRegistryConfig loads default registry configuration from environment
func LoadDefaultRegistryConfig() *RegistryConfig {
	return &RegistryConfig{
		Type:      getEnv("DEFAULT_REGISTRY_TYPE", "dockerhub"),
		URL:       getEnv("DEFAULT_REGISTRY_URL", ""),
		Username:  getEnv("DEFAULT_REGISTRY_USERNAME", ""),
		Token:     getEnv("DEFAULT_REGISTRY_TOKEN", ""),
		Namespace: getEnv("DEFAULT_REGISTRY_NAMESPACE", ""),
	}
}

// AppConfig holds general application configuration
type AppConfig struct {
	Port        string `json:"port"`
	Debug       bool   `json:"debug"`
	LogLevel    string `json:"log_level"`
	DatabaseURL string `json:"database_url"`
}

// LoadAppConfig loads general application configuration
func LoadAppConfig() *AppConfig {
	config := &AppConfig{
		Port:        getEnv("PORT", "8080"),
		LogLevel:    getEnv("LOG_LEVEL", "info"),
		DatabaseURL: getEnv("DATABASE_URL", ""),
	}

	// Parse Debug boolean
	if debug := getEnv("DEBUG", "false"); debug != "" {
		if parsed, err := strconv.ParseBool(debug); err == nil {
			config.Debug = parsed
		}
	}

	return config
}

// getEnv gets an environment variable with a fallback value
func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

// ValidateRequiredEnvVars validates that all required environment variables are set
func ValidateRequiredEnvVars() []string {
	var missing []string
	
	required := []string{
		"GITOPS_BASE_REPO_URL",
	}
	
	for _, env := range required {
		if os.Getenv(env) == "" {
			missing = append(missing, env)
		}
	}
	
	return missing
}

// GetGitOpsStatus returns the current GitOps configuration status
func GetGitOpsStatus() map[string]interface{} {
	config := LoadGitOpsConfig()
	
	return map[string]interface{}{
		"enabled":       config.IsEnabled(),
		"valid":         config.IsValid(),
		"base_repo":     config.BaseRepoURL != "",
		"auto_sync":     config.AutoSync,
		"sync_interval": config.SyncInterval.String(),
		"branch":        config.Branch,
		"manifest_path": config.ManifestPath,
	}
}