package http

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestAPIResponse(t *testing.T) {
	tests := []struct {
		name     string
		response APIResponse
		valid    bool
	}{
		{
			name: "success_response",
			response: APIResponse{
				Success: true,
				Data:    "test data",
			},
			valid: true,
		},
		{
			name: "error_response",
			response: APIResponse{
				Success: false,
				Error:   "test error",
			},
			valid: true,
		},
		{
			name: "response_with_message",
			response: APIResponse{
				Success: true,
				Data:    "test data",
				Message: "operation completed",
			},
			valid: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if tt.response.Success && tt.response.Error != "" {
				t.Error("Success response should not have error")
			}
			if !tt.response.Success && tt.response.Data != nil && tt.response.Error == "" {
				t.Error("Failed response should have error or no data")
			}
		})
	}
}

func TestPaginatedResponse(t *testing.T) {
	response := PaginatedResponse{
		Data:    []string{"item1", "item2", "item3"},
		Total:   3,
		Page:    1,
		Limit:   10,
		HasNext: false,
		HasPrev: false,
	}

	if response.Total != 3 {
		t.Errorf("Total = %d, want 3", response.Total)
	}

	if response.HasNext {
		t.Error("HasNext should be false")
	}

	if response.HasPrev {
		t.Error("HasPrev should be false")
	}
}

func TestSendJSON(t *testing.T) {
	rr := httptest.NewRecorder()
	data := map[string]string{"message": "test"}

	SendJSON(rr, http.StatusOK, data)

	if rr.Code != http.StatusOK {
		t.Errorf("Status code = %d, want %d", rr.Code, http.StatusOK)
	}

	contentType := rr.Header().Get("Content-Type")
	if contentType != "application/json" {
		t.Errorf("Content-Type = %q, want %q", contentType, "application/json")
	}
}

func TestSendSuccess(t *testing.T) {
	rr := httptest.NewRecorder()
	data := "test data"

	SendSuccess(rr, data)

	if rr.Code != http.StatusOK {
		t.Errorf("Status code = %d, want %d", rr.Code, http.StatusOK)
	}

	// Response should contain success: true
	body := rr.Body.String()
	if !contains(body, "\"success\":true") {
		t.Error("Response should contain success: true")
	}
}

func TestSendError(t *testing.T) {
	rr := httptest.NewRecorder()
	errorMsg := "test error"

	SendError(rr, http.StatusBadRequest, errorMsg)

	if rr.Code != http.StatusBadRequest {
		t.Errorf("Status code = %d, want %d", rr.Code, http.StatusBadRequest)
	}

	// Response should contain success: false
	body := rr.Body.String()
	if !contains(body, "\"success\":false") {
		t.Error("Response should contain success: false")
	}

	if !contains(body, errorMsg) {
		t.Errorf("Response should contain error message: %q", errorMsg)
	}
}

func TestSendErrorWithMessage(t *testing.T) {
	rr := httptest.NewRecorder()
	errorMsg := "validation failed"
	message := "Please check your input"

	SendErrorWithMessage(rr, http.StatusBadRequest, errorMsg, message)

	if rr.Code != http.StatusBadRequest {
		t.Errorf("Status code = %d, want %d", rr.Code, http.StatusBadRequest)
	}

	body := rr.Body.String()
	if !contains(body, errorMsg) {
		t.Errorf("Response should contain error: %q", errorMsg)
	}

	if !contains(body, message) {
		t.Errorf("Response should contain message: %q", message)
	}
}

func TestSendPaginated(t *testing.T) {
	rr := httptest.NewRecorder()
	data := []string{"item1", "item2", "item3"}
	total := 100
	page := 2
	limit := 10

	SendPaginated(rr, data, total, page, limit)

	if rr.Code != http.StatusOK {
		t.Errorf("Status code = %d, want %d", rr.Code, http.StatusOK)
	}

	body := rr.Body.String()
	if !contains(body, "\"hasNext\":true") {
		t.Error("Response should indicate hasNext: true")
	}

	if !contains(body, "\"hasPrev\":true") {
		t.Error("Response should indicate hasPrev: true")
	}
}

func TestSendMetadata(t *testing.T) {
	rr := httptest.NewRecorder()
	data := []string{"item1", "item2"}
	total := 2
	metadata := map[string]interface{}{
		"version": "1.0",
		"source":  "test",
	}

	SendMetadata(rr, data, total, metadata)

	if rr.Code != http.StatusOK {
		t.Errorf("Status code = %d, want %d", rr.Code, http.StatusOK)
	}

	body := rr.Body.String()
	if !contains(body, "\"version\":\"1.0\"") {
		t.Error("Response should contain metadata version")
	}

	if !contains(body, "\"source\":\"test\"") {
		t.Error("Response should contain metadata source")
	}
}

