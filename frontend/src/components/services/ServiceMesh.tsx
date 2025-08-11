import React, { useState, useEffect, useMemo } from 'react';
import { Network, Zap, AlertCircle, AlertTriangle, Shield, Lock, Unlock, Activity, TrendingUp, TrendingDown, Minus, Globe, Database, Server, Layers } from 'lucide-react';
import { ServiceMeshData, ServiceNode, ServiceConnection, APIEndpoint } from '@/types/serviceMesh';
import { generateServiceMeshData } from '@/mocks/services/mesh';

const ServiceMesh: React.FC = () => {
  const [data, setData] = useState<ServiceMeshData | null>(null);
  const [selectedView, setSelectedView] = useState<'topology' | 'services' | 'endpoints' | 'flows'>('topology');
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'frontend' | 'backend' | 'database' | 'cache' | 'gateway'>('all');

  useEffect(() => {
    const meshData = generateServiceMeshData();
    setData(meshData);
  }, []);

  const filteredServices = useMemo(() => {
    if (!data) return [];
    return filterType === 'all' 
      ? data.services 
      : data.services.filter(s => s.type === filterType);
  }, [data, filterType]);

  const serviceConnections = useMemo(() => {
    if (!data || !selectedService) return [];
    return data.connections.filter(c => c.source === selectedService || c.target === selectedService);
  }, [data, selectedService]);

  const serviceEndpoints = useMemo(() => {
    if (!data || !selectedService) return [];
    return data.endpoints.filter(e => e.serviceId === selectedService);
  }, [data, selectedService]);

  const getServiceIcon = (type: string) => {
    switch (type) {
      case 'frontend': return <Globe className="w-4 h-4" />;
      case 'backend': return <Server className="w-4 h-4" />;
      case 'database': return <Database className="w-4 h-4" />;
      case 'cache': return <Layers className="w-4 h-4" />;
      case 'gateway': return <Network className="w-4 h-4" />;
      case 'sidecar': return <Shield className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-500 border-green-500';
      case 'warning': return 'text-yellow-500 border-yellow-500';
      case 'error': return 'text-red-500 border-red-500';
      case 'unknown': return 'text-gray-500 border-gray-500';
      default: return 'text-white border-white';
    }
  };

  const getCircuitBreakerIcon = (status: string) => {
    switch (status) {
      case 'open': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'half-open': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'closed': return <Activity className="w-4 h-4 text-green-500" />;
    }
  };

  const getSecurityIcon = (encrypted: boolean, mTLS: boolean) => {
    if (!encrypted) return <Unlock className="w-4 h-4 text-red-500" />;
    if (mTLS) return <Shield className="w-4 h-4 text-green-500" />;
    return <Lock className="w-4 h-4 text-yellow-500" />;
  };

  const getTrendIcon = (trend: 'increasing' | 'decreasing' | 'stable') => {
    switch (trend) {
      case 'increasing': return <TrendingUp className="w-4 h-4 text-red-500" />;
      case 'decreasing': return <TrendingDown className="w-4 h-4 text-green-500" />;
      case 'stable': return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const getProtocolColor = (protocol: string) => {
    switch (protocol) {
      case 'HTTP': return 'text-blue-500';
      case 'gRPC': return 'text-green-500';
      case 'TCP': return 'text-yellow-500';
      case 'UDP': return 'text-purple-500';
      default: return 'text-gray-500';
    }
  };

  if (!data) {
    return <div className="flex items-center justify-center h-64">
      <div className="text-gray-500">Loading service mesh...</div>
    </div>;
  }

  const selectedServiceData = selectedService ? data.services.find(s => s.id === selectedService) : null;

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-6 gap-4">
        <div className="bg-black border border-white p-4">
          <div className="text-xs text-gray-500 uppercase mb-1">Services</div>
          <div className="text-2xl font-mono">{data.metrics.overview.totalServices}</div>
        </div>
        <div className="bg-black border border-white p-4">
          <div className="text-xs text-gray-500 uppercase mb-1">RPS</div>
          <div className="text-2xl font-mono">{data.metrics.overview.totalRequestRate.toFixed(0)}</div>
        </div>
        <div className="bg-black border border-white p-4">
          <div className="text-xs text-gray-500 uppercase mb-1">Avg Latency</div>
          <div className="text-2xl font-mono">{data.metrics.overview.avgLatency.toFixed(0)}ms</div>
        </div>
        <div className="bg-black border border-white p-4">
          <div className="text-xs text-gray-500 uppercase mb-1">Error Rate</div>
          <div className="text-2xl font-mono text-red-500">{data.metrics.overview.errorRate.toFixed(1)}%</div>
        </div>
        <div className="bg-black border border-white p-4">
          <div className="text-xs text-gray-500 uppercase mb-1">mTLS Coverage</div>
          <div className="text-2xl font-mono text-green-500">{data.metrics.overview.mTLSCoverage.toFixed(0)}%</div>
        </div>
        <div className="bg-black border border-white p-4">
          <div className="text-xs text-gray-500 uppercase mb-1">Connections</div>
          <div className="text-2xl font-mono">{data.metrics.overview.totalConnections}</div>
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex gap-2 border-b border-white pb-2">
        {[
          { id: 'topology', label: 'Topology', icon: Network },
          { id: 'services', label: 'Services', icon: Server },
          { id: 'endpoints', label: 'Endpoints', icon: Globe },
          { id: 'flows', label: 'Traffic Flows', icon: Activity },
        ].map(view => (
          <button
            key={view.id}
            onClick={() => setSelectedView(view.id as any)}
            className={`px-4 py-2 font-mono text-sm transition-colors flex items-center gap-2 ${
              selectedView === view.id ? 'bg-white text-black' : 'text-white hover:bg-white/10'
            }`}
          >
            <view.icon className="w-4 h-4" />
            {view.label}
          </button>
        ))}
      </div>

      {/* Topology View */}
      {selectedView === 'topology' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Service Map */}
          <div className="lg:col-span-2 border border-white p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-mono text-sm">SERVICE TOPOLOGY</h3>
              <div className="flex gap-2">
                {['all', 'frontend', 'backend', 'database', 'cache', 'gateway'].map(type => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type as any)}
                    className={`px-2 py-1 font-mono text-xs border transition-colors ${
                      filterType === type ? 'bg-white text-black border-white' : 'border-white/30 hover:border-white'
                    }`}
                  >
                    {type.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-4 gap-3 max-h-96 overflow-y-auto">
              {filteredServices.map(service => {
                const isSelected = selectedService === service.id;
                return (
                  <button
                    key={service.id}
                    onClick={() => setSelectedService(isSelected ? null : service.id)}
                    className={`border-2 p-3 transition-all text-left ${
                      isSelected ? 'border-white scale-105' : `${getStatusColor(service.status).split(' ')[1]} hover:border-white/70`
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {getServiceIcon(service.type)}
                      <span className="font-mono text-xs font-bold truncate">{service.name}</span>
                    </div>
                    
                    <div className="text-xs font-mono text-gray-400 mb-1">
                      {service.namespace} • v{service.version}
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>RPS:</span>
                        <span>{service.metrics.requestRate.toFixed(0)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span>P95:</span>
                        <span>{service.metrics.latency.p95.toFixed(0)}ms</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span>Error:</span>
                        <span className={service.metrics.errorRate > 2 ? 'text-red-500' : ''}>
                          {service.metrics.errorRate.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center mt-2">
                      <div className="flex items-center gap-1">
                        {getCircuitBreakerIcon(service.circuitBreaker.status)}
                        <span className="text-xs">{service.instances}</span>
                      </div>
                      <div className={`text-xs ${getStatusColor(service.status).split(' ')[0]}`}>
                        {service.status.toUpperCase()}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Service Details */}
          <div className="border border-white p-4">
            <h3 className="font-mono text-sm mb-4">SERVICE DETAILS</h3>
            {selectedServiceData ? (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    {getServiceIcon(selectedServiceData.type)}
                    <h4 className="font-mono text-sm font-bold">{selectedServiceData.name}</h4>
                  </div>
                  <div className="text-xs font-mono text-gray-500">
                    {selectedServiceData.namespace} • {selectedServiceData.type} • v{selectedServiceData.version}
                  </div>
                </div>

                {/* Metrics */}
                <div className="space-y-2">
                  <h5 className="font-mono text-xs font-bold">METRICS</h5>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>RPS: {selectedServiceData.metrics.requestRate.toFixed(1)}</div>
                    <div>Success: {selectedServiceData.metrics.successRate.toFixed(1)}%</div>
                    <div>P50: {selectedServiceData.metrics.latency.p50.toFixed(1)}ms</div>
                    <div>P95: {selectedServiceData.metrics.latency.p95.toFixed(1)}ms</div>
                    <div>P99: {selectedServiceData.metrics.latency.p99.toFixed(1)}ms</div>
                    <div className={selectedServiceData.metrics.errorRate > 2 ? 'text-red-500' : ''}>
                      Error: {selectedServiceData.metrics.errorRate.toFixed(1)}%
                    </div>
                  </div>
                </div>

                {/* Circuit Breaker */}
                <div>
                  <h5 className="font-mono text-xs font-bold mb-2">CIRCUIT BREAKER</h5>
                  <div className="flex items-center gap-2 mb-1">
                    {getCircuitBreakerIcon(selectedServiceData.circuitBreaker.status)}
                    <span className="text-xs font-mono">
                      {selectedServiceData.circuitBreaker.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-xs font-mono text-gray-400">
                    Threshold: {selectedServiceData.circuitBreaker.failureThreshold}%
                  </div>
                  <div className="text-xs font-mono text-gray-400">
                    Timeout: {(selectedServiceData.circuitBreaker.timeout / 1000).toFixed(1)}s
                  </div>
                  {selectedServiceData.circuitBreaker.lastTripped && (
                    <div className="text-xs font-mono text-red-500">
                      Last tripped: {new Date(selectedServiceData.circuitBreaker.lastTripped).toLocaleTimeString()}
                    </div>
                  )}
                </div>

                {/* Connections */}
                {serviceConnections.length > 0 && (
                  <div>
                    <h5 className="font-mono text-xs font-bold mb-2">CONNECTIONS ({serviceConnections.length})</h5>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {serviceConnections.slice(0, 5).map(conn => {
                        const isOutbound = conn.source === selectedService;
                        const targetService = isOutbound 
                          ? data.services.find(s => s.id === conn.target)
                          : data.services.find(s => s.id === conn.source);
                        
                        return (
                          <div key={conn.id} className="flex justify-between text-xs">
                            <div className="flex items-center gap-1">
                              <span className={getProtocolColor(conn.protocol)}>{conn.protocol}</span>
                              <span className={isOutbound ? 'text-blue-400' : 'text-green-400'}>
                                {isOutbound ? '→' : '←'}
                              </span>
                              <span className="truncate">{targetService?.name}</span>
                            </div>
                            {getSecurityIcon(conn.security.encrypted, conn.security.mTLS)}
                          </div>
                        );
                      })}
                      {serviceConnections.length > 5 && (
                        <div className="text-xs font-mono text-gray-500">
                          +{serviceConnections.length - 5} more...
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <Network className="w-8 h-8 mx-auto mb-2" />
                <div className="text-sm font-mono">Select a service to view details</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Services View */}
      {selectedView === 'services' && (
        <div className="border border-white overflow-hidden">
          <table className="w-full font-mono text-sm">
            <thead>
              <tr className="border-b border-white">
                <th className="text-left p-3">SERVICE</th>
                <th className="text-left p-3">TYPE</th>
                <th className="text-left p-3">NAMESPACE</th>
                <th className="text-right p-3">RPS</th>
                <th className="text-right p-3">ERROR %</th>
                <th className="text-right p-3">P95</th>
                <th className="text-center p-3">CB</th>
                <th className="text-center p-3">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {data.services.map(service => (
                <tr key={service.id} className="border-b border-white/20 hover:bg-white/5">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      {getServiceIcon(service.type)}
                      <span>{service.name}</span>
                    </div>
                  </td>
                  <td className="p-3">{service.type}</td>
                  <td className="p-3">{service.namespace}</td>
                  <td className="p-3 text-right">{service.metrics.requestRate.toFixed(1)}</td>
                  <td className={`p-3 text-right ${service.metrics.errorRate > 2 ? 'text-red-500' : ''}`}>
                    {service.metrics.errorRate.toFixed(1)}%
                  </td>
                  <td className="p-3 text-right">{service.metrics.latency.p95.toFixed(0)}ms</td>
                  <td className="p-3 text-center">
                    {getCircuitBreakerIcon(service.circuitBreaker.status)}
                  </td>
                  <td className={`p-3 text-center ${getStatusColor(service.status).split(' ')[0]}`}>
                    {service.status.toUpperCase()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Endpoints View */}
      {selectedView === 'endpoints' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-mono text-sm">API ENDPOINTS</h3>
            <div className="text-xs font-mono text-gray-500">
              {data.endpoints.length} endpoints across {data.services.length} services
            </div>
          </div>
          
          <div className="border border-white overflow-hidden">
            <table className="w-full font-mono text-sm">
              <thead>
                <tr className="border-b border-white">
                  <th className="text-left p-3">ENDPOINT</th>
                  <th className="text-left p-3">SERVICE</th>
                  <th className="text-center p-3">METHOD</th>
                  <th className="text-right p-3">RPS</th>
                  <th className="text-right p-3">ERROR %</th>
                  <th className="text-right p-3">P95</th>
                  <th className="text-center p-3">AUTH</th>
                  <th className="text-center p-3">LIMIT</th>
                </tr>
              </thead>
              <tbody>
                {data.endpoints.slice(0, 20).map(endpoint => {
                  const service = data.services.find(s => s.id === endpoint.serviceId);
                  return (
                    <tr key={endpoint.id} className="border-b border-white/20 hover:bg-white/5">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <span className={endpoint.deprecated ? 'line-through text-gray-500' : ''}>
                            {endpoint.path}
                          </span>
                          {endpoint.deprecated && (
                            <span className="text-xs text-red-500">DEPRECATED</span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-gray-400">{service?.name}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-1 text-xs border ${
                          endpoint.method === 'GET' ? 'border-green-500 text-green-500' :
                          endpoint.method === 'POST' ? 'border-blue-500 text-blue-500' :
                          endpoint.method === 'PUT' ? 'border-yellow-500 text-yellow-500' :
                          endpoint.method === 'DELETE' ? 'border-red-500 text-red-500' :
                          'border-gray-500 text-gray-500'
                        }`}>
                          {endpoint.method}
                        </span>
                      </td>
                      <td className="p-3 text-right">{endpoint.metrics.requestRate.toFixed(1)}</td>
                      <td className={`p-3 text-right ${endpoint.metrics.errorRate > 5 ? 'text-red-500' : ''}`}>
                        {endpoint.metrics.errorRate.toFixed(1)}%
                      </td>
                      <td className="p-3 text-right">{endpoint.metrics.latency.p95.toFixed(0)}ms</td>
                      <td className="p-3 text-center">
                        {endpoint.authentication ? (
                          <Lock className="w-4 h-4 text-green-500" />
                        ) : (
                          <Unlock className="w-4 h-4 text-red-500" />
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {endpoint.rateLimit ? (
                          <span className="text-xs text-yellow-500">
                            {endpoint.rateLimit.limit}/{endpoint.rateLimit.period}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-500">NONE</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {data.endpoints.length > 20 && (
              <div className="p-3 text-center text-xs font-mono text-gray-500 border-t border-white/20">
                Showing 20 of {data.endpoints.length} endpoints
              </div>
            )}
          </div>
        </div>
      )}

      {/* Traffic Flows View */}
      {selectedView === 'flows' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Critical Flows */}
          <div className="border border-white p-4">
            <h3 className="font-mono text-sm mb-4">CRITICAL BUSINESS FLOWS</h3>
            <div className="space-y-3">
              {data.flows.filter(f => f.criticalPath).map(flow => (
                <div key={flow.id} className="border border-yellow-500 p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-mono text-sm font-bold">Flow {flow.id.split('-')[1]}</div>
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-yellow-500" />
                      <span className="text-xs font-mono">CRITICAL</span>
                    </div>
                  </div>
                  
                  <div className="text-xs font-mono mb-2">
                    Path: {flow.path.map(serviceId => {
                      const service = data.services.find(s => s.id === serviceId);
                      return service?.name || serviceId;
                    }).join(' → ')}
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>RPS: {flow.requestRate.toFixed(1)}</div>
                    <div>Latency: {flow.avgLatency.toFixed(0)}ms</div>
                    <div className={flow.errorRate > 2 ? 'text-red-500' : ''}>
                      Error: {flow.errorRate.toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* All Flows */}
          <div className="border border-white p-4">
            <h3 className="font-mono text-sm mb-4">ALL TRAFFIC FLOWS</h3>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {data.flows.map(flow => (
                <div key={flow.id} className={`border p-2 ${
                  flow.criticalPath ? 'border-yellow-500' : 'border-white/30'
                }`}>
                  <div className="flex justify-between text-xs">
                    <span className="font-mono">
                      {flow.path.length} hops • {flow.requestRate.toFixed(1)} RPS
                    </span>
                    <span className={flow.errorRate > 2 ? 'text-red-500' : 'text-gray-400'}>
                      {flow.errorRate.toFixed(1)}% error
                    </span>
                  </div>
                  <div className="text-xs font-mono text-gray-500 mt-1">
                    {flow.avgLatency.toFixed(0)}ms avg latency
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Alerts Section */}
      {(data.metrics.alerts.circuitBreakersOpen.length > 0 || 
        data.metrics.alerts.highErrorRate.length > 0 || 
        data.metrics.alerts.highLatency.length > 0) && (
        <div className="border border-red-500 p-4">
          <h3 className="font-mono text-sm font-bold mb-4 text-red-500">ACTIVE ALERTS</h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {data.metrics.alerts.circuitBreakersOpen.length > 0 && (
              <div>
                <h4 className="font-mono text-xs font-bold mb-2">CIRCUIT BREAKERS OPEN</h4>
                <div className="space-y-1">
                  {data.metrics.alerts.circuitBreakersOpen.map(service => (
                    <div key={service.id} className="text-xs font-mono text-red-500">
                      {service.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {data.metrics.alerts.highErrorRate.length > 0 && (
              <div>
                <h4 className="font-mono text-xs font-bold mb-2">HIGH ERROR RATE</h4>
                <div className="space-y-1">
                  {data.metrics.alerts.highErrorRate.map(service => (
                    <div key={service.id} className="text-xs font-mono">
                      <span className="text-red-500">{service.name}</span>
                      <span className="text-gray-500 ml-2">({service.metrics.errorRate.toFixed(1)}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {data.metrics.alerts.highLatency.length > 0 && (
              <div>
                <h4 className="font-mono text-xs font-bold mb-2">HIGH LATENCY</h4>
                <div className="space-y-1">
                  {data.metrics.alerts.highLatency.map(service => (
                    <div key={service.id} className="text-xs font-mono">
                      <span className="text-yellow-500">{service.name}</span>
                      <span className="text-gray-500 ml-2">({service.metrics.latency.p95.toFixed(0)}ms)</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceMesh;