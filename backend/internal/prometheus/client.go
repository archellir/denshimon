// Package prometheus provides a client for querying Prometheus metrics API.
// This package enables the denshimon backend to retrieve real-time metrics
// data from a Prometheus server instead of relying on mock data.
//
// The client connects to Prometheus at:
// http://prometheus-service.monitoring.svc.cluster.local:9090
//
// It supports both instant queries and range queries for time-series data,
// providing metrics for network traffic, storage I/O, and cluster resources.
package prometheus

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"time"
)

// Client provides HTTP client functionality for querying Prometheus API.
// It handles connection pooling, timeouts, and error handling for metric queries.
type Client struct {
	baseURL    string
	httpClient *http.Client
}

// QueryResult represents the response structure from Prometheus API queries.
// It contains the status of the query and the actual metric data.
type QueryResult struct {
	Status string `json:"status"`
	Data   struct {
		ResultType string   `json:"resultType"`
		Result     []Result `json:"result"`
	} `json:"data"`
}

// Result represents a single metric result from Prometheus.
// It contains the metric labels and either a single value (instant query)
// or a series of values over time (range query).
type Result struct {
	Metric map[string]string `json:"metric"`
	Value  []interface{}     `json:"value,omitempty"`  // For instant queries
	Values [][]interface{}   `json:"values,omitempty"` // For range queries
}

// NewClient creates a new Prometheus client with the specified base URL.
// The client is configured with a 30-second timeout for all requests.
//
// Example usage:
//   client := NewClient("http://prometheus-service.monitoring.svc.cluster.local:9090")
func NewClient(baseURL string) *Client {
	return &Client{
		baseURL: baseURL,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// Query executes an instant query against Prometheus, returning the current value
// of the specified PromQL expression. This is used for getting current metrics
// like active connections, current bandwidth usage, etc.
//
// Example:
//   result, err := client.Query(ctx, "sum(node_memory_MemAvailable_bytes)")
func (c *Client) Query(ctx context.Context, query string) (*QueryResult, error) {
	return c.queryAPI(ctx, "/api/v1/query", map[string]string{
		"query": query,
	})
}

// QueryRange executes a range query against Prometheus, returning time-series data
// for the specified PromQL expression over the given time range. This is used for
// generating charts and historical analysis.
//
// Example:
//   start := time.Now().Add(-time.Hour)
//   end := time.Now()
//   step := time.Minute
//   result, err := client.QueryRange(ctx, "rate(cpu_usage[5m])", start, end, step)
func (c *Client) QueryRange(ctx context.Context, query string, start, end time.Time, step time.Duration) (*QueryResult, error) {
	return c.queryAPI(ctx, "/api/v1/query_range", map[string]string{
		"query": query,
		"start": strconv.FormatInt(start.Unix(), 10),
		"end":   strconv.FormatInt(end.Unix(), 10),
		"step":  strconv.FormatInt(int64(step.Seconds()), 10),
	})
}

// queryAPI handles the low-level HTTP communication with Prometheus API.
// It constructs the URL with query parameters, executes the request, and
// parses the JSON response into a QueryResult struct.
func (c *Client) queryAPI(ctx context.Context, endpoint string, params map[string]string) (*QueryResult, error) {
	u, err := url.Parse(c.baseURL + endpoint)
	if err != nil {
		return nil, fmt.Errorf("failed to parse URL: %w", err)
	}

	values := url.Values{}
	for k, v := range params {
		values.Set(k, v)
	}
	u.RawQuery = values.Encode()

	req, err := http.NewRequestWithContext(ctx, "GET", u.String(), nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to execute request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("prometheus API error: %d - %s", resp.StatusCode, string(body))
	}

	var result QueryResult
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	if result.Status != "success" {
		return nil, fmt.Errorf("prometheus query failed: %s", result.Status)
	}

	return &result, nil
}

// IsHealthy checks if the Prometheus server is accessible and responding.
// This is used by the metrics service to determine whether to use real
// Prometheus data or fall back to frontend mock data.
//
// Returns true if Prometheus responds with HTTP 200 to the /-/healthy endpoint.
func (c *Client) IsHealthy(ctx context.Context) bool {
	req, err := http.NewRequestWithContext(ctx, "GET", c.baseURL+"/-/healthy", nil)
	if err != nil {
		return false
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return false
	}
	defer resp.Body.Close()

	return resp.StatusCode == http.StatusOK
}