import { useState, useMemo } from 'react';
import type { FC } from 'react';
import { 
  Network, 
  Globe, 
  Shield, 
  Eye, 
  ExternalLink,
  CheckCircle, 
  AlertTriangle, 
  Clock,
  Server,
  Zap
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ServiceType, CommonNamespace } from '@constants';
import VirtualizedTable, { Column } from '@components/common/VirtualizedTable';

interface Service {
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

const mockServices: Service[] = [
  {
    id: 'web-frontend-svc',
    name: 'web-frontend',
    namespace: CommonNamespace.PRODUCTION,
    type: ServiceType.LOAD_BALANCER,
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
    namespace: CommonNamespace.PRODUCTION,
    type: ServiceType.CLUSTER_IP,
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
  },
  {
    id: 'database-svc',
    name: 'postgres-primary',
    namespace: CommonNamespace.PRODUCTION,
    type: ServiceType.CLUSTER_IP,
    cluster_ip: '10.96.45.78',
    ports: [
      { name: 'postgres', port: 5432, target_port: 5432, protocol: 'TCP' }
    ],
    selector: { app: 'postgres', role: 'primary' },
    endpoints: { ready: 1, not_ready: 0, total: 1 },
    age: '12d',
    labels: { app: 'postgres', tier: 'database', role: 'primary' },
    session_affinity: 'None',
    status: 'active',
    last_updated: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'redis-cache-svc',
    name: 'redis-cache',
    namespace: CommonNamespace.PRODUCTION,
    type: ServiceType.CLUSTER_IP,
    cluster_ip: '10.96.92.156',
    ports: [
      { name: 'redis', port: 6379, target_port: 6379, protocol: 'TCP' }
    ],
    selector: { app: 'redis', role: 'cache' },
    endpoints: { ready: 2, not_ready: 0, total: 2 },
    age: '8d',
    labels: { app: 'redis', tier: 'cache', version: 'v7.0' },
    session_affinity: 'None',
    status: 'active',
    last_updated: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'ingress-controller-svc',
    name: 'ingress-nginx-controller',
    namespace: 'ingress-nginx',
    type: ServiceType.LOAD_BALANCER,
    cluster_ip: '10.96.201.34',
    external_ip: '203.0.113.10',
    ports: [
      { name: 'http', port: 80, target_port: 'http', protocol: 'TCP', node_port: 32080 },
      { name: 'https', port: 443, target_port: 'https', protocol: 'TCP', node_port: 32443 }
    ],
    selector: { 'app.kubernetes.io/name': 'ingress-nginx' },
    endpoints: { ready: 2, not_ready: 0, total: 2 },
    age: '15d',
    labels: { 'app.kubernetes.io/name': 'ingress-nginx', 'app.kubernetes.io/component': 'controller' },
    session_affinity: 'None',
    status: 'active',
    last_updated: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'monitoring-grafana-svc',
    name: 'grafana',
    namespace: CommonNamespace.MONITORING,
    type: ServiceType.NODE_PORT,
    cluster_ip: '10.96.150.89',
    ports: [
      { name: 'grafana', port: 3000, target_port: 3000, protocol: 'TCP', node_port: 30300 }
    ],
    selector: { app: 'grafana' },
    endpoints: { ready: 1, not_ready: 0, total: 1 },
    age: '30d',
    labels: { app: 'grafana', component: 'monitoring' },
    session_affinity: 'None',
    status: 'active',
    last_updated: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'worker-service-headless',
    name: 'worker-headless',
    namespace: CommonNamespace.PRODUCTION,
    type: ServiceType.CLUSTER_IP,
    cluster_ip: 'None',
    ports: [
      { name: 'worker', port: 8080, target_port: 8080, protocol: 'TCP' }
    ],
    selector: { app: 'worker-service' },
    endpoints: { ready: 0, not_ready: 2, total: 2 },
    age: '3d',
    labels: { app: 'worker-service', type: 'headless' },
    session_affinity: 'None',
    status: 'pending',
    last_updated: new Date(Date.now() - 30 * 60 * 1000).toISOString()
  }
];

const ServicesList: FC = () => {
  const [selectedNamespace, setSelectedNamespace] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'namespace' | 'type' | 'age' | 'endpoints'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  const filteredServices = useMemo(() => {
    let services = [...mockServices];

    if (selectedNamespace !== 'all') {
      services = services.filter(svc => svc.namespace === selectedNamespace);
    }

    if (selectedType !== 'all') {
      services = services.filter(svc => svc.type === selectedType);
    }

    services.sort((a, b) => {
      let valueA: any, valueB: any;
      
      switch (sortBy) {
        case 'namespace':
          valueA = a.namespace;
          valueB = b.namespace;
          break;
        case 'type':
          valueA = a.type;
          valueB = b.type;
          break;
        case 'age':
          valueA = new Date(a.last_updated).getTime();
          valueB = new Date(b.last_updated).getTime();
          break;
        case 'endpoints':
          valueA = a.endpoints.ready;
          valueB = b.endpoints.ready;
          break;
        default:
          valueA = a.name;
          valueB = b.name;
      }

      if (sortBy === 'age') {
        return sortOrder === 'asc' ? valueA - valueB : valueB - valueA;
      }
      
      const comparison = valueA.toString().localeCompare(valueB.toString());
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return services;
  }, [selectedNamespace, selectedType, sortBy, sortOrder]);

  const namespaces = useMemo(() => {
    const ns = Array.from(new Set(mockServices.map(s => s.namespace)));
    return ns.sort();
  }, []);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'LoadBalancer':
        return <Globe size={16} className="text-blue-400" />;
      case 'NodePort':
        return <Server size={16} className="text-green-400" />;
      case 'ClusterIP':
        return <Network size={16} className="text-yellow-400" />;
      case 'ExternalName':
        return <ExternalLink size={16} className="text-purple-400" />;
      default:
        return <Network size={16} className="text-gray-400" />;
    }
  };

  const getStatusIcon = (status: string, endpoints: Service['endpoints']) => {
    if (status === 'failed') {
      return <AlertTriangle size={16} className="text-red-400" />;
    }
    if (status === 'pending' || endpoints.not_ready > 0) {
      return <Clock size={16} className="text-yellow-400" />;
    }
    return <CheckCircle size={16} className="text-green-400" />;
  };

  const getStatusColor = (status: string, endpoints: Service['endpoints']) => {
    if (status === 'failed') {
      return 'text-red-400 border-red-400';
    }
    if (status === 'pending' || endpoints.not_ready > 0) {
      return 'text-yellow-400 border-yellow-400';
    }
    return 'text-green-400 border-green-400';
  };

  const getEndpointsStatus = (endpoints: Service['endpoints']) => {
    if (endpoints.ready === endpoints.total && endpoints.total > 0) {
      return 'text-green-400';
    } else if (endpoints.ready > 0) {
      return 'text-yellow-400';
    } else {
      return 'text-red-400';
    }
  };

  const handleSort = (key: string, order: 'asc' | 'desc') => {
    setSortBy(key as any);
    setSortOrder(order);
  };

  const serviceColumns: Column<Service>[] = [
    {
      key: 'status',
      title: 'STATUS',
      width: 120,
      render: (service: Service) => (
        <div className="flex items-center space-x-2">
          {getStatusIcon(service.status, service.endpoints)}
          <span className={`text-xs px-2 py-1 border font-mono ${getStatusColor(service.status, service.endpoints)}`}>
            {service.status.toUpperCase()}
          </span>
        </div>
      ),
    },
    {
      key: 'name',
      title: 'NAME',
      minWidth: 200,
      sortable: true,
      render: (service: Service) => (
        <div>
          <div className="font-mono text-sm font-bold">{service.name}</div>
          <div className="text-xs opacity-60">{service.namespace}</div>
        </div>
      ),
    },
    {
      key: 'type',
      title: 'TYPE',
      width: 140,
      sortable: true,
      render: (service: Service) => (
        <div className="flex items-center space-x-2">
          {getTypeIcon(service.type)}
          <span className="font-mono text-xs">{service.type}</span>
        </div>
      ),
    },
    {
      key: 'cluster_ip',
      title: 'CLUSTER IP',
      width: 120,
      render: (service: Service) => (
        <span className="font-mono text-xs">{service.cluster_ip}</span>
      ),
    },
    {
      key: 'external_ip',
      title: 'EXTERNAL IP',
      width: 120,
      render: (service: Service) => (
        <span className={`font-mono text-xs ${service.external_ip ? 'text-blue-400' : 'opacity-40'}`}>
          {service.external_ip || 'None'}
        </span>
      ),
    },
    {
      key: 'ports',
      title: 'PORTS',
      minWidth: 150,
      render: (service: Service) => (
        <div className="text-xs font-mono">
          {service.ports.slice(0, 2).map((port, idx) => (
            <div key={idx}>
              {port.port}:{port.target_port}/{port.protocol}
            </div>
          ))}
          {service.ports.length > 2 && (
            <div className="opacity-60">+{service.ports.length - 2} more</div>
          )}
        </div>
      ),
    },
    {
      key: 'endpoints',
      title: 'ENDPOINTS',
      width: 100,
      sortable: true,
      render: (service: Service) => (
        <div className={`font-mono text-sm ${getEndpointsStatus(service.endpoints)}`}>
          {service.endpoints.ready}/{service.endpoints.total}
          {service.endpoints.not_ready > 0 && (
            <div className="text-xs opacity-60">
              {service.endpoints.not_ready} not ready
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'age',
      title: 'AGE',
      width: 80,
      sortable: true,
      render: (service: Service) => (
        <span className="font-mono text-xs">{service.age}</span>
      ),
    },
    {
      key: 'actions',
      title: 'ACTIONS',
      width: 100,
      render: (service: Service) => (
        <div className="flex items-center space-x-2">
          <button className="p-1 border border-white hover:bg-white hover:text-black transition-colors">
            <Eye size={12} />
          </button>
          {service.external_ip && (
            <button className="p-1 border border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-black transition-colors">
              <ExternalLink size={12} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-mono">KUBERNETES SERVICES</h2>
        <div className="flex items-center space-x-4">
          <div className="text-sm font-mono opacity-60">
            {filteredServices.length} SERVICE{filteredServices.length !== 1 ? 'S' : ''}
          </div>
          {/* View Mode Toggle */}
          <div className="flex border border-white">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1 font-mono text-xs transition-colors ${
                viewMode === 'cards' ? 'bg-white text-black' : 'text-white hover:bg-white hover:text-black'
              }`}
            >
              CARDS
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 border-l border-white font-mono text-xs transition-colors ${
                viewMode === 'table' ? 'bg-white text-black' : 'text-white hover:bg-white hover:text-black'
              }`}
            >
              TABLE
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4 pb-4 border-b border-white/10">
        <div className="flex items-center space-x-2">
          <label className="text-sm font-mono opacity-60">NAMESPACE:</label>
          <select
            value={selectedNamespace}
            onChange={(e) => setSelectedNamespace(e.target.value)}
            className="bg-black border border-white text-white text-sm font-mono px-2 py-1 focus:outline-none focus:border-green-400"
          >
            <option value="all">ALL</option>
            {namespaces.map(ns => (
              <option key={ns} value={ns}>{ns.toUpperCase()}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <label className="text-sm font-mono opacity-60">TYPE:</label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-black border border-white text-white text-sm font-mono px-2 py-1 focus:outline-none focus:border-green-400"
          >
            <option value="all">ALL</option>
            <option value="ClusterIP">CLUSTER IP</option>
            <option value="NodePort">NODE PORT</option>
            <option value="LoadBalancer">LOAD BALANCER</option>
            <option value="ExternalName">EXTERNAL NAME</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <label className="text-sm font-mono opacity-60">SORT:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-black border border-white text-white text-sm font-mono px-2 py-1 focus:outline-none focus:border-green-400"
          >
            <option value="name">NAME</option>
            <option value="namespace">NAMESPACE</option>
            <option value="type">TYPE</option>
            <option value="age">AGE</option>
            <option value="endpoints">ENDPOINTS</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="px-3 py-1 border border-white font-mono hover:bg-white hover:text-black transition-colors"
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>

      {/* Services Content */}
      {viewMode === 'table' ? (
        <VirtualizedTable
          data={filteredServices}
          columns={serviceColumns}
          containerHeight={600}
          rowHeight={56}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          className="w-full"
          emptyMessage="NO SERVICES FOUND"
        />
      ) : (
        /* Card View */
        <div className="space-y-4">
          {filteredServices.map((service) => (
          <div key={service.id} className="border border-white bg-black">
            {/* Header */}
            <div className="p-4 border-b border-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Network size={20} />
                  <div>
                    <h3 className="font-mono text-lg">{service.name}</h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-sm font-mono opacity-60">{service.namespace}</span>
                      <div className={`inline-flex items-center space-x-1 px-2 py-1 border ${getStatusColor(service.status, service.endpoints)} font-mono text-xs`}>
                        {getStatusIcon(service.status, service.endpoints)}
                        <span>{service.status.toUpperCase()}</span>
                      </div>
                      <div className="inline-flex items-center space-x-1 px-2 py-1 border border-white font-mono text-xs">
                        {getTypeIcon(service.type)}
                        <span>{service.type.toUpperCase()}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button className="p-2 border border-white hover:bg-white hover:text-black transition-colors">
                    <Eye size={16} />
                  </button>
                  {service.external_ip && (
                    <button className="p-2 border border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-black transition-colors">
                      <ExternalLink size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
              {/* IPs & Ports */}
              <div className="p-4 border-b md:border-b-0 md:border-r border-white">
                <div className="space-y-3">
                  <div>
                    <div className="text-xs font-mono opacity-60 mb-1">CLUSTER IP</div>
                    <div className="font-mono text-sm">{service.cluster_ip}</div>
                  </div>
                  
                  {service.external_ip && (
                    <div>
                      <div className="text-xs font-mono opacity-60 mb-1">EXTERNAL IP</div>
                      <div className="font-mono text-sm text-blue-400">{service.external_ip}</div>
                    </div>
                  )}

                  <div>
                    <div className="text-xs font-mono opacity-60 mb-1">PORTS</div>
                    <div className="space-y-1">
                      {service.ports.map((port, idx) => (
                        <div key={idx} className="font-mono text-xs">
                          {port.name && <span className="text-green-400">{port.name}:</span>} 
                          {port.port}:{port.target_port}/{port.protocol}
                          {port.node_port && <span className="opacity-60"> (NodePort: {port.node_port})</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Endpoints & Selector */}
              <div className="p-4 border-b md:border-b-0 md:border-r border-white">
                <div className="space-y-3">
                  <div>
                    <div className="text-xs font-mono opacity-60 mb-1">ENDPOINTS</div>
                    <div className={`font-mono text-lg ${getEndpointsStatus(service.endpoints)}`}>
                      {service.endpoints.ready}/{service.endpoints.total}
                    </div>
                    <div className="text-xs font-mono opacity-60">
                      {service.endpoints.not_ready > 0 && `${service.endpoints.not_ready} not ready`}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-mono opacity-60 mb-1">SELECTOR</div>
                    <div className="space-y-1">
                      {Object.entries(service.selector).map(([key, value]) => (
                        <div key={key} className="font-mono text-xs">
                          <span className="opacity-60">{key}:</span> {value}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-mono opacity-60 mb-1">SESSION AFFINITY</div>
                    <div className="font-mono text-xs">{service.session_affinity}</div>
                  </div>
                </div>
              </div>

              {/* Labels & Metadata */}
              <div className="p-4">
                <div className="space-y-3">
                  <div>
                    <div className="text-xs font-mono opacity-60 mb-1">LABELS</div>
                    <div className="space-y-1">
                      {Object.entries(service.labels).slice(0, 3).map(([key, value]) => (
                        <div key={key} className="font-mono text-xs">
                          <span className="opacity-60">{key}:</span> {value}
                        </div>
                      ))}
                      {Object.entries(service.labels).length > 3 && (
                        <div className="font-mono text-xs opacity-60">
                          +{Object.entries(service.labels).length - 3} more
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-mono opacity-60 mb-1">AGE</div>
                    <div className="font-mono text-xs">{service.age}</div>
                  </div>

                  <div>
                    <div className="text-xs font-mono opacity-60 mb-1">LAST UPDATED</div>
                    <div className="font-mono text-xs">
                      {formatDistanceToNow(new Date(service.last_updated), { addSuffix: true })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          ))}
          
          {filteredServices.length === 0 && (
            <div className="text-center py-12">
              <Network size={48} className="mx-auto mb-4 opacity-40" />
              <h3 className="text-lg font-mono mb-2">NO SERVICES FOUND</h3>
              <p className="font-mono text-sm opacity-60">
                No services match the selected filters.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ServicesList;