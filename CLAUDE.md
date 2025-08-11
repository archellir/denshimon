# Claude.md - Project Instructions

## Important Development Guidelines

### Always Use Standard CLI Tools for Initialization
- **Go Backend**: Use `go mod init` to initialize Go modules
- **React Frontend**: Use `npm create vite@latest my-app -- --template react` then `pnpm install`
- **Never manually create package.json or go.mod files**
- **Always use official scaffolding tools**

### Project Overview
This is a comprehensive Kubernetes GitOps and monitoring platform with:
- **GitOps Integration**: Full Gitea API integration with repository management and CI/CD workflows
- **Real-time Monitoring**: Grafana/Loki-style metrics and logging with live updates
- **Performance Optimized**: Virtualized tables and log viewers for handling large datasets
- **Customizable Dashboard**: User-configurable interface sections and navigation
- **Black & White Cyberpunk UI**: Terminal-inspired aesthetic with anti-SEO protection
- **Secure Authentication**: PASETO v2 tokens with role-based access control
- **Cloud Native**: Containerized deployment with multi-registry support

### Key Features Implemented
- ✅ **Virtualized Tables**: High-performance tables handling 50,000+ rows with smooth scrolling
- ✅ **Live Log Streaming**: Real-time log viewer with search, filtering, and auto-scroll
- ✅ **Gitea API Integration**: Complete GitOps workflow management through secure backend
- ✅ **Dashboard Customization**: Hide/show UI sections and tabs via settings modal
- ✅ **Anti-SEO Protection**: Meta tags, robots.txt, and generic descriptions for security
- ✅ **WebSocket Monitoring**: Real-time metrics and cluster state updates
- ✅ **Responsive Design**: Card/table view toggles for different screen sizes
- ✅ **TypeScript Coverage**: Full type safety with strict mode enabled

### Technology Stack
- **Backend**: Go 1.24.6 with standard library HTTP routing
- **Frontend**: React 19.1.1 + TypeScript 6.0.0-dev + Vite 7.1.1 + pnpm 10.14.0
- **UI**: Tailwind CSS 4.1.11 with Vite plugin + Custom cyberpunk components
- **Charts**: Recharts 3.1.2 (monochrome theme)
- **State**: Zustand 5.0.7 with full TypeScript support
- **Validation**: Zod 4.0.17 with TypeScript schemas
- **Icons**: Lucide React 0.539.0
- **Auth**: PASETO v4 tokens
- **Type Safety**: Full TypeScript coverage with strict mode enabled

### Development Commands

#### Development Mode (Separate Servers with Hot Reload)
```bash
# Backend API Server (Terminal 1)
cd backend
DATABASE_PATH=./test-app.db go run cmd/server/main.go
# Runs on http://localhost:8080

# Frontend Dev Server with Hot Reload (Terminal 2) 
cd frontend
pnpm run dev
# Runs on http://localhost:5173 with API proxy to backend
# Tries real API calls, falls back to mock data on error

# OR: Frontend with Mock Data Only (for development without backend)
pnpm run dev:mock
# Uses only mock data, no API calls

# Access the application at http://localhost:5173
# Login: admin / password
```

#### Production Build
```bash
# Build frontend and embed in Go binary
cd frontend
pnpm run build
cp -r dist/* ../backend/cmd/server/spa/

# Run integrated server
cd ../backend
DATABASE_PATH=./test-app.db go run cmd/server/main.go
```

