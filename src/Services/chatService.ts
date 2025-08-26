import { databases, ID, Query, PROFILE_COLLECTION_ID, client } from './appwrite';
import { DATABASE_ID, CHAT_MESSAGES_COLLECTION as MESSAGES_COLLECTION_ID } from './appwrite';

export interface ChatUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  isOnline?: boolean;
  lastSeen?: string;
  role?: string;
}

export interface Message {
  $id?: string;
  senderId: string;
  receiverId: string;
  content: string;
  $createdAt?: string;
  read: boolean;
}

export const sendMessage = async (message: Omit<Message, '$id' | '$createdAt'>): Promise<Message> => {
  try {
    const newMessage = await databases.createDocument(
      DATABASE_ID,
      MESSAGES_COLLECTION_ID,
      ID.unique(),
      {
        ...message,
        read: false
      }
    );
    return newMessage as unknown as Message;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

export const getMessages = async (userId1: string, userId2: string): Promise<Message[]> => {
  try {
    const messages = await databases.listDocuments(
      DATABASE_ID,
      MESSAGES_COLLECTION_ID,
      [
        Query.or([
          Query.and([
            Query.equal('senderId', userId1),
            Query.equal('receiverId', userId2)
          ]),
          Query.and([
            Query.equal('senderId', userId2),
            Query.equal('receiverId', userId1)
          ])
        ])
      ]
    );
    return messages.documents as unknown as Message[];
  } catch (error) {
    console.error('Error fetching messages:', error);
    return [];
  }
};

export const markAsRead = async (messageIds: string[]): Promise<void> => {
  try {
    await Promise.all(
      messageIds.map(id => 
        databases.updateDocument(DATABASE_ID, MESSAGES_COLLECTION_ID, id, { read: true })
      )
    );
  } catch (error) {
    console.error('Error marking messages as read:', error);
  }
};

export const searchTeachers = async (query: string): Promise<ChatUser[]> => {
  try {
    // First try exact match
    let response = await databases.listDocuments(
      DATABASE_ID,
      PROFILE_COLLECTION_ID,
      [
        Query.startsWith('name', query),
        Query.equal('role', 'teacher')
      ]
    );

    // If no results, try case-insensitive search
    if (response.documents.length === 0) {
      response = await databases.listDocuments(
        DATABASE_ID,
        PROFILE_COLLECTION_ID,
        [
          Query.startsWith('name', query.toLowerCase()),
          Query.equal('role', 'teacher')
        ]
      );
    }

    return response.documents.map(doc => ({
      id: doc.$id,
      name: doc.name || 'Unknown Teacher',
      email: doc.email || '',
      avatar: doc.avatar || '',
      role: 'teacher',
      isOnline: doc.isOnline || false,
      lastSeen: doc.lastSeen || 'recently'
    }));
  } catch (error) {
    console.error('Error searching teachers:', error);
    return [];
  }
};

export const subscribeToMessages = (userId: string, callback: (message: Message) => void) => {
  try {
    // Subscribe to real-time updates using the client's realtime service
    return client.subscribe(
      `databases.${DATABASE_ID}.collections.${MESSAGES_COLLECTION_ID}.documents`,
      (response: any) => {
        if (response.events.includes('databases.*.collections.*.documents.*.create')) {
          const message = response.payload as Message;
          if (message.receiverId === userId || message.senderId === userId) {
            callback(message);
          }
        }
      }
    );
  } catch (error) {
    console.error('Error subscribing to messages:', error);
    return () => {}; // Return empty unsubscribe function
  }
};

export const updateUserStatus = async (userId: string, isOnline: boolean) => {
  try {
    await databases.updateDocument(
      DATABASE_ID,
      PROFILE_COLLECTION_ID,
      userId,
      {
        isOnline,
        lastSeen: isOnline ? undefined : new Date().toISOString()
      }
    );
  } catch (error) {
    console.error('Error updating user status:', error);
  }
};

export const getUserById = async (userId: string): Promise<ChatUser | null> => {
  try {
    const user = await databases.getDocument(DATABASE_ID, PROFILE_COLLECTION_ID, userId);
    return {
      id: user.$id,
      name: user.name || 'Unknown User',
      email: user.email,
      avatar: user.avatar,
      role: user.role,
      isOnline: user.isOnline || false,
      lastSeen: user.lastSeen || 'recently'
    };
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
};
