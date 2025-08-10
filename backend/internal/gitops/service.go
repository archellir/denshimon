package gitops

import (
	"context"
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"github.com/google/uuid"
	"golang.org/x/crypto/scrypt"
)

type Service struct {
	db  *sql.DB
	key []byte
}

type Repository struct {
	ID          string                 `json:"id"`
	Name        string                 `json:"name"`
	URL         string                 `json:"url"`
	Branch      string                 `json:"branch"`
	AuthType    string                 `json:"auth_type"`
	Credentials map[string]interface{} `json:"credentials,omitempty"`
	LastSync    *time.Time             `json:"last_sync,omitempty"`
	SyncStatus  string                 `json:"sync_status"`
	SyncError   string                 `json:"sync_error,omitempty"`
	CreatedAt   time.Time              `json:"created_at"`
	UpdatedAt   time.Time              `json:"updated_at"`
}

type Application struct {
	ID           string                 `json:"id"`
	Name         string                 `json:"name"`
	RepositoryID string                 `json:"repository_id"`
	Path         string                 `json:"path"`
	Namespace    string                 `json:"namespace"`
	SyncPolicy   map[string]interface{} `json:"sync_policy,omitempty"`
	HealthStatus string                 `json:"health_status"`
	SyncStatus   string                 `json:"sync_status"`
	LastSync     *time.Time             `json:"last_sync,omitempty"`
	SyncError    string                 `json:"sync_error,omitempty"`
	CreatedAt    time.Time              `json:"created_at"`
	UpdatedAt    time.Time              `json:"updated_at"`
}

type CreateRepositoryRequest struct {
	Name        string                 `json:"name"`
	URL         string                 `json:"url"`
	Branch      string                 `json:"branch"`
	AuthType    string                 `json:"auth_type"`
	Credentials map[string]interface{} `json:"credentials,omitempty"`
}

type CreateApplicationRequest struct {
	Name         string                 `json:"name"`
	RepositoryID string                 `json:"repository_id"`
	Path         string                 `json:"path"`
	Namespace    string                 `json:"namespace"`
	SyncPolicy   map[string]interface{} `json:"sync_policy,omitempty"`
}

func NewService(db *sql.DB) *Service {
	// Generate encryption key from environment or create a default one
	secretKey := os.Getenv("GITOPS_ENCRYPTION_KEY")
	if secretKey == "" {
		secretKey = "dev-gitops-key-change-in-production"
	}

	// Derive a consistent key from the secret
	key, err := scrypt.Key([]byte(secretKey), []byte("gitops-salt"), 32768, 8, 1, 32)
	if err != nil {
		log.Fatalf("Failed to derive encryption key: %v", err)
	}

	return &Service{
		db:  db,
		key: key,
	}
}

func (s *Service) encryptCredentials(credentials map[string]interface{}) ([]byte, error) {
	if len(credentials) == 0 {
		return nil, nil
	}

	data, err := json.Marshal(credentials)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal credentials: %w", err)
	}

	block, err := aes.NewCipher(s.key)
	if err != nil {
		return nil, fmt.Errorf("failed to create cipher: %w", err)
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, fmt.Errorf("failed to create GCM: %w", err)
	}

	nonce := make([]byte, gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return nil, fmt.Errorf("failed to generate nonce: %w", err)
	}

	encrypted := gcm.Seal(nonce, nonce, data, nil)
	return encrypted, nil
}

func (s *Service) decryptCredentials(encrypted []byte) (map[string]interface{}, error) {
	if len(encrypted) == 0 {
		return nil, nil
	}

	block, err := aes.NewCipher(s.key)
	if err != nil {
		return nil, fmt.Errorf("failed to create cipher: %w", err)
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, fmt.Errorf("failed to create GCM: %w", err)
	}

	nonceSize := gcm.NonceSize()
	if len(encrypted) < nonceSize {
		return nil, fmt.Errorf("invalid encrypted data")
	}

	nonce, ciphertext := encrypted[:nonceSize], encrypted[nonceSize:]
	decrypted, err := gcm.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to decrypt: %w", err)
	}

	var credentials map[string]interface{}
	if err := json.Unmarshal(decrypted, &credentials); err != nil {
		return nil, fmt.Errorf("failed to unmarshal credentials: %w", err)
	}

	return credentials, nil
}

