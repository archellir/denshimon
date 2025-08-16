package databases

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"sync"
	"time"

	"github.com/google/uuid"
)

// Manager manages database connections and providers
type Manager struct {
	db        *sql.DB
	providers map[string]DatabaseProvider
	configs   map[string]DatabaseConfig
	mutex     sync.RWMutex
}

// NewManager creates a new database manager
func NewManager(db *sql.DB) *Manager {
	manager := &Manager{
		db:        db,
		providers: make(map[string]DatabaseProvider),
		configs:   make(map[string]DatabaseConfig),
	}

	// Initialize database table
	manager.initDB()

	// Load existing configurations
	manager.loadConfigurations()

	return manager
}

// initDB creates the database connections table
func (m *Manager) initDB() error {
	query := `
		CREATE TABLE IF NOT EXISTS database_connections (
			id TEXT PRIMARY KEY,
			name TEXT NOT NULL,
			type TEXT NOT NULL,
			config TEXT NOT NULL,
			status TEXT DEFAULT 'disconnected',
			last_tested TIMESTAMP,
			error TEXT,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)
	`

	_, err := m.db.Exec(query)
	return err
}

// loadConfigurations loads existing database configurations from storage
func (m *Manager) loadConfigurations() {
	query := `
		SELECT id, name, type, config, status, last_tested, error, created_at, updated_at
		FROM database_connections
	`

	rows, err := m.db.Query(query)
	if err != nil {
		return
	}
	defer rows.Close()

	for rows.Next() {
		var config DatabaseConfig
		var configJSON string
		var lastTested sql.NullTime
		var errorMsg sql.NullString

		err := rows.Scan(
			&config.ID,
			&config.Name,
			&config.Type,
			&configJSON,
			&config.Status,
			&lastTested,
			&errorMsg,
			&config.CreatedAt,
			&config.UpdatedAt,
		)
		if err != nil {
			continue
		}

		// Parse config JSON
		if err := json.Unmarshal([]byte(configJSON), &config); err != nil {
			continue
		}

		if lastTested.Valid {
			config.LastTested = &lastTested.Time
		}
		if errorMsg.Valid {
			config.Error = errorMsg.String
		}

		m.configs[config.ID] = config
	}
}

// CreateProvider creates a new database provider of the specified type
func (m *Manager) CreateProvider(dbType DatabaseType) (DatabaseProvider, error) {
	switch dbType {
	case DatabaseTypePostgreSQL:
		return NewPostgreSQLProvider(), nil
	case DatabaseTypeSQLite:
		return NewSQLiteProvider(), nil
	default:
		return nil, fmt.Errorf("unsupported database type: %s", dbType)
	}
}

// GetSupportedTypes returns a list of supported database types
func (m *Manager) GetSupportedTypes() []DatabaseType {
	return []DatabaseType{
		DatabaseTypePostgreSQL,
		DatabaseTypeSQLite,
	}
}

// AddConnection adds a new database connection configuration
func (m *Manager) AddConnection(ctx context.Context, config DatabaseConfig) (*DatabaseConfig, error) {
	m.mutex.Lock()
	defer m.mutex.Unlock()

	// Generate ID if not provided
	if config.ID == "" {
		config.ID = uuid.New().String()
	}

	// Set timestamps
	config.CreatedAt = time.Now()
	config.UpdatedAt = time.Now()
	config.Status = DatabaseStatusDisconnected

	// Test the connection
	provider, err := m.CreateProvider(config.Type)
	if err != nil {
		return nil, fmt.Errorf("failed to create provider: %w", err)
	}

	testResult, err := provider.TestConnection(ctx, config)
	if err != nil {
		config.Status = DatabaseStatusError
		config.Error = err.Error()
	} else if !testResult.Success {
		config.Status = DatabaseStatusError
		config.Error = testResult.Error
	} else {
		config.Status = DatabaseStatusDisconnected
		config.Error = ""
	}

	now := time.Now()
	config.LastTested = &now

	// Store in database
	if err := m.storeConfiguration(config); err != nil {
		return nil, fmt.Errorf("failed to store configuration: %w", err)
	}

	// Store in memory
	m.configs[config.ID] = config

	return &config, nil
}

// UpdateConnection updates an existing database connection configuration
func (m *Manager) UpdateConnection(ctx context.Context, config DatabaseConfig) (*DatabaseConfig, error) {
	m.mutex.Lock()
	defer m.mutex.Unlock()

	// Check if connection exists
	if _, exists := m.configs[config.ID]; !exists {
		return nil, fmt.Errorf("connection not found: %s", config.ID)
	}

	// Update timestamp
	config.UpdatedAt = time.Now()

	// Test the connection
	provider, err := m.CreateProvider(config.Type)
	if err != nil {
		return nil, fmt.Errorf("failed to create provider: %w", err)
	}

	testResult, err := provider.TestConnection(ctx, config)
	if err != nil {
		config.Status = DatabaseStatusError
		config.Error = err.Error()
	} else if !testResult.Success {
		config.Status = DatabaseStatusError
		config.Error = testResult.Error
	} else {
		config.Status = DatabaseStatusDisconnected
		config.Error = ""
	}

	now := time.Now()
	config.LastTested = &now

	// Update in database
	if err := m.updateConfiguration(config); err != nil {
		return nil, fmt.Errorf("failed to update configuration: %w", err)
	}

	// Update in memory
	m.configs[config.ID] = config

	// If there's an active connection, disconnect it
	if provider, exists := m.providers[config.ID]; exists {
		provider.Disconnect(ctx)
		delete(m.providers, config.ID)
	}

	return &config, nil
}

