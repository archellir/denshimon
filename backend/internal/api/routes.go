package api

import (
	"net/http"

	"github.com/archellir/denshimon/internal/auth"
	"github.com/archellir/denshimon/internal/database"
	"github.com/archellir/denshimon/internal/gitops"
	"github.com/archellir/denshimon/internal/k8s"
	"github.com/archellir/denshimon/internal/metrics"
	"github.com/archellir/denshimon/internal/websocket"
)

func RegisterRoutes(
	mux *http.ServeMux,
	authService *auth.Service,
	k8sClient *k8s.Client,
	db *database.SQLiteDB,
	wsHub *websocket.Hub,
) {
	// Initialize services
	gitopsService := gitops.NewService(db.DB)
	metricsService := metrics.NewService(k8sClient)
	server := NewServer(gitopsService)
	// CORS middleware for development
	corsMiddleware := func(next http.HandlerFunc) http.HandlerFunc {
		return func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Access-Control-Allow-Origin", "*")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
			
			if r.Method == "OPTIONS" {
				w.WriteHeader(http.StatusOK)
				return
			}
			
			next(w, r)
		}
	}

	// Initialize handlers
	authHandlers := NewAuthHandlers(authService, db)
	k8sHandlers := NewKubernetesHandlers(k8sClient)
	metricsHandlers := NewMetricsHandlers(metricsService)

	// Auth endpoints (no auth required)
	mux.HandleFunc("POST /api/auth/login", corsMiddleware(authHandlers.Login))
	mux.HandleFunc("POST /api/auth/logout", corsMiddleware(authHandlers.Logout))
	
	// Protected auth endpoints
	mux.HandleFunc("POST /api/auth/refresh", corsMiddleware(authService.AuthMiddleware(authHandlers.Refresh)))
	mux.HandleFunc("GET /api/auth/me", corsMiddleware(authService.AuthMiddleware(authHandlers.Me)))

	// Protected routes (require auth)
	
	// Kubernetes endpoints (require authentication)
	mux.HandleFunc("GET /api/k8s/pods", corsMiddleware(authService.AuthMiddleware(k8sHandlers.ListPods)))
	mux.HandleFunc("GET /api/k8s/pods/{name}", corsMiddleware(authService.AuthMiddleware(k8sHandlers.GetPod)))
	mux.HandleFunc("POST /api/k8s/pods/{name}/restart", corsMiddleware(authService.AuthMiddleware(k8sHandlers.RestartPod)))
	mux.HandleFunc("DELETE /api/k8s/pods/{name}", corsMiddleware(authService.AuthMiddleware(k8sHandlers.DeletePod)))
	mux.HandleFunc("GET /api/k8s/pods/{name}/logs", corsMiddleware(authService.AuthMiddleware(k8sHandlers.GetPodLogs)))
	
	mux.HandleFunc("GET /api/k8s/deployments", corsMiddleware(authService.AuthMiddleware(k8sHandlers.ListDeployments)))
	mux.HandleFunc("PATCH /api/k8s/deployments/{name}/scale", corsMiddleware(authService.AuthMiddleware(k8sHandlers.ScaleDeployment)))
	
	mux.HandleFunc("GET /api/k8s/nodes", corsMiddleware(authService.AuthMiddleware(k8sHandlers.ListNodes)))
	mux.HandleFunc("GET /api/k8s/health", corsMiddleware(k8sHandlers.HealthCheck)) // No auth required for health check

	// Pod debugging endpoints
	mux.HandleFunc("GET /api/k8s/pods/exec", k8sHandlers.HandlePodExec) // WebSocket - no CORS middleware needed
	mux.HandleFunc("GET /api/k8s/pods/logs/stream", corsMiddleware(authService.AuthMiddleware(k8sHandlers.HandlePodLogs)))
	mux.HandleFunc("POST /api/k8s/pods/portforward", corsMiddleware(authService.AuthMiddleware(k8sHandlers.HandlePodPortForward)))
	mux.HandleFunc("POST /api/k8s/pods/files/upload", corsMiddleware(authService.AuthMiddleware(k8sHandlers.HandleFileUpload)))
	mux.HandleFunc("GET /api/k8s/pods/files/download", corsMiddleware(authService.AuthMiddleware(k8sHandlers.HandleFileDownload)))

	mux.HandleFunc("GET /api/k8s/events", corsMiddleware(func(w http.ResponseWriter, r *http.Request) {
		// TODO: Implement events stream handler
		w.WriteHeader(http.StatusNotImplemented)
	}))

	// GitOps endpoints (require authentication)
	// Repository endpoints
	mux.HandleFunc("GET /api/gitops/repositories", corsMiddleware(authService.AuthMiddleware(server.handleListRepositories)))
	mux.HandleFunc("POST /api/gitops/repositories", corsMiddleware(authService.AuthMiddleware(server.handleCreateRepository)))
	mux.HandleFunc("GET /api/gitops/repositories/", corsMiddleware(authService.AuthMiddleware(server.handleGetRepository)))
	mux.HandleFunc("POST /api/gitops/repositories/", corsMiddleware(authService.AuthMiddleware(server.handleSyncRepository)))
	mux.HandleFunc("DELETE /api/gitops/repositories/", corsMiddleware(authService.AuthMiddleware(server.handleDeleteRepository)))
	
	// Application endpoints
	mux.HandleFunc("GET /api/gitops/applications", corsMiddleware(authService.AuthMiddleware(server.handleListApplications)))
	mux.HandleFunc("POST /api/gitops/applications", corsMiddleware(authService.AuthMiddleware(server.handleCreateApplication)))
	mux.HandleFunc("GET /api/gitops/applications/", corsMiddleware(authService.AuthMiddleware(server.handleGetApplication)))
	mux.HandleFunc("POST /api/gitops/applications/", corsMiddleware(authService.AuthMiddleware(server.handleSyncApplication)))
	mux.HandleFunc("DELETE /api/gitops/applications/", corsMiddleware(authService.AuthMiddleware(server.handleDeleteApplication)))

	// Metrics endpoints (require authentication)
	mux.HandleFunc("GET /api/metrics/cluster", corsMiddleware(authService.AuthMiddleware(metricsHandlers.GetClusterMetrics)))
	mux.HandleFunc("GET /api/metrics/nodes", corsMiddleware(authService.AuthMiddleware(metricsHandlers.GetNodesMetrics)))
	mux.HandleFunc("GET /api/metrics/pods", corsMiddleware(authService.AuthMiddleware(metricsHandlers.GetPodsMetrics)))
	mux.HandleFunc("GET /api/metrics/history", corsMiddleware(authService.AuthMiddleware(metricsHandlers.GetMetricsHistory)))
	mux.HandleFunc("GET /api/metrics/namespaces", corsMiddleware(authService.AuthMiddleware(metricsHandlers.GetNamespacesMetrics)))
	mux.HandleFunc("GET /api/metrics/resources", corsMiddleware(authService.AuthMiddleware(metricsHandlers.GetResourceMetrics)))
	mux.HandleFunc("GET /api/metrics/health", corsMiddleware(metricsHandlers.GetHealthMetrics)) // No auth required for health check

	// Logs endpoints
	mux.HandleFunc("GET /api/logs/search", corsMiddleware(func(w http.ResponseWriter, r *http.Request) {
		// TODO: Implement log search handler
		w.WriteHeader(http.StatusNotImplemented)
	}))

	mux.HandleFunc("GET /api/logs/stream", corsMiddleware(func(w http.ResponseWriter, r *http.Request) {
		// TODO: Implement log stream handler
		w.WriteHeader(http.StatusNotImplemented)
	}))

	// WebSocket endpoint for real-time updates
	wsHandler := websocket.NewHandler(wsHub)
	mux.HandleFunc("GET /ws", wsHandler.HandleWebSocket)
}