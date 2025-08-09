package auth

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"aidanwoods.dev/go-paseto"
)

type Service struct {
	secretKey []byte
	pasetoKey paseto.V4SymmetricKey
	redis     RedisClient
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

func NewService(secretKey string, redis RedisClient) *Service {
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
	token.SetIssuedAt(time.Unix(claims.IssuedAt, 0))
	token.SetExpiration(time.Unix(claims.ExpireAt, 0))

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

	// Check if token is expired
	if time.Now().Unix() > claims.ExpireAt {
		return nil, ErrTokenExpired
	}

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

var (
	ErrInvalidToken   = errors.New("invalid token")
	ErrTokenExpired   = errors.New("token expired")
	ErrTokenRevoked   = errors.New("token revoked")
	ErrUnauthorized   = errors.New("unauthorized")
	ErrInvalidRole    = errors.New("invalid role")
	ErrNoPermission   = errors.New("no permission")
)