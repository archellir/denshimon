import { useState, useEffect, type FC } from 'react';
import { History, CheckCircle, XCircle, User, Calendar } from 'lucide-react';
import useDeploymentStore from '@stores/deploymentStore';

const HistoryTab: FC = () => {
  const [selectedDeployment] = useState<string>('');
  const { 
    history, 
    loading,
    fetchHistory
  } = useDeploymentStore();

  useEffect(() => {
    if (selectedDeployment) {
      fetchHistory(selectedDeployment);
    }
  }, [selectedDeployment, fetchHistory]);

  const getActionColor = (action: string) => {
    switch (action) {
      case 'create':
        return 'text-green-400';
      case 'update':
        return 'text-blue-400';
      case 'scale':
        return 'text-yellow-400';
      case 'restart':
        return 'text-orange-400';
      case 'delete':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusIcon = (success: boolean) => {
    return success ? CheckCircle : XCircle;
  };

  const getStatusColor = (success: boolean) => {
    return success ? 'text-green-400' : 'text-red-400';
  };

  return (
    <>
      {!selectedDeployment ? (
        <div className="border border-white/20 p-8 text-center">
          <History size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-mono mb-2">SELECT DEPLOYMENT</h3>
          <p className="text-gray-400">
            Choose a deployment from the dropdown to view its history.
          </p>
        </div>
      ) : loading.history ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, index) => (
            <div key={`skeleton-${index}`} className="border border-white/20 p-4 animate-pulse">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-4">
                  <div className="h-5 w-5 bg-white/10 rounded-full"></div>
                  <div>
                    <div className="h-5 bg-white/10 rounded w-24 mb-2"></div>
                    <div className="h-4 bg-white/10 rounded w-32"></div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="h-4 bg-white/10 rounded w-28 mb-1"></div>
                  <div className="h-3 bg-white/10 rounded w-20"></div>
                </div>
              </div>
              <div className="mt-3 space-y-2">
                <div className="h-4 bg-white/10 rounded w-48"></div>
                <div className="h-4 bg-white/10 rounded w-40"></div>
              </div>
            </div>
          ))}
        </div>
      ) : history.length === 0 ? (
        <div className="border border-white/20 p-8 text-center">
          <History size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-mono mb-2">NO HISTORY</h3>
          <p className="text-gray-400">
            No history records found for this deployment.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((record) => {
            const StatusIcon = getStatusIcon(record.success);
            return (
              <div key={record.id} className="border border-white/20 p-4 hover:border-white/40 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <StatusIcon size={20} className={getStatusColor(record.success)} />
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className={`font-mono font-bold ${getActionColor(record.action)}`}>
                          {record.action.toUpperCase()}
                        </span>
                        {!record.success && (
                          <span className="text-red-400 font-mono text-sm">FAILED</span>
                        )}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-400">
                        <div className="flex items-center space-x-1">
                          <Calendar size={12} />
                          <span>{new Date(record.timestamp).toLocaleString()}</span>
                        </div>
                        {record.user && (
                          <div className="flex items-center space-x-1">
                            <User size={12} />
                            <span>{record.user}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Details */}
                <div className="ml-8 space-y-2">
                  {record.action === 'update' && record.oldImage && record.newImage && (
                    <div className="text-sm">
                      <div className="text-gray-400">Image updated:</div>
                      <div className="font-mono">
                        <span className="text-red-400">{record.oldImage}</span>
                        <span className="text-gray-400"> → </span>
                        <span className="text-green-400">{record.newImage}</span>
                      </div>
                    </div>
                  )}
                  
                  {record.action === 'scale' && record.oldReplicas !== undefined && record.newReplicas !== undefined && (
                    <div className="text-sm">
                      <div className="text-gray-400">Replicas changed:</div>
                      <div className="font-mono">
                        <span className="text-red-400">{record.oldReplicas}</span>
                        <span className="text-gray-400"> → </span>
                        <span className="text-green-400">{record.newReplicas}</span>
                      </div>
                    </div>
                  )}

                  {record.error && (
                    <div className="text-sm p-2 border border-red-400/20 bg-red-900/10">
                      <div className="text-red-400 font-mono">{record.error}</div>
                    </div>
                  )}

                  {record.metadata && Object.keys(record.metadata).length > 0 && (
                    <details className="text-sm">
                      <summary className="text-gray-400 cursor-pointer hover:text-white">
                        Additional Details
                      </summary>
                      <div className="mt-2 p-2 border border-white/10 bg-white/5 font-mono text-xs">
                        <pre>{JSON.stringify(record.metadata, null, 2)}</pre>
                      </div>
                    </details>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
};

export default HistoryTab;