func (s *Service) CreateRepository(ctx context.Context, req CreateRepositoryRequest) (*Repository, error) {
	if req.Branch == "" {
		req.Branch = "main"
	}

	// Encrypt credentials if provided
	var encryptedCreds []byte
	var err error
	if len(req.Credentials) > 0 {
		encryptedCreds, err = s.encryptCredentials(req.Credentials)
		if err != nil {
			return nil, fmt.Errorf("failed to encrypt credentials: %w", err)
		}
	}

	id := uuid.New().String()
	now := time.Now()

	query := `
		INSERT INTO git_repositories (id, name, url, branch, auth_type, credentials, sync_status, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
	`

	_, err = s.db.ExecContext(ctx, query, id, req.Name, req.URL, req.Branch, req.AuthType, encryptedCreds, "unknown", now, now)
	if err != nil {
		return nil, fmt.Errorf("failed to create repository: %w", err)
	}

	return s.GetRepository(ctx, id)
}

func (s *Service) GetRepository(ctx context.Context, id string) (*Repository, error) {
	query := `
		SELECT id, name, url, branch, auth_type, credentials, last_sync, sync_status, sync_error, created_at, updated_at
		FROM git_repositories WHERE id = ?
	`

	var repo Repository
	var encryptedCreds []byte
	var lastSync sql.NullTime
	var syncError sql.NullString

	err := s.db.QueryRowContext(ctx, query, id).Scan(
		&repo.ID, &repo.Name, &repo.URL, &repo.Branch, &repo.AuthType,
		&encryptedCreds, &lastSync, &repo.SyncStatus, &syncError,
		&repo.CreatedAt, &repo.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to get repository: %w", err)
	}

	if lastSync.Valid {
		repo.LastSync = &lastSync.Time
	}
	if syncError.Valid {
		repo.SyncError = syncError.String
	}

	if len(encryptedCreds) > 0 {
		credentials, err := s.decryptCredentials(encryptedCreds)
		if err != nil {
			log.Printf("Failed to decrypt credentials for repository %s: %v", id, err)
		} else {
			repo.Credentials = credentials
		}
	}

	return &repo, nil
}

func (s *Service) ListRepositories(ctx context.Context) ([]*Repository, error) {
	query := `
		SELECT id, name, url, branch, auth_type, credentials, last_sync, sync_status, sync_error, created_at, updated_at
		FROM git_repositories ORDER BY created_at DESC
	`

	rows, err := s.db.QueryContext(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to list repositories: %w", err)
	}
	defer rows.Close()

	var repositories []*Repository
	for rows.Next() {
		var repo Repository
		var encryptedCreds []byte
		var lastSync sql.NullTime
		var syncError sql.NullString

		err := rows.Scan(
			&repo.ID, &repo.Name, &repo.URL, &repo.Branch, &repo.AuthType,
			&encryptedCreds, &lastSync, &repo.SyncStatus, &syncError,
			&repo.CreatedAt, &repo.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan repository: %w", err)
		}

		if lastSync.Valid {
			repo.LastSync = &lastSync.Time
		}
		if syncError.Valid {
			repo.SyncError = syncError.String
		}

		if len(encryptedCreds) > 0 {
			credentials, err := s.decryptCredentials(encryptedCreds)
			if err != nil {
				log.Printf("Failed to decrypt credentials for repository %s: %v", repo.ID, err)
			} else {
				repo.Credentials = credentials
			}
		}

		repositories = append(repositories, &repo)
	}

	if repositories == nil {
		repositories = []*Repository{}
	}
	return repositories, nil
}

func (s *Service) SyncRepository(ctx context.Context, id string) error {
	repo, err := s.GetRepository(ctx, id)
	if err != nil {
		return fmt.Errorf("failed to get repository: %w", err)
	}

	// Create a temporary directory for cloning
	tempDir, err := os.MkdirTemp("", fmt.Sprintf("gitops-repo-%s-*", repo.ID))
	if err != nil {
		return fmt.Errorf("failed to create temp directory: %w", err)
	}
	defer os.RemoveAll(tempDir)

	// Clone the repository
	err = s.cloneRepository(repo, tempDir)
	if err != nil {
		s.updateRepositorySyncStatus(ctx, id, "error", err.Error())
		return fmt.Errorf("failed to clone repository: %w", err)
	}

	// Update sync status to success
	s.updateRepositorySyncStatus(ctx, id, "synced", "")
	return nil
}

