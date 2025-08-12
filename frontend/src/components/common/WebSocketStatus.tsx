import React from 'react';
import { Wifi, WifiOff, RotateCcw, AlertCircle } from 'lucide-react';
import { useConnectionState } from '@hooks/useWebSocket';

const WebSocketStatus: React.FC = () => {
  const { data: connectionState } = useConnectionState();

  if (!connectionState) return null;

  const getStatusIcon = () => {
    switch (connectionState.state) {
      case 'connected':
        return <Wifi size={16} className="text-green-500" />;
      case 'connecting':
        return <RotateCcw size={16} className="text-yellow-500 animate-spin" />;
      case 'disconnected':
        return <WifiOff size={16} className="text-gray-500" />;
      case 'error':
        return <AlertCircle size={16} className="text-red-500" />;
      default:
        return <WifiOff size={16} className="text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    switch (connectionState.state) {
      case 'connected':
        return 'border-green-500 text-green-500';
      case 'connecting':
        return 'border-yellow-500 text-yellow-500';
      case 'disconnected':
        return 'border-gray-500 text-gray-500';
      case 'error':
        return 'border-red-500 text-red-500';
      default:
        return 'border-gray-500 text-gray-500';
    }
  };

  const getStatusText = () => {
    switch (connectionState.state) {
      case 'connected':
        return 'LIVE';
      case 'connecting':
        return 'CONNECTING';
      case 'disconnected':
        return connectionState.reconnectAttempts > 0 ? 'RECONNECTING' : 'OFFLINE';
      case 'error':
        return 'ERROR';
      default:
        return 'UNKNOWN';
    }
  };

  const getTooltipText = () => {
    switch (connectionState.state) {
      case 'connected':
        return 'Real-time updates active';
      case 'connecting':
        return 'Establishing connection...';
      case 'disconnected':
        return connectionState.reconnectAttempts > 0 
          ? `Reconnecting... (attempt ${connectionState.reconnectAttempts})`
          : 'Real-time updates offline';
      case 'error':
        return 'Connection error - check network';
      default:
        return 'Connection status unknown';
    }
  };

  return (
    <div className="relative group">
      <div className={`flex items-center space-x-2 px-3 py-1 border font-mono text-xs transition-all ${getStatusColor()}`}>
        {getStatusIcon()}
        <span>{getStatusText()}</span>
        {connectionState.reconnectAttempts > 0 && (
          <span className="text-xs opacity-60">
            ({connectionState.reconnectAttempts})
          </span>
        )}
      </div>
      
      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black border border-white text-xs font-mono whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
        {getTooltipText()}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white"></div>
      </div>

      {/* Pulse effect when connecting/reconnecting */}
      {(connectionState.state === 'connecting' || connectionState.reconnectAttempts > 0) && (
        <div className="absolute inset-0 border border-yellow-500 animate-pulse pointer-events-none"></div>
      )}
    </div>
  );
};

export default WebSocketStatus;