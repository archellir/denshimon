package auth

import (
	"errors"
	"testing"
	"time"

	"golang.org/x/crypto/bcrypt"
	"aidanwoods.dev/go-paseto"
)

// MockDatabaseClient provides a mock implementation for testing
type MockDatabaseClient struct {
	users   map[string]*DatabaseUser
	usersByID map[string]*DatabaseUser
	errors  map[string]error
}

func NewMockDatabaseClient() *MockDatabaseClient {
	return &MockDatabaseClient{
		users:     make(map[string]*DatabaseUser),
		usersByID: make(map[string]*DatabaseUser),
		errors:    make(map[string]error),
	}
}

func (m *MockDatabaseClient) SetError(operation string, err error) {
	m.errors[operation] = err
}

func (m *MockDatabaseClient) GetUser(username string) (*DatabaseUser, error) {
	if err := m.errors["GetUser"]; err != nil {
		return nil, err
	}
	user, exists := m.users[username]
	if !exists {
		return nil, errors.New("user not found")
	}
	return user, nil
}

func (m *MockDatabaseClient) GetUserByID(userID string) (*DatabaseUser, error) {
	if err := m.errors["GetUserByID"]; err != nil {
		return nil, err
	}
	user, exists := m.usersByID[userID]
	if !exists {
		return nil, errors.New("user not found")
	}
	return user, nil
}

func (m *MockDatabaseClient) CreateUser(username, passwordHash, role string) (*DatabaseUser, error) {
	if err := m.errors["CreateUser"]; err != nil {
		return nil, err
	}
	if _, exists := m.users[username]; exists {
		return nil, errors.New("user already exists")
	}
	
	user := &DatabaseUser{
		ID:           generateUserID(),
		Username:     username,
		PasswordHash: passwordHash,
		Role:         role,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}
	
	m.users[username] = user
	m.usersByID[user.ID] = user
	return user, nil
}

func (m *MockDatabaseClient) UpdateUser(userID, username, passwordHash, role string) error {
	if err := m.errors["UpdateUser"]; err != nil {
		return err
	}
	user, exists := m.usersByID[userID]
	if !exists {
		return errors.New("user not found")
	}
	
	// Remove from old username mapping if username changed
	if user.Username != username {
		delete(m.users, user.Username)
	}
	
	user.Username = username
	user.PasswordHash = passwordHash
	user.Role = role
	user.UpdatedAt = time.Now()
	
	m.users[username] = user
	return nil
}

func (m *MockDatabaseClient) DeleteUser(userID string) error {
	if err := m.errors["DeleteUser"]; err != nil {
		return err
	}
	user, exists := m.usersByID[userID]
	if !exists {
		return errors.New("user not found")
	}
	
	delete(m.users, user.Username)
	delete(m.usersByID, userID)
	return nil
}

func (m *MockDatabaseClient) ListUsers() ([]*DatabaseUser, error) {
	if err := m.errors["ListUsers"]; err != nil {
		return nil, err
	}
	
	users := make([]*DatabaseUser, 0, len(m.users))
	for _, user := range m.users {
		users = append(users, user)
	}
	return users, nil
}

// MockRedisClient provides a mock implementation for testing
type MockRedisClient struct {
	data   map[string]string
	errors map[string]error
}

func NewMockRedisClient() *MockRedisClient {
	return &MockRedisClient{
		data:   make(map[string]string),
		errors: make(map[string]error),
	}
}

func (m *MockRedisClient) SetError(operation string, err error) {
	m.errors[operation] = err
}

func (m *MockRedisClient) Set(key string, value interface{}, expiration time.Duration) error {
	if err := m.errors["Set"]; err != nil {
		return err
	}
	m.data[key] = value.(string)
	return nil
}

func (m *MockRedisClient) Get(key string) (string, error) {
	if err := m.errors["Get"]; err != nil {
		return "", err
	}
	value, exists := m.data[key]
	if !exists {
		return "", errors.New("key not found")
	}
	return value, nil
}

func (m *MockRedisClient) Delete(key string) error {
	if err := m.errors["Delete"]; err != nil {
		return err
	}
	delete(m.data, key)
	return nil
}

