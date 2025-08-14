package databases

import (
	"context"
	"database/sql"
	"fmt"
	"strconv"
	"strings"
	"time"
	
	_ "github.com/lib/pq"
)

// PostgreSQLProvider implements the DatabaseProvider interface for PostgreSQL
type PostgreSQLProvider struct {
	config DatabaseConfig
	db     *sql.DB
}

// NewPostgreSQLProvider creates a new PostgreSQL provider
func NewPostgreSQLProvider() DatabaseProvider {
	return &PostgreSQLProvider{}
}

// Type returns the provider type
func (p *PostgreSQLProvider) Type() DatabaseType {
	return DatabaseTypePostgreSQL
}

// Connect establishes a connection to PostgreSQL
func (p *PostgreSQLProvider) Connect(ctx context.Context, config DatabaseConfig) error {
	p.config = config
	
	dsn := p.buildConnectionString(config)
	
	db, err := sql.Open("postgres", dsn)
	if err != nil {
		return fmt.Errorf("failed to open database connection: %w", err)
	}
	
	// Test the connection
	if err := db.PingContext(ctx); err != nil {
		db.Close()
		return fmt.Errorf("failed to ping database: %w", err)
	}
	
	// Set connection pool settings
	db.SetMaxOpenConns(10)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(time.Hour)
	
	p.db = db
	return nil
}

// Disconnect closes the database connection
func (p *PostgreSQLProvider) Disconnect(ctx context.Context) error {
	if p.db != nil {
		return p.db.Close()
	}
	return nil
}

// TestConnection tests the database connection
func (p *PostgreSQLProvider) TestConnection(ctx context.Context, config DatabaseConfig) (*TestConnectionResult, error) {
	start := time.Now()
	
	dsn := p.buildConnectionString(config)
	db, err := sql.Open("postgres", dsn)
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
	err = db.QueryRowContext(ctx, "SELECT version()").Scan(&version)
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
		Version:      version,
	}, nil
}

// GetDatabases returns a list of databases
func (p *PostgreSQLProvider) GetDatabases(ctx context.Context) ([]DatabaseInfo, error) {
	if p.db == nil {
		return nil, fmt.Errorf("not connected to database")
	}
	
	query := `
		SELECT 
			d.datname as name,
			pg_database_size(d.datname) as size,
			(SELECT count(*) FROM information_schema.tables 
			 WHERE table_catalog = d.datname AND table_schema = 'public') as table_count,
			r.rolname as owner,
			d.encoding,
			d.datcollate as collation
		FROM pg_database d
		JOIN pg_authid r ON d.datdba = r.oid
		WHERE d.datistemplate = false
		ORDER BY d.datname
	`
	
	rows, err := p.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	
	var databases []DatabaseInfo
	for rows.Next() {
		var db DatabaseInfo
		var encoding int
		
		err := rows.Scan(
			&db.Name,
			&db.Size,
			&db.TableCount,
			&db.Owner,
			&encoding,
			&db.Collation,
		)
		if err != nil {
			return nil, err
		}
		
		// Get connection count for this database
		connQuery := `SELECT count(*) FROM pg_stat_activity WHERE datname = $1`
		p.db.QueryRowContext(ctx, connQuery, db.Name).Scan(&db.ConnectionCount)
		
		databases = append(databases, db)
	}
	
	return databases, nil
}

// GetTables returns a list of tables in a database
func (p *PostgreSQLProvider) GetTables(ctx context.Context, database string) ([]TableInfo, error) {
	if p.db == nil {
		return nil, fmt.Errorf("not connected to database")
	}
	
	query := `
		SELECT 
			t.table_name,
			t.table_schema,
			COALESCE(s.n_tup_ins + s.n_tup_upd + s.n_tup_del, 0) as row_count,
			COALESCE(pg_total_relation_size(c.oid), 0) as size,
			t.table_type,
			obj_description(c.oid) as comment
		FROM information_schema.tables t
		LEFT JOIN pg_class c ON c.relname = t.table_name
		LEFT JOIN pg_stat_user_tables s ON s.relname = t.table_name
		WHERE t.table_catalog = current_database()
			AND t.table_schema NOT IN ('information_schema', 'pg_catalog')
		ORDER BY t.table_schema, t.table_name
	`
	
	rows, err := p.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	
	var tables []TableInfo
	for rows.Next() {
		var table TableInfo
		var tableType string
		var comment sql.NullString
		
		err := rows.Scan(
			&table.Name,
			&table.Schema,
			&table.RowCount,
			&table.Size,
			&tableType,
			&comment,
		)
		if err != nil {
			return nil, err
		}
		
		table.Type = tableType
		if comment.Valid {
			table.Comment = comment.String
		}
		
		tables = append(tables, table)
	}
	
	return tables, nil
}

