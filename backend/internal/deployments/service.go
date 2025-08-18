package deployments

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/archellir/denshimon/internal/gitops"
	"github.com/archellir/denshimon/internal/k8s"
	"github.com/archellir/denshimon/internal/providers"
	"github.com/google/uuid"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// Service manages deployments and integrates with Kubernetes and registries
type Service struct {
	k8sClient       *k8s.Client
	registryManager *providers.RegistryManager
	db              *sql.DB
	deployer        *KubernetesDeployer
	scaler          *KubernetesScaler
	gitopsService   *gitops.Service
	syncEngine      *gitops.SyncEngine
}

// NewService creates a new deployment service
func NewService(k8sClient *k8s.Client, registryManager *providers.RegistryManager, db *sql.DB) *Service {
	deployer := NewKubernetesDeployer(k8sClient, registryManager)
	scaler := NewKubernetesScaler(k8sClient)

	// Initialize GitOps integration
	gitopsService := gitops.NewService(db, "", "") // URLs will be configured via environment
	syncEngine := gitops.NewSyncEngine(gitopsService)

	service := &Service{
		k8sClient:       k8sClient,
		registryManager: registryManager,
		db:              db,
		deployer:        deployer,
		scaler:          scaler,
		gitopsService:   gitopsService,
		syncEngine:      syncEngine,
	}

	// Initialize database tables
	service.initDB()

	return service
}

// initDB creates necessary database tables
func (s *Service) initDB() error {
	queries := []string{
		`CREATE TABLE IF NOT EXISTS deployments (
			id TEXT PRIMARY KEY,
			name TEXT NOT NULL,
			namespace TEXT NOT NULL,
			image TEXT NOT NULL,
			registry_id TEXT NOT NULL,
			replicas INTEGER DEFAULT 1,
			node_selector TEXT,
			strategy TEXT,
			resources TEXT,
			environment TEXT,
			status TEXT DEFAULT 'pending',
			source TEXT DEFAULT 'internal',
			author TEXT,
			git_commit_sha TEXT,
			manifest_path TEXT,
			applied_by TEXT,
			applied_at TIMESTAMP,
			service_type TEXT,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE TABLE IF NOT EXISTS deployment_history (
			id TEXT PRIMARY KEY,
			deployment_id TEXT NOT NULL,
			action TEXT NOT NULL,
			old_image TEXT,
			new_image TEXT,
			old_replicas INTEGER,
			new_replicas INTEGER,
			success BOOLEAN DEFAULT FALSE,
			error TEXT,
			user TEXT,
			timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			metadata TEXT,
			FOREIGN KEY (deployment_id) REFERENCES deployments(id)
		)`,
		`CREATE TABLE IF NOT EXISTS autoscalers (
			id TEXT PRIMARY KEY,
			deployment_id TEXT NOT NULL,
			min_replicas INTEGER NOT NULL,
			max_replicas INTEGER NOT NULL,
			target_cpu_percent INTEGER,
			target_memory_percent INTEGER,
			enabled BOOLEAN DEFAULT TRUE,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (deployment_id) REFERENCES deployments(id)
		)`,
		`CREATE TABLE IF NOT EXISTS deployment_resources (
			id TEXT PRIMARY KEY,
			deployment_id TEXT NOT NULL,
			resource_type TEXT NOT NULL,
			resource_name TEXT NOT NULL,
			namespace TEXT NOT NULL,
			k8s_uid TEXT,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (deployment_id) REFERENCES deployments(id)
		)`,
	}

	for _, query := range queries {
		if _, err := s.db.Exec(query); err != nil {
			return fmt.Errorf("failed to create table: %w", err)
		}
	}

	return nil
}

