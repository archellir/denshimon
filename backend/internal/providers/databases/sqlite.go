package databases

import (
	"context"
	"database/sql"
	"fmt"
	"os"
	"strings"
	"time"
	
	_ "github.com/mattn/go-sqlite3"
)

// SQLiteProvider implements the DatabaseProvider interface for SQLite
type SQLiteProvider struct {
	config DatabaseConfig
	db     *sql.DB
}

// NewSQLiteProvider creates a new SQLite provider
func NewSQLiteProvider() DatabaseProvider {
	return &SQLiteProvider{}
}

// Type returns the provider type
func (s *SQLiteProvider) Type() DatabaseType {
	return DatabaseTypeSQLite
}

// Connect establishes a connection to SQLite
func (s *SQLiteProvider) Connect(ctx context.Context, config DatabaseConfig) error {
	s.config = config
	
	if config.FilePath == "" {
		return fmt.Errorf("file path is required for SQLite connection")
	}
	
	// Check if file exists
	if _, err := os.Stat(config.FilePath); os.IsNotExist(err) {
		return fmt.Errorf("SQLite database file does not exist: %s", config.FilePath)
	}
	
	db, err := sql.Open("sqlite3", config.FilePath)
	if err != nil {
		return fmt.Errorf("failed to open SQLite database: %w", err)
	}
	
	// Test the connection
	if err := db.PingContext(ctx); err != nil {
		db.Close()
		return fmt.Errorf("failed to ping SQLite database: %w", err)
	}
	
	// SQLite specific settings
	db.SetMaxOpenConns(1) // SQLite works best with single connection
	db.SetMaxIdleConns(1)
	db.SetConnMaxLifetime(0) // No connection limit for SQLite
	
	s.db = db
	return nil
}

// Disconnect closes the database connection
func (s *SQLiteProvider) Disconnect(ctx context.Context) error {
	if s.db != nil {
		return s.db.Close()
	}
	return nil
}

// TestConnection tests the SQLite database connection
func (s *SQLiteProvider) TestConnection(ctx context.Context, config DatabaseConfig) (*TestConnectionResult, error) {
	start := time.Now()
	
	if config.FilePath == "" {
		return &TestConnectionResult{
			Success:      false,
			Error:        "file path is required for SQLite connection",
			ResponseTime: time.Since(start),
		}, nil
	}
	
	// Check if file exists and is readable
	if _, err := os.Stat(config.FilePath); os.IsNotExist(err) {
		return &TestConnectionResult{
			Success:      false,
			Error:        fmt.Sprintf("SQLite database file does not exist: %s", config.FilePath),
			ResponseTime: time.Since(start),
		}, nil
	}
	
	db, err := sql.Open("sqlite3", config.FilePath)
	if err != nil {
		return &TestConnectionResult{
			Success:      false,
			Error:        err.Error(),
			ResponseTime: time.Since(start),
		}, nil
	}
	defer db.Close()
	
	// Test connection and get version
	var version string
	err = db.QueryRowContext(ctx, "SELECT sqlite_version()").Scan(&version)
	if err != nil {
		return &TestConnectionResult{
			Success:      false,
			Error:        err.Error(),
			ResponseTime: time.Since(start),
		}, nil
	}
	
	return &TestConnectionResult{
		Success:      true,
		ResponseTime: time.Since(start),
		Version:      "SQLite " + version,
	}, nil
}

// GetDatabases returns a list of databases (for SQLite, this is just the main database)
func (s *SQLiteProvider) GetDatabases(ctx context.Context) ([]DatabaseInfo, error) {
	if s.db == nil {
		return nil, fmt.Errorf("not connected to database")
	}
	
	// Get file size
	fileInfo, err := os.Stat(s.config.FilePath)
	var size int64
	if err == nil {
		size = fileInfo.Size()
	}
	
	// Count tables
	var tableCount int
	err = s.db.QueryRowContext(ctx, 
		"SELECT count(*) FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").Scan(&tableCount)
	if err != nil {
		tableCount = 0
	}
	
	dbInfo := DatabaseInfo{
		Name:            "main",
		Size:            size,
		TableCount:      tableCount,
		Owner:           "",
		Encoding:        "UTF-8",
		Collation:       "",
		ConnectionCount: 1, // SQLite single connection
	}
	
	if fileInfo != nil {
		createdAt := fileInfo.ModTime()
		dbInfo.CreatedAt = &createdAt
	}
	
	return []DatabaseInfo{dbInfo}, nil
}

