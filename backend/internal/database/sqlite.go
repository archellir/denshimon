package database

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"time"

	_ "github.com/mattn/go-sqlite3"
)

type SQLiteDB struct {
	DB *sql.DB
}

func NewSQLiteDB(dbPath string) (*SQLiteDB, error) {
	db, err := sql.Open("sqlite3", dbPath+"?_journal_mode=WAL&_foreign_keys=1")
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	// Test connection
	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	// Configure connection pool
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(5 * time.Minute)

	sqlite := &SQLiteDB{DB: db}
	
	// Initialize schema
	if err := sqlite.InitSchema(); err != nil {
		return nil, fmt.Errorf("failed to initialize schema: %w", err)
	}

	return sqlite, nil
}

func (s *SQLiteDB) Close() error {
	return s.DB.Close()
}

func (s *SQLiteDB) Database() *sql.DB {
	return s.DB
}

// Initialize database schema
func (s *SQLiteDB) InitSchema() error {
	schema := `
	-- Users table
	CREATE TABLE IF NOT EXISTS users (
		id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
		username TEXT UNIQUE NOT NULL,
		password_hash TEXT NOT NULL,
		role TEXT NOT NULL,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);

	-- Audit logs table
	CREATE TABLE IF NOT EXISTS audit_logs (
		id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
		user_id TEXT REFERENCES users(id),
		action TEXT NOT NULL,
		resource TEXT NOT NULL,
		resource_id TEXT,
		details TEXT, -- JSON as text
		ip_address TEXT,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);

	-- Git repositories table
	CREATE TABLE IF NOT EXISTS git_repositories (
		id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
		name TEXT NOT NULL,
		url TEXT NOT NULL,
		branch TEXT DEFAULT 'main',
		auth_type TEXT,
		credentials TEXT, -- JSON as text
		last_sync DATETIME,
		sync_status TEXT,
		sync_error TEXT,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);

	-- Applications table
	CREATE TABLE IF NOT EXISTS applications (
		id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
		name TEXT NOT NULL,
		repository_id TEXT REFERENCES git_repositories(id),
		path TEXT,
		namespace TEXT,
		sync_policy TEXT, -- JSON as text
		health_status TEXT,
		sync_status TEXT,
		last_sync DATETIME,
		sync_error TEXT,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);

	-- Sessions table (replaces Redis sessions)
	CREATE TABLE IF NOT EXISTS sessions (
		id TEXT PRIMARY KEY,
		user_id TEXT NOT NULL,
		expires_at DATETIME NOT NULL,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);

	-- Cache table (replaces Redis cache)
	CREATE TABLE IF NOT EXISTS cache (
		key TEXT PRIMARY KEY,
		value TEXT NOT NULL, -- JSON as text
		expires_at DATETIME NOT NULL,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);

	-- Indexes
	CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
	CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
	CREATE INDEX IF NOT EXISTS idx_applications_repository_id ON applications(repository_id);
	CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
	CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
	CREATE INDEX IF NOT EXISTS idx_cache_expires_at ON cache(expires_at);
	`

	_, err := s.DB.Exec(schema)
	if err != nil {
		return err
	}

	// Clean up expired sessions and cache entries on startup
	s.CleanupExpired()
	return nil
}

// Session management methods
func (s *SQLiteDB) SetSession(sessionID string, userID string, expiration time.Duration) error {
	expiresAt := time.Now().Add(expiration)
	_, err := s.DB.Exec(`
		INSERT OR REPLACE INTO sessions (id, user_id, expires_at) 
		VALUES (?, ?, ?)
	`, sessionID, userID, expiresAt)
	return err
}

func (s *SQLiteDB) GetSession(sessionID string) (string, error) {
	var userID string
	err := s.DB.QueryRow(`
		SELECT user_id FROM sessions 
		WHERE id = ? AND expires_at > CURRENT_TIMESTAMP
	`, sessionID).Scan(&userID)
	
	if err == sql.ErrNoRows {
		return "", fmt.Errorf("session not found or expired")
	}
	return userID, err
}

func (s *SQLiteDB) DeleteSession(sessionID string) error {
	_, err := s.DB.Exec("DELETE FROM sessions WHERE id = ?", sessionID)
	return err
}

