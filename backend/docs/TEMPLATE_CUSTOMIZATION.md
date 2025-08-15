# GitOps Template Customization

## Overview
Template customization allows different applications to use different Kubernetes manifest structures based on their specific needs.

## Template Types

### 1. Per-Application Templates
Different apps need different manifest structures:

#### Web Application Template
```yaml
# Includes:
- Deployment with specific health checks (readiness/liveness probes)
- Service with session affinity
- Ingress with SSL redirect
- HorizontalPodAutoscaler
- ConfigMap for environment variables
```

#### API Service Template  
```yaml
# Includes:
- Deployment with health endpoints
- Service (ClusterIP)
- Ingress with rate limiting annotations
- HorizontalPodAutoscaler
- ConfigMap for configuration
```

#### Background Worker Template
```yaml
# Includes:
- Deployment (no probes needed)
- No Service or Ingress
- Different resource limits
- ConfigMap for job configuration
```

#### Cron Job Template
```yaml
# Includes:
- CronJob resource
- ConfigMap for script/configuration
- No Service or Ingress
- Specific restart policies
```

#### Database Template
```yaml
# Includes:
- StatefulSet (not Deployment)
- Persistent Volume Claims
- Service (headless for StatefulSet)
- ConfigMap for database configuration
- Secret for credentials
```

### 2. Organization-Specific Standards

Templates should automatically include:
- Custom labels/annotations your organization requires
- Specific security contexts (runAsNonRoot, readOnlyRootFilesystem)
- Network policies for service communication
- Pod disruption budgets for high availability
- Resource quotas and limits
- Custom sidecars (logging, monitoring, service mesh proxy)

### 3. Environment-Specific Templates

#### Development Environment
- Lower resources (100m CPU, 128Mi memory)
- No replica requirements (1 replica)
- Simplified configuration
- Debug mode enabled
- No autoscaling

#### Staging Environment  
- Medium resources (500m CPU, 512Mi memory)
- 2 replicas minimum
- Basic monitoring annotations
- Autoscaling enabled (2-4 replicas)
- Test certificates

#### Production Environment
- High resources (1000m CPU, 1Gi memory)
- 3+ replicas minimum
- Full monitoring and alerting annotations
- Autoscaling enabled (3-10 replicas)
- Production certificates
- Backup annotations
- Pod disruption budgets

## Implementation Plan

### 1. Template Storage Structure
```
templates/
├── base/
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── configmap.yaml
│   ├── ingress.yaml
│   ├── hpa.yaml
│   └── pdb.yaml
├── apps/
│   ├── web-app.yaml
│   ├── api-service.yaml
│   ├── background-worker.yaml
│   ├── cron-job.yaml
│   └── database.yaml
└── environments/
    ├── development/
    │   └── overrides.yaml
    ├── staging/
    │   └── overrides.yaml
    └── production/
        └── overrides.yaml
```

### 2. Template Selection UI

When deploying from registry:
1. **Select Image** from Gitea/DockerHub
2. **Choose Template Type**:
   - Web Application
   - API Service
   - Background Worker
   - Cron Job
   - Database
   - Custom (blank template)
3. **Select Environment**:
   - Development
   - Staging
   - Production
4. **Customize Generated YAML**:
   - Edit in built-in editor
   - Preview changes
   - Validate manifest
5. **Deploy & Sync**:
   - Apply to Kubernetes
   - Commit to Git repository

### 3. Template Variables

Templates support variables that can be filled in:
- `{{.Name}}` - Application name
- `{{.Namespace}}` - Target namespace
- `{{.Image}}` - Container image
- `{{.Replicas}}` - Number of replicas
- `{{.CPU.Request}}` - CPU request
- `{{.CPU.Limit}}` - CPU limit
- `{{.Memory.Request}}` - Memory request
- `{{.Memory.Limit}}` - Memory limit
- `{{.Environment}}` - Environment variables
- `{{.Ports}}` - Container ports
- `{{.HealthCheck.Path}}` - Health check endpoint
- `{{.Ingress.Host}}` - Ingress hostname
- `{{.Ingress.Path}}` - Ingress path

### 4. Database Schema

```sql
CREATE TABLE IF NOT EXISTS gitops_templates (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    type VARCHAR(50) NOT NULL, -- web-app, api-service, worker, cron-job, database, custom
    description TEXT,
    content TEXT NOT NULL, -- Template YAML content
    variables TEXT, -- JSON array of required variables
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS gitops_template_environments (
    id VARCHAR(255) PRIMARY KEY,
    template_id VARCHAR(255) NOT NULL,
    environment VARCHAR(50) NOT NULL, -- development, staging, production
    overrides TEXT NOT NULL, -- JSON overrides for the environment
    FOREIGN KEY (template_id) REFERENCES gitops_templates(id) ON DELETE CASCADE,
    UNIQUE(template_id, environment)
);
```

## Benefits

1. **Consistency**: All apps of the same type use the same base configuration
2. **Flexibility**: Can customize per environment and per application
3. **Speed**: Quickly deploy new applications with proven templates
4. **Best Practices**: Templates encode organizational best practices
5. **Reduced Errors**: Less manual YAML writing means fewer mistakes
6. **Git Tracking**: All changes are tracked in the base_infrastructure repository