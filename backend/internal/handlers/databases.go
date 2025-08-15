package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/archellir/denshimon/internal/common"
	"github.com/archellir/denshimon/internal/providers/databases"
)

// DatabasesHandler handles database management endpoints
type DatabasesHandler struct {
	manager *databases.Manager
}

// writeErrorResponse is a helper to write error responses
func writeErrorResponse(w http.ResponseWriter, status int, message string, err error) {
	errorMsg := message
	if err != nil {
		errorMsg = fmt.Sprintf("%s: %v", message, err)
	}

	response := common.APIResponse{
		Success: false,
		Error:   errorMsg,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(response)
}

// NewDatabasesHandler creates a new databases handler
func NewDatabasesHandler(manager *databases.Manager) *DatabasesHandler {
	return &DatabasesHandler{
		manager: manager,
	}
}

// RegisterRoutes registers database management routes
func (h *DatabasesHandler) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("GET /api/databases/connections", h.ListConnections)
	mux.HandleFunc("POST /api/databases/connections", h.CreateConnection)
	mux.HandleFunc("GET /api/databases/connections/{id}", h.GetConnection)
	mux.HandleFunc("PUT /api/databases/connections/{id}", h.UpdateConnection)
	mux.HandleFunc("DELETE /api/databases/connections/{id}", h.DeleteConnection)
	mux.HandleFunc("POST /api/databases/connections/{id}/connect", h.ConnectDatabase)
	mux.HandleFunc("POST /api/databases/connections/{id}/disconnect", h.DisconnectDatabase)
	mux.HandleFunc("POST /api/databases/connections/test", h.TestConnection)
	mux.HandleFunc("GET /api/databases/connections/{id}/databases", h.GetDatabases)
	mux.HandleFunc("GET /api/databases/connections/{id}/databases/{database}/tables", h.GetTables)
	mux.HandleFunc("GET /api/databases/connections/{id}/databases/{database}/tables/{table}/columns", h.GetColumns)
	mux.HandleFunc("POST /api/databases/connections/{id}/query", h.ExecuteQuery)
	mux.HandleFunc("POST /api/databases/connections/{id}/tables/{table}/data", h.GetTableData)
	mux.HandleFunc("PUT /api/databases/connections/{id}/tables/{table}/rows", h.UpdateRow)
	mux.HandleFunc("DELETE /api/databases/connections/{id}/tables/{table}/rows", h.DeleteRow)
	mux.HandleFunc("POST /api/databases/connections/{id}/tables/{table}/rows", h.InsertRow)
	mux.HandleFunc("GET /api/databases/connections/{id}/stats", h.GetStats)
	mux.HandleFunc("GET /api/databases/types", h.GetSupportedTypes)
}

