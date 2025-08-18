# Backend Unit Tests

## Overview
This document describes the comprehensive unit test suite for the Denshimon backend Go application.

## Test Coverage

### 1. Constants Package (`internal/constants`)
**File**: `constants_test.go`
**Coverage**: Complete enum and constant validation

**Tests Include**:
- WebSocket message types (19 types)
- Log levels (6 levels)
- Event severities and categories
- Registry types and status
- Deployment status (9 statuses including GitOps)
- Deployment strategies and actions
- Complete Status enum (16 values)
- Time ranges (9 ranges)
- Common namespaces and log sources
- VPS defaults and limits
- Constant type validation
- Benchmark tests for performance

**Key Features**:
- Validates all constants match expected string values
- Tests constant types are properly defined as strings
- Verifies array constants contain expected values
- Performance benchmarks for constant access

### 2. Deployments Package (`internal/deployments`)
**Files**: `types_test.go`, `service_test.go`
**Coverage**: Type validation, JSON marshaling, service operations

**Types Tests** (`types_test.go`):
- DeploymentStatus enum validation
- JSON marshaling/unmarshaling for all types
- CreateDeploymentRequest validation
- ScaleDeploymentRequest and UpdateDeploymentRequest
- NodeInfo, AutoScaler, DeploymentHistory
- PodInfo and ResourceRequirements
- Benchmark tests for JSON operations

**Service Tests** (`service_test.go`):
- Request validation (create/update)
- Status transition validation
- Database operations (store/retrieve/update)
- Deployment history tracking
- Resource validation
- Pending deployments filtering
- Status transition logic

**Key Features**:
- Comprehensive validation of GitOps workflow statuses
- Database integration tests with SQLite
- Status transition state machine validation
- JSON serialization correctness

### 3. Authentication Package (`internal/auth`)
**Files**: `service_test.go`, `middleware_test.go`
**Coverage**: User management, token handling, middleware

**Service Tests** (`service_test.go`):
- User creation and authentication
- Password hashing and validation
- PASETO token generation and validation
- Token refresh and logout
- User management (CRUD operations)
- Database and Redis error handling
- Mock implementations for testing

**Middleware Tests** (`middleware_test.go`):
- Authentication middleware
- Role-based access control
- Optional authentication
- CORS handling
- Context user extraction
- Token validation in HTTP requests
- Preflight request handling

**Key Features**:
- Complete auth flow testing
- Mock database and Redis clients
- HTTP middleware integration tests
- Role hierarchy validation
- Performance benchmarks

### 4. GitOps Package (`internal/gitops`)
**File**: `service_test.go`
**Coverage**: Repository management, application tracking

**Tests Include**:
- Repository CRUD operations
- Application management
- Repository synchronization
- Manifest generation and validation
- Git operations (commit, push, pull)
- Database integration
- YAML manifest generation

**Key Features**:
- GitOps workflow validation
- Repository and application lifecycle
- Manifest validation logic
- Database schema testing

### 5. HTTP Types Package (`internal/http`)
**File**: `types_test.go`
**Coverage**: API response types, helper functions

**Tests Include**:
- APIResponse, PaginatedResponse, MetadataResponse
- JSON response helpers (SendJSON, SendSuccess, SendError)
- Pagination parsing with validation
- Time range parsing and validation
- Error response handling
- HTTP helper function testing

**Key Features**:
- Complete API response validation
- HTTP request parsing
- Query parameter validation
- Response format standardization

## Test Utilities and Patterns

### Mock Implementations
- **MockDatabaseClient**: Simulates database operations
- **MockRedisClient**: Simulates Redis operations  
- **MockK8sClient**: Simulates Kubernetes operations
- **MockGitClient**: Simulates Git operations

### Test Setup Patterns
- In-memory SQLite databases for integration tests
- HTTP test recorders for middleware testing
- Comprehensive error injection for failure scenarios
- Benchmark tests for performance validation

### Database Testing
- SQLite in-memory databases for fast, isolated tests
- Complete schema initialization
- Transaction testing
- Error condition handling

## Running Tests

### Run All Tests
```bash
go test ./internal/... -v
```

### Run Specific Package
```bash
go test ./internal/constants -v
go test ./internal/deployments -v
go test ./internal/auth -v
go test ./internal/gitops -v
go test ./internal/http -v
```

### Run with Coverage
```bash
go test ./internal/... -cover
```

### Run Benchmarks
```bash
go test ./internal/... -bench=.
```

## Test Quality Metrics

### Coverage Areas
- ✅ **Constants**: 100% enum/constant validation
- ✅ **Types**: Complete JSON marshaling validation
- ✅ **Business Logic**: Status transitions, validation rules
- ✅ **Database Operations**: CRUD with error handling
- ✅ **Authentication**: Complete auth flow with security
- ✅ **HTTP Layer**: Request/response handling
- ✅ **GitOps**: Repository and application management

### Test Categories
1. **Unit Tests**: Individual function/method testing
2. **Integration Tests**: Database and HTTP integration
3. **Validation Tests**: Input validation and business rules
4. **Error Handling**: Comprehensive error scenario coverage
5. **Performance Tests**: Benchmarks for critical paths

### Testing Best Practices Implemented
- **Isolated Tests**: Each test is independent
- **Mock Dependencies**: External dependencies are mocked
- **Error Injection**: Tests cover failure scenarios
- **Table-Driven Tests**: Comprehensive test case coverage
- **Benchmark Tests**: Performance validation
- **Integration Tests**: Real database and HTTP testing

## Key Test Features

### GitOps Workflow Testing
- Repository sync status tracking
- Application deployment lifecycle
- Git operations (commit, push, pull)
- Manifest generation and validation

### Authentication Security
- Password strength validation
- PASETO token security
- Role-based access control
- Session management

### Database Reliability
- Transaction handling
- Error recovery
- Data consistency
- Schema validation

### HTTP API Robustness
- Request validation
- Response formatting
- Error handling
- Pagination and filtering

## Next Steps

The test suite provides comprehensive coverage for:
- Core business logic validation
- Database operations and consistency
- Authentication and authorization
- GitOps workflow management  
- HTTP API functionality

All tests follow Go testing best practices and provide a solid foundation for maintaining code quality and preventing regressions.