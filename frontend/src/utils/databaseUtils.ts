import { DatabaseConfig } from '@/types/database';

/**
 * Filters database connections by status and search query
 */
export const filterConnections = (
  connections: DatabaseConfig[],
  showOnlyConnected: boolean = true,
  searchQuery: string = ''
): DatabaseConfig[] => {
  return connections
    .filter(conn => 
      showOnlyConnected ? conn.status === 'connected' : true
    )
    .filter(conn => {
      if (searchQuery === '') return true;
      
      const query = searchQuery.toLowerCase();
      return (
        conn.name.toLowerCase().includes(query) ||
        conn.database.toLowerCase().includes(query)
      );
    });
};

/**
 * Generates a database key for expanded state tracking
 */
export const generateDatabaseKey = (connectionId: string, databaseName: string): string => {
  return `${connectionId}:${databaseName}`;
};

/**
 * Creates an auto-generated SELECT query for a table
 */
export const generateSelectQuery = (tableName: string, limit: number = 100): string => {
  return `SELECT * FROM ${tableName} LIMIT ${limit}`;
};

/**
 * Formats database connection options for selectors
 */
export const formatConnectionOptions = (connections: DatabaseConfig[]) => {
  return connections.map(conn => ({
    value: conn.id,
    label: `${conn.name} (${conn.type.toUpperCase()})`,
    description: `${conn.host}:${conn.port}`
  }));
};

/**
 * Gets the localStorage key for database connections
 */
export const getDatabaseConnectionStorageKey = (): string => {
  return 'denshimon_last_database_connection';
};

/**
 * Saves the last selected database connection to localStorage
 */
export const saveLastDatabaseConnection = (connectionId: string): void => {
  if (connectionId) {
    localStorage.setItem(getDatabaseConnectionStorageKey(), connectionId);
  }
};

/**
 * Retrieves the last selected database connection from localStorage
 */
export const getLastDatabaseConnection = (): string | null => {
  return localStorage.getItem(getDatabaseConnectionStorageKey());
};