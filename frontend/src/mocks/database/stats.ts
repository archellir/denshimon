import { DatabaseStats, TestConnectionResult, DatabaseType } from '@/types/database';

export const mockDatabaseStats: Record<string, DatabaseStats> = {
  'postgres-prod': {
    connections: {
      active: 12,
      idle: 3,
      total: 15,
      maxConn: 100
    },
    storage: {
      totalSize: 2147483648, // 2GB
      usedSize: 1932735283, // 1.8GB
      freeSize: 214748365    // 200MB
    },
    performance: {
      queriesPerSecond: 234.56,
      avgQueryTime: 12.34,
      slowQueries: 3,
      cacheHitRatio: 89.5
    }
  },
  'postgres-staging': {
    connections: {
      active: 3,
      idle: 2,
      total: 5,
      maxConn: 50
    },
    storage: {
      totalSize: 536870912,  // 512MB
      usedSize: 322122547,   // 307MB
      freeSize: 214748365    // 205MB
    },
    performance: {
      queriesPerSecond: 45.23,
      avgQueryTime: 8.91,
      slowQueries: 0,
      cacheHitRatio: 92.1
    }
  },
  'postgres-analytics': {
    connections: {
      active: 8,
      idle: 4,
      total: 12,
      maxConn: 200
    },
    storage: {
      totalSize: 10737418240, // 10GB
      usedSize: 9663676416,   // 9GB
      freeSize: 1073741824    // 1GB
    },
    performance: {
      queriesPerSecond: 567.89,
      avgQueryTime: 45.67,
      slowQueries: 12,
      cacheHitRatio: 78.9
    }
  },
  'sqlite-cache': {
    connections: {
      active: 1,
      idle: 0,
      total: 1,
      maxConn: 1
    },
    storage: {
      totalSize: 52428800,   // 50MB
      usedSize: 52428800,    // 50MB
      freeSize: 0
    },
    performance: {
      queriesPerSecond: 1234.56,
      avgQueryTime: 0.89,
      slowQueries: 0,
      cacheHitRatio: 0 // SQLite doesn't use traditional caching
    }
  },
  'sqlite-sessions': {
    connections: {
      active: 1,
      idle: 0,
      total: 1,
      maxConn: 1
    },
    storage: {
      totalSize: 10485760,   // 10MB
      usedSize: 10485760,    // 10MB
      freeSize: 0
    },
    performance: {
      queriesPerSecond: 89.12,
      avgQueryTime: 1.23,
      slowQueries: 0,
      cacheHitRatio: 0
    }
  }
};

export const mockTestResults: Record<string, TestConnectionResult> = {
  'postgres-success': {
    success: true,
    responseTime: 23.45,
    version: 'PostgreSQL 15.4 on x86_64-pc-linux-gnu'
  },
  'postgres-failure': {
    success: false,
    error: 'Connection refused: could not connect to server',
    responseTime: 5000.0
  },
  'sqlite-success': {
    success: true,
    responseTime: 1.23,
    version: 'SQLite 3.42.0'
  },
  'sqlite-failure': {
    success: false,
    error: 'No such file or directory: /invalid/path/database.db',
    responseTime: 0.45
  }
};

export const mockSupportedTypes = [DatabaseType.POSTGRESQL, DatabaseType.SQLITE];