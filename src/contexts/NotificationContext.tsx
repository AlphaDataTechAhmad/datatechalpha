import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
// Remove unused import
import { useAuth } from './AuthContext';
import { 
  getUserNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead as markAllRead,
  subscribeToNotifications,
  sendNotification as sendAppwriteNotification
} from '../Services/notifications';

export interface Notification {
  $id: string;
  id: string; // For backward compatibility
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  type: string;
  metadata?: Record<string, any>;
  readAt?: string;
  senderId?: string;
  senderName?: string;
  recipientType: 'all' | 'students' | 'teachers';
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  addNotification: (notification: Omit<Notification, 'id' | 'isRead' | 'createdAt'>) => void;
  fetchNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { user, isAuthenticated } = useAuth();

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated || !user?.$id) return;

    try {
      const notifications = await getUserNotifications(user.$id);
      // Map Appwrite documents to our notification format
      const formattedNotifications = notifications.map((notif: any) => ({
        ...notif,
        id: notif.$id, // For backward compatibility
        isRead: notif.isRead || false,
        type: notif.type || 'announcement',
        createdAt: notif.$createdAt || new Date().toISOString(),
        metadata: notif.metadata || {},
      }));
      
      setNotifications(formattedNotifications);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  }, [isAuthenticated, user?.$id]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!isAuthenticated || !user?.$id) return;
    
    // Initial fetch
    fetchNotifications();
    
    // Subscribe to real-time updates
    const unsubscribe = subscribeToNotifications(user.$id, (payload) => {
      if (payload.event === 'create') {
        const newNotification = {
          ...payload.payload,
          id: payload.payload.$id,
          isRead: false,
          createdAt: payload.payload.$createdAt || new Date().toISOString(),
        };
        
        setNotifications(prev => [newNotification, ...prev]);
      } else if (payload.event === 'update') {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === payload.payload.$id || notif.$id === payload.payload.$id
              ? { ...notif, ...payload.payload }
              : notif
          )
        );
      }
    });
    
    // Cleanup subscription on unmount
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isAuthenticated, user?.$id, fetchNotifications]);

  const markAsRead = async (id: string) => {
    try {
      await markNotificationAsRead(id);
      
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === id || notification.$id === id
            ? { 
                ...notification, 
                isRead: true,
                readAt: new Date().toISOString() 
              }
            : notification
        )
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      throw error;
    }
  };

  const markAllAsRead = async () => {
    if (!user?.$id) return;
    
    try {
      await markAllRead(user.$id);
      
      setNotifications(prev =>
        prev.map(notification => ({
          ...notification,
          isRead: true,
          readAt: notification.readAt || new Date().toISOString()
        }))
      );
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      throw error;
    }
  };

  const addNotification = async (notificationData: Omit<Notification, 'id' | 'isRead' | 'createdAt' | 'type' | '$id'>) => {
    if (!user?.$id) return;
    
    try {
      // Prepare the notification data with all required fields
      const notificationToSend = {
        ...notificationData,
        $id: `temp_${Date.now()}`,
        isRead: false,
        type: 'announcement' as const,
        createdAt: new Date().toISOString()
      };
      
      // Send notification via Appwrite
      const newNotification = await sendAppwriteNotification({
        ...notificationToSend,
        senderId: notificationData.senderId || user.$id,
        senderName: notificationData.senderName || user.name || 'System',
        recipientType: notificationData.recipientType || 'all',
      });
      
      // Map the response to our notification format
      const formattedNotification: Notification = {
        ...newNotification,
        id: newNotification.$id,
        isRead: newNotification.isRead || false,
        createdAt: newNotification.$createdAt || new Date().toISOString(),
        recipientType: newNotification.recipientType || 'all',
        type: newNotification.type || 'announcement',
        metadata: newNotification.metadata || {},
        readAt: newNotification.readAt,
        title: newNotification.title,
        message: newNotification.message
      };
      
      // Update local state
      setNotifications(prev => [formattedNotification, ...prev]);
      return formattedNotification;
    } catch (error) {
      console.error('Failed to send notification:', error);
      throw error;
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        addNotification,
        fetchNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
