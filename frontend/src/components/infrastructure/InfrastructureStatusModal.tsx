import { useEffect, type FC } from 'react';
import { X, CheckCircle, XCircle, Shield } from 'lucide-react';
import type { InfrastructureStatus } from '@/types/serviceHealth';
import { Status } from '@constants';

interface InfrastructureStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  infrastructureStatus: InfrastructureStatus | null;
}

const InfrastructureStatusModal: FC<InfrastructureStatusModalProps> = ({
  isOpen,
  onClose,
  infrastructureStatus
}) => {
  // Handle ESC key
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !infrastructureStatus) {
    return null;
  }

  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-black border border-white max-w-6xl w-full max-h-screen overflow-y-auto">
        <div className="p-4 border-b border-white flex items-center justify-between">
          <h3 className="font-mono text-lg">INFRASTRUCTURE STATUS</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
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
  );
};

export default InfrastructureStatusModal;