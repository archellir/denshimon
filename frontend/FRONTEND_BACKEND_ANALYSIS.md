# Frontend-Backend API Connection Analysis

## Overview

This document analyzes the connection between frontend services and backend HTTP endpoints to identify missing endpoints, redundant code, and functionality gaps.

## Frontend API Expectations vs Backend Implementation

### ✅ **Properly Connected Endpoints**

| Frontend Constant | Backend Route | Status |
|------------------|---------------|---------|
| `/api/auth/*` | Multiple auth routes in routes.go:90-101 | ✅ Connected |
| `/api/k8s/*` | K8s routes in routes.go:106-120 | ✅ Connected |
| `/api/metrics/*` | Metrics routes in routes.go:139-147 | ✅ Connected |
| `/api/services/*` | Service mesh routes in routes.go:123-127 | ✅ Connected |
| `/api/deployments/*` | Deployment routes in routes.go:172-234 | ✅ Connected |
| `/api/databases/*` | Database routes in routes.go:237-254 | ✅ Connected |
| `/api/certificates/*` | Certificate routes in routes.go:257-265 | ✅ Connected |
| `/api/backup/*` | Backup routes in routes.go:268-310 | ✅ Connected |
| `/api/gitops/*` | GitOps routes in routes.go:313-361 | ✅ Connected |
| `/api/infrastructure/*` | Infrastructure routes in routes.go:156-168 | ✅ Connected |

### ❌ **Missing or Misconnected Endpoints**

#### 1. **Frontend GitEA API Service (`giteaApi.ts`)**
- **Frontend expectation**: Direct Gitea API endpoints
  - `GET /repositories`
  - `GET /repositories/:owner/:repo/commits`
  - `GET /repositories/:owner/:repo/branches`
  - `POST /repositories/:owner/:repo/deploy`

- **Backend status**: ❌ **NOT IMPLEMENTED**
  - No `/api/gitea/*` routes found in backend
  - Frontend constants define `GITEA: '/api/gitea'` but no backend routes exist

#### 2. **Observability/Logs Mismatch**
- **Frontend expectation**:
  - Components expect `/api/log_data`, `/api/live_streams`, `/api/system_changes`
  
- **Backend status**: ✅ **Connected but inconsistent naming**
  - Backend: `GET /api/log_data` (routes.go:150)
  - Backend: `GET /api/live_streams` (routes.go:151)  
  - Backend: `GET /api/system_changes` (routes.go:153)

#### 3. **WebSocket Terminal Connections**
- **Frontend expectation**: `useTerminal.ts:63`
  - `ws://host/api/k8s/pods/exec?params`
  
- **Backend status**: ✅ **Connected**
  - Backend: `GET /api/k8s/pods/exec` (routes.go:130)

### 🔄 **Redundant Mock Data Issues**

#### Backend Mock Data Found (Should be removed):

1. **Authentication Service** (`internal/auth/service.go`)
   - `authenticateDemoUser()` - Hardcoded demo users
   - **Action**: Remove and let frontend handle mock auth

2. **Infrastructure Handler** (`internal/http/infrastructure.go`)
   - `initMockAlerts()` - Hardcoded infrastructure alerts
   - **Action**: Return empty/error, let frontend mock handle

3. **WebSocket Publisher** (`internal/websocket/publisher.go`)
   - Multiple `generate*()` functions for mock data
   - Dynamic mock metrics, database stats, service health
   - **Action**: Remove all mock generation, only send real data

4. **Backup Manager** (`internal/providers/backup/manager.go`)
   - `GetStorage()` and `GetStatistics()` return hardcoded mock data
   - **Action**: Return proper errors when unavailable

### 🚨 **Critical Issues Found**

#### 1. **Missing Gitea Integration**
```typescript
// Frontend expects these endpoints:
GET /api/gitea/repositories
GET /api/gitea/repositories/:owner/:repo
POST /api/gitea/repositories/:owner/:repo/deploy

// Backend has: NOTHING for Gitea
// Status: MAJOR FUNCTIONALITY GAP
```

#### 2. **Websocket Endpoint Inconsistency**
```typescript
// Frontend WebSocket connection:
/ws  // Used in websocket service

// Backend WebSocket handler:
GET /ws  // routes.go:365 - ✅ Matches
```

#### 3. **Mock Data Duplication**
```go
// Backend generates mock data:
publishPods() // Fake CPU/memory metrics
publishServiceHealthMetrics() // Fake service health  
generateQueryStats() // Fake database stats

// Frontend also has comprehensive mock data system
// Result: DUPLICATE MOCK DATA, INCONSISTENCIES
```

## Recommendations

### 🔧 **Immediate Fixes Required**

#### 1. **Add Missing Gitea Endpoints**
```go
// Add to backend routes.go:
mux.HandleFunc("GET /api/gitea/repositories", corsMiddleware(authService.AuthMiddleware(giteaHandlers.ListRepositories)))
mux.HandleFunc("GET /api/gitea/repositories/{owner}/{repo}", corsMiddleware(authService.AuthMiddleware(giteaHandlers.GetRepository)))
mux.HandleFunc("POST /api/gitea/repositories/{owner}/{repo}/deploy", corsMiddleware(authService.AuthMiddleware(giteaHandlers.DeployRepository)))
// ... etc
```

#### 2. **Remove Backend Mock Data**
```go
// Remove from internal/auth/service.go:
func authenticateDemoUser() // DELETE THIS

// Remove from internal/http/infrastructure.go:
func initMockAlerts() // DELETE THIS  

// Remove from internal/websocket/publisher.go:
func publishPods() // DELETE mock data generation
func publishServiceHealthMetrics() // DELETE mock data generation
func generateQueryStats() // DELETE mock data generation
```

#### 3. **Update Backend Error Handling**
```go
// Instead of returning mock data, return proper errors:
func (s *Service) GetServiceHealth() (*ServiceHealth, error) {
    if !s.isAvailable() {
        return nil, errors.New("service health monitoring unavailable")
    }
    // ... real implementation
}
```

### 📋 **Implementation Priority**

1. **HIGH**: Remove all backend mock data generation (breaks consistency)
2. **HIGH**: Add missing Gitea API endpoints (major functionality gap)
3. **MEDIUM**: Standardize error responses when services unavailable
4. **LOW**: Update frontend to handle backend errors gracefully

### ✅ **Well-Implemented Patterns**

1. **Mock Environment Control**: Frontend properly uses `VITE_MOCK_DATA` env var
2. **API Service Architecture**: Clean separation with `apiService` wrapper  
3. **Type Safety**: Strong TypeScript interfaces for all API responses
4. **Authentication**: Proper JWT middleware on protected routes
5. **CORS Handling**: Correct CORS middleware for development

## Conclusion

The codebase shows good overall architecture with proper separation between frontend and backend. The main issues are:

1. **Missing Gitea integration** - High priority functionality gap
2. **Duplicate mock data** - Backend generating conflicting mock data
3. **Inconsistent error handling** - Backend should return errors, not mock data

Once these issues are resolved, the frontend-backend API contract will be clean, consistent, and maintainable.