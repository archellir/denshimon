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
import { API_ENDPOINTS } from '@/constants';
import { 
  mockDatabaseConnections,
  mockSupportedTypes,
  mockDatabases,
  mockTables,
  mockColumns,
  mockQueryResults,
  mockDatabaseStats,
  mockApiResponse,
  MOCK_ENABLED
} from '@/mocks';
import { apiService, ApiError } from '@/services/api';

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

      const response = await apiService.get<DatabaseConfig[]>(API_ENDPOINTS.DATABASES.CONNECTIONS);
      set({ connections: response.data, isLoading: false });
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
      const response = await apiService.post<DatabaseConfig>(API_ENDPOINTS.DATABASES.CONNECTIONS, config);
      const { connections } = get();
      set({ 
        connections: [...connections, response.data],
        isLoading: false 
      });
    } catch (error) {
      const errorMessage = error instanceof ApiError ? error.message : 'Failed to create connection';
      set({ error: errorMessage, isLoading: false });
    }
  },

  updateConnection: async (id, config) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiService.put<DatabaseConfig>(API_ENDPOINTS.DATABASES.CONNECTION(id), config);
      const { connections } = get();
      set({ 
        connections: connections.map(conn => 
          conn.id === id ? response.data : conn
        ),
        isLoading: false 
      });
    } catch (error) {
      const errorMessage = error instanceof ApiError ? error.message : 'Failed to update connection';
      set({ error: errorMessage, isLoading: false });
    }
  },

  deleteConnection: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await apiService.delete(API_ENDPOINTS.DATABASES.CONNECTION(id));
      const { connections, selectedConnection } = get();
      set({ 
        connections: connections.filter(conn => conn.id !== id),
        selectedConnection: selectedConnection === id ? null : selectedConnection,
        isLoading: false 
      });
    } catch (error) {
      const errorMessage = error instanceof ApiError ? error.message : 'Failed to delete connection';
      set({ error: errorMessage, isLoading: false });
    }
  },

  connectDatabase: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await apiService.post(API_ENDPOINTS.DATABASES.CONNECTION_CONNECT(id));
      const { connections } = get();
      set({ 
        connections: connections.map(conn => 
          conn.id === id ? { ...conn, status: DatabaseStatus.CONNECTED } : conn
        ),
        isLoading: false 
      });
    } catch (error) {
      const errorMessage = error instanceof ApiError ? error.message : 'Failed to connect to database';
      set({ error: errorMessage, isLoading: false });
    }
  },

  disconnectDatabase: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await apiService.post(API_ENDPOINTS.DATABASES.CONNECTION_DISCONNECT(id));
      const { connections } = get();
      set({ 
        connections: connections.map(conn => 
          conn.id === id ? { ...conn, status: DatabaseStatus.DISCONNECTED } : conn
        ),
        isLoading: false 
      });
    } catch (error) {
      const errorMessage = error instanceof ApiError ? error.message : 'Failed to disconnect from database';
      set({ error: errorMessage, isLoading: false });
    }
  },

  testConnection: async (config) => {
    set({ isLoading: true, error: null, testResult: null });
    try {
      const response = await apiService.post<TestConnectionResult>(API_ENDPOINTS.DATABASES.CONNECTION_TEST, config, false);
      set({ testResult: response.data, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof ApiError ? error.message : 'Failed to test connection';
      set({ error: errorMessage, isLoading: false });
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

      const response = await apiService.get<DatabaseInfo[]>(API_ENDPOINTS.DATABASES.DATABASES(connectionId), false);
      set({ databases: response.data, isLoading: false });
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

      const response = await apiService.get<TableInfo[]>(API_ENDPOINTS.DATABASES.TABLES(connectionId, database), false);
      set({ tables: response.data, isLoading: false });
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

      const response = await apiService.get<ColumnInfo[]>(API_ENDPOINTS.DATABASES.COLUMNS(connectionId, database, table), false);
      set({ columns: response.data, isLoading: false });
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

      const response = await apiService.post<QueryResult>(API_ENDPOINTS.DATABASES.QUERY(connectionId), { sql, limit, offset }, false);
      set({ queryResults: response.data, isLoading: false });
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

      const response = await apiService.get<DatabaseStats>(API_ENDPOINTS.DATABASES.STATS(connectionId), false);
      set({ stats: response.data, isLoading: false });
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

      const response = await apiService.get<DatabaseType[]>(API_ENDPOINTS.DATABASES.TYPES, false);
      set({ supportedTypes: response.data, isLoading: false });
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