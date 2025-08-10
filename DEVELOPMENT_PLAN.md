# K8s WebUI Development Plan

## Overview
A containerized Kubernetes GitOps and monitoring platform with a black & white cyberpunk aesthetic, designed to run inside Kubernetes clusters and provide ArgoCD-like GitOps functionality combined with Grafana/Loki-style monitoring capabilities.

## Technology Stack (Latest Versions - Bleeding Edge)

### Backend (Go 1.24.6)
- **Runtime**: Go 1.24.6
- **Routing**: Standard library `net/http` with enhanced ServeMux
- **Authentication**: PASETO tokens (`github.com/o1egl/paseto`)
- **Database**: PostgreSQL + Redis (for sessions)
- **Kubernetes**: Client-go with automatic in-cluster/kubeconfig detection
- **Validation**: Go validator
- **RBAC**: Custom middleware with PASETO claims

### Frontend (React + TypeScript) - BLACK & WHITE CYBERPUNK THEME
- **Package Manager**: pnpm 10.14.0
- **Framework**: React 19.1.1 + TypeScript 6.0.0-dev + Vite 7.1.1
- **Routing**: React Router 7.8 with protected routes
- **UI Components**: Custom cyberpunk-themed components
- **Styling**: Tailwind CSS 4.1.11 with Vite plugin
- **Charts**: Recharts 3.1.2 (monochrome cyberpunk theme)
- **State Management**: Zustand 5.0.7 with TypeScript
- **Type Safety**: Full TypeScript coverage with strict mode
- **Validation**: Zod 4.0.17 with TypeScript schemas
- **Icons**: Lucide React 0.539.0

## Container Build Strategy
The application will be packaged as a single container image and pushed to a Gitea registry. Kubernetes manifests will be maintained in a separate repository.

```dockerfile
# Multi-stage build optimized for Gitea registry
# - Minimal Alpine-based image (~50MB total)
# - Single binary with embedded frontend
# - Non-root user for security
# - Health check endpoint included
```

### Gitea Registry Integration
```bash
# Build and push to Gitea
docker build -t gitea.example.com/org/denshimon:latest .
docker push gitea.example.com/org/denshimon:latest

# Image will be pulled by K8s from Gitea registry
# K8s manifests in separate repo will reference:
# image: gitea.example.com/org/denshimon:latest
```

## Authentication Flow (PASETO)
1. **Login**: Username/password → PASETO token
2. **Token Storage**: localStorage + httpOnly cookie
3. **API Protection**: All endpoints require valid PASETO
4. **RBAC**: Token contains user permissions (admin, viewer, operator)
5. **Auto-refresh**: Token renewal before expiry

## UI Design System - Cyberpunk Black & White

### Color Palette
- Primary: #000000 (Pure Black)
- Secondary: #FFFFFF (Pure White)
- Background variations: #0A0A0A, #111111, #1A1A1A
- Text variations: #E0E0E0, #F0F0F0, #FAFAFA
- Accent: #00FF00 (Matrix green for special effects only)

### Typography
- Primary: JetBrains Mono
- Secondary: Fira Code
- Terminal: IBM Plex Mono

### Visual Effects
- Terminal cursor blinking animations
- Matrix rain background (subtle)
- Glitch text animations on hover
- CRT monitor scan lines overlay
- ASCII art borders and dividers
- Typewriter effect for data loading
- Static noise transitions
- Phosphor glow on active elements

### Component Library
- Terminal-style input fields with blinking cursor
- ASCII art headers and logos
- Wireframe-style charts and graphs
- Command-line inspired navigation
- Matrix grid layouts for data tables
- Retro progress bars with ASCII characters
- Modal dialogs with terminal aesthetics
- Button hover effects with glitch animation

## Core Features Implementation

### 1. GitOps (ArgoCD-like)
- **Repository Management**
  - Add/remove Git repositories
  - SSH/HTTPS authentication
  - Branch/tag tracking
- **Application Sync**
  - Manual/automatic sync
  - Sync status visualization
  - Diff view between desired/actual state
