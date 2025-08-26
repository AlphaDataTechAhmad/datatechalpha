import { ID, Query, Permission, Role } from 'appwrite';
import { 
  client, 
  databases, 
  DATABASE_ID, 
  NOTIFICATIONS_COLLECTION as NOTIFICATIONS_COLLECTION_ID,
  USER_NOTIFICATIONS_COLLECTION as USER_NOTIFICATIONS_COLLECTION_ID 
} from './appwrite';

export interface Notification {
  $id?: string;
  id?: string;
  title: string;
  message: string;
  type?: string;
  recipientType: 'all' | 'students' | 'teachers' | 'student' | 'teacher';
  recipientId?: string;
  senderId: string;
  senderName?: string;
  isRead?: boolean;
  readAt?: string;
  scheduledAt?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  $createdAt?: string;
}

// Map Appwrite document to Notification
export const mapToNotification = (doc: any): Notification => {
  if (!doc) {
    throw new Error('Document is required');
  }
  
  return {
    ...doc,
    id: doc.$id || doc.id,
    $id: doc.$id || doc.id,
    isRead: doc.isRead || false,
    type: doc.type || 'announcement',
    recipientType: (doc.recipientType || 'all') as 'all' | 'students' | 'teachers' | 'student' | 'teacher',
    createdAt: doc.$createdAt || doc.createdAt || new Date().toISOString(),
    $createdAt: doc.$createdAt || doc.createdAt,
    metadata: doc.metadata || {},
    title: doc.title || '',
    message: doc.message || '',
    senderName: doc.senderName || 'System',
    readAt: doc.readAt
  };
};

/**
 * Create a new notification
 */
export const createNotification = async (notification: Omit<Notification, 'isRead' | 'id' | 'createdAt' | 'metadata' | 'scheduledAt' | 'readAt' | '$id' | '$createdAt'>) => {
  try {
    // Only include fields that we know exist in the collection schema
    // Based on the error, 'type' is not recognized, so we'll exclude it for now
    const notificationData: Record<string, any> = {
      title: notification.title,
      message: notification.message,
      recipientType: notification.recipientType,
      senderId: notification.senderId,
      isRead: false,
      createdAt: new Date().toISOString()
    };
    
    // Only include optional fields if they exist
    if (notification.recipientId) {
      notificationData.recipientId = notification.recipientId;
    }
    if (notification.senderName) {
      notificationData.senderName = notification.senderName;
    }

    const result = await databases.createDocument(
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
    return result;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

/**
 * Send notification to specific users based on recipient type
 */
export const sendNotification = async (notification: Omit<Notification, 'isRead' | 'id' | 'createdAt' | 'metadata' | 'scheduledAt' | 'readAt' | '$id' | '$createdAt'>) => {
  try {
    // Create the main notification with only the required fields
    const newNotification = await createNotification({
      title: notification.title,
      message: notification.message,
      type: notification.type || 'announcement',
      recipientType: notification.recipientType,
      recipientId: notification.recipientId,
      senderId: notification.senderId,
      senderName: notification.senderName
    });
    
    return newNotification;
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
};

/**
 * Get notifications for a specific user
 */
export const getUserNotifications = async (userId: string, userType: 'student' | 'teacher' | 'all' = 'all') => {
  try {
    // First get user-specific notifications
    const userNotifications = await databases.listDocuments(
      DATABASE_ID,
      NOTIFICATIONS_COLLECTION_ID,
      [
        Query.or([
          Query.equal('recipientType', 'all'),
          Query.equal('recipientType', userType),
          Query.equal('recipientId', userId)
        ]),
        Query.orderDesc('$createdAt'),
        Query.limit(20)
      ]
    );

    // Map the documents to our notification format
    return userNotifications.documents.map(doc => mapToNotification(doc));
  } catch (error) {
    console.error('Error fetching user notifications:', error);
    throw error;
  }
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (notificationId: string) => {
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
};

/**
 * Mark all notifications as read for a user
 */
export const markAllNotificationsAsRead = async (userId: string) => {
  try {
    // First get all unread notifications for the user
    const response = await databases.listDocuments(
      DATABASE_ID,
      NOTIFICATIONS_COLLECTION_ID,
      [
        Query.equal('isRead', false),
        Query.or([
          Query.equal('recipientId', userId),
          Query.equal('recipientType', 'all')
        ]),
        Query.limit(100) // Limit to prevent timeouts
      ]
    );

    // Update each notification to mark as read
    const updatePromises = response.documents.map(doc => 
      databases.updateDocument(
        DATABASE_ID,
        NOTIFICATIONS_COLLECTION_ID,
        doc.$id,
        {
          isRead: true,
          readAt: new Date().toISOString()
        }
      )
    );

    await Promise.all(updatePromises);
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

/**
 * Subscribe to real-time notifications
 */
export const subscribeToNotifications = (userId: string, callback: (payload: any) => void) => {
  // Subscribe to changes in the notifications collection
  const unsubscribe = client.subscribe(
    `databases.${DATABASE_ID}.collections.${NOTIFICATIONS_COLLECTION_ID}.documents`,
    (response: any) => {
      const notification = response.payload;
      
      // Only process events for the current user
      const isForUser = 
        notification.recipientType === 'all' ||
        notification.recipientId === userId;
      
      if (isForUser && ['create', 'update', 'delete'].includes(response.event)) {
        // Map the notification to our format
        const mappedNotification = mapToNotification(notification);
        
        callback({
          event: response.event,
          payload: mappedNotification,
          timestamp: new Date().toISOString()
        });
      }
    }
  );

  return () => {
    if (unsubscribe) {
      unsubscribe();
    }
  };
};