// GetColumns returns column information for a table
func (p *PostgreSQLProvider) GetColumns(ctx context.Context, database, table string) ([]ColumnInfo, error) {
	if p.db == nil {
		return nil, fmt.Errorf("not connected to database")
	}
	
	query := `
		SELECT 
			c.column_name,
			c.data_type,
			COALESCE(c.character_maximum_length, 0) as length,
			COALESCE(c.numeric_precision, 0) as precision,
			COALESCE(c.numeric_scale, 0) as scale,
			c.is_nullable = 'YES' as nullable,
			c.column_default,
			COALESCE(pk.is_primary, false) as is_primary_key,
			COALESCE(uk.is_unique, false) as is_unique,
			COALESCE(idx.is_index, false) as is_index,
			col_description(pgc.oid, c.ordinal_position) as comment
		FROM information_schema.columns c
		LEFT JOIN pg_class pgc ON pgc.relname = c.table_name
		LEFT JOIN (
			SELECT ku.column_name, true as is_primary
			FROM information_schema.table_constraints tc
			JOIN information_schema.key_column_usage ku 
				ON tc.constraint_name = ku.constraint_name
			WHERE tc.constraint_type = 'PRIMARY KEY' 
				AND tc.table_name = $1
		) pk ON pk.column_name = c.column_name
		LEFT JOIN (
			SELECT ku.column_name, true as is_unique
			FROM information_schema.table_constraints tc
			JOIN information_schema.key_column_usage ku 
				ON tc.constraint_name = ku.constraint_name
			WHERE tc.constraint_type = 'UNIQUE' 
				AND tc.table_name = $1
		) uk ON uk.column_name = c.column_name
		LEFT JOIN (
			SELECT a.attname as column_name, true as is_index
			FROM pg_index i
			JOIN pg_attribute a ON a.attrelid = i.indrelid 
				AND a.attnum = ANY(i.indkey)
			JOIN pg_class t ON t.oid = i.indrelid
			WHERE t.relname = $1
		) idx ON idx.column_name = c.column_name
		WHERE c.table_name = $1
		ORDER BY c.ordinal_position
	`
	
	rows, err := p.db.QueryContext(ctx, query, table)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	
	var columns []ColumnInfo
	for rows.Next() {
		var col ColumnInfo
		var defaultVal sql.NullString
		var comment sql.NullString
		
		err := rows.Scan(
			&col.Name,
			&col.Type,
			&col.Length,
			&col.Precision,
			&col.Scale,
			&col.Nullable,
			&defaultVal,
			&col.IsPrimaryKey,
			&col.IsUnique,
			&col.IsIndex,
			&comment,
		)
		if err != nil {
			return nil, err
		}
		
		if defaultVal.Valid {
			col.Default = defaultVal.String
		}
		if comment.Valid {
			col.Comment = comment.String
		}
		
		columns = append(columns, col)
	}
	
	return columns, nil
}

