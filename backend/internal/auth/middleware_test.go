package auth

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestAuthMiddleware(t *testing.T) {
	service := setupTestService(t)
	
	// Create a test user and token
	user := &User{
		ID:       "user-123",
		Username: "testuser",
		Role:     "admin",
	}
	
	token, err := service.GenerateToken(user)
	if err != nil {
		t.Fatalf("Failed to generate token: %v", err)
	}
	
	// Test handler that checks if user is in context
	testHandler := func(w http.ResponseWriter, r *http.Request) {
		claims, ok := r.Context().Value(UserContextKey).(*Claims)
		if !ok {
			t.Error("User claims not found in context")
			http.Error(w, "User not found in context", http.StatusInternalServerError)
			return
		}
		
		if claims.UserID != user.ID {
			t.Errorf("Claims.UserID = %q, want %q", claims.UserID, user.ID)
		}
		
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("success"))
	}
	
	// Wrap with auth middleware
	protectedHandler := service.AuthMiddleware(testHandler)
	
	tests := []struct {
		name           string
		authHeader     string
		expectedStatus int
		expectedBody   string
	}{
		{
			name:           "valid_token",
			authHeader:     "Bearer " + token,
			expectedStatus: http.StatusOK,
			expectedBody:   "success",
		},
		{
			name:           "missing_header",
			authHeader:     "",
			expectedStatus: http.StatusUnauthorized,
			expectedBody:   "Missing authorization header\n",
		},
		{
			name:           "invalid_format_no_bearer",
			authHeader:     token,
			expectedStatus: http.StatusUnauthorized,
			expectedBody:   "Invalid authorization header format\n",
		},
		{
			name:           "invalid_format_wrong_prefix",
			authHeader:     "Basic " + token,
			expectedStatus: http.StatusUnauthorized,
			expectedBody:   "Invalid authorization header format\n",
		},
		{
			name:           "empty_token",
			authHeader:     "Bearer ",
			expectedStatus: http.StatusUnauthorized,
			expectedBody:   "Missing token\n",
		},
		{
			name:           "invalid_token",
			authHeader:     "Bearer invalid-token",
			expectedStatus: http.StatusUnauthorized,
			expectedBody:   "Invalid token: invalid token\n",
		},
	}
	
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest("GET", "/protected", nil)
			if tt.authHeader != "" {
				req.Header.Set("Authorization", tt.authHeader)
			}
			
			rr := httptest.NewRecorder()
			protectedHandler(rr, req)
			
			if rr.Code != tt.expectedStatus {
				t.Errorf("Status code = %d, want %d", rr.Code, tt.expectedStatus)
			}
			
			if rr.Body.String() != tt.expectedBody {
				t.Errorf("Response body = %q, want %q", rr.Body.String(), tt.expectedBody)
			}
		})
	}
}

func TestRequireRole(t *testing.T) {
	service := setupTestService(t)
	
	// Create users with different roles
	adminUser := &User{ID: "admin-1", Username: "admin", Role: "admin"}
	userUser := &User{ID: "user-1", Username: "user", Role: "user"}
	viewerUser := &User{ID: "viewer-1", Username: "viewer", Role: "viewer"}
	
	adminToken, _ := service.GenerateToken(adminUser)
	userToken, _ := service.GenerateToken(userUser)
	viewerToken, _ := service.GenerateToken(viewerUser)
	
	// Test handler
	testHandler := func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("success"))
	}
	
	tests := []struct {
		name           string
		requiredRole   string
		token          string
		expectedStatus int
	}{
		{
			name:           "admin_accessing_admin_endpoint",
			requiredRole:   "admin",
			token:          adminToken,
			expectedStatus: http.StatusOK,
		},
		{
			name:           "user_accessing_user_endpoint",
			requiredRole:   "user",
			token:          userToken,
			expectedStatus: http.StatusOK,
		},
		{
			name:           "admin_accessing_user_endpoint",
			requiredRole:   "user",
			token:          adminToken,
			expectedStatus: http.StatusOK, // Admin can access user endpoints
		},
		{
			name:           "user_accessing_admin_endpoint",
			requiredRole:   "admin",
			token:          userToken,
			expectedStatus: http.StatusForbidden,
		},
		{
			name:           "viewer_accessing_admin_endpoint",
			requiredRole:   "admin",
			token:          viewerToken,
			expectedStatus: http.StatusForbidden,
		},
		{
			name:           "viewer_accessing_user_endpoint",
			requiredRole:   "user",
			token:          viewerToken,
			expectedStatus: http.StatusForbidden,
		},
	}
	
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Chain auth middleware with role requirement
			protectedHandler := service.AuthMiddleware(service.RequireRole(tt.requiredRole)(testHandler))
			
			req := httptest.NewRequest("GET", "/protected", nil)
			req.Header.Set("Authorization", "Bearer "+tt.token)
			
			rr := httptest.NewRecorder()
			protectedHandler(rr, req)
			
			if rr.Code != tt.expectedStatus {
				t.Errorf("Status code = %d, want %d", rr.Code, tt.expectedStatus)
			}
		})
	}
}