- **Deployment History**
  - Rollback to previous versions
  - Audit trail of all changes
  - Terminal-style commit logs

### 2. Monitoring Dashboard (Grafana-like)
- **Cluster Overview**
  - Node status and resources
  - Namespace resource usage
  - Pod distribution
- **Real-time Metrics**
  - CPU/Memory usage graphs
  - Network I/O visualization
  - Disk usage monitoring
- **Custom Dashboards**
  - Drag-and-drop widget placement
  - Recharts with monochrome themes
  - ASCII-style mini graphs

### 3. Log Management (Loki-like)
- **Log Aggregation**
  - Real-time pod log streaming
  - Multi-pod log correlation
  - Log level filtering
- **Search Interface**
  - Regex pattern matching
  - Time-based filtering
  - Matrix-style log display
- **Log Export**
  - Download logs as text
  - Email log snapshots
  - Retention policies

### 4. Kubernetes Operations
- **Pod Management**
  - Restart/delete pods
  - Scale deployments
  - View pod details
- **Exec Interface**
  - Terminal emulator in browser
  - Multi-tab support
  - Command history
- **Resource Monitoring**
  - Live resource updates
  - Event stream display
  - Alert configuration

## Project Structure
```
/
├── backend/
│   ├── cmd/
│   │   └── server/
│   │       └── main.go           # Application entry point
│   ├── internal/
│   │   ├── auth/                 # PASETO authentication
│   │   │   ├── paseto.go
│   │   │   ├── middleware.go
│   │   │   └── rbac.go
│   │   ├── api/                  # HTTP handlers
│   │   │   ├── auth.go
│   │   │   ├── gitops.go
│   │   │   ├── kubernetes.go
│   │   │   ├── logs.go
│   │   │   └── metrics.go
│   │   ├── k8s/                  # Kubernetes client
│   │   │   ├── client.go
│   │   │   ├── pods.go
│   │   │   ├── deployments.go
│   │   │   └── exec.go
│   │   ├── gitops/               # Git operations
│   │   │   ├── repo.go
│   │   │   ├── sync.go
│   │   │   └── diff.go
│   │   ├── monitoring/           # Metrics collection
│   │   │   ├── collector.go
│   │   │   ├── prometheus.go
│   │   │   └── aggregator.go
│   │   └── database/             # DB operations
│   │       ├── postgres.go
│   │       └── redis.go
│   ├── pkg/                      # Shared packages
│   │   ├── config/
│   │   ├── logger/
│   │   └── utils/
│   └── go.mod
├── frontend/
│   ├── src/
│   │   ├── routes/               # React Router pages
│   │   │   ├── dashboard/
│   │   │   ├── gitops/
│   │   │   ├── logs/
│   │   │   ├── login/
│   │   │   └── settings/
│   │   ├── components/           # Reusable components
│   │   │   ├── charts/           # Recharts components
│   │   │   ├── terminal/         # Terminal UI
│   │   │   ├── matrix/           # Matrix effects
│   │   │   └── ui/               # shadcn/ui cyberpunk
│   │   ├── stores/               # Zustand stores
│   │   │   ├── auth.store.ts
│   │   │   ├── k8s.store.ts
│   │   │   └── gitops.store.ts
│   │   ├── hooks/                # Custom hooks
│   │   ├── lib/                  # Utilities
│   │   │   ├── api.ts            # API client
│   │   │   ├── schemas.ts        # Zod schemas
│   │   │   └── constants.ts
│   │   └── styles/               # Cyberpunk theme
│   │       ├── globals.css
│   │       ├── cyberpunk.css
│   │       └── animations.css
│   ├── public/
│   │   └── assets/               # Static assets
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── Dockerfile                    # Multi-stage build
├── docker-compose.yml            # Local development
├── .dockerignore                # Build optimization
├── .gitignore
└── README.md

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Token refresh
- `GET /api/auth/me` - Current user info

### Kubernetes Operations
- `GET /api/k8s/pods` - List all pods
- `GET /api/k8s/pods/:name` - Get pod details
- `POST /api/k8s/pods/:name/restart` - Restart pod
- `DELETE /api/k8s/pods/:name` - Delete pod
- `GET /api/k8s/pods/:name/logs` - Stream pod logs
- `POST /api/k8s/pods/:name/exec` - Execute command in pod
- `GET /api/k8s/deployments` - List deployments
- `PATCH /api/k8s/deployments/:name/scale` - Scale deployment
- `GET /api/k8s/nodes` - List nodes
- `GET /api/k8s/events` - Stream cluster events

### GitOps
- `GET /api/gitops/repos` - List repositories
- `POST /api/gitops/repos` - Add repository
- `DELETE /api/gitops/repos/:id` - Remove repository
- `GET /api/gitops/apps` - List applications
- `POST /api/gitops/apps/:id/sync` - Sync application
- `GET /api/gitops/apps/:id/diff` - Get diff
- `POST /api/gitops/apps/:id/rollback` - Rollback version

### Monitoring
- `GET /api/metrics/cluster` - Cluster metrics
- `GET /api/metrics/nodes` - Node metrics
- `GET /api/metrics/pods` - Pod metrics
- `GET /api/metrics/custom` - Custom metrics
- `WS /api/metrics/stream` - Real-time metrics stream

### Logs
- `GET /api/logs/search` - Search logs
- `GET /api/logs/stream` - Stream logs
- `POST /api/logs/export` - Export logs

## Environment Variables
```env
# Backend (configured in K8s, not in image)
DATABASE_URL=postgres://user:pass@postgres:5432/k8s_webui
REDIS_URL=redis://redis:6379
PASETO_SECRET_KEY=<from-k8s-secret>
PORT=8080
LOG_LEVEL=info
KUBECONFIG=/var/run/secrets/kubernetes.io/serviceaccount
GIT_TIMEOUT=60s
METRICS_INTERVAL=15s

