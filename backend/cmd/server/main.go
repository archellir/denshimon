package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/archellir/k8s-webui/internal/api"
	"github.com/archellir/k8s-webui/internal/auth"
	"github.com/archellir/k8s-webui/internal/database"
	"github.com/archellir/k8s-webui/internal/k8s"
	"github.com/archellir/k8s-webui/pkg/config"
)

func main() {
	// Initialize structured logger
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	}))
	slog.SetDefault(logger)

	// Load configuration
	cfg := config.Load()

	// Initialize database connections
	db, err := database.NewPostgresDB(cfg.DatabaseURL)
	if err != nil {
		slog.Error("Failed to connect to PostgreSQL", "error", err)
		os.Exit(1)
	}
	defer db.Close()

	redis, err := database.NewRedisClient(cfg.RedisURL)
	if err != nil {
		slog.Error("Failed to connect to Redis", "error", err)
		os.Exit(1)
	}
	defer redis.Close()

	// Initialize Kubernetes client (optional in development)
	k8sClient, err := k8s.NewClient(cfg.KubeConfig)
	if err != nil {
		if cfg.Environment == "production" {
			slog.Error("Failed to initialize Kubernetes client", "error", err)
			os.Exit(1)
		}
		slog.Warn("Kubernetes client not available - some features will be disabled", "error", err)
		k8sClient = nil
	}

	// Initialize PASETO auth
	authService := auth.NewService(cfg.PasetoKey, redis)

	// Setup HTTP router using standard library
	mux := http.NewServeMux()

	// API routes
	api.RegisterRoutes(mux, authService, k8sClient, db, redis)

	// Health check endpoint
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status":"healthy"}`))
	})

	// Serve static files (frontend)
	if cfg.Environment == "production" {
		fs := http.FileServer(http.Dir("./static"))
		mux.Handle("/", fs)
	}

	// Create HTTP server
	srv := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      mux,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Start server in goroutine
	go func() {
		slog.Info("Starting server", "port", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			slog.Error("Server failed to start", "error", err)
			os.Exit(1)
		}
	}()

	// Wait for interrupt signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	slog.Info("Shutting down server...")

	// Graceful shutdown with timeout
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		slog.Error("Server forced to shutdown", "error", err)
	}

	slog.Info("Server exited")
}