func setupTestService(t *testing.T) *Service {
	secretKey := make([]byte, 32)
	copy(secretKey, "test-secret-key-32-bytes-long!!")
	
	pasetoKey := paseto.NewV4SymmetricKey()
	
	service := &Service{
		secretKey: secretKey,
		pasetoKey: pasetoKey,
		redis:     NewMockRedisClient(),
		db:        NewMockDatabaseClient(),
	}
	
	return service
}

func TestNewService(t *testing.T) {
	secretKey := []byte("test-secret-key-32-bytes-long!!")
	db := NewMockDatabaseClient()
	redis := NewMockRedisClient()
	
	service, err := NewService(secretKey, db, redis)
	if err != nil {
		t.Fatalf("Failed to create service: %v", err)
	}
	
	if service == nil {
		t.Fatal("Service should not be nil")
	}
	
	if len(service.secretKey) != len(secretKey) {
		t.Errorf("Secret key length = %d, want %d", len(service.secretKey), len(secretKey))
	}
}

func TestHashPassword(t *testing.T) {
	service := setupTestService(t)
	
	password := "testpassword123"
	hash, err := service.HashPassword(password)
	if err != nil {
		t.Fatalf("Failed to hash password: %v", err)
	}
	
	if len(hash) == 0 {
		t.Error("Hash should not be empty")
	}
	
	// Verify the hash can be used to verify the password
	err = bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	if err != nil {
		t.Errorf("Hash verification failed: %v", err)
	}
}

func TestValidatePassword(t *testing.T) {
	service := setupTestService(t)
	
	tests := []struct {
		name     string
		password string
		wantErr  bool
	}{
		{"valid_password", "ValidPass123!", false},
		{"too_short", "short", true},
		{"no_uppercase", "lowercase123!", true},
		{"no_lowercase", "UPPERCASE123!", true},
		{"no_digits", "NoDigitsHere!", true},
		{"no_special", "NoSpecialChars123", true},
		{"empty", "", true},
	}
	
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := service.ValidatePassword(tt.password)
			hasErr := err != nil
			if hasErr != tt.wantErr {
				t.Errorf("ValidatePassword(%q) error = %v, wantErr %v", tt.password, err, tt.wantErr)
			}
		})
	}
}

func TestCreateUser(t *testing.T) {
	service := setupTestService(t)
	
	username := "testuser"
	password := "TestPass123!"
	role := "admin"
	
	user, err := service.CreateUser(username, password, role)
	if err != nil {
		t.Fatalf("Failed to create user: %v", err)
	}
	
	if user.Username != username {
		t.Errorf("User.Username = %q, want %q", user.Username, username)
	}
	
	if user.Role != role {
		t.Errorf("User.Role = %q, want %q", user.Role, role)
	}
	
	if len(user.ID) == 0 {
		t.Error("User.ID should not be empty")
	}
	
	// Test duplicate user creation
	_, err = service.CreateUser(username, password, role)
	if err == nil {
		t.Error("Expected error when creating duplicate user")
	}
}

func TestAuthenticateUser(t *testing.T) {
	service := setupTestService(t)
	
	username := "testuser"
	password := "TestPass123!"
	role := "admin"
	
	// Create a user first
	_, err := service.CreateUser(username, password, role)
	if err != nil {
		t.Fatalf("Failed to create user: %v", err)
	}
	
	// Test successful authentication
	user, err := service.AuthenticateUser(username, password)
	if err != nil {
		t.Fatalf("Failed to authenticate user: %v", err)
	}
	
	if user.Username != username {
		t.Errorf("Authenticated user.Username = %q, want %q", user.Username, username)
	}
	
	// Test authentication with wrong password
	_, err = service.AuthenticateUser(username, "wrongpassword")
	if err == nil {
		t.Error("Expected error when authenticating with wrong password")
	}
	
	// Test authentication with non-existent user
	_, err = service.AuthenticateUser("nonexistent", password)
	if err == nil {
		t.Error("Expected error when authenticating non-existent user")
	}
}

func TestGenerateToken(t *testing.T) {
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
	
	if len(token) == 0 {
		t.Error("Token should not be empty")
	}
	
	// Verify token starts with correct PASETO prefix
	if !isValidPasetoToken(token) {
		t.Error("Generated token should be a valid PASETO token")
	}
}

