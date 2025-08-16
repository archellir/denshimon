import React from 'react';
import { Network, Globe, ExternalLink, Server } from 'lucide-react';
import { Service } from '@stores/workloadsStore';

/**
 * Gets the appropriate icon for Kubernetes service type
 */
export const getServiceTypeIcon = (type: string): React.ReactElement => {
  switch (type) {
    case 'LoadBalancer':
      return React.createElement(Globe, { size: 16, className: "text-blue-400" });
    case 'NodePort':
      return React.createElement(Server, { size: 16, className: "text-green-400" });
    case 'ClusterIP':
      return React.createElement(Network, { size: 16, className: "text-yellow-400" });
    case 'ExternalName':
      return React.createElement(ExternalLink, { size: 16, className: "text-purple-400" });
    default:
      return React.createElement(Network, { size: 16, className: "text-gray-400" });
  }
};

/**
 * Gets the CSS color class for service type
 */
export const getServiceTypeColor = (type: string): string => {
  switch (type) {
    case 'LoadBalancer':
      return 'text-blue-400';
    case 'NodePort':
      return 'text-green-400';
    case 'ClusterIP':
      return 'text-yellow-400';
    case 'ExternalName':
      return 'text-purple-400';
    default:
      return 'text-gray-400';
  }
};

/**
 * Filters services by namespace and type
 */
export const filterServices = (
  services: Service[],
  selectedNamespace: string,
  selectedType: string
): Service[] => {
  let servicesList = [...services];

  if (selectedNamespace !== 'all') {
    servicesList = servicesList.filter(svc => svc.namespace === selectedNamespace);
  }

  if (selectedType !== 'all') {
    servicesList = servicesList.filter(svc => svc.type === selectedType);
  }

  return servicesList;
};

/**
 * Sorts services by specified criteria
 */
export const sortServices = (
  services: Service[],
  sortBy: string,
  sortOrder: 'asc' | 'desc'
): Service[] => {
  return services.sort((a, b) => {
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
      return sortOrder === 'asc' ? (valueA as number) - (valueB as number) : (valueB as number) - (valueA as number);
    }
    
    const comparison = valueA.toString().localeCompare(valueB.toString());
    return sortOrder === 'asc' ? comparison : -comparison;
  });
};

/**
 * Formats service endpoint count for display
 */
export const formatEndpointCount = (ready: number, total: number): string => {
  return `${ready}/${total}`;
};

/**
 * Gets service health status based on endpoint readiness
 */
export const getServiceHealth = (ready: number, total: number): 'healthy' | 'warning' | 'critical' => {
  if (total === 0) return 'critical';
  
  const ratio = ready / total;
  if (ratio >= 1) return 'healthy';
  if (ratio >= 0.5) return 'warning';
  return 'critical';
};

/**
 * Gets service port information as formatted string
 */
export const formatServicePorts = (ports: any[]): string => {
  if (!ports || ports.length === 0) return 'No ports';
  
  return ports.map(port => {
    if (port.nodePort) {
      return `${port.port}:${port.nodePort}/${port.protocol || 'TCP'}`;
    }
    return `${port.port}/${port.protocol || 'TCP'}`;
  }).join(', ');
};

/**
 * Checks if service is externally accessible
 */
export const isServiceExternal = (type: string): boolean => {
  return type === 'LoadBalancer' || type === 'NodePort';
};