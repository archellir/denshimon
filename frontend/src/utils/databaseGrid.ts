import { DatabaseStatus, DatabaseType } from '@/types/database';
import { Status } from '@constants';

/**
 * Converts database status to general status
 */
export const getStatusFromDatabaseStatus = (dbStatus: DatabaseStatus): Status => {
  switch (dbStatus) {
    case DatabaseStatus.CONNECTED:
      return Status.HEALTHY;
    case DatabaseStatus.CONNECTING:
      return Status.WARNING;
    case DatabaseStatus.ERROR:
      return Status.CRITICAL;
    case DatabaseStatus.DISCONNECTED:
    default:
      return Status.UNKNOWN;
  }
};

/**
 * Gets the icon emoji for database type
 */
export const getDatabaseTypeIcon = (type: DatabaseType): string => {
  switch (type) {
    case DatabaseType.POSTGRESQL:
      return '🐘'; // PostgreSQL elephant
    case DatabaseType.SQLITE:
      return '📁'; // SQLite file
    default:
      return '💾';
  }
};

/**
 * Gets the display label for database type
 */
export const getDatabaseTypeLabel = (type: DatabaseType): string => {
  switch (type) {
    case DatabaseType.POSTGRESQL:
      return 'PostgreSQL';
    case DatabaseType.SQLITE:
      return 'SQLite';
    default:
      return String(type).toUpperCase();
  }
};

/**
 * Formats database connection string for display
 */
export const formatConnectionString = (
  host: string,
  port: number,
  database: string,
  hideCredentials: boolean = true
): string => {
  if (hideCredentials) {
    return `${host}:${port}/${database}`;
  }
  return `${host}:${port}/${database}`;
};

/**
 * Validates database connection parameters
 */
export const validateDatabaseConnection = (
  type: DatabaseType,
  host: string,
  port: number,
  database: string,
  username?: string,
  password?: string
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!host.trim()) {
    errors.push('Host is required');
  }

  if (!port || port < 1 || port > 65535) {
    errors.push('Port must be between 1 and 65535');
  }

  if (!database.trim()) {
    errors.push('Database name is required');
  }

  if (type === DatabaseType.POSTGRESQL) {
    if (!username?.trim()) {
      errors.push('Username is required for PostgreSQL');
    }
    if (!password?.trim()) {
      errors.push('Password is required for PostgreSQL');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Gets default port for database type
 */
export const getDefaultPortForDatabaseType = (type: DatabaseType): number => {
  switch (type) {
    case DatabaseType.POSTGRESQL:
      return 5432;
    case DatabaseType.SQLITE:
      return 0; // SQLite doesn't use ports
    default:
      return 5432;
  }
};

/**
 * Formats last connection time for display
 */
export const formatLastConnectionTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  
  const minutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
};