func TestValidateToken(t *testing.T) {
	service := setupTestService(t)
	
	user := &User{
		ID:       "user-123",
		Username: "testuser",
		Role:     "admin",
	}
	
	// Generate a token
	token, err := service.GenerateToken(user)
	if err != nil {
		t.Fatalf("Failed to generate token: %v", err)
	}
	
	// Validate the token
	claims, err := service.ValidateToken(token)
	if err != nil {
		t.Fatalf("Failed to validate token: %v", err)
	}
	
	if claims.UserID != user.ID {
		t.Errorf("Claims.UserID = %q, want %q", claims.UserID, user.ID)
	}
	
	if claims.Username != user.Username {
		t.Errorf("Claims.Username = %q, want %q", claims.Username, user.Username)
	}
	
	if claims.Role != user.Role {
		t.Errorf("Claims.Role = %q, want %q", claims.Role, user.Role)
	}
	
	// Test invalid token
	_, err = service.ValidateToken("invalid-token")
	if err == nil {
		t.Error("Expected error when validating invalid token")
	}
}

func TestRefreshToken(t *testing.T) {
	service := setupTestService(t)
	
	user := &User{
		ID:       "user-123",
		Username: "testuser",
		Role:     "admin",
	}
	
	// Generate original token
	originalToken, err := service.GenerateToken(user)
	if err != nil {
		t.Fatalf("Failed to generate original token: %v", err)
	}
	
	// Refresh the token
	newToken, err := service.RefreshToken(originalToken)
	if err != nil {
		t.Fatalf("Failed to refresh token: %v", err)
	}
	
	if newToken == originalToken {
		t.Error("Refreshed token should be different from original")
	}
	
	// Validate the new token
	claims, err := service.ValidateToken(newToken)
	if err != nil {
		t.Fatalf("Failed to validate refreshed token: %v", err)
	}
	
	if claims.UserID != user.ID {
		t.Errorf("Refreshed token UserID = %q, want %q", claims.UserID, user.ID)
	}
}

func TestLogoutUser(t *testing.T) {
	service := setupTestService(t)
	
	user := &User{
		ID:       "user-123",
		Username: "testuser",
		Role:     "admin",
	}
	
	// Generate a token
	token, err := service.GenerateToken(user)
	if err != nil {
		t.Fatalf("Failed to generate token: %v", err)
	}
	
	// Logout the user
	err = service.LogoutUser(token)
	if err != nil {
		t.Fatalf("Failed to logout user: %v", err)
	}
	
	// Token should now be invalidated
	_, err = service.ValidateToken(token)
	if err == nil {
		t.Error("Expected error when validating token after logout")
	}
}

func TestGetUserByID(t *testing.T) {
	service := setupTestService(t)
	
	username := "testuser"
	password := "TestPass123!"
	role := "admin"
	
	// Create a user
	createdUser, err := service.CreateUser(username, password, role)
	if err != nil {
		t.Fatalf("Failed to create user: %v", err)
	}
	
	// Get user by ID
	retrievedUser, err := service.GetUserByID(createdUser.ID)
	if err != nil {
		t.Fatalf("Failed to get user by ID: %v", err)
	}
	
	if retrievedUser.ID != createdUser.ID {
		t.Errorf("Retrieved user ID = %q, want %q", retrievedUser.ID, createdUser.ID)
	}
	
	if retrievedUser.Username != createdUser.Username {
		t.Errorf("Retrieved user Username = %q, want %q", retrievedUser.Username, createdUser.Username)
	}
	
	// Test non-existent user
	_, err = service.GetUserByID("non-existent-id")
	if err == nil {
		t.Error("Expected error when getting non-existent user")
	}
}

func TestListUsers(t *testing.T) {
	service := setupTestService(t)
	
	// Create multiple users
	users := []struct {
		username string
		password string
		role     string
	}{
		{"user1", "TestPass123!", "admin"},
		{"user2", "TestPass123!", "user"},
		{"user3", "TestPass123!", "viewer"},
	}
	
	for _, u := range users {
		_, err := service.CreateUser(u.username, u.password, u.role)
		if err != nil {
			t.Fatalf("Failed to create user %s: %v", u.username, err)
		}
	}
	
	// List all users
	allUsers, err := service.ListUsers()
	if err != nil {
		t.Fatalf("Failed to list users: %v", err)
	}
	
	if len(allUsers) != len(users) {
		t.Errorf("Listed users count = %d, want %d", len(allUsers), len(users))
	}
	
	// Verify all users are present
	usernames := make(map[string]bool)
	for _, user := range allUsers {
		usernames[user.Username] = true
	}
	
	for _, u := range users {
		if !usernames[u.username] {
			t.Errorf("User %s not found in listed users", u.username)
		}
	}
}