func TestParsePagination(t *testing.T) {
	tests := []struct {
		name         string
		queryParams  map[string]string
		defaultLimit int
		maxLimit     int
		expectedPage int
		expectedLimit int
	}{
		{
			name:          "default_values",
			queryParams:   map[string]string{},
			defaultLimit:  10,
			maxLimit:      100,
			expectedPage:  1,
			expectedLimit: 10,
		},
		{
			name: "custom_values",
			queryParams: map[string]string{
				"page":  "3",
				"limit": "25",
			},
			defaultLimit:  10,
			maxLimit:      100,
			expectedPage:  3,
			expectedLimit: 25,
		},
		{
			name: "limit_exceeds_max",
			queryParams: map[string]string{
				"page":  "1",
				"limit": "150",
			},
			defaultLimit:  10,
			maxLimit:      100,
			expectedPage:  1,
			expectedLimit: 10, // Should fall back to default
		},
		{
			name: "invalid_values",
			queryParams: map[string]string{
				"page":  "invalid",
				"limit": "also_invalid",
			},
			defaultLimit:  10,
			maxLimit:      100,
			expectedPage:  1,
			expectedLimit: 10,
		},
		{
			name: "zero_page",
			queryParams: map[string]string{
				"page": "0",
			},
			defaultLimit:  10,
			maxLimit:      100,
			expectedPage:  1, // Should default to 1
			expectedLimit: 10,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Create a request with query parameters
			req := httptest.NewRequest("GET", "/test", nil)
			q := req.URL.Query()
			for key, value := range tt.queryParams {
				q.Add(key, value)
			}
			req.URL.RawQuery = q.Encode()

			page, limit := ParsePagination(req, tt.defaultLimit, tt.maxLimit)

			if page != tt.expectedPage {
				t.Errorf("Page = %d, want %d", page, tt.expectedPage)
			}

			if limit != tt.expectedLimit {
				t.Errorf("Limit = %d, want %d", limit, tt.expectedLimit)
			}
		})
	}
}

func TestParseTimeRange(t *testing.T) {
	tests := []struct {
		name         string
		queryParam   string
		defaultRange string
		expected     string
	}{
		{
			name:         "default_range",
			queryParam:   "",
			defaultRange: "24h",
			expected:     "24h",
		},
		{
			name:         "valid_range",
			queryParam:   "1h",
			defaultRange: "24h",
			expected:     "1h",
		},
		{
			name:         "invalid_range",
			queryParam:   "invalid",
			defaultRange: "24h",
			expected:     "24h",
		},
		{
			name:         "valid_7d_range",
			queryParam:   "7d",
			defaultRange: "24h",
			expected:     "7d",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Create a request with query parameter
			req := httptest.NewRequest("GET", "/test", nil)
			if tt.queryParam != "" {
				q := req.URL.Query()
				q.Add("timeRange", tt.queryParam)
				req.URL.RawQuery = q.Encode()
			}

			result := ParseTimeRange(req, tt.defaultRange)

			if result != tt.expected {
				t.Errorf("ParseTimeRange() = %q, want %q", result, tt.expected)
			}
		})
	}
}

func TestErrorResponse(t *testing.T) {
	errResp := ErrorResponse{
		Error:   "validation_failed",
		Message: "Invalid input provided",
		Code:    400,
	}

	if errResp.Error != "validation_failed" {
		t.Errorf("Error = %q, want %q", errResp.Error, "validation_failed")
	}

	if errResp.Code != 400 {
		t.Errorf("Code = %d, want %d", errResp.Code, 400)
	}
}

func TestMetadataResponse(t *testing.T) {
	metadata := map[string]interface{}{
		"timestamp": "2023-01-01T00:00:00Z",
		"version":   "1.0.0",
	}

	response := MetadataResponse{
		Data:     []string{"item1", "item2"},
		Total:    2,
		Metadata: metadata,
	}

	if response.Total != 2 {
		t.Errorf("Total = %d, want 2", response.Total)
	}

	if len(response.Metadata) != 2 {
		t.Errorf("Metadata length = %d, want 2", len(response.Metadata))
	}

	if response.Metadata["version"] != "1.0.0" {
		t.Errorf("Metadata version = %v, want %q", response.Metadata["version"], "1.0.0")
	}
}

// Helper function for testing
func contains(s, substr string) bool {
	return len(s) >= len(substr) && findSubstring(s, substr)
}

func findSubstring(s, substr string) bool {
	if len(substr) == 0 {
		return true
	}
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}

// Benchmark tests
func BenchmarkSendJSON(b *testing.B) {
	data := map[string]string{"message": "test"}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		rr := httptest.NewRecorder()
		SendJSON(rr, http.StatusOK, data)
	}
}

func BenchmarkParsePagination(b *testing.B) {
	req := httptest.NewRequest("GET", "/test?page=2&limit=20", nil)

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		ParsePagination(req, 10, 100)
	}
}