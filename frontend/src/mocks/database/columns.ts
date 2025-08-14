import { ColumnInfo } from '@/types/database';

export const mockColumns: Record<string, ColumnInfo[]> = {
  'postgres-prod:denshimon_prod:users': [
    {
      name: 'id',
      type: 'integer',
      nullable: false,
      default: 'nextval(\'users_id_seq\'::regclass)',
      isPrimaryKey: true,
      isUnique: true,
      isIndex: true,
      comment: 'Primary key'
    },
    {
      name: 'username',
      type: 'varchar(100)',
      nullable: false,
      default: '',
      isPrimaryKey: false,
      isUnique: true,
      isIndex: true,
      comment: 'Unique username'
    },
    {
      name: 'email',
      type: 'varchar(255)',
      nullable: false,
      default: '',
      isPrimaryKey: false,
      isUnique: true,
      isIndex: true,
      comment: 'User email address'
    },
    {
      name: 'password_hash',
      type: 'varchar(255)',
      nullable: false,
      default: '',
      isPrimaryKey: false,
      isUnique: false,
      isIndex: false,
      comment: 'Hashed password'
    },
    {
      name: 'role',
      type: 'varchar(50)',
      nullable: false,
      default: 'viewer',
      isPrimaryKey: false,
      isUnique: false,
      isIndex: true,
      comment: 'User role: admin, operator, viewer'
    },
    {
      name: 'is_active',
      type: 'boolean',
      nullable: false,
      default: 'true',
      isPrimaryKey: false,
      isUnique: false,
      isIndex: true,
      comment: 'Account status'
    },
    {
      name: 'last_login',
      type: 'timestamp',
      nullable: true,
      default: '',
      isPrimaryKey: false,
      isUnique: false,
      isIndex: true,
      comment: 'Last login timestamp'
    },
    {
      name: 'created_at',
      type: 'timestamp',
      nullable: false,
      default: 'CURRENT_TIMESTAMP',
      isPrimaryKey: false,
      isUnique: false,
      isIndex: true,
      comment: 'Account creation time'
    },
    {
      name: 'updated_at',
      type: 'timestamp',
      nullable: false,
      default: 'CURRENT_TIMESTAMP',
      isPrimaryKey: false,
      isUnique: false,
      isIndex: false,
      comment: 'Last update time'
    }
  ],
  'postgres-prod:denshimon_prod:pods': [
    {
      name: 'id',
      type: 'integer',
      nullable: false,
      default: 'nextval(\'pods_id_seq\'::regclass)',
      isPrimaryKey: true,
      isUnique: true,
      isIndex: true,
      comment: 'Primary key'
    },
    {
      name: 'name',
      type: 'varchar(255)',
      nullable: false,
      default: '',
      isPrimaryKey: false,
      isUnique: true,
      isIndex: true,
      comment: 'Pod name'
    },
    {
      name: 'namespace',
      type: 'varchar(100)',
      nullable: false,
      default: 'default',
      isPrimaryKey: false,
      isUnique: false,
      isIndex: true,
      comment: 'Kubernetes namespace'
    },
    {
      name: 'node_name',
      type: 'varchar(255)',
      nullable: true,
      default: '',
      isPrimaryKey: false,
      isUnique: false,
      isIndex: true,
      comment: 'Node where pod is running'
    },
    {
      name: 'status',
      type: 'varchar(50)',
      nullable: false,
      default: 'Pending',
      isPrimaryKey: false,
      isUnique: false,
      isIndex: true,
      comment: 'Pod status: Running, Pending, Failed, etc.'
    },
    {
      name: 'cpu_usage',
      type: 'decimal(10,2)',
      nullable: true,
      default: '0.00',
      isPrimaryKey: false,
      isUnique: false,
      isIndex: false,
      comment: 'CPU usage in cores'
    },
    {
      name: 'memory_usage',
      type: 'bigint',
      nullable: true,
      default: '0',
      isPrimaryKey: false,
      isUnique: false,
      isIndex: false,
      comment: 'Memory usage in bytes'
    },
    {
      name: 'created_at',
      type: 'timestamp',
      nullable: false,
      default: 'CURRENT_TIMESTAMP',
      isPrimaryKey: false,
      isUnique: false,
      isIndex: true,
      comment: 'Pod creation time'
    }
  ],
  'postgres-prod:denshimon_prod:metrics': [
    {
      name: 'id',
      type: 'bigint',
      nullable: false,
      default: 'nextval(\'metrics_id_seq\'::regclass)',
      isPrimaryKey: true,
      isUnique: true,
      isIndex: true,
      comment: 'Primary key'
    },
    {
      name: 'timestamp',
      type: 'timestamp',
      nullable: false,
      default: 'CURRENT_TIMESTAMP',
      isPrimaryKey: false,
      isUnique: false,
      isIndex: true,
      comment: 'Metric timestamp'
    },
    {
      name: 'metric_name',
      type: 'varchar(100)',
      nullable: false,
      default: '',
      isPrimaryKey: false,
      isUnique: false,
      isIndex: true,
      comment: 'Name of the metric'
    },
    {
      name: 'value',
      type: 'double precision',
      nullable: false,
      default: '0.0',
      isPrimaryKey: false,
      isUnique: false,
      isIndex: false,
      comment: 'Metric value'
    },
    {
      name: 'labels',
      type: 'jsonb',
      nullable: true,
      default: '{}',
      isPrimaryKey: false,
      isUnique: false,
      isIndex: true,
      comment: 'Metric labels as JSON'
    },
    {
      name: 'source',
      type: 'varchar(100)',
      nullable: false,
      default: 'unknown',
      isPrimaryKey: false,
      isUnique: false,
      isIndex: true,
      comment: 'Source of the metric'
    }
  ],
  'sqlite-cache:main:cache_entries': [
    {
      name: 'id',
      type: 'INTEGER',
      nullable: false,
      default: '',
      isPrimaryKey: true,
      isUnique: true,
      isIndex: true,
      comment: 'Primary key'
    },
    {
      name: 'key',
      type: 'TEXT',
      nullable: false,
      default: '',
      isPrimaryKey: false,
      isUnique: true,
      isIndex: true,
      comment: 'Cache key'
    },
    {
      name: 'value',
      type: 'BLOB',
      nullable: true,
      default: '',
      isPrimaryKey: false,
      isUnique: false,
      isIndex: false,
      comment: 'Cached value'
    },
    {
      name: 'expires_at',
      type: 'INTEGER',
      nullable: false,
      default: '0',
      isPrimaryKey: false,
      isUnique: false,
      isIndex: true,
      comment: 'Expiration timestamp'
    },
    {
      name: 'created_at',
      type: 'INTEGER',
      nullable: false,
      default: 'strftime(\'%s\', \'now\')',
      isPrimaryKey: false,
      isUnique: false,
      isIndex: true,
      comment: 'Creation timestamp'
    },
    {
      name: 'size_bytes',
      type: 'INTEGER',
      nullable: false,
      default: '0',
      isPrimaryKey: false,
      isUnique: false,
      isIndex: false,
      comment: 'Size of cached value in bytes'
    }
  ],
  'sqlite-sessions:main:active_sessions': [
    {
      name: 'id',
      type: 'TEXT',
      nullable: false,
      default: '',
      isPrimaryKey: true,
      isUnique: true,
      isIndex: true,
      comment: 'Session ID'
    },
    {
      name: 'user_id',
      type: 'INTEGER',
      nullable: false,
      default: '0',
      isPrimaryKey: false,
      isUnique: false,
      isIndex: true,
      comment: 'User ID'
    },
    {
      name: 'ip_address',
      type: 'TEXT',
      nullable: false,
      default: '',
      isPrimaryKey: false,
      isUnique: false,
      isIndex: true,
      comment: 'Client IP address'
    },
    {
      name: 'user_agent',
      type: 'TEXT',
      nullable: true,
      default: '',
      isPrimaryKey: false,
      isUnique: false,
      isIndex: false,
      comment: 'Client user agent'
    },
    {
      name: 'expires_at',
      type: 'INTEGER',
      nullable: false,
      default: '0',
      isPrimaryKey: false,
      isUnique: false,
      isIndex: true,
      comment: 'Session expiration'
    },
    {
      name: 'created_at',
      type: 'INTEGER',
      nullable: false,
      default: 'strftime(\'%s\', \'now\')',
      isPrimaryKey: false,
      isUnique: false,
      isIndex: true,
      comment: 'Session creation time'
    }
  ]
};