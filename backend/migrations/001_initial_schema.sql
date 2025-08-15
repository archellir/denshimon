-- Initial database schema for denshimon
-- This file is automatically executed when PostgreSQL container starts

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'viewer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit logs table for tracking all actions
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(255) NOT NULL,
    resource VARCHAR(255) NOT NULL,
    resource_id VARCHAR(255),
    details JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Git repositories table for GitOps
CREATE TABLE IF NOT EXISTS git_repositories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    url VARCHAR(500) NOT NULL,
    branch VARCHAR(255) DEFAULT 'main',
    auth_type VARCHAR(50) DEFAULT 'none', -- none, ssh, token
    credentials JSONB, -- encrypted credentials
    last_sync TIMESTAMP,
    sync_status VARCHAR(50) DEFAULT 'unknown', -- synced, out_of_sync, error, unknown
    sync_error TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Applications table for GitOps applications
CREATE TABLE IF NOT EXISTS applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    repository_id UUID REFERENCES git_repositories(id),
    path VARCHAR(500) DEFAULT '.',
    namespace VARCHAR(255) DEFAULT 'default',
    sync_policy JSONB, -- auto sync settings
    health_status VARCHAR(50) DEFAULT 'unknown', -- healthy, progressing, degraded, suspended, missing, unknown
    sync_status VARCHAR(50) DEFAULT 'unknown', -- synced, out_of_sync, unknown
    last_sync TIMESTAMP,
    sync_error TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Settings table for application configuration
CREATE TABLE IF NOT EXISTS settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(255) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource);

CREATE INDEX IF NOT EXISTS idx_git_repositories_name ON git_repositories(name);
CREATE INDEX IF NOT EXISTS idx_git_repositories_sync_status ON git_repositories(sync_status);

CREATE INDEX IF NOT EXISTS idx_applications_name ON applications(name);
CREATE INDEX IF NOT EXISTS idx_applications_repository_id ON applications(repository_id);
CREATE INDEX IF NOT EXISTS idx_applications_namespace ON applications(namespace);
CREATE INDEX IF NOT EXISTS idx_applications_sync_status ON applications(sync_status);
CREATE INDEX IF NOT EXISTS idx_applications_health_status ON applications(health_status);

CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);

-- Insert default demo users (passwords are 'password' hashed with bcrypt)
-- Note: In production, these should be created through proper user management
INSERT INTO users (username, password_hash, role) VALUES 
    ('admin', '$2a$10$N9qo8uLOickgx2ZMRZoMye.2FMKJbqxvUCr6H7LcjNVnbhUEMz6/2', 'admin'),
    ('operator', '$2a$10$N9qo8uLOickgx2ZMRZoMye.2FMKJbqxvUCr6H7LcjNVnbhUEMz6/2', 'operator'),
    ('viewer', '$2a$10$N9qo8uLOickgx2ZMRZoMye.2FMKJbqxvUCr6H7LcjNVnbhUEMz6/2', 'viewer')
ON CONFLICT (username) DO NOTHING;

-- Backup jobs table
CREATE TABLE IF NOT EXISTS backup_jobs (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- full, incremental, differential, snapshot
    source VARCHAR(100) NOT NULL, -- postgresql, sqlite, persistent_volume, etc.
    schedule TEXT NOT NULL, -- JSON schedule configuration
    status VARCHAR(50) NOT NULL DEFAULT 'scheduled', -- running, completed, failed, scheduled, cancelled, verifying, verified
    last_run TIMESTAMP NULL,
    next_run TIMESTAMP NULL,
    retention TEXT NOT NULL, -- JSON retention policy
    size BIGINT NULL,
    duration INTEGER NULL, -- seconds
    error TEXT NULL,
    metadata TEXT NOT NULL, -- JSON metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Backup history table
CREATE TABLE IF NOT EXISTS backup_history (
    id VARCHAR(255) PRIMARY KEY,
    job_id VARCHAR(255) NOT NULL,
    job_name VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    type VARCHAR(50) NOT NULL,
    source VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    size BIGINT NOT NULL DEFAULT 0,
    duration INTEGER NOT NULL DEFAULT 0,
    files_count INTEGER NULL,
    location VARCHAR(500) NOT NULL,
    checksum VARCHAR(255) NOT NULL,
    verification_status VARCHAR(50) DEFAULT 'not_verified', -- not_verified, verifying, verified, failed, corrupted
    FOREIGN KEY (job_id) REFERENCES backup_jobs(id) ON DELETE CASCADE
);

-- Backup recoveries table
CREATE TABLE IF NOT EXISTS backup_recoveries (
    id VARCHAR(255) PRIMARY KEY,
    backup_id VARCHAR(255) NOT NULL,
    restore_point_id VARCHAR(255) NULL,
    status VARCHAR(50) NOT NULL, -- pending, preparing, downloading, restoring, verifying, completed, failed, cancelled
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NULL,
    target_location VARCHAR(500) NOT NULL,
    options TEXT NOT NULL, -- JSON recovery options
    progress TEXT NULL, -- JSON progress information
    error TEXT NULL,
    FOREIGN KEY (backup_id) REFERENCES backup_history(id) ON DELETE CASCADE
);

-- Backup alerts table
CREATE TABLE IF NOT EXISTS backup_alerts (
    id VARCHAR(255) PRIMARY KEY,
    type VARCHAR(100) NOT NULL, -- backup_failed, verification_failed, storage_full, etc.
    severity VARCHAR(50) NOT NULL, -- info, warning, critical
    message TEXT NOT NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    job_id VARCHAR(255) NULL,
    acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
    FOREIGN KEY (job_id) REFERENCES backup_jobs(id) ON DELETE SET NULL
);

-- Create indexes for backup tables
CREATE INDEX IF NOT EXISTS idx_backup_jobs_status ON backup_jobs(status);
CREATE INDEX IF NOT EXISTS idx_backup_jobs_next_run ON backup_jobs(next_run);
CREATE INDEX IF NOT EXISTS idx_backup_jobs_created_at ON backup_jobs(created_at);

CREATE INDEX IF NOT EXISTS idx_backup_history_job_id ON backup_history(job_id);
CREATE INDEX IF NOT EXISTS idx_backup_history_timestamp ON backup_history(timestamp);
CREATE INDEX IF NOT EXISTS idx_backup_history_status ON backup_history(status);

CREATE INDEX IF NOT EXISTS idx_backup_recoveries_backup_id ON backup_recoveries(backup_id);
CREATE INDEX IF NOT EXISTS idx_backup_recoveries_status ON backup_recoveries(status);
CREATE INDEX IF NOT EXISTS idx_backup_recoveries_start_time ON backup_recoveries(start_time);

CREATE INDEX IF NOT EXISTS idx_backup_alerts_timestamp ON backup_alerts(timestamp);
CREATE INDEX IF NOT EXISTS idx_backup_alerts_acknowledged ON backup_alerts(acknowledged);
CREATE INDEX IF NOT EXISTS idx_backup_alerts_job_id ON backup_alerts(job_id);

-- Insert default settings
INSERT INTO settings (key, value, description) VALUES 
    ('app_name', '"Denshimon"', 'Application name'),
    ('theme', '"cyberpunk"', 'UI theme'),
    ('default_namespace', '"default"', 'Default Kubernetes namespace'),
    ('log_level', '"info"', 'Application log level'),
    ('metrics_retention', '"30d"', 'Metrics retention period'),
    ('auto_refresh_interval', '30', 'Auto refresh interval in seconds')
ON CONFLICT (key) DO NOTHING;