# Unified Frontend Mock Data System

## Overview

This document describes the comprehensive, type-safe mock data system implemented for the frontend. All mock data is centralized on the frontend to ensure consistency and eliminate backend-frontend data duplication.

## Architecture

### 1. Type Safety (`src/types/mockData.ts`)

All mock data structures are defined with strict TypeScript types and Zod schemas for runtime validation:

```typescript
// Example: Registry type with Zod validation
export const RegistrySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  type: z.nativeEnum(RegistryType),
  status: z.nativeEnum(RegistryStatus),
  url: z.string().url(),
  // ... more fields
});
export type Registry = z.infer<typeof RegistrySchema>;
```

### 2. Typed Mock Data (`src/mocks/generateTypedMockData.ts`)

All mock data structures are created using the defined types:

```typescript
export const TYPED_REGISTRIES: readonly Registry[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'Docker Hub',
    type: RegistryType.DOCKERHUB,
    status: RegistryStatus.CONNECTED,
    // ... properly typed fields
  }
];
```

### 3. Validation System (`src/mocks/validateMockData.ts`)

Runtime validation ensures all mock data conforms to schemas:

```typescript
// Validates all mock data and reports issues
export function validateAllMockData() {
  // Validates against Zod schemas
  MASTER_REGISTRIES.forEach(registry => validateMockData.registry(registry));
}
```

### 4. Environment Control

Mock data is only active when explicitly enabled:

```typescript
// Only runs when VITE_MOCK_DATA=true
export const MOCK_ENABLED = import.meta.env.VITE_MOCK_DATA === 'true';
```

## Key Features

### ✅ Type Safety
- All data structures use explicit TypeScript types
- Zod schemas provide runtime validation
- Compile-time and runtime type checking

### ✅ Consistency
- Single source of truth for all mock data
- Unified data structures across components
- No duplication between backend and frontend

### ✅ Validation
- Automatic validation in development mode
- Clear error reporting for invalid data
- Type guards for runtime checks

### ✅ Environment Control
- Mock data only enabled when explicitly requested
- No mock data leaks to production
- Clear separation between real and mock APIs

## Data Structures

### Core Infrastructure
- **Namespaces**: K8s namespace definitions
- **Nodes**: Cluster node information  
- **Applications**: Application deployments
- **Pods**: Container pod specifications
- **Services**: K8s service definitions

### Container Registry System
- **Registries**: Container registries (Docker Hub, Gitea, etc.)
- **Images**: Container image metadata with tags
- **Deployments**: Deployment specifications with history

### Monitoring & Health
- **Service Health**: Service status and metrics
- **Certificates**: SSL certificate management
- **Backup Jobs**: Backup and recovery operations
- **Log Entries**: System and application logs

### Database System
- **Connections**: Database connection configurations
- **Tables/Columns**: Database schema information
- **Query Results**: SQL query execution results

## Usage Examples

### Basic Usage
```typescript
import { MASTER_REGISTRIES, validateAllMockData } from '@/mocks';

// Use typed mock data
const registries = MASTER_REGISTRIES;

// Validate in development
const validation = validateAllMockData();
```

### Type Guards
```typescript
import { isValidMockData, validateMockData } from '@/mocks';

// Runtime type checking
if (isValidMockData(data, validateMockData.registry)) {
  // data is now typed as Registry
  console.log(data.name);
}
```

### Environment Checks
```typescript
import { MOCK_ENABLED } from '@/mocks';

if (MOCK_ENABLED) {
  // Use mock API
  return mockApiResponse(MASTER_REGISTRIES);
} else {
  // Use real API
  return fetch('/api/registries');
}
```

## Development Tools

### Validation in Development
The system automatically validates mock data in development mode and reports issues:

```bash
# Enable mock data
VITE_MOCK_DATA=true npm run dev:mock

# Console output:
✅ All mock data is valid
# OR
🚨 Mock Data Validation Errors
❌ MASTER_REGISTRIES: Invalid UUID format
```

### Type Checking
```bash
# TypeScript compilation catches type issues
npm run typecheck
```

## Migration from Backend Mock Data

### Issues Resolved
1. **Backend Mock Data Removed**:
   - `internal/auth/service.go` - Demo users
   - `internal/http/infrastructure.go` - Mock alerts
   - `internal/websocket/publisher.go` - Dynamic mock data
   - `internal/providers/backup/manager.go` - Storage stats

2. **Frontend Unified**:
   - All mock data centralized in frontend
   - Consistent data structures
   - Proper type safety
   - Runtime validation

### Backend Changes Needed
The backend should be updated to:
- Remove all mock data generation
- Return proper errors when services unavailable
- Let frontend handle mock data display

## Benefits

1. **Consistency**: Single source of truth for all mock data
2. **Type Safety**: Compile-time and runtime validation
3. **Developer Experience**: Clear error messages and validation
4. **Maintainability**: Centralized, organized mock data
5. **Production Safety**: No mock data in production builds
6. **Testing**: Reliable, consistent data for tests

## File Structure

```
src/
├── types/
│   └── mockData.ts              # Type definitions and Zod schemas
├── mocks/
│   ├── index.ts                 # Central exports
│   ├── generateTypedMockData.ts # Type-safe mock data
│   ├── validateMockData.ts      # Validation utilities
│   ├── masterData.ts            # Legacy (to be phased out)
│   └── unifiedMockData.ts       # Dynamic data generation
└── services/
    └── mockApi.ts               # Mock API layer
```

This system provides a robust, type-safe foundation for all mock data needs while ensuring consistency and preventing production issues.