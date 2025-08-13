import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { Wifi, WifiOff, Loader } from 'lucide-react';
import { getWebSocketInstance } from '@/services/websocket';

const GitOpsWebSocketStatus: FC = () => {
  const [connectionState, setConnectionState] = useState<string>('disconnected');
  const [reconnectAttempts, setReconnectAttempts] = useState<number>(0);

  useEffect(() => {
    const ws = getWebSocketInstance();
    if (!ws) return;

    // Subscribe to connection state changes
    const subscriptionId = ws.subscribe('connection', (data: any) => {
      setConnectionState(data.state);
      setReconnectAttempts(data.reconnectAttempts || 0);
    });

    // Get initial state
    setConnectionState(ws.getConnectionState());

    return () => {
      ws.unsubscribe(subscriptionId);
    };
  }, []);

  const getStatusIcon = () => {
    switch (connectionState) {
      case 'connected':
        return <Wifi size={16} className="text-green-400" />;
      case 'connecting':
        return <Loader size={16} className="text-yellow-400 animate-spin" />;
      case 'disconnected':
      case 'error':
        return <WifiOff size={16} className="text-red-400" />;
      default:
        return <WifiOff size={16} className="text-gray-400" />;
    }
  };

  const getStatusText = () => {
    switch (connectionState) {
      case 'connected':
        return 'REAL-TIME ACTIVE';
      case 'connecting':
        return 'CONNECTING...';
      case 'disconnected':
        return reconnectAttempts > 0 ? `RECONNECTING (${reconnectAttempts})` : 'DISCONNECTED';
      case 'error':
        return 'CONNECTION ERROR';
      default:
        return 'UNKNOWN';
    }
  };

  const getStatusColor = () => {
    switch (connectionState) {
      case 'connected':
        return 'text-green-400';
      case 'connecting':
        return 'text-yellow-400';
      case 'disconnected':
      case 'error':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="flex items-center space-x-2 px-3 py-1 border border-current">
      {getStatusIcon()}
      <span className={`font-mono text-xs ${getStatusColor()}`}>
        {getStatusText()}
      </span>
    </div>
  );
};

export default GitOpsWebSocketStatus;