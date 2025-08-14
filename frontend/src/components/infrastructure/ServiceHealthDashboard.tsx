import { useEffect, useState } from 'react';
import type { FC } from 'react';
import { 
  Server,
  Database,
  FileText,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
  Eye,
  Settings,
  TrendingUp,
  HardDrive,
  Cpu,
  Network,
  Users,
  GitBranch,
  BarChart3,
  Globe,
  Shield,
  X,
  ExternalLink
} from 'lucide-react';
import useServiceHealthStore from '@stores/serviceHealthStore';
import { ServiceHealth, ServiceStatus, ServiceType, AlertSeverity } from '@/types/serviceHealth';

const ServiceHealthDashboard: FC = () => {
  const {
    services,
    stats,
    infrastructureStatus,
    alerts,
    isLoading,
    error,
    lastUpdated,
    fetchServiceHealth,
    fetchInfrastructureStatus,
    fetchAlerts,
    refreshAllServices,
    acknowledgeAlert,
    clearError
  } = useServiceHealthStore();

  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [showInfrastructureDetails, setShowInfrastructureDetails] = useState(false);

  // Load initial data
  useEffect(() => {
    fetchServiceHealth();
    fetchInfrastructureStatus();
    fetchAlerts();
  }, [fetchServiceHealth, fetchInfrastructureStatus, fetchAlerts]);

  // Auto-refresh every 2 minutes
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchServiceHealth();
      fetchInfrastructureStatus();
      fetchAlerts();
    }, 2 * 60 * 1000); // 2 minutes

    return () => clearInterval(interval);
  }, [autoRefresh, fetchServiceHealth, fetchInfrastructureStatus, fetchAlerts]);

  const getStatusColor = (status: ServiceStatus) => {
    switch (status) {
      case ServiceStatus.HEALTHY:
        return 'border-green-400 text-green-400';
      case ServiceStatus.WARNING:
        return 'border-yellow-400 text-yellow-400';
      case ServiceStatus.CRITICAL:
        return 'border-red-400 text-red-400';
      case ServiceStatus.DOWN:
        return 'border-red-600 text-red-600';
      case ServiceStatus.UNKNOWN:
        return 'border-gray-400 text-gray-400';
      default:
        return 'border-white';
    }
  };

  const getStatusIcon = (status: ServiceStatus) => {
    switch (status) {
      case ServiceStatus.HEALTHY:
        return <CheckCircle size={16} className="text-green-400" />;
      case ServiceStatus.WARNING:
        return <AlertTriangle size={16} className="text-yellow-400" />;
      case ServiceStatus.CRITICAL:
        return <AlertTriangle size={16} className="text-red-400" />;
      case ServiceStatus.DOWN:
        return <XCircle size={16} className="text-red-600" />;
      case ServiceStatus.UNKNOWN:
        return <Clock size={16} className="text-gray-400" />;
      default:
        return <Server size={16} />;
    }
  };

  const getServiceIcon = (type: ServiceType) => {
    switch (type) {
      case ServiceType.GITEA:
        return <GitBranch size={20} />;
      case ServiceType.FILEBROWSER:
        return <FileText size={20} />;
      case ServiceType.UMAMI:
        return <BarChart3 size={20} />;
      case ServiceType.MEMOS:
        return <FileText size={20} />;
      case ServiceType.UPTIME_KUMA:
        return <Activity size={20} />;
      case ServiceType.POSTGRESQL:
        return <Database size={20} />;
      default:
        return <Server size={20} />;
    }
  };

  const formatUptime = (uptime: number) => {
    return `${uptime.toFixed(2)}%`;
  };

  const formatBytes = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const selectedSvc = services.find(svc => svc.id === selectedService);

  const renderServiceMetrics = (service: ServiceHealth) => {
    const commonMetrics = [
      { label: 'CPU Usage', value: `${service.metrics.cpuUsage?.toFixed(1)}%`, icon: Cpu },
      { label: 'Memory Usage', value: `${service.metrics.memoryUsage?.toFixed(1)}%`, icon: HardDrive },
      { label: 'Disk Usage', value: `${service.metrics.diskUsage?.toFixed(1)}%`, icon: HardDrive },
    ];

    const specificMetrics = getServiceSpecificMetrics(service);

    return [...commonMetrics, ...specificMetrics];
  };

  const getServiceSpecificMetrics = (service: ServiceHealth) => {
    switch (service.type) {
      case ServiceType.GITEA:
        return [
          { label: 'Active Runners', value: service.metrics.activeRunners?.toString(), icon: Activity },
          { label: 'Queued Jobs', value: service.metrics.queuedJobs?.toString(), icon: Clock },
          { label: 'Running Jobs', value: service.metrics.runningJobs?.toString(), icon: Activity },
          { label: 'Repositories', value: service.metrics.totalRepositories?.toString(), icon: GitBranch },
          { label: 'Registry Size', value: formatBytes(service.metrics.registrySize), icon: Database },
        ];
      case ServiceType.FILEBROWSER:
        return [
          { label: 'Total Files', value: service.metrics.totalFiles?.toLocaleString(), icon: FileText },
          { label: 'Storage Used', value: formatBytes(service.metrics.storageUsed), icon: HardDrive },
          { label: 'Active Connections', value: service.metrics.activeConnections?.toString(), icon: Network },
          { label: 'Recent Uploads', value: `${service.metrics.recentUploads24h}/24h`, icon: TrendingUp },
        ];
      case ServiceType.UMAMI:
        return [
          { label: 'Total Websites', value: service.metrics.totalWebsites?.toString(), icon: Globe },
          { label: 'Page Views', value: `${service.metrics.totalPageviews24h}/24h`, icon: Eye },
          { label: 'Sessions', value: `${service.metrics.totalSessions24h}/24h`, icon: Users },
          { label: 'Cache Hit Ratio', value: `${service.metrics.cacheHitRatio?.toFixed(1)}%`, icon: TrendingUp },
        ];
      case ServiceType.MEMOS:
        return [
          { label: 'Total Notes', value: service.metrics.totalNotes?.toLocaleString(), icon: FileText },
          { label: 'Notes Created', value: `${service.metrics.notesCreated24h}/24h`, icon: TrendingUp },
          { label: 'Database Size', value: formatBytes(service.metrics.databaseSize), icon: Database },
          { label: 'Sync Status', value: service.metrics.syncStatus, icon: Activity },
        ];
      case ServiceType.UPTIME_KUMA:
        return [
          { label: 'Total Monitors', value: service.metrics.totalMonitors?.toString(), icon: Activity },
          { label: 'Up Monitors', value: service.metrics.upMonitors?.toString(), icon: CheckCircle },
          { label: 'Down Monitors', value: service.metrics.downMonitors?.toString(), icon: XCircle },
          { label: 'Incidents', value: `${service.metrics.totalIncidents24h}/24h`, icon: AlertTriangle },
        ];
      case ServiceType.POSTGRESQL:
        return [
          { label: 'Total Databases', value: service.metrics.totalDatabases?.toString(), icon: Database },
          { label: 'Connections', value: `${service.metrics.totalConnections}/${service.metrics.maxConnections}`, icon: Network },
          { label: 'Active Queries', value: service.metrics.activeQueries?.toString(), icon: Activity },
          { label: 'Cache Hit Ratio', value: `${service.metrics.cacheHitRatio?.toFixed(1)}%`, icon: TrendingUp },
          { label: 'Database Size', value: formatBytes(service.metrics.databaseSize), icon: HardDrive },
        ];
      default:
        return [];
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-mono">SERVICE HEALTH MONITORING</h2>
          <div className="text-sm font-mono opacity-60">
            {services.length} SERVICE{services.length !== 1 ? 'S' : ''} MONITORED
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="auto-refresh-services"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="bg-black border-white"
            />
            <label htmlFor="auto-refresh-services" className="font-mono text-sm">
              AUTO REFRESH
            </label>
          </div>
          <button
            onClick={() => setShowInfrastructureDetails(!showInfrastructureDetails)}
            className="flex items-center space-x-2 px-3 py-2 border border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-black transition-colors font-mono text-sm"
          >
            <Shield size={16} />
            <span>INFRASTRUCTURE</span>
          </button>
          <button
            onClick={refreshAllServices}
            disabled={isLoading}
            className="flex items-center space-x-2 px-3 py-2 border border-green-400 text-green-400 hover:bg-green-400 hover:text-black transition-colors font-mono text-sm disabled:opacity-50"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            <span>REFRESH</span>
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 border border-red-400 bg-red-900/20 text-red-400 font-mono text-sm flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle size={16} />
            <span>ERROR: {error}</span>
          </div>
          <button
            onClick={clearError}
            className="p-1 hover:bg-red-400/20 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-5 gap-4">
          <div className="border border-green-400 p-4 text-green-400">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-sm">HEALTHY</span>
              <CheckCircle size={16} />
            </div>
            <div className="font-mono text-2xl">{stats.healthy}</div>
            <div className="font-mono text-xs opacity-60">Services OK</div>
          </div>
          
          <div className="border border-yellow-400 p-4 text-yellow-400">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-sm">WARNING</span>
              <AlertTriangle size={16} />
            </div>
            <div className="font-mono text-2xl">{stats.warning}</div>
            <div className="font-mono text-xs opacity-60">Need attention</div>
          </div>
          
          <div className="border border-red-400 p-4 text-red-400">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-sm">CRITICAL</span>
              <AlertTriangle size={16} />
            </div>
            <div className="font-mono text-2xl">{stats.critical}</div>
            <div className="font-mono text-xs opacity-60">Urgent issues</div>
          </div>

          <div className="border border-red-600 p-4 text-red-600">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-sm">DOWN</span>
              <XCircle size={16} />
            </div>
            <div className="font-mono text-2xl">{stats.down}</div>
            <div className="font-mono text-xs opacity-60">Offline</div>
          </div>
          
          <div className="border border-white p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-sm">TOTAL</span>
              <Server size={16} />
            </div>
            <div className="font-mono text-2xl">{stats.total}</div>
            <div className="font-mono text-xs opacity-60">All services</div>
          </div>
        </div>
      )}

      {/* Active Alerts */}
      {alerts.length > 0 && (
        <div className="border border-yellow-400 bg-yellow-900/10">
          <div className="bg-yellow-400/10 p-3 border-b border-yellow-400">
            <h4 className="font-mono text-sm text-yellow-400">ACTIVE ALERTS ({alerts.filter(a => !a.acknowledged).length})</h4>
          </div>
          <div className="p-4 space-y-2">
            {alerts.filter(a => !a.acknowledged).slice(0, 5).map((alert) => (
              <div key={alert.id} className="flex items-center justify-between py-2 border-b border-yellow-400/20 last:border-b-0">
                <div className="flex items-center space-x-3">
                  {alert.severity === AlertSeverity.CRITICAL ? (
                    <AlertTriangle size={16} className="text-red-400" />
                  ) : alert.severity === AlertSeverity.WARNING ? (
                    <AlertTriangle size={16} className="text-yellow-400" />
                  ) : (
                    <Clock size={16} className="text-blue-400" />
                  )}
                  <span className="font-mono text-sm">{alert.message}</span>
                  <span className="font-mono text-xs opacity-60">{formatDate(alert.timestamp)}</span>
                  <span className="font-mono text-xs opacity-60 bg-white/10 px-2 py-1">{alert.source}</span>
                </div>
                <button
                  onClick={() => acknowledgeAlert(alert.id)}
                  className="px-2 py-1 border border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black transition-colors font-mono text-xs"
                >
                  ACK
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Services Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {services.map((service) => (
          <div
            key={service.id}
            className={`border p-4 cursor-pointer transition-colors hover:bg-white/5 ${getStatusColor(service.status)}`}
            onClick={() => setSelectedService(service.id)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                {getServiceIcon(service.type)}
                <div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(service.status)}
                    <span className="font-mono text-sm font-semibold">{service.name}</span>
                  </div>
                  <div className="font-mono text-xs opacity-60">{service.type.toUpperCase()}</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {service.url && (
                  <a
                    href={service.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="p-1 hover:bg-white/10 transition-colors"
                  >
                    <ExternalLink size={12} />
                  </a>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedService(service.id);
                  }}
                  className="p-1 hover:bg-white/10 transition-colors"
                >
                  <Eye size={12} />
                </button>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs opacity-60">Uptime</span>
                <span className="font-mono text-xs">{formatUptime(service.uptime)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs opacity-60">Response Time</span>
                <span className="font-mono text-xs">{service.responseTime}ms</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs opacity-60">Last Checked</span>
                <span className="font-mono text-xs">{formatDate(service.lastChecked)}</span>
              </div>
              {service.alerts.length > 0 && (
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs opacity-60">Alerts</span>
                  <span className="font-mono text-xs text-red-400">{service.alerts.length} active</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Service Details Modal */}
      {selectedSvc && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-black border border-white max-w-6xl w-full max-h-screen overflow-y-auto">
            <div className="p-4 border-b border-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getServiceIcon(selectedSvc.type)}
                <h3 className="font-mono text-lg">SERVICE DETAILS: {selectedSvc.name}</h3>
              </div>
              <button
                onClick={() => setSelectedService(null)}
                className="p-1 hover:bg-white/10 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="font-mono text-sm opacity-60">Service Name</label>
                    <div className="font-mono text-lg">{selectedSvc.name}</div>
                  </div>
                  <div>
                    <label className="font-mono text-sm opacity-60">Type</label>
                    <div className="font-mono">{selectedSvc.type.toUpperCase()}</div>
                  </div>
                  <div>
                    <label className="font-mono text-sm opacity-60">Status</label>
                    <div className={`flex items-center space-x-2 ${getStatusColor(selectedSvc.status)}`}>
                      {getStatusIcon(selectedSvc.status)}
                      <span className="font-mono uppercase">{selectedSvc.status}</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="font-mono text-sm opacity-60">Uptime</label>
                    <div className="font-mono text-lg">{formatUptime(selectedSvc.uptime)}</div>
                  </div>
                  <div>
                    <label className="font-mono text-sm opacity-60">Response Time</label>
                    <div className="font-mono">{selectedSvc.responseTime}ms</div>
                  </div>
                  {selectedSvc.url && (
                    <div>
                      <label className="font-mono text-sm opacity-60">URL</label>
                      <div className="font-mono">
                        <a
                          href={selectedSvc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          {selectedSvc.url}
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="font-mono text-sm opacity-60">Last Checked</label>
                    <div className="font-mono">{formatDate(selectedSvc.lastChecked)}</div>
                  </div>
                  <div>
                    <label className="font-mono text-sm opacity-60">Active Alerts</label>
                    <div className="font-mono">{selectedSvc.alerts.length}</div>
                  </div>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="border border-white/20 p-4">
                <h4 className="font-mono text-sm mb-4">SERVICE METRICS</h4>
                <div className="grid grid-cols-4 gap-4">
                  {renderServiceMetrics(selectedSvc).map((metric, i) => (
                    <div key={i} className="border border-white/10 p-3">
                      <div className="flex items-center space-x-2 mb-2">
                        <metric.icon size={14} />
                        <span className="font-mono text-xs">{metric.label}</span>
                      </div>
                      <div className="font-mono text-sm font-semibold">{metric.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Service Alerts */}
              {selectedSvc.alerts.length > 0 && (
                <div className="border border-yellow-400 bg-yellow-900/10">
                  <div className="bg-yellow-400/10 p-3 border-b border-yellow-400">
                    <h4 className="font-mono text-sm text-yellow-400">SERVICE ALERTS ({selectedSvc.alerts.length})</h4>
                  </div>
                  <div className="p-4 space-y-2">
                    {selectedSvc.alerts.map((alert) => (
                      <div key={alert.id} className="flex items-center justify-between py-2 border-b border-yellow-400/20 last:border-b-0">
                        <div className="flex items-center space-x-3">
                          <AlertTriangle size={16} className={alert.severity === AlertSeverity.CRITICAL ? 'text-red-400' : 'text-yellow-400'} />
                          <span className="font-mono text-sm">{alert.message}</span>
                          <span className="font-mono text-xs opacity-60">{formatDate(alert.timestamp)}</span>
                        </div>
                        <span className={`px-2 py-1 font-mono text-xs ${alert.severity === AlertSeverity.CRITICAL ? 'border-red-400 text-red-400' : 'border-yellow-400 text-yellow-400'} border`}>
                          {alert.severity.toUpperCase()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Infrastructure Status Modal */}
      {showInfrastructureDetails && infrastructureStatus && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-black border border-white max-w-6xl w-full max-h-screen overflow-y-auto">
            <div className="p-4 border-b border-white flex items-center justify-between">
              <h3 className="font-mono text-lg">INFRASTRUCTURE STATUS</h3>
              <button
                onClick={() => setShowInfrastructureDetails(false)}
                className="p-1 hover:bg-white/10 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Domain Accessibility */}
              <div className="border border-white/20 p-4">
                <h4 className="font-mono text-sm mb-4">DOMAIN ACCESSIBILITY</h4>
                <div className="space-y-2">
                  {infrastructureStatus.domainAccessibility.map((domain, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-white/10 last:border-b-0">
                      <div className="flex items-center space-x-3">
                        {domain.accessible ? (
                          <CheckCircle size={16} className="text-green-400" />
                        ) : (
                          <XCircle size={16} className="text-red-400" />
                        )}
                        <span className="font-mono text-sm">{domain.domain}</span>
                        <span className="font-mono text-xs opacity-60">{domain.responseTime}ms</span>
                        <span className="font-mono text-xs opacity-60">HTTP {domain.httpStatus}</span>
                        {domain.sslValid ? (
                          <Shield size={12} className="text-green-400" />
                        ) : (
                          <Shield size={12} className="text-red-400" />
                        )}
                      </div>
                      {domain.error && (
                        <span className="font-mono text-xs text-red-400">{domain.error}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Ingress Rules */}
              <div className="border border-white/20 p-4">
                <h4 className="font-mono text-sm mb-4">INGRESS RULES</h4>
                <div className="space-y-2">
                  {infrastructureStatus.ingressRules.map((rule, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-white/10 last:border-b-0">
                      <div className="flex items-center space-x-3">
                        {rule.status === 'active' ? (
                          <CheckCircle size={16} className="text-green-400" />
                        ) : (
                          <XCircle size={16} className="text-red-400" />
                        )}
                        <span className="font-mono text-sm">{rule.name}</span>
                        <span className="font-mono text-xs opacity-60">{rule.host}{rule.path}</span>
                        <span className="font-mono text-xs opacity-60">→ {rule.backend}</span>
                      </div>
                      <span className="font-mono text-xs opacity-60">{rule.namespace}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Network Policies */}
              <div className="border border-white/20 p-4">
                <h4 className="font-mono text-sm mb-4">NETWORK POLICIES</h4>
                <div className="space-y-2">
                  {infrastructureStatus.networkPolicies.map((policy, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-white/10 last:border-b-0">
                      <div className="flex items-center space-x-3">
                        {policy.status === 'active' ? (
                          <CheckCircle size={16} className="text-green-400" />
                        ) : (
                          <XCircle size={16} className="text-red-400" />
                        )}
                        <span className="font-mono text-sm">{policy.name}</span>
                        <span className="font-mono text-xs opacity-60">{policy.rulesApplied} rules</span>
                        <span className="font-mono text-xs opacity-60">{policy.policyTypes.join(', ')}</span>
                      </div>
                      <span className="font-mono text-xs opacity-60">{policy.namespace}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Last Updated */}
      {lastUpdated && (
        <div className="text-center text-xs font-mono opacity-60">
          Last updated: {formatDate(lastUpdated)}
        </div>
      )}
    </div>
  );
};

export default ServiceHealthDashboard;