func (s *Service) cloneRepository(repo *Repository, targetDir string) error {
	args := []string{"clone"}

	// Add branch specification
	if repo.Branch != "" {
		args = append(args, "-b", repo.Branch)
	}

	// Handle authentication
	switch repo.AuthType {
	case "token":
		if token, ok := repo.Credentials["token"].(string); ok {
			// For GitHub/GitLab personal access tokens
			if strings.Contains(repo.URL, "github.com") {
				repo.URL = strings.Replace(repo.URL, "https://", fmt.Sprintf("https://%s@", token), 1)
			} else if strings.Contains(repo.URL, "gitlab.com") {
				repo.URL = strings.Replace(repo.URL, "https://", fmt.Sprintf("https://oauth2:%s@", token), 1)
			}
		}
	case "ssh":
		// SSH keys should be handled by SSH agent or ~/.ssh/config
		// For now, we assume SSH is properly configured
	case "none":
		// Public repository, no auth needed
	default:
		return fmt.Errorf("unsupported auth type: %s", repo.AuthType)
	}

	args = append(args, repo.URL, targetDir)

	cmd := exec.Command("git", args...)
	cmd.Env = append(os.Environ(),
		"GIT_TERMINAL_PROMPT=0", // Disable interactive prompts
	)

	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("git clone failed: %w, output: %s", err, string(output))
	}

	return nil
}

func (s *Service) updateRepositorySyncStatus(ctx context.Context, id, status, error string) {
	query := `
		UPDATE git_repositories
		SET last_sync = ?, sync_status = ?, sync_error = ?, updated_at = ?
		WHERE id = ?
	`

	now := time.Now()
	var errorParam sql.NullString
	if error != "" {
		errorParam = sql.NullString{String: error, Valid: true}
	}

	_, err := s.db.ExecContext(ctx, query, now, status, errorParam, now, id)
	if err != nil {
		log.Printf("Failed to update repository sync status: %v", err)
	}
}

func (s *Service) CreateApplication(ctx context.Context, req CreateApplicationRequest) (*Application, error) {
	if req.Path == "" {
		req.Path = "."
	}
	if req.Namespace == "" {
		req.Namespace = "default"
	}

	// Serialize sync policy if provided
	var syncPolicyJSON []byte
	var err error
	if len(req.SyncPolicy) > 0 {
		syncPolicyJSON, err = json.Marshal(req.SyncPolicy)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal sync policy: %w", err)
		}
	}

	id := uuid.New().String()
	now := time.Now()

	query := `
		INSERT INTO applications (id, name, repository_id, path, namespace, sync_policy, health_status, sync_status, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`

	_, err = s.db.ExecContext(ctx, query, id, req.Name, req.RepositoryID, req.Path, req.Namespace, syncPolicyJSON, "unknown", "unknown", now, now)
	if err != nil {
		return nil, fmt.Errorf("failed to create application: %w", err)
	}

	return s.GetApplication(ctx, id)
}

func (s *Service) GetApplication(ctx context.Context, id string) (*Application, error) {
	query := `
		SELECT id, name, repository_id, path, namespace, sync_policy, health_status, sync_status, last_sync, sync_error, created_at, updated_at
		FROM applications WHERE id = ?
	`

	var app Application
	var syncPolicyJSON []byte
	var lastSync sql.NullTime
	var syncError sql.NullString

	err := s.db.QueryRowContext(ctx, query, id).Scan(
		&app.ID, &app.Name, &app.RepositoryID, &app.Path, &app.Namespace,
		&syncPolicyJSON, &app.HealthStatus, &app.SyncStatus, &lastSync, &syncError,
		&app.CreatedAt, &app.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to get application: %w", err)
	}

	if lastSync.Valid {
		app.LastSync = &lastSync.Time
	}
	if syncError.Valid {
		app.SyncError = syncError.String
	}

	if len(syncPolicyJSON) > 0 {
		if err := json.Unmarshal(syncPolicyJSON, &app.SyncPolicy); err != nil {
			log.Printf("Failed to unmarshal sync policy for application %s: %v", id, err)
		}
	}

	return &app, nil
}

