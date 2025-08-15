-- Minimal database schema for denshimon - Only what's actually used
-- This creates a clean, minimal schema focused on actual functionality

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Core authentication table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'viewer', -- admin, operator, viewer
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Container registries for deployment management
CREATE TABLE IF NOT EXISTS container_registries (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    type VARCHAR(50) NOT NULL, -- dockerhub, gcr, ecr, generic, gitea
    config TEXT NOT NULL, -- JSON configuration (url, credentials, etc.)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Database connections for database browser
CREATE TABLE IF NOT EXISTS database_connections (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- postgresql, sqlite, mysql, mariadb
    host VARCHAR(255),
    port INTEGER,
    database_name VARCHAR(255),
    username VARCHAR(255),
    password_encrypted TEXT, -- encrypted password
    ssl_enabled BOOLEAN DEFAULT FALSE,
    ssl_config TEXT, -- JSON SSL configuration
    connection_timeout INTEGER DEFAULT 30,
    max_connections INTEGER DEFAULT 10,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_connected TIMESTAMP NULL
);

-- Certificate domain configurations for monitoring
CREATE TABLE IF NOT EXISTS certificate_domains (
    id VARCHAR(255) PRIMARY KEY,
    domain VARCHAR(255) NOT NULL UNIQUE,
    service VARCHAR(255) NOT NULL,
    port INTEGER NOT NULL DEFAULT 443,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    check_interval INTEGER NOT NULL DEFAULT 60, -- minutes
    warning_threshold INTEGER NOT NULL DEFAULT 30, -- days before expiration
    critical_threshold INTEGER NOT NULL DEFAULT 7, -- days before expiration
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

CREATE INDEX IF NOT EXISTS idx_container_registries_type ON container_registries(type);
CREATE INDEX IF NOT EXISTS idx_container_registries_name ON container_registries(name);

CREATE INDEX IF NOT EXISTS idx_database_connections_type ON database_connections(type);
CREATE INDEX IF NOT EXISTS idx_database_connections_last_connected ON database_connections(last_connected);

CREATE INDEX IF NOT EXISTS idx_certificate_domains_enabled ON certificate_domains(enabled);
CREATE INDEX IF NOT EXISTS idx_certificate_domains_check_interval ON certificate_domains(check_interval);

-- Insert default demo users (password is 'password' hashed with bcrypt)
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