// ExecuteQuery executes a SQL query and returns results
func (p *PostgreSQLProvider) ExecuteQuery(ctx context.Context, req QueryRequest) (*QueryResult, error) {
	if p.db == nil {
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
	
	rows, err := p.db.QueryContext(ctx, query)
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
		
		// Convert byte arrays to strings
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

// GetTableData returns paginated data from a table
func (p *PostgreSQLProvider) GetTableData(ctx context.Context, req TableDataRequest) (*QueryResult, error) {
	if p.db == nil {
		return nil, fmt.Errorf("not connected to database")
	}
	
	query := fmt.Sprintf("SELECT * FROM %s", req.Table)
	if req.Schema != "" {
		query = fmt.Sprintf("SELECT * FROM %s.%s", req.Schema, req.Table)
	}
	
	if req.Where != "" {
		query += fmt.Sprintf(" WHERE %s", req.Where)
	}
	
	if req.Order != "" {
		query += fmt.Sprintf(" ORDER BY %s", req.Order)
	}
	
	return p.ExecuteQuery(ctx, QueryRequest{
		SQL:    query,
		Limit:  req.Limit,
		Offset: req.Offset,
	})
}

// UpdateRow updates a single row in a table
func (p *PostgreSQLProvider) UpdateRow(ctx context.Context, req RowUpdateRequest) error {
	if p.db == nil {
		return fmt.Errorf("not connected to database")
	}
	
	var setParts []string
	var args []interface{}
	argIndex := 1
	
	for col, val := range req.Values {
		setParts = append(setParts, fmt.Sprintf("%s = $%d", col, argIndex))
		args = append(args, val)
		argIndex++
	}
	
	tableName := req.Table
	if req.Schema != "" {
		tableName = req.Schema + "." + req.Table
	}
	
	query := fmt.Sprintf("UPDATE %s SET %s WHERE %s", 
		tableName, 
		strings.Join(setParts, ", "), 
		req.Where)
	
	_, err := p.db.ExecContext(ctx, query, args...)
	return err
}

// DeleteRow deletes a single row from a table
func (p *PostgreSQLProvider) DeleteRow(ctx context.Context, req RowDeleteRequest) error {
	if p.db == nil {
		return fmt.Errorf("not connected to database")
	}
	
	tableName := req.Table
	if req.Schema != "" {
		tableName = req.Schema + "." + req.Table
	}
	
	query := fmt.Sprintf("DELETE FROM %s WHERE %s", tableName, req.Where)
	
	_, err := p.db.ExecContext(ctx, query)
	return err
}

// InsertRow inserts a new row into a table
func (p *PostgreSQLProvider) InsertRow(ctx context.Context, req RowInsertRequest) error {
	if p.db == nil {
		return fmt.Errorf("not connected to database")
	}
	
	var columns []string
	var placeholders []string
	var args []interface{}
	argIndex := 1
	
	for col, val := range req.Values {
		columns = append(columns, col)
		placeholders = append(placeholders, "$"+strconv.Itoa(argIndex))
		args = append(args, val)
		argIndex++
	}
	
	tableName := req.Table
	if req.Schema != "" {
		tableName = req.Schema + "." + req.Table
	}
	
	query := fmt.Sprintf("INSERT INTO %s (%s) VALUES (%s)", 
		tableName,
		strings.Join(columns, ", "),
		strings.Join(placeholders, ", "))
	
	_, err := p.db.ExecContext(ctx, query, args...)
	return err
}

// GetStats returns database statistics
func (p *PostgreSQLProvider) GetStats(ctx context.Context) (*DatabaseStats, error) {
	if p.db == nil {
		return nil, fmt.Errorf("not connected to database")
	}
	
	stats := &DatabaseStats{}
	
	// Connection stats
	var activeConns, idleConns, totalConns, maxConns int
	err := p.db.QueryRowContext(ctx, `
		SELECT 
			count(*) FILTER (WHERE state = 'active') as active,
			count(*) FILTER (WHERE state = 'idle') as idle,
			count(*) as total,
			setting::int as max_connections
		FROM pg_stat_activity, pg_settings 
		WHERE name = 'max_connections'
		GROUP BY setting
	`).Scan(&activeConns, &idleConns, &totalConns, &maxConns)
	
	if err == nil {
		stats.Connections = ConnectionStats{
			Active:  activeConns,
			Idle:    idleConns,
			Total:   totalConns,
			MaxConn: maxConns,
		}
	}
	
	// Storage stats
	var totalSize, usedSize int64
	err = p.db.QueryRowContext(ctx, `
		SELECT 
			sum(pg_database_size(datname)) as total_size,
			sum(pg_database_size(datname)) as used_size
		FROM pg_database 
		WHERE datistemplate = false
	`).Scan(&totalSize, &usedSize)
	
	if err == nil {
		stats.Storage = StorageStats{
			TotalSize: totalSize,
			UsedSize:  usedSize,
			FreeSize:  0, // PostgreSQL doesn't have a direct free space concept
		}
	}
	
	// Performance stats - simplified for now
	stats.Performance = PerformanceStats{
		QueriesPerSecond: 0, // Would need more complex monitoring
		AvgQueryTime:     0,
		SlowQueries:      0,
		CacheHitRatio:    0,
	}
	
	return stats, nil
}

// IsConnected returns whether the provider is currently connected
func (p *PostgreSQLProvider) IsConnected() bool {
	if p.db == nil {
		return false
	}
	
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()
	
	return p.db.PingContext(ctx) == nil
}

// GetConnectionInfo returns current connection information
func (p *PostgreSQLProvider) GetConnectionInfo() *DatabaseConfig {
	return &p.config
}

// buildConnectionString builds a PostgreSQL connection string from config
func (p *PostgreSQLProvider) buildConnectionString(config DatabaseConfig) string {
	var parts []string
	
	if config.Host != "" {
		parts = append(parts, fmt.Sprintf("host=%s", config.Host))
	}
	if config.Port > 0 {
		parts = append(parts, fmt.Sprintf("port=%d", config.Port))
	}
	if config.Database != "" {
		parts = append(parts, fmt.Sprintf("dbname=%s", config.Database))
	}
	if config.Username != "" {
		parts = append(parts, fmt.Sprintf("user=%s", config.Username))
	}
	if config.Password != "" {
		parts = append(parts, fmt.Sprintf("password=%s", config.Password))
	}
	if config.SSLMode != "" {
		parts = append(parts, fmt.Sprintf("sslmode=%s", config.SSLMode))
	} else {
		parts = append(parts, "sslmode=disable")
	}
	
	return strings.Join(parts, " ")
}