// CreateDeployment creates a new deployment record and commits to git (manual apply workflow)
func (s *Service) CreateDeployment(ctx context.Context, req CreateDeploymentRequest) (*Deployment, error) {
	// Generate deployment ID in the infra/deployment-id format
	deploymentID := fmt.Sprintf("dep-%s", uuid.New().String()[:8])
	
	deployment := &Deployment{
		ID:           deploymentID,
		Name:         req.Name,
		Namespace:    req.Namespace,
		Image:        req.Image,
		RegistryID:   req.RegistryID,
		Replicas:     req.Replicas,
		NodeSelector: req.NodeSelector,
		Strategy:     req.Strategy,
		Status:       DeploymentStatusPending,
		Resources:    req.Resources,
		Environment:  req.Environment,
		Source:       "internal", // Created through Denshimon UI
		ServiceType:  req.ServiceType,  // Will be added to CreateDeploymentRequest
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	// Generate and commit manifest to git (but don't deploy to K8s yet)
	err := s.commitToGitOps(ctx, deployment)
	if err != nil {
		deployment.Status = DeploymentStatusFailed
		s.recordHistory(deployment.ID, "create", "", deployment.Image, 0, deployment.Replicas, false, err.Error(), "")
		return nil, fmt.Errorf("failed to commit to git: %w", err)
	}

	// Update status to committed
	deployment.Status = DeploymentStatusPendingApply

	// Store in database
	if err := s.storeDeployment(deployment); err != nil {
		return nil, fmt.Errorf("failed to store deployment: %w", err)
	}

	// Record successful creation (committed to git, not deployed yet)
	s.recordHistory(deployment.ID, "create", "", deployment.Image, 0, deployment.Replicas, true, "Committed to git", "")

	return deployment, nil
}

// GetDeployment retrieves a deployment by ID
func (s *Service) GetDeployment(ctx context.Context, id string) (*Deployment, error) {
	deployment, err := s.getDeploymentFromDB(id)
	if err != nil {
		return nil, err
	}

	// Update with live status from Kubernetes
	clientset := s.k8sClient.Clientset()
	k8sDeployment, err := clientset.AppsV1().Deployments(deployment.Namespace).Get(ctx, deployment.Name, metav1.GetOptions{})
	if err == nil {
		s.updateDeploymentStatus(deployment, k8sDeployment)
	}

	return deployment, nil
}

// ListDeployments returns all deployments
func (s *Service) ListDeployments(ctx context.Context, namespace string) ([]Deployment, error) {
	deployments, err := s.listDeploymentsFromDB(namespace)
	if err != nil {
		return nil, err
	}

	// Update each deployment with live status
	clientset := s.k8sClient.Clientset()
	for i := range deployments {
		k8sDeployment, err := clientset.AppsV1().Deployments(deployments[i].Namespace).Get(ctx, deployments[i].Name, metav1.GetOptions{})
		if err == nil {
			s.updateDeploymentStatus(&deployments[i], k8sDeployment)
		}
	}

	return deployments, nil
}

// ScaleDeployment changes the number of replicas
func (s *Service) ScaleDeployment(ctx context.Context, id string, replicas int32) error {
	deployment, err := s.GetDeployment(ctx, id)
	if err != nil {
		return err
	}

	oldReplicas := deployment.Replicas

	// Scale in Kubernetes
	if err := s.scaler.Scale(ctx, deployment.Namespace, deployment.Name, replicas); err != nil {
		s.recordHistory(id, "scale", "", "", oldReplicas, replicas, false, err.Error(), "")
		return fmt.Errorf("failed to scale deployment: %w", err)
	}

	// Update database
	deployment.Replicas = replicas
	deployment.Status = DeploymentStatusUpdating
	deployment.UpdatedAt = time.Now()

	if err := s.updateDeploymentInDB(deployment); err != nil {
		return fmt.Errorf("failed to update deployment in database: %w", err)
	}

	// Record successful scale
	s.recordHistory(id, "scale", "", "", oldReplicas, replicas, true, "", "")

	return nil
}

// UpdateDeployment updates a deployment with new image or configuration
func (s *Service) UpdateDeployment(ctx context.Context, id string, req UpdateDeploymentRequest) error {
	deployment, err := s.GetDeployment(ctx, id)
	if err != nil {
		return err
	}

	oldImage := deployment.Image
	oldReplicas := deployment.Replicas

	// Update fields
	if req.Image != "" {
		deployment.Image = req.Image
	}
	if req.Replicas != nil {
		deployment.Replicas = *req.Replicas
	}
	if req.Resources != nil {
		deployment.Resources = *req.Resources
	}
	if req.Environment != nil {
		deployment.Environment = req.Environment
	}

	deployment.Status = DeploymentStatusUpdating
	deployment.UpdatedAt = time.Now()

	// Update in Kubernetes
	if err := s.deployer.Update(ctx, *deployment); err != nil {
		s.recordHistory(id, "update", oldImage, deployment.Image, oldReplicas, deployment.Replicas, false, err.Error(), "")
		return fmt.Errorf("failed to update deployment: %w", err)
	}

	// Update database
	if err := s.updateDeploymentInDB(deployment); err != nil {
		return fmt.Errorf("failed to update deployment in database: %w", err)
	}

	// Record successful update
	s.recordHistory(id, "update", oldImage, deployment.Image, oldReplicas, deployment.Replicas, true, "", "")

	return nil
}

// DeleteDeployment removes a deployment
func (s *Service) DeleteDeployment(ctx context.Context, id string) error {
	deployment, err := s.GetDeployment(ctx, id)
	if err != nil {
		return err
	}

	// Delete from Kubernetes
	if err := s.deployer.Delete(ctx, deployment.Namespace, deployment.Name); err != nil {
		s.recordHistory(id, "delete", "", "", deployment.Replicas, 0, false, err.Error(), "")
		return fmt.Errorf("failed to delete deployment: %w", err)
	}

	// Remove from database
	if err := s.deleteDeploymentFromDB(id); err != nil {
		return fmt.Errorf("failed to delete deployment from database: %w", err)
	}

	// Record successful deletion
	s.recordHistory(id, "delete", "", "", deployment.Replicas, 0, true, "", "")

	return nil
}

// RestartDeployment restarts all pods in a deployment
func (s *Service) RestartDeployment(ctx context.Context, id string) error {
	deployment, err := s.GetDeployment(ctx, id)
	if err != nil {
		return err
	}

	if err := s.deployer.Restart(ctx, deployment.Namespace, deployment.Name); err != nil {
		return fmt.Errorf("failed to restart deployment: %w", err)
	}

	// Record restart
	s.recordHistory(id, "restart", "", "", deployment.Replicas, deployment.Replicas, true, "", "")

	return nil
}

// GetDeploymentHistory returns the history of changes for a deployment
func (s *Service) GetDeploymentHistory(ctx context.Context, deploymentID string) ([]DeploymentHistory, error) {
	query := `
		SELECT id, deployment_id, action, old_image, new_image, old_replicas, new_replicas,
		       success, error, user, timestamp, metadata
		FROM deployment_history
		WHERE deployment_id = ?
		ORDER BY timestamp DESC
		LIMIT 50
	`

	rows, err := s.db.Query(query, deploymentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var history []DeploymentHistory
	for rows.Next() {
		var h DeploymentHistory
		var metadataJSON sql.NullString

		err := rows.Scan(
			&h.ID, &h.DeploymentID, &h.Action, &h.OldImage, &h.NewImage,
			&h.OldReplicas, &h.NewReplicas, &h.Success, &h.Error,
			&h.User, &h.Timestamp, &metadataJSON,
		)
		if err != nil {
			return nil, err
		}

		if metadataJSON.Valid {
			json.Unmarshal([]byte(metadataJSON.String), &h.Metadata)
		}

		history = append(history, h)
	}

	return history, nil
}

// GetAvailableNodes returns information about available Kubernetes nodes
func (s *Service) GetAvailableNodes(ctx context.Context) ([]NodeInfo, error) {
	nodeList, err := s.k8sClient.ListNodes(ctx)
	if err != nil {
		return nil, err
	}

	nodes := make([]NodeInfo, 0, len(nodeList.Items))
	for _, node := range nodeList.Items {
		nodeInfo := NodeInfo{
			Name:    node.Name,
			Ready:   isNodeReady(&node),
			Roles:   getNodeRoles(&node),
			Version: node.Status.NodeInfo.KubeletVersion,
			OS:      node.Status.NodeInfo.OperatingSystem,
			Arch:    node.Status.NodeInfo.Architecture,
			Labels:  node.Labels,
			Capacity: ResourceList{
				CPU:    node.Status.Capacity.Cpu().String(),
				Memory: node.Status.Capacity.Memory().String(),
			},
			Allocatable: ResourceList{
				CPU:    node.Status.Allocatable.Cpu().String(),
				Memory: node.Status.Allocatable.Memory().String(),
			},
		}

		// Extract zone and region from labels
		if zone, ok := node.Labels["topology.kubernetes.io/zone"]; ok {
			nodeInfo.Zone = zone
		}
		if region, ok := node.Labels["topology.kubernetes.io/region"]; ok {
			nodeInfo.Region = region
		}

		nodes = append(nodes, nodeInfo)
	}

	return nodes, nil
}

// Helper methods

func (s *Service) storeDeployment(deployment *Deployment) error {
	nodeSelector, _ := json.Marshal(deployment.NodeSelector)
	strategy, _ := json.Marshal(deployment.Strategy)
	resources, _ := json.Marshal(deployment.Resources)
	environment, _ := json.Marshal(deployment.Environment)

	query := `
		INSERT INTO deployments (
			id, name, namespace, image, registry_id, replicas,
			node_selector, strategy, resources, environment, status,
			source, author, git_commit_sha, manifest_path, applied_by,
			applied_at, service_type, created_at, updated_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`

	_, err := s.db.Exec(query,
		deployment.ID, deployment.Name, deployment.Namespace, deployment.Image,
		deployment.RegistryID, deployment.Replicas, string(nodeSelector),
		string(strategy), string(resources), string(environment),
		deployment.Status, deployment.Source, deployment.Author,
		deployment.GitCommitSHA, deployment.ManifestPath, deployment.AppliedBy,
		deployment.AppliedAt, deployment.ServiceType, deployment.CreatedAt, deployment.UpdatedAt,
	)

	return err
}

func (s *Service) updateDeploymentInDB(deployment *Deployment) error {
	nodeSelector, _ := json.Marshal(deployment.NodeSelector)
	strategy, _ := json.Marshal(deployment.Strategy)
	resources, _ := json.Marshal(deployment.Resources)
	environment, _ := json.Marshal(deployment.Environment)

	query := `
		UPDATE deployments SET
			name = ?, namespace = ?, image = ?, registry_id = ?, replicas = ?,
			node_selector = ?, strategy = ?, resources = ?, environment = ?,
			status = ?, source = ?, author = ?, git_commit_sha = ?, manifest_path = ?,
			applied_by = ?, applied_at = ?, service_type = ?, updated_at = ?
		WHERE id = ?
	`

	_, err := s.db.Exec(query,
		deployment.Name, deployment.Namespace, deployment.Image,
		deployment.RegistryID, deployment.Replicas, string(nodeSelector),
		string(strategy), string(resources), string(environment),
		deployment.Status, deployment.Source, deployment.Author, 
		deployment.GitCommitSHA, deployment.ManifestPath, deployment.AppliedBy,
		deployment.AppliedAt, deployment.ServiceType, deployment.UpdatedAt, 
		deployment.ID,
	)

	return err
}

func (s *Service) getDeploymentFromDB(id string) (*Deployment, error) {
	query := `
		SELECT id, name, namespace, image, registry_id, replicas,
		       node_selector, strategy, resources, environment, status,
		       source, author, git_commit_sha, manifest_path, applied_by,
		       applied_at, service_type, created_at, updated_at
		FROM deployments
		WHERE id = ?
	`

	row := s.db.QueryRow(query, id)

	var deployment Deployment
	var nodeSelector, strategy, resources, environment sql.NullString
	var appliedAt sql.NullTime

	err := row.Scan(
		&deployment.ID, &deployment.Name, &deployment.Namespace,
		&deployment.Image, &deployment.RegistryID, &deployment.Replicas,
		&nodeSelector, &strategy, &resources, &environment,
		&deployment.Status, &deployment.Source, &deployment.Author,
		&deployment.GitCommitSHA, &deployment.ManifestPath, &deployment.AppliedBy,
		&appliedAt, &deployment.ServiceType, &deployment.CreatedAt, &deployment.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	// Parse JSON fields
	if nodeSelector.Valid {
		json.Unmarshal([]byte(nodeSelector.String), &deployment.NodeSelector)
	}
	if strategy.Valid {
		json.Unmarshal([]byte(strategy.String), &deployment.Strategy)
	}
	if resources.Valid {
		json.Unmarshal([]byte(resources.String), &deployment.Resources)
	}
	if environment.Valid {
		json.Unmarshal([]byte(environment.String), &deployment.Environment)
	}
	if appliedAt.Valid {
		deployment.AppliedAt = &appliedAt.Time
	}

	return &deployment, nil
}

func (s *Service) listDeploymentsFromDB(namespace string) ([]Deployment, error) {
	var query string
	var args []interface{}

	if namespace != "" {
		query = `
			SELECT id, name, namespace, image, registry_id, replicas,
			       node_selector, strategy, resources, environment, status,
			       created_at, updated_at
			FROM deployments
			WHERE namespace = ?
			ORDER BY created_at DESC
		`
		args = []interface{}{namespace}
	} else {
		query = `
			SELECT id, name, namespace, image, registry_id, replicas,
			       node_selector, strategy, resources, environment, status,
			       created_at, updated_at
			FROM deployments
			ORDER BY created_at DESC
		`
	}

	rows, err := s.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var deployments []Deployment
	for rows.Next() {
		var deployment Deployment
		var nodeSelector, strategy, resources, environment sql.NullString

		err := rows.Scan(
			&deployment.ID, &deployment.Name, &deployment.Namespace,
			&deployment.Image, &deployment.RegistryID, &deployment.Replicas,
			&nodeSelector, &strategy, &resources, &environment,
			&deployment.Status, &deployment.CreatedAt, &deployment.UpdatedAt,
		)

		if err != nil {
			return nil, err
		}

		// Parse JSON fields
		if nodeSelector.Valid {
			json.Unmarshal([]byte(nodeSelector.String), &deployment.NodeSelector)
		}
		if strategy.Valid {
			json.Unmarshal([]byte(strategy.String), &deployment.Strategy)
		}
		if resources.Valid {
			json.Unmarshal([]byte(resources.String), &deployment.Resources)
		}
		if environment.Valid {
			json.Unmarshal([]byte(environment.String), &deployment.Environment)
		}

		deployments = append(deployments, deployment)
	}

	return deployments, nil
}

func (s *Service) deleteDeploymentFromDB(id string) error {
	// Delete deployment history first
	_, err := s.db.Exec("DELETE FROM deployment_history WHERE deployment_id = ?", id)
	if err != nil {
		return err
	}

	// Delete autoscaler
	_, err = s.db.Exec("DELETE FROM autoscalers WHERE deployment_id = ?", id)
	if err != nil {
		return err
	}

	// Delete deployment
	_, err = s.db.Exec("DELETE FROM deployments WHERE id = ?", id)
	return err
}

func (s *Service) recordHistory(deploymentID, action, oldImage, newImage string, oldReplicas, newReplicas int32, success bool, errorMsg, user string) {
	historyID := uuid.New().String()

	query := `
		INSERT INTO deployment_history (
			id, deployment_id, action, old_image, new_image,
			old_replicas, new_replicas, success, error, user, timestamp
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`

	s.db.Exec(query,
		historyID, deploymentID, action, oldImage, newImage,
		oldReplicas, newReplicas, success, errorMsg, user, time.Now(),
	)

	// Trigger GitOps sync if deployment was successful
	if success && s.gitopsService != nil {
		go s.syncToGitOps(deploymentID, action, user)
	}
}

// syncToGitOps automatically syncs deployment changes to GitOps repository
func (s *Service) syncToGitOps(deploymentID, action, user string) {
	ctx := context.Background()

	// Get deployment details
	deployment, err := s.GetDeployment(ctx, deploymentID)
	if err != nil {
		return // silently fail for now
	}

	// Create GitOps application if it doesn't exist
	// Convert ResourceRequirements to map[string]string for GitOps
	resourceMap := map[string]string{}
	if deployment.Resources.Requests.CPU != "" {
		resourceMap["cpu_request"] = deployment.Resources.Requests.CPU
	}
	if deployment.Resources.Requests.Memory != "" {
		resourceMap["memory_request"] = deployment.Resources.Requests.Memory
	}
	if deployment.Resources.Limits.CPU != "" {
		resourceMap["cpu"] = deployment.Resources.Limits.CPU
	}
	if deployment.Resources.Limits.Memory != "" {
		resourceMap["memory"] = deployment.Resources.Limits.Memory
	}

	gitopsApp := &gitops.Application{
		ID:          deploymentID,
		Name:        deployment.Name,
		Namespace:   deployment.Namespace,
		Image:       deployment.Image,
		Replicas:    int(deployment.Replicas),
		Environment: deployment.Environment,
		Resources:   resourceMap,
	}

	// Try to create the application (will fail silently if exists)
	s.gitopsService.CreateApplication(ctx,
		gitopsApp.Name,
		gitopsApp.Namespace,
		"", // repository ID will be auto-configured
		"", // path will be auto-configured
		gitopsApp.Image,
		gitopsApp.Replicas,
		gitopsApp.Resources,
		gitopsApp.Environment)

	// Sync application to Git repository
	syncConfig := gitops.DefaultSyncConfig()
	syncConfig.CommitMessage = fmt.Sprintf("feat(%s): %s deployment %s", deployment.Namespace, action, deployment.Name)

	s.syncEngine.SyncApplicationToGit(ctx, deploymentID, syncConfig)
}

func (s *Service) updateDeploymentStatus(deployment *Deployment, k8sDeployment interface{}) {
	// This would be implemented to sync status from Kubernetes deployment
	// For now, we'll keep it simple
	if deployment.Status == DeploymentStatusPending {
		deployment.Status = DeploymentStatusRunning
	}
}

// Helper functions for node analysis

func isNodeReady(node *corev1.Node) bool {
	for _, condition := range node.Status.Conditions {
		if condition.Type == corev1.NodeReady {
			return condition.Status == corev1.ConditionTrue
		}
	}
	return false
}

func getNodeRoles(node *corev1.Node) []string {
	var roles []string

	for label := range node.Labels {
		if strings.HasPrefix(label, "node-role.kubernetes.io/") {
			role := strings.TrimPrefix(label, "node-role.kubernetes.io/")
			if role != "" {
				roles = append(roles, role)
			}
		}
	}

	// If no roles found, default to worker
	if len(roles) == 0 {
		roles = append(roles, "worker")
	}

	return roles
}

// Registry Management Database Operations

// CreateRegistry creates a new container registry in the database
func (s *Service) CreateRegistry(ctx context.Context, registry providers.Registry) error {
	configJSON, err := json.Marshal(registry.Config)
	if err != nil {
		return fmt.Errorf("failed to marshal registry config: %w", err)
	}

	query := `
		INSERT INTO container_registries (id, name, type, config, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?)
	`

	_, err = s.db.ExecContext(ctx, query,
		registry.ID,
		registry.Name,
		registry.Type,
		string(configJSON),
		registry.CreatedAt,
		registry.UpdatedAt,
	)

	if err != nil {
		return fmt.Errorf("failed to create registry: %w", err)
	}

	return nil
}

// ListRegistries retrieves all container registries from the database
func (s *Service) ListRegistries(ctx context.Context) ([]providers.Registry, error) {
	query := `
		SELECT id, name, type, config, created_at, updated_at
		FROM container_registries
		ORDER BY created_at DESC
	`

	rows, err := s.db.QueryContext(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to query registries: %w", err)
	}
	defer rows.Close()

	var registries []providers.Registry
	for rows.Next() {
		var registry providers.Registry
		var configJSON string

		err := rows.Scan(
			&registry.ID,
			&registry.Name,
			&registry.Type,
			&configJSON,
			&registry.CreatedAt,
			&registry.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan registry: %w", err)
		}

		// Parse config JSON
		if err := json.Unmarshal([]byte(configJSON), &registry.Config); err != nil {
			return nil, fmt.Errorf("failed to unmarshal registry config: %w", err)
		}

		// Set default status (could be enhanced to store/retrieve actual status)
		registry.Status = "connected"

		registries = append(registries, registry)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("failed to iterate registries: %w", err)
	}

	return registries, nil
}

// DeleteRegistry removes a container registry from the database
func (s *Service) DeleteRegistry(ctx context.Context, id string) error {
	query := `DELETE FROM container_registries WHERE id = ?`

	result, err := s.db.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete registry: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("registry not found: %s", id)
	}

	return nil
}

// commitToGitOps generates manifests and commits them to the GitOps repository
func (s *Service) commitToGitOps(ctx context.Context, deployment *Deployment) error {
	if s.gitopsService == nil {
		return fmt.Errorf("gitops service not configured")
	}

	// Convert deployment to GitOps application
	app := s.deploymentToGitOpsApp(deployment)
	
	// Generate manifest with deployment ID and service type
	options := map[string]interface{}{
		"deployment_id": deployment.ID,
		"service_type":  deployment.ServiceType,
		"service":       true,  // Always create service
		"ingress":       false, // Can be enhanced later
		"autoscaling":   false, // Can be enhanced later
	}
	
	manifest, err := s.gitopsService.GenerateFullManifest(app, options)
	if err != nil {
		return fmt.Errorf("failed to generate manifest: %w", err)
	}
	
	// Create GitOps application
	gitopsApp, err := s.gitopsService.CreateApplication(ctx, 
		deployment.Name, 
		deployment.Namespace,
		"",  // repository ID - will use default
		fmt.Sprintf("k8s/%s/%s.yaml", deployment.Namespace, deployment.Name), // manifest path
		deployment.Image,
		int(deployment.Replicas),
		s.resourcesMapFromRequirements(deployment.Resources),
		deployment.Environment,
	)
	if err != nil {
		return fmt.Errorf("failed to create gitops application: %w", err)
	}
	
	// Sync to git repository (this commits the manifest)
	err = s.syncEngine.SyncApplicationToGit(ctx, gitopsApp.ID, nil)
	if err != nil {
		return fmt.Errorf("failed to sync to git: %w", err)
	}
	
	// Update deployment with git info
	deployment.ManifestPath = fmt.Sprintf("k8s/%s/%s.yaml", deployment.Namespace, deployment.Name)
	// deployment.GitCommitSHA will be updated by sync engine
	
	return nil
}

// ApplyDeployment manually applies a committed deployment to Kubernetes
func (s *Service) ApplyDeployment(ctx context.Context, deploymentID, appliedBy string) error {
	// Get deployment from database
	deployment, err := s.getDeploymentFromDB(deploymentID)
	if err != nil {
		return fmt.Errorf("failed to get deployment: %w", err)
	}
	
	if deployment.Status != DeploymentStatusPendingApply {
		return fmt.Errorf("deployment is not in pending_apply status: %s", deployment.Status)
	}
	
	// Update status to applying
	deployment.Status = DeploymentStatusApplying
	deployment.UpdatedAt = time.Now()
	if err := s.updateDeploymentInDB(deployment); err != nil {
		return fmt.Errorf("failed to update status: %w", err)
	}
	
	// Deploy to Kubernetes using the deployer
	k8sDeployment, err := s.deployer.Deploy(ctx, *deployment)
	if err != nil {
		// Mark as apply failed
		deployment.Status = DeploymentStatusApplyFailed
		deployment.UpdatedAt = time.Now()
		s.updateDeploymentInDB(deployment)
		s.recordHistory(deployment.ID, "apply", "", deployment.Image, 0, deployment.Replicas, false, err.Error(), appliedBy)
		return fmt.Errorf("failed to apply to kubernetes: %w", err)
	}
	
	// Success - update status
	now := time.Now()
	deployment.Status = DeploymentStatusRunning
	deployment.AppliedBy = appliedBy
	deployment.AppliedAt = &now
	deployment.UpdatedAt = now
	
	// Update with live status from Kubernetes
	s.updateDeploymentStatus(deployment, k8sDeployment)
	
	// Record successful apply
	s.recordHistory(deployment.ID, "apply", "", deployment.Image, 0, deployment.Replicas, true, "Applied to cluster", appliedBy)
	
	return nil
}

// GetPendingDeployments returns all deployments with pending_apply status
func (s *Service) GetPendingDeployments(ctx context.Context) ([]Deployment, error) {
	query := `
		SELECT id, name, namespace, image, registry_id, replicas, node_selector, strategy, 
			   resources, environment, status, source, author, git_commit_sha, manifest_path,
			   applied_by, applied_at, service_type, created_at, updated_at
		FROM deployments 
		WHERE status = ? OR status = ?
		ORDER BY created_at DESC
	`
	
	rows, err := s.db.QueryContext(ctx, query, DeploymentStatusPendingApply, DeploymentStatusCommitted)
	if err != nil {
		return nil, fmt.Errorf("failed to query pending deployments: %w", err)
	}
	defer rows.Close()
	
	var deployments []Deployment
	for rows.Next() {
		var deployment Deployment
		var nodeSelectorJSON, strategyJSON, resourcesJSON, environmentJSON string
		var appliedAt sql.NullTime
		
		err := rows.Scan(
			&deployment.ID,
			&deployment.Name,
			&deployment.Namespace,
			&deployment.Image,
			&deployment.RegistryID,
			&deployment.Replicas,
			&nodeSelectorJSON,
			&strategyJSON,
			&resourcesJSON,
			&environmentJSON,
			&deployment.Status,
			&deployment.Source,
			&deployment.Author,
			&deployment.GitCommitSHA,
			&deployment.ManifestPath,
			&deployment.AppliedBy,
			&appliedAt,
			&deployment.ServiceType,
			&deployment.CreatedAt,
			&deployment.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan deployment: %w", err)
		}
		
		// Parse JSON fields
		if nodeSelectorJSON != "" {
			json.Unmarshal([]byte(nodeSelectorJSON), &deployment.NodeSelector)
		}
		if strategyJSON != "" {
			json.Unmarshal([]byte(strategyJSON), &deployment.Strategy)
		}
		if resourcesJSON != "" {
			json.Unmarshal([]byte(resourcesJSON), &deployment.Resources)
		}
		if environmentJSON != "" {
			json.Unmarshal([]byte(environmentJSON), &deployment.Environment)
		}
		if appliedAt.Valid {
			deployment.AppliedAt = &appliedAt.Time
		}
		
		deployments = append(deployments, deployment)
	}
	
	return deployments, nil
}

// BatchApplyDeployments applies multiple deployments at once
func (s *Service) BatchApplyDeployments(ctx context.Context, deploymentIDs []string, appliedBy string) map[string]error {
	results := make(map[string]error)
	
	for _, id := range deploymentIDs {
		err := s.ApplyDeployment(ctx, id, appliedBy)
		results[id] = err
	}
	
	return results
}

// Helper methods

// deploymentToGitOpsApp converts a Deployment to GitOps Application
func (s *Service) deploymentToGitOpsApp(deployment *Deployment) *gitops.Application {
	return &gitops.Application{
		ID:           deployment.ID,
		Name:         deployment.Name,
		Namespace:    deployment.Namespace,
		Image:        deployment.Image,
		Replicas:     int(deployment.Replicas),
		Resources:    s.resourcesMapFromRequirements(deployment.Resources),
		Environment:  deployment.Environment,
		Status:       "Healthy", // Default status
		CreatedAt:    deployment.CreatedAt,
	}
}

// resourcesMapFromRequirements converts ResourceRequirements to map[string]string
func (s *Service) resourcesMapFromRequirements(req ResourceRequirements) map[string]string {
	resources := make(map[string]string)
	if req.Limits.CPU != "" {
		resources["cpu"] = req.Limits.CPU
	}
	if req.Limits.Memory != "" {
		resources["memory"] = req.Limits.Memory
	}
	if req.Requests.CPU != "" {
		resources["cpu_request"] = req.Requests.CPU
	}
	if req.Requests.Memory != "" {
		resources["memory_request"] = req.Requests.Memory
	}
	return resources
}
