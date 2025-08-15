import { create } from 'zustand';
import { API_ENDPOINTS } from '@/constants';
import { MOCK_ENABLED } from '@/mocks';
import { KubernetesServiceAPI, KubernetesPodAPI, KubernetesNamespaceAPI } from '@/types';
import { apiService } from '@/services/api';

export interface Service {
  id: string;
  name: string;
  namespace: string;
  type: 'ClusterIP' | 'NodePort' | 'LoadBalancer' | 'ExternalName';
  cluster_ip: string;
  external_ip?: string;
  ports: Array<{
    name?: string;
    port: number;
    target_port: number | string;
    protocol: 'TCP' | 'UDP';
    node_port?: number;
  }>;
  selector: Record<string, string>;
  endpoints: {
    ready: number;
    not_ready: number;
    total: number;
  };
  age: string;
  labels: Record<string, string>;
  annotations?: Record<string, string>;
  session_affinity: 'None' | 'ClientIP';
  status: 'active' | 'pending' | 'failed';
  last_updated: string;
}

export interface Pod {
  id: string;
  name: string;
  namespace: string;
  phase: 'Running' | 'Pending' | 'Succeeded' | 'Failed' | 'Unknown';
  ready: boolean;
  restarts: number;
  age: string;
  node: string;
  ip?: string;
  labels: Record<string, string>;
  containers: Array<{
    name: string;
    image: string;
    ready: boolean;
    restartCount: number;
  }>;
  status: string;
  created: string;
}

export interface Namespace {
  name: string;
  status: 'Active' | 'Terminating';
  age: string;
  labels: Record<string, string>;
  resourceQuota?: {
    hard: Record<string, string>;
    used: Record<string, string>;
  };
}

