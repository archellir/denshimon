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