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

type CreateUserRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
	Role     string `json:"role"`
}

type UpdateUserRequest struct {
	Username string `json:"username"`
	Password string `json:"password,omitempty"` // Optional
	Role     string `json:"role"`
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

	// Authenticate user using the auth service
	user, err := h.authService.AuthenticateUser(req.Username, req.Password)
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

// User management endpoints

// POST /api/auth/users - Create new user (admin only)
func (h *AuthHandlers) CreateUser(w http.ResponseWriter, r *http.Request) {
	var req CreateUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Username == "" || req.Password == "" || req.Role == "" {
		http.Error(w, "Username, password, and role are required", http.StatusBadRequest)
		return
	}

	// Create user
	user, err := h.authService.CreateUser(req.Username, req.Password, req.Role)
	if err != nil {
		if err == auth.ErrInvalidRole {
			http.Error(w, "Invalid role", http.StatusBadRequest)
			return
		}
		http.Error(w, "Failed to create user: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Return user info (without password)
	userInfo := UserInfo{
		ID:       user.ID,
		Username: user.Username,
		Role:     user.Role,
		Scopes:   user.Scopes,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(userInfo)
}

// GET /api/auth/users - List all users (admin only)
func (h *AuthHandlers) ListUsers(w http.ResponseWriter, r *http.Request) {
	users, err := h.authService.ListUsers()
	if err != nil {
		if err == auth.ErrUserManagementDisabled {
			http.Error(w, "User management disabled", http.StatusServiceUnavailable)
			return
		}
		http.Error(w, "Failed to list users: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Convert to UserInfo slice
	userInfos := make([]UserInfo, len(users))
	for i, user := range users {
		userInfos[i] = UserInfo{
			ID:       user.ID,
			Username: user.Username,
			Role:     user.Role,
			Scopes:   user.Scopes,
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(userInfos)
}

// PUT /api/auth/users/{id} - Update user (admin only)
func (h *AuthHandlers) UpdateUser(w http.ResponseWriter, r *http.Request) {
	userID := r.PathValue("id")
	if userID == "" {
		http.Error(w, "User ID is required", http.StatusBadRequest)
		return
	}

	var req UpdateUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Username == "" || req.Role == "" {
		http.Error(w, "Username and role are required", http.StatusBadRequest)
		return
	}

	// Update user
	err := h.authService.UpdateUser(userID, req.Username, req.Password, req.Role)
	if err != nil {
		if err == auth.ErrInvalidRole {
			http.Error(w, "Invalid role", http.StatusBadRequest)
			return
		}
		if err == auth.ErrUserManagementDisabled {
			http.Error(w, "User management disabled", http.StatusServiceUnavailable)
			return
		}
		http.Error(w, "Failed to update user: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "User updated successfully"})
}

// DELETE /api/auth/users/{id} - Delete user (admin only)
func (h *AuthHandlers) DeleteUser(w http.ResponseWriter, r *http.Request) {
	userID := r.PathValue("id")
	if userID == "" {
		http.Error(w, "User ID is required", http.StatusBadRequest)
		return
	}

	// Prevent self-deletion
	claims := auth.GetUserFromContext(r.Context())
	if claims != nil && claims.UserID == userID {
		http.Error(w, "Cannot delete your own account", http.StatusBadRequest)
		return
	}

	err := h.authService.DeleteUser(userID)
	if err != nil {
		if err == auth.ErrUserManagementDisabled {
			http.Error(w, "User management disabled", http.StatusServiceUnavailable)
			return
		}
		http.Error(w, "Failed to delete user: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "User deleted successfully"})
}
