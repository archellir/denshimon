package auth

import (
	"context"
	"net/http"
	"strings"
)

type contextKey string

const (
	UserContextKey contextKey = "user"
)

// AuthMiddleware validates PASETO tokens from request headers
func (s *Service) AuthMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Get token from Authorization header
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, "Missing authorization header", http.StatusUnauthorized)
			return
		}

		// Check for Bearer token format
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			http.Error(w, "Invalid authorization header format", http.StatusUnauthorized)
			return
		}

		token := parts[1]
		if token == "" {
			http.Error(w, "Missing token", http.StatusUnauthorized)
			return
		}

		// Validate token
		claims, err := s.ValidateToken(token)
		if err != nil {
			http.Error(w, "Invalid token: "+err.Error(), http.StatusUnauthorized)
			return
		}

		// Add user claims to request context
		ctx := context.WithValue(r.Context(), UserContextKey, claims)
		r = r.WithContext(ctx)

		// Call next handler
		next(w, r)
	}
}

// RequireRole middleware checks if user has required role
func (s *Service) RequireRole(role string) func(http.HandlerFunc) http.HandlerFunc {
	return func(next http.HandlerFunc) http.HandlerFunc {
		return s.AuthMiddleware(func(w http.ResponseWriter, r *http.Request) {
			claims := GetUserFromContext(r.Context())
			if claims == nil {
				http.Error(w, "User not authenticated", http.StatusUnauthorized)
				return
			}

			if claims.Role != role && claims.Role != "admin" {
				http.Error(w, "Insufficient permissions", http.StatusForbidden)
				return
			}

			next(w, r)
		})
	}
}

// RequirePermission middleware checks if user has required permission for resource/action
func (s *Service) RequirePermission(resource, action string) func(http.HandlerFunc) http.HandlerFunc {
	return func(next http.HandlerFunc) http.HandlerFunc {
		return s.AuthMiddleware(func(w http.ResponseWriter, r *http.Request) {
			claims := GetUserFromContext(r.Context())
			if claims == nil {
				http.Error(w, "User not authenticated", http.StatusUnauthorized)
				return
			}

			if !s.HasPermission(claims.Role, resource, action) {
				http.Error(w, "Insufficient permissions", http.StatusForbidden)
				return
			}

			next(w, r)
		})
	}
}

// GetUserFromContext extracts user claims from request context
func GetUserFromContext(ctx context.Context) *TokenClaims {
	if claims, ok := ctx.Value(UserContextKey).(*TokenClaims); ok {
		return claims
	}
	return nil
}

// OptionalAuth middleware that doesn't fail if no auth is provided
func (s *Service) OptionalAuth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader != "" {
			parts := strings.Split(authHeader, " ")
			if len(parts) == 2 && parts[0] == "Bearer" {
				token := parts[1]
				if claims, err := s.ValidateToken(token); err == nil {
					ctx := context.WithValue(r.Context(), UserContextKey, claims)
					r = r.WithContext(ctx)
				}
			}
		}
		next(w, r)
	}
}
