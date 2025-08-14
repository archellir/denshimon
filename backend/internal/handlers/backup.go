package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/archellir/denshimon/internal/providers/backup"
)

type BackupHandlers struct {
	backupManager *backup.Manager
}

func NewBackupHandlers(backupManager *backup.Manager) *BackupHandlers {
	return &BackupHandlers{
		backupManager: backupManager,
	}
}

type APIResponse struct {
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
	Message string      `json:"message,omitempty"`
}

// ListJobs handles GET /api/backup/jobs
func (h *BackupHandlers) ListJobs(w http.ResponseWriter, r *http.Request) {
	jobs, err := h.backupManager.ListJobs()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(APIResponse{Data: jobs})
}

// CreateJob handles POST /api/backup/jobs
func (h *BackupHandlers) CreateJob(w http.ResponseWriter, r *http.Request) {
	var job backup.Job
	if err := json.NewDecoder(r.Body).Decode(&job); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	createdJob, err := h.backupManager.CreateJob(&job)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(APIResponse{Data: createdJob})
}

// GetJob handles GET /api/backup/jobs/{id}
func (h *BackupHandlers) GetJob(w http.ResponseWriter, r *http.Request) {
	id := strings.TrimPrefix(r.URL.Path, "/api/backup/jobs/")
	if id == "" {
		http.Error(w, "Job ID is required", http.StatusBadRequest)
		return
	}

	job, err := h.backupManager.GetJob(id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(APIResponse{Data: job})
}

// UpdateJob handles PUT /api/backup/jobs/{id}
func (h *BackupHandlers) UpdateJob(w http.ResponseWriter, r *http.Request) {
	id := strings.TrimPrefix(r.URL.Path, "/api/backup/jobs/")
	if id == "" {
		http.Error(w, "Job ID is required", http.StatusBadRequest)
		return
	}

	var job backup.Job
	if err := json.NewDecoder(r.Body).Decode(&job); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	job.ID = id
	updatedJob, err := h.backupManager.UpdateJob(&job)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(APIResponse{Data: updatedJob})
}

// DeleteJob handles DELETE /api/backup/jobs/{id}
func (h *BackupHandlers) DeleteJob(w http.ResponseWriter, r *http.Request) {
	id := strings.TrimPrefix(r.URL.Path, "/api/backup/jobs/")
	if id == "" {
		http.Error(w, "Job ID is required", http.StatusBadRequest)
		return
	}

	if err := h.backupManager.DeleteJob(id); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(APIResponse{Message: "Job deleted successfully"})
}

// RunJob handles POST /api/backup/jobs/{id}/run
func (h *BackupHandlers) RunJob(w http.ResponseWriter, r *http.Request) {
	path := strings.TrimPrefix(r.URL.Path, "/api/backup/jobs/")
	id := strings.TrimSuffix(path, "/run")
	if id == "" {
		http.Error(w, "Job ID is required", http.StatusBadRequest)
		return
	}

	if err := h.backupManager.RunJob(id); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(APIResponse{Message: "Job started successfully"})
}

// CancelJob handles POST /api/backup/jobs/{id}/cancel
func (h *BackupHandlers) CancelJob(w http.ResponseWriter, r *http.Request) {
	path := strings.TrimPrefix(r.URL.Path, "/api/backup/jobs/")
	id := strings.TrimSuffix(path, "/cancel")
	if id == "" {
		http.Error(w, "Job ID is required", http.StatusBadRequest)
		return
	}

	if err := h.backupManager.CancelJob(id); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(APIResponse{Message: "Job cancelled successfully"})
}

// GetHistory handles GET /api/backup/history
func (h *BackupHandlers) GetHistory(w http.ResponseWriter, r *http.Request) {
	jobID := r.URL.Query().Get("jobId")
	
	history, err := h.backupManager.GetHistory(jobID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(APIResponse{Data: history})
}

// GetStorage handles GET /api/backup/storage
func (h *BackupHandlers) GetStorage(w http.ResponseWriter, r *http.Request) {
	storage, err := h.backupManager.GetStorage()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(APIResponse{Data: storage})
}

// GetStatistics handles GET /api/backup/statistics
func (h *BackupHandlers) GetStatistics(w http.ResponseWriter, r *http.Request) {
	stats, err := h.backupManager.GetStatistics()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(APIResponse{Data: stats})
}

// GetActiveRecoveries handles GET /api/backup/recoveries/active
func (h *BackupHandlers) GetActiveRecoveries(w http.ResponseWriter, r *http.Request) {
	recoveries, err := h.backupManager.GetActiveRecoveries()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(APIResponse{Data: recoveries})
}

// GetAlerts handles GET /api/backup/alerts
func (h *BackupHandlers) GetAlerts(w http.ResponseWriter, r *http.Request) {
	alerts, err := h.backupManager.GetAlerts()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(APIResponse{Data: alerts})
}

// VerifyBackup handles POST /api/backup/history/{id}/verify
func (h *BackupHandlers) VerifyBackup(w http.ResponseWriter, r *http.Request) {
	path := strings.TrimPrefix(r.URL.Path, "/api/backup/history/")
	id := strings.TrimSuffix(path, "/verify")
	if id == "" {
		http.Error(w, "Backup ID is required", http.StatusBadRequest)
		return
	}

	if err := h.backupManager.VerifyBackup(id); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(APIResponse{Message: "Backup verification started"})
}

// StartRecovery handles POST /api/backup/history/{id}/recover
func (h *BackupHandlers) StartRecovery(w http.ResponseWriter, r *http.Request) {
	path := strings.TrimPrefix(r.URL.Path, "/api/backup/history/")
	id := strings.TrimSuffix(path, "/recover")
	if id == "" {
		http.Error(w, "Backup ID is required", http.StatusBadRequest)
		return
	}

	var options backup.RecoveryOptions
	if err := json.NewDecoder(r.Body).Decode(&options); err != nil {
		// Use default options if request body is empty or invalid
		options = backup.RecoveryOptions{
			OverwriteExisting:         false,
			VerifyAfterRestore:        true,
			StopServicesBeforeRestore: false,
			RestorePermissions:        true,
		}
	}

	recoveryID, err := h.backupManager.StartRecovery(id, options)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(APIResponse{
		Data:    map[string]string{"recoveryId": recoveryID},
		Message: "Recovery started successfully",
	})
}

// DeleteBackup handles DELETE /api/backup/history/{id}
func (h *BackupHandlers) DeleteBackup(w http.ResponseWriter, r *http.Request) {
	id := strings.TrimPrefix(r.URL.Path, "/api/backup/history/")
	if id == "" {
		http.Error(w, "Backup ID is required", http.StatusBadRequest)
		return
	}

	if err := h.backupManager.DeleteBackup(id); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(APIResponse{Message: "Backup deleted successfully"})
}

// UpdateSchedule handles PUT /api/backup/jobs/{id}/schedule
func (h *BackupHandlers) UpdateSchedule(w http.ResponseWriter, r *http.Request) {
	path := strings.TrimPrefix(r.URL.Path, "/api/backup/jobs/")
	id := strings.TrimSuffix(path, "/schedule")
	if id == "" {
		http.Error(w, "Job ID is required", http.StatusBadRequest)
		return
	}

	var schedule backup.Schedule
	if err := json.NewDecoder(r.Body).Decode(&schedule); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if err := h.backupManager.UpdateSchedule(id, schedule); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(APIResponse{Message: "Schedule updated successfully"})
}