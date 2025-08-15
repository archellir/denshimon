package databases

import (
	"context"
)

// DatabaseProvider defines the interface that all database providers must implement
type DatabaseProvider interface {
	// Type returns the provider type (postgresql, sqlite)
	Type() DatabaseType

	// Connect establishes a connection to the database
	Connect(ctx context.Context, config DatabaseConfig) error

	// Disconnect closes the database connection
	Disconnect(ctx context.Context) error

	// TestConnection tests the database connection
	TestConnection(ctx context.Context, config DatabaseConfig) (*TestConnectionResult, error)

	// GetDatabases returns a list of databases
	GetDatabases(ctx context.Context) ([]DatabaseInfo, error)

	// GetTables returns a list of tables in a database
	GetTables(ctx context.Context, database string) ([]TableInfo, error)

	// GetColumns returns column information for a table
	GetColumns(ctx context.Context, database, table string) ([]ColumnInfo, error)

	// ExecuteQuery executes a SQL query and returns results
	ExecuteQuery(ctx context.Context, req QueryRequest) (*QueryResult, error)

	// GetTableData returns paginated data from a table
	GetTableData(ctx context.Context, req TableDataRequest) (*QueryResult, error)

	// UpdateRow updates a single row in a table
	UpdateRow(ctx context.Context, req RowUpdateRequest) error

	// DeleteRow deletes a single row from a table
	DeleteRow(ctx context.Context, req RowDeleteRequest) error

	// InsertRow inserts a new row into a table
	InsertRow(ctx context.Context, req RowInsertRequest) error

	// GetStats returns database statistics
	GetStats(ctx context.Context) (*DatabaseStats, error)

	// IsConnected returns whether the provider is currently connected
	IsConnected() bool

	// GetConnectionInfo returns current connection information
	GetConnectionInfo() *DatabaseConfig
}

// DatabaseProviderFactory creates database providers
type DatabaseProviderFactory interface {
	// CreateProvider creates a new database provider of the specified type
	CreateProvider(dbType DatabaseType) (DatabaseProvider, error)

	// GetSupportedTypes returns a list of supported database types
	GetSupportedTypes() []DatabaseType
}
