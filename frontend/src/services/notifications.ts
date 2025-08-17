import { Status } from '@constants';
import type { NotificationData } from '@components/common/NotificationToast';

export interface CreateNotificationOptions {
  title: string;
  message: string;
  severity: Status;
  source?: string;
  namespace?: string;
  autoClose?: boolean;
  duration?: number;
}

class NotificationService {
  private notifications: NotificationData[] = [];
  private listeners: Set<(notifications: NotificationData[]) => void> = new Set();
  private idCounter = 0;

  create(options: CreateNotificationOptions): string {
    const notification: NotificationData = {
      id: `notification-${++this.idCounter}-${Date.now()}`,
      timestamp: new Date().toISOString(),
      autoClose: true,
      ...options
    };

    this.notifications = [notification, ...this.notifications];
    this.notifyListeners();
    
    return notification.id;
  }

  remove(id: string): void {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.notifyListeners();
  }

  clear(): void {
    this.notifications = [];
    this.notifyListeners();
  }

  getAll(): NotificationData[] {
    return [...this.notifications];
  }

  subscribe(listener: (notifications: NotificationData[]) => void): () => void {
    this.listeners.add(listener);
    listener(this.getAll());
    
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    const notifications = this.getAll();
    this.listeners.forEach(listener => {
      try {
        listener(notifications);
      } catch (error) {
        // Error in notification listener
      }
    });
  }

  critical(title: string, message: string, options?: Partial<CreateNotificationOptions>): string {
    return this.create({
      title,
      message,
      severity: Status.CRITICAL,
      duration: 10000,
      ...options
    });
  }

  error(title: string, message: string, options?: Partial<CreateNotificationOptions>): string {
    return this.create({
      title,
      message,
      severity: Status.ERROR,
      ...options
    });
  }

  warning(title: string, message: string, options?: Partial<CreateNotificationOptions>): string {
    return this.create({
      title,
      message,
      severity: Status.WARNING,
      ...options
    });
  }

  success(title: string, message: string, options?: Partial<CreateNotificationOptions>): string {
    return this.create({
      title,
      message,
      severity: Status.SUCCESS,
      duration: 3000,
      ...options
    });
  }

  info(title: string, message: string, options?: Partial<CreateNotificationOptions>): string {
    return this.create({
      title,
      message,
      severity: Status.INFO,
      ...options
    });
  }
}

// Create singleton instance
export const notificationService = new NotificationService();

// Export types
export type { NotificationData };