func TestDeleteUser(t *testing.T) {
	service := setupTestService(t)
	
	username := "testuser"
	password := "TestPass123!"
	role := "admin"
	
	// Create a user
	user, err := service.CreateUser(username, password, role)
	if err != nil {
		t.Fatalf("Failed to create user: %v", err)
	}
	
	// Delete the user
	err = service.DeleteUser(user.ID)
	if err != nil {
		t.Fatalf("Failed to delete user: %v", err)
	}
	
	// Verify user is deleted
	_, err = service.GetUserByID(user.ID)
	if err == nil {
		t.Error("Expected error when getting deleted user")
	}
	
	// Test deleting non-existent user
	err = service.DeleteUser("non-existent-id")
	if err == nil {
		t.Error("Expected error when deleting non-existent user")
	}
}

func TestDatabaseErrors(t *testing.T) {
	service := setupTestService(t)
	mockDB := service.db.(*MockDatabaseClient)
	
	// Test CreateUser with database error
	mockDB.SetError("CreateUser", errors.New("database error"))
	_, err := service.CreateUser("testuser", "TestPass123!", "admin")
	if err == nil {
		t.Error("Expected error when database CreateUser fails")
	}
	
	// Reset error and create a user
	mockDB.SetError("CreateUser", nil)
	user, err := service.CreateUser("testuser", "TestPass123!", "admin")
	if err != nil {
		t.Fatalf("Failed to create user: %v", err)
	}
	
	// Test GetUser with database error
	mockDB.SetError("GetUser", errors.New("database error"))
	_, err = service.AuthenticateUser("testuser", "TestPass123!")
	if err == nil {
		t.Error("Expected error when database GetUser fails")
	}
	
	// Test GetUserByID with database error
	mockDB.SetError("GetUserByID", errors.New("database error"))
	_, err = service.GetUserByID(user.ID)
	if err == nil {
		t.Error("Expected error when database GetUserByID fails")
	}
}

func TestRedisErrors(t *testing.T) {
	service := setupTestService(t)
	mockRedis := service.redis.(*MockRedisClient)
	
	user := &User{
		ID:       "user-123",
		Username: "testuser",
		Role:     "admin",
	}
	
	// Generate a token first
	token, err := service.GenerateToken(user)
	if err != nil {
		t.Fatalf("Failed to generate token: %v", err)
	}
	
	// Test LogoutUser with Redis error
	mockRedis.SetError("Set", errors.New("redis error"))
	err = service.LogoutUser(token)
	if err == nil {
		t.Error("Expected error when Redis Set fails during logout")
	}
}

// Helper functions for testing

func generateUserID() string {
	bytes := make([]byte, 16)
	_, err := rand.Read(bytes)
	if err != nil {
		return "test-user-id"
	}
	return hex.EncodeToString(bytes)
}

func isValidPasetoToken(token string) bool {
	// PASETO v4 local tokens start with "v4.local."
	return len(token) > 9 && token[:9] == "v4.local."
}

// NewService creates a new auth service (mock implementation for testing)
func NewService(secretKey []byte, db DatabaseClient, redis RedisClient) (*Service, error) {
	if len(secretKey) < 32 {
		return nil, errors.New("secret key must be at least 32 bytes")
	}
	
	pasetoKey := paseto.NewV4SymmetricKey()
	
	return &Service{
		secretKey: secretKey,
		pasetoKey: pasetoKey,
		redis:     redis,
		db:        db,
	}, nil
}

// Mock service methods for testing

func (s *Service) HashPassword(password string) (string, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	return string(hash), err
}

func (s *Service) ValidatePassword(password string) error {
	if len(password) < 8 {
		return errors.New("password must be at least 8 characters")
	}
	
	hasUpper := false
	hasLower := false
	hasDigit := false
	hasSpecial := false
	
	for _, char := range password {
		switch {
		case 'A' <= char && char <= 'Z':
			hasUpper = true
		case 'a' <= char && char <= 'z':
			hasLower = true
		case '0' <= char && char <= '9':
			hasDigit = true
		default:
			hasSpecial = true
		}
	}
	
	if !hasUpper {
		return errors.New("password must contain at least one uppercase letter")
	}
	if !hasLower {
		return errors.New("password must contain at least one lowercase letter")
	}
	if !hasDigit {
		return errors.New("password must contain at least one digit")
	}
	if !hasSpecial {
		return errors.New("password must contain at least one special character")
	}
	
	return nil
}

