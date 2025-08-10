package main

import (
	"context"
	"embed"
	"fmt"
	"io"
	"io/fs"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/archellir/k8s-webui/internal/api"
	"github.com/archellir/k8s-webui/internal/auth"
	"github.com/archellir/k8s-webui/internal/database"
	"github.com/archellir/k8s-webui/internal/k8s"
	"github.com/archellir/k8s-webui/pkg/config"
)

//go:embed all:spa
var frontendAssets embed.FS

func main() {
	// Initialize structured logger
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	}))
	slog.SetDefault(logger)

	// Load configuration
	cfg := config.Load()

	// Initialize SQLite database
	db, err := database.NewSQLiteDB(cfg.DatabasePath)
	if err != nil {
		slog.Error("Failed to initialize SQLite database", "error", err)
		os.Exit(1)
	}
	defer db.Close()
	
	// Start cleanup worker for expired sessions and cache
	db.StartCleanupWorker()

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
	authService := auth.NewService(cfg.PasetoKey, db)

	// Setup HTTP router using standard library
	mux := http.NewServeMux()

	// API routes
	api.RegisterRoutes(mux, authService, k8sClient, db)

	// Health check endpoint
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status":"healthy"}`))
	})

	// Serve embedded SPA assets
	frontendFS, err := fs.Sub(frontendAssets, "spa")
	if err != nil {
		slog.Error("Failed to create frontend filesystem", "error", err)
		os.Exit(1)
	}
	
	// SPA handler that serves static files or index.html fallback
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		// Don't serve frontend for API routes
		if strings.HasPrefix(r.URL.Path, "/api/") || strings.HasPrefix(r.URL.Path, "/health") {
			http.NotFound(w, r)
			return
		}
		
		path := strings.TrimPrefix(r.URL.Path, "/")
		if path == "" {
			path = "index.html"
		}
		
		// Try to serve the static file
		file, err := frontendFS.Open(path)
		if err != nil {
			// File not found - serve index.html for SPA routing
			// This allows React Router to handle client-side routes
			file, err = frontendFS.Open("index.html")
			if err != nil {
				http.Error(w, "Frontend not found", http.StatusNotFound)
				return
			}
			path = "index.html"
		}
		defer file.Close()
		
		// Set appropriate content type
		if strings.HasSuffix(path, ".css") {
			w.Header().Set("Content-Type", "text/css; charset=utf-8")
		} else if strings.HasSuffix(path, ".js") {
			w.Header().Set("Content-Type", "application/javascript; charset=utf-8")
		} else if strings.HasSuffix(path, ".html") {
			w.Header().Set("Content-Type", "text/html; charset=utf-8")
		} else if strings.HasSuffix(path, ".svg") {
			w.Header().Set("Content-Type", "image/svg+xml")
		}
		
		// Cache static assets (not index.html)
		if path != "index.html" {
			w.Header().Set("Cache-Control", "public, max-age=31536000") // 1 year
		} else {
			w.Header().Set("Cache-Control", "no-cache") // Don't cache SPA entry point
		}
		
		// Copy file content to response
		if stat, err := file.Stat(); err == nil {
			w.Header().Set("Content-Length", fmt.Sprintf("%d", stat.Size()))
		}
		io.Copy(w, file)
	})

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