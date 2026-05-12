
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import apiService from '@/services/apiService';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type?: string;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
  isSeen: boolean;
  createdAt: string;
}

interface NotificationContextType {
  notifications: NotificationItem[];
  unseenCount: number;
  isLoading: boolean;
  loadNotifications: () => Promise<void>;
  markSeen: (notification: NotificationItem) => Promise<void>;
  markAllSeen: () => Promise<void>;
  dismiss: (notificationId: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unseenCount, setUnseenCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const isInitialLoadRef = React.useRef(true);
  const knownIdsRef = React.useRef<Set<string>>(new Set());

  const loadNotifications = useCallback(async (silent = false) => {
    if (!isAuthenticated || !currentUser) return;

    if (!silent) setIsLoading(true);
    try {
      const response = await apiService.getNotifications(25);
      if (response.success) {
        const newNotifications = (response.data || []) as NotificationItem[];
        const newUnseenCount = typeof response.unseenCount === 'number' ? response.unseenCount : 0;

        // Find notifications that are new (not seen before) and unseen
        const trulyNewUnseen = newNotifications.filter(n => 
          !n.isSeen && 
          !knownIdsRef.current.has(n.id)
        );

        if (!isInitialLoadRef.current && trulyNewUnseen.length > 0) {
          // Show toast for the latest one
          const latest = trulyNewUnseen[0];
          toast({
            title: latest.title,
            description: latest.message,
          });
        }

        // Update known IDs
        newNotifications.forEach(n => knownIdsRef.current.add(n.id));
        isInitialLoadRef.current = false;

        setNotifications(newNotifications);
        setUnseenCount(newUnseenCount);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [isAuthenticated, currentUser, toast]);

  // Initial load and polling
  useEffect(() => {
    if (isAuthenticated) {
      loadNotifications();
      const interval = setInterval(() => {
        loadNotifications(true);
      }, 30000); // Poll every 30 seconds
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
      setUnseenCount(0);
      knownIdsRef.current.clear();
      isInitialLoadRef.current = true;
    }
  }, [isAuthenticated, loadNotifications]);

  const markSeen = async (notification: NotificationItem) => {
    if (notification.isSeen) return;

    try {
      const response = await apiService.markNotificationSeen(notification.id);
      if (response.success) {
        setNotifications(prev =>
          prev.map(item =>
            item.id === notification.id ? { ...item, isSeen: true } : item
          )
        );
        setUnseenCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to mark notification as seen:', error);
    }
  };

  const markAllSeen = async () => {
    if (unseenCount === 0) return;

    try {
      const response = await apiService.markAllNotificationsSeen();
      if (response.success) {
        setNotifications(prev => prev.map(item => ({ ...item, isSeen: true })));
        setUnseenCount(0);
      }
    } catch (error) {
      console.error('Failed to mark all notifications as seen:', error);
    }
  };

  const dismiss = async (notificationId: string) => {
    try {
      const response = await apiService.dismissNotification(notificationId);
      if (response.success) {
        setNotifications(prev => {
          const target = prev.find(item => item.id === notificationId);
          if (target && !target.isSeen) {
            setUnseenCount(count => Math.max(0, count - 1));
          }
          return prev.filter(item => item.id !== notificationId);
        });
      }
    } catch (error) {
      console.error('Failed to dismiss notification:', error);
    }
  };

  const value = {
    notifications,
    unseenCount,
    isLoading,
    loadNotifications,
    markSeen,
    markAllSeen,
    dismiss
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
