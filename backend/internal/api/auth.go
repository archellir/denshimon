package api

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/archellir/denshimon/internal/auth"
	"github.com/archellir/denshimon/internal/database"
)

type AuthHandlers struct {
	authService *auth.Service
	db          *database.SQLiteDB
}

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type LoginResponse struct {
	Token     string    `json:"token"`
	ExpiresAt time.Time `json:"expires_at"`
	User      UserInfo  `json:"user"`
}

type UserInfo struct {
	ID       string   `json:"id"`
	Username string   `json:"username"`
	Role     string   `json:"role"`
	Scopes   []string `json:"scopes"`
}

type RefreshResponse struct {
	Token     string    `json:"token"`
	ExpiresAt time.Time `json:"expires_at"`
}

func NewAuthHandlers(authService *auth.Service, db *database.SQLiteDB) *AuthHandlers {
	return &AuthHandlers{
		authService: authService,
		db:          db,
	}
}

func (h *AuthHandlers) Login(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Username == "" || req.Password == "" {
		http.Error(w, "Username and password are required", http.StatusBadRequest)
		return
	}

	// TODO: Implement proper user authentication with database
	// For now, use hardcoded demo users
	user, err := h.authenticateUser(req.Username, req.Password)
	if err != nil {
		http.Error(w, "Invalid credentials", http.StatusUnauthorized)
		return
	}

	// Generate token
	duration := 24 * time.Hour
	token, err := h.authService.GenerateToken(user, duration)
	if err != nil {
		http.Error(w, "Failed to generate token", http.StatusInternalServerError)
		return
	}

	// Store session in database
	sessionID := h.authService.GenerateSessionID()
	if err := h.db.SetSession(sessionID, user.ID, duration); err != nil {
		// Log error but don't fail the login
	}

	response := LoginResponse{
		Token:     token,
		ExpiresAt: time.Now().Add(duration),
		User: UserInfo{
			ID:       user.ID,
			Username: user.Username,
			Role:     user.Role,
			Scopes:   user.Scopes,
		},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func (h *AuthHandlers) Logout(w http.ResponseWriter, r *http.Request) {
	// Get token from header
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		http.Error(w, "Missing authorization header", http.StatusBadRequest)
		return
	}

	token := authHeader[len("Bearer "):]
	
	// Revoke token (add to blacklist)
	if err := h.authService.RevokeToken(token); err != nil {
		http.Error(w, "Failed to logout", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Logged out successfully"})
}

func (h *AuthHandlers) Refresh(w http.ResponseWriter, r *http.Request) {
	// Get current user from context (set by auth middleware)
	claims := auth.GetUserFromContext(r.Context())
	if claims == nil {
		http.Error(w, "User not authenticated", http.StatusUnauthorized)
		return
	}

	// Create new user object from claims
	user := &auth.User{
		ID:       claims.UserID,
		Username: claims.Username,
		Role:     claims.Role,
		Scopes:   claims.Scopes,
	}

	// Generate new token
	duration := 24 * time.Hour
	token, err := h.authService.GenerateToken(user, duration)
	if err != nil {
		http.Error(w, "Failed to refresh token", http.StatusInternalServerError)
		return
	}

	response := RefreshResponse{
		Token:     token,
		ExpiresAt: time.Now().Add(duration),
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func (h *AuthHandlers) Me(w http.ResponseWriter, r *http.Request) {
	claims := auth.GetUserFromContext(r.Context())
	if claims == nil {
		http.Error(w, "User not authenticated", http.StatusUnauthorized)
		return
	}

	userInfo := UserInfo{
		ID:       claims.UserID,
		Username: claims.Username,
		Role:     claims.Role,
		Scopes:   claims.Scopes,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(userInfo)
}

// Demo authentication - replace with proper database lookup and password hashing
func (h *AuthHandlers) authenticateUser(username, password string) (*auth.User, error) {
	// Demo users for testing
	users := map[string]*auth.User{
		"admin": {
			ID:       "1",
			Username: "admin",
			Role:     "admin",
			Scopes:   []string{"pods:*", "deployments:*", "gitops:*", "logs:*", "metrics:*"},
		},
		"operator": {
			ID:       "2",
			Username: "operator",
			Role:     "operator",
			Scopes:   []string{"pods:read", "pods:update", "deployments:read", "deployments:update", "gitops:read", "gitops:sync", "logs:read", "metrics:read"},
		},
		"viewer": {
			ID:       "3",
			Username: "viewer",
			Role:     "viewer",
			Scopes:   []string{"pods:read", "deployments:read", "gitops:read", "logs:read", "metrics:read"},
		},
	}

	// Demo password check (all demo users use "password")
	if password != "password" {
		return nil, auth.ErrUnauthorized
	}

	user, exists := users[username]
	if !exists {
		return nil, auth.ErrUnauthorized
	}

	return user, nil
}