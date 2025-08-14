package api

import (
	"net/http"
	"strings"

	"github.com/archellir/denshimon/internal/auth"
	"github.com/archellir/denshimon/internal/database"
	"github.com/archellir/denshimon/internal/deployments"
	"github.com/archellir/denshimon/internal/k8s"
	"github.com/archellir/denshimon/internal/metrics"
	"github.com/archellir/denshimon/internal/providers"
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
	metricsService := metrics.NewService(k8sClient)
	
	// Initialize provider registry and deployment service
	providerRegistry := InitializeProviders()
	registryManager := providers.NewRegistryManager(providerRegistry)
	deploymentService := deployments.NewService(k8sClient, registryManager, db.DB)
	deploymentHandlers := NewDeploymentHandlers(deploymentService, registryManager, providerRegistry)
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
	servicesHandlers := NewServicesHandlers(k8sClient)
	observabilityHandlers := NewObservabilityHandlers(k8sClient)

	// Auth endpoints (no auth required)
	mux.HandleFunc("POST /api/auth/login", corsMiddleware(authHandlers.Login))
	mux.HandleFunc("POST /api/auth/logout", corsMiddleware(authHandlers.Logout))
	
	// Protected auth endpoints
	mux.HandleFunc("POST /api/auth/refresh", corsMiddleware(authService.AuthMiddleware(authHandlers.Refresh)))
	mux.HandleFunc("GET /api/auth/me", corsMiddleware(authService.AuthMiddleware(authHandlers.Me)))

	// User management endpoints (admin only)
	mux.HandleFunc("POST /api/auth/users", corsMiddleware(authService.RequireRole("admin")(authHandlers.CreateUser)))
	mux.HandleFunc("GET /api/auth/users", corsMiddleware(authService.RequireRole("admin")(authHandlers.ListUsers)))
	mux.HandleFunc("PUT /api/auth/users/{id}", corsMiddleware(authService.RequireRole("admin")(authHandlers.UpdateUser)))
	mux.HandleFunc("DELETE /api/auth/users/{id}", corsMiddleware(authService.RequireRole("admin")(authHandlers.DeleteUser)))

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
	mux.HandleFunc("GET /api/k8s/services", corsMiddleware(authService.AuthMiddleware(k8sHandlers.ListServices)))
	mux.HandleFunc("GET /api/k8s/events", corsMiddleware(authService.AuthMiddleware(k8sHandlers.ListEvents)))
	mux.HandleFunc("GET /api/k8s/namespaces", corsMiddleware(authService.AuthMiddleware(k8sHandlers.ListNamespaces)))
	mux.HandleFunc("GET /api/k8s/storage", corsMiddleware(authService.AuthMiddleware(k8sHandlers.GetStorageInfo)))
	mux.HandleFunc("GET /api/k8s/health", corsMiddleware(k8sHandlers.HealthCheck)) // No auth required for health check

	// Service Mesh endpoints (require authentication)
	mux.HandleFunc("GET /api/services/mesh", corsMiddleware(authService.AuthMiddleware(servicesHandlers.GetServiceMesh)))
	mux.HandleFunc("GET /api/services/topology", corsMiddleware(authService.AuthMiddleware(servicesHandlers.GetServiceTopology)))
	mux.HandleFunc("GET /api/services/endpoints", corsMiddleware(authService.AuthMiddleware(servicesHandlers.GetServiceEndpoints)))
	mux.HandleFunc("GET /api/services/flows", corsMiddleware(authService.AuthMiddleware(servicesHandlers.GetServiceFlows)))
	mux.HandleFunc("GET /api/services/gateway", corsMiddleware(authService.AuthMiddleware(servicesHandlers.GetServiceGateway)))

	// Pod debugging endpoints
	mux.HandleFunc("GET /api/k8s/pods/exec", k8sHandlers.HandlePodExec) // WebSocket - no CORS middleware needed
	mux.HandleFunc("GET /api/k8s/pods/logs/stream", corsMiddleware(authService.AuthMiddleware(k8sHandlers.HandlePodLogs)))
	mux.HandleFunc("POST /api/k8s/pods/portforward", corsMiddleware(authService.AuthMiddleware(k8sHandlers.HandlePodPortForward)))
	mux.HandleFunc("POST /api/k8s/pods/files/upload", corsMiddleware(authService.AuthMiddleware(k8sHandlers.HandleFileUpload)))
	mux.HandleFunc("GET /api/k8s/pods/files/download", corsMiddleware(authService.AuthMiddleware(k8sHandlers.HandleFileDownload)))

	// Events stream endpoint removed - using existing events handler

	// Metrics endpoints (require authentication)
	mux.HandleFunc("GET /api/metrics/cluster", corsMiddleware(authService.AuthMiddleware(metricsHandlers.GetClusterMetrics)))
	mux.HandleFunc("GET /api/metrics/nodes", corsMiddleware(authService.AuthMiddleware(metricsHandlers.GetNodesMetrics)))
	mux.HandleFunc("GET /api/metrics/pods", corsMiddleware(authService.AuthMiddleware(metricsHandlers.GetPodsMetrics)))
	mux.HandleFunc("GET /api/metrics/history", corsMiddleware(authService.AuthMiddleware(metricsHandlers.GetMetricsHistory)))
	mux.HandleFunc("GET /api/metrics/namespaces", corsMiddleware(authService.AuthMiddleware(metricsHandlers.GetNamespacesMetrics)))
	mux.HandleFunc("GET /api/metrics/resources", corsMiddleware(authService.AuthMiddleware(metricsHandlers.GetResourceMetrics)))
	mux.HandleFunc("GET /api/metrics/network", corsMiddleware(authService.AuthMiddleware(metricsHandlers.GetNetworkMetrics)))
	mux.HandleFunc("GET /api/metrics/health", corsMiddleware(metricsHandlers.GetHealthMetrics)) // No auth required for health check

	// Observability endpoints (require authentication)
	mux.HandleFunc("GET /api/logs", corsMiddleware(authService.AuthMiddleware(observabilityHandlers.GetLogs)))
	mux.HandleFunc("GET /api/logs/streams", corsMiddleware(authService.AuthMiddleware(observabilityHandlers.GetLogStreams)))
	mux.HandleFunc("GET /api/logs/analytics", corsMiddleware(authService.AuthMiddleware(observabilityHandlers.GetLogAnalytics)))
	mux.HandleFunc("GET /api/events", corsMiddleware(authService.AuthMiddleware(observabilityHandlers.GetEvents)))

	// Deployment endpoints (require authentication)
	// Registry management
	mux.HandleFunc("GET /api/deployments/registries", corsMiddleware(authService.AuthMiddleware(deploymentHandlers.ListRegistries)))
	mux.HandleFunc("POST /api/deployments/registries", corsMiddleware(authService.AuthMiddleware(deploymentHandlers.AddRegistry)))
	
	// Registry operations (using pattern matching)
	mux.Handle("/api/deployments/registries/", corsMiddleware(authService.AuthMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case strings.HasSuffix(r.URL.Path, "/test") && r.Method == "POST":
			deploymentHandlers.TestRegistry(w, r)
		case r.Method == "DELETE":
			deploymentHandlers.DeleteRegistry(w, r)
		default:
			http.NotFound(w, r)
		}
	}))))

	// Image management
	mux.HandleFunc("GET /api/deployments/images", corsMiddleware(authService.AuthMiddleware(deploymentHandlers.ListImages)))
	mux.HandleFunc("GET /api/deployments/images/search", corsMiddleware(authService.AuthMiddleware(deploymentHandlers.SearchImages)))
	
	// Image operations
	mux.Handle("/api/deployments/images/", corsMiddleware(authService.AuthMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if strings.HasSuffix(r.URL.Path, "/tags") && r.Method == "GET" {
			deploymentHandlers.GetImageTags(w, r)
		} else {
			http.NotFound(w, r)
		}
	}))))

	// Deployment management
	mux.HandleFunc("GET /api/deployments", corsMiddleware(authService.AuthMiddleware(deploymentHandlers.ListDeployments)))
	mux.HandleFunc("POST /api/deployments", corsMiddleware(authService.AuthMiddleware(deploymentHandlers.CreateDeployment)))
	mux.HandleFunc("GET /api/deployments/nodes", corsMiddleware(authService.AuthMiddleware(deploymentHandlers.GetAvailableNodes)))
	
	// Deployment operations
	mux.Handle("/api/deployments/", corsMiddleware(authService.AuthMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		path := r.URL.Path
		switch {
		case strings.HasSuffix(path, "/scale") && r.Method == "PATCH":
			deploymentHandlers.ScaleDeployment(w, r)
		case strings.HasSuffix(path, "/restart") && r.Method == "POST":
			deploymentHandlers.RestartDeployment(w, r)
		case strings.HasSuffix(path, "/pods") && r.Method == "GET":
			deploymentHandlers.GetDeploymentPods(w, r)
		case strings.HasSuffix(path, "/history") && r.Method == "GET":
			deploymentHandlers.GetDeploymentHistory(w, r)
		case r.Method == "GET":
			deploymentHandlers.GetDeployment(w, r)
		case r.Method == "PUT":
			deploymentHandlers.UpdateDeployment(w, r)
		case r.Method == "DELETE":
			deploymentHandlers.DeleteDeployment(w, r)
		default:
			http.NotFound(w, r)
		}
	}))))

	// WebSocket endpoint for real-time updates
	wsHandler := websocket.NewHandler(wsHub)
	mux.HandleFunc("GET /ws", wsHandler.HandleWebSocket)
}