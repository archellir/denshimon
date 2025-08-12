import { useState, useEffect, FC } from 'react';
import { notificationService } from '@services/notifications';
import NotificationToast, { type NotificationData } from './NotificationToast';

interface NotificationContainerProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  maxNotifications?: number;
}

const NotificationContainer: FC<NotificationContainerProps> = ({
  position = 'top-right',
  maxNotifications = 5
}) => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);

  useEffect(() => {
    const unsubscribe = notificationService.subscribe((newNotifications) => {
      setNotifications(newNotifications.slice(0, maxNotifications));
    });

    return unsubscribe;
  }, [maxNotifications]);

  const handleClose = (id: string) => {
    notificationService.remove(id);
  };

  const getStackedPosition = (index: number) => {
    const offset = index * 140;
    switch (position) {
      case 'top-left':
        return { top: `${16 + offset}px`, left: '16px' };
      case 'bottom-right':
        return { bottom: `${16 + offset}px`, right: '16px' };
      case 'bottom-left':
        return { bottom: `${16 + offset}px`, left: '16px' };
      default:
        return { top: `${16 + offset}px`, right: '16px' };
    }
  };
  
  return (
    <div className="fixed z-[9999] pointer-events-none" style={{ top: 0, left: 0, right: 0, bottom: 0 }}>
      {notifications.map((notification, index) => (
        <div
          key={notification.id}
          className="absolute pointer-events-auto"
          style={getStackedPosition(index)}
        >
          <NotificationToast
            notification={notification}
            onClose={handleClose}
            position={position}
          />
        </div>
      ))}
    </div>
  );
};

export default NotificationContainer;