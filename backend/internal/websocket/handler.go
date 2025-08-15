package websocket

import (
	"log/slog"
	"net/http"
	"strings"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		// In production, you should validate the origin properly
		// For development, we allow all origins
		return true
	},
}

// Handler handles WebSocket connections
type Handler struct {
	hub *Hub
}

// NewHandler creates a new WebSocket handler
func NewHandler(hub *Hub) *Handler {
	return &Handler{
		hub: hub,
	}
}

// HandleWebSocket handles WebSocket upgrade and client management
func (h *Handler) HandleWebSocket(w http.ResponseWriter, r *http.Request) {
	// Upgrade HTTP connection to WebSocket
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		slog.Error("Failed to upgrade WebSocket", "error", err)
		return
	}

	// Extract user ID from request (you might get this from JWT token or session)
	userID := h.getUserIDFromRequest(r)
	if userID == "" {
		slog.Error("No user ID found in WebSocket request")
		conn.WriteMessage(websocket.CloseMessage, websocket.FormatCloseMessage(websocket.CloseUnsupportedData, "Authentication required"))
		conn.Close()
		return
	}

	// Create new client
	client := NewClient(conn, h.hub, userID)

	// Register client with hub
	h.hub.register <- client

	// Start client goroutines
	go client.WritePump()
	go client.ReadPump()

	slog.Info("WebSocket connection established", "client_id", client.ID, "user_id", userID)
}

// getUserIDFromRequest extracts user ID from the request
// This could be from JWT token, session cookie, or query parameter
func (h *Handler) getUserIDFromRequest(r *http.Request) string {
	// Try to get user ID from Authorization header (JWT token)
	authHeader := r.Header.Get("Authorization")
	if authHeader != "" {
		// Extract token from "Bearer <token>"
		parts := strings.Split(authHeader, " ")
		if len(parts) == 2 && parts[0] == "Bearer" {
			// TODO: Validate JWT token and extract user ID
			// For now, we'll use a simple approach
			return "admin" // This should be extracted from the validated token
		}
	}

	// Try to get user ID from query parameter (for development)
	if userID := r.URL.Query().Get("user_id"); userID != "" {
		return userID
	}

	// Try to get user ID from session cookie
	if cookie, err := r.Cookie("session"); err == nil {
		// TODO: Validate session and get user ID
		// For now, return a default user ID
		_ = cookie
		return "admin"
	}

	// Default user for development (in production, this should return empty string)
	return "admin"
}

// GetHub returns the WebSocket hub
func (h *Handler) GetHub() *Hub {
	return h.hub
}