// User management methods
type User struct {
	ID           string    `json:"id"`
	Username     string    `json:"username"`
	PasswordHash string    `json:"-"` // Don't expose password hash in JSON
	Role         string    `json:"role"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

func (s *SQLiteDB) CreateUser(username, passwordHash, role string) (*User, error) {
	now := time.Now()
	userID := fmt.Sprintf("user-%d", now.UnixNano())
	
	_, err := s.DB.Exec(`
		INSERT INTO users (id, username, password_hash, role, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?)
	`, userID, username, passwordHash, role, now, now)
	
	if err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}
	
	return &User{
		ID:           userID,
		Username:     username,
		PasswordHash: passwordHash,
		Role:         role,
		CreatedAt:    now,
		UpdatedAt:    now,
	}, nil
}

func (s *SQLiteDB) GetUser(username string) (*User, error) {
	var user User
	err := s.DB.QueryRow(`
		SELECT id, username, password_hash, role, created_at, updated_at
		FROM users WHERE username = ?
	`, username).Scan(&user.ID, &user.Username, &user.PasswordHash, &user.Role, &user.CreatedAt, &user.UpdatedAt)
	
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("user not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get user: %w", err)
	}
	
	return &user, nil
}

func (s *SQLiteDB) GetUserByID(userID string) (*User, error) {
	var user User
	err := s.DB.QueryRow(`
		SELECT id, username, password_hash, role, created_at, updated_at
		FROM users WHERE id = ?
	`, userID).Scan(&user.ID, &user.Username, &user.PasswordHash, &user.Role, &user.CreatedAt, &user.UpdatedAt)
	
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("user not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get user: %w", err)
	}
	
	return &user, nil
}

func (s *SQLiteDB) UpdateUser(userID, username, passwordHash, role string) error {
	_, err := s.DB.Exec(`
		UPDATE users 
		SET username = ?, password_hash = ?, role = ?, updated_at = CURRENT_TIMESTAMP
		WHERE id = ?
	`, username, passwordHash, role, userID)
	
	if err != nil {
		return fmt.Errorf("failed to update user: %w", err)
	}
	
	return nil
}

func (s *SQLiteDB) DeleteUser(userID string) error {
	_, err := s.DB.Exec("DELETE FROM users WHERE id = ?", userID)
	if err != nil {
		return fmt.Errorf("failed to delete user: %w", err)
	}
	
	return nil
}

func (s *SQLiteDB) ListUsers() ([]*User, error) {
	rows, err := s.DB.Query(`
		SELECT id, username, password_hash, role, created_at, updated_at
		FROM users ORDER BY created_at DESC
	`)
	if err != nil {
		return nil, fmt.Errorf("failed to list users: %w", err)
	}
	defer rows.Close()
	
	var users []*User
	for rows.Next() {
		var user User
		err := rows.Scan(&user.ID, &user.Username, &user.PasswordHash, &user.Role, &user.CreatedAt, &user.UpdatedAt)
		if err != nil {
			return nil, fmt.Errorf("failed to scan user: %w", err)
		}
		users = append(users, &user)
	}
	
	return users, nil
}

// Cache operations
func (s *SQLiteDB) CacheSet(key string, value interface{}, ttl time.Duration) error {
	jsonValue, err := json.Marshal(value)
	if err != nil {
		return err
	}
	
	expiresAt := time.Now().Add(ttl)
	_, err = s.DB.Exec(`
		INSERT OR REPLACE INTO cache (key, value, expires_at) 
		VALUES (?, ?, ?)
	`, key, string(jsonValue), expiresAt)
	return err
}

func (s *SQLiteDB) CacheGet(key string, dest interface{}) error {
	var value string
	err := s.DB.QueryRow(`
		SELECT value FROM cache 
		WHERE key = ? AND expires_at > CURRENT_TIMESTAMP
	`, key).Scan(&value)
	
	if err == sql.ErrNoRows {
		return fmt.Errorf("cache key not found or expired")
	}
	if err != nil {
		return err
	}

	return json.Unmarshal([]byte(value), dest)
}

func (s *SQLiteDB) CacheDelete(key string) error {
	_, err := s.DB.Exec("DELETE FROM cache WHERE key = ?", key)
	return err
}

// Redis-compatible interface methods (for auth service)
func (s *SQLiteDB) Set(key string, value interface{}, expiration time.Duration) error {
	return s.CacheSet(key, value, expiration)
}

func (s *SQLiteDB) Get(key string) (string, error) {
	var result string
	err := s.CacheGet(key, &result)
	if err != nil {
		// Return empty string and error for Redis compatibility
		return "", err
	}
	return result, nil
}

func (s *SQLiteDB) Delete(key string) error {
	return s.CacheDelete(key)
}

func (s *SQLiteDB) Exists(key string) (bool, error) {
	var count int
	err := s.DB.QueryRow(`
		SELECT COUNT(*) FROM cache 
		WHERE key = ? AND expires_at > CURRENT_TIMESTAMP
	`, key).Scan(&count)
	return count > 0, err
}

func (s *SQLiteDB) SetJSON(key string, value interface{}, expiration time.Duration) error {
	return s.CacheSet(key, value, expiration)
}

func (s *SQLiteDB) GetJSON(key string, dest interface{}) error {
	return s.CacheGet(key, dest)
}

// Cleanup expired entries
func (s *SQLiteDB) CleanupExpired() error {
	// Clean expired sessions
	if _, err := s.DB.Exec("DELETE FROM sessions WHERE expires_at <= CURRENT_TIMESTAMP"); err != nil {
		return err
	}
	
	// Clean expired cache entries
	if _, err := s.DB.Exec("DELETE FROM cache WHERE expires_at <= CURRENT_TIMESTAMP"); err != nil {
		return err
	}
	
	return nil
}

// Start periodic cleanup goroutine
func (s *SQLiteDB) StartCleanupWorker() {
	go func() {
		ticker := time.NewTicker(30 * time.Minute) // Clean up every 30 minutes
		defer ticker.Stop()
		
		for {
			select {
			case <-ticker.C:
				if err := s.CleanupExpired(); err != nil {
					// Log error but continue
					fmt.Printf("Error cleaning up expired entries: %v\n", err)
				}
			}
		}
	}()
}