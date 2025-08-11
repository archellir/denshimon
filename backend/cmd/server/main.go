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

	"github.com/archellir/denshimon/internal/api"
	"github.com/archellir/denshimon/internal/auth"
	"github.com/archellir/denshimon/internal/database"
	"github.com/archellir/denshimon/internal/gitea"
	"github.com/archellir/denshimon/internal/k8s"
	"github.com/archellir/denshimon/internal/metrics"
	"github.com/archellir/denshimon/internal/websocket"
	"github.com/archellir/denshimon/pkg/config"
)

//go:embed all:spa
var frontendAssets embed.FS

func main() {
	// Initialize structured JSON logger for production
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

	// Initialize Gitea handler
	giteaHandler := gitea.NewHandler()

	// Initialize WebSocket hub
	wsHub := websocket.NewHub()
	go wsHub.Run() // Start the hub in a goroutine

	// Initialize metrics service and WebSocket publisher
	metricsService := metrics.NewService(k8sClient)
	publisher := websocket.NewPublisher(wsHub, k8sClient, metricsService)
	go publisher.Start() // Start real-time data publisher

	// Setup HTTP router using standard library
	mux := http.NewServeMux()

	// API routes
	api.RegisterRoutes(mux, authService, k8sClient, db, wsHub)
	
	// Gitea API routes
	if giteaHandler != nil {
		registerGiteaRoutes(mux, giteaHandler, authService)
	}

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

	// Stop WebSocket components
	publisher.Stop()
	wsHub.Shutdown()

	if err := srv.Shutdown(ctx); err != nil {
		slog.Error("Server forced to shutdown", "error", err)
	}

	slog.Info("Server exited")
}

// registerGiteaRoutes registers Gitea API endpoints with authentication
func registerGiteaRoutes(mux *http.ServeMux, giteaHandler *gitea.Handler, authService *auth.Service) {
	// Wrap Gitea handlers with authentication middleware
	authMiddleware := func(handler http.HandlerFunc) http.HandlerFunc {
		return authService.AuthMiddleware(handler)
	}
	
	// Repository endpoints
	mux.HandleFunc("GET /api/gitea/repositories", authMiddleware(giteaHandler.HandleListRepositories))
	mux.HandleFunc("GET /api/gitea/repositories/{owner}/{repo}", authMiddleware(giteaHandler.HandleGetRepository))
	mux.HandleFunc("GET /api/gitea/repositories/{owner}/{repo}/commits", authMiddleware(giteaHandler.HandleListCommits))
	mux.HandleFunc("GET /api/gitea/repositories/{owner}/{repo}/branches", authMiddleware(giteaHandler.HandleListBranches))
	mux.HandleFunc("GET /api/gitea/repositories/{owner}/{repo}/pulls", authMiddleware(giteaHandler.HandleListPullRequests))
	mux.HandleFunc("GET /api/gitea/repositories/{owner}/{repo}/releases", authMiddleware(giteaHandler.HandleListReleases))
	mux.HandleFunc("GET /api/gitea/repositories/{owner}/{repo}/actions/runs", authMiddleware(giteaHandler.HandleListWorkflowRuns))
	
	// Deployment endpoint
	mux.HandleFunc("POST /api/gitea/repositories/{owner}/{repo}/deploy", authMiddleware(giteaHandler.HandleTriggerDeployment))
	
	// Webhook endpoint (no auth required as it comes from Gitea)
	mux.HandleFunc("POST /api/gitea/webhook", giteaHandler.HandleWebhook)
	
	slog.Info("Gitea API routes registered")
}