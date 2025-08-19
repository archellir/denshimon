package backup

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"
)

// Manager manages backup operations
type Manager struct {
	db *sql.DB
}

// NewManager creates a new backup manager
func NewManager(db *sql.DB) *Manager {
	return &Manager{
		db: db,
	}
}

// ListJobs returns all backup jobs
func (m *Manager) ListJobs() ([]*Job, error) {
	rows, err := m.db.Query(`
		SELECT id, name, type, source, schedule, status, last_run, next_run, 
		       retention, size, duration, error, metadata, created_at, updated_at
		FROM backup_jobs ORDER BY created_at DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var jobs []*Job
	for rows.Next() {
		job := &Job{}
		var scheduleJSON, retentionJSON, metadataJSON []byte
		var lastRun, nextRun sql.NullTime

		err := rows.Scan(
			&job.ID, &job.Name, &job.Type, &job.Source,
			&scheduleJSON, &job.Status, &lastRun, &nextRun,
			&retentionJSON, &job.Size, &job.Duration, &job.Error,
			&metadataJSON, &job.CreatedAt, &job.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}

		if lastRun.Valid {
			job.LastRun = &lastRun.Time
		}
		if nextRun.Valid {
			job.NextRun = &nextRun.Time
		}

		if err := json.Unmarshal(scheduleJSON, &job.Schedule); err != nil {
			return nil, err
		}
		if err := json.Unmarshal(retentionJSON, &job.Retention); err != nil {
			return nil, err
		}
		if err := json.Unmarshal(metadataJSON, &job.Metadata); err != nil {
			return nil, err
		}

		jobs = append(jobs, job)
	}

	return jobs, nil
}

// CreateJob creates a new backup job
func (m *Manager) CreateJob(job *Job) (*Job, error) {
	if job.ID == "" {
		job.ID = uuid.New().String()
	}
	job.CreatedAt = time.Now()
	job.UpdatedAt = time.Now()

	scheduleJSON, _ := json.Marshal(job.Schedule)
	retentionJSON, _ := json.Marshal(job.Retention)
	metadataJSON, _ := json.Marshal(job.Metadata)

	_, err := m.db.Exec(`
		INSERT INTO backup_jobs (id, name, type, source, schedule, status, retention, metadata, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`, job.ID, job.Name, job.Type, job.Source, scheduleJSON, job.Status, retentionJSON, metadataJSON, job.CreatedAt, job.UpdatedAt)

	if err != nil {
		return nil, err
	}

	return job, nil
}

// GetJob returns a backup job by ID
func (m *Manager) GetJob(id string) (*Job, error) {
	job := &Job{}
	var scheduleJSON, retentionJSON, metadataJSON []byte
	var lastRun, nextRun sql.NullTime

	err := m.db.QueryRow(`
		SELECT id, name, type, source, schedule, status, last_run, next_run,
		       retention, size, duration, error, metadata, created_at, updated_at
		FROM backup_jobs WHERE id = ?
	`, id).Scan(
		&job.ID, &job.Name, &job.Type, &job.Source,
		&scheduleJSON, &job.Status, &lastRun, &nextRun,
		&retentionJSON, &job.Size, &job.Duration, &job.Error,
		&metadataJSON, &job.CreatedAt, &job.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	if lastRun.Valid {
		job.LastRun = &lastRun.Time
	}
	if nextRun.Valid {
		job.NextRun = &nextRun.Time
	}

	if err := json.Unmarshal(scheduleJSON, &job.Schedule); err != nil {
		return nil, err
	}
	if err := json.Unmarshal(retentionJSON, &job.Retention); err != nil {
		return nil, err
	}
	if err := json.Unmarshal(metadataJSON, &job.Metadata); err != nil {
		return nil, err
	}

	return job, nil
}

// UpdateJob updates a backup job
func (m *Manager) UpdateJob(job *Job) (*Job, error) {
	job.UpdatedAt = time.Now()

	scheduleJSON, _ := json.Marshal(job.Schedule)
	retentionJSON, _ := json.Marshal(job.Retention)
	metadataJSON, _ := json.Marshal(job.Metadata)

	_, err := m.db.Exec(`
		UPDATE backup_jobs SET name = ?, type = ?, source = ?, schedule = ?, 
		       status = ?, retention = ?, metadata = ?, updated_at = ?
		WHERE id = ?
	`, job.Name, job.Type, job.Source, scheduleJSON, job.Status, retentionJSON, metadataJSON, job.UpdatedAt, job.ID)

	if err != nil {
		return nil, err
	}

	return job, nil
}

// DeleteJob deletes a backup job
func (m *Manager) DeleteJob(id string) error {
	_, err := m.db.Exec("DELETE FROM backup_jobs WHERE id = ?", id)
	return err
}

// RunJob starts a backup job
func (m *Manager) RunJob(id string) error {
	now := time.Now()
	_, err := m.db.Exec(`
		UPDATE backup_jobs SET status = ?, last_run = ?, updated_at = ?
		WHERE id = ?
	`, StatusRunning, now, now, id)

	if err != nil {
		return err
	}

	// Create history entry
	historyID := uuid.New().String()
	_, err = m.db.Exec(`
		INSERT INTO backup_history (id, job_id, job_name, timestamp, type, source, status, size, duration, location, checksum, verification_status)
		SELECT ?, id, name, ?, type, source, ?, 0, 0, '', '', ?
		FROM backup_jobs WHERE id = ?
	`, historyID, now, StatusRunning, VerificationNotVerified, id)

	// In a real implementation, you would start the actual backup process here
	// For now, we'll simulate completion after a short delay
	go func() {
		time.Sleep(5 * time.Second)
		m.completeJob(id, historyID)
	}()

	return err
}

// completeJob simulates job completion
func (m *Manager) completeJob(jobID, historyID string) {
	now := time.Now()
	size := int64(1024 * 1024 * 100) // 100MB simulation
	duration := 60                   // 60 seconds simulation

	// Update job status
	m.db.Exec(`
		UPDATE backup_jobs SET status = ?, size = ?, duration = ?, updated_at = ?
		WHERE id = ?
	`, StatusCompleted, size, duration, now, jobID)

	// Update history entry
	m.db.Exec(`
		UPDATE backup_history SET status = ?, size = ?, duration = ?, 
		       location = ?, checksum = ?, verification_status = ?
		WHERE id = ?
	`, StatusCompleted, size, duration, fmt.Sprintf("/backups/%s.tar.gz", historyID),
		fmt.Sprintf("sha256:%s", uuid.New().String()[:16]), VerificationVerified, historyID)
}

// CancelJob cancels a running backup job
func (m *Manager) CancelJob(id string) error {
	now := time.Now()
	_, err := m.db.Exec(`
		UPDATE backup_jobs SET status = ?, updated_at = ?
		WHERE id = ? AND status = ?
	`, StatusCancelled, now, id, StatusRunning)

	return err
}

// GetHistory returns backup history, optionally filtered by job ID
func (m *Manager) GetHistory(jobID string) ([]*History, error) {
	query := `
		SELECT id, job_id, job_name, timestamp, type, source, status, size, duration,
		       files_count, location, checksum, verification_status
		FROM backup_history
	`
	args := []interface{}{}

	if jobID != "" {
		query += " WHERE job_id = ?"
		args = append(args, jobID)
	}

	query += " ORDER BY timestamp DESC"

	rows, err := m.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var history []*History
	for rows.Next() {
		h := &History{}
		var filesCount sql.NullInt64

		err := rows.Scan(
			&h.ID, &h.JobID, &h.JobName, &h.Timestamp, &h.Type, &h.Source,
			&h.Status, &h.Size, &h.Duration, &filesCount, &h.Location,
			&h.Checksum, &h.VerificationStatus,
		)
		if err != nil {
			return nil, err
		}

		if filesCount.Valid {
			count := int(filesCount.Int64)
			h.FilesCount = &count
		}

		history = append(history, h)
	}

	return history, nil
}

// GetStorage returns storage backend information from real storage providers
func (m *Manager) GetStorage() ([]*Storage, error) {
	// TODO: Integrate with actual storage backends (local filesystem, S3, etc.)
	// For now, return empty slice - frontend will handle mock data when needed
	return []*Storage{}, nil
}

// GetStatistics returns backup system statistics
func (m *Manager) GetStatistics() (*Statistics, error) {
	stats := &Statistics{
		BackupsByType:   make(map[JobType]int),
		BackupsBySource: make(map[Source]int),
	}

	// Get total backups and success rate
	err := m.db.QueryRow(`
		SELECT COUNT(*), 
		       COUNT(CASE WHEN status = 'completed' THEN 1 END) * 100.0 / COUNT(*),
		       AVG(CASE WHEN duration > 0 THEN duration END),
		       SUM(size)
		FROM backup_history
	`).Scan(&stats.TotalBackups, &stats.SuccessRate, &stats.AverageDuration, &stats.TotalSize)

	if err != nil {
		return nil, err
	}

	// Get last successful and failed backups
	m.db.QueryRow(`
		SELECT timestamp FROM backup_history 
		WHERE status = 'completed' 
		ORDER BY timestamp DESC LIMIT 1
	`).Scan(&stats.LastSuccessfulBackup)

	m.db.QueryRow(`
		SELECT timestamp FROM backup_history 
		WHERE status = 'failed' 
		ORDER BY timestamp DESC LIMIT 1
	`).Scan(&stats.LastFailedBackup)

	// Get backups by type
	rows, err := m.db.Query(`
		SELECT type, COUNT(*) FROM backup_history GROUP BY type
	`)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var jobType JobType
			var count int
			rows.Scan(&jobType, &count)
			stats.BackupsByType[jobType] = count
		}
	}

	// Get backups by source
	rows, err = m.db.Query(`
		SELECT source, COUNT(*) FROM backup_history GROUP BY source
	`)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var source Source
			var count int
			rows.Scan(&source, &count)
			stats.BackupsBySource[source] = count
		}
	}

	// Trend data would come from real backup history analysis
	// Frontend will generate mock trends when needed for development

	return stats, nil
}

// GetActiveRecoveries returns currently active recovery operations
func (m *Manager) GetActiveRecoveries() ([]*Recovery, error) {
	rows, err := m.db.Query(`
		SELECT id, backup_id, restore_point_id, status, start_time, end_time,
		       target_location, options, progress, error
		FROM backup_recoveries
		WHERE status NOT IN ('completed', 'failed', 'cancelled')
		ORDER BY start_time DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var recoveries []*Recovery
	for rows.Next() {
		r := &Recovery{}
		var endTime sql.NullTime
		var optionsJSON, progressJSON []byte

		err := rows.Scan(
			&r.ID, &r.BackupID, &r.RestorePointID, &r.Status, &r.StartTime,
			&endTime, &r.TargetLocation, &optionsJSON, &progressJSON, &r.Error,
		)
		if err != nil {
			return nil, err
		}

		if endTime.Valid {
			r.EndTime = &endTime.Time
		}

		if len(optionsJSON) > 0 {
			json.Unmarshal(optionsJSON, &r.Options)
		}
		if len(progressJSON) > 0 {
			json.Unmarshal(progressJSON, &r.Progress)
		}

		recoveries = append(recoveries, r)
	}

	return recoveries, nil
}

// GetAlerts returns backup system alerts
func (m *Manager) GetAlerts() ([]*Alert, error) {
	rows, err := m.db.Query(`
		SELECT id, type, severity, message, timestamp, job_id, acknowledged
		FROM backup_alerts
		ORDER BY timestamp DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var alerts []*Alert
	for rows.Next() {
		a := &Alert{}
		var jobID sql.NullString

		err := rows.Scan(
			&a.ID, &a.Type, &a.Severity, &a.Message,
			&a.Timestamp, &jobID, &a.Acknowledged,
		)
		if err != nil {
			return nil, err
		}

		if jobID.Valid {
			a.JobID = jobID.String
		}

		alerts = append(alerts, a)
	}

	return alerts, nil
}

// VerifyBackup starts verification of a backup
func (m *Manager) VerifyBackup(backupID string) error {
	_, err := m.db.Exec(`
		UPDATE backup_history SET verification_status = ?
		WHERE id = ?
	`, VerificationVerifying, backupID)

	// In a real implementation, you would start the verification process
	// For now, simulate completion
	go func() {
		time.Sleep(3 * time.Second)
		m.db.Exec(`
			UPDATE backup_history SET verification_status = ?
			WHERE id = ?
		`, VerificationVerified, backupID)
	}()

	return err
}

// StartRecovery starts a recovery operation
func (m *Manager) StartRecovery(backupID string, options RecoveryOptions) (string, error) {
	recoveryID := uuid.New().String()
	now := time.Now()

	optionsJSON, _ := json.Marshal(options)

	_, err := m.db.Exec(`
		INSERT INTO backup_recoveries (id, backup_id, status, start_time, target_location, options)
		VALUES (?, ?, ?, ?, ?, ?)
	`, recoveryID, backupID, RecoveryStatusPending, now, "/restore", optionsJSON)

	if err != nil {
		return "", err
	}

	// In a real implementation, you would start the recovery process
	// For now, simulate the recovery process
	go func() {
		m.simulateRecovery(recoveryID)
	}()

	return recoveryID, nil
}

// simulateRecovery simulates the recovery process
func (m *Manager) simulateRecovery(recoveryID string) {
	statuses := []RecoveryStatus{
		RecoveryStatusPreparing,
		RecoveryStatusDownloading,
		RecoveryStatusRestoring,
		RecoveryStatusVerifying,
		RecoveryStatusCompleted,
	}

	for i, status := range statuses {
		time.Sleep(2 * time.Second)

		progress := &RecoveryProgress{
			Percentage:    (i + 1) * 20,
			BytesRestored: int64((i + 1) * 20971520), // 20MB per step
			TotalBytes:    104857600,                 // 100MB total
			FilesRestored: (i + 1) * 10,
			TotalFiles:    50,
		}

		progressJSON, _ := json.Marshal(progress)

		m.db.Exec(`
			UPDATE backup_recoveries SET status = ?, progress = ?
			WHERE id = ?
		`, status, progressJSON, recoveryID)

		if status == RecoveryStatusCompleted {
			now := time.Now()
			m.db.Exec(`
				UPDATE backup_recoveries SET end_time = ?
				WHERE id = ?
			`, now, recoveryID)
		}
	}
}

// DeleteBackup deletes a backup from history
func (m *Manager) DeleteBackup(backupID string) error {
	_, err := m.db.Exec("DELETE FROM backup_history WHERE id = ?", backupID)
	return err
}

// UpdateSchedule updates a job's schedule
func (m *Manager) UpdateSchedule(jobID string, schedule Schedule) error {
	scheduleJSON, _ := json.Marshal(schedule)
	now := time.Now()

	_, err := m.db.Exec(`
		UPDATE backup_jobs SET schedule = ?, updated_at = ?
		WHERE id = ?
	`, scheduleJSON, now, jobID)

	return err
}
