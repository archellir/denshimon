// Package auth provides authentication and authorization services using PASETO tokens.
// It handles user login, token generation, validation, and session management.
package auth

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"aidanwoods.dev/go-paseto"
	"golang.org/x/crypto/bcrypt"
)

type Service struct {
	secretKey []byte
	pasetoKey paseto.V4SymmetricKey
	redis     RedisClient
	db        DatabaseClient
}

type DatabaseClient interface {
	GetUser(username string) (*DatabaseUser, error)
	GetUserByID(userID string) (*DatabaseUser, error)
	CreateUser(username, passwordHash, role string) (*DatabaseUser, error)
	UpdateUser(userID, username, passwordHash, role string) error
	DeleteUser(userID string) error
	ListUsers() ([]*DatabaseUser, error)
}

type DatabaseUser struct {
	ID           string    `json:"id"`
	Username     string    `json:"username"`
	PasswordHash string    `json:"-"`
	Role         string    `json:"role"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type RedisClient interface {
	Set(key string, value interface{}, expiration time.Duration) error
	Get(key string) (string, error)
	Delete(key string) error
}

type User struct {
	ID       string   `json:"id"`
	Username string   `json:"username"`
	Role     string   `json:"role"`
	Scopes   []string `json:"scopes"`
}

type TokenClaims struct {
	UserID   string   `json:"user_id"`
	Username string   `json:"username"`
	Role     string   `json:"role"`
	Scopes   []string `json:"scopes"`
	IssuedAt int64    `json:"iat"`
	ExpireAt int64    `json:"exp"`
}

func NewService(secretKey string, redis RedisClient, db DatabaseClient) *Service {
	// For development, generate a consistent key based on secret
	// In production, you should store this key securely
	key := make([]byte, 32)
	copy(key, []byte(secretKey))
	if len(secretKey) < 32 {
		// Fill remaining bytes with deterministic data for consistency
		for i := len(secretKey); i < 32; i++ {
			key[i] = byte(i)
		}
	}

	// Create PASETO symmetric key
	pasetoKey := paseto.NewV4SymmetricKey()

	return &Service{
		secretKey: key,
		pasetoKey: pasetoKey,
		redis:     redis,
		db:        db,
	}
}

func (s *Service) GenerateToken(user *User, duration time.Duration) (string, error) {
	now := time.Now()

	claims := TokenClaims{
		UserID:   user.ID,
		Username: user.Username,
		Role:     user.Role,
		Scopes:   user.Scopes,
		IssuedAt: now.Unix(),
		ExpireAt: now.Add(duration).Unix(),
	}

	// Create PASETO v4 local token
	token := paseto.NewToken()
	token.SetString("user_id", claims.UserID)
	token.SetString("username", claims.Username)
	token.SetString("role", claims.Role)
	token.Set("scopes", claims.Scopes)
	token.SetIssuedAt(now)
	token.SetExpiration(now.Add(duration))

	// Encrypt the token
	encrypted := token.V4Encrypt(s.pasetoKey, nil)

	return encrypted, nil
}

func (s *Service) ValidateToken(tokenString string) (*TokenClaims, error) {
	// Check if token is blacklisted
	if s.IsTokenRevoked(tokenString) {
		return nil, ErrTokenRevoked
	}

	// Parse and decrypt token
	parser := paseto.NewParser()
	token, err := parser.ParseV4Local(s.pasetoKey, tokenString, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to parse token: %w", err)
	}

	// Extract claims
	var claims TokenClaims

	if userID, err := token.GetString("user_id"); err == nil {
		claims.UserID = userID
	}
	if username, err := token.GetString("username"); err == nil {
		claims.Username = username
	}
	if role, err := token.GetString("role"); err == nil {
		claims.Role = role
	}
	var iat int64
	if err := token.Get("iat", &iat); err == nil {
		claims.IssuedAt = iat
	}
	var exp int64
	if err := token.Get("exp", &exp); err == nil {
		claims.ExpireAt = exp
	}

	// Get scopes (might be stored as interface{})
	var scopesInterface interface{}
	if err := token.Get("scopes", &scopesInterface); err == nil {
		if scopesBytes, err := json.Marshal(scopesInterface); err == nil {
			json.Unmarshal(scopesBytes, &claims.Scopes)
		}
	}

	// Note: PASETO library already validates expiration, so we don't need to check it manually

	return &claims, nil
}

func (s *Service) RevokeToken(token string) error {
	// Add token to blacklist in Redis
	return s.redis.Set("blacklist:"+token, "1", 24*time.Hour)
}

func (s *Service) IsTokenRevoked(token string) bool {
	_, err := s.redis.Get("blacklist:" + token)
	return err == nil
}

func (s *Service) GenerateSessionID() string {
	bytes := make([]byte, 32)
	rand.Read(bytes)
	return hex.EncodeToString(bytes)
}

// Role-based access control
func (s *Service) HasPermission(role string, resource string, action string) bool {
	permissions := map[string]map[string][]string{
		"admin": {
			"pods":        {"create", "read", "update", "delete", "exec"},
			"deployments": {"create", "read", "update", "delete", "scale"},
			"gitops":      {"create", "read", "update", "delete", "sync"},
			"logs":        {"read", "export"},
			"metrics":     {"read"},
		},
		"operator": {
			"pods":        {"read", "update", "exec"},
			"deployments": {"read", "update", "scale"},
			"gitops":      {"read", "sync"},
			"logs":        {"read"},
			"metrics":     {"read"},
		},
		"viewer": {
			"pods":        {"read"},
			"deployments": {"read"},
			"gitops":      {"read"},
			"logs":        {"read"},
			"metrics":     {"read"},
		},
	}

	if rolePerms, ok := permissions[role]; ok {
		if actions, ok := rolePerms[resource]; ok {
			for _, a := range actions {
				if a == action {
					return true
				}
			}
		}
	}
	return false
}

// Password hashing and verification
func (s *Service) HashPassword(password string) (string, error) {
	cost := bcrypt.DefaultCost
	if cost < bcrypt.MinCost {
		cost = bcrypt.MinCost
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(password), cost)
	if err != nil {
		return "", fmt.Errorf("failed to hash password: %w", err)
	}

	return string(hash), nil
}

func (s *Service) VerifyPassword(hashedPassword, password string) error {
	return bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(password))
}

// User authentication using database
func (s *Service) AuthenticateUser(username, password string) (*User, error) {
	if s.db == nil {
		// Fallback to demo users if no database
		return s.authenticateDemoUser(username, password)
	}

	// Get user from database
	dbUser, err := s.db.GetUser(username)
	if err != nil {
		return nil, ErrUnauthorized
	}

	// Verify password
	if err := s.VerifyPassword(dbUser.PasswordHash, password); err != nil {
		return nil, ErrUnauthorized
	}

	// Convert to auth User type with scopes
	scopes := s.generateScopesForRole(dbUser.Role)

	return &User{
		ID:       dbUser.ID,
		Username: dbUser.Username,
		Role:     dbUser.Role,
		Scopes:   scopes,
	}, nil
}

// Demo authentication fallback for development
func (s *Service) authenticateDemoUser(username, password string) (*User, error) {
	// Demo users for testing
	users := map[string]*User{
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
		return nil, ErrUnauthorized
	}

	user, exists := users[username]
	if !exists {
		return nil, ErrUnauthorized
	}

	return user, nil
}

// User management methods
func (s *Service) CreateUser(username, password, role string) (*User, error) {
	if s.db == nil {
		return nil, ErrUserManagementDisabled
	}

	// Validate role
	if !s.isValidRole(role) {
		return nil, ErrInvalidRole
	}

	// Hash password
	hashedPassword, err := s.HashPassword(password)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	// Create user in database
	dbUser, err := s.db.CreateUser(username, hashedPassword, role)
	if err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	// Convert to auth User type
	scopes := s.generateScopesForRole(role)

	return &User{
		ID:       dbUser.ID,
		Username: dbUser.Username,
		Role:     dbUser.Role,
		Scopes:   scopes,
	}, nil
}

func (s *Service) UpdateUser(userID, username, password, role string) error {
	if s.db == nil {
		return ErrUserManagementDisabled
	}

	// Validate role
	if !s.isValidRole(role) {
		return ErrInvalidRole
	}

	// Hash new password if provided
	var hashedPassword string
	if password != "" {
		var err error
		hashedPassword, err = s.HashPassword(password)
		if err != nil {
			return fmt.Errorf("failed to hash password: %w", err)
		}
	} else {
		// Get current password hash if no new password provided
		currentUser, err := s.db.GetUserByID(userID)
		if err != nil {
			return fmt.Errorf("failed to get current user: %w", err)
		}
		hashedPassword = currentUser.PasswordHash
	}

	return s.db.UpdateUser(userID, username, hashedPassword, role)
}

func (s *Service) DeleteUser(userID string) error {
	if s.db == nil {
		return ErrUserManagementDisabled
	}

	return s.db.DeleteUser(userID)
}

func (s *Service) ListUsers() ([]*User, error) {
	if s.db == nil {
		return nil, ErrUserManagementDisabled
	}

	dbUsers, err := s.db.ListUsers()
	if err != nil {
		return nil, err
	}

	users := make([]*User, len(dbUsers))
	for i, dbUser := range dbUsers {
		scopes := s.generateScopesForRole(dbUser.Role)
		users[i] = &User{
			ID:       dbUser.ID,
			Username: dbUser.Username,
			Role:     dbUser.Role,
			Scopes:   scopes,
		}
	}

	return users, nil
}

// Helper methods
func (s *Service) isValidRole(role string) bool {
	validRoles := []string{"admin", "operator", "viewer"}
	for _, validRole := range validRoles {
		if role == validRole {
			return true
		}
	}
	return false
}

func (s *Service) generateScopesForRole(role string) []string {
	switch role {
	case "admin":
		return []string{"pods:*", "deployments:*", "gitops:*", "logs:*", "metrics:*", "users:*"}
	case "operator":
		return []string{"pods:read", "pods:update", "deployments:read", "deployments:update", "gitops:read", "gitops:sync", "logs:read", "metrics:read"}
	case "viewer":
		return []string{"pods:read", "deployments:read", "gitops:read", "logs:read", "metrics:read"}
	default:
		return []string{}
	}
}

var (
	ErrInvalidToken           = errors.New("invalid token")
	ErrTokenExpired           = errors.New("token expired")
	ErrTokenRevoked           = errors.New("token revoked")
	ErrUnauthorized           = errors.New("unauthorized")
	ErrInvalidRole            = errors.New("invalid role")
	ErrNoPermission           = errors.New("no permission")
	ErrUserManagementDisabled = errors.New("user management disabled - no database configured")
)
