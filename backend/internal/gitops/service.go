// Package gitops provides GitOps functionality for managing infrastructure as code.
// It handles repository synchronization, manifest generation, and deployment tracking.
package gitops

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"path/filepath"
	"time"

	"github.com/archellir/denshimon/internal/git"
	"github.com/google/uuid"
)

// Service provides GitOps operations
type Service struct {
	db               *sql.DB
	gitClient        *git.Client
	baseInfraRepoURL string
	localRepoPath    string
}

// NewService creates a new GitOps service
func NewService(db *sql.DB, baseInfraRepoURL, localRepoPath string) *Service {
	return &Service{
		db:               db,
		baseInfraRepoURL: baseInfraRepoURL,
		localRepoPath:    localRepoPath,
		gitClient:        git.NewClient(baseInfraRepoURL, localRepoPath, "main"),
	}
}

// Repository represents a GitOps repository
type Repository struct {
	ID          string     `json:"id"`
	Name        string     `json:"name"`
	URL         string     `json:"url"`
	Branch      string     `json:"branch"`
	Path        string     `json:"path"`
	LastSync    *time.Time `json:"last_sync,omitempty"`
	Status      string     `json:"status"`
	Description string     `json:"description"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

// Application represents a deployed application
type Application struct {
	ID            string            `json:"id"`
	Name          string            `json:"name"`
	Namespace     string            `json:"namespace"`
	RepositoryID  string            `json:"repository_id"`
	Path          string            `json:"path"`
	Image         string            `json:"image"`
	Replicas      int               `json:"replicas"`
	Resources     map[string]string `json:"resources"`
	Environment   map[string]string `json:"environment"`
	LastDeployed  *time.Time        `json:"last_deployed,omitempty"`
	Status        string            `json:"status"`
	Health        string            `json:"health"`
	SyncStatus    string            `json:"sync_status"`
	CreatedAt     time.Time         `json:"created_at"`
	UpdatedAt     time.Time         `json:"updated_at"`
}

// DeploymentRecord represents a deployment history entry
type DeploymentRecord struct {
	ID            string            `json:"id"`
	ApplicationID string            `json:"application_id"`
	Image         string            `json:"image"`
	Replicas      int               `json:"replicas"`
	Environment   map[string]string `json:"environment"`
	GitHash       string            `json:"git_hash"`
	Status        string            `json:"status"`
	Message       string            `json:"message"`
	DeployedBy    string            `json:"deployed_by"`
	DeployedAt    time.Time         `json:"deployed_at"`
}

// InitializeRepository initializes the GitOps repository
func (s *Service) InitializeRepository() error {
	return s.gitClient.Clone()
}

// SyncRepository pulls the latest changes from the remote repository
func (s *Service) SyncRepository(ctx context.Context, repoID string) error {
	if err := s.gitClient.Pull(); err != nil {
		return fmt.Errorf("failed to sync repository: %w", err)
	}

	// Update last sync time in database
	_, err := s.db.ExecContext(ctx, `
		UPDATE gitops_repositories 
		SET last_sync = ?, updated_at = ? 
		WHERE id = ?`,
		time.Now(), time.Now(), repoID)
	
	return err
}

// CreateRepository creates a new GitOps repository record
func (s *Service) CreateRepository(ctx context.Context, name, url, branch, description string) (*Repository, error) {
	repo := &Repository{
		ID:          uuid.New().String(),
		Name:        name,
		URL:         url,
		Branch:      branch,
		Path:        filepath.Join(s.localRepoPath, name),
		Status:      "pending",
		Description: description,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	_, err := s.db.ExecContext(ctx, `
		INSERT INTO gitops_repositories (id, name, url, branch, path, status, description, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		repo.ID, repo.Name, repo.URL, repo.Branch, repo.Path, repo.Status, repo.Description, repo.CreatedAt, repo.UpdatedAt)

	if err != nil {
		return nil, fmt.Errorf("failed to create repository: %w", err)
	}

	return repo, nil
}