// GetTables returns a list of tables in the SQLite database
func (s *SQLiteProvider) GetTables(ctx context.Context, database string) ([]TableInfo, error) {
	if s.db == nil {
		return nil, fmt.Errorf("not connected to database")
	}
	
	query := `
		SELECT 
			name,
			type,
			sql
		FROM sqlite_master 
		WHERE type IN ('table', 'view') 
			AND name NOT LIKE 'sqlite_%'
		ORDER BY name
	`
	
	rows, err := s.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	
	var tables []TableInfo
	for rows.Next() {
		var table TableInfo
		var tableType string
		var sql sql.NullString
		
		err := rows.Scan(&table.Name, &tableType, &sql)
		if err != nil {
			return nil, err
		}
		
		table.Schema = "main"
		table.Type = tableType
		
		// Get row count for each table
		countQuery := fmt.Sprintf("SELECT count(*) FROM [%s]", table.Name)
		s.db.QueryRowContext(ctx, countQuery).Scan(&table.RowCount)
		
		// SQLite doesn't have easy way to get table size, approximate it
		table.Size = table.RowCount * 100 // Rough estimate
		
		tables = append(tables, table)
	}
	
	return tables, nil
}

// GetColumns returns column information for a table
func (s *SQLiteProvider) GetColumns(ctx context.Context, database, table string) ([]ColumnInfo, error) {
	if s.db == nil {
		return nil, fmt.Errorf("not connected to database")
	}
	
	// Get column info using PRAGMA table_info
	rows, err := s.db.QueryContext(ctx, fmt.Sprintf("PRAGMA table_info([%s])", table))
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	
	var columns []ColumnInfo
	for rows.Next() {
		var col ColumnInfo
		var cid int
		var defaultVal sql.NullString
		var notNull int
		var primaryKey int
		
		err := rows.Scan(&cid, &col.Name, &col.Type, &notNull, &defaultVal, &primaryKey)
		if err != nil {
			return nil, err
		}
		
		col.Nullable = notNull == 0
		col.IsPrimaryKey = primaryKey == 1
		
		if defaultVal.Valid {
			col.Default = defaultVal.String
		}
		
		// Check for unique constraints
		uniqueQuery := `
			SELECT count(*) 
			FROM sqlite_master 
			WHERE type='index' 
				AND tbl_name=? 
				AND sql LIKE '%UNIQUE%' 
				AND sql LIKE ?
		`
		var uniqueCount int
		s.db.QueryRowContext(ctx, uniqueQuery, table, "%"+col.Name+"%").Scan(&uniqueCount)
		col.IsUnique = uniqueCount > 0
		
		// Check for any index on this column
		indexQuery := `
			SELECT count(*) 
			FROM sqlite_master 
			WHERE type='index' 
				AND tbl_name=? 
				AND sql LIKE ?
		`
		var indexCount int
		s.db.QueryRowContext(ctx, indexQuery, table, "%"+col.Name+"%").Scan(&indexCount)
		col.IsIndex = indexCount > 0
		
		columns = append(columns, col)
	}
	
	return columns, nil
}

// ExecuteQuery executes a SQL query and returns results
func (s *SQLiteProvider) ExecuteQuery(ctx context.Context, req QueryRequest) (*QueryResult, error) {
	if s.db == nil {
		return nil, fmt.Errorf("not connected to database")
	}
	
	start := time.Now()
	
	// Add LIMIT if specified
	query := req.SQL
	if req.Limit > 0 {
		query += fmt.Sprintf(" LIMIT %d", req.Limit)
	}
	if req.Offset > 0 {
		query += fmt.Sprintf(" OFFSET %d", req.Offset)
	}
	
	// Check if this is a SELECT query
	trimmedQuery := strings.TrimSpace(strings.ToUpper(query))
	isSelect := strings.HasPrefix(trimmedQuery, "SELECT")
	
	if isSelect {
		return s.executeSelectQuery(ctx, query, start)
	} else {
		return s.executeNonSelectQuery(ctx, query, start)
	}
}

// executeSelectQuery handles SELECT queries
func (s *SQLiteProvider) executeSelectQuery(ctx context.Context, query string, start time.Time) (*QueryResult, error) {
	rows, err := s.db.QueryContext(ctx, query)
	if err != nil {
		return &QueryResult{
			Error:    err.Error(),
			Duration: time.Since(start),
		}, nil
	}
	defer rows.Close()
	
	// Get column names
	columns, err := rows.Columns()
	if err != nil {
		return &QueryResult{
			Error:    err.Error(),
			Duration: time.Since(start),
		}, nil
	}
	
	// Read all rows
	var results [][]interface{}
	for rows.Next() {
		values := make([]interface{}, len(columns))
		valuePtrs := make([]interface{}, len(columns))
		for i := range values {
			valuePtrs[i] = &values[i]
		}
		
		if err := rows.Scan(valuePtrs...); err != nil {
			return &QueryResult{
				Error:    err.Error(),
				Duration: time.Since(start),
			}, nil
		}
		
		// Convert byte arrays to strings for SQLite
		for i, val := range values {
			if b, ok := val.([]byte); ok {
				values[i] = string(b)
			}
		}
		
		results = append(results, values)
	}
	
	return &QueryResult{
		Columns:  columns,
		Rows:     results,
		RowCount: len(results),
		Duration: time.Since(start),
	}, nil
}