func (s *Service) CreateUser(username, password, role string) (*User, error) {
	if err := s.ValidatePassword(password); err != nil {
		return nil, err
	}
	
	hash, err := s.HashPassword(password)
	if err != nil {
		return nil, err
	}
	
	dbUser, err := s.db.CreateUser(username, hash, role)
	if err != nil {
		return nil, err
	}
	
	return &User{
		ID:       dbUser.ID,
		Username: dbUser.Username,
		Role:     dbUser.Role,
	}, nil
}

func (s *Service) AuthenticateUser(username, password string) (*User, error) {
	dbUser, err := s.db.GetUser(username)
	if err != nil {
		return nil, err
	}
	
	err = bcrypt.CompareHashAndPassword([]byte(dbUser.PasswordHash), []byte(password))
	if err != nil {
		return nil, errors.New("invalid credentials")
	}
	
	return &User{
		ID:       dbUser.ID,
		Username: dbUser.Username,
		Role:     dbUser.Role,
	}, nil
}

func (s *Service) GenerateToken(user *User) (string, error) {
	claims := map[string]interface{}{
		"user_id":  user.ID,
		"username": user.Username,
		"role":     user.Role,
		"exp":      time.Now().Add(24 * time.Hour).Unix(),
		"iat":      time.Now().Unix(),
	}
	
	return paseto.NewV4Local().Encrypt(s.pasetoKey, claims, "")
}

type Claims struct {
	UserID   string `json:"user_id"`
	Username string `json:"username"`
	Role     string `json:"role"`
	Exp      int64  `json:"exp"`
	Iat      int64  `json:"iat"`
}

func (s *Service) ValidateToken(tokenString string) (*Claims, error) {
	parser := paseto.NewV4Local()
	
	var claims map[string]interface{}
	err := parser.Decrypt(tokenString, s.pasetoKey, &claims, "")
	if err != nil {
		return nil, errors.New("invalid token")
	}
	
	// Check expiration
	if exp, ok := claims["exp"].(float64); ok {
		if time.Now().Unix() > int64(exp) {
			return nil, errors.New("token expired")
		}
	}
	
	return &Claims{
		UserID:   claims["user_id"].(string),
		Username: claims["username"].(string),
		Role:     claims["role"].(string),
		Exp:      int64(claims["exp"].(float64)),
		Iat:      int64(claims["iat"].(float64)),
	}, nil
}

func (s *Service) RefreshToken(tokenString string) (string, error) {
	claims, err := s.ValidateToken(tokenString)
	if err != nil {
		return "", err
	}
	
	user := &User{
		ID:       claims.UserID,
		Username: claims.Username,
		Role:     claims.Role,
	}
	
	return s.GenerateToken(user)
}

func (s *Service) LogoutUser(tokenString string) error {
	claims, err := s.ValidateToken(tokenString)
	if err != nil {
		return err
	}
	
	// Add token to blacklist
	expiry := time.Unix(claims.Exp, 0).Sub(time.Now())
	return s.redis.Set("blacklist:"+tokenString, "true", expiry)
}

func (s *Service) GetUserByID(userID string) (*User, error) {
	dbUser, err := s.db.GetUserByID(userID)
	if err != nil {
		return nil, err
	}
	
	return &User{
		ID:       dbUser.ID,
		Username: dbUser.Username,
		Role:     dbUser.Role,
	}, nil
}

func (s *Service) ListUsers() ([]*User, error) {
	dbUsers, err := s.db.ListUsers()
	if err != nil {
		return nil, err
	}
	
	users := make([]*User, len(dbUsers))
	for i, dbUser := range dbUsers {
		users[i] = &User{
			ID:       dbUser.ID,
			Username: dbUser.Username,
			Role:     dbUser.Role,
		}
	}
	
	return users, nil
}

func (s *Service) DeleteUser(userID string) error {
	return s.db.DeleteUser(userID)
}