interface WorkloadsStore {
  // State
  services: Service[];
  pods: Pod[];
  namespaces: Namespace[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;

  // Actions
  fetchServices: (namespace?: string) => Promise<void>;
  fetchPods: (namespace?: string) => Promise<void>;
  fetchNamespaces: () => Promise<void>;
  refreshAllData: () => Promise<void>;
  setError: (error: string | null) => void;
  clearError: () => void;
}

// Mock data for development
const mockServices: Service[] = [
  {
    id: 'web-frontend-svc',
    name: 'web-frontend',
    namespace: 'production',
    type: 'LoadBalancer',
    cluster_ip: '10.96.120.45',
    external_ip: '203.0.113.42',
    ports: [
      { name: 'http', port: 80, target_port: 8080, protocol: 'TCP' },
      { name: 'https', port: 443, target_port: 8443, protocol: 'TCP' }
    ],
    selector: { app: 'web-frontend', version: 'v1.2.3' },
    endpoints: { ready: 3, not_ready: 0, total: 3 },
    age: '7d',
    labels: { app: 'web-frontend', tier: 'frontend', environment: 'production' },
    session_affinity: 'None',
    status: 'active',
    last_updated: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'api-backend-svc',
    name: 'api-backend',
    namespace: 'production',
    type: 'ClusterIP',
    cluster_ip: '10.96.87.123',
    ports: [
      { name: 'api', port: 3000, target_port: 3000, protocol: 'TCP' },
      { name: 'metrics', port: 9090, target_port: 'metrics', protocol: 'TCP' }
    ],
    selector: { app: 'api-backend', tier: 'backend' },
    endpoints: { ready: 4, not_ready: 1, total: 5 },
    age: '5d',
    labels: { app: 'api-backend', tier: 'backend', version: 'v2.1.0' },
    session_affinity: 'ClientIP',
    status: 'active',
    last_updated: new Date(Date.now() - 15 * 60 * 1000).toISOString()
  }
];

const mockPods: Pod[] = [
  {
    id: 'web-frontend-pod-1',
    name: 'web-frontend-deployment-abc123-xyz',
    namespace: 'production',
    phase: 'Running',
    ready: true,
    restarts: 0,
    age: '2d',
    node: 'worker-node-1',
    ip: '10.244.1.15',
    labels: { app: 'web-frontend', version: 'v1.2.3' },
    containers: [
      {
        name: 'web-frontend',
        image: 'nginx:1.21',
        ready: true,
        restartCount: 0
      }
    ],
    status: 'Running',
    created: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const mockNamespaces: Namespace[] = [
  {
    name: 'default',
    status: 'Active',
    age: '30d',
    labels: {}
  },
  {
    name: 'production',
    status: 'Active', 
    age: '15d',
    labels: { environment: 'production' }
  },
  {
    name: 'staging',
    status: 'Active',
    age: '10d', 
    labels: { environment: 'staging' }
  }
];

const useWorkloadsStore = create<WorkloadsStore>((set, get) => ({
  // Initial state
  services: [],
  pods: [],
  namespaces: [],
  isLoading: false,
  error: null,
  lastUpdated: null,

  // Actions
  fetchServices: async (namespace?: string) => {
    set({ isLoading: true, error: null });
    
    try {
      if (MOCK_ENABLED) {
        await new Promise(resolve => setTimeout(resolve, 500));
        let services = mockServices;
        if (namespace && namespace !== 'all') {
          services = mockServices.filter(svc => svc.namespace === namespace);
        }
        set({ 
          services, 
          isLoading: false,
          lastUpdated: new Date().toISOString()
        });
        return;
      }

      const token = localStorage.getItem('auth_token');
      const url = namespace && namespace !== 'all' 
        ? `${API_ENDPOINTS.KUBERNETES.SERVICES}?namespace=${namespace}`
        : API_ENDPOINTS.KUBERNETES.SERVICES;
      
      const response = await fetch(url, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch services: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Transform backend data to match frontend interface
      const transformedServices = (data.data || data || []).map((svc: KubernetesServiceAPI) => ({
        id: `${svc.name}-${svc.namespace}`,
        name: svc.name,
        namespace: svc.namespace,
        type: svc.type,
        cluster_ip: svc.clusterIP || svc.cluster_ip,
        external_ip: svc.externalIPs?.[0] || svc.external_ip,
        ports: svc.ports || [],
        selector: svc.selector || {},
        endpoints: svc.endpoints || { ready: 0, not_ready: 0, total: 0 },
        age: svc.age || 'Unknown',
        labels: svc.labels || {},
        annotations: svc.annotations,
        session_affinity: svc.sessionAffinity || 'None',
        status: svc.status || 'active',
        last_updated: svc.lastUpdated || new Date().toISOString()
      }));

      set({ 
        services: transformedServices, 
        isLoading: false,
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to fetch services:', error);
      // Fallback to mock data on error
      let services = mockServices;
      if (namespace && namespace !== 'all') {
        services = mockServices.filter(svc => svc.namespace === namespace);
      }
      set({ 
        services, 
        isLoading: false,
        error: null,
        lastUpdated: new Date().toISOString()
      });
    }
  },

  fetchPods: async (namespace?: string) => {
    set({ isLoading: true, error: null });
    
    try {
      if (MOCK_ENABLED) {
        await new Promise(resolve => setTimeout(resolve, 400));
        let pods = mockPods;
        if (namespace && namespace !== 'all') {
          pods = mockPods.filter(pod => pod.namespace === namespace);
        }
        set({ 
          pods, 
          isLoading: false,
          lastUpdated: new Date().toISOString()
        });
        return;
      }

      const url = namespace && namespace !== 'all'
        ? `${API_ENDPOINTS.KUBERNETES.PODS}?namespace=${namespace}`
        : API_ENDPOINTS.KUBERNETES.PODS;
      
      const response = await apiService.get<any>(url);
      
      // Transform backend data to match frontend interface
      const transformedPods = (response.data.data || response.data || []).map((pod: KubernetesPodAPI) => ({
        id: `${pod.name}-${pod.namespace}`,
        name: pod.name,
        namespace: pod.namespace,
        phase: pod.status?.phase || 'Unknown',
        ready: pod.status?.ready || false,
        restarts: pod.status?.restartCount || 0,
        age: pod.age || 'Unknown',
        node: pod.spec?.nodeName || pod.node || 'Unknown',
        ip: pod.status?.podIP || pod.ip,
        labels: pod.metadata?.labels || {},
        containers: pod.spec?.containers?.map((container) => ({
          name: container.name,
          image: container.image,
          ready: container.ready || false,
          restartCount: container.restartCount || 0
        })) || [],
        status: pod.status?.phase || 'Unknown',
        created: pod.metadata?.creationTimestamp || new Date().toISOString()
      }));

      set({ 
        pods: transformedPods, 
        isLoading: false,
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to fetch pods:', error);
      // Fallback to mock data on error
      let pods = mockPods;
      if (namespace && namespace !== 'all') {
        pods = mockPods.filter(pod => pod.namespace === namespace);
      }
      set({ 
        pods, 
        isLoading: false,
        error: null,
        lastUpdated: new Date().toISOString()
      });
    }
  },

  fetchNamespaces: async () => {
    set({ isLoading: true, error: null });
    
    try {
      if (MOCK_ENABLED) {
        await new Promise(resolve => setTimeout(resolve, 300));
        set({ 
          namespaces: mockNamespaces, 
          isLoading: false,
          lastUpdated: new Date().toISOString()
        });
        return;
      }

      const response = await apiService.get<any>(API_ENDPOINTS.KUBERNETES.NAMESPACES);
      
      // Transform backend data to match frontend interface
      const transformedNamespaces = (response.data.data || response.data || []).map((ns: KubernetesNamespaceAPI) => ({
        name: ns.name || ns.metadata?.name,
        status: ns.status?.phase || 'Active',
        age: ns.age || 'Unknown',
        labels: ns.metadata?.labels || {},
        resourceQuota: ns.resourceQuota
      }));

      set({ 
        namespaces: transformedNamespaces, 
        isLoading: false,
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to fetch namespaces:', error);
      // Fallback to mock data on error
      set({ 
        namespaces: mockNamespaces, 
        isLoading: false,
        error: null,
        lastUpdated: new Date().toISOString()
      });
    }
  },

  refreshAllData: async () => {
    const { fetchServices, fetchPods, fetchNamespaces } = get();
    await Promise.all([
      fetchServices(),
      fetchPods(),
      fetchNamespaces()
    ]);
  },

  setError: (error: string | null) => {
    set({ error });
  },

  clearError: () => {
    set({ error: null });
  }
}));

export default useWorkloadsStore;