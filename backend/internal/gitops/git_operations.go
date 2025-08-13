package gitops

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"
)

// GitConfig holds configuration for Git operations
type GitConfig struct {
	UserName  string
	UserEmail string
	SignOff   bool
}

// GitOperation provides Git operations for repositories
type GitOperation struct {
	repoPath string
	config   GitConfig
}

// NewGitOperation creates a new Git operation handler
func NewGitOperation(repoPath string, config GitConfig) *GitOperation {
	return &GitOperation{
		repoPath: repoPath,
		config:   config,
	}
}

// Pull performs a git pull operation
func (g *GitOperation) Pull(branch string) error {
	args := []string{"pull", "origin"}
	if branch != "" {
		args = append(args, branch)
	}
	
	cmd := exec.Command("git", args...)
	cmd.Dir = g.repoPath
	cmd.Env = append(os.Environ(),
		"GIT_TERMINAL_PROMPT=0",
	)
	
	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("git pull failed: %w, output: %s", err, string(output))
	}
	
	return nil
}

// Fetch performs a git fetch operation
func (g *GitOperation) Fetch() error {
	cmd := exec.Command("git", "fetch", "--all", "--prune")
	cmd.Dir = g.repoPath
	cmd.Env = append(os.Environ(),
		"GIT_TERMINAL_PROMPT=0",
	)
	
	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("git fetch failed: %w, output: %s", err, string(output))
	}
	
	return nil
}

// Add stages files for commit
func (g *GitOperation) Add(paths ...string) error {
	if len(paths) == 0 {
		paths = []string{"."}
	}
	
	args := append([]string{"add"}, paths...)
	cmd := exec.Command("git", args...)
	cmd.Dir = g.repoPath
	
	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("git add failed: %w, output: %s", err, string(output))
	}
	
	return nil
}

// Commit creates a new commit
func (g *GitOperation) Commit(message string) error {
	// Configure git user if provided
	if g.config.UserName != "" {
		if err := g.configureGit("user.name", g.config.UserName); err != nil {
			return err
		}
	}
	if g.config.UserEmail != "" {
		if err := g.configureGit("user.email", g.config.UserEmail); err != nil {
			return err
		}
	}
	
	args := []string{"commit", "-m", message}
	if g.config.SignOff {
		args = append(args, "--signoff")
	}
	
	cmd := exec.Command("git", args...)
	cmd.Dir = g.repoPath
	
	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("git commit failed: %w, output: %s", err, string(output))
	}
	
	return nil
}

// Push pushes commits to remote
func (g *GitOperation) Push(branch string, force bool) error {
	args := []string{"push", "origin"}
	if branch != "" {
		args = append(args, branch)
	}
	if force {
		args = append(args, "--force")
	}
	
	cmd := exec.Command("git", args...)
	cmd.Dir = g.repoPath
	cmd.Env = append(os.Environ(),
		"GIT_TERMINAL_PROMPT=0",
	)
	
	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("git push failed: %w, output: %s", err, string(output))
	}
	
	return nil
}

// Status gets the current git status
func (g *GitOperation) Status() (string, error) {
	cmd := exec.Command("git", "status", "--porcelain")
	cmd.Dir = g.repoPath
	
	output, err := cmd.CombinedOutput()
	if err != nil {
		return "", fmt.Errorf("git status failed: %w", err)
	}
	
	return string(output), nil
}

// Diff gets the diff of changes
func (g *GitOperation) Diff(staged bool) (string, error) {
	args := []string{"diff"}
	if staged {
		args = append(args, "--staged")
	}
	
	cmd := exec.Command("git", args...)
	cmd.Dir = g.repoPath
	
	output, err := cmd.CombinedOutput()
	if err != nil {
		return "", fmt.Errorf("git diff failed: %w", err)
	}
	
	return string(output), nil
}

// GetCurrentBranch returns the current branch name
func (g *GitOperation) GetCurrentBranch() (string, error) {
	cmd := exec.Command("git", "rev-parse", "--abbrev-ref", "HEAD")
	cmd.Dir = g.repoPath
	
	output, err := cmd.CombinedOutput()
	if err != nil {
		return "", fmt.Errorf("failed to get current branch: %w", err)
	}
	
	return strings.TrimSpace(string(output)), nil
}

// Checkout switches to a different branch
func (g *GitOperation) Checkout(branch string, create bool) error {
	args := []string{"checkout"}
	if create {
		args = append(args, "-b")
	}
	args = append(args, branch)
	
	cmd := exec.Command("git", args...)
	cmd.Dir = g.repoPath
	
	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("git checkout failed: %w, output: %s", err, string(output))
	}
	
	return nil
}

// GetCommitLog gets the commit history
func (g *GitOperation) GetCommitLog(limit int) ([]CommitInfo, error) {
	args := []string{"log", "--pretty=format:%H|%an|%ae|%at|%s", fmt.Sprintf("-%d", limit)}
	
	cmd := exec.Command("git", args...)
	cmd.Dir = g.repoPath
	
	output, err := cmd.CombinedOutput()
	if err != nil {
		return nil, fmt.Errorf("git log failed: %w", err)
	}
	
	lines := strings.Split(string(output), "\n")
	commits := make([]CommitInfo, 0, len(lines))
	
	for _, line := range lines {
		if line == "" {
			continue
		}
		
		parts := strings.Split(line, "|")
		if len(parts) != 5 {
			continue
		}
		
		timestamp, _ := time.Parse("1136239445", parts[3])
		
		commits = append(commits, CommitInfo{
			Hash:      parts[0],
			Author:    parts[1],
			Email:     parts[2],
			Timestamp: timestamp,
			Message:   parts[4],
		})
	}
	
	return commits, nil
}

