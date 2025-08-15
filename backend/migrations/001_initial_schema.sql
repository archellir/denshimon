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

-- GitOps repositories table
CREATE TABLE IF NOT EXISTS gitops_repositories (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    url VARCHAR(500) NOT NULL,
    branch VARCHAR(255) NOT NULL DEFAULT 'main',
    path VARCHAR(500) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, active, error, syncing
    description TEXT,
    last_sync TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- GitOps applications table
CREATE TABLE IF NOT EXISTS gitops_applications (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    namespace VARCHAR(255) NOT NULL,
    repository_id VARCHAR(255),
    path VARCHAR(500),
    image VARCHAR(500) NOT NULL,
    replicas INTEGER NOT NULL DEFAULT 1,
    resources TEXT, -- JSON resources configuration
    environment TEXT, -- JSON environment variables
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, deployed, failed, updating
    health VARCHAR(50) NOT NULL DEFAULT 'unknown', -- healthy, degraded, suspended, missing, unknown
    sync_status VARCHAR(50) NOT NULL DEFAULT 'out-of-sync', -- synced, out-of-sync, unknown
    last_deployed TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (repository_id) REFERENCES gitops_repositories(id) ON DELETE SET NULL
);

-- GitOps deployment history table
CREATE TABLE IF NOT EXISTS gitops_deployments (
    id VARCHAR(255) PRIMARY KEY,
    application_id VARCHAR(255) NOT NULL,
    image VARCHAR(500) NOT NULL,
    replicas INTEGER NOT NULL,
    environment TEXT, -- JSON environment variables
    git_hash VARCHAR(255),
    status VARCHAR(50) NOT NULL, -- deployed, failed, pending, rolled_back
    message TEXT,
    deployed_by VARCHAR(255) NOT NULL,
    deployed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (application_id) REFERENCES gitops_applications(id) ON DELETE CASCADE
);

-- Create indexes for GitOps tables
CREATE INDEX IF NOT EXISTS idx_gitops_repositories_status ON gitops_repositories(status);
CREATE INDEX IF NOT EXISTS idx_gitops_repositories_last_sync ON gitops_repositories(last_sync);

CREATE INDEX IF NOT EXISTS idx_gitops_applications_namespace ON gitops_applications(namespace);
CREATE INDEX IF NOT EXISTS idx_gitops_applications_repository_id ON gitops_applications(repository_id);
CREATE INDEX IF NOT EXISTS idx_gitops_applications_status ON gitops_applications(status);
CREATE INDEX IF NOT EXISTS idx_gitops_applications_sync_status ON gitops_applications(sync_status);

CREATE INDEX IF NOT EXISTS idx_gitops_deployments_application_id ON gitops_deployments(application_id);
CREATE INDEX IF NOT EXISTS idx_gitops_deployments_deployed_at ON gitops_deployments(deployed_at);
CREATE INDEX IF NOT EXISTS idx_gitops_deployments_status ON gitops_deployments(status);

-- GitOps alerts table for monitoring and alerting
CREATE TABLE IF NOT EXISTS gitops_alerts (
    id VARCHAR(255) PRIMARY KEY,
    type VARCHAR(100) NOT NULL, -- sync_failure, deployment_failure, repository_unreachable, drift_detected, repository_check_failed, application_check_failed, application_unhealthy, sync_outdated
    severity VARCHAR(50) NOT NULL, -- critical, warning, info
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    metadata TEXT NOT NULL DEFAULT '{}', -- JSON metadata
    status VARCHAR(50) NOT NULL DEFAULT 'active', -- active, acknowledged, resolved
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL
);

-- Create indexes for GitOps alerts
CREATE INDEX IF NOT EXISTS idx_gitops_alerts_type ON gitops_alerts(type);
CREATE INDEX IF NOT EXISTS idx_gitops_alerts_severity ON gitops_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_gitops_alerts_status ON gitops_alerts(status);
CREATE INDEX IF NOT EXISTS idx_gitops_alerts_created_at ON gitops_alerts(created_at);
CREATE INDEX IF NOT EXISTS idx_gitops_alerts_resolved_at ON gitops_alerts(resolved_at);

-- GitOps template customization tables
CREATE TABLE IF NOT EXISTS gitops_templates (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    type VARCHAR(50) NOT NULL, -- web-app, api-service, worker, cron-job, database, custom
    description TEXT,
    content TEXT NOT NULL, -- Template YAML content with variables
    variables TEXT, -- JSON array of required variables
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for templates
CREATE INDEX IF NOT EXISTS idx_gitops_templates_type ON gitops_templates(type);
CREATE INDEX IF NOT EXISTS idx_gitops_templates_is_default ON gitops_templates(is_default);

-- Insert default templates
INSERT INTO gitops_templates (id, name, type, description, content, variables, is_default) VALUES
(
    'tpl-web-app',
    'Web Application',
    'web-app',
    'Standard web application with ingress and health checks',
    '---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{.Name}}
  namespace: {{.Namespace}}
  labels:
    app: {{.Name}}
    type: web-app
spec:
  replicas: {{.Replicas}}
  selector:
    matchLabels:
      app: {{.Name}}
  template:
    metadata:
      labels:
        app: {{.Name}}
    spec:
      containers:
      - name: {{.Name}}
        image: {{.Image}}
        ports:
        - containerPort: {{.Port}}
        resources:
          requests:
            cpu: {{.CPU.Request}}
            memory: {{.Memory.Request}}
          limits:
            cpu: {{.CPU.Limit}}
            memory: {{.Memory.Limit}}
        livenessProbe:
          httpGet:
            path: {{.HealthCheck.Path}}
            port: {{.Port}}
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: {{.HealthCheck.Path}}
            port: {{.Port}}
          initialDelaySeconds: 5
          periodSeconds: 5
        env:
        {{range $key, $value := .Environment}}
        - name: {{$key}}
          value: "{{$value}}"
        {{end}}
---
apiVersion: v1
kind: Service
metadata:
  name: {{.Name}}
  namespace: {{.Namespace}}
spec:
  selector:
    app: {{.Name}}
  ports:
  - port: {{.Port}}
    targetPort: {{.Port}}
  type: ClusterIP
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: {{.Name}}
  namespace: {{.Namespace}}
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  rules:
  - host: {{.Ingress.Host}}
    http:
      paths:
      - path: {{.Ingress.Path}}
        pathType: Prefix
        backend:
          service:
            name: {{.Name}}
            port:
              number: {{.Port}}',
    '[
        {"name": "Name", "required": true},
        {"name": "Namespace", "default": "default"},
        {"name": "Image", "required": true},
        {"name": "Replicas", "default": 1},
        {"name": "Port", "default": 8080},
        {"name": "CPU.Request", "default": "100m"},
        {"name": "CPU.Limit", "default": "500m"},
        {"name": "Memory.Request", "default": "128Mi"},
        {"name": "Memory.Limit", "default": "512Mi"},
        {"name": "HealthCheck.Path", "default": "/health"},
        {"name": "Ingress.Host", "required": true},
        {"name": "Ingress.Path", "default": "/"}
    ]',
    TRUE
),
(
    'tpl-api-service',
    'API Service',
    'api-service',
    'REST API service with rate limiting',
    '---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{.Name}}
  namespace: {{.Namespace}}
  labels:
    app: {{.Name}}
    type: api-service
spec:
  replicas: {{.Replicas}}
  selector:
    matchLabels:
      app: {{.Name}}
  template:
    metadata:
      labels:
        app: {{.Name}}
    spec:
      containers:
      - name: {{.Name}}
        image: {{.Image}}
        ports:
        - containerPort: {{.Port}}
        resources:
          requests:
            cpu: {{.CPU.Request}}
            memory: {{.Memory.Request}}
          limits:
            cpu: {{.CPU.Limit}}
            memory: {{.Memory.Limit}}
        livenessProbe:
          httpGet:
            path: /health
            port: {{.Port}}
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: {{.Port}}
          initialDelaySeconds: 5
          periodSeconds: 5
        env:
        {{range $key, $value := .Environment}}
        - name: {{$key}}
          value: "{{$value}}"
        {{end}}
---
apiVersion: v1
kind: Service
metadata:
  name: {{.Name}}
  namespace: {{.Namespace}}
spec:
  selector:
    app: {{.Name}}
  ports:
  - port: {{.Port}}
    targetPort: {{.Port}}
  type: ClusterIP
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: {{.Name}}
  namespace: {{.Namespace}}
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: {{.Name}}
  minReplicas: {{.Replicas}}
  maxReplicas: {{.MaxReplicas}}
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70',
    '[
        {"name": "Name", "required": true},
        {"name": "Namespace", "default": "default"},
        {"name": "Image", "required": true},
        {"name": "Replicas", "default": 2},
        {"name": "MaxReplicas", "default": 10},
        {"name": "Port", "default": 8080},
        {"name": "CPU.Request", "default": "200m"},
        {"name": "CPU.Limit", "default": "1000m"},
        {"name": "Memory.Request", "default": "256Mi"},
        {"name": "Memory.Limit", "default": "1Gi"}
    ]',
    TRUE
),
(
    'tpl-worker',
    'Background Worker',
    'worker',
    'Background worker without external access',
    '---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{.Name}}
  namespace: {{.Namespace}}
  labels:
    app: {{.Name}}
    type: worker
spec:
  replicas: {{.Replicas}}
  selector:
    matchLabels:
      app: {{.Name}}
  template:
    metadata:
      labels:
        app: {{.Name}}
    spec:
      containers:
      - name: {{.Name}}
        image: {{.Image}}
        resources:
          requests:
            cpu: {{.CPU.Request}}
            memory: {{.Memory.Request}}
          limits:
            cpu: {{.CPU.Limit}}
            memory: {{.Memory.Limit}}
        env:
        {{range $key, $value := .Environment}}
        - name: {{$key}}
          value: "{{$value}}"
        {{end}}',
    '[
        {"name": "Name", "required": true},
        {"name": "Namespace", "default": "default"},
        {"name": "Image", "required": true},
        {"name": "Replicas", "default": 1},
        {"name": "CPU.Request", "default": "100m"},
        {"name": "CPU.Limit", "default": "500m"},
        {"name": "Memory.Request", "default": "256Mi"},
        {"name": "Memory.Limit", "default": "1Gi"}
    ]',
    TRUE
),
(
    'tpl-cron-job',
    'Cron Job',
    'cron-job',
    'Scheduled job that runs periodically',
    '---
apiVersion: batch/v1
kind: CronJob
metadata:
  name: {{.Name}}
  namespace: {{.Namespace}}
  labels:
    app: {{.Name}}
    type: cron-job
spec:
  schedule: "{{.Schedule}}"
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: {{.Name}}
            image: {{.Image}}
            resources:
              requests:
                cpu: {{.CPU.Request}}
                memory: {{.Memory.Request}}
              limits:
                cpu: {{.CPU.Limit}}
                memory: {{.Memory.Limit}}
            env:
            {{range $key, $value := .Environment}}
            - name: {{$key}}
              value: "{{$value}}"
            {{end}}
          restartPolicy: OnFailure',
    '[
        {"name": "Name", "required": true},
        {"name": "Namespace", "default": "default"},
        {"name": "Image", "required": true},
        {"name": "Schedule", "default": "0 * * * *", "description": "Cron schedule expression"},
        {"name": "CPU.Request", "default": "100m"},
        {"name": "CPU.Limit", "default": "500m"},
        {"name": "Memory.Request", "default": "128Mi"},
        {"name": "Memory.Limit", "default": "512Mi"}
    ]',
    TRUE
)
ON CONFLICT (id) DO NOTHING;