// Package http provides HTTP handlers, middleware, and route registration for the Denshimon API.
// It consolidates all HTTP-related functionality including REST endpoints for Kubernetes management,
// database connections, certificate monitoring, and backup operations.
package http

import (
	"net/http"
	"os"
	"strings"

	"github.com/archellir/denshimon/internal/auth"
	"github.com/archellir/denshimon/internal/database"
	"github.com/archellir/denshimon/internal/deployments"
	"github.com/archellir/denshimon/internal/k8s"
	"github.com/archellir/denshimon/internal/metrics"
	"github.com/archellir/denshimon/internal/providers"
	"github.com/archellir/denshimon/internal/providers/backup"
	"github.com/archellir/denshimon/internal/providers/certificates"
	"github.com/archellir/denshimon/internal/providers/databases"
	"github.com/archellir/denshimon/internal/websocket"
	"github.com/archellir/denshimon/pkg/logger"
	"log/slog"
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

	// Initialize database management
	databaseManager := databases.NewManager(db.DB)
	databaseHandlers := NewDatabasesHandler(databaseManager)

	// Initialize certificate management
	certificateManager := certificates.NewManager()
	certificateHandlers := NewCertificateHandlers(certificateManager)

	// Initialize backup management
	backupManager := backup.NewManager(db.DB)
	backupHandlers := NewBackupHandlers(backupManager)

	// Initialize GitOps management
	gitopsLogger := logger.New(slog.LevelInfo)
	baseInfraRepoURL := os.Getenv("GITOPS_BASE_REPO_URL")
	if baseInfraRepoURL == "" {
		baseInfraRepoURL = "https://github.com/user/base_infrastructure.git" // default value
	}
	localRepoPath := os.Getenv("GITOPS_LOCAL_PATH")
	if localRepoPath == "" {
		localRepoPath = "/tmp/base_infrastructure" // default value
	}
	gitopsHandlers := NewGitOpsHandler(db.DB, baseInfraRepoURL, localRepoPath, gitopsLogger)

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
	infrastructureHandlers := NewInfrastructureHandlers()

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
	mux.HandleFunc("GET /api/metrics/storage", corsMiddleware(authService.AuthMiddleware(metricsHandlers.GetStorageMetrics)))
	mux.HandleFunc("GET /api/metrics/health", corsMiddleware(metricsHandlers.GetHealthMetrics)) // No auth required for health check

	// Observability endpoints (require authentication)
	mux.HandleFunc("GET /api/log_data", corsMiddleware(authService.AuthMiddleware(observabilityHandlers.GetLogs)))
	mux.HandleFunc("GET /api/live_streams", corsMiddleware(authService.AuthMiddleware(observabilityHandlers.GetLogStreams)))
	mux.HandleFunc("GET /api/log_data/analytics", corsMiddleware(authService.AuthMiddleware(observabilityHandlers.GetLogAnalytics)))
	mux.HandleFunc("GET /api/system_changes", corsMiddleware(authService.AuthMiddleware(observabilityHandlers.GetEvents)))

	// Infrastructure endpoints (require authentication)
	mux.HandleFunc("GET /api/infrastructure/services", corsMiddleware(authService.AuthMiddleware(infrastructureHandlers.GetServices)))
	mux.HandleFunc("GET /api/infrastructure/status", corsMiddleware(authService.AuthMiddleware(infrastructureHandlers.GetStatus)))
	mux.HandleFunc("GET /api/infrastructure/alerts", corsMiddleware(authService.AuthMiddleware(infrastructureHandlers.GetAlerts)))
	mux.HandleFunc("POST /api/infrastructure/refresh", corsMiddleware(authService.AuthMiddleware(infrastructureHandlers.RefreshServices)))

	// Infrastructure alert operations
	mux.Handle("/api/infrastructure/alerts/", corsMiddleware(authService.AuthMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if strings.HasSuffix(r.URL.Path, "/acknowledge") && r.Method == "POST" {
			infrastructureHandlers.AcknowledgeAlert(w, r)
		} else {
			http.NotFound(w, r)
		}
	}))))

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

	// Database management endpoints (require authentication)
	mux.HandleFunc("GET /api/databases/connections", corsMiddleware(authService.AuthMiddleware(databaseHandlers.ListConnections)))
	mux.HandleFunc("POST /api/databases/connections", corsMiddleware(authService.AuthMiddleware(databaseHandlers.CreateConnection)))
	mux.HandleFunc("GET /api/databases/connections/{id}", corsMiddleware(authService.AuthMiddleware(databaseHandlers.GetConnection)))
	mux.HandleFunc("PUT /api/databases/connections/{id}", corsMiddleware(authService.AuthMiddleware(databaseHandlers.UpdateConnection)))
	mux.HandleFunc("DELETE /api/databases/connections/{id}", corsMiddleware(authService.AuthMiddleware(databaseHandlers.DeleteConnection)))
	mux.HandleFunc("POST /api/databases/connections/{id}/connect", corsMiddleware(authService.AuthMiddleware(databaseHandlers.ConnectDatabase)))
	mux.HandleFunc("POST /api/databases/connections/{id}/disconnect", corsMiddleware(authService.AuthMiddleware(databaseHandlers.DisconnectDatabase)))
	mux.HandleFunc("POST /api/databases/connections/test", corsMiddleware(authService.AuthMiddleware(databaseHandlers.TestConnection)))
	mux.HandleFunc("GET /api/databases/connections/{id}/databases", corsMiddleware(authService.AuthMiddleware(databaseHandlers.GetDatabases)))
	mux.HandleFunc("GET /api/databases/connections/{id}/databases/{database}/tables", corsMiddleware(authService.AuthMiddleware(databaseHandlers.GetTables)))
	mux.HandleFunc("GET /api/databases/connections/{id}/databases/{database}/tables/{table}/columns", corsMiddleware(authService.AuthMiddleware(databaseHandlers.GetColumns)))
	mux.HandleFunc("POST /api/databases/connections/{id}/query", corsMiddleware(authService.AuthMiddleware(databaseHandlers.ExecuteQuery)))
	mux.HandleFunc("POST /api/databases/connections/{id}/tables/{table}/data", corsMiddleware(authService.AuthMiddleware(databaseHandlers.GetTableData)))
	mux.HandleFunc("PUT /api/databases/connections/{id}/tables/{table}/rows", corsMiddleware(authService.AuthMiddleware(databaseHandlers.UpdateRow)))
	mux.HandleFunc("DELETE /api/databases/connections/{id}/tables/{table}/rows", corsMiddleware(authService.AuthMiddleware(databaseHandlers.DeleteRow)))
	mux.HandleFunc("POST /api/databases/connections/{id}/tables/{table}/rows", corsMiddleware(authService.AuthMiddleware(databaseHandlers.InsertRow)))
	mux.HandleFunc("GET /api/databases/connections/{id}/stats", corsMiddleware(authService.AuthMiddleware(databaseHandlers.GetStats)))
	mux.HandleFunc("GET /api/databases/types", corsMiddleware(authService.AuthMiddleware(databaseHandlers.GetSupportedTypes)))

	// Certificate management endpoints (require authentication)
	mux.HandleFunc("GET /api/certificates", corsMiddleware(authService.AuthMiddleware(certificateHandlers.GetCertificates)))
	mux.HandleFunc("GET /api/certificates/stats", corsMiddleware(authService.AuthMiddleware(certificateHandlers.GetCertificateStats)))
	mux.HandleFunc("GET /api/certificates/alerts", corsMiddleware(authService.AuthMiddleware(certificateHandlers.GetAlerts)))
	mux.HandleFunc("POST /api/certificates/alerts/acknowledge", corsMiddleware(authService.AuthMiddleware(certificateHandlers.AcknowledgeAlert)))
	mux.HandleFunc("GET /api/certificates/check", corsMiddleware(authService.AuthMiddleware(certificateHandlers.CheckCertificate)))
	mux.HandleFunc("POST /api/certificates/refresh", corsMiddleware(authService.AuthMiddleware(certificateHandlers.RefreshCertificates)))
	mux.HandleFunc("GET /api/certificates/domains", corsMiddleware(authService.AuthMiddleware(certificateHandlers.GetDomainConfigs)))
	mux.HandleFunc("POST /api/certificates/domains", corsMiddleware(authService.AuthMiddleware(certificateHandlers.AddDomainConfig)))
	mux.HandleFunc("DELETE /api/certificates/domains", corsMiddleware(authService.AuthMiddleware(certificateHandlers.RemoveDomainConfig)))

	// Backup & Recovery management endpoints (require authentication)
	mux.HandleFunc("GET /api/backup/jobs", corsMiddleware(authService.AuthMiddleware(backupHandlers.ListJobs)))
	mux.HandleFunc("POST /api/backup/jobs", corsMiddleware(authService.AuthMiddleware(backupHandlers.CreateJob)))
	mux.HandleFunc("GET /api/backup/history", corsMiddleware(authService.AuthMiddleware(backupHandlers.GetHistory)))
	mux.HandleFunc("GET /api/backup/storage", corsMiddleware(authService.AuthMiddleware(backupHandlers.GetStorage)))
	mux.HandleFunc("GET /api/backup/statistics", corsMiddleware(authService.AuthMiddleware(backupHandlers.GetStatistics)))
	mux.HandleFunc("GET /api/backup/recoveries/active", corsMiddleware(authService.AuthMiddleware(backupHandlers.GetActiveRecoveries)))
	mux.HandleFunc("GET /api/backup/alerts", corsMiddleware(authService.AuthMiddleware(backupHandlers.GetAlerts)))

	// Backup job operations
	mux.Handle("/api/backup/jobs/", corsMiddleware(authService.AuthMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		path := r.URL.Path
		switch {
		case strings.HasSuffix(path, "/run") && r.Method == "POST":
			backupHandlers.RunJob(w, r)
		case strings.HasSuffix(path, "/cancel") && r.Method == "POST":
			backupHandlers.CancelJob(w, r)
		case strings.HasSuffix(path, "/schedule") && r.Method == "PUT":
			backupHandlers.UpdateSchedule(w, r)
		case r.Method == "GET":
			backupHandlers.GetJob(w, r)
		case r.Method == "PUT":
			backupHandlers.UpdateJob(w, r)
		case r.Method == "DELETE":
			backupHandlers.DeleteJob(w, r)
		default:
			http.NotFound(w, r)
		}
	}))))

	// Backup history operations
	mux.Handle("/api/backup/history/", corsMiddleware(authService.AuthMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		path := r.URL.Path
		switch {
		case strings.HasSuffix(path, "/verify") && r.Method == "POST":
			backupHandlers.VerifyBackup(w, r)
		case strings.HasSuffix(path, "/recover") && r.Method == "POST":
			backupHandlers.StartRecovery(w, r)
		case r.Method == "DELETE":
			backupHandlers.DeleteBackup(w, r)
		default:
			http.NotFound(w, r)
		}
	}))))

	// GitOps endpoints (require authentication)
	mux.HandleFunc("GET /api/gitops/repositories", corsMiddleware(authService.AuthMiddleware(gitopsHandlers.ListRepositories)))
	mux.HandleFunc("POST /api/gitops/repositories", corsMiddleware(authService.AuthMiddleware(gitopsHandlers.CreateRepository)))
	mux.HandleFunc("POST /api/gitops/repositories/init", corsMiddleware(authService.AuthMiddleware(gitopsHandlers.InitializeRepository)))
	mux.HandleFunc("GET /api/gitops/applications", corsMiddleware(authService.AuthMiddleware(gitopsHandlers.ListApplications)))
	mux.HandleFunc("POST /api/gitops/applications", corsMiddleware(authService.AuthMiddleware(gitopsHandlers.CreateApplication)))
	mux.HandleFunc("POST /api/gitops/manifests/generate", corsMiddleware(authService.AuthMiddleware(gitopsHandlers.GenerateManifest)))
	mux.HandleFunc("POST /api/gitops/manifests/validate", corsMiddleware(authService.AuthMiddleware(gitopsHandlers.ValidateManifest)))
	mux.HandleFunc("GET /api/gitops/manifests/types", corsMiddleware(authService.AuthMiddleware(gitopsHandlers.GetSupportedTypes)))
	mux.HandleFunc("GET /api/gitops/sync/status", corsMiddleware(authService.AuthMiddleware(gitopsHandlers.GetSyncStatus)))
	mux.HandleFunc("POST /api/gitops/sync/start", corsMiddleware(authService.AuthMiddleware(gitopsHandlers.StartSync)))
	mux.HandleFunc("POST /api/gitops/sync/force", corsMiddleware(authService.AuthMiddleware(gitopsHandlers.ForceSync)))
	mux.HandleFunc("POST /api/gitops/webhook", corsMiddleware(gitopsHandlers.ProcessWebhook)) // No auth required for webhooks
	mux.HandleFunc("GET /api/gitops/webhook/config", corsMiddleware(authService.AuthMiddleware(gitopsHandlers.ConfigureWebhook)))

	// GitOps operations with path parameters
	mux.Handle("/api/gitops/repositories/", corsMiddleware(authService.AuthMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if strings.HasSuffix(r.URL.Path, "/sync") && r.Method == "POST" {
			gitopsHandlers.SyncRepository(w, r)
		} else {
			http.NotFound(w, r)
		}
	}))))

	mux.Handle("/api/gitops/applications/", corsMiddleware(authService.AuthMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		path := r.URL.Path
		switch {
		case strings.HasSuffix(path, "/deploy") && r.Method == "POST":
			gitopsHandlers.DeployApplication(w, r)
		case strings.HasSuffix(path, "/rollback") && r.Method == "POST":
			gitopsHandlers.RollbackApplication(w, r)
		case strings.HasSuffix(path, "/rollback-targets") && r.Method == "GET":
			gitopsHandlers.GetRollbackTargets(w, r)
		case strings.HasSuffix(path, "/history") && r.Method == "GET":
			gitopsHandlers.GetDeploymentHistory(w, r)
		case r.Method == "GET":
			gitopsHandlers.GetApplication(w, r)
		default:
			http.NotFound(w, r)
		}
	}))))

	mux.Handle("/api/gitops/sync/application/", corsMiddleware(authService.AuthMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "POST" {
			gitopsHandlers.SyncApplication(w, r)
		} else {
			http.NotFound(w, r)
		}
	}))))


	// WebSocket endpoint for real-time updates
	wsHandler := websocket.NewHandler(wsHub)
	mux.HandleFunc("GET /ws", wsHandler.HandleWebSocket)
}
