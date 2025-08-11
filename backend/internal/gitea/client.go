package gitea

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

// Client represents a Gitea API client
type Client struct {
	baseURL    string
	token      string
	httpClient *http.Client
}

// NewClient creates a new Gitea API client
func NewClient(baseURL, token string) *Client {
	return &Client{
		baseURL: baseURL,
		token:   token,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// Repository represents a Gitea repository
type Repository struct {
	ID              int64     `json:"id"`
	Name            string    `json:"name"`
	FullName        string    `json:"full_name"`
	Description     string    `json:"description"`
	Private         bool      `json:"private"`
	Fork            bool      `json:"fork"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
	PushedAt        time.Time `json:"pushed_at"`
	Size            int       `json:"size"`
	StargazersCount int       `json:"stargazers_count"`
	WatchersCount   int       `json:"watchers_count"`
	ForksCount      int       `json:"forks_count"`
	OpenIssuesCount int       `json:"open_issues_count"`
	DefaultBranch   string    `json:"default_branch"`
	Archived        bool      `json:"archived"`
	CloneURL        string    `json:"clone_url"`
	SSHURL          string    `json:"ssh_url"`
	HTMLURL         string    `json:"html_url"`
	Owner           struct {
		ID        int64  `json:"id"`
		Login     string `json:"login"`
		AvatarURL string `json:"avatar_url"`
	} `json:"owner"`
}

// Commit represents a Git commit
type Commit struct {
	SHA    string `json:"sha"`
	Commit struct {
		Author struct {
			Name  string    `json:"name"`
			Email string    `json:"email"`
			Date  time.Time `json:"date"`
		} `json:"author"`
		Committer struct {
			Name  string    `json:"name"`
			Email string    `json:"email"`
			Date  time.Time `json:"date"`
		} `json:"committer"`
		Message string `json:"message"`
	} `json:"commit"`
	Author struct {
		ID        int64  `json:"id"`
		Login     string `json:"login"`
		AvatarURL string `json:"avatar_url"`
	} `json:"author,omitempty"`
}

// Branch represents a Git branch
type Branch struct {
	Name      string `json:"name"`
	Commit    Commit `json:"commit"`
	Protected bool   `json:"protected"`
}

// PullRequest represents a pull request
type PullRequest struct {
	ID        int64      `json:"id"`
	Number    int        `json:"number"`
	State     string     `json:"state"`
	Title     string     `json:"title"`
	Body      string     `json:"body"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`
	ClosedAt  *time.Time `json:"closed_at,omitempty"`
	MergedAt  *time.Time `json:"merged_at,omitempty"`
	Head      struct {
		Label string `json:"label"`
		Ref   string `json:"ref"`
		SHA   string `json:"sha"`
	} `json:"head"`
	Base struct {
		Label string `json:"label"`
		Ref   string `json:"ref"`
		SHA   string `json:"sha"`
	} `json:"base"`
	User struct {
		ID        int64  `json:"id"`
		Login     string `json:"login"`
		AvatarURL string `json:"avatar_url"`
	} `json:"user"`
}

// Release represents a GitHub release
type Release struct {
	ID              int64     `json:"id"`
	TagName         string    `json:"tag_name"`
	TargetCommitish string    `json:"target_commitish"`
	Name            string    `json:"name"`
	Body            string    `json:"body"`
	Draft           bool      `json:"draft"`
	Prerelease      bool      `json:"prerelease"`
	CreatedAt       time.Time `json:"created_at"`
	PublishedAt     time.Time `json:"published_at"`
	Author          struct {
		ID        int64  `json:"id"`
		Login     string `json:"login"`
		AvatarURL string `json:"avatar_url"`
	} `json:"author"`
}

// WorkflowRun represents a Gitea Actions workflow run
type WorkflowRun struct {
	ID         int64     `json:"id"`
	Name       string    `json:"name"`
	HeadBranch string    `json:"head_branch"`
	HeadSHA    string    `json:"head_sha"`
	RunNumber  int       `json:"run_number"`
	Event      string    `json:"event"`
	Status     string    `json:"status"`
	Conclusion string    `json:"conclusion,omitempty"`
	WorkflowID int64     `json:"workflow_id"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

// doRequest performs an HTTP request to the Gitea API
func (c *Client) doRequest(method, endpoint string, body interface{}) (*http.Response, error) {
	url := fmt.Sprintf("%s%s", c.baseURL, endpoint)
	
	var reqBody io.Reader
	if body != nil {
		jsonBody, err := json.Marshal(body)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal request body: %w", err)
		}
		reqBody = bytes.NewBuffer(jsonBody)
	}

	req, err := http.NewRequest(method, url, reqBody)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	if c.token != "" {
		req.Header.Set("Authorization", fmt.Sprintf("token %s", c.token))
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("request failed: %w", err)
	}

	if resp.StatusCode >= 400 {
		body, _ := io.ReadAll(resp.Body)
		resp.Body.Close()
		return nil, fmt.Errorf("API error: %s - %s", resp.Status, string(body))
	}

	return resp, nil
}

// ListRepositories lists repositories accessible to the authenticated user
func (c *Client) ListRepositories(page, limit int) ([]Repository, error) {
	endpoint := fmt.Sprintf("/api/v1/user/repos?page=%d&limit=%d", page, limit)
	resp, err := c.doRequest("GET", endpoint, nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var repos []Repository
	if err := json.NewDecoder(resp.Body).Decode(&repos); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return repos, nil
}

// GetRepository gets a specific repository
func (c *Client) GetRepository(owner, repo string) (*Repository, error) {
	endpoint := fmt.Sprintf("/api/v1/repos/%s/%s", owner, repo)
	resp, err := c.doRequest("GET", endpoint, nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var repository Repository
	if err := json.NewDecoder(resp.Body).Decode(&repository); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return &repository, nil
}

// ListCommits lists commits for a repository
func (c *Client) ListCommits(owner, repo string, branch string, page int) ([]Commit, error) {
	endpoint := fmt.Sprintf("/api/v1/repos/%s/%s/commits?sha=%s&page=%d", owner, repo, branch, page)
	resp, err := c.doRequest("GET", endpoint, nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var commits []Commit
	if err := json.NewDecoder(resp.Body).Decode(&commits); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return commits, nil
}

// ListBranches lists branches for a repository
func (c *Client) ListBranches(owner, repo string) ([]Branch, error) {
	endpoint := fmt.Sprintf("/api/v1/repos/%s/%s/branches", owner, repo)
	resp, err := c.doRequest("GET", endpoint, nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var branches []Branch
	if err := json.NewDecoder(resp.Body).Decode(&branches); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return branches, nil
}

// ListPullRequests lists pull requests for a repository
func (c *Client) ListPullRequests(owner, repo, state string, page int) ([]PullRequest, error) {
	endpoint := fmt.Sprintf("/api/v1/repos/%s/%s/pulls?state=%s&page=%d", owner, repo, state, page)
	resp, err := c.doRequest("GET", endpoint, nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var prs []PullRequest
	if err := json.NewDecoder(resp.Body).Decode(&prs); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return prs, nil
}

// ListReleases lists releases for a repository
func (c *Client) ListReleases(owner, repo string, page int) ([]Release, error) {
	endpoint := fmt.Sprintf("/api/v1/repos/%s/%s/releases?page=%d", owner, repo, page)
	resp, err := c.doRequest("GET", endpoint, nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var releases []Release
	if err := json.NewDecoder(resp.Body).Decode(&releases); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return releases, nil
}

// ListWorkflowRuns lists workflow runs for a repository (if Gitea Actions is enabled)
func (c *Client) ListWorkflowRuns(owner, repo string, page int) ([]WorkflowRun, error) {
	endpoint := fmt.Sprintf("/api/v1/repos/%s/%s/actions/runs?page=%d", owner, repo, page)
	resp, err := c.doRequest("GET", endpoint, nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var runs []WorkflowRun
	if err := json.NewDecoder(resp.Body).Decode(&runs); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return runs, nil
}

// CreateWebhook creates a webhook for a repository
func (c *Client) CreateWebhook(owner, repo, url string, events []string) error {
	endpoint := fmt.Sprintf("/api/v1/repos/%s/%s/hooks", owner, repo)
	
	webhook := map[string]interface{}{
		"type": "gitea",
		"config": map[string]string{
			"url":          url,
			"content_type": "json",
		},
		"events": events,
		"active": true,
	}
	
	resp, err := c.doRequest("POST", endpoint, webhook)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	
	return nil
}

// TriggerDeployment triggers a deployment workflow
func (c *Client) TriggerDeployment(owner, repo, ref, environment string) error {
	endpoint := fmt.Sprintf("/api/v1/repos/%s/%s/actions/workflows/deploy.yml/dispatches", owner, repo)
	
	payload := map[string]interface{}{
		"ref": ref,
		"inputs": map[string]string{
			"environment": environment,
		},
	}
	
	resp, err := c.doRequest("POST", endpoint, payload)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	
	return nil
}