func TestOptionalAuth(t *testing.T) {
	service := setupTestService(t)
	
	user := &User{
		ID:       "user-123",
		Username: "testuser",
		Role:     "admin",
	}
	
	token, err := service.GenerateToken(user)
	if err != nil {
		t.Fatalf("Failed to generate token: %v", err)
	}
	
	// Test handler that works with or without authentication
	testHandler := func(w http.ResponseWriter, r *http.Request) {
		claims, ok := r.Context().Value(UserContextKey).(*Claims)
		if ok {
			w.WriteHeader(http.StatusOK)
			w.Write([]byte("authenticated: " + claims.Username))
		} else {
			w.WriteHeader(http.StatusOK)
			w.Write([]byte("anonymous"))
		}
	}
	
	optionalAuthHandler := service.OptionalAuth(testHandler)
	
	tests := []struct {
		name           string
		authHeader     string
		expectedStatus int
		expectedBody   string
	}{
		{
			name:           "with_valid_token",
			authHeader:     "Bearer " + token,
			expectedStatus: http.StatusOK,
			expectedBody:   "authenticated: testuser",
		},
		{
			name:           "without_token",
			authHeader:     "",
			expectedStatus: http.StatusOK,
			expectedBody:   "anonymous",
		},
		{
			name:           "with_invalid_token",
			authHeader:     "Bearer invalid-token",
			expectedStatus: http.StatusOK,
			expectedBody:   "anonymous",
		},
	}
	
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest("GET", "/optional", nil)
			if tt.authHeader != "" {
				req.Header.Set("Authorization", tt.authHeader)
			}
			
			rr := httptest.NewRecorder()
			optionalAuthHandler(rr, req)
			
			if rr.Code != tt.expectedStatus {
				t.Errorf("Status code = %d, want %d", rr.Code, tt.expectedStatus)
			}
			
			if rr.Body.String() != tt.expectedBody {
				t.Errorf("Response body = %q, want %q", rr.Body.String(), tt.expectedBody)
			}
		})
	}
}

func TestGetUserFromContext(t *testing.T) {
	service := setupTestService(t)
	
	user := &User{
		ID:       "user-123",
		Username: "testuser",
		Role:     "admin",
	}
	
	token, err := service.GenerateToken(user)
	if err != nil {
		t.Fatalf("Failed to generate token: %v", err)
	}
	
	// Test handler that uses GetUserFromContext
	testHandler := func(w http.ResponseWriter, r *http.Request) {
		claims := GetUserFromContext(r.Context())
		if claims == nil {
			http.Error(w, "No user in context", http.StatusInternalServerError)
			return
		}
		
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(claims.Username))
	}
	
	protectedHandler := service.AuthMiddleware(testHandler)
	
	// Test with valid token
	req := httptest.NewRequest("GET", "/protected", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	
	rr := httptest.NewRecorder()
	protectedHandler(rr, req)
	
	if rr.Code != http.StatusOK {
		t.Errorf("Status code = %d, want %d", rr.Code, http.StatusOK)
	}
	
	if rr.Body.String() != user.Username {
		t.Errorf("Response body = %q, want %q", rr.Body.String(), user.Username)
	}
}

func TestCORSHeaders(t *testing.T) {
	service := setupTestService(t)
	
	testHandler := func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}
	
	corsHandler := service.CORSMiddleware(testHandler)
	
	req := httptest.NewRequest("GET", "/api/test", nil)
	req.Header.Set("Origin", "http://localhost:3000")
	
	rr := httptest.NewRecorder()
	corsHandler(rr, req)
	
	// Check CORS headers
	if rr.Header().Get("Access-Control-Allow-Origin") != "http://localhost:3000" {
		t.Errorf("Access-Control-Allow-Origin header not set correctly")
	}
	
	if rr.Header().Get("Access-Control-Allow-Methods") == "" {
		t.Error("Access-Control-Allow-Methods header not set")
	}
	
	if rr.Header().Get("Access-Control-Allow-Headers") == "" {
		t.Error("Access-Control-Allow-Headers header not set")
	}
}

