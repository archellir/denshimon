package api

import (
	"encoding/json"
	"net/http"
	"strconv"
)

// Common API response structures

// APIResponse is the standard response wrapper
type APIResponse struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
	Message string      `json:"message,omitempty"`
}

// PaginatedResponse for paginated data
type PaginatedResponse struct {
	Data    interface{} `json:"data"`
	Total   int         `json:"total"`
	Page    int         `json:"page"`
	Limit   int         `json:"limit"`
	HasNext bool        `json:"hasNext"`
	HasPrev bool        `json:"hasPrev"`
}

// MetadataResponse includes additional metadata
type MetadataResponse struct {
	Data     interface{}            `json:"data"`
	Total    int                    `json:"total,omitempty"`
	Metadata map[string]interface{} `json:"metadata,omitempty"`
}

// ErrorResponse for error responses
type ErrorResponse struct {
	Error   string `json:"error"`
	Message string `json:"message,omitempty"`
	Code    int    `json:"code,omitempty"`
}

// Helper functions for consistent responses

// SendJSON sends a JSON response
func SendJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

// SendSuccess sends a successful response
func SendSuccess(w http.ResponseWriter, data interface{}) {
	SendJSON(w, http.StatusOK, APIResponse{
		Success: true,
		Data:    data,
	})
}

// SendError sends an error response
func SendError(w http.ResponseWriter, status int, err string) {
	SendJSON(w, status, APIResponse{
		Success: false,
		Error:   err,
	})
}

// SendErrorWithMessage sends an error with additional message
func SendErrorWithMessage(w http.ResponseWriter, status int, err string, message string) {
	SendJSON(w, status, APIResponse{
		Success: false,
		Error:   err,
		Message: message,
	})
}

// SendPaginated sends a paginated response
func SendPaginated(w http.ResponseWriter, data interface{}, total, page, limit int) {
	hasNext := (page * limit) < total
	hasPrev := page > 1
	
	SendJSON(w, http.StatusOK, PaginatedResponse{
		Data:    data,
		Total:   total,
		Page:    page,
		Limit:   limit,
		HasNext: hasNext,
		HasPrev: hasPrev,
	})
}

// SendMetadata sends a response with metadata
func SendMetadata(w http.ResponseWriter, data interface{}, total int, metadata map[string]interface{}) {
	SendJSON(w, http.StatusOK, MetadataResponse{
		Data:     data,
		Total:    total,
		Metadata: metadata,
	})
}

// ParsePagination extracts pagination parameters from request
func ParsePagination(r *http.Request, defaultLimit, maxLimit int) (page, limit int) {
	page = 1
	limit = defaultLimit
	
	if p := r.URL.Query().Get("page"); p != "" {
		if parsed, err := strconv.Atoi(p); err == nil && parsed > 0 {
			page = parsed
		}
	}
	
	if l := r.URL.Query().Get("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 && parsed <= maxLimit {
			limit = parsed
		}
	}
	
	return page, limit
}

// ParseTimeRange extracts and validates time range parameter
func ParseTimeRange(r *http.Request, defaultRange string) string {
	timeRange := r.URL.Query().Get("timeRange")
	if timeRange == "" {
		return defaultRange
	}
	
	// Validate against known time ranges
	validRanges := map[string]bool{
		"5m": true, "15m": true, "1h": true, "6h": true,
		"12h": true, "24h": true, "48h": true, "7d": true, "30d": true,
	}
	
	if validRanges[timeRange] {
		return timeRange
	}
	
	return defaultRange
}