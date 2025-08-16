import { ServiceNode } from '@/types/serviceMesh';
import { ServiceFilterType } from '@constants';

/**
 * Filters services by type and search query
 */
export const filterServices = (
  services: ServiceNode[],
  filterType: ServiceFilterType,
  searchQuery?: string
): ServiceNode[] => {
  if (!services || !Array.isArray(services)) {
    return [];
  }

  let filtered = filterType === ServiceFilterType.ALL 
    ? services 
    : services.filter(s => s.type === filterType);
  
  // Apply search filter
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(s => 
      s.name.toLowerCase().includes(query) ||
      s.namespace.toLowerCase().includes(query) ||
      s.type.toLowerCase().includes(query)
    );
  }
  
  return filtered;
};

/**
 * Filters endpoints by search query
 */
export const filterEndpoints = (
  endpoints: any[],
  services: ServiceNode[],
  searchQuery?: string
): any[] => {
  if (!endpoints || !Array.isArray(endpoints)) {
    return [];
  }
  
  if (!searchQuery) return endpoints;
  
  const query = searchQuery.toLowerCase();
  return endpoints.filter(endpoint =>
    endpoint.path.toLowerCase().includes(query) ||
    endpoint.method.toLowerCase().includes(query) ||
    services.find(s => s.id === endpoint.serviceId)?.name.toLowerCase().includes(query)
  );
};

/**
 * Sorts services by specified criteria
 */
export const sortServices = (
  services: ServiceNode[],
  sortBy: string,
  sortOrder: 'asc' | 'desc' = 'asc'
): ServiceNode[] => {
  if (!services || !Array.isArray(services)) {
    return [];
  }

  return services.sort((a, b) => {
    let valueA: string | number;
    let valueB: string | number;
    
    switch (sortBy) {
      case 'name':
        valueA = a.name;
        valueB = b.name;
        break;
      case 'type':
        valueA = a.type;
        valueB = b.type;
        break;
      case 'namespace':
        valueA = a.namespace;
        valueB = b.namespace;
        break;
      case 'status':
        valueA = a.status;
        valueB = b.status;
        break;
      case 'rps':
      case 'requestRate':
        valueA = a.metrics.requestRate;
        valueB = b.metrics.requestRate;
        break;
      case 'errorRate':
        valueA = a.metrics.errorRate;
        valueB = b.metrics.errorRate;
        break;
      case 'latency':
      case 'p95':
        valueA = a.metrics.latency.p95;
        valueB = b.metrics.latency.p95;
        break;
      case 'circuitBreaker':
        valueA = a.circuitBreaker.status;
        valueB = b.circuitBreaker.status;
        break;
      default:
        valueA = a.name;
        valueB = b.name;
    }

    // Handle numeric sorting
    if (typeof valueA === 'number' && typeof valueB === 'number') {
      return sortOrder === 'asc' ? valueA - valueB : valueB - valueA;
    }
    
    // Handle string sorting
    const comparison = valueA.toString().localeCompare(valueB.toString());
    return sortOrder === 'asc' ? comparison : -comparison;
  });
};

/**
 * Sorts endpoints by specified criteria
 */
export const sortEndpoints = (
  endpoints: any[],
  sortBy: string,
  sortOrder: 'asc' | 'desc' = 'asc'
): any[] => {
  if (!endpoints || !Array.isArray(endpoints)) {
    return [];
  }

  return endpoints.sort((a, b) => {
    let valueA: string | number;
    let valueB: string | number;
    
    switch (sortBy) {
      case 'path':
        valueA = a.path;
        valueB = b.path;
        break;
      case 'method':
        valueA = a.method;
        valueB = b.method;
        break;
      case 'rps':
      case 'requestRate':
        valueA = a.metrics.requestRate;
        valueB = b.metrics.requestRate;
        break;
      case 'errorRate':
        valueA = a.metrics.errorRate;
        valueB = b.metrics.errorRate;
        break;
      case 'latency':
      case 'p95':
        valueA = a.metrics.latency.p95;
        valueB = b.metrics.latency.p95;
        break;
      case 'auth':
      case 'authentication':
        valueA = a.authentication ? 1 : 0;
        valueB = b.authentication ? 1 : 0;
        break;
      default:
        valueA = a.path;
        valueB = b.path;
    }

    // Handle numeric sorting
    if (typeof valueA === 'number' && typeof valueB === 'number') {
      return sortOrder === 'asc' ? valueA - valueB : valueB - valueA;
    }
    
    // Handle string sorting
    const comparison = valueA.toString().localeCompare(valueB.toString());
    return sortOrder === 'asc' ? comparison : -comparison;
  });
};

/**
 * Searches services for global search functionality
 */
export const searchServices = (
  services: ServiceNode[],
  query: string
): ServiceNode[] => {
  if (!services || !query) return services;
  
  const searchTerm = query.toLowerCase();
  
  return services.filter(service =>
    service.name.toLowerCase().includes(searchTerm) ||
    service.namespace.toLowerCase().includes(searchTerm) ||
    service.type.toLowerCase().includes(searchTerm) ||
    service.status.toLowerCase().includes(searchTerm) ||
    service.version.toLowerCase().includes(searchTerm)
  );
};

/**
 * Filters services by health status
 */
export const filterServicesByHealth = (
  services: ServiceNode[],
  healthFilter: 'all' | 'healthy' | 'warning' | 'error'
): ServiceNode[] => {
  if (!services || healthFilter === 'all') return services;
  
  return services.filter(service => {
    switch (healthFilter) {
      case 'healthy':
        return service.status === 'healthy' && service.metrics.errorRate <= 2;
      case 'warning':
        return service.status === 'warning' || 
               (service.metrics.errorRate > 2 && service.metrics.errorRate <= 5);
      case 'error':
        return service.status === 'error' || 
               service.metrics.errorRate > 5 ||
               service.circuitBreaker.status === 'open';
      default:
        return true;
    }
  });
};

/**
 * Gets unique namespaces from services
 */
export const getUniqueNamespaces = (services: ServiceNode[]): string[] => {
  if (!services || !Array.isArray(services)) return [];
  
  const namespaces = new Set(services.map(service => service.namespace));
  return Array.from(namespaces).sort();
};

/**
 * Gets unique service types from services
 */
export const getUniqueServiceTypes = (services: ServiceNode[]): string[] => {
  if (!services || !Array.isArray(services)) return [];
  
  const types = new Set(services.map(service => service.type));
  return Array.from(types).sort();
};