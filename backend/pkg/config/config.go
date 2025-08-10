package config

import (
	"os"
	"time"
)

type Config struct {
	// Server
	Port        string
	Environment string

	// Database (SQLite)
	DatabasePath string

	// Auth
	PasetoKey     string
	TokenDuration time.Duration

	// Kubernetes
	KubeConfig string

	// GitOps
	GitTimeout time.Duration

	// Monitoring
	MetricsInterval time.Duration

	// Logging
	LogLevel string
}

func Load() *Config {
	return &Config{
		Port:            getEnv("PORT", "8080"),
		Environment:     getEnv("ENVIRONMENT", "development"),
		DatabasePath:    getEnv("DATABASE_PATH", "/app/data/denshimon.db"),
		PasetoKey:       getEnv("PASETO_SECRET_KEY", generateDefaultKey()),
		TokenDuration:   getDuration("TOKEN_DURATION", 24*time.Hour),
		KubeConfig:      getEnv("KUBECONFIG", ""),
		GitTimeout:      getDuration("GIT_TIMEOUT", 60*time.Second),
		MetricsInterval: getDuration("METRICS_INTERVAL", 15*time.Second),
		LogLevel:        getEnv("LOG_LEVEL", "info"),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getDuration(key string, defaultValue time.Duration) time.Duration {
	if value := os.Getenv(key); value != "" {
		if d, err := time.ParseDuration(value); err == nil {
			return d
		}
	}
	return defaultValue
}

func generateDefaultKey() string {
	// In production, this should be a secure 32-byte key
	return "dev-32-byte-secret-key-change-me!"
}