// executeNonSelectQuery handles INSERT, UPDATE, DELETE queries
func (s *SQLiteProvider) executeNonSelectQuery(ctx context.Context, query string, start time.Time) (*QueryResult, error) {
	result, err := s.db.ExecContext(ctx, query)
	if err != nil {
		return &QueryResult{
			Error:    err.Error(),
			Duration: time.Since(start),
		}, nil
	}
	
	rowsAffected, _ := result.RowsAffected()
	
	return &QueryResult{
		Columns:      []string{"Result"},
		Rows:         [][]interface{}{{"Query executed successfully"}},
		RowCount:     1,
		AffectedRows: rowsAffected,
		Duration:     time.Since(start),
	}, nil
}

// GetTableData returns paginated data from a table
func (s *SQLiteProvider) GetTableData(ctx context.Context, req TableDataRequest) (*QueryResult, error) {
	if s.db == nil {
		return nil, fmt.Errorf("not connected to database")
	}
	
	query := fmt.Sprintf("SELECT * FROM [%s]", req.Table)
	
	if req.Where != "" {
		query += fmt.Sprintf(" WHERE %s", req.Where)
	}
	
	if req.Order != "" {
		query += fmt.Sprintf(" ORDER BY %s", req.Order)
	}
	
	return s.ExecuteQuery(ctx, QueryRequest{
		SQL:    query,
		Limit:  req.Limit,
		Offset: req.Offset,
	})
}

// UpdateRow updates a single row in a table
func (s *SQLiteProvider) UpdateRow(ctx context.Context, req RowUpdateRequest) error {
	if s.db == nil {
		return fmt.Errorf("not connected to database")
	}
	
	var setParts []string
	var args []interface{}
	
	for col, val := range req.Values {
		setParts = append(setParts, fmt.Sprintf("[%s] = ?", col))
		args = append(args, val)
	}
	
	query := fmt.Sprintf("UPDATE [%s] SET %s WHERE %s", 
		req.Table, 
		strings.Join(setParts, ", "), 
		req.Where)
	
	_, err := s.db.ExecContext(ctx, query, args...)
	return err
}

// DeleteRow deletes a single row from a table
func (s *SQLiteProvider) DeleteRow(ctx context.Context, req RowDeleteRequest) error {
	if s.db == nil {
		return fmt.Errorf("not connected to database")
	}
	
	query := fmt.Sprintf("DELETE FROM [%s] WHERE %s", req.Table, req.Where)
	
	_, err := s.db.ExecContext(ctx, query)
	return err
}

// InsertRow inserts a new row into a table
func (s *SQLiteProvider) InsertRow(ctx context.Context, req RowInsertRequest) error {
	if s.db == nil {
		return fmt.Errorf("not connected to database")
	}
	
	var columns []string
	var placeholders []string
	var args []interface{}
	
	for col, val := range req.Values {
		columns = append(columns, fmt.Sprintf("[%s]", col))
		placeholders = append(placeholders, "?")
		args = append(args, val)
	}
	
	query := fmt.Sprintf("INSERT INTO [%s] (%s) VALUES (%s)", 
		req.Table,
		strings.Join(columns, ", "),
		strings.Join(placeholders, ", "))
	
	_, err := s.db.ExecContext(ctx, query, args...)
	return err
}

// GetStats returns database statistics
func (s *SQLiteProvider) GetStats(ctx context.Context) (*DatabaseStats, error) {
	if s.db == nil {
		return nil, fmt.Errorf("not connected to database")
	}
	
	stats := &DatabaseStats{}
	
	// Connection stats (SQLite is single connection)
	stats.Connections = ConnectionStats{
		Active:  1,
		Idle:    0,
		Total:   1,
		MaxConn: 1,
	}
	
	// Storage stats
	fileInfo, err := os.Stat(s.config.FilePath)
	if err == nil {
		stats.Storage = StorageStats{
			TotalSize: fileInfo.Size(),
			UsedSize:  fileInfo.Size(),
			FreeSize:  0, // SQLite file size is the used size
		}
	}
	
	// Performance stats - basic for SQLite
	stats.Performance = PerformanceStats{
		QueriesPerSecond: 0, // Would need query tracking
		AvgQueryTime:     0,
		SlowQueries:      0,
		CacheHitRatio:    0,
	}
	
	return stats, nil
}

// IsConnected returns whether the provider is currently connected
func (s *SQLiteProvider) IsConnected() bool {
	if s.db == nil {
		return false
	}
	
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()
	
	return s.db.PingContext(ctx) == nil
}

// GetConnectionInfo returns current connection information
func (s *SQLiteProvider) GetConnectionInfo() *DatabaseConfig {
	return &s.config
}