# Frontend (build time)
VITE_API_URL=/api
VITE_WS_URL=/ws
```

## Security Considerations
1. **PASETO tokens** instead of JWT for better security
2. **RBAC** with three roles: admin, operator, viewer
3. **Audit logging** for all state-changing operations
4. **Network policies** to restrict pod communication
5. **Non-root container** with minimal attack surface
6. **Secret management** via Kubernetes secrets
7. **TLS termination** at ingress level

## Development Workflow

### Local Development
```bash
# Start dependencies
docker-compose up -d postgres redis

# Backend development
cd backend
go mod download
go run cmd/server/main.go

# Frontend development (separate terminal)
cd frontend
pnpm install
pnpm run dev
```

### Building for Production
```bash
# Build container
docker build -t gitea.example.com/org/denshimon:v1.0.0 .

# Test locally
docker run -p 8080:8080 \
  -e DATABASE_URL=... \
  -e REDIS_URL=... \
  -e PASETO_SECRET_KEY=... \
  gitea.example.com/org/denshimon:v1.0.0

# Push to Gitea
docker push gitea.example.com/org/denshimon:v1.0.0
```

### CI/CD Pipeline
```yaml
# GitHub Actions workflow
name: Build and Push
on:
  push:
    tags:
      - 'v*'
jobs:
  build:
    steps:
      - Build Docker image
      - Run tests
      - Push to Gitea registry
      - Trigger deployment update
```

## Performance Targets
- **API Response Time**: < 100ms for read operations
- **Log Search**: < 500ms for 1GB of logs
- **Metrics Update**: Real-time with 1s intervals
- **Memory Usage**: < 512MB under normal load
- **Container Size**: < 50MB total

## Future Enhancements
1. **Multi-cluster support** - Manage multiple K8s clusters
2. **Plugin system** - Extend functionality with plugins
3. **Mobile app** - React Native companion app
4. **AI-powered insights** - Anomaly detection and recommendations
5. **Backup/restore** - Application state backup
6. **Federation** - Connect multiple instances