// CommitInfo holds information about a commit
type CommitInfo struct {
	Hash      string    `json:"hash"`
	Author    string    `json:"author"`
	Email     string    `json:"email"`
	Timestamp time.Time `json:"timestamp"`
	Message   string    `json:"message"`
}

// configureGit sets a git configuration value
func (g *GitOperation) configureGit(key, value string) error {
	cmd := exec.Command("git", "config", key, value)
	cmd.Dir = g.repoPath
	
	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("git config %s failed: %w, output: %s", key, err, string(output))
	}
	
	return nil
}

// Enhanced Service methods for Git operations

// PullRepository pulls latest changes from a repository
func (s *Service) PullRepository(ctx context.Context, id string) error {
	repo, err := s.GetRepository(ctx, id)
	if err != nil {
		return fmt.Errorf("failed to get repository: %w", err)
	}
	
	// Create temporary directory for operations
	tempDir, err := os.MkdirTemp("", fmt.Sprintf("gitops-pull-%s-*", repo.ID))
	if err != nil {
		return fmt.Errorf("failed to create temp directory: %w", err)
	}
	defer os.RemoveAll(tempDir)
	
	// Clone the repository first
	if err := s.cloneRepository(repo, tempDir); err != nil {
		return fmt.Errorf("failed to clone repository: %w", err)
	}
	
	// Perform pull operation
	gitOp := NewGitOperation(tempDir, GitConfig{})
	if err := gitOp.Pull(repo.Branch); err != nil {
		s.updateRepositorySyncStatus(ctx, id, "error", err.Error())
		return fmt.Errorf("failed to pull repository: %w", err)
	}
	
	s.updateRepositorySyncStatus(ctx, id, "synced", "")
	return nil
}

// GetRepositoryStatus gets the status of a repository
func (s *Service) GetRepositoryStatus(ctx context.Context, id string) (map[string]interface{}, error) {
	repo, err := s.GetRepository(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get repository: %w", err)
	}
	
	// Create temporary directory for operations
	tempDir, err := os.MkdirTemp("", fmt.Sprintf("gitops-status-%s-*", repo.ID))
	if err != nil {
		return nil, fmt.Errorf("failed to create temp directory: %w", err)
	}
	defer os.RemoveAll(tempDir)
	
	// Clone the repository
	if err := s.cloneRepository(repo, tempDir); err != nil {
		return nil, fmt.Errorf("failed to clone repository: %w", err)
	}
	
	gitOp := NewGitOperation(tempDir, GitConfig{})
	
	// Get current branch
	branch, err := gitOp.GetCurrentBranch()
	if err != nil {
		return nil, fmt.Errorf("failed to get current branch: %w", err)
	}
	
	// Get status
	status, err := gitOp.Status()
	if err != nil {
		return nil, fmt.Errorf("failed to get status: %w", err)
	}
	
	// Get recent commits
	commits, err := gitOp.GetCommitLog(10)
	if err != nil {
		return nil, fmt.Errorf("failed to get commit log: %w", err)
	}
	
	return map[string]interface{}{
		"repository_id": id,
		"branch":        branch,
		"status":        status,
		"commits":       commits,
		"synced_at":     time.Now(),
	}, nil
}

// CommitAndPush commits changes and pushes to remote
func (s *Service) CommitAndPush(ctx context.Context, id string, message string, paths []string) error {
	repo, err := s.GetRepository(ctx, id)
	if err != nil {
		return fmt.Errorf("failed to get repository: %w", err)
	}
	
	// Create temporary directory for operations
	tempDir, err := os.MkdirTemp("", fmt.Sprintf("gitops-commit-%s-*", repo.ID))
	if err != nil {
		return fmt.Errorf("failed to create temp directory: %w", err)
	}
	defer os.RemoveAll(tempDir)
	
	// Clone the repository
	if err := s.cloneRepository(repo, tempDir); err != nil {
		return fmt.Errorf("failed to clone repository: %w", err)
	}
	
	gitOp := NewGitOperation(tempDir, GitConfig{
		UserName:  "Denshimon GitOps",
		UserEmail: "gitops@denshimon.local",
		SignOff:   true,
	})
	
	// Add files
	if err := gitOp.Add(paths...); err != nil {
		return fmt.Errorf("failed to add files: %w", err)
	}
	
	// Commit
	if err := gitOp.Commit(message); err != nil {
		return fmt.Errorf("failed to commit: %w", err)
	}
	
	// Push
	if err := gitOp.Push(repo.Branch, false); err != nil {
		return fmt.Errorf("failed to push: %w", err)
	}
	
	s.updateRepositorySyncStatus(ctx, id, "synced", "")
	return nil
}

// DiffRepository gets the diff of changes in a repository
func (s *Service) DiffRepository(ctx context.Context, id string, appPath string) (string, error) {
	repo, err := s.GetRepository(ctx, id)
	if err != nil {
		return "", fmt.Errorf("failed to get repository: %w", err)
	}
	
	// Create temporary directory for operations
	tempDir, err := os.MkdirTemp("", fmt.Sprintf("gitops-diff-%s-*", repo.ID))
	if err != nil {
		return "", fmt.Errorf("failed to create temp directory: %w", err)
	}
	defer os.RemoveAll(tempDir)
	
	// Clone the repository
	if err := s.cloneRepository(repo, tempDir); err != nil {
		return "", fmt.Errorf("failed to clone repository: %w", err)
	}
	
	// If appPath is provided, get diff for specific path
	workDir := tempDir
	if appPath != "" {
		workDir = filepath.Join(tempDir, appPath)
	}
	
	gitOp := NewGitOperation(workDir, GitConfig{})
	
	// Get diff
	diff, err := gitOp.Diff(false)
	if err != nil {
		return "", fmt.Errorf("failed to get diff: %w", err)
	}
	
	return diff, nil
}