import React from 'react';
import { 
  Globe, 
  Server, 
  Database, 
  Layers, 
  Network, 
  Shield, 
  Activity, 
  AlertCircle, 
  AlertTriangle, 
  Lock, 
  Unlock 
} from 'lucide-react';
import { ServiceType, NetworkProtocol, PROTOCOL_COLORS } from '@constants';

/**
 * Gets the appropriate icon for service type
 */
export const getServiceIcon = (type: string): React.ReactElement => {
  switch (type) {
    case ServiceType.FRONTEND: 
      return React.createElement(Globe, { className: "w-4 h-4" });
    case ServiceType.BACKEND: 
      return React.createElement(Server, { className: "w-4 h-4" });
    case ServiceType.DATABASE: 
      return React.createElement(Database, { className: "w-4 h-4" });
    case ServiceType.CACHE: 
      return React.createElement(Layers, { className: "w-4 h-4" });
    case ServiceType.GATEWAY: 
      return React.createElement(Network, { className: "w-4 h-4" });
    case ServiceType.SIDECAR: 
      return React.createElement(Shield, { className: "w-4 h-4" });
    default: 
      return React.createElement(Activity, { className: "w-4 h-4" });
  }
};

/**
 * Gets CSS color class for service status
 */
export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'healthy': return 'text-green-500 border-green-500';
    case 'warning': return 'text-yellow-500 border-yellow-500';
    case 'error': return 'text-red-500 border-red-500';
    case 'unknown': return 'text-gray-500 border-gray-500';
    default: return 'text-white border-white';
  }
};

/**
 * Gets the appropriate icon for circuit breaker status
 */
export const getCircuitBreakerIcon = (status: string): React.ReactElement => {
  switch (status) {
    case 'open': 
      return React.createElement(AlertCircle, { className: "w-4 h-4 text-red-500" });
    case 'half-open': 
      return React.createElement(AlertTriangle, { className: "w-4 h-4 text-yellow-500" });
    case 'closed': 
      return React.createElement(Activity, { className: "w-4 h-4 text-green-500" });
    default:
      return React.createElement(Activity, { className: "w-4 h-4 text-green-500" });
  }
};

/**
 * Gets the appropriate security icon based on encryption and mTLS status
 */
export const getSecurityIcon = (encrypted: boolean, mTLS: boolean): React.ReactElement => {
  if (!encrypted) {
    return React.createElement(Unlock, { className: "w-4 h-4 text-red-500" });
  }
  if (mTLS) {
    return React.createElement(Shield, { className: "w-4 h-4 text-green-500" });
  }
  return React.createElement(Lock, { className: "w-4 h-4 text-yellow-500" });
};

/**
 * Gets protocol color based on protocol type
 */
export const getProtocolColor = (protocol: string): string => {
  switch (protocol) {
    case NetworkProtocol.HTTP: return PROTOCOL_COLORS.TEXT.HTTP;
    case NetworkProtocol.GRPC: return PROTOCOL_COLORS.TEXT.gRPC;
    case NetworkProtocol.TCP: return PROTOCOL_COLORS.TEXT.TCP;
    case NetworkProtocol.UDP: return PROTOCOL_COLORS.TEXT.UDP;
    default: return PROTOCOL_COLORS.TEXT.DEFAULT;
  }
};

/**
 * Gets HTTP method color for endpoints
 */
export const getMethodColor = (method: string): string => {
  switch (method) {
    case 'GET': return 'border-green-500 text-green-500';
    case 'POST': return 'border-blue-500 text-blue-500';
    case 'PUT': return 'border-yellow-500 text-yellow-500';
    case 'DELETE': return 'border-red-500 text-red-500';
    default: return 'border-gray-500 text-gray-500';
  }
};

/**
 * Formats circuit breaker status with appropriate styling
 */
export const formatCircuitBreakerStatus = (status: string): { color: string; text: string } => {
  switch (status) {
    case 'open':
      return { color: 'text-red-500', text: 'OPEN' };
    case 'half-open':
      return { color: 'text-yellow-500', text: 'HALF-OPEN' };
    case 'closed':
      return { color: 'text-green-500', text: 'CLOSED' };
    default:
      return { color: 'text-gray-500', text: 'UNKNOWN' };
  }
};

/**
 * Gets endpoint status color based on error rate
 */
export const getEndpointStatusColor = (errorRate: number): string => {
  if (errorRate > 5) return 'text-red-500';
  if (errorRate > 2) return 'text-yellow-500';
  return 'text-green-500';
};

/**
 * Gets circuit breaker background color for status indicators
 */
export const getCircuitBreakerBackground = (status: string): string => {
  switch (status) {
    case 'closed': return 'bg-green-500';
    case 'half-open': return 'bg-yellow-500';
    case 'open': return 'bg-red-500';
    default: return 'bg-gray-500';
  }
};

/**
 * Formats service health percentage with color
 */
export const formatServiceHealth = (errorRate: number): { color: string; isHealthy: boolean } => {
  const isHealthy = errorRate <= 2;
  return {
    color: isHealthy ? 'text-green-500' : 'text-red-500',
    isHealthy
  };
};