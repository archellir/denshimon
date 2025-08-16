import { QueryResult, SavedQuery } from '@/types/database';

export const mockQueryResults: Record<string, QueryResult> = {
  'SELECT * FROM users LIMIT 5': {
    columns: ['id', 'username', 'email', 'role', 'is_active', 'last_login', 'created_at'],
    rows: [
      [1, 'admin', 'admin@denshimon.local', 'admin', true, '2024-01-20T14:25:00Z', '2024-01-01T10:00:00Z'],
      [2, 'john_doe', 'john@company.com', 'operator', true, '2024-01-20T13:45:00Z', '2024-01-02T09:15:00Z'],
      [3, 'jane_smith', 'jane@company.com', 'viewer', true, '2024-01-20T12:30:00Z', '2024-01-02T10:30:00Z'],
      [4, 'mike_wilson', 'mike@company.com', 'operator', true, '2024-01-19T16:20:00Z', '2024-01-03T11:45:00Z'],
      [5, 'sarah_connor', 'sarah@company.com', 'viewer', false, null, '2024-01-03T14:20:00Z']
    ],
    rowCount: 5,
    duration: 12.45
  },
  'SELECT * FROM pods WHERE status = \'Running\' LIMIT 10': {
    columns: ['id', 'name', 'namespace', 'node_name', 'status', 'cpu_usage', 'memory_usage', 'created_at'],
    rows: [
      [1, 'denshimon-web-7d4f8b9c-x8k2m', 'default', 'node-1', 'Running', 0.25, 268435456, '2024-01-20T10:00:00Z'],
      [2, 'denshimon-api-8f9g2h3-y9l3n', 'default', 'node-2', 'Running', 0.35, 536870912, '2024-01-20T10:05:00Z'],
      [3, 'postgresql-master-6c7d8e9f-z0m4o', 'database', 'node-3', 'Running', 0.80, 2147483648, '2024-01-20T09:30:00Z'],
      [4, 'redis-cache-5b6c7d8e-a1n5p', 'cache', 'node-1', 'Running', 0.15, 134217728, '2024-01-20T09:45:00Z'],
      [5, 'nginx-ingress-4a5b6c7d-b2o6q', 'ingress', 'node-2', 'Running', 0.20, 67108864, '2024-01-20T09:15:00Z'],
      [6, 'prometheus-server-3z4y5x6w-c3p7r', 'monitoring', 'node-3', 'Running', 0.45, 1073741824, '2024-01-20T08:30:00Z'],
      [7, 'grafana-dashboard-2y3x4w5v-d4q8s', 'monitoring', 'node-1', 'Running', 0.30, 536870912, '2024-01-20T08:45:00Z'],
      [8, 'loki-logs-1x2w3v4u-e5r9t', 'monitoring', 'node-2', 'Running', 0.25, 805306368, '2024-01-20T08:20:00Z'],
      [9, 'vault-secrets-0w1v2u3t-f6s0u', 'security', 'node-3', 'Running', 0.10, 134217728, '2024-01-20T07:30:00Z'],
      [10, 'cert-manager-9v0u1t2s-g7t1v', 'security', 'node-1', 'Running', 0.05, 67108864, '2024-01-20T07:45:00Z']
    ],
    rowCount: 10,
    duration: 8.92
  },
  'SELECT metric_name, AVG(value) as avg_value FROM metrics WHERE timestamp >= NOW() - INTERVAL \'1 hour\' GROUP BY metric_name': {
    columns: ['metric_name', 'avg_value'],
    rows: [
      ['cpu_usage_percent', 34.56],
      ['memory_usage_percent', 67.89],
      ['disk_usage_percent', 45.23],
      ['network_bytes_in', 1234567.89],
      ['network_bytes_out', 987654.32],
      ['pod_count', 156.0],
      ['node_count', 12.0],
      ['error_rate', 0.023]
    ],
    rowCount: 8,
    duration: 25.73
  },
  'SELECT COUNT(*) as total_users, COUNT(CASE WHEN is_active THEN 1 END) as active_users FROM users': {
    columns: ['total_users', 'active_users'],
    rows: [
      [15420, 14892]
    ],
    rowCount: 1,
    duration: 3.21
  },
  'SHOW TABLES': {
    columns: ['table_name'],
    rows: [
      ['users'],
      ['pods'],
      ['nodes'],
      ['deployments'],
      ['metrics'],
      ['logs'],
      ['events'],
      ['auth_sessions'],
      ['user_preferences'],
      ['cluster_health_view']
    ],
    rowCount: 10,
    duration: 2.15
  },
  'SELECT * FROM cache_entries ORDER BY created_at DESC LIMIT 5': {
    columns: ['id', 'key', 'expires_at', 'created_at', 'size_bytes'],
    rows: [
      [45623, 'user:session:abc123', 1705764600, 1705761000, 1024],
      [45622, 'metrics:cpu:node-1', 1705764300, 1705760700, 2048],
      [45621, 'pods:namespace:default', 1705764000, 1705760400, 4096],
      [45620, 'config:ingress:rules', 1705763700, 1705760100, 512],
      [45619, 'auth:permissions:admin', 1705763400, 1705759800, 256]
    ],
    rowCount: 5,
    duration: 1.23
  }
};

export const mockQueryHistory = [
  {
    id: '1',
    sql: 'SELECT * FROM users WHERE role = \'admin\'',
    timestamp: '2024-01-20T14:25:00Z',
    duration: 15.23,
    rowCount: 12,
    status: 'success'
  },
  {
    id: '2',
    sql: 'SELECT COUNT(*) FROM pods WHERE status = \'Running\'',
    timestamp: '2024-01-20T14:20:00Z',
    duration: 8.45,
    rowCount: 1,
    status: 'success'
  },
  {
    id: '3',
    sql: 'UPDATE users SET last_login = NOW() WHERE id = 1',
    timestamp: '2024-01-20T14:15:00Z',
    duration: 3.21,
    rowCount: 1,
    status: 'success'
  },
  {
    id: '4',
    sql: 'SELECT * FROM nonexistent_table',
    timestamp: '2024-01-20T14:10:00Z',
    duration: 0.12,
    rowCount: 0,
    status: 'error'
  },
  {
    id: '5',
    sql: 'SELECT metric_name, AVG(value) FROM metrics WHERE timestamp >= NOW() - INTERVAL \'24 hours\' GROUP BY metric_name ORDER BY AVG(value) DESC',
    timestamp: '2024-01-20T14:05:00Z',
    duration: 125.67,
    rowCount: 45,
    status: 'success'
  }
];

export const mockSavedQueries: SavedQuery[] = [
  {
    id: 'saved-1',
    name: 'Active Users',
    sql: 'SELECT * FROM users WHERE is_active = true ORDER BY last_login DESC',
    connectionId: 'pg-main',
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z'
  },
  {
    id: 'saved-2', 
    name: 'Running Pods',
    sql: 'SELECT name, namespace, status, node_name FROM pods WHERE status = \'Running\'',
    connectionId: 'pg-main',
    createdAt: '2024-01-16T14:20:00Z',
    updatedAt: '2024-01-16T14:20:00Z'
  },
  {
    id: 'saved-3',
    name: 'Database Tables',
    sql: 'SHOW TABLES',
    connectionId: 'pg-main',
    createdAt: '2024-01-17T09:15:00Z',
    updatedAt: '2024-01-17T09:15:00Z'
  },
  {
    id: 'saved-4',
    name: 'Daily Metrics Summary',
    sql: 'SELECT metric_name, AVG(value) as avg_value, MAX(value) as max_value FROM metrics WHERE timestamp >= CURRENT_DATE GROUP BY metric_name ORDER BY avg_value DESC',
    connectionId: 'pg-metrics',
    createdAt: '2024-01-18T16:45:00Z',
    updatedAt: '2024-01-19T11:30:00Z'
  },
  {
    id: 'saved-5',
    name: 'Recent Errors',
    sql: 'SELECT * FROM logs WHERE level = \'ERROR\' AND timestamp >= NOW() - INTERVAL \'1 hour\' ORDER BY timestamp DESC',
    connectionId: 'pg-logs',
    createdAt: '2024-01-19T13:20:00Z',
    updatedAt: '2024-01-19T13:20:00Z'
  }
];