package backup

import "time"

// Job represents a backup job configuration
type Job struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Type      JobType   `json:"type"`
	Source    Source    `json:"source"`
	Schedule  Schedule  `json:"schedule"`
	Status    Status    `json:"status"`
	LastRun   *time.Time `json:"lastRun,omitempty"`
	NextRun   *time.Time `json:"nextRun,omitempty"`
	Retention Retention `json:"retention"`
	Size      *int64    `json:"size,omitempty"`
	Duration  *int      `json:"duration,omitempty"`
	Error     string    `json:"error,omitempty"`
	Metadata  Metadata  `json:"metadata"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// JobType represents the type of backup
type JobType string

const (
	JobTypeFull         JobType = "full"
	JobTypeIncremental  JobType = "incremental"
	JobTypeDifferential JobType = "differential"
	JobTypeSnapshot     JobType = "snapshot"
)

// Source represents the backup source
type Source string

const (
	SourcePostgreSQL      Source = "postgresql"
	SourceSQLite          Source = "sqlite"
	SourcePersistentVolume Source = "persistent_volume"
	SourceGiteaData       Source = "gitea_data"
	SourceFilebrowserData Source = "filebrowser_data"
	SourceConfigFiles     Source = "config_files"
)

// Status represents the backup job status
type Status string

const (
	StatusRunning   Status = "running"
	StatusCompleted Status = "completed"
	StatusFailed    Status = "failed"
	StatusScheduled Status = "scheduled"
	StatusCancelled Status = "cancelled"
	StatusVerifying Status = "verifying"
	StatusVerified  Status = "verified"
)

// Schedule represents the backup schedule
type Schedule struct {
	Enabled           bool       `json:"enabled"`
	Cron              string     `json:"cron"`
	Timezone          string     `json:"timezone"`
	LastScheduledRun  *time.Time `json:"lastScheduledRun,omitempty"`
	NextScheduledRun  *time.Time `json:"nextScheduledRun,omitempty"`
}

// Retention represents the backup retention policy
type Retention struct {
	Daily      int `json:"daily"`
	Weekly     int `json:"weekly"`
	Monthly    int `json:"monthly"`
	Yearly     int `json:"yearly"`
	MinBackups int `json:"minBackups"`
}

// Metadata contains backup-specific metadata
type Metadata struct {
	Database        string          `json:"database,omitempty"`
	Tables          []string        `json:"tables,omitempty"`
	VolumePath      string          `json:"volumePath,omitempty"`
	CompressionType CompressionType `json:"compressionType,omitempty"`
	EncryptionEnabled bool          `json:"encryptionEnabled"`
	Checksum        string          `json:"checksum,omitempty"`
}

// CompressionType represents compression method
type CompressionType string

const (
	CompressionNone  CompressionType = "none"
	CompressionGzip  CompressionType = "gzip"
	CompressionBzip2 CompressionType = "bzip2"
	CompressionXZ    CompressionType = "xz"
	CompressionZstd  CompressionType = "zstd"
)

// History represents a backup history entry
type History struct {
	ID                 string             `json:"id"`
	JobID              string             `json:"jobId"`
	JobName            string             `json:"jobName"`
	Timestamp          time.Time          `json:"timestamp"`
	Type               JobType            `json:"type"`
	Source             Source             `json:"source"`
	Status             Status             `json:"status"`
	Size               int64              `json:"size"`
	Duration           int                `json:"duration"`
	FilesCount         *int               `json:"filesCount,omitempty"`
	Location           string             `json:"location"`
	Checksum           string             `json:"checksum"`
	VerificationStatus VerificationStatus `json:"verificationStatus,omitempty"`
	RestorePoints      []RestorePoint     `json:"restorePoints,omitempty"`
}

// VerificationStatus represents backup verification status
type VerificationStatus string

const (
	VerificationNotVerified VerificationStatus = "not_verified"
	VerificationVerifying   VerificationStatus = "verifying"
	VerificationVerified    VerificationStatus = "verified"
	VerificationFailed      VerificationStatus = "failed"
	VerificationCorrupted   VerificationStatus = "corrupted"
)

// RestorePoint represents a point-in-time restore option
type RestorePoint struct {
	ID          string      `json:"id"`
	BackupID    string      `json:"backupId"`
	Timestamp   time.Time   `json:"timestamp"`
	Type        RestoreType `json:"type"`
	Description string      `json:"description,omitempty"`
	Size        int64       `json:"size"`
	Recoverable bool        `json:"recoverable"`
}

// RestoreType represents the type of restore
type RestoreType string

const (
	RestoreTypeFull        RestoreType = "full_restore"
	RestoreTypePointInTime RestoreType = "point_in_time"
	RestoreTypeTable       RestoreType = "table_restore"
	RestoreTypeFile        RestoreType = "file_restore"
)

// Recovery represents a recovery operation
type Recovery struct {
	ID              string          `json:"id"`
	BackupID        string          `json:"backupId"`
	RestorePointID  string          `json:"restorePointId,omitempty"`
	Status          RecoveryStatus  `json:"status"`
	StartTime       time.Time       `json:"startTime"`
	EndTime         *time.Time      `json:"endTime,omitempty"`
	TargetLocation  string          `json:"targetLocation"`
	Options         RecoveryOptions `json:"options"`
	Progress        *RecoveryProgress `json:"progress,omitempty"`
	Error           string          `json:"error,omitempty"`
}

// RecoveryStatus represents recovery operation status
type RecoveryStatus string

const (
	RecoveryStatusPending     RecoveryStatus = "pending"
	RecoveryStatusPreparing   RecoveryStatus = "preparing"
	RecoveryStatusDownloading RecoveryStatus = "downloading"
	RecoveryStatusRestoring   RecoveryStatus = "restoring"
	RecoveryStatusVerifying   RecoveryStatus = "verifying"
	RecoveryStatusCompleted   RecoveryStatus = "completed"
	RecoveryStatusFailed      RecoveryStatus = "failed"
	RecoveryStatusCancelled   RecoveryStatus = "cancelled"
)

// RecoveryOptions represents recovery configuration
type RecoveryOptions struct {
	OverwriteExisting         bool     `json:"overwriteExisting"`
	VerifyAfterRestore        bool     `json:"verifyAfterRestore"`
	StopServicesBeforeRestore bool     `json:"stopServicesBeforeRestore"`
	RestorePermissions        bool     `json:"restorePermissions"`
	RestoreToAlternateLocation *string  `json:"restoreToAlternateLocation,omitempty"`
	SelectedTables            []string `json:"selectedTables,omitempty"`
	SelectedFiles             []string `json:"selectedFiles,omitempty"`
}

// RecoveryProgress represents recovery operation progress
type RecoveryProgress struct {
	Percentage              int    `json:"percentage"`
	BytesRestored          int64  `json:"bytesRestored"`
	TotalBytes             int64  `json:"totalBytes"`
	FilesRestored          int    `json:"filesRestored"`
	TotalFiles             int    `json:"totalFiles"`
	CurrentFile            string `json:"currentFile,omitempty"`
	EstimatedTimeRemaining *int   `json:"estimatedTimeRemaining,omitempty"`
}

// Storage represents backup storage backend
type Storage struct {
	ID           string        `json:"id"`
	Name         string        `json:"name"`
	Type         StorageType   `json:"type"`
	Location     string        `json:"location"`
	Available    int64         `json:"available"`
	Used         int64         `json:"used"`
	Total        int64         `json:"total"`
	BackupCount  int           `json:"backupCount"`
	OldestBackup *time.Time    `json:"oldestBackup,omitempty"`
	NewestBackup *time.Time    `json:"newestBackup,omitempty"`
	Status       StorageStatus `json:"status"`
}

// StorageType represents storage backend type
type StorageType string

const (
	StorageTypeLocal            StorageType = "local"
	StorageTypeS3               StorageType = "s3"
	StorageTypeNFS              StorageType = "nfs"
	StorageTypePersistentVolume StorageType = "persistent_volume"
)

// StorageStatus represents storage backend status
type StorageStatus string

const (
	StorageStatusAvailable   StorageStatus = "available"
	StorageStatusUnavailable StorageStatus = "unavailable"
	StorageStatusDegraded    StorageStatus = "degraded"
	StorageStatusFull        StorageStatus = "full"
)

// Statistics represents backup system statistics
type Statistics struct {
	TotalBackups         int                    `json:"totalBackups"`
	TotalSize            int64                  `json:"totalSize"`
	SuccessRate          float64                `json:"successRate"`
	AverageDuration      int                    `json:"averageDuration"`
	LastSuccessfulBackup *time.Time             `json:"lastSuccessfulBackup,omitempty"`
	LastFailedBackup     *time.Time             `json:"lastFailedBackup,omitempty"`
	BackupsByType        map[JobType]int        `json:"backupsByType"`
	BackupsBySource      map[Source]int         `json:"backupsBySource"`
	DailyBackupTrend     []BackupTrend          `json:"dailyBackupTrend"`
	StorageUsageTrend    []StorageTrend         `json:"storageUsageTrend"`
}

// BackupTrend represents daily backup statistics
type BackupTrend struct {
	Date       string `json:"date"`
	Successful int    `json:"successful"`
	Failed     int    `json:"failed"`
	TotalSize  int64  `json:"totalSize"`
}

// StorageTrend represents storage usage over time
type StorageTrend struct {
	Date      string `json:"date"`
	Used      int64  `json:"used"`
	Available int64  `json:"available"`
}

// Alert represents a backup system alert
type Alert struct {
	ID            string      `json:"id"`
	Type          AlertType   `json:"type"`
	Severity      Severity    `json:"severity"`
	Message       string      `json:"message"`
	Timestamp     time.Time   `json:"timestamp"`
	JobID         string      `json:"jobId,omitempty"`
	Acknowledged  bool        `json:"acknowledged"`
}

// AlertType represents type of backup alert
type AlertType string

const (
	AlertTypeBackupFailed             AlertType = "backup_failed"
	AlertTypeVerificationFailed      AlertType = "verification_failed"
	AlertTypeStorageFull              AlertType = "storage_full"
	AlertTypeRetentionPolicyViolation AlertType = "retention_policy_violation"
	AlertTypeScheduleMissed           AlertType = "schedule_missed"
	AlertTypeRecoveryFailed           AlertType = "recovery_failed"
)

// Severity represents alert severity
type Severity string

const (
	SeverityInfo     Severity = "info"
	SeverityWarning  Severity = "warning"
	SeverityCritical Severity = "critical"
)