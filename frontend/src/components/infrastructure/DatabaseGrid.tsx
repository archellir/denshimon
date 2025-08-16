import { useEffect, useState } from 'react';
import type { FC } from 'react';
import { Plus, Database, Eye, Trash2, Power, PowerOff, Settings, Activity } from 'lucide-react';
import StatusIcon, { getStatusColor } from '@components/common/StatusIcon';
import useDatabaseStore from '@stores/databaseStore';
import { DatabaseStatus, DatabaseType } from '@/types/database';
import { Status } from '@constants';

interface DatabaseGridProps {
  onAddConnection: () => void;
  onViewConnection: (id: string) => void;
}

const DatabaseGrid: FC<DatabaseGridProps> = ({ onAddConnection, onViewConnection }) => {
  const {
    connections,
    isLoading,
    error,
    fetchConnections,
    connectDatabase,
    disconnectDatabase,
    deleteConnection,
    clearError
  } = useDatabaseStore();

  const [connectingIds, setConnectingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  const getStatusFromDatabaseStatus = (dbStatus: DatabaseStatus): Status => {
    switch (dbStatus) {
      case DatabaseStatus.CONNECTED:
        return Status.HEALTHY;
      case DatabaseStatus.CONNECTING:
        return Status.WARNING;
      case DatabaseStatus.ERROR:
        return Status.CRITICAL;
      case DatabaseStatus.DISCONNECTED:
      default:
        return Status.UNKNOWN;
    }
  };

  const getDatabaseTypeIcon = (type: DatabaseType) => {
    switch (type) {
      case DatabaseType.POSTGRESQL:
        return '🐘'; // PostgreSQL elephant
      case DatabaseType.SQLITE:
        return '📁'; // SQLite file
      default:
        return '💾';
    }
  };

  const getDatabaseTypeLabel = (type: DatabaseType) => {
    switch (type) {
      case DatabaseType.POSTGRESQL:
        return 'PostgreSQL';
      case DatabaseType.SQLITE:
        return 'SQLite';
      default:
        return String(type).toUpperCase();
    }
  };

  const handleConnect = async (id: string) => {
    setConnectingIds(prev => new Set(prev).add(id));
    try {
      await connectDatabase(id);
    } finally {
      setConnectingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const handleDisconnect = async (id: string) => {
    setConnectingIds(prev => new Set(prev).add(id));
    try {
      await disconnectDatabase(id);
    } finally {
      setConnectingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this database connection?')) {
      await deleteConnection(id);
    }
  };

  if (error) {
    return (
      <div className="min-h-96 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-red-400 font-mono text-lg">
            ERROR: {error}
          </div>
          <button
            onClick={() => {
              clearError();
              fetchConnections();
            }}
            className="px-4 py-2 border border-red-400 text-red-400 hover:bg-red-400 hover:text-black transition-colors font-mono"
          >
            RETRY
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Grid */}
      {isLoading && connections.length === 0 ? (
        <div className="min-h-96 flex items-center justify-center">
          <div className="flex items-center space-x-2 text-white font-mono">
            <Activity className="animate-spin" size={20} />
            <span>LOADING CONNECTIONS...</span>
          </div>
        </div>
      ) : connections.length === 0 ? (
        <div className="min-h-96 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Database size={48} className="mx-auto opacity-40" />
            <div className="space-y-2">
              <h3 className="text-lg font-mono">NO DATABASE CONNECTIONS</h3>
              <p className="text-sm font-mono opacity-60">
                Add your first database connection to get started
              </p>
            </div>
            <button
              onClick={onAddConnection}
              className="flex items-center space-x-2 px-4 py-2 border border-green-400 text-green-400 hover:bg-green-400 hover:text-black transition-colors font-mono text-sm mx-auto"
            >
              <Plus size={16} />
              <span>ADD CONNECTION</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {connections.map((connection) => {
            const isConnecting = connectingIds.has(connection.id);
            const status = getStatusFromDatabaseStatus(connection.status);
            
            return (
              <div
                key={connection.id}
                className={`border ${getStatusColor(status)} p-4 hover:bg-white/5 transition-colors`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getDatabaseTypeIcon(connection.type)}</span>
                    <div>
                      <h3 className="font-mono font-semibold">{connection.name}</h3>
                      <p className="text-xs font-mono opacity-60">
                        {getDatabaseTypeLabel(connection.type)}
                      </p>
                    </div>
                  </div>
                  <StatusIcon status={status} size={16} />
                </div>

                {/* Connection Details */}
                <div className="space-y-1 mb-4 text-xs font-mono opacity-80">
                  {connection.type === DatabaseType.POSTGRESQL ? (
                    <>
                      <div>HOST: {connection.host}:{connection.port}</div>
                      <div>DATABASE: {connection.database}</div>
                      <div>USER: {connection.username}</div>
                    </>
                  ) : (
                    <div>FILE: {connection.filePath}</div>
                  )}
                </div>

                {/* Status */}
                <div className="mb-4">
                  <div className={`text-xs font-mono px-2 py-1 border inline-block ${getStatusColor(status)}`}>
                    {connection.status.toUpperCase()}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between space-x-2">
                  <div className="flex items-center space-x-1">
                    {connection.status === DatabaseStatus.CONNECTED ? (
                      <button
                        onClick={() => handleDisconnect(connection.id)}
                        disabled={isConnecting}
                        className="p-1 border border-red-400 text-red-400 hover:bg-red-400 hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Disconnect"
                      >
                        {isConnecting ? (
                          <Activity size={12} className="animate-spin" />
                        ) : (
                          <PowerOff size={12} />
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleConnect(connection.id)}
                        disabled={isConnecting}
                        className="p-1 border border-green-400 text-green-400 hover:bg-green-400 hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Connect"
                      >
                        {isConnecting ? (
                          <Activity size={12} className="animate-spin" />
                        ) : (
                          <Power size={12} />
                        )}
                      </button>
                    )}
                    
                    <button
                      onClick={() => onViewConnection(connection.id)}
                      disabled={connection.status !== DatabaseStatus.CONNECTED}
                      className="p-1 border border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-black transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      title="View Database"
                    >
                      <Eye size={12} />
                    </button>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      className="p-1 border border-white text-white hover:bg-white hover:text-black transition-colors"
                      title="Settings"
                    >
                      <Settings size={12} />
                    </button>
                    
                    <button
                      onClick={() => handleDelete(connection.id)}
                      className="p-1 border border-red-400 text-red-400 hover:bg-red-400 hover:text-black transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DatabaseGrid;