package api

import (
	"encoding/json"
	"net/http"

	"github.com/archellir/denshimon/internal/gitops"
)

func (s *Server) handleListRepositories(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		s.respondWithError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	repositories, err := s.gitopsService.ListRepositories(r.Context())
	if err != nil {
		s.respondWithError(w, http.StatusInternalServerError, "Failed to list repositories")
		return
	}

	s.respondWithJSON(w, http.StatusOK, map[string]interface{}{
		"repositories": repositories,
	})
}

func (s *Server) handleCreateRepository(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		s.respondWithError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	var req gitops.CreateRepositoryRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		s.respondWithError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate required fields
	if req.Name == "" {
		s.respondWithError(w, http.StatusBadRequest, "Repository name is required")
		return
	}
	if req.URL == "" {
		s.respondWithError(w, http.StatusBadRequest, "Repository URL is required")
		return
	}

	repository, err := s.gitopsService.CreateRepository(r.Context(), req)
	if err != nil {
		s.respondWithError(w, http.StatusInternalServerError, "Failed to create repository")
		return
	}

	s.respondWithJSON(w, http.StatusCreated, repository)
}

func (s *Server) handleGetRepository(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		s.respondWithError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	id := s.extractIDFromPath(r.URL.Path, "/api/gitops/repositories/")
	if id == "" {
		s.respondWithError(w, http.StatusBadRequest, "Repository ID is required")
		return
	}

	repository, err := s.gitopsService.GetRepository(r.Context(), id)
	if err != nil {
		s.respondWithError(w, http.StatusNotFound, "Repository not found")
		return
	}

	s.respondWithJSON(w, http.StatusOK, repository)
}

func (s *Server) handleSyncRepository(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		s.respondWithError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	id := s.extractIDFromPath(r.URL.Path, "/api/gitops/repositories/")
	if id == "" {
		s.respondWithError(w, http.StatusBadRequest, "Repository ID is required")
		return
	}

	// Remove "/sync" suffix to get the ID
	if len(id) > 5 && id[len(id)-5:] == "/sync" {
		id = id[:len(id)-5]
	}

	err := s.gitopsService.SyncRepository(r.Context(), id)
	if err != nil {
		s.respondWithError(w, http.StatusInternalServerError, "Failed to sync repository")
		return
	}

	s.respondWithJSON(w, http.StatusOK, map[string]interface{}{
		"message": "Repository sync initiated",
	})
}

func (s *Server) handleDeleteRepository(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		s.respondWithError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	id := s.extractIDFromPath(r.URL.Path, "/api/gitops/repositories/")
	if id == "" {
		s.respondWithError(w, http.StatusBadRequest, "Repository ID is required")
		return
	}

	err := s.gitopsService.DeleteRepository(r.Context(), id)
	if err != nil {
		s.respondWithError(w, http.StatusInternalServerError, "Failed to delete repository")
		return
	}

	s.respondWithJSON(w, http.StatusOK, map[string]interface{}{
		"message": "Repository deleted successfully",
	})
}

func (s *Server) handleListApplications(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		s.respondWithError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	applications, err := s.gitopsService.ListApplications(r.Context())
	if err != nil {
		s.respondWithError(w, http.StatusInternalServerError, "Failed to list applications")
		return
	}

	s.respondWithJSON(w, http.StatusOK, map[string]interface{}{
		"applications": applications,
	})
}

func (s *Server) handleCreateApplication(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		s.respondWithError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	var req gitops.CreateApplicationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		s.respondWithError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate required fields
	if req.Name == "" {
		s.respondWithError(w, http.StatusBadRequest, "Application name is required")
		return
	}
	if req.RepositoryID == "" {
		s.respondWithError(w, http.StatusBadRequest, "Repository ID is required")
		return
	}

	application, err := s.gitopsService.CreateApplication(r.Context(), req)
	if err != nil {
		s.respondWithError(w, http.StatusInternalServerError, "Failed to create application")
		return
	}

	s.respondWithJSON(w, http.StatusCreated, application)
}

func (s *Server) handleGetApplication(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		s.respondWithError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	id := s.extractIDFromPath(r.URL.Path, "/api/gitops/applications/")
	if id == "" {
		s.respondWithError(w, http.StatusBadRequest, "Application ID is required")
		return
	}

	application, err := s.gitopsService.GetApplication(r.Context(), id)
	if err != nil {
		s.respondWithError(w, http.StatusNotFound, "Application not found")
		return
	}

	s.respondWithJSON(w, http.StatusOK, application)
}