// ListRepositories returns all GitOps repositories
func (s *Service) ListRepositories(ctx context.Context) ([]Repository, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT id, name, url, branch, path, status, description, last_sync, created_at, updated_at
		FROM gitops_repositories
		ORDER BY created_at DESC`)
	if err != nil {
		return nil, fmt.Errorf("failed to list repositories: %w", err)
	}
	defer rows.Close()

	var repos []Repository
	for rows.Next() {
		var repo Repository
		var lastSync sql.NullTime
		
		err := rows.Scan(&repo.ID, &repo.Name, &repo.URL, &repo.Branch, &repo.Path, 
			&repo.Status, &repo.Description, &lastSync, &repo.CreatedAt, &repo.UpdatedAt)
		if err != nil {
			return nil, fmt.Errorf("failed to scan repository: %w", err)
		}

		if lastSync.Valid {
			repo.LastSync = &lastSync.Time
		}

		repos = append(repos, repo)
	}

	return repos, nil
}

// CreateApplication creates a new application deployment
func (s *Service) CreateApplication(ctx context.Context, name, namespace, repoID, path, image string, replicas int, resources, environment map[string]string) (*Application, error) {
	app := &Application{
		ID:           uuid.New().String(),
		Name:         name,
		Namespace:    namespace,
		RepositoryID: repoID,
		Path:         path,
		Image:        image,
		Replicas:     replicas,
		Resources:    resources,
		Environment:  environment,
		Status:       "pending",
		Health:       "unknown",
		SyncStatus:   "out-of-sync",
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	// Serialize maps to JSON
	resourcesJSON, _ := json.Marshal(resources)
	envJSON, _ := json.Marshal(environment)

	_, err := s.db.ExecContext(ctx, `
		INSERT INTO gitops_applications (id, name, namespace, repository_id, path, image, replicas, resources, environment, status, health, sync_status, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		app.ID, app.Name, app.Namespace, app.RepositoryID, app.Path, app.Image, app.Replicas, 
		string(resourcesJSON), string(envJSON), app.Status, app.Health, app.SyncStatus, app.CreatedAt, app.UpdatedAt)

	if err != nil {
		return nil, fmt.Errorf("failed to create application: %w", err)
	}

	return app, nil
}

