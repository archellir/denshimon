// Package git provides Git client operations for GitOps functionality.
// It handles repository cloning, committing, pushing, and synchronization
// with the base infrastructure repository.
package git

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"
)

// Client wraps Git operations for repository management
type Client struct {
	repoPath string
	repoURL  string
	branch   string
}

// Repository represents a Git repository configuration
type Repository struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	URL      string `json:"url"`
	Branch   string `json:"branch"`
	Path     string `json:"path"`
	LastSync *time.Time `json:"last_sync,omitempty"`
	Status   string `json:"status"`
}

// CommitInfo represents a Git commit
type CommitInfo struct {
	Hash      string    `json:"hash"`
	Author    string    `json:"author"`
	Message   string    `json:"message"`
	Timestamp time.Time `json:"timestamp"`
	Files     []string  `json:"files"`
}

// DiffInfo represents changes between commits
type DiffInfo struct {
	Added    []string `json:"added"`
	Modified []string `json:"modified"`
	Deleted  []string `json:"deleted"`
}

// NewClient creates a new Git client for the specified repository
func NewClient(repoURL, localPath, branch string) *Client {
	if branch == "" {
		branch = "main"
	}
	return &Client{
		repoPath: localPath,
		repoURL:  repoURL,
		branch:   branch,
	}
}

// Clone clones the repository to the local path
func (c *Client) Clone() error {
	// Check if repository already exists
	if _, err := os.Stat(filepath.Join(c.repoPath, ".git")); err == nil {
		return c.Pull() // Repository exists, just pull latest changes
	}

	// Ensure parent directory exists
	if err := os.MkdirAll(filepath.Dir(c.repoPath), 0755); err != nil {
		return fmt.Errorf("failed to create directory: %w", err)
	}

	cmd := exec.Command("git", "clone", "-b", c.branch, c.repoURL, c.repoPath)
	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("failed to clone repository: %s", string(output))
	}

	return nil
}

// Pull fetches and merges the latest changes from remote
func (c *Client) Pull() error {
	cmd := exec.Command("git", "pull", "origin", c.branch)
	cmd.Dir = c.repoPath
	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("failed to pull: %s", string(output))
	}
	return nil
}

// Add stages files for commit
func (c *Client) Add(files ...string) error {
	if len(files) == 0 {
		files = []string{"."}
	}
	
	args := append([]string{"add"}, files...)
	cmd := exec.Command("git", args...)
	cmd.Dir = c.repoPath
	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("failed to add files: %s", string(output))
	}
	return nil
}

// Commit creates a new commit with the specified message
func (c *Client) Commit(message string) error {
	cmd := exec.Command("git", "commit", "-m", message)
	cmd.Dir = c.repoPath
	output, err := cmd.CombinedOutput()
	if err != nil {
		// Check if there are no changes to commit
		if strings.Contains(string(output), "nothing to commit") {
			return nil // Not an error, just no changes
		}
		return fmt.Errorf("failed to commit: %s", string(output))
	}
	return nil
}

// Push pushes commits to the remote repository
func (c *Client) Push() error {
	cmd := exec.Command("git", "push", "origin", c.branch)
	cmd.Dir = c.repoPath
	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("failed to push: %s", string(output))
	}
	return nil
}

// Status returns the current repository status
func (c *Client) Status() (string, error) {
	cmd := exec.Command("git", "status", "--porcelain")
	cmd.Dir = c.repoPath
	output, err := cmd.CombinedOutput()
	if err != nil {
		return "", fmt.Errorf("failed to get status: %w", err)
	}
	return strings.TrimSpace(string(output)), nil
}

// Diff returns the differences between commits or working directory
func (c *Client) Diff(commit1, commit2 string) (*DiffInfo, error) {
	args := []string{"diff", "--name-status"}
	if commit1 != "" && commit2 != "" {
		args = append(args, fmt.Sprintf("%s..%s", commit1, commit2))
	}

	cmd := exec.Command("git", args...)
	cmd.Dir = c.repoPath
	output, err := cmd.CombinedOutput()
	if err != nil {
		return nil, fmt.Errorf("failed to get diff: %w", err)
	}

	diff := &DiffInfo{
		Added:    []string{},
		Modified: []string{},
		Deleted:  []string{},
	}

	lines := strings.Split(strings.TrimSpace(string(output)), "\n")
	for _, line := range lines {
		if line == "" {
			continue
		}
		
		parts := strings.SplitN(line, "\t", 2)
		if len(parts) != 2 {
			continue
		}

		status, file := parts[0], parts[1]
		switch status {
		case "A":
			diff.Added = append(diff.Added, file)
		case "M":
			diff.Modified = append(diff.Modified, file)
		case "D":
			diff.Deleted = append(diff.Deleted, file)
		}
	}

	return diff, nil
}

// Log returns commit history
func (c *Client) Log(limit int) ([]CommitInfo, error) {
	args := []string{"log", "--pretty=format:%H|%an|%s|%ct", "-n", fmt.Sprintf("%d", limit)}
	cmd := exec.Command("git", args...)
	cmd.Dir = c.repoPath
	output, err := cmd.CombinedOutput()
	if err != nil {
		return nil, fmt.Errorf("failed to get log: %w", err)
	}

	var commits []CommitInfo
	lines := strings.Split(strings.TrimSpace(string(output)), "\n")
	for _, line := range lines {
		if line == "" {
			continue
		}

		parts := strings.Split(line, "|")
		if len(parts) != 4 {
			continue
		}

		// Parse timestamp
		timestamp := time.Unix(0, 0)
		if ts, err := time.Parse("1136073600", parts[3]); err == nil {
			timestamp = ts
		}

		commits = append(commits, CommitInfo{
			Hash:      parts[0],
			Author:    parts[1],
			Message:   parts[2],
			Timestamp: timestamp,
		})
	}

	return commits, nil
}

// WriteFile writes content to a file in the repository
func (c *Client) WriteFile(relativePath string, content []byte) error {
	fullPath := filepath.Join(c.repoPath, relativePath)
	
	// Ensure directory exists
	if err := os.MkdirAll(filepath.Dir(fullPath), 0755); err != nil {
		return fmt.Errorf("failed to create directory: %w", err)
	}

	if err := os.WriteFile(fullPath, content, 0644); err != nil {
		return fmt.Errorf("failed to write file: %w", err)
	}

	return nil
}

// ReadFile reads content from a file in the repository
func (c *Client) ReadFile(relativePath string) ([]byte, error) {
	fullPath := filepath.Join(c.repoPath, relativePath)
	content, err := os.ReadFile(fullPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read file: %w", err)
	}
	return content, nil
}

// IsReachable checks if the remote repository is reachable
func (c *Client) IsReachable() bool {
	cmd := exec.Command("git", "ls-remote", "--exit-code", "--heads", c.repoURL)
	err := cmd.Run()
	return err == nil
}

// CommitAndPush is a convenience method that adds, commits, and pushes changes
func (c *Client) CommitAndPush(message string, files ...string) error {
	if err := c.Add(files...); err != nil {
		return fmt.Errorf("failed to add files: %w", err)
	}

	if err := c.Commit(message); err != nil {
		return fmt.Errorf("failed to commit: %w", err)
	}

	if err := c.Push(); err != nil {
		return fmt.Errorf("failed to push: %w", err)
	}

	return nil
}