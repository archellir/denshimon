import React, { useState, useEffect } from 'react';
import { TimeRange, Status, ConnectionStatus, HttpMethod } from '@constants';
import { getDataPointsForTimeRange } from '@utils/timeUtils';
import { Globe, Activity, AlertTriangle, Clock, Users, Lock, Unlock } from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

interface APIEndpoint {
  path: string;
  method: string;
  requests: number;
  errorRate: number;
  avgLatency: number;
  p95Latency: number;
  authRequired: boolean;
  rateLimit: number;
  status: Status;
}

interface ClientMetrics {
  clientId: string;
  name: string;
  requests: number;
  errorRate: number;
  quotaUsed: number;
  quotaLimit: number;
  lastSeen: string;
  blocked: boolean;
}

interface Gateway {
  name: string;
  namespace: string;
  host: string;
  totalRequests: number;
  errorRate: number;
  avgLatency: number;
  uptime: number;
  status: ConnectionStatus;
}

interface APIGatewayAnalyticsProps {
  timeRange?: string;
}

const APIGatewayAnalytics: React.FC<APIGatewayAnalyticsProps> = ({ timeRange = TimeRange.ONE_HOUR }) => {
  const [_selectedGateway, _setSelectedGateway] = useState<string | null>(null);
  const [selectedEndpoint, setSelectedEndpoint] = useState<string | null>(null);
  const [gateways, setGateways] = useState<Gateway[]>([]);
  const [endpoints, setEndpoints] = useState<APIEndpoint[]>([]);
  const [clients, setClients] = useState<ClientMetrics[]>([]);
  const [trafficHistory, setTrafficHistory] = useState<any[]>([]);

  // Generate mock data
  useEffect(() => {
    // Generate gateways
    const mockGateways: Gateway[] = [
      {
        name: 'api-gateway-prod',
        namespace: 'production',
        host: 'api.company.com',
        totalRequests: 125000,
        errorRate: 2.1,
        avgLatency: 85,
        uptime: 99.95,
        status: ConnectionStatus.ONLINE
      },
      {
        name: 'api-gateway-staging',
        namespace: 'staging',
        host: 'api-staging.company.com',
        totalRequests: 45000,
        errorRate: 4.2,
        avgLatency: 120,
        uptime: 98.5,
        status: ConnectionStatus.CONNECTING
      },
      {
        name: 'internal-api-gateway',
        namespace: 'internal',
        host: 'internal-api.company.com',
        totalRequests: 85000,
        errorRate: 1.5,
        avgLatency: 45,
        uptime: 99.99,
        status: ConnectionStatus.ONLINE
      }
    ];

    // Generate API endpoints
    const mockEndpoints: APIEndpoint[] = [
      {
        path: '/api/v1/users',
        method: 'GET',
        requests: 25000,
        errorRate: 0.5,
        avgLatency: 45,
        p95Latency: 120,
        authRequired: true,
        rateLimit: 1000,
        status: Status.HEALTHY
      },
      {
        path: '/api/v1/users',
        method: 'POST',
        requests: 8500,
        errorRate: 2.1,
        avgLatency: 95,
        p95Latency: 250,
        authRequired: true,
        rateLimit: 100,
        status: Status.HEALTHY
      },
      {
        path: '/api/v1/orders',
        method: 'GET',
        requests: 45000,
        errorRate: 1.2,
        avgLatency: 65,
        p95Latency: 180,
        authRequired: true,
        rateLimit: 2000,
        status: Status.HEALTHY
      },
      {
        path: '/api/v1/orders',
        method: 'POST',
        requests: 15000,
        errorRate: 5.8,
        avgLatency: 180,
        p95Latency: 450,
        authRequired: true,
        rateLimit: 500,
        status: Status.DEGRADED
      },
      {
        path: '/api/v1/payments',
        method: 'POST',
        requests: 12000,
        errorRate: 8.5,
        avgLatency: 350,
        p95Latency: 800,
        authRequired: true,
        rateLimit: 200,
        status: Status.CRITICAL
      },
      {
        path: '/api/v1/health',
        method: 'GET',
        requests: 50000,
        errorRate: 0.1,
        avgLatency: 15,
        p95Latency: 35,
        authRequired: false,
        rateLimit: 5000,
        status: Status.HEALTHY
      },
      {
        path: '/api/v2/analytics',
        method: 'GET',
        requests: 8000,
        errorRate: 12.5,
        avgLatency: 500,
        p95Latency: 1200,
        authRequired: true,
        rateLimit: 50,
        status: Status.CRITICAL
      }
    ];

    // Generate clients
    const mockClients: ClientMetrics[] = [
      {
        clientId: 'web-app-prod',
        name: 'Production Web Application',
        requests: 85000,
        errorRate: 1.8,
        quotaUsed: 850,
        quotaLimit: 10000,
        lastSeen: new Date(Date.now() - 30000).toISOString(),
        blocked: false
      },
      {
        clientId: 'mobile-app-ios',
        name: 'iOS Mobile Application',
        requests: 45000,
        errorRate: 3.2,
        quotaUsed: 4500,
        quotaLimit: 5000,
        lastSeen: new Date(Date.now() - 15000).toISOString(),
        blocked: false
      },
      {
        clientId: 'partner-integration',
        name: 'Partner API Integration',
        requests: 25000,
        errorRate: 0.5,
        quotaUsed: 2500,
        quotaLimit: 50000,
        lastSeen: new Date(Date.now() - 60000).toISOString(),
        blocked: false
      },
      {
        clientId: 'analytics-service',
        name: 'Internal Analytics Service',
        requests: 15000,
        errorRate: 2.1,
        quotaUsed: 15000,
        quotaLimit: 15000,
        lastSeen: new Date(Date.now() - 5000).toISOString(),
        blocked: true
      }
    ];

    // Generate traffic history
    const history = [];
    const points = getDataPointsForTimeRange(timeRange, 5);
    
    for (let i = 0; i < points; i++) {
      history.push({
        time: i,
        requests: 2000 + Math.random() * 1000 - 500,
        errors: 20 + Math.random() * 40,
        latency: 80 + Math.random() * 50,
        '2xx': 1800 + Math.random() * 200,
        '3xx': 100 + Math.random() * 50,
        '4xx': 80 + Math.random() * 60,
        '5xx': 20 + Math.random() * 30
      });
    }

    setGateways(mockGateways);
    setEndpoints(mockEndpoints);
    setClients(mockClients);
    setTrafficHistory(history);
  }, [timeRange]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case Status.HEALTHY:
      case ConnectionStatus.ONLINE:
        return 'text-green-500 border-green-500';
      case Status.DEGRADED:
      case ConnectionStatus.CONNECTING:
        return 'text-yellow-500 border-yellow-500';
      case Status.CRITICAL:
      case ConnectionStatus.OFFLINE:
        return 'text-red-500 border-red-500';
      default:
        return 'text-gray-500 border-gray-500';
    }
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case HttpMethod.GET: return 'text-green-500 border-green-500';
      case HttpMethod.POST: return 'text-blue-500 border-blue-500';
      case HttpMethod.PUT: return 'text-yellow-500 border-yellow-500';
      case HttpMethod.DELETE: return 'text-red-500 border-red-500';
      default: return 'text-gray-500 border-gray-500';
    }
  };

  const totalRequests = gateways.reduce((sum, g) => sum + g.totalRequests, 0);
  const avgErrorRate = gateways.reduce((sum, g) => sum + g.errorRate, 0) / gateways.length;
  const avgLatency = gateways.reduce((sum, g) => sum + g.avgLatency, 0) / gateways.length;

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="border border-white p-4">
          <div className="flex items-center justify-between mb-2">
            <Globe size={20} />
            <span className="text-xs font-mono text-gray-500">GATEWAYS</span>
          </div>
          <div className="text-2xl font-mono font-bold">{gateways.length}</div>
          <div className="text-xs text-gray-500">active instances</div>
        </div>

        <div className="border border-white p-4">
          <div className="flex items-center justify-between mb-2">
            <Activity size={20} />
            <span className="text-xs font-mono text-gray-500">REQUESTS</span>
          </div>
          <div className="text-2xl font-mono font-bold">{(totalRequests / 1000).toFixed(0)}K</div>
          <div className="text-xs text-gray-500">total requests</div>
        </div>

        <div className="border border-white p-4">
          <div className="flex items-center justify-between mb-2">
            <AlertTriangle size={20} />
            <span className="text-xs font-mono text-gray-500">ERROR RATE</span>
          </div>
          <div className={`text-2xl font-mono font-bold ${avgErrorRate > 5 ? 'text-red-500' : avgErrorRate > 2 ? 'text-yellow-500' : ''}`}>
            {avgErrorRate.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-500">average across gateways</div>
        </div>

        <div className="border border-white p-4">
          <div className="flex items-center justify-between mb-2">
            <Clock size={20} />
            <span className="text-xs font-mono text-gray-500">LATENCY</span>
          </div>
          <div className="text-2xl font-mono font-bold">{avgLatency.toFixed(0)}ms</div>
          <div className="text-xs text-gray-500">average response</div>
        </div>

        <div className="border border-white p-4">
          <div className="flex items-center justify-between mb-2">
            <Users size={20} />
            <span className="text-xs font-mono text-gray-500">CLIENTS</span>
          </div>
          <div className="text-2xl font-mono font-bold">{clients.length}</div>
          <div className="text-xs text-gray-500">active clients</div>
        </div>
      </div>


      {/* Traffic Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Request Volume */}
        <div className="border border-white p-4">
          <h3 className="font-mono text-sm mb-4">REQUEST VOLUME</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={trafficHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="time" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#000', border: '1px solid #fff' }}
                labelStyle={{ color: '#fff' }}
              />
              <Area 
                type="monotone" 
                dataKey="requests" 
                stroke="#00ff00" 
                fill="#00ff00" 
                fillOpacity={0.3}
                name="Requests"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Status Code Distribution */}
        <div className="border border-white p-4">
          <h3 className="font-mono text-sm mb-4">STATUS CODE DISTRIBUTION</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={trafficHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="time" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#000', border: '1px solid #fff' }}
                labelStyle={{ color: '#fff' }}
              />
              <Area 
                type="monotone" 
                dataKey="2xx" 
                stackId="1"
                stroke="#00ff00" 
                fill="#00ff00" 
                fillOpacity={0.8}
                name="2xx"
              />
              <Area 
                type="monotone" 
                dataKey="3xx" 
                stackId="1"
                stroke="#0099ff" 
                fill="#0099ff" 
                fillOpacity={0.8}
                name="3xx"
              />
              <Area 
                type="monotone" 
                dataKey="4xx" 
                stackId="1"
                stroke="#ffff00" 
                fill="#ffff00" 
                fillOpacity={0.8}
                name="4xx"
              />
              <Area 
                type="monotone" 
                dataKey="5xx" 
                stackId="1"
                stroke="#ff0000" 
                fill="#ff0000" 
                fillOpacity={0.8}
                name="5xx"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* API Endpoints Table */}
      <div className="border border-white">
        <div className="border-b border-white px-4 py-2">
          <h3 className="font-mono text-sm font-bold">API ENDPOINTS</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full font-mono text-sm">
            <thead>
              <tr className="border-b border-white/20">
                <th className="text-left p-3">ENDPOINT</th>
                <th className="text-center p-3">METHOD</th>
                <th className="text-right p-3">REQUESTS</th>
                <th className="text-right p-3">ERROR %</th>
                <th className="text-right p-3">AVG LATENCY</th>
                <th className="text-right p-3">P95</th>
                <th className="text-center p-3">AUTH</th>
                <th className="text-right p-3">RATE LIMIT</th>
                <th className="text-center p-3">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {endpoints.map((endpoint, index) => (
                <tr 
                  key={index}
                  onClick={() => setSelectedEndpoint(`${endpoint.method}-${endpoint.path}`)}
                  className={`border-b border-white/10 hover:bg-white/5 cursor-pointer ${
                    selectedEndpoint === `${endpoint.method}-${endpoint.path}` ? 'bg-white/10' : ''
                  }`}
                >
                  <td className="p-3 font-bold">{endpoint.path}</td>
                  <td className="p-3 text-center">
                    <span className={`px-2 py-1 border text-xs ${getMethodColor(endpoint.method)}`}>
                      {endpoint.method}
                    </span>
                  </td>
                  <td className="p-3 text-right">{endpoint.requests.toLocaleString()}</td>
                  <td className={`p-3 text-right ${endpoint.errorRate > 5 ? 'text-red-500' : endpoint.errorRate > 2 ? 'text-yellow-500' : ''}`}>
                    {endpoint.errorRate.toFixed(1)}%
                  </td>
                  <td className="p-3 text-right">{endpoint.avgLatency}ms</td>
                  <td className="p-3 text-right">{endpoint.p95Latency}ms</td>
                  <td className="p-3 text-center">
                    {endpoint.authRequired ? (
                      <Lock size={14} className="text-green-500 inline" />
                    ) : (
                      <Unlock size={14} className="text-red-500 inline" />
                    )}
                  </td>
                  <td className="p-3 text-right">{endpoint.rateLimit}/min</td>
                  <td className="p-3 text-center">
                    <span className={`px-2 py-1 text-xs ${getStatusColor(endpoint.status)}`}>
                      {endpoint.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Client Analytics */}
      <div className="border border-white">
        <div className="border-b border-white px-4 py-2">
          <h3 className="font-mono text-sm font-bold">CLIENT ANALYTICS</h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {clients.map(client => (
              <div 
                key={client.clientId}
                className={`border p-4 ${client.blocked ? 'border-red-500' : 'border-white/30'}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-mono text-sm font-bold">{client.name}</div>
                    <div className="text-xs text-gray-500">{client.clientId}</div>
                  </div>
                  {client.blocked && (
                    <span className="px-2 py-1 text-xs bg-red-500 text-white">BLOCKED</span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <div className="text-gray-500">Requests</div>
                    <div className="font-bold">{client.requests.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Error Rate</div>
                    <div className={`font-bold ${client.errorRate > 5 ? 'text-red-500' : client.errorRate > 2 ? 'text-yellow-500' : ''}`}>
                      {client.errorRate.toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">Quota Usage</div>
                    <div className="font-bold">
                      {client.quotaUsed} / {client.quotaLimit}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">Last Seen</div>
                    <div className="font-bold">
                      {Math.floor((Date.now() - new Date(client.lastSeen).getTime()) / 1000)}s ago
                    </div>
                  </div>
                </div>

                {/* Quota Usage Bar */}
                <div className="mt-3">
                  <div className="w-full bg-gray-800 h-2">
                    <div 
                      className={`h-full transition-all ${
                        (client.quotaUsed / client.quotaLimit) > 0.9 
                          ? 'bg-red-500' 
                          : (client.quotaUsed / client.quotaLimit) > 0.7 
                          ? 'bg-yellow-500' 
                          : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(100, (client.quotaUsed / client.quotaLimit) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Gateway Status */}
      <div className="border border-white">
        <div className="border-b border-white px-4 py-2">
          <h3 className="font-mono text-sm font-bold">GATEWAY INSTANCES</h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {gateways.map(gateway => (
              <div key={gateway.name} className="border border-white/30 p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-mono text-sm font-bold">{gateway.name}</div>
                    <div className="text-xs text-gray-500">{gateway.host}</div>
                  </div>
                  <span className={`px-2 py-1 text-xs ${getStatusColor(gateway.status)}`}>
                    {gateway.status.toUpperCase()}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Requests:</span>
                    <span className="font-bold">{gateway.totalRequests.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Error Rate:</span>
                    <span className={`font-bold ${gateway.errorRate > 5 ? 'text-red-500' : gateway.errorRate > 2 ? 'text-yellow-500' : ''}`}>
                      {gateway.errorRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Avg Latency:</span>
                    <span className="font-bold">{gateway.avgLatency}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Uptime:</span>
                    <span className="font-bold text-green-500">{gateway.uptime.toFixed(2)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default APIGatewayAnalytics;