// ListApplications returns all applications
func (s *Service) ListApplications(ctx context.Context) ([]Application, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT id, name, namespace, repository_id, path, image, replicas, resources, environment, 
			   status, health, sync_status, last_deployed, created_at, updated_at
		FROM gitops_applications
		ORDER BY created_at DESC`)
	if err != nil {
		return nil, fmt.Errorf("failed to list applications: %w", err)
	}
	defer rows.Close()

	var apps []Application
	for rows.Next() {
		var app Application
		var resourcesJSON, envJSON string
		var lastDeployed sql.NullTime
		
		err := rows.Scan(&app.ID, &app.Name, &app.Namespace, &app.RepositoryID, &app.Path, 
			&app.Image, &app.Replicas, &resourcesJSON, &envJSON, &app.Status, &app.Health, 
			&app.SyncStatus, &lastDeployed, &app.CreatedAt, &app.UpdatedAt)
		if err != nil {
			return nil, fmt.Errorf("failed to scan application: %w", err)
		}

		// Deserialize JSON maps
		json.Unmarshal([]byte(resourcesJSON), &app.Resources)
		json.Unmarshal([]byte(envJSON), &app.Environment)

		if lastDeployed.Valid {
			app.LastDeployed = &lastDeployed.Time
		}

		apps = append(apps, app)
	}

	return apps, nil
}

// DeployApplication deploys an application and records the deployment
func (s *Service) DeployApplication(ctx context.Context, appID string, deployedBy string) (*DeploymentRecord, error) {
	// Get application details
	var app Application
	var resourcesJSON, envJSON string
	err := s.db.QueryRowContext(ctx, `
		SELECT id, name, namespace, repository_id, path, image, replicas, resources, environment
		FROM gitops_applications WHERE id = ?`, appID).Scan(
		&app.ID, &app.Name, &app.Namespace, &app.RepositoryID, &app.Path, 
		&app.Image, &app.Replicas, &resourcesJSON, &envJSON)
	if err != nil {
		return nil, fmt.Errorf("failed to get application: %w", err)
	}

	json.Unmarshal([]byte(resourcesJSON), &app.Resources)
	json.Unmarshal([]byte(envJSON), &app.Environment)

	// Generate Kubernetes manifest
	manifest, err := s.generateDeploymentManifest(&app)
	if err != nil {
		return nil, fmt.Errorf("failed to generate manifest: %w", err)
	}

	// Write manifest to repository
	manifestPath := filepath.Join("k8s", app.Namespace, fmt.Sprintf("%s-deployment.yaml", app.Name))
	if err := s.gitClient.WriteFile(manifestPath, []byte(manifest)); err != nil {
		return nil, fmt.Errorf("failed to write manifest: %w", err)
	}

	// Commit and push changes
	commitMsg := fmt.Sprintf("feat(%s): deploy %s to %s\n\nUpdate deployment with image %s and %d replicas", 
		app.Namespace, app.Name, app.Namespace, app.Image, app.Replicas)
	if err := s.gitClient.CommitAndPush(commitMsg, manifestPath); err != nil {
		return nil, fmt.Errorf("failed to commit changes: %w", err)
	}

	// Get current git hash
	commits, err := s.gitClient.Log(1)
	if err != nil {
		return nil, fmt.Errorf("failed to get git hash: %w", err)
	}

	var gitHash string
	if len(commits) > 0 {
		gitHash = commits[0].Hash
	}

	// Create deployment record
	deployment := &DeploymentRecord{
		ID:            uuid.New().String(),
		ApplicationID: appID,
		Image:         app.Image,
		Replicas:      app.Replicas,
		Environment:   app.Environment,
		GitHash:       gitHash,
		Status:        "deployed",
		Message:       "Successfully deployed to base infrastructure",
		DeployedBy:    deployedBy,
		DeployedAt:    time.Now(),
	}

	envJSONBytes, _ := json.Marshal(deployment.Environment)
	_, err = s.db.ExecContext(ctx, `
		INSERT INTO gitops_deployments (id, application_id, image, replicas, environment, git_hash, status, message, deployed_by, deployed_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		deployment.ID, deployment.ApplicationID, deployment.Image, deployment.Replicas, 
		string(envJSONBytes), deployment.GitHash, deployment.Status, deployment.Message, deployment.DeployedBy, deployment.DeployedAt)

	if err != nil {
		return nil, fmt.Errorf("failed to record deployment: %w", err)
	}

	// Update application status
	_, err = s.db.ExecContext(ctx, `
		UPDATE gitops_applications 
		SET status = 'deployed', sync_status = 'synced', last_deployed = ?, updated_at = ?
		WHERE id = ?`,
		time.Now(), time.Now(), appID)
	if err != nil {
		return nil, fmt.Errorf("failed to update application status: %w", err)
	}

	return deployment, nil
}

// GetDeploymentHistory returns deployment history for an application
func (s *Service) GetDeploymentHistory(ctx context.Context, appID string) ([]DeploymentRecord, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT id, application_id, image, replicas, environment, git_hash, status, message, deployed_by, deployed_at
		FROM gitops_deployments 
		WHERE application_id = ?
		ORDER BY deployed_at DESC`,
		appID)
	if err != nil {
		return nil, fmt.Errorf("failed to get deployment history: %w", err)
	}
	defer rows.Close()

	var deployments []DeploymentRecord
	for rows.Next() {
		var deployment DeploymentRecord
		var envJSON string
		
		err := rows.Scan(&deployment.ID, &deployment.ApplicationID, &deployment.Image, 
			&deployment.Replicas, &envJSON, &deployment.GitHash, &deployment.Status, 
			&deployment.Message, &deployment.DeployedBy, &deployment.DeployedAt)
		if err != nil {
			return nil, fmt.Errorf("failed to scan deployment: %w", err)
		}

		json.Unmarshal([]byte(envJSON), &deployment.Environment)
		deployments = append(deployments, deployment)
	}

	return deployments, nil
}

// generateDeploymentManifest generates a Kubernetes deployment manifest using templates
func (s *Service) generateDeploymentManifest(app *Application) (string, error) {
	options := map[string]interface{}{
		"service":     true,
		"ingress":     false,
		"autoscaling": false,
	}
	
	return s.GenerateFullManifest(app, options)
}