package gitea

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strconv"
	"strings"
)

// Handler handles Gitea API requests
type Handler struct {
	client *Client
}

// NewHandler creates a new Gitea handler
func NewHandler() *Handler {
	baseURL := os.Getenv("GITEA_URL")
	token := os.Getenv("GITEA_TOKEN")
	
	if baseURL == "" {
		// Use a default or return nil
		return &Handler{
			client: nil,
		}
	}
	
	client := NewClient(baseURL, token)
	return &Handler{
		client: client,
	}
}

// HandleListRepositories handles GET /api/gitea/repositories
func (h *Handler) HandleListRepositories(w http.ResponseWriter, r *http.Request) {
	if h.client == nil {
		http.Error(w, "Gitea integration not configured", http.StatusServiceUnavailable)
		return
	}

	page := 1
	limit := 20
	
	if p := r.URL.Query().Get("page"); p != "" {
		if val, err := strconv.Atoi(p); err == nil {
			page = val
		}
	}
	
	if l := r.URL.Query().Get("limit"); l != "" {
		if val, err := strconv.Atoi(l); err == nil && val <= 100 {
			limit = val
		}
	}

	repos, err := h.client.ListRepositories(page, limit)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to fetch repositories: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(repos)
}

// HandleGetRepository handles GET /api/gitea/repositories/:owner/:repo
func (h *Handler) HandleGetRepository(w http.ResponseWriter, r *http.Request) {
	if h.client == nil {
		http.Error(w, "Gitea integration not configured", http.StatusServiceUnavailable)
		return
	}

	// Extract owner and repo from path
	path := strings.TrimPrefix(r.URL.Path, "/api/gitea/repositories/")
	parts := strings.Split(path, "/")
	if len(parts) != 2 {
		http.Error(w, "Invalid repository path", http.StatusBadRequest)
		return
	}

	owner := parts[0]
	repo := parts[1]

	repository, err := h.client.GetRepository(owner, repo)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to fetch repository: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(repository)
}

// HandleListCommits handles GET /api/gitea/repositories/:owner/:repo/commits
func (h *Handler) HandleListCommits(w http.ResponseWriter, r *http.Request) {
	if h.client == nil {
		http.Error(w, "Gitea integration not configured", http.StatusServiceUnavailable)
		return
	}

	// Extract owner and repo from path
	path := strings.TrimPrefix(r.URL.Path, "/api/gitea/repositories/")
	path = strings.TrimSuffix(path, "/commits")
	parts := strings.Split(path, "/")
	if len(parts) != 2 {
		http.Error(w, "Invalid repository path", http.StatusBadRequest)
		return
	}

	owner := parts[0]
	repo := parts[1]
	branch := r.URL.Query().Get("branch")
	if branch == "" {
		branch = "main" // Default branch
	}
	
	page := 1
	if p := r.URL.Query().Get("page"); p != "" {
		if val, err := strconv.Atoi(p); err == nil {
			page = val
		}
	}

	commits, err := h.client.ListCommits(owner, repo, branch, page)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to fetch commits: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(commits)
}

// HandleListBranches handles GET /api/gitea/repositories/:owner/:repo/branches
func (h *Handler) HandleListBranches(w http.ResponseWriter, r *http.Request) {
	if h.client == nil {
		http.Error(w, "Gitea integration not configured", http.StatusServiceUnavailable)
		return
	}

	// Extract owner and repo from path
	path := strings.TrimPrefix(r.URL.Path, "/api/gitea/repositories/")
	path = strings.TrimSuffix(path, "/branches")
	parts := strings.Split(path, "/")
	if len(parts) != 2 {
		http.Error(w, "Invalid repository path", http.StatusBadRequest)
		return
	}

	owner := parts[0]
	repo := parts[1]

	branches, err := h.client.ListBranches(owner, repo)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to fetch branches: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(branches)
}

// HandleListPullRequests handles GET /api/gitea/repositories/:owner/:repo/pulls
func (h *Handler) HandleListPullRequests(w http.ResponseWriter, r *http.Request) {
	if h.client == nil {
		http.Error(w, "Gitea integration not configured", http.StatusServiceUnavailable)
		return
	}

	// Extract owner and repo from path
	path := strings.TrimPrefix(r.URL.Path, "/api/gitea/repositories/")
	path = strings.TrimSuffix(path, "/pulls")
	parts := strings.Split(path, "/")
	if len(parts) != 2 {
		http.Error(w, "Invalid repository path", http.StatusBadRequest)
		return
	}

	owner := parts[0]
	repo := parts[1]
	state := r.URL.Query().Get("state")
	if state == "" {
		state = "open"
	}
	
	page := 1
	if p := r.URL.Query().Get("page"); p != "" {
		if val, err := strconv.Atoi(p); err == nil {
			page = val
		}
	}

	prs, err := h.client.ListPullRequests(owner, repo, state, page)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to fetch pull requests: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(prs)
}