// DeleteConnection removes a database connection configuration
func (m *Manager) DeleteConnection(ctx context.Context, id string) error {
	m.mutex.Lock()
	defer m.mutex.Unlock()

	// Disconnect if connected
	if provider, exists := m.providers[id]; exists {
		provider.Disconnect(ctx)
		delete(m.providers, id)
	}

	// Remove from database
	_, err := m.db.Exec("DELETE FROM database_connections WHERE id = ?", id)
	if err != nil {
		return fmt.Errorf("failed to delete configuration: %w", err)
	}

	// Remove from memory
	delete(m.configs, id)

	return nil
}

// GetConnections returns all database connection configurations
func (m *Manager) GetConnections() []DatabaseConfig {
	m.mutex.RLock()
	defer m.mutex.RUnlock()

	configs := make([]DatabaseConfig, 0, len(m.configs))
	for _, config := range m.configs {
		// Update status based on active connections
		if provider, exists := m.providers[config.ID]; exists && provider.IsConnected() {
			config.Status = DatabaseStatusConnected
		} else {
			config.Status = DatabaseStatusDisconnected
		}
		configs = append(configs, config)
	}

	return configs
}

// GetConnection returns a specific database connection configuration
func (m *Manager) GetConnection(id string) (*DatabaseConfig, error) {
	m.mutex.RLock()
	defer m.mutex.RUnlock()

	config, exists := m.configs[id]
	if !exists {
		return nil, fmt.Errorf("connection not found: %s", id)
	}

	// Update status based on active connection
	if provider, exists := m.providers[id]; exists && provider.IsConnected() {
		config.Status = DatabaseStatusConnected
	} else {
		config.Status = DatabaseStatusDisconnected
	}

	return &config, nil
}

// Connect establishes a connection to a database
func (m *Manager) Connect(ctx context.Context, id string) error {
	m.mutex.Lock()
	defer m.mutex.Unlock()

	config, exists := m.configs[id]
	if !exists {
		return fmt.Errorf("connection not found: %s", id)
	}

	// Check if already connected
	if provider, exists := m.providers[id]; exists && provider.IsConnected() {
		return nil // Already connected
	}

	// Create provider
	provider, err := m.CreateProvider(config.Type)
	if err != nil {
		return fmt.Errorf("failed to create provider: %w", err)
	}

	// Connect
	if err := provider.Connect(ctx, config); err != nil {
		config.Status = DatabaseStatusError
		config.Error = err.Error()
		m.updateConfiguration(config)
		return fmt.Errorf("failed to connect: %w", err)
	}

	// Store active provider
	m.providers[id] = provider

	// Update status
	config.Status = DatabaseStatusConnected
	config.Error = ""
	config.UpdatedAt = time.Now()
	m.configs[id] = config
	m.updateConfiguration(config)

	return nil
}

// Disconnect closes a database connection
func (m *Manager) Disconnect(ctx context.Context, id string) error {
	m.mutex.Lock()
	defer m.mutex.Unlock()

	provider, exists := m.providers[id]
	if !exists {
		return nil // Not connected
	}

	if err := provider.Disconnect(ctx); err != nil {
		return fmt.Errorf("failed to disconnect: %w", err)
	}

	delete(m.providers, id)

	// Update status
	if config, exists := m.configs[id]; exists {
		config.Status = DatabaseStatusDisconnected
		config.UpdatedAt = time.Now()
		m.configs[id] = config
		m.updateConfiguration(config)
	}

	return nil
}

// GetProvider returns an active database provider
func (m *Manager) GetProvider(id string) (DatabaseProvider, error) {
	m.mutex.RLock()
	defer m.mutex.RUnlock()

	provider, exists := m.providers[id]
	if !exists {
		return nil, fmt.Errorf("not connected to database: %s", id)
	}

	if !provider.IsConnected() {
		return nil, fmt.Errorf("database connection is not active: %s", id)
	}

	return provider, nil
}

// TestConnection tests a database connection without storing it
func (m *Manager) TestConnection(ctx context.Context, config DatabaseConfig) (*TestConnectionResult, error) {
	provider, err := m.CreateProvider(config.Type)
	if err != nil {
		return nil, fmt.Errorf("failed to create provider: %w", err)
	}

	return provider.TestConnection(ctx, config)
}