// ListConnections returns all database connections
func (h *DatabasesHandler) ListConnections(w http.ResponseWriter, r *http.Request) {
	connections := h.manager.GetConnections()

	response := common.APIResponse{
		Success: true,
		Data:    connections,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// CreateConnection creates a new database connection
func (h *DatabasesHandler) CreateConnection(w http.ResponseWriter, r *http.Request) {
	var config databases.DatabaseConfig
	if err := json.NewDecoder(r.Body).Decode(&config); err != nil {
		writeErrorResponse(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 30*time.Second)
	defer cancel()

	connection, err := h.manager.AddConnection(ctx, config)
	if err != nil {
		writeErrorResponse(w, http.StatusInternalServerError, "Failed to create connection", err)
		return
	}

	response := common.APIResponse{
		Success: true,
		Data:    connection,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(response)
}

// GetConnection returns a specific database connection
func (h *DatabasesHandler) GetConnection(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")

	connection, err := h.manager.GetConnection(id)
	if err != nil {
		writeErrorResponse(w, http.StatusNotFound, "Connection not found", err)
		return
	}

	response := common.APIResponse{
		Success: true,
		Data:    connection,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// UpdateConnection updates a database connection
func (h *DatabasesHandler) UpdateConnection(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")

	var config databases.DatabaseConfig
	if err := json.NewDecoder(r.Body).Decode(&config); err != nil {
		writeErrorResponse(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	config.ID = id

	ctx, cancel := context.WithTimeout(r.Context(), 30*time.Second)
	defer cancel()

	connection, err := h.manager.UpdateConnection(ctx, config)
	if err != nil {
		writeErrorResponse(w, http.StatusInternalServerError, "Failed to update connection", err)
		return
	}

	response := common.APIResponse{
		Success: true,
		Data:    connection,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// DeleteConnection deletes a database connection
func (h *DatabasesHandler) DeleteConnection(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	if err := h.manager.DeleteConnection(ctx, id); err != nil {
		writeErrorResponse(w, http.StatusInternalServerError, "Failed to delete connection", err)
		return
	}

	response := common.APIResponse{
		Success: true,
		Message: "Connection deleted successfully",
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// ConnectDatabase establishes a connection to a database
func (h *DatabasesHandler) ConnectDatabase(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")

	ctx, cancel := context.WithTimeout(r.Context(), 30*time.Second)
	defer cancel()

	if err := h.manager.Connect(ctx, id); err != nil {
		writeErrorResponse(w, http.StatusInternalServerError, "Failed to connect to database", err)
		return
	}

	response := common.APIResponse{
		Success: true,
		Message: "Connected successfully",
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// DisconnectDatabase closes a database connection
func (h *DatabasesHandler) DisconnectDatabase(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	if err := h.manager.Disconnect(ctx, id); err != nil {
		writeErrorResponse(w, http.StatusInternalServerError, "Failed to disconnect from database", err)
		return
	}

	response := common.APIResponse{
		Success: true,
		Message: "Disconnected successfully",
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// TestConnection tests a database connection
func (h *DatabasesHandler) TestConnection(w http.ResponseWriter, r *http.Request) {
	var config databases.DatabaseConfig
	if err := json.NewDecoder(r.Body).Decode(&config); err != nil {
		writeErrorResponse(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 15*time.Second)
	defer cancel()

	result, err := h.manager.TestConnection(ctx, config)
	if err != nil {
		writeErrorResponse(w, http.StatusInternalServerError, "Failed to test connection", err)
		return
	}

	response := common.APIResponse{
		Success: true,
		Data:    result,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// GetDatabases returns databases for a connection
func (h *DatabasesHandler) GetDatabases(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")

	provider, err := h.manager.GetProvider(id)
	if err != nil {
		writeErrorResponse(w, http.StatusBadRequest, "Database not connected", err)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	databases, err := provider.GetDatabases(ctx)
	if err != nil {
		writeErrorResponse(w, http.StatusInternalServerError, "Failed to get databases", err)
		return
	}

	response := common.APIResponse{
		Success: true,
		Data:    databases,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// GetTables returns tables for a database
func (h *DatabasesHandler) GetTables(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	database := r.PathValue("database")

	provider, err := h.manager.GetProvider(id)
	if err != nil {
		writeErrorResponse(w, http.StatusBadRequest, "Database not connected", err)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	tables, err := provider.GetTables(ctx, database)
	if err != nil {
		writeErrorResponse(w, http.StatusInternalServerError, "Failed to get tables", err)
		return
	}

	response := common.APIResponse{
		Success: true,
		Data:    tables,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// GetColumns returns columns for a table
func (h *DatabasesHandler) GetColumns(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	database := r.PathValue("database")
	table := r.PathValue("table")

	provider, err := h.manager.GetProvider(id)
	if err != nil {
		writeErrorResponse(w, http.StatusBadRequest, "Database not connected", err)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	columns, err := provider.GetColumns(ctx, database, table)
	if err != nil {
		writeErrorResponse(w, http.StatusInternalServerError, "Failed to get columns", err)
		return
	}

	response := common.APIResponse{
		Success: true,
		Data:    columns,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// ExecuteQuery executes a SQL query
func (h *DatabasesHandler) ExecuteQuery(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")

	var req databases.QueryRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErrorResponse(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	provider, err := h.manager.GetProvider(id)
	if err != nil {
		writeErrorResponse(w, http.StatusBadRequest, "Database not connected", err)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 60*time.Second)
	defer cancel()

	result, err := provider.ExecuteQuery(ctx, req)
	if err != nil {
		writeErrorResponse(w, http.StatusInternalServerError, "Failed to execute query", err)
		return
	}

	response := common.APIResponse{
		Success: true,
		Data:    result,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// GetTableData returns paginated table data
func (h *DatabasesHandler) GetTableData(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	table := r.PathValue("table")

	var req databases.TableDataRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErrorResponse(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	req.Table = table

	provider, err := h.manager.GetProvider(id)
	if err != nil {
		writeErrorResponse(w, http.StatusBadRequest, "Database not connected", err)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 30*time.Second)
	defer cancel()

	result, err := provider.GetTableData(ctx, req)
	if err != nil {
		writeErrorResponse(w, http.StatusInternalServerError, "Failed to get table data", err)
		return
	}

	response := common.APIResponse{
		Success: true,
		Data:    result,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// UpdateRow updates a table row
func (h *DatabasesHandler) UpdateRow(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	table := r.PathValue("table")

	var req databases.RowUpdateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErrorResponse(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	req.Table = table

	provider, err := h.manager.GetProvider(id)
	if err != nil {
		writeErrorResponse(w, http.StatusBadRequest, "Database not connected", err)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 30*time.Second)
	defer cancel()

	if err := provider.UpdateRow(ctx, req); err != nil {
		writeErrorResponse(w, http.StatusInternalServerError, "Failed to update row", err)
		return
	}

	response := common.APIResponse{
		Success: true,
		Message: "Row updated successfully",
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// DeleteRow deletes a table row
func (h *DatabasesHandler) DeleteRow(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	table := r.PathValue("table")

	var req databases.RowDeleteRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErrorResponse(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	req.Table = table

	provider, err := h.manager.GetProvider(id)
	if err != nil {
		writeErrorResponse(w, http.StatusBadRequest, "Database not connected", err)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 30*time.Second)
	defer cancel()

	if err := provider.DeleteRow(ctx, req); err != nil {
		writeErrorResponse(w, http.StatusInternalServerError, "Failed to delete row", err)
		return
	}

	response := common.APIResponse{
		Success: true,
		Message: "Row deleted successfully",
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// InsertRow inserts a new table row
func (h *DatabasesHandler) InsertRow(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	table := r.PathValue("table")

	var req databases.RowInsertRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErrorResponse(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	req.Table = table

	provider, err := h.manager.GetProvider(id)
	if err != nil {
		writeErrorResponse(w, http.StatusBadRequest, "Database not connected", err)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 30*time.Second)
	defer cancel()

	if err := provider.InsertRow(ctx, req); err != nil {
		writeErrorResponse(w, http.StatusInternalServerError, "Failed to insert row", err)
		return
	}

	response := common.APIResponse{
		Success: true,
		Message: "Row inserted successfully",
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(response)
}

// GetStats returns database statistics
func (h *DatabasesHandler) GetStats(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")

	provider, err := h.manager.GetProvider(id)
	if err != nil {
		writeErrorResponse(w, http.StatusBadRequest, "Database not connected", err)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	stats, err := provider.GetStats(ctx)
	if err != nil {
		writeErrorResponse(w, http.StatusInternalServerError, "Failed to get statistics", err)
		return
	}

	response := common.APIResponse{
		Success: true,
		Data:    stats,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// GetSupportedTypes returns supported database types
func (h *DatabasesHandler) GetSupportedTypes(w http.ResponseWriter, r *http.Request) {
	types := h.manager.GetSupportedTypes()

	response := common.APIResponse{
		Success: true,
		Data:    types,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}
