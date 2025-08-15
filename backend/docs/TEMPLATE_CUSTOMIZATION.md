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

### 3. Resource Profiles (Optional)

Since there's only one environment, resource limits are defined directly in each template with sensible defaults that can be customized during deployment.

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
└── apps/
    ├── web-app.yaml
    ├── api-service.yaml
    ├── background-worker.yaml
    ├── cron-job.yaml
    └── database.yaml
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
3. **Customize Generated YAML**:
   - Edit in built-in editor
   - Adjust resource limits if needed
   - Preview changes
   - Validate manifest
4. **Deploy & Sync**:
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
```

## Benefits

1. **Consistency**: All apps of the same type use the same base configuration
2. **Flexibility**: Can customize per environment and per application
3. **Speed**: Quickly deploy new applications with proven templates
4. **Best Practices**: Templates encode organizational best practices
5. **Reduced Errors**: Less manual YAML writing means fewer mistakes
6. **Git Tracking**: All changes are tracked in the base_infrastructure repository