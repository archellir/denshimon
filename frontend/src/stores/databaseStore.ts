import { create } from 'zustand';
import type { 
  DatabaseConfig, 
  DatabaseInfo, 
  TableInfo, 
  ColumnInfo, 
  QueryResult, 
  DatabaseStats,
  TestConnectionResult,
  DatabaseType
} from '@/types/database';
import { DatabaseStatus } from '@/types/database';
import type { ApiResponse } from '@/types';
import { API_ENDPOINTS } from '@/constants';
import { 
  mockDatabaseConnections,
  mockSupportedTypes,
  mockDatabases,
  mockTables,
  mockColumns,
  mockQueryResults,
  mockDatabaseStats,
  mockApiResponse
} from '@/mocks';

interface DatabaseStore {
  // State
  connections: DatabaseConfig[];
  selectedConnection: string | null;
  databases: DatabaseInfo[];
  tables: TableInfo[];
  columns: ColumnInfo[];
  queryResults: QueryResult | null;
  stats: DatabaseStats | null;
  supportedTypes: DatabaseType[];
  isLoading: boolean;
  error: string | null;
  testResult: TestConnectionResult | null;

  // Actions
  fetchConnections: () => Promise<void>;
  createConnection: (config: Omit<DatabaseConfig, 'id' | 'status'>) => Promise<void>;
  updateConnection: (id: string, config: Partial<DatabaseConfig>) => Promise<void>;
  deleteConnection: (id: string) => Promise<void>;
  connectDatabase: (id: string) => Promise<void>;
  disconnectDatabase: (id: string) => Promise<void>;
  testConnection: (config: Omit<DatabaseConfig, 'id' | 'status'>) => Promise<void>;
  fetchDatabases: (connectionId: string) => Promise<void>;
  fetchTables: (connectionId: string, database: string) => Promise<void>;
  fetchColumns: (connectionId: string, database: string, table: string) => Promise<void>;
  executeQuery: (connectionId: string, sql: string, limit?: number, offset?: number) => Promise<void>;
  fetchStats: (connectionId: string) => Promise<void>;
  fetchSupportedTypes: () => Promise<void>;
  setSelectedConnection: (id: string | null) => void;
  clearError: () => void;
  clearQueryResults: () => void;
}