#### Setup Commands
```bash
# Backend
cd backend
go mod init github.com/archellir/denshimon
go get k8s.io/client-go@latest
go get k8s.io/apimachinery@latest

# Frontend
npm create vite@latest frontend -- --template react-ts
cd frontend
pnpm install
pnpm install -D typescript@next @typescript-eslint/eslint-plugin @typescript-eslint/parser
pnpm install tailwindcss @tailwindcss/vite
pnpm add react-router@latest zustand@latest recharts@latest zod@latest lucide-react@latest

# TypeScript
pnpm run typecheck  # Type checking
pnpm run build      # Build with TypeScript compilation

# Testing
go test ./...
pnpm test

# Linting
go fmt ./...
pnpm run lint
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
DATABASE_PATH=./test-app.db  # SQLite database path
PASETO_SECRET_KEY=32-byte-secret-key-change-in-prod
PORT=8080
KUBECONFIG=/path/to/kubeconfig  # Optional for K8s integration

# Gitea Integration (Optional)
GITEA_URL=https://your-gitea-instance.com  # Gitea server URL
GITEA_TOKEN=your-api-token  # Gitea API token for authentication
GITEA_WEBHOOK_SECRET=webhook-secret  # Optional webhook verification

# Frontend (development)
# API calls automatically proxied to backend via Vite config
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
- **Go**: Follow standard Go conventions with gofmt
- **TypeScript**: Use strict mode with comprehensive typing
  - All components must use `FC` type from React
  - Strict null checks and type safety enabled
  - No `any` types except for explicit dynamic content
  - Props interfaces for all components
  - Zustand stores must have proper TypeScript interfaces
  - API responses must be typed with interfaces
- **React**: Functional components only with TypeScript
- **CSS**: Tailwind utility classes only

### TypeScript Guidelines
- **File Extensions**: Use `.tsx` for React components, `.ts` for utilities
- **Type Definitions**: Create comprehensive type definitions in `/src/types/`
- **Component Props**: Define props interfaces for all components
- **Store Typing**: Zustand stores must have typed interfaces
- **API Typing**: All API calls must return typed responses
- **Error Handling**: Proper error typing with `instanceof Error` checks
- **Strict Mode**: All TypeScript strict mode options enabled
- **Import Types**: Use `import type` for type-only imports

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
# Clone repository
git clone https://github.com/archellir/denshimon.git
cd denshimon

# Install dependencies
cd backend && go mod tidy
cd ../frontend && pnpm install

# Development mode (2 terminals)
# Terminal 1: Backend
cd backend && DATABASE_PATH=./test-app.db go run cmd/server/main.go

# Terminal 2: Frontend  
cd frontend && pnpm run dev
# OR: cd frontend && pnpm run dev:mock (mock data only)

# Access application at http://localhost:5173
# Login with: admin / password

# Production build
cd frontend && pnpm run build && cp -r dist/* ../backend/cmd/server/spa/
cd ../backend && DATABASE_PATH=./test-app.db go run cmd/server/main.go
```

### Important Notes
- This project runs inside Kubernetes pods
- It monitors the entire cluster
- Authentication is required for all operations
- UI must maintain cyberpunk aesthetic
- Performance is critical for real-time monitoring

### API Endpoints

#### Authentication
- `POST /api/auth/login` - Login with username/password
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/logout` - Logout

#### Kubernetes
- `GET /api/k8s/pods` - List pods
- `GET /api/k8s/nodes` - List nodes
- `GET /api/k8s/services` - List services
- `GET /api/k8s/namespaces` - List namespaces

#### Metrics & Monitoring
- `GET /api/metrics/cluster` - Get cluster metrics
- `GET /api/metrics/nodes` - Get node metrics
- `GET /api/metrics/pods` - Get pod metrics
- `GET /api/metrics/history` - Get historical metrics
- `GET /ws` - WebSocket for real-time updates

#### Gitea Integration (Optional)
- `GET /api/gitea/repositories` - List repositories
- `GET /api/gitea/repositories/{owner}/{repo}` - Get repository details
- `GET /api/gitea/repositories/{owner}/{repo}/commits` - List commits
- `GET /api/gitea/repositories/{owner}/{repo}/branches` - List branches
- `GET /api/gitea/repositories/{owner}/{repo}/pulls` - List pull requests
- `GET /api/gitea/repositories/{owner}/{repo}/releases` - List releases
- `GET /api/gitea/repositories/{owner}/{repo}/actions/runs` - List workflow runs
- `POST /api/gitea/repositories/{owner}/{repo}/deploy` - Trigger deployment
- `POST /api/gitea/webhook` - Webhook receiver (no auth)

### Repository
- GitHub: https://github.com/archellir/denshimon

### Git Commit Guidelines

**Rules**:
- NEVER add co-authors, "Generated with" tags, or metadata
- Focus on what changed and why, not how or who
- Use present tense ("add feature" not "added feature")
- Use lowercase for description
- No period at the end of description
- Keep commit message under 50 characters
- Keep description line under 72 characters

Follow [Conventional Commits v1.0.0](https://www.conventionalcommits.org/en/v1.0.0/):

**Format**: `type(scope): description`

**Required components**:
- `type`: feat, fix, docs, style, refactor, test, chore
- `scope`: component/area affected (api, auth, gitops, k8s, ui, etc.)
- `description`: concise description of changes

**Commit size limits**:
- **Maximum 1-2 files per commit** (can be more only if absolutely necessary)
- One logical change per commit
- Separate unrelated changes into different commits
  
**Examples**:
- `feat(gitops): add repository management service`
- `fix(auth): resolve PASETO token expiration issue`
- `docs(readme): update installation instructions`
- `refactor(api): extract common response handlers`