func (s *Service) ListApplications(ctx context.Context) ([]*Application, error) {
	query := `
		SELECT id, name, repository_id, path, namespace, sync_policy, health_status, sync_status, last_sync, sync_error, created_at, updated_at
		FROM applications ORDER BY created_at DESC
	`

	rows, err := s.db.QueryContext(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to list applications: %w", err)
	}
	defer rows.Close()

	var applications []*Application
	for rows.Next() {
		var app Application
		var syncPolicyJSON []byte
		var lastSync sql.NullTime
		var syncError sql.NullString

		err := rows.Scan(
			&app.ID, &app.Name, &app.RepositoryID, &app.Path, &app.Namespace,
			&syncPolicyJSON, &app.HealthStatus, &app.SyncStatus, &lastSync, &syncError,
			&app.CreatedAt, &app.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan application: %w", err)
		}

		if lastSync.Valid {
			app.LastSync = &lastSync.Time
		}
		if syncError.Valid {
			app.SyncError = syncError.String
		}

		if len(syncPolicyJSON) > 0 {
			if err := json.Unmarshal(syncPolicyJSON, &app.SyncPolicy); err != nil {
				log.Printf("Failed to unmarshal sync policy for application %s: %v", app.ID, err)
			}
		}

		applications = append(applications, &app)
	}

	if applications == nil {
		applications = []*Application{}
	}
	return applications, nil
}

func (s *Service) SyncApplication(ctx context.Context, id string) error {
	app, err := s.GetApplication(ctx, id)
	if err != nil {
		return fmt.Errorf("failed to get application: %w", err)
	}

	repo, err := s.GetRepository(ctx, app.RepositoryID)
	if err != nil {
		return fmt.Errorf("failed to get repository: %w", err)
	}

	// First sync the repository
	if err := s.SyncRepository(ctx, repo.ID); err != nil {
		return fmt.Errorf("failed to sync repository: %w", err)
	}

	// Create temporary directory for application sync
	tempDir, err := os.MkdirTemp("", fmt.Sprintf("gitops-app-%s-*", app.ID))
	if err != nil {
		return fmt.Errorf("failed to create temp directory: %w", err)
	}
	defer os.RemoveAll(tempDir)

	// Clone repository
	if err := s.cloneRepository(repo, tempDir); err != nil {
		s.updateApplicationSyncStatus(ctx, id, "error", err.Error())
		return fmt.Errorf("failed to clone repository: %w", err)
	}

	// Apply Kubernetes manifests from the application path
	manifestPath := filepath.Join(tempDir, app.Path)
	if err := s.applyManifests(manifestPath, app.Namespace); err != nil {
		s.updateApplicationSyncStatus(ctx, id, "error", err.Error())
		return fmt.Errorf("failed to apply manifests: %w", err)
	}

	// Update application sync status
	s.updateApplicationSyncStatus(ctx, id, "synced", "")
	return nil
}

func (s *Service) applyManifests(manifestPath, namespace string) error {
	// Check if kubectl is available
	if _, err := exec.LookPath("kubectl"); err != nil {
		return fmt.Errorf("kubectl not found: %w", err)
	}

	// Apply manifests using kubectl
	cmd := exec.Command("kubectl", "apply", "-f", manifestPath, "-n", namespace)
	cmd.Env = os.Environ()

	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("kubectl apply failed: %w, output: %s", err, string(output))
	}

	log.Printf("Applied manifests to namespace %s: %s", namespace, string(output))
	return nil
}

func (s *Service) updateApplicationSyncStatus(ctx context.Context, id, status, error string) {
	query := `
		UPDATE applications
		SET last_sync = ?, sync_status = ?, sync_error = ?, updated_at = ?
		WHERE id = ?
	`

	now := time.Now()
	var errorParam sql.NullString
	if error != "" {
		errorParam = sql.NullString{String: error, Valid: true}
	}

	_, err := s.db.ExecContext(ctx, query, now, status, errorParam, now, id)
	if err != nil {
		log.Printf("Failed to update application sync status: %v", err)
	}
}

func (s *Service) DeleteRepository(ctx context.Context, id string) error {
	// First delete all applications that use this repository
	_, err := s.db.ExecContext(ctx, "DELETE FROM applications WHERE repository_id = ?", id)
	if err != nil {
		return fmt.Errorf("failed to delete applications: %w", err)
	}

	// Then delete the repository
	result, err := s.db.ExecContext(ctx, "DELETE FROM git_repositories WHERE id = ?", id)
	if err != nil {
		return fmt.Errorf("failed to delete repository: %w", err)
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get affected rows: %w", err)
	}

	if rows == 0 {
		return fmt.Errorf("repository not found")
	}

	return nil
}

func (s *Service) DeleteApplication(ctx context.Context, id string) error {
	result, err := s.db.ExecContext(ctx, "DELETE FROM applications WHERE id = ?", id)
	if err != nil {
		return fmt.Errorf("failed to delete application: %w", err)
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get affected rows: %w", err)
	}

	if rows == 0 {
		return fmt.Errorf("application not found")
	}

	return nil
}