# Complete Base Infrastructure Management Plan

## Overview

This plan extends Denshimon to provide complete management capabilities for the base infrastructure setup, focusing on database management, SSL certificate monitoring, service health, and backup/recovery operations.

## Current Infrastructure

**Base Infrastructure Services:**
- **PostgreSQL** - Shared database StatefulSet for all services
- **Gitea** - Git hosting service with container registry (git.arcbjorn.com)
- **Gitea Actions Runner** - CI/CD runner for Docker builds and deployments
- **Umami** - Analytics platform (analytics.arcbjorn.com)
- **Memos** - Note-taking application (memos.arcbjorn.com)
- **Filebrowser** - File management interface (server.arcbjorn.com)
- **Uptime Kuma** - Uptime monitoring (uptime.arcbjorn.com)

**Current Denshimon Capabilities:**
- ✅ Kubernetes cluster monitoring (nodes, pods, services, resources)
- ✅ Registry management (including Gitea registry integration)
- ✅ Deployment management and scaling
- ✅ Service mesh visualization
- ✅ Real-time metrics and observability
- ✅ Namespace and workload management

## Implementation Phases

### Phase 1: Database Management UI (Essential - Full Database Client)

#### Database Grid Interface (Similar to Network Tab)
- **Database Connections Grid**: Display all configured database connections in card/table view
- **Connection Status**: Show active/inactive status, last connected time, connection health
- **Quick Actions**: Connect/Disconnect buttons, edit configuration, delete connection

#### Add Database Connection Modal
- **Database Type Selector**: Dropdown for PostgreSQL or SQLite
- **Connection Form**: Dynamic form based on selected type:
  - **PostgreSQL**: Host, Port, Database, Username, Password, SSL options
  - **SQLite**: File path, connection string, or file upload
- **Test Connection**: Validate credentials before saving
- **Save Configuration**: Store encrypted credentials securely

#### Database Management Interface (Per Connection)
- **Table Browser**: Left sidebar showing database schema tree (databases > tables > columns)
- **SQL Query Editor**: 
  - Syntax highlighting for SQL
  - Query execution with results grid
  - Query history and saved queries
  - Export results (CSV, JSON)
- **Table Data Editor**:
  - View table data in paginated grid
  - Edit individual rows inline
  - Delete rows with confirmation
  - Add new rows with form validation
- **Database Statistics**: Table sizes, row counts, index usage

#### Technical Implementation
- Create `backend/internal/providers/databases/` with adapters:
  - `postgresql.go` - Full PostgreSQL client functionality
  - `sqlite.go` - SQLite file and query management
- Database connection management similar to registry system
- Secure credential storage using same encryption as registry configs
- Real-time connection status monitoring

### Phase 2: SSL Certificate Monitoring (Critical)

#### Certificate Health Dashboard
- Certificate expiration tracking for all domains:
  - git.arcbjorn.com (Gitea)
  - analytics.arcbjorn.com (Umami)
  - memos.arcbjorn.com (Memos)
  - server.arcbjorn.com (Filebrowser)
  - uptime.arcbjorn.com (Uptime Kuma)
- Health dashboard with renewal status and alerts
- Certificate validation across all services
- Automatic alerts for certificates expiring within 30 days

### Phase 3: Enhanced Service Health (Important)

#### Service-Specific Monitoring
- **Gitea Actions**: Runner queue monitoring, job status, build history
- **Filebrowser**: Connection status, storage utilization, file operations
- **Umami**: Analytics data collection status, database connectivity
- **Memos**: Note synchronization status, database health
- **Uptime Kuma**: External monitoring integration, alert status

#### Infrastructure Status
- External domain accessibility dashboard (complementing Uptime Kuma)
- Ingress rule validation and health checks
- iptables bypass rule verification (Docker-style rules)
- Network policy validation

### Phase 4: Backup & Recovery Dashboard (Nice to have)

#### Backup Monitoring
- PostgreSQL backup scheduling and status monitoring
- SQLite database backup verification
- PersistentVolume backup status tracking
- Backup integrity monitoring for both database types

#### Recovery Operations
- Point-in-time recovery interface
- Backup restoration workflows
- Recovery timeline visualization
- Disaster recovery procedures

## Database Tab Features Summary

**Core Functionality:**
- ✅ Grid view of database connections (similar to network tab)
- ✅ Add connection modal with type selection (PostgreSQL/SQLite)
- ✅ Connection management (connect/disconnect/edit/delete)
- ✅ Full database browser with table tree navigation
- ✅ SQL query editor with syntax highlighting and execution
- ✅ Table data editor (view/edit/delete/add rows)
- ✅ Database statistics and performance metrics

**Database Provider Support:**
- **PostgreSQL Adapter**: Connect to base-infra PostgreSQL StatefulSet and external PostgreSQL instances
- **SQLite Adapter**: Connect to local SQLite databases (including Denshimon's own database)
- **Provider-Agnostic Interface**: Unified UI that works with both database types
- **Secure Credential Management**: Encrypted storage using same system as registry configs

## Architecture Integration

**Following Existing Patterns:**
- Database providers follow same interface pattern as registry providers (gitea.go, generic.go)
- Connection management similar to registry system
- Secure credential storage using existing encryption
- Database connections auto-discovered via Kubernetes service discovery + manual configuration
- Real-time status monitoring using existing WebSocket metrics system

**File Structure:**
```
backend/internal/providers/databases/
├── interface.go         # Database provider interface
├── postgresql.go        # PostgreSQL adapter
├── sqlite.go           # SQLite adapter
├── manager.go          # Database connection manager
└── types.go            # Database types and schemas

frontend/src/components/infrastructure/
├── DatabaseTab.tsx          # Main database management interface
├── DatabaseGrid.tsx         # Database connections grid
├── DatabaseModal.tsx        # Add/edit connection modal
├── DatabaseBrowser.tsx      # Table browser and SQL editor
└── DatabaseEditor.tsx       # Table data editor
```

**Database Types Supported:**
1. **PostgreSQL** - Full client functionality with connection pooling
2. **SQLite** - File-based database support with query capabilities

## Implementation Priority

1. **Phase 1: Database Management** - Essential for day-to-day database operations
2. **Phase 2: SSL Certificate Monitoring** - Critical for service availability
3. **Phase 3: Enhanced Service Health** - Important for operational visibility
4. **Phase 4: Backup & Recovery** - Nice to have for disaster recovery

This plan provides complete infrastructure management capabilities while maintaining consistency with existing Denshimon patterns and the cyberpunk aesthetic.