const useDatabaseStore = create<DatabaseStore>((set, get) => ({
  // Initial state
  connections: [],
  selectedConnection: null,
  databases: [],
  tables: [],
  columns: [],
  queryResults: null,
  stats: null,
  supportedTypes: [],
  isLoading: false,
  error: null,
  testResult: null,

  // Actions
  fetchConnections: async () => {
    set({ isLoading: true, error: null });
    try {
      // Use mock data in development or when API fails
      if (MOCK_ENABLED) {
        const data = await mockApiResponse({ success: true, data: mockDatabaseConnections });
        set({ connections: data.data, isLoading: false });
        return;
      }

      const response = await fetch(API_ENDPOINTS.DATABASES.CONNECTIONS);
      const data: ApiResponse<DatabaseConfig[]> = await response.json();
      
      if (data.success) {
        set({ connections: data.data, isLoading: false });
      } else {
        set({ error: data.error || 'Failed to fetch connections', isLoading: false });
      }
    } catch (error) {
      console.error('Error fetching connections, falling back to mock data:', error);
      // Fallback to mock data
      const data = await mockApiResponse({ success: true, data: mockDatabaseConnections });
      set({ connections: data.data, isLoading: false });
    }
  },

  createConnection: async (config) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(API_ENDPOINTS.DATABASES.CONNECTIONS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });
      
      const data: ApiResponse<DatabaseConfig> = await response.json();
      
      if (data.success) {
        const { connections } = get();
        set({ 
          connections: [...connections, data.data],
          isLoading: false 
        });
      } else {
        set({ error: data.error || 'Failed to create connection', isLoading: false });
      }
    } catch (error) {
      console.error('Error creating connection:', error);
      set({ error: 'Failed to create connection', isLoading: false });
    }
  },

  updateConnection: async (id, config) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(API_ENDPOINTS.DATABASES.CONNECTION(id), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });
      
      const data: ApiResponse<DatabaseConfig> = await response.json();
      
      if (data.success) {
        const { connections } = get();
        set({ 
          connections: connections.map(conn => 
            conn.id === id ? data.data : conn
          ),
          isLoading: false 
        });
      } else {
        set({ error: data.error || 'Failed to update connection', isLoading: false });
      }
    } catch (error) {
      console.error('Error updating connection:', error);
      set({ error: 'Failed to update connection', isLoading: false });
    }
  },

  deleteConnection: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(API_ENDPOINTS.DATABASES.CONNECTION(id), {
        method: 'DELETE',
      });
      
      const data: ApiResponse<void> = await response.json();
      
      if (data.success) {
        const { connections, selectedConnection } = get();
        set({ 
          connections: connections.filter(conn => conn.id !== id),
          selectedConnection: selectedConnection === id ? null : selectedConnection,
          isLoading: false 
        });
      } else {
        set({ error: data.error || 'Failed to delete connection', isLoading: false });
      }
    } catch (error) {
      console.error('Error deleting connection:', error);
      set({ error: 'Failed to delete connection', isLoading: false });
    }
  },

  connectDatabase: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(API_ENDPOINTS.DATABASES.CONNECTION_CONNECT(id), {
        method: 'POST',
      });
      
      const data: ApiResponse<void> = await response.json();
      
      if (data.success) {
        const { connections } = get();
        set({ 
          connections: connections.map(conn => 
            conn.id === id ? { ...conn, status: DatabaseStatus.CONNECTED } : conn
          ),
          isLoading: false 
        });
      } else {
        set({ error: data.error || 'Failed to connect to database', isLoading: false });
      }
    } catch (error) {
      console.error('Error connecting to database:', error);
      set({ error: 'Failed to connect to database', isLoading: false });
    }
  },

  disconnectDatabase: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(API_ENDPOINTS.DATABASES.CONNECTION_DISCONNECT(id), {
        method: 'POST',
      });
      
      const data: ApiResponse<void> = await response.json();
      
      if (data.success) {
        const { connections } = get();
        set({ 
          connections: connections.map(conn => 
            conn.id === id ? { ...conn, status: DatabaseStatus.DISCONNECTED } : conn
          ),
          isLoading: false 
        });
      } else {
        set({ error: data.error || 'Failed to disconnect from database', isLoading: false });
      }
    } catch (error) {
      console.error('Error disconnecting from database:', error);
      set({ error: 'Failed to disconnect from database', isLoading: false });
    }
  },

  testConnection: async (config) => {
    set({ isLoading: true, error: null, testResult: null });
    try {
      const response = await fetch(API_ENDPOINTS.DATABASES.CONNECTION_TEST, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });
      
      const data: ApiResponse<TestConnectionResult> = await response.json();
      
      if (data.success) {
        set({ testResult: data.data, isLoading: false });
      } else {
        set({ error: data.error || 'Failed to test connection', isLoading: false });
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      set({ error: 'Failed to test connection', isLoading: false });
    }
  },

  fetchDatabases: async (connectionId) => {
    set({ isLoading: true, error: null });
    try {
      // Use mock data in development or when API fails
      if (MOCK_ENABLED) {
        const databaseList = mockDatabases[connectionId] || [];
        const data = await mockApiResponse({ success: true, data: databaseList });
        set({ databases: data.data, isLoading: false });
        return;
      }

      const response = await fetch(API_ENDPOINTS.DATABASES.DATABASES(connectionId));
      const data: ApiResponse<DatabaseInfo[]> = await response.json();
      
      if (data.success) {
        set({ databases: data.data, isLoading: false });
      } else {
        set({ error: data.error || 'Failed to fetch databases', isLoading: false });
      }
    } catch (error) {
      console.error('Error fetching databases, falling back to mock data:', error);
      // Fallback to mock data
      const databaseList = mockDatabases[connectionId] || [];
      const data = await mockApiResponse({ success: true, data: databaseList });
      set({ databases: data.data, isLoading: false });
    }
  },

  fetchTables: async (connectionId, database) => {
    set({ isLoading: true, error: null });
    try {
      // Use mock data in development or when API fails
      if (MOCK_ENABLED) {
        const tableKey = `${connectionId}:${database}`;
        const tableList = mockTables[tableKey] || [];
        const data = await mockApiResponse({ success: true, data: tableList });
        set({ tables: data.data, isLoading: false });
        return;
      }

      const response = await fetch(API_ENDPOINTS.DATABASES.TABLES(connectionId, database));
      const data: ApiResponse<TableInfo[]> = await response.json();
      
      if (data.success) {
        set({ tables: data.data, isLoading: false });
      } else {
        set({ error: data.error || 'Failed to fetch tables', isLoading: false });
      }
    } catch (error) {
      console.error('Error fetching tables, falling back to mock data:', error);
      // Fallback to mock data
      const tableKey = `${connectionId}:${database}`;
      const tableList = mockTables[tableKey] || [];
      const data = await mockApiResponse({ success: true, data: tableList });
      set({ tables: data.data, isLoading: false });
    }
  },

  fetchColumns: async (connectionId, database, table) => {
    set({ isLoading: true, error: null });
    try {
      // Use mock data in development or when API fails
      if (MOCK_ENABLED) {
        const columnKey = `${connectionId}:${database}:${table}`;
        const columnList = mockColumns[columnKey] || [];
        const data = await mockApiResponse({ success: true, data: columnList });
        set({ columns: data.data, isLoading: false });
        return;
      }

      const response = await fetch(API_ENDPOINTS.DATABASES.COLUMNS(connectionId, database, table));
      const data: ApiResponse<ColumnInfo[]> = await response.json();
      
      if (data.success) {
        set({ columns: data.data, isLoading: false });
      } else {
        set({ error: data.error || 'Failed to fetch columns', isLoading: false });
      }
    } catch (error) {
      console.error('Error fetching columns, falling back to mock data:', error);
      // Fallback to mock data
      const columnKey = `${connectionId}:${database}:${table}`;
      const columnList = mockColumns[columnKey] || [];
      const data = await mockApiResponse({ success: true, data: columnList });
      set({ columns: data.data, isLoading: false });
    }
  },

  executeQuery: async (connectionId, sql, limit, offset) => {
    set({ isLoading: true, error: null, queryResults: null });
    try {
      // Use mock data in development or when API fails
      if (MOCK_ENABLED) {
        // Try to find matching mock query result or use a default
        const queryResult = mockQueryResults[sql] || mockQueryResults['SELECT * FROM users LIMIT 5'];
        const data = await mockApiResponse({ success: true, data: queryResult });
        set({ queryResults: data.data, isLoading: false });
        return;
      }

      const response = await fetch(API_ENDPOINTS.DATABASES.QUERY(connectionId), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sql, limit, offset }),
      });
      
      const data: ApiResponse<QueryResult> = await response.json();
      
      if (data.success) {
        set({ queryResults: data.data, isLoading: false });
      } else {
        set({ error: data.error || 'Failed to execute query', isLoading: false });
      }
    } catch (error) {
      console.error('Error executing query, falling back to mock data:', error);
      // Fallback to mock data
      const queryResult = mockQueryResults[sql] || mockQueryResults['SELECT * FROM users LIMIT 5'];
      const data = await mockApiResponse({ success: true, data: queryResult });
      set({ queryResults: data.data, isLoading: false });
    }
  },

  fetchStats: async (connectionId) => {
    set({ isLoading: true, error: null });
    try {
      // Use mock data in development or when API fails
      if (MOCK_ENABLED) {
        const statsData = mockDatabaseStats[connectionId] || mockDatabaseStats['postgres-prod'];
        const data = await mockApiResponse({ success: true, data: statsData });
        set({ stats: data.data, isLoading: false });
        return;
      }

      const response = await fetch(API_ENDPOINTS.DATABASES.STATS(connectionId));
      const data: ApiResponse<DatabaseStats> = await response.json();
      
      if (data.success) {
        set({ stats: data.data, isLoading: false });
      } else {
        set({ error: data.error || 'Failed to fetch stats', isLoading: false });
      }
    } catch (error) {
      console.error('Error fetching stats, falling back to mock data:', error);
      // Fallback to mock data
      const statsData = mockDatabaseStats[connectionId] || mockDatabaseStats['postgres-prod'];
      const data = await mockApiResponse({ success: true, data: statsData });
      set({ stats: data.data, isLoading: false });
    }
  },

  fetchSupportedTypes: async () => {
    set({ isLoading: true, error: null });
    try {
      // Use mock data in development or when API fails
      if (MOCK_ENABLED) {
        const data = await mockApiResponse({ success: true, data: mockSupportedTypes });
        set({ supportedTypes: data.data, isLoading: false });
        return;
      }

      const response = await fetch(API_ENDPOINTS.DATABASES.TYPES);
      const data: ApiResponse<DatabaseType[]> = await response.json();
      
      if (data.success) {
        set({ supportedTypes: data.data, isLoading: false });
      } else {
        set({ error: data.error || 'Failed to fetch supported types', isLoading: false });
      }
    } catch (error) {
      console.error('Error fetching supported types, falling back to mock data:', error);
      // Fallback to mock data
      const data = await mockApiResponse({ success: true, data: mockSupportedTypes });
      set({ supportedTypes: data.data, isLoading: false });
    }
  },

  setSelectedConnection: (id) => {
    set({ selectedConnection: id });
  },

  clearError: () => {
    set({ error: null });
  },

  clearQueryResults: () => {
    set({ queryResults: null });
  },
}));

export default useDatabaseStore;