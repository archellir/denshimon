import { useState, useEffect, FC } from 'react';
import { X, AlertTriangle, AlertCircle, Info, CheckCircle } from 'lucide-react';
import { Status, STATUS_COLORS } from '@/constants';

export interface NotificationData {
  id: string;
  title: string;
  message: string;
  severity: Status;
  timestamp: string;
  source?: string;
  namespace?: string;
  autoClose?: boolean;
  duration?: number;
}

interface NotificationToastProps {
  notification: NotificationData;
  onClose: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

const NotificationToast: FC<NotificationToastProps> = ({
  notification,
  onClose,
  position = 'top-right'
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Entrance animation
    const timer = setTimeout(() => setIsVisible(true), 10);
    
    // Auto close
    let autoCloseTimer: number;
    if (notification.autoClose !== false) {
      const duration = notification.duration || (notification.severity === Status.CRITICAL ? 10000 : 5000);
      autoCloseTimer = setTimeout(() => {
        handleClose();
      }, duration) as unknown as number;
    }

    return () => {
      clearTimeout(timer);
      if (autoCloseTimer) clearTimeout(autoCloseTimer);
    };
  }, [notification.autoClose, notification.duration, notification.severity]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose(notification.id);
    }, 300);
  };

  const getSeverityIcon = () => {
    switch (notification.severity) {
      case Status.CRITICAL:
      case Status.ERROR:
        return <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />;
      case Status.WARNING:
        return <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0" />;
      case Status.SUCCESS:
        return <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />;
      default:
        return <Info className="w-5 h-5 text-blue-500 flex-shrink-0" />;
    }
  };

  const getSeverityColors = () => {
    const borderColor = STATUS_COLORS.BORDER[notification.severity] || STATUS_COLORS.BORDER[Status.UNKNOWN];
    switch (notification.severity) {
      case Status.CRITICAL:
      case Status.ERROR:
        return `${borderColor} bg-black/80`;
      case Status.WARNING:
        return `${borderColor} bg-black/80`;
      case Status.SUCCESS:
        return `${borderColor} bg-black/80`;
      default:
        return `${borderColor} bg-black/80`;
    }
  };


  const formatTimestamp = () => {
    return new Date(notification.timestamp).toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div
      className={`transform transition-all duration-300 ${
        isVisible && !isExiting
          ? 'translate-x-0 opacity-100'
          : position.includes('right')
          ? 'translate-x-full opacity-0'
          : '-translate-x-full opacity-0'
      }`}
    >
      <div className={`w-80 max-w-sm border-2 ${getSeverityColors()} p-3 font-mono text-sm shadow-lg`}>
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center space-x-2 flex-1">
            {getSeverityIcon()}
            <div className="flex-1">
              <div className="font-bold text-white">{notification.title}</div>
              <div className="text-xs text-gray-400">
                {formatTimestamp()}
                {notification.source && (
                  <span className="ml-2">• {notification.source}</span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors flex-shrink-0 ml-2"
          >
            <X size={16} />
          </button>
        </div>

        {/* Message */}
        <div className="text-white/90 mb-1 break-words text-xs">
          {notification.message}
        </div>

        {/* Metadata */}
        {notification.namespace && (
          <div className="text-xs text-gray-500 border-t border-white/10 pt-2">
            Namespace: <span className="text-purple-400">{notification.namespace}</span>
          </div>
        )}

        {/* Progress bar for auto-close */}
        {notification.autoClose !== false && (
          <div className="mt-2 h-1 bg-white/10 rounded overflow-hidden">
            <div
              className={`h-full bg-current opacity-50 rounded transition-all ease-linear ${
                notification.severity === Status.CRITICAL ? 'duration-[10000ms]' : 'duration-[5000ms]'
              }`}
              style={{
                width: isVisible && !isExiting ? '0%' : '100%',
                transition: isVisible && !isExiting 
                  ? `width ${notification.duration || (notification.severity === Status.CRITICAL ? 10000 : 5000)}ms linear`
                  : 'none'
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationToast;