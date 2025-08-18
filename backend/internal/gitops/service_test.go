package gitops

import (
	"context"
	"database/sql"
	"encoding/json"
	"testing"
	"time"

	_ "github.com/mattn/go-sqlite3"
)

// MockGitClient provides a mock git client for testing
type MockGitClient struct {
	repos   map[string]*Repository
	commits map[string][]string
	errors  map[string]error
}

func NewMockGitClient() *MockGitClient {
	return &MockGitClient{
		repos:   make(map[string]*Repository),
		commits: make(map[string][]string),
		errors:  make(map[string]error),
	}
}

func (m *MockGitClient) SetError(operation string, err error) {
	m.errors[operation] = err
}

func (m *MockGitClient) Clone(url, path, branch string) error {
	if err := m.errors["Clone"]; err != nil {
		return err
	}
	return nil
}

func (m *MockGitClient) Pull() error {
	if err := m.errors["Pull"]; err != nil {
		return err
	}
	return nil
}

func (m *MockGitClient) Commit(message string) (string, error) {
	if err := m.errors["Commit"]; err != nil {
		return "", err
	}
	commitSHA := "abc123def456"
	return commitSHA, nil
}

func (m *MockGitClient) Push() error {
	if err := m.errors["Push"]; err != nil {
		return err
	}
	return nil
}

func setupTestGitOpsService(t *testing.T) (*Service, *sql.DB, func()) {
	// Create in-memory SQLite database
	db, err := sql.Open("sqlite3", ":memory:")
	if err != nil {
		t.Fatalf("Failed to create test database: %v", err)
	}

	service := &Service{
		db:               db,
		baseInfraRepoURL: "https://github.com/test/infra.git",
		localRepoPath:    "/tmp/test-repo",
	}

	// Initialize database schema
	service.initDB()

	cleanup := func() {
		db.Close()
	}

	return service, db, cleanup
}

func TestNewService(t *testing.T) {
	db, err := sql.Open("sqlite3", ":memory:")
	if err != nil {
		t.Fatalf("Failed to create test database: %v", err)
	}
	defer db.Close()

	service := NewService(db, "https://github.com/test/infra.git", "/tmp/test-repo")
	
	if service == nil {
		t.Fatal("Service should not be nil")
	}
	
	if service.db != db {
		t.Error("Database client not set correctly")
	}
	
	if service.baseInfraRepoURL != "https://github.com/test/infra.git" {
		t.Errorf("Base infra repo URL = %q, want %q", service.baseInfraRepoURL, "https://github.com/test/infra.git")
	}
}

func TestCreateRepository(t *testing.T) {
	service, _, cleanup := setupTestGitOpsService(t)
	defer cleanup()

	ctx := context.Background()

	repo := &Repository{
		Name:        "test-repo",
		URL:         "https://github.com/test/test-repo.git",
		Branch:      "main",
		Path:        ".",
		Status:      "pending",
		Description: "Test repository",
	}

	createdRepo, err := service.CreateRepository(ctx, repo)
	if err != nil {
		t.Fatalf("Failed to create repository: %v", err)
	}

	if createdRepo.ID == "" {
		t.Error("Repository ID should not be empty")
	}

	if createdRepo.Name != repo.Name {
		t.Errorf("Repository Name = %q, want %q", createdRepo.Name, repo.Name)
	}

	if createdRepo.Status != "pending" {
		t.Errorf("Repository Status = %q, want %q", createdRepo.Status, "pending")
	}

	// Test retrieving the repository
	retrieved, err := service.GetRepository(ctx, createdRepo.ID)
	if err != nil {
		t.Fatalf("Failed to retrieve repository: %v", err)
	}

	if retrieved.ID != createdRepo.ID {
		t.Errorf("Retrieved repository ID = %q, want %q", retrieved.ID, createdRepo.ID)
	}
}

func TestListRepositories(t *testing.T) {
	service, _, cleanup := setupTestGitOpsService(t)
	defer cleanup()

	ctx := context.Background()

	// Create multiple repositories
	repos := []*Repository{
		{
			Name:        "repo-1",
			URL:         "https://github.com/test/repo-1.git",
			Branch:      "main",
			Path:        ".",
			Status:      "synced",
			Description: "Repository 1",
		},
		{
			Name:        "repo-2",
			URL:         "https://github.com/test/repo-2.git",
			Branch:      "develop",
			Path:        "apps",
			Status:      "pending",
			Description: "Repository 2",
		},
	}

	// Store repositories
	for _, repo := range repos {
		_, err := service.CreateRepository(ctx, repo)
		if err != nil {
			t.Fatalf("Failed to create repository %s: %v", repo.Name, err)
		}
	}

	// List all repositories
	allRepos, err := service.ListRepositories(ctx)
	if err != nil {
		t.Fatalf("Failed to list repositories: %v", err)
	}

	if len(allRepos) != 2 {
		t.Errorf("Expected 2 repositories, got %d", len(allRepos))
	}

	// Verify repositories are present
	repoNames := make(map[string]bool)
	for _, repo := range allRepos {
		repoNames[repo.Name] = true
	}

	for _, expectedRepo := range repos {
		if !repoNames[expectedRepo.Name] {
			t.Errorf("Repository %s not found in listed repositories", expectedRepo.Name)
		}
	}
}

func TestUpdateRepository(t *testing.T) {
	service, _, cleanup := setupTestGitOpsService(t)
	defer cleanup()

	ctx := context.Background()

	// Create a repository
	repo := &Repository{
		Name:        "test-repo",
		URL:         "https://github.com/test/test-repo.git",
		Branch:      "main",
		Path:        ".",
		Status:      "pending",
		Description: "Test repository",
	}

	createdRepo, err := service.CreateRepository(ctx, repo)
	if err != nil {
		t.Fatalf("Failed to create repository: %v", err)
	}

	// Update the repository
	createdRepo.Status = "synced"
	createdRepo.Description = "Updated test repository"
	now := time.Now()
	createdRepo.LastSync = &now

	err = service.UpdateRepository(ctx, createdRepo)
	if err != nil {
		t.Fatalf("Failed to update repository: %v", err)
	}

	// Retrieve and verify update
	updated, err := service.GetRepository(ctx, createdRepo.ID)
	if err != nil {
		t.Fatalf("Failed to retrieve updated repository: %v", err)
	}

	if updated.Status != "synced" {
		t.Errorf("Updated repository Status = %q, want %q", updated.Status, "synced")
	}

	if updated.Description != "Updated test repository" {
		t.Errorf("Updated repository Description = %q, want %q", updated.Description, "Updated test repository")
	}

	if updated.LastSync == nil {
		t.Error("LastSync should not be nil after update")
	}
}

func TestDeleteRepository(t *testing.T) {
	service, _, cleanup := setupTestGitOpsService(t)
	defer cleanup()

	ctx := context.Background()

	// Create a repository
	repo := &Repository{
		Name:        "test-repo",
		URL:         "https://github.com/test/test-repo.git",
		Branch:      "main",
		Path:        ".",
		Status:      "pending",
		Description: "Test repository",
	}

	createdRepo, err := service.CreateRepository(ctx, repo)
	if err != nil {
		t.Fatalf("Failed to create repository: %v", err)
	}

	// Delete the repository
	err = service.DeleteRepository(ctx, createdRepo.ID)
	if err != nil {
		t.Fatalf("Failed to delete repository: %v", err)
	}

	// Verify repository is deleted
	_, err = service.GetRepository(ctx, createdRepo.ID)
	if err == nil {
		t.Error("Expected error when getting deleted repository")
	}
}

func TestCreateApplication(t *testing.T) {
	service, _, cleanup := setupTestGitOpsService(t)
	defer cleanup()

	ctx := context.Background()

	// Create a repository first
	repo := &Repository{
		Name:        "test-repo",
		URL:         "https://github.com/test/test-repo.git",
		Branch:      "main",
		Path:        ".",
		Status:      "synced",
		Description: "Test repository",
	}

	createdRepo, err := service.CreateRepository(ctx, repo)
	if err != nil {
		t.Fatalf("Failed to create repository: %v", err)
	}

	// Create an application
	app := &Application{
		Name:         "test-app",
		RepositoryID: createdRepo.ID,
		Path:         "apps/test-app",
		Namespace:    "default",
		Status:       "pending",
		Health:       "unknown",
		Sync:         "OutOfSync",
	}

	createdApp, err := service.CreateApplication(ctx, app)
	if err != nil {
		t.Fatalf("Failed to create application: %v", err)
	}

	if createdApp.ID == "" {
		t.Error("Application ID should not be empty")
	}

	if createdApp.Name != app.Name {
		t.Errorf("Application Name = %q, want %q", createdApp.Name, app.Name)
	}

	if createdApp.RepositoryID != app.RepositoryID {
		t.Errorf("Application RepositoryID = %q, want %q", createdApp.RepositoryID, app.RepositoryID)
	}
}

