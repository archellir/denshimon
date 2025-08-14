import { useEffect, useState } from 'react';
import type { FC } from 'react';
import { 
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
  Plus,
  Eye,
  Calendar,
  Server,
  Globe,
  AlertCircle,
  X
} from 'lucide-react';
import useCertificateStore from '@stores/certificateStore';
import { CertificateStatus } from '@/types/certificates';

const CertificateHealthDashboard: FC = () => {
  const {
    certificates,
    stats,
    alerts,
    domains,
    isLoading,
    error,
    lastUpdated,
    fetchCertificates,
    fetchCertificateStats,
    fetchAlerts,
    fetchDomains,
    refreshAllCertificates,
    acknowledgeAlert,
    clearError
  } = useCertificateStore();

  const [selectedCertificate, setSelectedCertificate] = useState<string | null>(null);
  const [showAddDomain, setShowAddDomain] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Load initial data
  useEffect(() => {
    fetchCertificates();
    fetchCertificateStats();
    fetchAlerts();
    fetchDomains();
  }, [fetchCertificates, fetchCertificateStats, fetchAlerts, fetchDomains]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchCertificates();
      fetchCertificateStats();
      fetchAlerts();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [autoRefresh, fetchCertificates, fetchCertificateStats, fetchAlerts]);

  const getStatusColor = (status: CertificateStatus) => {
    switch (status) {
      case CertificateStatus.VALID:
        return 'border-green-400 text-green-400';
      case CertificateStatus.EXPIRING_SOON:
        return 'border-yellow-400 text-yellow-400';
      case CertificateStatus.EXPIRING_CRITICAL:
        return 'border-red-400 text-red-400';
      case CertificateStatus.EXPIRED:
        return 'border-red-600 text-red-600';
      case CertificateStatus.INVALID:
        return 'border-purple-400 text-purple-400';
      case CertificateStatus.UNREACHABLE:
        return 'border-gray-400 text-gray-400';
      default:
        return 'border-white';
    }
  };

  const getStatusIcon = (status: CertificateStatus) => {
    switch (status) {
      case CertificateStatus.VALID:
        return <CheckCircle size={16} className="text-green-400" />;
      case CertificateStatus.EXPIRING_SOON:
        return <Clock size={16} className="text-yellow-400" />;
      case CertificateStatus.EXPIRING_CRITICAL:
        return <AlertTriangle size={16} className="text-red-400" />;
      case CertificateStatus.EXPIRED:
        return <XCircle size={16} className="text-red-600" />;
      case CertificateStatus.INVALID:
        return <AlertCircle size={16} className="text-purple-400" />;
      case CertificateStatus.UNREACHABLE:
        return <Globe size={16} className="text-gray-400" />;
      default:
        return <Shield size={16} />;
    }
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

  const selectedCert = certificates.find(cert => cert.id === selectedCertificate);

  return (
    <div className=\"space-y-6\">
      {/* Header */}
      <div className=\"flex items-center justify-between\">
        <div className=\"flex items-center space-x-4\">
          <h2 className=\"text-xl font-mono\">SSL CERTIFICATE MONITORING</h2>
          <div className=\"text-sm font-mono opacity-60\">
            {certificates.length} CERTIFICATE{certificates.length !== 1 ? 'S' : ''} MONITORED
          </div>
        </div>
        <div className=\"flex items-center space-x-2\">
          <div className=\"flex items-center space-x-2\">
            <input
              type=\"checkbox\"
              id=\"auto-refresh\"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className=\"bg-black border-white\"
            />
            <label htmlFor=\"auto-refresh\" className=\"font-mono text-sm\">
              AUTO REFRESH
            </label>
          </div>
          <button
            onClick={() => setShowAddDomain(true)}
            className=\"flex items-center space-x-2 px-3 py-2 border border-green-400 text-green-400 hover:bg-green-400 hover:text-black transition-colors font-mono text-sm\"
          >
            <Plus size={16} />
            <span>ADD DOMAIN</span>
          </button>
          <button
            onClick={refreshAllCertificates}
            disabled={isLoading}
            className=\"flex items-center space-x-2 px-3 py-2 border border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-black transition-colors font-mono text-sm disabled:opacity-50\"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            <span>REFRESH</span>
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className=\"p-4 border border-red-400 bg-red-900/20 text-red-400 font-mono text-sm flex items-center justify-between\">
          <div className=\"flex items-center space-x-2\">
            <AlertTriangle size={16} />
            <span>ERROR: {error}</span>
          </div>
          <button
            onClick={clearError}
            className=\"p-1 hover:bg-red-400/20 transition-colors\"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Statistics Cards */}
      {stats && (
        <div className=\"grid grid-cols-4 gap-4\">
          <div className=\"border border-green-400 p-4 text-green-400\">
            <div className=\"flex items-center justify-between mb-2\">
              <span className=\"font-mono text-sm\">VALID</span>
              <CheckCircle size={16} />
            </div>
            <div className=\"font-mono text-2xl\">{stats.valid}</div>
            <div className=\"font-mono text-xs opacity-60\">Certificates OK</div>
          </div>
          
          <div className=\"border border-yellow-400 p-4 text-yellow-400\">
            <div className=\"flex items-center justify-between mb-2\">
              <span className=\"font-mono text-sm\">EXPIRING SOON</span>
              <Clock size={16} />
            </div>
            <div className=\"font-mono text-2xl\">{stats.expiringSoon}</div>
            <div className=\"font-mono text-xs opacity-60\">< 30 days</div>
          </div>
          
          <div className=\"border border-red-400 p-4 text-red-400\">
            <div className=\"flex items-center justify-between mb-2\">
              <span className=\"font-mono text-sm\">CRITICAL</span>
              <AlertTriangle size={16} />
            </div>
            <div className=\"font-mono text-2xl\">{stats.expiringCritical + stats.expired}</div>
            <div className=\"font-mono text-xs opacity-60\">< 7 days / Expired</div>
          </div>
          
          <div className=\"border border-white p-4\">
            <div className=\"flex items-center justify-between mb-2\">
              <span className=\"font-mono text-sm\">TOTAL</span>
              <Shield size={16} />
            </div>
            <div className=\"font-mono text-2xl\">{stats.total}</div>
            <div className=\"font-mono text-xs opacity-60\">All certificates</div>
          </div>
        </div>
      )}

      {/* Active Alerts */}
      {alerts.length > 0 && (
        <div className=\"border border-yellow-400 bg-yellow-900/10\">
          <div className=\"bg-yellow-400/10 p-3 border-b border-yellow-400\">
            <h4 className=\"font-mono text-sm text-yellow-400\">ACTIVE ALERTS ({alerts.length})</h4>
          </div>
          <div className=\"p-4 space-y-2\">
            {alerts.slice(0, 5).map((alert) => (
              <div key={alert.id} className=\"flex items-center justify-between py-2 border-b border-yellow-400/20 last:border-b-0\">
                <div className=\"flex items-center space-x-3\">
                  {alert.severity === 'critical' ? (
                    <AlertTriangle size={16} className=\"text-red-400\" />
                  ) : (
                    <Clock size={16} className=\"text-yellow-400\" />
                  )}
                  <span className=\"font-mono text-sm\">{alert.message}</span>
                  <span className=\"font-mono text-xs opacity-60\">{formatDate(alert.timestamp)}</span>
                </div>
                <button
                  onClick={() => acknowledgeAlert(alert.id)}
                  className=\"px-2 py-1 border border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black transition-colors font-mono text-xs\"
                >
                  ACK
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Certificates Grid */}
      <div className=\"grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4\">
        {certificates.map((cert) => (
          <div
            key={cert.id}
            className={`border p-4 cursor-pointer transition-colors hover:bg-white/5 ${getStatusColor(cert.status)}`}
            onClick={() => setSelectedCertificate(cert.id)}
          >
            <div className=\"flex items-start justify-between mb-2\">
              <div className=\"flex items-center space-x-2\">
                {getStatusIcon(cert.status)}
                <span className=\"font-mono text-sm font-semibold\">{cert.domain}</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // Handle certificate actions
                }}
                className=\"p-1 hover:bg-white/10 transition-colors\"
              >
                <Eye size={14} />
              </button>
            </div>
            
            <div className=\"space-y-1\">
              <div className=\"flex items-center justify-between\">
                <span className=\"font-mono text-xs opacity-60\">Service</span>
                <span className=\"font-mono text-xs\">{cert.service}</span>
              </div>
              <div className=\"flex items-center justify-between\">
                <span className=\"font-mono text-xs opacity-60\">Issuer</span>
                <span className=\"font-mono text-xs\">{cert.issuer}</span>
              </div>
              <div className=\"flex items-center justify-between\">
                <span className=\"font-mono text-xs opacity-60\">Expires</span>
                <span className=\"font-mono text-xs\">{formatDate(cert.notAfter)}</span>
              </div>
              <div className=\"flex items-center justify-between\">
                <span className=\"font-mono text-xs opacity-60\">Days Left</span>
                <span className={`font-mono text-xs font-bold ${
                  cert.daysUntilExpiry <= 7 ? 'text-red-400' : 
                  cert.daysUntilExpiry <= 30 ? 'text-yellow-400' : 
                  'text-green-400'
                }`}>
                  {cert.daysUntilExpiry} days
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Certificate Details Modal */}
      {selectedCert && (
        <div className=\"fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50\">
          <div className=\"bg-black border border-white max-w-4xl w-full max-h-screen overflow-y-auto\">
            <div className=\"p-4 border-b border-white flex items-center justify-between\">
              <h3 className=\"font-mono text-lg\">CERTIFICATE DETAILS: {selectedCert.domain}</h3>
              <button
                onClick={() => setSelectedCertificate(null)}
                className=\"p-1 hover:bg-white/10 transition-colors\"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className=\"p-6 space-y-6\">
              {/* Basic Info */}
              <div className=\"grid grid-cols-2 gap-6\">
                <div className=\"space-y-4\">
                  <div>
                    <label className=\"font-mono text-sm opacity-60\">Domain</label>
                    <div className=\"font-mono text-lg\">{selectedCert.domain}</div>
                  </div>
                  <div>
                    <label className=\"font-mono text-sm opacity-60\">Service</label>
                    <div className=\"font-mono\">{selectedCert.service}</div>
                  </div>
                  <div>
                    <label className=\"font-mono text-sm opacity-60\">Status</label>
                    <div className={`flex items-center space-x-2 ${getStatusColor(selectedCert.status)}`}>
                      {getStatusIcon(selectedCert.status)}
                      <span className=\"font-mono uppercase\">{selectedCert.status.replace('_', ' ')}</span>
                    </div>
                  </div>
                </div>
                
                <div className=\"space-y-4\">
                  <div>
                    <label className=\"font-mono text-sm opacity-60\">Issuer</label>
                    <div className=\"font-mono\">{selectedCert.issuer}</div>
                  </div>
                  <div>
                    <label className=\"font-mono text-sm opacity-60\">Algorithm</label>
                    <div className=\"font-mono\">{selectedCert.algorithm}</div>
                  </div>
                  <div>
                    <label className=\"font-mono text-sm opacity-60\">Key Size</label>
                    <div className=\"font-mono\">{selectedCert.keySize} bits</div>
                  </div>
                </div>
              </div>

              {/* Validity Dates */}
              <div className=\"border border-white/20 p-4\">
                <h4 className=\"font-mono text-sm mb-3\">VALIDITY PERIOD</h4>
                <div className=\"grid grid-cols-2 gap-4\">
                  <div>
                    <label className=\"font-mono text-xs opacity-60\">Valid From</label>
                    <div className=\"font-mono text-sm\">{formatDate(selectedCert.notBefore)}</div>
                  </div>
                  <div>
                    <label className=\"font-mono text-xs opacity-60\">Valid Until</label>
                    <div className=\"font-mono text-sm\">{formatDate(selectedCert.notAfter)}</div>
                  </div>
                </div>
                <div className=\"mt-3 pt-3 border-t border-white/10\">
                  <div className=\"flex items-center justify-between\">
                    <span className=\"font-mono text-sm\">Days Until Expiry</span>
                    <span className={`font-mono text-lg font-bold ${
                      selectedCert.daysUntilExpiry <= 7 ? 'text-red-400' : 
                      selectedCert.daysUntilExpiry <= 30 ? 'text-yellow-400' : 
                      'text-green-400'
                    }`}>
                      {selectedCert.daysUntilExpiry} days
                    </span>
                  </div>
                </div>
              </div>

              {/* Technical Details */}
              <div className=\"border border-white/20 p-4\">
                <h4 className=\"font-mono text-sm mb-3\">TECHNICAL DETAILS</h4>
                <div className=\"space-y-2 font-mono text-xs\">
                  <div className=\"flex justify-between\">
                    <span className=\"opacity-60\">Serial Number:</span>
                    <span>{selectedCert.serialNumber}</span>
                  </div>
                  <div className=\"flex justify-between\">
                    <span className=\"opacity-60\">Fingerprint (SHA1):</span>
                    <span className=\"break-all\">{selectedCert.fingerprint}</span>
                  </div>
                  <div className=\"flex justify-between\">
                    <span className=\"opacity-60\">Subject:</span>
                    <span className=\"break-all\">{selectedCert.subject}</span>
                  </div>
                </div>
              </div>

              {/* Certificate Chain */}
              {selectedCert.chain && selectedCert.chain.length > 0 && (
                <div className=\"border border-white/20 p-4\">
                  <h4 className=\"font-mono text-sm mb-3\">CERTIFICATE CHAIN ({selectedCert.chain.length})</h4>
                  <div className=\"space-y-2\">
                    {selectedCert.chain.map((chainCert, index) => (
                      <div key={index} className=\"border border-white/10 p-3\">
                        <div className=\"flex items-center space-x-2 mb-2\">
                          <Server size={14} />
                          <span className=\"font-mono text-sm\">
                            {index === 0 ? 'Leaf Certificate' : `Intermediate ${index}`}
                          </span>
                        </div>
                        <div className=\"font-mono text-xs space-y-1\">
                          <div>Subject: {chainCert.subject}</div>
                          <div>Issuer: {chainCert.issuer}</div>
                          <div>Valid: {formatDate(chainCert.notBefore)} - {formatDate(chainCert.notAfter)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Last Updated */}
      {lastUpdated && (
        <div className=\"text-center text-xs font-mono opacity-60\">
          Last updated: {formatDate(lastUpdated)}
        </div>
      )}
    </div>
  );
};

export default CertificateHealthDashboard;