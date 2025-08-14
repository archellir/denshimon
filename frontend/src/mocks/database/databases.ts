import { DatabaseInfo } from '@/types/database';

export const mockDatabases: Record<string, DatabaseInfo[]> = {
  'postgres-prod': [
    {
      name: 'denshimon_prod',
      size: 2147483648, // 2GB
      tableCount: 45,
      owner: 'denshimon_user',
      encoding: 'UTF8',
      collation: 'en_US.UTF-8',
      connectionCount: 12,
      createdAt: '2024-01-01T00:00:00Z'
    }
  ],
  'postgres-staging': [
    {
      name: 'denshimon_staging',
      size: 536870912, // 512MB
      tableCount: 45,
      owner: 'staging_user',
      encoding: 'UTF8',
      collation: 'en_US.UTF-8',
      connectionCount: 3,
      createdAt: '2024-01-05T00:00:00Z'
    }
  ],
  'postgres-analytics': [
    {
      name: 'analytics',
      size: 10737418240, // 10GB
      tableCount: 23,
      owner: 'analytics_readonly',
      encoding: 'UTF8',
      collation: 'en_US.UTF-8',
      connectionCount: 8,
      createdAt: '2023-12-01T00:00:00Z'
    }
  ],
  'sqlite-cache': [
    {
      name: 'main',
      size: 52428800, // 50MB
      tableCount: 8,
      owner: '',
      encoding: 'UTF-8',
      collation: '',
      connectionCount: 1,
      createdAt: '2024-01-12T08:45:00Z'
    }
  ],
  'sqlite-sessions': [
    {
      name: 'main',
      size: 10485760, // 10MB
      tableCount: 3,
      owner: '',
      encoding: 'UTF-8',
      collation: '',
      connectionCount: 1,
      createdAt: '2024-01-14T15:20:00Z'
    }
  ],
  'postgres-backup': [
    {
      name: 'backups',
      size: 53687091200, // 50GB
      tableCount: 150,
      owner: 'backup_user',
      encoding: 'UTF8',
      collation: 'en_US.UTF-8',
      connectionCount: 0,
      createdAt: '2023-11-01T00:00:00Z'
    }
  ]
};