func (s *Server) handleSyncApplication(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		s.respondWithError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	id := s.extractIDFromPath(r.URL.Path, "/api/gitops/applications/")
	if id == "" {
		s.respondWithError(w, http.StatusBadRequest, "Application ID is required")
		return
	}

	// Remove "/sync" suffix to get the ID
	if len(id) > 5 && id[len(id)-5:] == "/sync" {
		id = id[:len(id)-5]
	}

	err := s.gitopsService.SyncApplication(r.Context(), id)
	if err != nil {
		s.respondWithError(w, http.StatusInternalServerError, "Failed to sync application")
		return
	}

	s.respondWithJSON(w, http.StatusOK, map[string]interface{}{
		"message": "Application sync initiated",
	})
}

func (s *Server) handleDeleteApplication(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		s.respondWithError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	id := s.extractIDFromPath(r.URL.Path, "/api/gitops/applications/")
	if id == "" {
		s.respondWithError(w, http.StatusBadRequest, "Application ID is required")
		return
	}

	err := s.gitopsService.DeleteApplication(r.Context(), id)
	if err != nil {
		s.respondWithError(w, http.StatusInternalServerError, "Failed to delete application")
		return
	}

	s.respondWithJSON(w, http.StatusOK, map[string]interface{}{
		"message": "Application deleted successfully",
	})
}

// Git operation handlers

func (s *Server) handlePullRepository(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		s.respondWithError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	id := s.extractIDFromPath(r.URL.Path, "/api/gitops/repositories/")
	if id == "" {
		s.respondWithError(w, http.StatusBadRequest, "Repository ID is required")
		return
	}

	// Remove "/pull" suffix to get the ID
	if len(id) > 5 && id[len(id)-5:] == "/pull" {
		id = id[:len(id)-5]
	}

	err := s.gitopsService.PullRepository(r.Context(), id)
	if err != nil {
		s.respondWithError(w, http.StatusInternalServerError, "Failed to pull repository")
		return
	}

	s.respondWithJSON(w, http.StatusOK, map[string]interface{}{
		"message": "Repository pull completed successfully",
	})
}

func (s *Server) handleGetRepositoryStatus(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		s.respondWithError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	id := s.extractIDFromPath(r.URL.Path, "/api/gitops/repositories/")
	if id == "" {
		s.respondWithError(w, http.StatusBadRequest, "Repository ID is required")
		return
	}

	// Remove "/status" suffix to get the ID
	if len(id) > 7 && id[len(id)-7:] == "/status" {
		id = id[:len(id)-7]
	}

	status, err := s.gitopsService.GetRepositoryStatus(r.Context(), id)
	if err != nil {
		s.respondWithError(w, http.StatusInternalServerError, "Failed to get repository status")
		return
	}

	s.respondWithJSON(w, http.StatusOK, status)
}

func (s *Server) handleCommitAndPush(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		s.respondWithError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	id := s.extractIDFromPath(r.URL.Path, "/api/gitops/repositories/")
	if id == "" {
		s.respondWithError(w, http.StatusBadRequest, "Repository ID is required")
		return
	}

	// Remove "/commit" suffix to get the ID
	if len(id) > 7 && id[len(id)-7:] == "/commit" {
		id = id[:len(id)-7]
	}

	var req struct {
		Message string   `json:"message"`
		Paths   []string `json:"paths"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		s.respondWithError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.Message == "" {
		s.respondWithError(w, http.StatusBadRequest, "Commit message is required")
		return
	}

	if len(req.Paths) == 0 {
		req.Paths = []string{"."}
	}

	err := s.gitopsService.CommitAndPush(r.Context(), id, req.Message, req.Paths)
	if err != nil {
		s.respondWithError(w, http.StatusInternalServerError, "Failed to commit and push")
		return
	}

	s.respondWithJSON(w, http.StatusOK, map[string]interface{}{
		"message": "Changes committed and pushed successfully",
	})
}

func (s *Server) handleGetRepositoryDiff(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		s.respondWithError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	id := s.extractIDFromPath(r.URL.Path, "/api/gitops/repositories/")
	if id == "" {
		s.respondWithError(w, http.StatusBadRequest, "Repository ID is required")
		return
	}

	// Remove "/diff" suffix to get the ID
	if len(id) > 5 && id[len(id)-5:] == "/diff" {
		id = id[:len(id)-5]
	}

	// Get app path from query parameter (optional)
	appPath := r.URL.Query().Get("path")

	diff, err := s.gitopsService.DiffRepository(r.Context(), id, appPath)
	if err != nil {
		s.respondWithError(w, http.StatusInternalServerError, "Failed to get repository diff")
		return
	}

	s.respondWithJSON(w, http.StatusOK, map[string]interface{}{
		"repository_id": id,
		"path":          appPath,
		"diff":          diff,
	})
}
