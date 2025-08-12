import type { FC } from 'react';
import { X, Package, Heart, RotateCw, Clock, CheckCircle, AlertCircle, Pause } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Application } from '@/types/gitops';

interface ApplicationDetailsProps {
  application: Application;
  onClose: () => void;
}

const ApplicationDetails: FC<ApplicationDetailsProps> = ({ application, onClose }) => {
  const getSyncStatusIcon = (status: string) => {
    switch (status) {
      case 'synced':
        return <CheckCircle size={20} className="text-green-400" />;
      case 'out_of_sync':
        return <AlertCircle size={20} className="text-yellow-400" />;
      case 'error':
        return <AlertCircle size={20} className="text-red-400" />;
      default:
        return <Clock size={20} className="text-gray-400" />;
    }
  };

  const getHealthStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Heart size={20} className="text-green-400" />;
      case 'progressing':
        return <RotateCw size={20} className="text-blue-400" />;
      case 'degraded':
        return <AlertCircle size={20} className="text-red-400" />;
      case 'suspended':
        return <Pause size={20} className="text-gray-400" />;
      case 'missing':
        return <AlertCircle size={20} className="text-red-400" />;
      default:
        return <Clock size={20} className="text-gray-400" />;
    }
  };

  const getStatusColor = (status: string, type: string = 'sync') => {
    if (type === 'health') {
      switch (status) {
        case 'healthy':
          return 'text-green-400';
        case 'progressing':
          return 'text-blue-400';
        case 'degraded':
        case 'missing':
          return 'text-red-400';
        case 'suspended':
          return 'text-gray-400';
        default:
          return 'text-yellow-400';
      }
    }

    switch (status) {
      case 'synced':
        return 'text-green-400';
      case 'out_of_sync':
        return 'text-yellow-400';
      case 'error':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-black border border-white max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Package size={24} />
            <div>
              <h2 className="text-xl font-mono">{application.name}</h2>
              <p className="text-sm font-mono opacity-60">Application Details</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white hover:text-black transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="border border-white p-4">
              <div className="flex items-center space-x-2 mb-2">
                {getHealthStatusIcon(application.health_status)}
                <span className={`font-mono text-sm ${getStatusColor(application.health_status, 'health')}`}>
                  {application.health_status.toUpperCase()}
                </span>
              </div>
              <div className="text-xs font-mono opacity-60">HEALTH STATUS</div>
            </div>

            <div className="border border-white p-4">
              <div className="flex items-center space-x-2 mb-2">
                {getSyncStatusIcon(application.sync_status)}
                <span className={`font-mono text-sm ${getStatusColor(application.sync_status)}`}>
                  {application.sync_status.toUpperCase()}
                </span>
              </div>
              <div className="text-xs font-mono opacity-60">SYNC STATUS</div>
            </div>

            <div className="border border-white p-4">
              <div className="font-mono text-lg mb-2">
                {application.last_sync ? formatDistanceToNow(new Date(application.last_sync), { addSuffix: true }).toUpperCase() : 'NEVER'}
              </div>
              <div className="text-xs font-mono opacity-60">LAST SYNC</div>
            </div>

            <div className="border border-white p-4">
              <div className="font-mono text-lg mb-2">{application.namespace}</div>
              <div className="text-xs font-mono opacity-60">NAMESPACE</div>
            </div>
          </div>

          {/* Application Information */}
          <div className="space-y-4">
            <h3 className="font-mono text-sm border-b border-white pb-2">APPLICATION INFORMATION</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-mono opacity-60 mb-1">NAME</label>
                  <div className="font-mono text-sm">{application.name}</div>
                </div>

                <div>
                  <label className="block text-xs font-mono opacity-60 mb-1">NAMESPACE</label>
                  <div className="font-mono text-sm">{application.namespace}</div>
                </div>

                <div>
                  <label className="block text-xs font-mono opacity-60 mb-1">PATH</label>
                  <div className="font-mono text-sm">{application.path || '.'}</div>
                </div>

                <div>
                  <label className="block text-xs font-mono opacity-60 mb-1">REPOSITORY ID</label>
                  <div className="font-mono text-sm text-blue-400">{application.repository_id}</div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-mono opacity-60 mb-1">CREATED</label>
                  <div className="font-mono text-sm">{formatDate(application.created_at)}</div>
                </div>

                <div>
                  <label className="block text-xs font-mono opacity-60 mb-1">LAST UPDATED</label>
                  <div className="font-mono text-sm">{formatDate(application.updated_at)}</div>
                </div>

                <div>
                  <label className="block text-xs font-mono opacity-60 mb-1">LAST SYNC</label>
                  <div className="font-mono text-sm">{formatDate(application.last_sync)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Sync Policy */}
          {application.sync_policy && Object.keys(application.sync_policy).length > 0 && (
            <div className="space-y-4">
              <h3 className="font-mono text-sm border-b border-white pb-2">SYNC POLICY</h3>
              
              <div className="border border-white p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className={`text-2xl mb-2 ${application.sync_policy.auto_sync ? 'text-green-400' : 'text-gray-400'}`}>
                      {application.sync_policy.auto_sync ? '✓' : '✗'}
                    </div>
                    <div className="font-mono text-xs">AUTO-SYNC</div>
                  </div>
                  
                  <div className="text-center">
                    <div className={`text-2xl mb-2 ${application.sync_policy.prune ? 'text-green-400' : 'text-gray-400'}`}>
                      {application.sync_policy.prune ? '✓' : '✗'}
                    </div>
                    <div className="font-mono text-xs">PRUNE</div>
                  </div>
                  
                  <div className="text-center">
                    <div className={`text-2xl mb-2 ${application.sync_policy.self_heal ? 'text-green-400' : 'text-gray-400'}`}>
                      {application.sync_policy.self_heal ? '✓' : '✗'}
                    </div>
                    <div className="font-mono text-xs">SELF-HEAL</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sync History */}
          <div className="space-y-4">
            <h3 className="font-mono text-sm border-b border-white pb-2">SYNC HISTORY</h3>
            
            <div className="border border-white">
              <div className="p-4 bg-gray-900/20 border-b border-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getSyncStatusIcon(application.sync_status)}
                    <span className="font-mono text-sm">
                      {application.last_sync ? formatDate(application.last_sync) : 'Never synced'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`font-mono text-xs px-2 py-1 border ${getStatusColor(application.health_status, 'health')} border-current`}>
                      {application.health_status.toUpperCase()}
                    </span>
                    <span className={`font-mono text-xs px-2 py-1 border ${getStatusColor(application.sync_status)} border-current`}>
                      {application.sync_status.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
              
              {application.sync_error && (
                <div className="p-4 border-b border-white bg-red-900/20">
                  <div className="flex items-start space-x-2">
                    <AlertCircle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-xs font-mono text-red-400 mb-1">SYNC ERROR</div>
                      <div className="font-mono text-sm text-red-300">{application.sync_error}</div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="p-4">
                <div className="text-xs font-mono opacity-60">
                  {application.sync_status === 'synced' 
                    ? 'Application is synchronized and deployed successfully.' 
                    : application.sync_status === 'out_of_sync'
                    ? 'Application has changes that need to be synchronized.'
                    : 'Application sync status unknown.'}
                </div>
              </div>
            </div>
          </div>

          {/* Resource Status */}
          <div className="space-y-4">
            <h3 className="font-mono text-sm border-b border-white pb-2">KUBERNETES RESOURCES</h3>
            
            <div className="border border-white p-4">
              <div className="text-center py-8">
                <Package size={32} className="mx-auto mb-2 opacity-40" />
                <div className="font-mono text-sm opacity-60">
                  Resource details would be shown here
                </div>
                <div className="font-mono text-xs opacity-40 mt-1">
                  (Feature not implemented in this demo)
                </div>
              </div>
            </div>
          </div>

          {/* Raw Data (for debugging) */}
          <div className="space-y-4">
            <details className="group">
              <summary className="font-mono text-sm border-b border-white pb-2 cursor-pointer hover:text-green-400">
                RAW DATA (DEBUG)
              </summary>
              <div className="mt-4 p-4 border border-white bg-gray-900/20">
                <pre className="font-mono text-xs overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(application, null, 2)}
                </pre>
              </div>
            </details>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-white flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-white font-mono hover:bg-white hover:text-black transition-colors"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApplicationDetails;