# Denshimon Backend

Go backend service that provides REST APIs for Kubernetes management, GitOps operations, and monitoring.

## Architecture

- **Language**: Go 1.24
- **Database**: SQLite (embedded, no external dependencies)
- **Authentication**: PASETO v4 tokens
- **Frontend**: Embedded React SPA (single binary deployment)

## Features

### Kubernetes Management
- Pod operations (list, create, delete, restart, logs)
- Deployment management (list, scale)
- Node monitoring
- Resource metrics collection

### Registry & Deployment Management
- Container registry integration (Docker Hub, ECR, GCR, Gitea)
- Image management and deployment
- Database connection management

### Authentication & Security
- PASETO v4 token-based auth
- Role-based access control (admin, operator, viewer)
- Session management with SQLite

### Monitoring & Metrics
- Cluster resource usage
- Node and pod metrics
- Historical data collection
- Grafana-like dashboards

## API Endpoints

### Authentication
```
POST /api/auth/login     - User login
POST /api/auth/logout    - User logout
POST /api/auth/refresh   - Token refresh
GET  /api/auth/me        - Current user info
```

### Kubernetes
```
GET    /api/k8s/pods              - List pods
GET    /api/k8s/pods/{name}       - Get pod details
DELETE /api/k8s/pods/{name}       - Delete pod
POST   /api/k8s/pods/{name}/restart - Restart pod
GET    /api/k8s/pods/{name}/logs  - Get pod logs

GET   /api/k8s/deployments        - List deployments
PATCH /api/k8s/deployments/{name}/scale - Scale deployment

GET /api/k8s/nodes                - List nodes
GET /api/k8s/health               - Cluster health check
```

### Deployments & Registry Management
```
GET    /api/deployments/registries     - List container registries
POST   /api/deployments/registries     - Add registry
DELETE /api/deployments/registries/{id} - Delete registry
POST   /api/deployments/registries/{id}/test - Test registry connection

GET    /api/deployments/images         - List available images
GET    /api/deployments/images/search  - Search images
GET    /api/deployments/images/{id}/tags - Get image tags

GET    /api/deployments                - List deployments
POST   /api/deployments                - Create deployment
GET    /api/deployments/{id}           - Get deployment details
PUT    /api/deployments/{id}           - Update deployment
DELETE /api/deployments/{id}           - Delete deployment
```

### Metrics
```
GET /api/metrics/cluster     - Cluster metrics
GET /api/metrics/nodes       - Node metrics
GET /api/metrics/pods        - Pod metrics
GET /api/metrics/history     - Historical metrics
GET /api/metrics/namespaces  - Namespace metrics
GET /api/metrics/resources   - Resource metrics
```

## Configuration

Environment variables:

```bash
PORT=8080                                    # Server port
DATABASE_PATH=/app/data/denshimon.db        # SQLite database path
PASETO_SECRET_KEY=your-32-byte-secret-key    # PASETO signing key
TOKEN_DURATION=24h                           # Token expiration
LOG_LEVEL=info                               # Logging level
ENVIRONMENT=production                       # Environment
KUBECONFIG=/path/to/kubeconfig               # Kubernetes config (optional)
```

## Development

### Prerequisites
- Go 1.24+
- Access to Kubernetes cluster (optional for development)

### Setup
```bash
cd backend
go mod download
go build -o denshimon cmd/server/main.go
```

### Running
```bash
# Development with local SQLite
DATABASE_PATH=./dev.db ./denshimon

# Production with mounted volume
DATABASE_PATH=/app/data/denshimon.db ./denshimon
```

### Testing
```bash
go test ./...
```

## Database Schema

SQLite database includes:
- `users` - User accounts and roles
- `sessions` - Authentication sessions (replaces Redis)
- `cache` - Application cache (replaces Redis)
- `container_registries` - Container registry configurations
- `database_connections` - Database connection configs
- `certificate_domains` - Certificate monitoring configs
- `backup_jobs` - Backup job configurations
- `backup_history` - Backup execution history

## Authentication

Default demo users (password: "password"):
- `admin` - Full access (create, read, update, delete)
- `operator` - Limited admin (read, update, scale, sync)
- `viewer` - Read-only access

## Deployment

### Single Binary
```bash
# Build with embedded frontend
./build.sh
```

### Docker
```bash
docker build -t denshimon:latest .
docker run -p 8080:8080 -v data:/app/data denshimon:latest
```

### Kubernetes
Mount persistent volume to `/app/data` for SQLite database persistence.

## Security Considerations

- Use strong PASETO secret keys in production
- Enable RBAC for Kubernetes access
- Use TLS/SSL in production
- Regularly rotate authentication keys
- Monitor audit logs for security events