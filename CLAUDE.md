# Claude.md - Project Instructions

## Important Development Guidelines

### Always Use Standard CLI Tools for Initialization
- **Go Backend**: Use `go mod init` to initialize Go modules
- **React Frontend**: Use `bun init --react` to create React app
- **Never manually create package.json or go.mod files**
- **Always use official scaffolding tools**

### Project Overview
This is a Kubernetes GitOps and monitoring platform with:
- ArgoCD-like GitOps functionality
- Grafana/Loki-style monitoring and logging
- Black & white cyberpunk UI theme
- PASETO authentication
- Containerized for Gitea registry deployment

### Technology Stack
- **Backend**: Go 1.24.6 with standard library HTTP routing
- **Frontend**: React 18 + TypeScript + Vite (using Bun)
- **UI**: Tailwind CSS + shadcn/ui with cyberpunk theme
- **Charts**: Recharts 3.1.2
- **State**: Zustand 5.0.7
- **Validation**: Zod 4.x
- **Auth**: PASETO tokens

### Development Commands
```bash
# Backend
cd backend
go mod init github.com/archellir/k8s-webui
go get k8s.io/client-go@latest
go get k8s.io/apimachinery@latest
go run cmd/server/main.go

# Frontend
cd frontend
bun init --react
bun add react-router@latest zustand@latest recharts@latest zod@latest
bun add -d tailwindcss@latest autoprefixer@latest postcss@latest
bun run dev

# Testing
go test ./...
bun test

# Linting
go fmt ./...
bun run lint
```

### UI Design Requirements
- **Colors**: Pure black (#000000) and white (#FFFFFF) only
- **Accent**: Matrix green (#00FF00) for special effects only
- **Typography**: JetBrains Mono, Fira Code
- **Effects**: Terminal cursors, glitch animations, scan lines
- **Components**: ASCII art, wireframe charts, terminal inputs

### Dependency Management
- **Always use latest versions** (no version pinning)
- **Use `@latest` tag when installing**
- **Update regularly with `go get -u` and `bun update`**

### Container Registry
- Images will be pushed to Gitea registry
- Kubernetes manifests are in a separate repository
- Use multi-stage builds for minimal image size

### Security Requirements
- PASETO v2 for authentication
- RBAC with admin/operator/viewer roles
- Non-root container user
- Audit logging for all actions

### Performance Targets
- API responses < 100ms
- Container size < 50MB
- Memory usage < 512MB
- Real-time metrics with 1s intervals

### Git Workflow
- Feature branches for development
- Squash commits before merging
- Semantic versioning for releases
- Tag format: `v1.0.0`

### Environment Variables
```env
# Backend
DATABASE_URL=postgres://user:pass@localhost:5432/k8s_webui
REDIS_URL=redis://localhost:6379
PASETO_SECRET_KEY=32-byte-secret-key-change-in-prod
PORT=8080

# Frontend (build time)
VITE_API_URL=http://localhost:8080/api
```

### Testing Requirements
- Unit tests for all API endpoints
- Integration tests for K8s operations
- E2E tests for critical user flows
- Minimum 80% code coverage

### Documentation
- API documentation with OpenAPI/Swagger
- Component storybook for UI
- Architecture decision records (ADRs)
- User guide with screenshots

### Monitoring
- Prometheus metrics endpoint
- Health check endpoint
- Structured logging with log/slog
- Distributed tracing ready

### Code Style
- Go: Follow standard Go conventions
- TypeScript: Use strict mode
- React: Functional components only
- CSS: Tailwind utility classes

### Build Process
1. Run tests
2. Build frontend with Bun
3. Embed frontend in Go binary
4. Create minimal container image
5. Push to Gitea registry

### Common Issues
- **CORS**: Backend should handle CORS for local dev
- **WebSocket**: Use proper upgrade headers
- **Auth**: Store tokens securely
- **K8s**: Handle both in-cluster and kubeconfig

### Quick Start
```bash
# Clone and setup
git clone https://github.com/archellir/k8s-webui.git
cd k8s-webui

# Backend
cd backend
go mod init github.com/archellir/k8s-webui
go mod tidy
go run cmd/server/main.go

# Frontend (new terminal)
cd frontend
bun init --react
bun install
bun run dev

# Docker
docker-compose up
```

### Important Notes
- This project runs inside Kubernetes pods
- It monitors the entire cluster
- Authentication is required for all operations
- UI must maintain cyberpunk aesthetic
- Performance is critical for real-time monitoring

### Repository
- GitHub: https://github.com/archellir/k8s-webui

### Git Commit Guidelines

- Use conventional commits format: `type(scope): description`
- Use 50/72 rule: 50-character subject line, 72-character body lines
- Keep commit messages clean and focused on code changes only
- NEVER add co-authors, "Generated with" tags, or other metadata
- Use separate commits for different file types/purposes:
  - Scripts/automation: `feat:` or `fix:`
  - Documentation: `docs:`
  - Configuration: `fix:` or `refactor:`
- Focus on what changed and why, not who or how it was generated