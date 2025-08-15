package common

import (
	"encoding/json"
	"net/http"
)

// APIResponse is the standard response wrapper
type APIResponse struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
	Message string      `json:"message,omitempty"`
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

// SendSuccessWithMessage sends a successful response with message
func SendSuccessWithMessage(w http.ResponseWriter, message string) {
	SendJSON(w, http.StatusOK, APIResponse{
		Success: true,
		Message: message,
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