func TestListApplications(t *testing.T) {
	service, _, cleanup := setupTestGitOpsService(t)
	defer cleanup()

	ctx := context.Background()

	// Create a repository
	repo := &Repository{
		Name:        "test-repo",
		URL:         "https://github.com/test/test-repo.git",
		Branch:      "main",
		Path:        ".",
		Status:      "synced",
		Description: "Test repository",
	}

	createdRepo, err := service.CreateRepository(ctx, repo)
	if err != nil {
		t.Fatalf("Failed to create repository: %v", err)
	}

	// Create multiple applications
	apps := []*Application{
		{
			Name:         "app-1",
			RepositoryID: createdRepo.ID,
			Path:         "apps/app-1",
			Namespace:    "default",
			Status:       "running",
			Health:       "healthy",
			Sync:         "Synced",
		},
		{
			Name:         "app-2",
			RepositoryID: createdRepo.ID,
			Path:         "apps/app-2",
			Namespace:    "production",
			Status:       "pending",
			Health:       "unknown",
			Sync:         "OutOfSync",
		},
	}

	// Store applications
	for _, app := range apps {
		_, err := service.CreateApplication(ctx, app)
		if err != nil {
			t.Fatalf("Failed to create application %s: %v", app.Name, err)
		}
	}

	// List all applications
	allApps, err := service.ListApplications(ctx)
	if err != nil {
		t.Fatalf("Failed to list applications: %v", err)
	}

	if len(allApps) != 2 {
		t.Errorf("Expected 2 applications, got %d", len(allApps))
	}

	// Verify applications are present
	appNames := make(map[string]bool)
	for _, app := range allApps {
		appNames[app.Name] = true
	}

	for _, expectedApp := range apps {
		if !appNames[expectedApp.Name] {
			t.Errorf("Application %s not found in listed applications", expectedApp.Name)
		}
	}
}

func TestSyncRepository(t *testing.T) {
	service, _, cleanup := setupTestGitOpsService(t)
	defer cleanup()

	ctx := context.Background()

	// Create a repository
	repo := &Repository{
		Name:        "test-repo",
		URL:         "https://github.com/test/test-repo.git",
		Branch:      "main",
		Path:        ".",
		Status:      "pending",
		Description: "Test repository",
	}

	createdRepo, err := service.CreateRepository(ctx, repo)
	if err != nil {
		t.Fatalf("Failed to create repository: %v", err)
	}

	// Test sync repository
	err = service.SyncRepository(ctx, createdRepo.ID)
	if err != nil {
		t.Fatalf("Failed to sync repository: %v", err)
	}

	// Verify repository status is updated
	syncedRepo, err := service.GetRepository(ctx, createdRepo.ID)
	if err != nil {
		t.Fatalf("Failed to get synced repository: %v", err)
	}

	if syncedRepo.LastSync == nil {
		t.Error("LastSync should be set after sync")
	}
}

func TestGenerateManifest(t *testing.T) {
	service, _, cleanup := setupTestGitOpsService(t)
	defer cleanup()

	// Test manifest generation
	manifest := map[string]interface{}{
		"apiVersion": "apps/v1",
		"kind":       "Deployment",
		"metadata": map[string]interface{}{
			"name":      "test-app",
			"namespace": "default",
		},
		"spec": map[string]interface{}{
			"replicas": 3,
			"selector": map[string]interface{}{
				"matchLabels": map[string]string{
					"app": "test-app",
				},
			},
		},
	}

	yamlContent, err := service.GenerateManifest(manifest)
	if err != nil {
		t.Fatalf("Failed to generate manifest: %v", err)
	}

	if len(yamlContent) == 0 {
		t.Error("Generated manifest should not be empty")
	}

	// Verify YAML contains expected content
	if !contains(yamlContent, "apiVersion: apps/v1") {
		t.Error("Manifest should contain apiVersion")
	}

	if !contains(yamlContent, "kind: Deployment") {
		t.Error("Manifest should contain kind")
	}

	if !contains(yamlContent, "name: test-app") {
		t.Error("Manifest should contain name")
	}
}

