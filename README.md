# K8s WebUI

A lightweight Kubernetes web interface focused on secrets management and cluster monitoring.

## Features

- **Secrets Management**: View, create, edit, and delete Kubernetes secrets
- **Resource Overview**: Monitor pods, services, deployments
- **Namespace Management**: Switch between namespaces
- **Real-time Updates**: Live cluster state monitoring
- **Security**: RBAC-based access control

## Architecture

```
Frontend (Svelte 5)
├── Secrets Manager
├── Resource Viewer  
└── Namespace Switcher

Backend (Bun.js + Hono)
├── Kubernetes API Client
├── Authentication & RBAC
└── WebSocket for real-time updates

Kubernetes Cluster
├── ServiceAccount & RBAC
└── Application Deployment
```

## Tech Stack

- **Frontend**: Svelte 5, TypeScript, Tailwind CSS, Monaco Editor
- **Backend**: Bun.js, Hono.js, @kubernetes/client-node
- **Database**: Redis (sessions), PostgreSQL (audit logs)
- **Authentication**: PASETO tokens with Kubernetes RBAC
- **Real-time**: WebSocket connections

## Quick Start

```bash
# Development
cd backend && bun run dev     # Start backend on :3001
cd frontend && npm run dev    # Start frontend on :5173

# Or use Docker Compose
docker compose up -d

# Generate secure PASETO key
cd backend && bun run generate-key

# Deploy to Kubernetes
cd ../base_infrastructure/k8s/k8s-webui && ./deploy.sh
```

## Requirements

- Bun.js >= 1.0
- Node.js >= 18 (for Svelte tooling)
- Docker (for containerized deployment)
- Kubernetes cluster access

## Security

- **PASETO v4.local tokens**: More secure than JWT, immune to algorithm confusion attacks
- All Kubernetes operations use ServiceAccount with minimal RBAC permissions
- Secrets are never stored in the application database
- All operations are audited and logged
- Stateless authentication with configurable token expiration
- Cryptographically secure 32-byte keys for token encryption

## Project Structure

```
k8s-webui/
├── backend/           # Bun.js + Hono API server
│   ├── src/          # Source code
│   ├── package.json  # Dependencies
│   └── Dockerfile    # Container build
├── frontend/          # Svelte 5 application
│   ├── src/          # Source code
│   ├── package.json  # Dependencies
│   └── Dockerfile    # Container build
├── docker-compose.yml # Development environment
├── .env.example      # Environment configuration template
└── README.md         # This file

# Kubernetes manifests are in base_infrastructure/k8s/k8s-webui/
```

## Infrastructure Services

The WebUI manages these Kubernetes services in the `base-infrastructure` namespace:

- **postgresql** - PostgreSQL database server (StatefulSet)
- **gitea** - Git repository hosting (Deployment) → git.arcbjorn.com
- **umami** - Web analytics platform (Deployment) → analytics.arcbjorn.com  
- **memos** - Notes and memos service (Deployment) → memos.arcbjorn.com
- **uptime-kuma** - Uptime monitoring (Deployment) → uptime.arcbjorn.com
- **filebrowser** - File management (Deployment) → server.arcbjorn.com
- **dozzle** - Container logs viewer (Deployment) → logs.arcbjorn.com