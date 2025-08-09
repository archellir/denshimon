-- Initial database schema for k8s-webui
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

-- Insert default settings
INSERT INTO settings (key, value, description) VALUES 
    ('app_name', '"K8s WebUI"', 'Application name'),
    ('theme', '"cyberpunk"', 'UI theme'),
    ('default_namespace', '"default"', 'Default Kubernetes namespace'),
    ('log_level', '"info"', 'Application log level'),
    ('metrics_retention', '"30d"', 'Metrics retention period'),
    ('auto_refresh_interval', '30', 'Auto refresh interval in seconds')
ON CONFLICT (key) DO NOTHING;