import { useEffect, useRef } from 'react';
import { getWebSocketInstance } from '@services/websocket';
import { notificationService } from '@services/notifications';
import { WebSocketEventType, Status, DASHBOARD_SECTIONS } from '@constants';
import useSettingsStore from '@stores/settingsStore';

interface AlertData {
  id: string;
  severity: Status;
  title: string;
  description: string;
  source: string;
  namespace?: string;
  timestamp: string;
  resolved: boolean;
}

export const useAlertNotifications = () => {
  const subscriptionIdRef = useRef<string | null>(null);
  const processedAlertsRef = useRef<Set<string>>(new Set());
  const { isSectionVisible } = useSettingsStore();

  useEffect(() => {
    const ws = getWebSocketInstance();
    if (!ws) return;

    subscriptionIdRef.current = ws.subscribe(WebSocketEventType.ALERTS, (data: Record<string, unknown>) => {
      const alertData = data as unknown as AlertData;
      if (!isSectionVisible(DASHBOARD_SECTIONS.NOTIFICATIONS)) {
        return;
      }

      if (processedAlertsRef.current.has(alertData.id)) {
        return;
      }

      if (alertData.resolved) {
        return;
      }

      let severity: Status;
      switch (alertData.severity) {
        case Status.CRITICAL:
          severity = Status.CRITICAL;
          break;
        case Status.WARNING:
          severity = Status.WARNING;
          break;
        case Status.INFO:
        default:
          severity = Status.INFO;
          break;
      }

      if (severity === Status.CRITICAL || severity === Status.WARNING) {
        notificationService.create({
          title: alertData.title,
          message: alertData.description,
          severity,
          source: alertData.source,
          namespace: alertData.namespace,
          autoClose: severity === Status.WARNING,
          duration: severity === Status.CRITICAL ? undefined : 8000
        });

        processedAlertsRef.current.add(alertData.id);
        
        if (processedAlertsRef.current.size > 50) {
          const alerts = Array.from(processedAlertsRef.current);
          processedAlertsRef.current = new Set(alerts.slice(-50));
        }
      }
    });

    return () => {
      if (subscriptionIdRef.current) {
        ws.unsubscribe(subscriptionIdRef.current);
      }
    };
  }, [isSectionVisible]);

  const testNotification = () => {
    notificationService.critical(
      'Test Critical Alert',
      'This is a test notification to verify the system is working',
      { 
        source: 'test-service',
        namespace: 'test-namespace' 
      }
    );
  };

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const timer = setTimeout(testNotification, 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  return {
    critical: notificationService.critical.bind(notificationService),
    error: notificationService.error.bind(notificationService),
    warning: notificationService.warning.bind(notificationService),
    success: notificationService.success.bind(notificationService),
    info: notificationService.info.bind(notificationService),
    clear: notificationService.clear.bind(notificationService),
    test: testNotification
  };
};