import { useEffect, useState } from 'react';
import type { FC } from 'react';
import { Plus, Database, Eye, Trash2, Power, PowerOff, Settings, Activity } from 'lucide-react';
import StatusIcon, { getStatusColor } from '@components/common/StatusIcon';
import CustomButton from '@components/common/CustomButton';
import ConfirmDialog from '@components/common/ConfirmDialog';
import SkeletonLoader from '@components/common/SkeletonLoader';
import useDatabaseStore from '@stores/databaseStore';
import { DatabaseStatus, DatabaseType } from '@/types/database';
import { Status } from '@constants';

interface DatabaseGridProps {
  onAddConnection: () => void;
  onUseConnection: (connectionId: string) => void;
}

const DatabaseGrid: FC<DatabaseGridProps> = ({ onAddConnection, onUseConnection }) => {
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
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; connectionId: string; connectionName: string }>({
    isOpen: false,
    connectionId: '',
    connectionName: ''
  });
  const [disconnectDialog, setDisconnectDialog] = useState<{ isOpen: boolean; connectionId: string; connectionName: string }>({
    isOpen: false,
    connectionId: '',
    connectionName: ''
  });
  const [settingsDialog, setSettingsDialog] = useState<{ isOpen: boolean; connectionId: string; connectionName: string }>({
    isOpen: false,
    connectionId: '',
    connectionName: ''
  });

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
    await deleteConnection(id);
  };

  const openDeleteDialog = (id: string, name: string) => {
    setDeleteDialog({ isOpen: true, connectionId: id, connectionName: name });
  };

  const openDisconnectDialog = (id: string, name: string) => {
    setDisconnectDialog({ isOpen: true, connectionId: id, connectionName: name });
  };

  const openSettingsDialog = (id: string, name: string) => {
    setSettingsDialog({ isOpen: true, connectionId: id, connectionName: name });
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
        <div className="min-h-96">
          <SkeletonLoader variant="card" count={3} />
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
            <CustomButton
              label="ADD CONNECTION"
              icon={Plus}
              onClick={onAddConnection}
              color="green"
              className="mx-auto"
            />
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
                      <CustomButton
                        icon={isConnecting ? Activity : PowerOff}
                        onClick={() => openDisconnectDialog(connection.id, connection.name)}
                        disabled={isConnecting}
                        color="red"
                        className="w-auto px-1 py-1"
                        title="Disconnect"
                      />
                    ) : (
                      <CustomButton
                        icon={isConnecting ? Activity : Power}
                        onClick={() => handleConnect(connection.id)}
                        disabled={isConnecting}
                        color="green"
                        className="w-auto px-1 py-1"
                        title="Connect"
                      />
                    )}
                    
                    <CustomButton
                      icon={Eye}
                      onClick={() => onUseConnection(connection.id)}
                      disabled={connection.status !== DatabaseStatus.CONNECTED}
                      color="blue"
                      className="w-auto px-1 py-1"
                      title="Use Connection"
                    />
                  </div>

                  <div className="flex items-center space-x-1">
                    <CustomButton
                      icon={Settings}
                      onClick={() => openSettingsDialog(connection.id, connection.name)}
                      color="white"
                      className="w-auto px-1 py-1"
                      title="Settings"
                    />
                    
                    <CustomButton
                      icon={Trash2}
                      onClick={() => openDeleteDialog(connection.id, connection.name)}
                      color="red"
                      className="w-auto px-1 py-1"
                      title="Delete"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dialogs */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, connectionId: '', connectionName: '' })}
        onConfirm={() => handleDelete(deleteDialog.connectionId)}
        title="Delete Database Connection"
        message={`Are you sure you want to delete the database connection "${deleteDialog.connectionName}"? This action cannot be undone.`}
        confirmLabel="DELETE"
        confirmColor="red"
        icon="danger"
      />

      <ConfirmDialog
        isOpen={disconnectDialog.isOpen}
        onClose={() => setDisconnectDialog({ isOpen: false, connectionId: '', connectionName: '' })}
        onConfirm={() => handleDisconnect(disconnectDialog.connectionId)}
        title="Disconnect Database"
        message={`Are you sure you want to disconnect from "${disconnectDialog.connectionName}"? Any active queries will be terminated.`}
        confirmLabel="DISCONNECT"
        confirmColor="red"
        icon="warning"
      />

      <ConfirmDialog
        isOpen={settingsDialog.isOpen}
        onClose={() => setSettingsDialog({ isOpen: false, connectionId: '', connectionName: '' })}
        onConfirm={() => {
          // Settings functionality placeholder
          console.log('Open settings for:', settingsDialog.connectionId);
        }}
        title="Connection Settings"
        message={`Configure settings for database connection "${settingsDialog.connectionName}".`}
        confirmLabel="OPEN SETTINGS"
        confirmColor="blue"
        icon="warning"
      />
    </div>
  );
};

export default DatabaseGrid;