import { TableInfo } from '@/types/database';

export const mockTables: Record<string, TableInfo[]> = {
  'postgres-prod:denshimon_prod': [
    {
      name: 'users',
      schema: 'public',
      type: 'table',
      rowCount: 15420,
      size: 2457600, // 2.4MB
      createdAt: '2024-01-01T10:00:00Z',
      updatedAt: '2024-01-20T14:30:00Z'
    },
    {
      name: 'pods',
      schema: 'public',
      type: 'table',
      rowCount: 3245,
      size: 1048576, // 1MB
      createdAt: '2024-01-01T10:00:00Z',
      updatedAt: '2024-01-20T14:25:00Z'
    },
    {
      name: 'nodes',
      schema: 'public',
      type: 'table',
      rowCount: 156,
      size: 65536, // 64KB
      createdAt: '2024-01-01T10:00:00Z',
      updatedAt: '2024-01-20T14:20:00Z'
    },
    {
      name: 'deployments',
      schema: 'public',
      type: 'table',
      rowCount: 892,
      size: 524288, // 512KB
      createdAt: '2024-01-01T10:00:00Z',
      updatedAt: '2024-01-20T13:45:00Z'
    },
    {
      name: 'metrics',
      schema: 'public',
      type: 'table',
      rowCount: 1245690,
      size: 125829120, // 120MB
      createdAt: '2024-01-01T10:00:00Z',
      updatedAt: '2024-01-20T14:30:00Z'
    },
    {
      name: 'logs',
      schema: 'public',
      type: 'table',
      rowCount: 5678432,
      size: 536870912, // 512MB
      createdAt: '2024-01-01T10:00:00Z',
      updatedAt: '2024-01-20T14:30:00Z'
    },
    {
      name: 'events',
      schema: 'public',
      type: 'table',
      rowCount: 89234,
      size: 16777216, // 16MB
      createdAt: '2024-01-01T10:00:00Z',
      updatedAt: '2024-01-20T14:28:00Z'
    },
    {
      name: 'auth_sessions',
      schema: 'public',
      type: 'table',
      rowCount: 8923,
      size: 1048576, // 1MB
      createdAt: '2024-01-01T10:00:00Z',
      updatedAt: '2024-01-20T14:15:00Z'
    },
    {
      name: 'user_preferences',
      schema: 'public',
      type: 'table',
      rowCount: 15420,
      size: 2097152, // 2MB
      createdAt: '2024-01-01T10:00:00Z',
      updatedAt: '2024-01-20T12:30:00Z'
    },
    {
      name: 'cluster_health_view',
      schema: 'public',
      type: 'view',
      rowCount: 1,
      size: 0,
      createdAt: '2024-01-05T15:00:00Z',
      updatedAt: '2024-01-20T14:30:00Z'
    }
  ],
  'postgres-analytics:analytics': [
    {
      name: 'user_activity',
      schema: 'public',
      type: 'table',
      rowCount: 2345678,
      size: 268435456, // 256MB
      createdAt: '2023-12-01T10:00:00Z',
      updatedAt: '2024-01-20T14:30:00Z'
    },
    {
      name: 'performance_metrics',
      schema: 'public',
      type: 'table',
      rowCount: 12456789,
      size: 1073741824, // 1GB
      createdAt: '2023-12-01T10:00:00Z',
      updatedAt: '2024-01-20T14:30:00Z'
    },
    {
      name: 'resource_usage',
      schema: 'public',
      type: 'table',
      rowCount: 8765432,
      size: 805306368, // 768MB
      createdAt: '2023-12-01T10:00:00Z',
      updatedAt: '2024-01-20T14:30:00Z'
    },
    {
      name: 'error_tracking',
      schema: 'public',
      type: 'table',
      rowCount: 156789,
      size: 52428800, // 50MB
      createdAt: '2023-12-01T10:00:00Z',
      updatedAt: '2024-01-20T14:25:00Z'
    },
    {
      name: 'daily_summary',
      schema: 'public',
      type: 'view',
      rowCount: 365,
      size: 0,
      createdAt: '2023-12-15T10:00:00Z',
      updatedAt: '2024-01-20T14:30:00Z'
    }
  ],
  'sqlite-cache:main': [
    {
      name: 'cache_entries',
      schema: 'main',
      type: 'table',
      rowCount: 45623,
      size: 23068672, // 22MB
      createdAt: '2024-01-12T08:45:00Z',
      updatedAt: '2024-01-20T14:30:00Z'
    },
    {
      name: 'cache_stats',
      schema: 'main',
      type: 'table',
      rowCount: 1440,
      size: 147456, // 144KB
      createdAt: '2024-01-12T08:45:00Z',
      updatedAt: '2024-01-20T14:30:00Z'
    },
    {
      name: 'expired_entries',
      schema: 'main',
      type: 'table',
      rowCount: 234567,
      size: 12582912, // 12MB
      createdAt: '2024-01-12T08:45:00Z',
      updatedAt: '2024-01-20T14:25:00Z'
    }
  ],
  'sqlite-sessions:main': [
    {
      name: 'active_sessions',
      schema: 'main',
      type: 'table',
      rowCount: 892,
      size: 524288, // 512KB
      createdAt: '2024-01-14T15:20:00Z',
      updatedAt: '2024-01-20T14:30:00Z'
    },
    {
      name: 'session_history',
      schema: 'main',
      type: 'table',
      rowCount: 156789,
      size: 8388608, // 8MB
      createdAt: '2024-01-14T15:20:00Z',
      updatedAt: '2024-01-20T14:15:00Z'
    },
    {
      name: 'login_attempts',
      schema: 'main',
      type: 'table',
      rowCount: 23456,
      size: 1572864, // 1.5MB
      createdAt: '2024-01-14T15:20:00Z',
      updatedAt: '2024-01-20T14:20:00Z'
    }
  ]
};