func TestValidateManifest(t *testing.T) {
	service, _, cleanup := setupTestGitOpsService(t)
	defer cleanup()

	tests := []struct {
		name     string
		manifest map[string]interface{}
		valid    bool
	}{
		{
			name: "valid_deployment",
			manifest: map[string]interface{}{
				"apiVersion": "apps/v1",
				"kind":       "Deployment",
				"metadata": map[string]interface{}{
					"name":      "test-app",
					"namespace": "default",
				},
				"spec": map[string]interface{}{
					"replicas": 3,
				},
			},
			valid: true,
		},
		{
			name: "missing_apiVersion",
			manifest: map[string]interface{}{
				"kind": "Deployment",
				"metadata": map[string]interface{}{
					"name": "test-app",
				},
			},
			valid: false,
		},
		{
			name: "missing_kind",
			manifest: map[string]interface{}{
				"apiVersion": "apps/v1",
				"metadata": map[string]interface{}{
					"name": "test-app",
				},
			},
			valid: false,
		},
		{
			name: "missing_metadata",
			manifest: map[string]interface{}{
				"apiVersion": "apps/v1",
				"kind":       "Deployment",
			},
			valid: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			valid := service.ValidateManifest(tt.manifest)
			if valid != tt.valid {
				t.Errorf("ValidateManifest() = %v, want %v", valid, tt.valid)
			}
		})
	}
}

func TestCommitChanges(t *testing.T) {
	service, _, cleanup := setupTestGitOpsService(t)
	defer cleanup()

	ctx := context.Background()

	// Create a repository
	repo := &Repository{
		Name:        "test-repo",
		URL:         "https://github.com/test/test-repo.git",
		Branch:      "main",
		Path:        ".",
		Status:      "synced",
		Description: "Test repository",
	}

	createdRepo, err := service.CreateRepository(ctx, repo)
	if err != nil {
		t.Fatalf("Failed to create repository: %v", err)
	}

	// Test commit changes
	commitSHA, err := service.CommitChanges(ctx, createdRepo.ID, "Add new deployment manifest")
	if err != nil {
		t.Fatalf("Failed to commit changes: %v", err)
	}

	if commitSHA == "" {
		t.Error("Commit SHA should not be empty")
	}
}

// Helper functions for testing

func contains(s, substr string) bool {
	return len(s) >= len(substr) && (s == substr || len(s) > len(substr) && (s[0:len(substr)] == substr || s[len(s)-len(substr):] == substr || containsAt(s, substr, 1)))
}

func containsAt(s, substr string, start int) bool {
	for i := start; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}

// Mock implementations for GitOps service methods

func (s *Service) initDB() error {
	schemas := []string{
		`CREATE TABLE IF NOT EXISTS repositories (
			id TEXT PRIMARY KEY,
			name TEXT NOT NULL UNIQUE,
			url TEXT NOT NULL,
			branch TEXT NOT NULL,
			path TEXT NOT NULL,
			last_sync DATETIME,
			status TEXT NOT NULL,
			description TEXT,
			created_at DATETIME NOT NULL,
			updated_at DATETIME NOT NULL
		)`,
		`CREATE TABLE IF NOT EXISTS applications (
			id TEXT PRIMARY KEY,
			name TEXT NOT NULL,
			repository_id TEXT NOT NULL,
			path TEXT NOT NULL,
			namespace TEXT NOT NULL,
			status TEXT NOT NULL,
			health TEXT NOT NULL,
			sync_status TEXT NOT NULL,
			last_sync DATETIME,
			created_at DATETIME NOT NULL,
			updated_at DATETIME NOT NULL,
			FOREIGN KEY (repository_id) REFERENCES repositories (id)
		)`,
	}
	
	for _, schema := range schemas {
		if _, err := s.db.Exec(schema); err != nil {
			return err
		}
	}
	return nil
}