// HandleListReleases handles GET /api/gitea/repositories/:owner/:repo/releases
func (h *Handler) HandleListReleases(w http.ResponseWriter, r *http.Request) {
	if h.client == nil {
		http.Error(w, "Gitea integration not configured", http.StatusServiceUnavailable)
		return
	}

	// Extract owner and repo from path
	path := strings.TrimPrefix(r.URL.Path, "/api/gitea/repositories/")
	path = strings.TrimSuffix(path, "/releases")
	parts := strings.Split(path, "/")
	if len(parts) != 2 {
		http.Error(w, "Invalid repository path", http.StatusBadRequest)
		return
	}

	owner := parts[0]
	repo := parts[1]
	
	page := 1
	if p := r.URL.Query().Get("page"); p != "" {
		if val, err := strconv.Atoi(p); err == nil {
			page = val
		}
	}

	releases, err := h.client.ListReleases(owner, repo, page)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to fetch releases: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(releases)
}

// HandleListWorkflowRuns handles GET /api/gitea/repositories/:owner/:repo/actions/runs
func (h *Handler) HandleListWorkflowRuns(w http.ResponseWriter, r *http.Request) {
	if h.client == nil {
		http.Error(w, "Gitea integration not configured", http.StatusServiceUnavailable)
		return
	}

	// Extract owner and repo from path
	path := strings.TrimPrefix(r.URL.Path, "/api/gitea/repositories/")
	path = strings.TrimSuffix(path, "/actions/runs")
	parts := strings.Split(path, "/")
	if len(parts) != 2 {
		http.Error(w, "Invalid repository path", http.StatusBadRequest)
		return
	}

	owner := parts[0]
	repo := parts[1]
	
	page := 1
	if p := r.URL.Query().Get("page"); p != "" {
		if val, err := strconv.Atoi(p); err == nil {
			page = val
		}
	}

	runs, err := h.client.ListWorkflowRuns(owner, repo, page)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to fetch workflow runs: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(runs)
}

// HandleTriggerDeployment handles POST /api/gitea/repositories/:owner/:repo/deploy
func (h *Handler) HandleTriggerDeployment(w http.ResponseWriter, r *http.Request) {
	if h.client == nil {
		http.Error(w, "Gitea integration not configured", http.StatusServiceUnavailable)
		return
	}

	// Extract owner and repo from path
	path := strings.TrimPrefix(r.URL.Path, "/api/gitea/repositories/")
	path = strings.TrimSuffix(path, "/deploy")
	parts := strings.Split(path, "/")
	if len(parts) != 2 {
		http.Error(w, "Invalid repository path", http.StatusBadRequest)
		return
	}

	owner := parts[0]
	repo := parts[1]

	var payload struct {
		Ref         string `json:"ref"`
		Environment string `json:"environment"`
	}
	
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if payload.Ref == "" {
		payload.Ref = "main"
	}
	if payload.Environment == "" {
		payload.Environment = "production"
	}

	err := h.client.TriggerDeployment(owner, repo, payload.Ref, payload.Environment)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to trigger deployment: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"status": "triggered",
		"ref": payload.Ref,
		"environment": payload.Environment,
	})
}

// HandleWebhook handles POST /api/gitea/webhook
func (h *Handler) HandleWebhook(w http.ResponseWriter, r *http.Request) {
	// Verify webhook signature if configured
	secret := os.Getenv("GITEA_WEBHOOK_SECRET")
	if secret != "" {
		signature := r.Header.Get("X-Gitea-Signature")
		// TODO: Verify HMAC signature
		_ = signature
	}

	var payload map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, "Invalid webhook payload", http.StatusBadRequest)
		return
	}

	// Process webhook based on event type
	event := r.Header.Get("X-Gitea-Event")
	
	switch event {
	case "push":
		// Handle push event
		fmt.Printf("Received push event: %v\n", payload)
	case "pull_request":
		// Handle pull request event
		fmt.Printf("Received pull_request event: %v\n", payload)
	case "release":
		// Handle release event
		fmt.Printf("Received release event: %v\n", payload)
	default:
		fmt.Printf("Received unknown event %s: %v\n", event, payload)
	}

	// TODO: Broadcast webhook events via WebSocket to connected clients
	
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "received"})
}