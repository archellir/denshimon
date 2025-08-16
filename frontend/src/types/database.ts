export enum DatabaseType {
  POSTGRESQL = 'postgresql',
  SQLITE = 'sqlite'
}

export enum DatabaseStatus {
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  ERROR = 'error'
}

export interface DatabaseConfig {
  id: string;
  name: string;
  type: DatabaseType;
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  filePath: string; // For SQLite
  status: DatabaseStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface DatabaseInfo {
  name: string;
  size: number;
  tableCount: number;
  owner: string;
  encoding: string;
  collation: string;
  connectionCount: number;
  createdAt?: string;
}

export interface TableInfo {
  name: string;
  schema: string;
  type: string;
  rowCount: number;
  size: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  default: string;
  isPrimaryKey: boolean;
  isUnique: boolean;
  isIndex: boolean;
  comment?: string;
}

export interface QueryRequest {
  sql: string;
  limit?: number;
  offset?: number;
}

export interface QueryResult {
  columns: string[];
  rows: any[][];
  rowCount: number;
  affectedRows?: number;
  duration: number;
  error?: string;
}

export interface TableDataRequest {
  table: string;
  limit?: number;
  offset?: number;
  where?: string;
  order?: string;
}

export interface RowUpdateRequest {
  table: string;
  values: Record<string, any>;
  where: string;
}

export interface RowDeleteRequest {
  table: string;
  where: string;
}

export interface RowInsertRequest {
  table: string;
  values: Record<string, any>;
}

export interface ConnectionStats {
  active: number;
  idle: number;
  total: number;
  maxConn: number;
}

export interface StorageStats {
  totalSize: number;
  usedSize: number;
  freeSize: number;
}

export interface PerformanceStats {
  queriesPerSecond: number;
  avgQueryTime: number;
  slowQueries: number;
  cacheHitRatio: number;
}

export interface DatabaseStats {
  connections: ConnectionStats;
  storage: StorageStats;
  performance: PerformanceStats;
}

export interface TestConnectionResult {
  success: boolean;
  error?: string;
  responseTime: number;
  version?: string;
}

export interface SavedQuery {
  id: string;
  name: string;
  sql: string;
  connectionId?: string;
  createdAt: string;
  updatedAt: string;
}