type Application struct {
	ID           string     `json:"id"`
	Name         string     `json:"name"`
	RepositoryID string     `json:"repository_id"`
	Path         string     `json:"path"`
	Namespace    string     `json:"namespace"`
	Status       string     `json:"status"`
	Health       string     `json:"health"`
	Sync         string     `json:"sync"`
	LastSync     *time.Time `json:"last_sync,omitempty"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
}

func (s *Service) CreateRepository(ctx context.Context, repo *Repository) (*Repository, error) {
	repo.ID = generateID()
	repo.CreatedAt = time.Now()
	repo.UpdatedAt = time.Now()
	
	query := `
		INSERT INTO repositories (
			id, name, url, branch, path, status, description, created_at, updated_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
	`
	
	_, err := s.db.ExecContext(ctx, query,
		repo.ID, repo.Name, repo.URL, repo.Branch, repo.Path,
		repo.Status, repo.Description, repo.CreatedAt, repo.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	
	return repo, nil
}

func (s *Service) GetRepository(ctx context.Context, id string) (*Repository, error) {
	query := `
		SELECT id, name, url, branch, path, last_sync, status, description, created_at, updated_at
		FROM repositories WHERE id = ?
	`
	
	var repo Repository
	var lastSync sql.NullTime
	err := s.db.QueryRowContext(ctx, query, id).Scan(
		&repo.ID, &repo.Name, &repo.URL, &repo.Branch, &repo.Path,
		&lastSync, &repo.Status, &repo.Description, &repo.CreatedAt, &repo.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	
	if lastSync.Valid {
		repo.LastSync = &lastSync.Time
	}
	
	return &repo, nil
}

func (s *Service) ListRepositories(ctx context.Context) ([]*Repository, error) {
	query := `
		SELECT id, name, url, branch, path, last_sync, status, description, created_at, updated_at
		FROM repositories ORDER BY created_at DESC
	`
	
	rows, err := s.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	
	var repos []*Repository
	for rows.Next() {
		var repo Repository
		var lastSync sql.NullTime
		err := rows.Scan(
			&repo.ID, &repo.Name, &repo.URL, &repo.Branch, &repo.Path,
			&lastSync, &repo.Status, &repo.Description, &repo.CreatedAt, &repo.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		
		if lastSync.Valid {
			repo.LastSync = &lastSync.Time
		}
		
		repos = append(repos, &repo)
	}
	
	return repos, nil
}

func (s *Service) UpdateRepository(ctx context.Context, repo *Repository) error {
	repo.UpdatedAt = time.Now()
	
	query := `
		UPDATE repositories SET 
			name = ?, url = ?, branch = ?, path = ?, last_sync = ?,
			status = ?, description = ?, updated_at = ?
		WHERE id = ?
	`
	
	_, err := s.db.ExecContext(ctx, query,
		repo.Name, repo.URL, repo.Branch, repo.Path, repo.LastSync,
		repo.Status, repo.Description, repo.UpdatedAt, repo.ID,
	)
	return err
}

func (s *Service) DeleteRepository(ctx context.Context, id string) error {
	query := `DELETE FROM repositories WHERE id = ?`
	_, err := s.db.ExecContext(ctx, query, id)
	return err
}

func (s *Service) CreateApplication(ctx context.Context, app *Application) (*Application, error) {
	app.ID = generateID()
	app.CreatedAt = time.Now()
	app.UpdatedAt = time.Now()
	
	query := `
		INSERT INTO applications (
			id, name, repository_id, path, namespace, status, health, sync_status, created_at, updated_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`
	
	_, err := s.db.ExecContext(ctx, query,
		app.ID, app.Name, app.RepositoryID, app.Path, app.Namespace,
		app.Status, app.Health, app.Sync, app.CreatedAt, app.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	
	return app, nil
}

func (s *Service) ListApplications(ctx context.Context) ([]*Application, error) {
	query := `
		SELECT id, name, repository_id, path, namespace, status, health, sync_status, last_sync, created_at, updated_at
		FROM applications ORDER BY created_at DESC
	`
	
	rows, err := s.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	
	var apps []*Application
	for rows.Next() {
		var app Application
		var lastSync sql.NullTime
		err := rows.Scan(
			&app.ID, &app.Name, &app.RepositoryID, &app.Path, &app.Namespace,
			&app.Status, &app.Health, &app.Sync, &lastSync, &app.CreatedAt, &app.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		
		if lastSync.Valid {
			app.LastSync = &lastSync.Time
		}
		
		apps = append(apps, &app)
	}
	
	return apps, nil
}

func (s *Service) SyncRepository(ctx context.Context, id string) error {
	now := time.Now()
	query := `UPDATE repositories SET last_sync = ?, status = 'synced' WHERE id = ?`
	_, err := s.db.ExecContext(ctx, query, now, id)
	return err
}

func (s *Service) GenerateManifest(manifest map[string]interface{}) (string, error) {
	// Simple YAML generation for testing
	yamlLines := []string{}
	
	if apiVersion, ok := manifest["apiVersion"].(string); ok {
		yamlLines = append(yamlLines, "apiVersion: "+apiVersion)
	}
	
	if kind, ok := manifest["kind"].(string); ok {
		yamlLines = append(yamlLines, "kind: "+kind)
	}
	
	if metadata, ok := manifest["metadata"].(map[string]interface{}); ok {
		yamlLines = append(yamlLines, "metadata:")
		if name, ok := metadata["name"].(string); ok {
			yamlLines = append(yamlLines, "  name: "+name)
		}
		if namespace, ok := metadata["namespace"].(string); ok {
			yamlLines = append(yamlLines, "  namespace: "+namespace)
		}
	}
	
	if spec, ok := manifest["spec"].(map[string]interface{}); ok {
		yamlLines = append(yamlLines, "spec:")
		if replicas, ok := spec["replicas"].(int); ok {
			yamlLines = append(yamlLines, fmt.Sprintf("  replicas: %d", replicas))
		}
	}
	
	return joinLines(yamlLines), nil
}

func (s *Service) ValidateManifest(manifest map[string]interface{}) bool {
	// Basic validation
	if _, hasAPIVersion := manifest["apiVersion"]; !hasAPIVersion {
		return false
	}
	
	if _, hasKind := manifest["kind"]; !hasKind {
		return false
	}
	
	if _, hasMetadata := manifest["metadata"]; !hasMetadata {
		return false
	}
	
	return true
}

func (s *Service) CommitChanges(ctx context.Context, repoID, message string) (string, error) {
	// Mock implementation - would use git client in real implementation
	commitSHA := "abc123def456789"
	return commitSHA, nil
}

func generateID() string {
	return uuid.New().String()
}

func joinLines(lines []string) string {
	result := ""
	for i, line := range lines {
		if i > 0 {
			result += "\n"
		}
		result += line
	}
	return result
}

// Benchmark tests
func BenchmarkCreateRepository(b *testing.B) {
	service, _, cleanup := setupTestGitOpsService(b)
	defer cleanup()

	ctx := context.Background()

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		repo := &Repository{
			Name:        fmt.Sprintf("repo-%d", i),
			URL:         "https://github.com/test/repo.git",
			Branch:      "main",
			Path:        ".",
			Status:      "pending",
			Description: "Benchmark repository",
		}

		_, err := service.CreateRepository(ctx, repo)
		if err != nil {
			b.Fatal(err)
		}
	}
}

func BenchmarkGenerateManifest(b *testing.B) {
	service, _, cleanup := setupTestGitOpsService(b)
	defer cleanup()

	manifest := map[string]interface{}{
		"apiVersion": "apps/v1",
		"kind":       "Deployment",
		"metadata": map[string]interface{}{
			"name":      "test-app",
			"namespace": "default",
		},
		"spec": map[string]interface{}{
			"replicas": 3,
		},
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, err := service.GenerateManifest(manifest)
		if err != nil {
			b.Fatal(err)
		}
	}
}

// Helper for benchmark tests
func setupTestGitOpsService(t testing.TB) (*Service, *sql.DB, func()) {
	// Create in-memory SQLite database
	db, err := sql.Open("sqlite3", ":memory:")
	if err != nil {
		t.Fatalf("Failed to create test database: %v", err)
	}

	service := &Service{
		db:               db,
		baseInfraRepoURL: "https://github.com/test/infra.git",
		localRepoPath:    "/tmp/test-repo",
	}

	// Initialize database schema
	service.initDB()

	cleanup := func() {
		db.Close()
	}

	return service, db, cleanup
}