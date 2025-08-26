import { databases, DATABASE_ID, NOTIFICATIONS_COLLECTION } from './appwrite';
import { ID, Query, Permission, Role } from 'appwrite';
import { client } from './appwrite';

// Define recipient types as a union type
export type RecipientType = 'all' | 'student' | 'teacher' | 'students' | 'teachers';

export interface Notification {
  id?: string;
  $id?: string;
  title: string;
  message: string;
  type?: string;
  senderId: string;
  senderName?: string;
  recipientType: RecipientType;
  recipientId?: string; // Specific user ID if targeting a single user
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  $createdAt?: string;
  metadata?: Record<string, any>;
}

// Using the collection ID from appwrite.ts
export const NOTIFICATIONS_COLLECTION_ID = NOTIFICATIONS_COLLECTION;

export const NotificationService = {
  async sendNotification(
    notification: Omit<Notification, 'id' | 'isRead' | 'createdAt' | 'readAt' | '$id' | '$createdAt' | 'metadata'> & { type?: string },
    senderId: string,
    senderName?: string
  ): Promise<Notification> {
    try {
      // Only include fields that we know exist in the collection schema
      // Based on the error, 'type' is not recognized, so we'll exclude it for now
      const notificationData: Record<string, any> = {
        title: notification.title,
        message: notification.message,
        recipientType: notification.recipientType,
        senderId,
        isRead: false,
        createdAt: new Date().toISOString(),
      };
      
      // Only include optional fields if they exist
      if (notification.recipientId) {
        notificationData.recipientId = notification.recipientId;
      }
      if (senderName) {
        notificationData.senderName = senderName;
      }

      const newNotification = await databases.createDocument(
        DATABASE_ID,
        NOTIFICATIONS_COLLECTION_ID,
        ID.unique(),
        notificationData,
        [
          Permission.read(Role.any()),
          Permission.update(Role.any()),
          Permission.delete(Role.any()),
        ]
      );
      return newNotification as unknown as Notification;
    } catch (error) {
      console.error('Error sending notification:', error);
      throw new Error('Failed to send notification');
    }
  },

  async getNotifications(userId: string, userType: 'student' | 'teacher' | 'all'): Promise<Notification[]> {
    try {
      // Always include notifications for 'all' recipients
      const queries = [
        Query.equal('recipientType', 'all')
      ];

      // Add user-specific notifications
      if (userType !== 'all') {
        queries.push(
          Query.equal('recipientType', userType),
          Query.or([
            Query.equal('recipientId', userId),
            Query.isNull('recipientId')
          ])
        );
      }

      const response = await databases.listDocuments(
        DATABASE_ID,
        NOTIFICATIONS_COLLECTION_ID,
        [
          Query.or(queries),
          Query.orderDesc('$createdAt')
        ]
      );

      return response.documents as unknown as Notification[];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  },

  async markAsRead(notificationId: string): Promise<void> {
    try {
      await databases.updateDocument(
        DATABASE_ID,
        NOTIFICATIONS_COLLECTION_ID,
        notificationId,
        {
          isRead: true,
          readAt: new Date().toISOString()
        }
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },

  // Subscribe to real-time notifications
  subscribeToNotifications(callback: (payload: any) => void) {
    return client.subscribe(
      `databases.${DATABASE_ID}.collections.${NOTIFICATIONS_COLLECTION_ID}.documents`,
      callback
    );
  }
};