// storeConfiguration stores a database configuration
func (m *Manager) storeConfiguration(config DatabaseConfig) error {
	configJSON, err := json.Marshal(config)
	if err != nil {
		return err
	}

	query := `
		INSERT INTO database_connections 
		(id, name, type, config, status, last_tested, error, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
	`

	_, err = m.db.Exec(query,
		config.ID,
		config.Name,
		config.Type,
		string(configJSON),
		config.Status,
		config.LastTested,
		config.Error,
		config.CreatedAt,
		config.UpdatedAt,
	)

	return err
}

// updateConfiguration updates a database configuration
func (m *Manager) updateConfiguration(config DatabaseConfig) error {
	configJSON, err := json.Marshal(config)
	if err != nil {
		return err
	}

	query := `
		UPDATE database_connections 
		SET name = ?, type = ?, config = ?, status = ?, last_tested = ?, error = ?, updated_at = ?
		WHERE id = ?
	`

	_, err = m.db.Exec(query,
		config.Name,
		config.Type,
		string(configJSON),
		config.Status,
		config.LastTested,
		config.Error,
		config.UpdatedAt,
		config.ID,
	)

	return err
}

// Cleanup disconnects all active connections
func (m *Manager) Cleanup(ctx context.Context) {
	m.mutex.Lock()
	defer m.mutex.Unlock()

	for id, provider := range m.providers {
		provider.Disconnect(ctx)
		delete(m.providers, id)
	}
}

// GetSavedQueries returns all saved queries
func (m *Manager) GetSavedQueries(ctx context.Context) ([]SavedQuery, error) {
	query := `
		SELECT id, name, sql, connection_id, created_at, updated_at
		FROM saved_queries
		ORDER BY created_at DESC
	`
	
	rows, err := m.db.QueryContext(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to query saved queries: %w", err)
	}
	defer rows.Close()

	var queries []SavedQuery
	for rows.Next() {
		var query SavedQuery
		var connectionID sql.NullString
		
		err := rows.Scan(
			&query.ID,
			&query.Name,
			&query.SQL,
			&connectionID,
			&query.CreatedAt,
			&query.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan saved query: %w", err)
		}
		
		if connectionID.Valid {
			query.ConnectionID = &connectionID.String
		}
		
		queries = append(queries, query)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating saved queries: %w", err)
	}

	return queries, nil
}

// CreateSavedQuery creates a new saved query
func (m *Manager) CreateSavedQuery(ctx context.Context, req SavedQuery) (*SavedQuery, error) {
	id := uuid.New().String()
	now := time.Now()
	
	query := `
		INSERT INTO saved_queries (id, name, sql, connection_id, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6)
	`
	
	_, err := m.db.ExecContext(ctx, query, id, req.Name, req.SQL, req.ConnectionID, now, now)
	if err != nil {
		return nil, fmt.Errorf("failed to create saved query: %w", err)
	}

	return &SavedQuery{
		ID:           id,
		Name:         req.Name,
		SQL:          req.SQL,
		ConnectionID: req.ConnectionID,
		CreatedAt:    now,
		UpdatedAt:    now,
	}, nil
}

// UpdateSavedQuery updates an existing saved query
func (m *Manager) UpdateSavedQuery(ctx context.Context, id string, req SavedQuery) (*SavedQuery, error) {
	now := time.Now()
	
	query := `
		UPDATE saved_queries
		SET name = $1, sql = $2, connection_id = $3, updated_at = $4
		WHERE id = $5
	`
	
	result, err := m.db.ExecContext(ctx, query, req.Name, req.SQL, req.ConnectionID, now, id)
	if err != nil {
		return nil, fmt.Errorf("failed to update saved query: %w", err)
	}
	
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return nil, fmt.Errorf("failed to get rows affected: %w", err)
	}
	
	if rowsAffected == 0 {
		return nil, fmt.Errorf("saved query not found")
	}

	// Get the updated query
	return m.GetSavedQuery(ctx, id)
}

// DeleteSavedQuery deletes a saved query
func (m *Manager) DeleteSavedQuery(ctx context.Context, id string) error {
	query := `DELETE FROM saved_queries WHERE id = $1`
	
	result, err := m.db.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete saved query: %w", err)
	}
	
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}
	
	if rowsAffected == 0 {
		return fmt.Errorf("saved query not found")
	}

	return nil
}

// GetSavedQuery returns a single saved query by ID
func (m *Manager) GetSavedQuery(ctx context.Context, id string) (*SavedQuery, error) {
	query := `
		SELECT id, name, sql, connection_id, created_at, updated_at
		FROM saved_queries
		WHERE id = $1
	`
	
	var savedQuery SavedQuery
	var connectionID sql.NullString
	
	err := m.db.QueryRowContext(ctx, query, id).Scan(
		&savedQuery.ID,
		&savedQuery.Name,
		&savedQuery.SQL,
		&connectionID,
		&savedQuery.CreatedAt,
		&savedQuery.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("saved query not found")
		}
		return nil, fmt.Errorf("failed to get saved query: %w", err)
	}
	
	if connectionID.Valid {
		savedQuery.ConnectionID = &connectionID.String
	}

	return &savedQuery, nil
}
