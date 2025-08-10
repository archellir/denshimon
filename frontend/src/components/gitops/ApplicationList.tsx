import { useState } from 'react';
import type { FC } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { 
  Package, 
  RotateCw, 
  Trash2, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  Eye,
  Heart,
  Pause
} from 'lucide-react';
import useGitOpsStore from '@stores/gitopsStore';
import type { Application } from '@types/gitops';

interface ApplicationListProps {
  onShowDetails: (application: Application) => void;
}

const ApplicationList: FC<ApplicationListProps> = ({ onShowDetails }) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  
  const {
    getFilteredApplications,
    deleteApplication,
    syncApplication,
    isSyncing,
  } = useGitOpsStore();

  const applications = getFilteredApplications();

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete application "${name}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingId(id);
    try {
      await deleteApplication(id);
    } catch (error) {
      console.error('Failed to delete application:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleSync = async (id: string) => {
    setSyncingId(id);
    try {
      await syncApplication(id);
    } catch (error) {
      console.error('Failed to sync application:', error);
    } finally {
      setSyncingId(null);
    }
  };

  const getSyncStatusIcon = (status: string) => {
    switch (status) {
      case 'synced':
        return <CheckCircle size={16} className="text-green-400" />;
      case 'out_of_sync':
        return <AlertCircle size={16} className="text-yellow-400" />;
      case 'error':
        return <AlertCircle size={16} className="text-red-400" />;
      default:
        return <Clock size={16} className="text-gray-400" />;
    }
  };

  const getHealthStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Heart size={16} className="text-green-400" />;
      case 'progressing':
        return <RotateCw size={16} className="text-blue-400" />;
      case 'degraded':
        return <AlertCircle size={16} className="text-red-400" />;
      case 'suspended':
        return <Pause size={16} className="text-gray-400" />;
      case 'missing':
        return <AlertCircle size={16} className="text-red-400" />;
      default:
        return <Clock size={16} className="text-gray-400" />;
    }
  };

  const getStatusColor = (status: string, type: string = 'sync') => {
    if (type === 'health') {
      switch (status) {
        case 'healthy':
          return 'text-green-400 border-green-400';
        case 'progressing':
          return 'text-blue-400 border-blue-400';
        case 'degraded':
        case 'missing':
          return 'text-red-400 border-red-400';
        case 'suspended':
          return 'text-gray-400 border-gray-400';
        default:
          return 'text-yellow-400 border-yellow-400';
      }
    }

    switch (status) {
      case 'synced':
        return 'text-green-400 border-green-400';
      case 'out_of_sync':
        return 'text-yellow-400 border-yellow-400';
      case 'error':
        return 'text-red-400 border-red-400';
      default:
        return 'text-gray-400 border-gray-400';
    }
  };

  const formatLastSync = (lastSync: string | null) => {
    if (!lastSync) return 'NEVER';
    return formatDistanceToNow(new Date(lastSync), { addSuffix: true }).toUpperCase();
  };

  if (applications.length === 0) {
    return (
      <div className="text-center py-12">
        <Package size={48} className="mx-auto mb-4 opacity-40" />
        <h3 className="text-lg font-mono mb-2">NO APPLICATIONS FOUND</h3>
        <p className="font-mono text-sm opacity-60">
          Create your first application to start deploying from Git repositories.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {applications.map((app) => (
        <div key={app.id} className="border border-white bg-black">
          {/* Header */}
          <div className="p-4 border-b border-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Package size={20} className="text-white" />
                <div>
                  <h3 className="font-mono text-lg">{app.name}</h3>
                  <p className="font-mono text-sm opacity-60">
                    Namespace: {app.namespace} • Path: {app.path || '.'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {/* Health Status */}
                <div className={`px-2 py-1 border ${getStatusColor(app.health_status, 'health')} font-mono text-xs`}>
                  <div className="flex items-center space-x-1">
                    {getHealthStatusIcon(app.health_status)}
                    <span>{app.health_status.toUpperCase()}</span>
                  </div>
                </div>

                {/* Sync Status */}
                <div className={`px-2 py-1 border ${getStatusColor(app.sync_status)} font-mono text-xs`}>
                  <div className="flex items-center space-x-1">
                    {getSyncStatusIcon(app.sync_status)}
                    <span>{app.sync_status.toUpperCase()}</span>
                  </div>
                </div>
                
                <button
                  onClick={() => onShowDetails(app)}
                  className="p-2 border border-white hover:bg-white hover:text-black transition-colors"
                  title="View Details"
                >
                  <Eye size={16} />
                </button>
                
                <button
                  onClick={() => handleSync(app.id)}
                  disabled={isSyncing || syncingId === app.id}
                  className="p-2 border border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Sync Application"
                >
                  <RotateCw size={16} className={syncingId === app.id ? 'animate-spin' : ''} />
                </button>
                
                <button
                  onClick={() => handleDelete(app.id, app.name)}
                  disabled={deletingId === app.id}
                  className="p-2 border border-red-400 text-red-400 hover:bg-red-400 hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Delete Application"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            {/* Repository Info */}
            <div className="p-4 border-b md:border-b-0 md:border-r border-white">
              <div className="text-xs font-mono opacity-60 mb-1">REPOSITORY</div>
              <div className="font-mono text-sm">{app.repository_id.substring(0, 8)}...</div>
            </div>

            {/* Namespace */}
            <div className="p-4 border-b md:border-b-0 lg:border-r border-white">
              <div className="text-xs font-mono opacity-60 mb-1">NAMESPACE</div>
              <div className="font-mono text-sm">{app.namespace}</div>
            </div>

            {/* Last Sync */}
            <div className="p-4 border-b lg:border-b-0 lg:border-r border-white">
              <div className="text-xs font-mono opacity-60 mb-1">LAST SYNC</div>
              <div className="font-mono text-sm">{formatLastSync(app.last_sync)}</div>
            </div>

            {/* Created */}
            <div className="p-4">
              <div className="text-xs font-mono opacity-60 mb-1">CREATED</div>
              <div className="font-mono text-sm">
                {formatDistanceToNow(new Date(app.created_at), { addSuffix: true }).toUpperCase()}
              </div>
            </div>
          </div>

          {/* Sync Policy */}
          {app.sync_policy && Object.keys(app.sync_policy).length > 0 && (
            <div className="p-4 border-t border-white">
              <div className="text-xs font-mono opacity-60 mb-2">SYNC POLICY</div>
              <div className="flex flex-wrap gap-2">
                {app.sync_policy.auto_sync && (
                  <span className="px-2 py-1 border border-green-400 text-green-400 text-xs font-mono">
                    AUTO-SYNC
                  </span>
                )}
                {app.sync_policy.prune && (
                  <span className="px-2 py-1 border border-yellow-400 text-yellow-400 text-xs font-mono">
                    PRUNE
                  </span>
                )}
                {app.sync_policy.self_heal && (
                  <span className="px-2 py-1 border border-blue-400 text-blue-400 text-xs font-mono">
                    SELF-HEAL
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Error Message */}
          {app.sync_error && (
            <div className="p-4 border-t border-white bg-red-900/20">
              <div className="flex items-start space-x-2">
                <AlertCircle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-xs font-mono text-red-400 mb-1">SYNC ERROR</div>
                  <div className="font-mono text-sm text-red-300">{app.sync_error}</div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="p-4 border-t border-white bg-gray-900/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-xs font-mono opacity-60">
                <span>ID: {app.id.substring(0, 8)}...</span>
                <span>PATH: {app.path || '.'}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono opacity-60">
                  KUBECTL CONTEXT: DEFAULT
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ApplicationList;