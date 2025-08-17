import { create } from 'zustand';
import { ServiceMeshData, ServiceUpdateData } from '@/types/serviceMesh';
import { API_ENDPOINTS, WebSocketEventType, ConnectionStatus } from '@constants';
import { MOCK_ENABLED } from '@mocks';
import { generateServiceMeshData } from '@mocks/services/mesh';
import { getWebSocketInstance } from '@services/websocket';
import { apiService, ApiError } from '@services/api';

interface ServiceMeshStore {
  // State
  data: ServiceMeshData | null;
  isLoading: boolean;
  error: string | null;
  connectionState: ConnectionStatus;
  lastUpdated: string | null;
  
  // WebSocket subscription management
  subscriptionIds: {
    connection: string | null;
    services: string | null;
  };

  // Actions
  fetchServiceMeshData: () => Promise<void>;
  refreshData: () => Promise<void>;
  initializeWebSocket: () => void;
  cleanupWebSocket: () => void;
  updateConnectionState: (state: ConnectionStatus) => void;
  updateServiceData: (serviceUpdate: ServiceUpdateData) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

const useServiceMeshStore = create<ServiceMeshStore>((set, get) => ({
  // Initial state
  data: null,
  isLoading: false,
  error: null,
  connectionState: ConnectionStatus.OFFLINE,
  lastUpdated: null,
  subscriptionIds: {
    connection: null,
    services: null
  },

  // Actions
  fetchServiceMeshData: async () => {
    set({ isLoading: true, error: null });
    
    try {
      if (MOCK_ENABLED) {
        // Use mock data in development
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
        const meshData = generateServiceMeshData();
        set({ 
          data: meshData, 
          isLoading: false,
          lastUpdated: new Date().toISOString()
        });
        return;
      }

      // Load from API
      const response = await apiService.get<ServiceMeshData>(API_ENDPOINTS.SERVICES.MESH);
      set({ 
        data: response.data, 
        isLoading: false,
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      // console.error('Failed to load service mesh data:', error);
      set({ 
        error: error instanceof ApiError ? error.message : 'Failed to load service mesh data',
        isLoading: false 
      });
    }
  },

  refreshData: async () => {
    const { fetchServiceMeshData } = get();
    await fetchServiceMeshData();
  },

  initializeWebSocket: () => {
    const ws = getWebSocketInstance();
    if (!ws) return;

    const { updateConnectionState, updateServiceData } = get();
    
    // Subscribe to connection status
    const connectionSubId = ws.subscribe(WebSocketEventType.CONNECTION, (state) => {
      updateConnectionState(state.state as ConnectionStatus);
    });
    
    // Initial connection state
    updateConnectionState(ws.getConnectionState() as ConnectionStatus);

    // Subscribe to service mesh updates
    const servicesSubId = ws.subscribe(WebSocketEventType.SERVICES, (serviceUpdate) => {
      updateServiceData(serviceUpdate);
    });

    set({ 
      subscriptionIds: { 
        connection: connectionSubId, 
        services: servicesSubId 
      } 
    });
  },

  cleanupWebSocket: () => {
    const ws = getWebSocketInstance();
    const { subscriptionIds } = get();
    
    if (ws && subscriptionIds.connection) {
      ws.unsubscribe(subscriptionIds.connection);
    }
    if (ws && subscriptionIds.services) {
      ws.unsubscribe(subscriptionIds.services);
    }

    set({ 
      subscriptionIds: { 
        connection: null, 
        services: null 
      } 
    });
  },

  updateConnectionState: (state: ConnectionStatus) => {
    set({ connectionState: state });
  },

  updateServiceData: (serviceUpdate: ServiceUpdateData) => {
    set(state => {
      if (!state.data) {
        // If no initial data, load it first
        get().fetchServiceMeshData();
        return state;
      }

      // Update existing service data
      const updatedServices = state.data.services.map(service => {
        if (service.id === serviceUpdate.serviceId) {
          return {
            ...service,
            status: serviceUpdate.status ?? service.status,
            metrics: {
              ...service.metrics,
              requestRate: serviceUpdate.metrics?.requestRate ?? service.metrics.requestRate,
              errorRate: serviceUpdate.metrics?.errorRate ?? service.metrics.errorRate,
              latency: {
                ...service.metrics.latency,
                p95: serviceUpdate.metrics?.latency?.p95 ?? service.metrics.latency.p95
              }
            },
            circuitBreaker: {
              ...service.circuitBreaker,
              status: serviceUpdate.circuitBreakerStatus ?? service.circuitBreaker.status,
              lastTripped: serviceUpdate.lastTripped ?? service.circuitBreaker.lastTripped
            }
          };
        }
        return service;
      });

      // Recalculate overview metrics
      const updatedOverview = {
        ...state.data.metrics.overview,
        totalRequestRate: updatedServices.reduce((sum, s) => sum + s.metrics.requestRate, 0),
        errorRate: updatedServices.reduce((sum, s, _, arr) => sum + s.metrics.errorRate / arr.length, 0),
        avgLatency: updatedServices.reduce((sum, s, _, arr) => sum + s.metrics.latency.p95 / arr.length, 0)
      };

      return {
        ...state,
        data: {
          ...state.data,
          services: updatedServices,
          metrics: {
            ...state.data.metrics,
            overview: updatedOverview
          }
        },
        lastUpdated: new Date().toISOString()
      };
    });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  clearError: () => {
    set({ error: null });
  }
}));

export default useServiceMeshStore;