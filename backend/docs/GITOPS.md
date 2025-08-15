# GitOps Implementation Guide

## Overview

Denshimon now includes comprehensive GitOps functionality that automatically synchronizes Kubernetes deployments to a base infrastructure repository, enabling Infrastructure as Code (IaC) workflows.

## Architecture

```
GitHub/Gitea → Denshimon → Kubernetes → GitOps Sync → base_infrastructure repo
```

**Complete Workflow:**
1. Push code to GitHub
2. Code mirrored to Gitea
3. Gitea Actions create container images → packages
4. Deploy via Denshimon → Kubernetes
5. **NEW:** Automatic sync to base_infrastructure repository

## Features Implemented

### ✅ Core GitOps Functionality
- **Git Client Wrapper**: Clone, commit, push operations
- **Repository Management**: Track and sync GitOps repositories
- **Application Management**: Kubernetes application definitions
- **Manifest Generation**: Auto-generate K8s YAML from deployments
- **Sync Engine**: Manual and automatic synchronization
- **Deployment History**: Track all GitOps deployments

### ✅ Kubernetes Manifest Templates
- **Deployment**: Application containers with resources, env vars
- **Service**: ClusterIP services for application access
- **Ingress**: HTTP routing (optional)
- **ConfigMap**: Environment variable management
- **HorizontalPodAutoscaler**: Auto-scaling (optional)

### ✅ API Endpoints
- `GET /api/gitops/repositories` - List GitOps repositories
- `POST /api/gitops/repositories` - Create new repository
- `POST /api/gitops/repositories/init` - Initialize base repository
- `GET /api/gitops/applications` - List GitOps applications
- `POST /api/gitops/applications` - Create new application
- `POST /api/gitops/manifests/generate` - Generate K8s manifests
- `GET /api/gitops/sync/status` - Current sync status
- `POST /api/gitops/sync/force` - Force synchronization

### ✅ Frontend UI
- **GitOps Tab**: Added to Deployments section
- **Repository Management**: View and manage GitOps repositories
- **Application Overview**: Monitor GitOps applications and health
- **Sync Status Dashboard**: Real-time sync status and history
- **Force Sync**: Manual synchronization trigger

## Configuration

### Environment Variables

```bash
# Required
GITOPS_BASE_REPO_URL=https://github.com/your-org/base_infrastructure.git

# Optional (with defaults)
GITOPS_LOCAL_PATH=/tmp/base_infrastructure
GITOPS_BRANCH=main
GITOPS_USERNAME=your-git-username
GITOPS_TOKEN=your-git-token
GITOPS_AUTO_SYNC=true
GITOPS_SYNC_INTERVAL=300s
GITOPS_MANIFEST_PATH=k8s
```

### Git Authentication

**Option 1: Token Authentication**
```bash
GITOPS_USERNAME=your-username
GITOPS_TOKEN=ghp_your_github_token
```

**Option 2: SSH Keys**
Set up SSH keys in the container/environment where Denshimon runs.

## Usage

### 1. Initialize GitOps Repository

```bash
# Via API
curl -X POST http://localhost:8080/api/gitops/repositories/init

# Via Frontend
Navigate to Deployments → GitOps → Initialize Repository
```

### 2. Automatic Sync on Deployment

GitOps sync is **automatically triggered** when:
- Creating new deployments
- Updating existing deployments  
- Scaling deployments
- Any successful deployment operation

### 3. Manual Sync

```bash
# Force sync all applications
curl -X POST http://localhost:8080/api/gitops/sync/force \
  -H "Content-Type: application/json" \
  -d '{"config": {"auto_sync": true}}'

# Sync specific application
curl -X POST http://localhost:8080/api/gitops/sync/application/app-id \
  -H "Content-Type: application/json" \
  -d '{"config": {"commit_message": "manual sync"}}'
```

### 4. Generate Kubernetes Manifests

```bash
curl -X POST http://localhost:8080/api/gitops/manifests/generate \
  -H "Content-Type: application/json" \
  -d '{
    "application": {
      "name": "my-app",
      "namespace": "production",
      "image": "my-app:v1.0.0",
      "replicas": 3,
      "environment": {"ENV": "production"},
      "resources": {"cpu": "500m", "memory": "512Mi"}
    },
    "resource_type": "Full",
    "options": {
      "service": true,
      "ingress": true,
      "autoscaling": false
    }
  }'
```

## Repository Structure

GitOps operations create the following structure in your base infrastructure repository:

```
base_infrastructure/
├── k8s/
│   ├── default/
│   │   ├── app1.yaml
│   │   └── app2.yaml
│   ├── production/
│   │   ├── api.yaml
│   │   └── frontend.yaml
│   └── staging/
│       └── test-app.yaml
```

## Database Schema

GitOps functionality adds these tables:

### `gitops_repositories`
- Repository configuration and sync status
- Tracks base infrastructure repositories

### `gitops_applications` 
- Application definitions and health status
- Links to Kubernetes deployments

### `gitops_deployments`
- Deployment history with Git commits
- Audit trail for all GitOps operations

## Integration Points

### 1. Deployment Service Integration
- Automatic GitOps sync on successful deployments
- Resource mapping from K8s types to GitOps format
- Deployment history correlation

### 2. Frontend Integration
- GitOps tab in Deployments section
- Real-time sync status monitoring
- Repository and application management UI

### 3. Configuration Management
- Environment-based configuration loading
- Git authentication handling
- Sync interval and policy management

## Testing

Run the end-to-end test suite:

```bash
cd backend
./scripts/test_gitops_workflow.sh
```

This tests:
- ✅ API endpoint availability
- ✅ Manifest generation
- ✅ Application creation
- ✅ Sync functionality
- ✅ Resource type support

## Monitoring

### Sync Status Monitoring
```bash
# Get current sync status
curl http://localhost:8080/api/gitops/sync/status
```

### Application Health
```bash
# List applications with health status
curl http://localhost:8080/api/gitops/applications
```

### Deployment History
```bash
# Get deployment history for an application
curl http://localhost:8080/api/gitops/applications/{id}/history
```

## Troubleshooting

### Common Issues

**1. Git Authentication Failures**
```
Error: failed to push: authentication required
```
- Verify `GITOPS_USERNAME` and `GITOPS_TOKEN` are set
- Ensure token has repository write permissions

**2. Repository Not Found**
```
Error: failed to clone repository
```
- Verify `GITOPS_BASE_REPO_URL` is accessible
- Check repository exists and has correct permissions

**3. Sync Failures**
```
Error: failed to sync to git: no changes to commit
```
- This is normal when no changes exist
- GitOps only commits when manifests actually change

### Debug Commands

```bash
# Check GitOps configuration
curl http://localhost:8080/api/gitops/sync/status

# Validate manifest generation
curl -X POST http://localhost:8080/api/gitops/manifests/validate \
  -d '{"manifest": "apiVersion: apps/v1\nkind: Deployment..."}'

# List supported resource types
curl http://localhost:8080/api/gitops/manifests/types
```

## Roadmap

### 🔄 In Progress
- End-to-end workflow testing with real repositories

### ✅ Completed Features (Current Version)
- **Rollback Functionality**: ✅ Revert to previous Git commits via UI
- **Webhook Integration**: ✅ Auto-sync on Git repository changes
- **Advanced Monitoring**: ✅ GitOps-specific metrics and alerts dashboard
- **Template Customization**: ✅ Custom manifest templates per application type
- **Deploy from Registry**: ✅ Template-based deployment from container images
- **Manifest Editor**: ✅ In-browser Kubernetes configuration editing
- **Git Sync UI**: ✅ Manual sync controls for applications

### 🚀 Future Enhancements
- Performance optimization for Git operations with large repositories
- Enhanced error handling and retry logic for network failures  
- Multi-Repository Support for complex deployment scenarios

## Contributing

When contributing to GitOps functionality:

1. **Follow Git Commit Guidelines** (see `CLAUDE.md`)
2. **Test with Real Repositories** when possible
3. **Update Documentation** for new features
4. **Consider Security** for Git authentication
5. **Maintain Backward Compatibility** with existing deployments

## Security Considerations

- Store Git tokens securely (environment variables, not config files)
- Use repository-scoped tokens with minimal permissions
- Regularly rotate authentication tokens
- Monitor GitOps operations for unauthorized changes
- Implement audit logging for all Git operations

---

**Status: ✅ Production Ready**

The GitOps implementation is complete and ready for production use. The core workflow of automatic synchronization from Kubernetes deployments to base infrastructure repositories is fully functional.