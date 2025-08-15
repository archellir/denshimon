package databases

import (
	"time"
)

// DatabaseType represents the type of database
type DatabaseType string

const (
	DatabaseTypePostgreSQL DatabaseType = "postgresql"
	DatabaseTypeSQLite     DatabaseType = "sqlite"
)

// DatabaseStatus represents the connection status
type DatabaseStatus string

const (
	DatabaseStatusConnected    DatabaseStatus = "connected"
	DatabaseStatusDisconnected DatabaseStatus = "disconnected"
	DatabaseStatusError        DatabaseStatus = "error"
	DatabaseStatusConnecting   DatabaseStatus = "connecting"
)

// DatabaseConfig holds the configuration for a database connection
type DatabaseConfig struct {
	ID         string                 `json:"id"`
	Name       string                 `json:"name"`
	Type       DatabaseType           `json:"type"`
	Host       string                 `json:"host,omitempty"`
	Port       int                    `json:"port,omitempty"`
	Database   string                 `json:"database,omitempty"`
	Username   string                 `json:"username,omitempty"`
	Password   string                 `json:"password,omitempty"`
	SSLMode    string                 `json:"ssl_mode,omitempty"`
	FilePath   string                 `json:"file_path,omitempty"`
	Extra      map[string]interface{} `json:"extra,omitempty"`
	Status     DatabaseStatus         `json:"status"`
	LastTested *time.Time             `json:"last_tested,omitempty"`
	Error      string                 `json:"error,omitempty"`
	CreatedAt  time.Time              `json:"created_at"`
	UpdatedAt  time.Time              `json:"updated_at"`
}

// DatabaseInfo represents metadata about a database
type DatabaseInfo struct {
	Name            string     `json:"name"`
	Size            int64      `json:"size"`
	TableCount      int        `json:"table_count"`
	Owner           string     `json:"owner,omitempty"`
	Encoding        string     `json:"encoding,omitempty"`
	Collation       string     `json:"collation,omitempty"`
	ConnectionCount int        `json:"connection_count,omitempty"`
	CreatedAt       *time.Time `json:"created_at,omitempty"`
}

// TableInfo represents metadata about a database table
type TableInfo struct {
	Name      string     `json:"name"`
	Schema    string     `json:"schema,omitempty"`
	RowCount  int64      `json:"row_count"`
	Size      int64      `json:"size"`
	Type      string     `json:"type"`
	Owner     string     `json:"owner,omitempty"`
	CreatedAt *time.Time `json:"created_at,omitempty"`
	UpdatedAt *time.Time `json:"updated_at,omitempty"`
	Comment   string     `json:"comment,omitempty"`
}

// ColumnInfo represents metadata about a table column
type ColumnInfo struct {
	Name         string      `json:"name"`
	Type         string      `json:"type"`
	Length       int         `json:"length,omitempty"`
	Precision    int         `json:"precision,omitempty"`
	Scale        int         `json:"scale,omitempty"`
	Nullable     bool        `json:"nullable"`
	Default      interface{} `json:"default,omitempty"`
	IsPrimaryKey bool        `json:"is_primary_key"`
	IsUnique     bool        `json:"is_unique"`
	IsIndex      bool        `json:"is_index"`
	Comment      string      `json:"comment,omitempty"`
}

// QueryResult represents the result of a SQL query
type QueryResult struct {
	Columns      []string        `json:"columns"`
	Rows         [][]interface{} `json:"rows"`
	RowCount     int             `json:"row_count"`
	AffectedRows int64           `json:"affected_rows,omitempty"`
	Duration     time.Duration   `json:"duration"`
	Error        string          `json:"error,omitempty"`
}

// QueryRequest represents a SQL query request
type QueryRequest struct {
	SQL    string `json:"sql"`
	Limit  int    `json:"limit,omitempty"`
	Offset int    `json:"offset,omitempty"`
}

// TableDataRequest represents a request for table data
type TableDataRequest struct {
	Table  string `json:"table"`
	Schema string `json:"schema,omitempty"`
	Limit  int    `json:"limit,omitempty"`
	Offset int    `json:"offset,omitempty"`
	Where  string `json:"where,omitempty"`
	Order  string `json:"order,omitempty"`
}

// RowUpdateRequest represents a request to update a table row
type RowUpdateRequest struct {
	Table  string                 `json:"table"`
	Schema string                 `json:"schema,omitempty"`
	Where  string                 `json:"where"`
	Values map[string]interface{} `json:"values"`
}

// RowDeleteRequest represents a request to delete a table row
type RowDeleteRequest struct {
	Table  string `json:"table"`
	Schema string `json:"schema,omitempty"`
	Where  string `json:"where"`
}

// RowInsertRequest represents a request to insert a new table row
type RowInsertRequest struct {
	Table  string                 `json:"table"`
	Schema string                 `json:"schema,omitempty"`
	Values map[string]interface{} `json:"values"`
}

// DatabaseStats represents database performance statistics
type DatabaseStats struct {
	Connections ConnectionStats  `json:"connections"`
	Performance PerformanceStats `json:"performance"`
	Storage     StorageStats     `json:"storage"`
}

// ConnectionStats represents connection statistics
type ConnectionStats struct {
	Active  int `json:"active"`
	Idle    int `json:"idle"`
	Total   int `json:"total"`
	MaxConn int `json:"max_conn"`
}

// PerformanceStats represents performance statistics
type PerformanceStats struct {
	QueriesPerSecond float64 `json:"queries_per_second"`
	AvgQueryTime     float64 `json:"avg_query_time"`
	SlowQueries      int     `json:"slow_queries"`
	CacheHitRatio    float64 `json:"cache_hit_ratio"`
}

// StorageStats represents storage statistics
type StorageStats struct {
	TotalSize      int64 `json:"total_size"`
	UsedSize       int64 `json:"used_size"`
	FreeSize       int64 `json:"free_size"`
	TablespaceSize int64 `json:"tablespace_size,omitempty"`
}

// TestConnectionResult represents the result of testing a database connection
type TestConnectionResult struct {
	Success      bool          `json:"success"`
	Error        string        `json:"error,omitempty"`
	ResponseTime time.Duration `json:"response_time"`
	Version      string        `json:"version,omitempty"`
}