func TestPreflightRequest(t *testing.T) {
	service := setupTestService(t)
	
	testHandler := func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}
	
	corsHandler := service.CORSMiddleware(testHandler)
	
	// Test OPTIONS request (preflight)
	req := httptest.NewRequest("OPTIONS", "/api/test", nil)
	req.Header.Set("Origin", "http://localhost:3000")
	req.Header.Set("Access-Control-Request-Method", "POST")
	req.Header.Set("Access-Control-Request-Headers", "Content-Type, Authorization")
	
	rr := httptest.NewRecorder()
	corsHandler(rr, req)
	
	if rr.Code != http.StatusOK {
		t.Errorf("Status code = %d, want %d", rr.Code, http.StatusOK)
	}
	
	// Check that preflight headers are set
	if rr.Header().Get("Access-Control-Allow-Origin") != "http://localhost:3000" {
		t.Error("Access-Control-Allow-Origin not set for preflight")
	}
}

// Helper functions and middleware implementations for testing

func GetUserFromContext(ctx context.Context) *Claims {
	claims, ok := ctx.Value(UserContextKey).(*Claims)
	if !ok {
		return nil
	}
	return claims
}

func (s *Service) RequireRole(requiredRole string) func(http.HandlerFunc) http.HandlerFunc {
	return func(next http.HandlerFunc) http.HandlerFunc {
		return func(w http.ResponseWriter, r *http.Request) {
			claims := GetUserFromContext(r.Context())
			if claims == nil {
				http.Error(w, "User not authenticated", http.StatusUnauthorized)
				return
			}
			
			if !hasRequiredRole(claims.Role, requiredRole) {
				http.Error(w, "Insufficient permissions", http.StatusForbidden)
				return
			}
			
			next(w, r)
		}
	}
}

func (s *Service) OptionalAuth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader != "" {
			parts := strings.Split(authHeader, " ")
			if len(parts) == 2 && parts[0] == "Bearer" {
				token := parts[1]
				if token != "" {
					claims, err := s.ValidateToken(token)
					if err == nil {
						ctx := context.WithValue(r.Context(), UserContextKey, claims)
						r = r.WithContext(ctx)
					}
				}
			}
		}
		
		next(w, r)
	}
}

func (s *Service) CORSMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if origin != "" {
			w.Header().Set("Access-Control-Allow-Origin", origin)
		}
		
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
		w.Header().Set("Access-Control-Allow-Credentials", "true")
		w.Header().Set("Access-Control-Max-Age", "86400")
		
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		
		next(w, r)
	}
}

func hasRequiredRole(userRole, requiredRole string) bool {
	// Role hierarchy: admin > user > viewer
	roleHierarchy := map[string]int{
		"admin":  3,
		"user":   2,
		"viewer": 1,
	}
	
	userLevel, userExists := roleHierarchy[userRole]
	requiredLevel, requiredExists := roleHierarchy[requiredRole]
	
	if !userExists || !requiredExists {
		return false
	}
	
	return userLevel >= requiredLevel
}

// Benchmark tests for middleware performance
func BenchmarkAuthMiddleware(b *testing.B) {
	service := setupTestService(b)
	
	user := &User{
		ID:       "user-123",
		Username: "testuser",
		Role:     "admin",
	}
	
	token, _ := service.GenerateToken(user)
	
	testHandler := func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}
	
	protectedHandler := service.AuthMiddleware(testHandler)
	
	req := httptest.NewRequest("GET", "/protected", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		rr := httptest.NewRecorder()
		protectedHandler(rr, req)
	}
}

func BenchmarkRequireRole(b *testing.B) {
	service := setupTestService(b)
	
	user := &User{
		ID:       "user-123",
		Username: "testuser",
		Role:     "admin",
	}
	
	token, _ := service.GenerateToken(user)
	
	testHandler := func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}
	
	protectedHandler := service.AuthMiddleware(service.RequireRole("user")(testHandler))
	
	req := httptest.NewRequest("GET", "/protected", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		rr := httptest.NewRecorder()
		protectedHandler(rr, req)
	}
}

// Helper for benchmark tests
func setupTestService(t testing.TB) *Service {
	secretKey := make([]byte, 32)
	copy(secretKey, "test-secret-key-32-bytes-long!!")
	
	service, err := NewService(secretKey, NewMockDatabaseClient(), NewMockRedisClient())
	if err != nil {
		t.Fatalf("Failed to create service: %v", err)
	}
	
	return service
}