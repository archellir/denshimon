import { useMemo, useEffect } from 'react';
import type { FC } from 'react';
import { 
  Network, 
  Globe, 
  Eye, 
  ExternalLink,
  CheckCircle, 
  AlertTriangle, 
  Clock,
  Server
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import VirtualizedTable, { Column } from '@components/common/VirtualizedTable';
import SkeletonLoader from '@components/common/SkeletonLoader';
import useWorkloadsStore, { Service } from '@/stores/workloadsStore';


interface ServicesListProps {
  selectedNamespace: string;
  selectedType: string;
  viewMode: 'cards' | 'table';
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

const ServicesList: FC<ServicesListProps> = ({ 
  selectedNamespace, 
  selectedType, 
  viewMode, 
  sortBy, 
  sortOrder 
}) => {
  const { services, isLoading, error, fetchServices } = useWorkloadsStore();

  useEffect(() => {
    fetchServices(selectedNamespace);
  }, [selectedNamespace, fetchServices]);

  const filteredServices = useMemo(() => {
    let servicesList = [...services];

    if (selectedNamespace !== 'all') {
      servicesList = servicesList.filter(svc => svc.namespace === selectedNamespace);
    }

    if (selectedType !== 'all') {
      servicesList = servicesList.filter(svc => svc.type === selectedType);
    }

    servicesList.sort((a, b) => {
      let valueA: string | number, valueB: string | number;
      
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

    return servicesList;
  }, [services, selectedNamespace, selectedType, sortBy, sortOrder]);


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

  const _handleSort = (_key: string, _order: 'asc' | 'desc') => {
    // Handled by Dashboard now
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
          <button 
            onClick={() => {
              // View service details
              console.log('Viewing service details for:', service.name);
              alert(`Service Details:\n\nName: ${service.name}\nNamespace: ${service.namespace}\nType: ${service.type}\nEndpoints: ${service.endpoints.ready}/${service.endpoints.total}`);
            }}
            className="p-1 border border-white hover:bg-white hover:text-black transition-colors"
            title="View Service Details"
          >
            <Eye size={12} />
          </button>
          {service.external_ip && (
            <button 
              onClick={() => {
                // Open external service
                const url = `http://${service.external_ip}:${service.ports[0]?.port || 80}`;
                window.open(url, '_blank');
              }}
              className="p-1 border border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-black transition-colors"
              title="Open External Service"
            >
              <ExternalLink size={12} />
            </button>
          )}
        </div>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <SkeletonLoader variant="table" count={8} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <AlertTriangle size={48} className="mx-auto mb-4 text-red-400" />
          <h3 className="text-lg font-mono mb-2">ERROR LOADING SERVICES</h3>
          <p className="font-mono text-sm opacity-60">{error}</p>
          <button 
            onClick={() => fetchServices(selectedNamespace)}
            className="mt-4 px-4 py-2 border border-white hover:bg-white hover:text-black transition-colors font-mono text-sm"
          >
            RETRY
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Services Content */}
      {viewMode === 'table' ? (
        <VirtualizedTable
          data={filteredServices}
          columns={serviceColumns}
          containerHeight={600}
          rowHeight={56}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={_handleSort}
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
                  <button 
                    onClick={() => {
                      // View service details
                      console.log('Viewing service details for:', service.name);
                      alert(`Service Details:\n\nName: ${service.name}\nNamespace: ${service.namespace}\nType: ${service.type}\nEndpoints: ${service.endpoints.ready}/${service.endpoints.total}`);
                    }}
                    className="p-2 border border-white hover:bg-white hover:text-black transition-colors"
                    title="View Service Details"
                  >
                    <Eye size={16} />
                  </button>
                  {service.external_ip && (
                    <button 
                      onClick={() => {
                        // Open external service
                        const url = `http://${service.external_ip}:${service.ports[0]?.port || 80}`;
                        window.open(url, '_blank');
                      }}
                      className="p-2 border border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-black transition-colors"
                      title="Open External Service"
                    >
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