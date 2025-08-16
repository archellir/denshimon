import React from 'react';
import { Wifi, WifiOff, RotateCcw, AlertCircle } from 'lucide-react';
import { WebSocketState, UI_MESSAGES } from '@constants';

interface ConnectionStatusProps {
  isConnected: boolean;
  connectionState?: { state: WebSocketState };
  size?: 'sm' | 'md';
  showTooltip?: boolean;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ 
  isConnected, 
  connectionState,
  size = 'md',
  showTooltip = false 
}) => {
  const getStatusIcon = () => {
    const iconSize = size === 'sm' ? 14 : 16;
    
    switch (connectionState?.state) {
      case WebSocketState.CONNECTED:
        return <Wifi size={iconSize} className="text-green-500" />;
      case WebSocketState.CONNECTING:
        return <RotateCcw size={iconSize} className="text-yellow-500 animate-spin" />;
      case WebSocketState.DISCONNECTED:
        return <WifiOff size={iconSize} className="text-gray-500" />;
      case WebSocketState.ERROR:
        return <AlertCircle size={iconSize} className="text-red-500" />;
      default:
        return isConnected 
          ? <Wifi size={iconSize} className="text-green-500" />
          : <WifiOff size={iconSize} className="text-gray-500" />;
    }
  };

  const getConnectionColor = () => {
    switch (connectionState?.state) {
      case WebSocketState.CONNECTED:
        return 'border-green-500 text-green-500';
      case WebSocketState.CONNECTING:
        return 'border-yellow-500 text-yellow-500';
      case WebSocketState.DISCONNECTED:
        return 'border-gray-500 text-gray-500';
      case WebSocketState.ERROR:
        return 'border-red-500 text-red-500';
      default:
        return isConnected 
          ? 'border-green-500 text-green-500'
          : 'border-gray-500 text-gray-500';
    }
  };

  const getStatusText = () => {
    switch (connectionState?.state) {
      case WebSocketState.CONNECTED:
        return UI_MESSAGES.LIVE;
      case WebSocketState.CONNECTING:
        return UI_MESSAGES.CONNECTING;
      case WebSocketState.DISCONNECTED:
        return UI_MESSAGES.OFFLINE;
      case WebSocketState.ERROR:
        return UI_MESSAGES.ERROR;
      default:
        return isConnected ? UI_MESSAGES.LIVE : UI_MESSAGES.OFFLINE;
    }
  };

  const containerClasses = size === 'sm' 
    ? 'flex items-center space-x-1 px-2 py-1 border font-mono text-xs w-20 justify-center'
    : 'flex items-center space-x-2 px-4 py-2 border font-mono text-xs transition-all w-28 justify-center';

  if (showTooltip) {
    return (
      <div className="relative group">
        <div className={`${containerClasses} ${getConnectionColor()}`}>
          {getStatusIcon()}
          <span>{getStatusText()}</span>
        </div>
        
        {/* Tooltip */}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black border border-white text-xs font-mono whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
          {UI_MESSAGES.REAL_TIME_UPDATES} {connectionState?.state || (isConnected ? 'connected' : 'disconnected')}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white"></div>
        </div>

        {/* Pulse effect when connecting */}
        {connectionState?.state === WebSocketState.CONNECTING && (
          <div className="absolute inset-0 border border-yellow-500 animate-pulse pointer-events-none"></div>
        )}
      </div>
    );
  }

  return (
    <div className={`${containerClasses} ${getConnectionColor()}`}>
      {getStatusIcon()}
      <span>{getStatusText()}</span>
    </div>
  );
};

export default ConnectionStatus;