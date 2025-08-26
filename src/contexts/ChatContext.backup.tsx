import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { databases } from '@/Services/appwrite';
import { ID, Query, Models } from 'appwrite';
import { ChatMessage, Notification, MessageType } from '@/types/notification.types';

// Constants
const DATABASE_ID = '68261b6a002ba6c3b584';
const CHAT_MESSAGES_COLLECTION = '68554d8d0014e7c5c239';
const NOTIFICATIONS_COLLECTION = '6853e351000f87a36c80';

interface MessageDocument extends Models.Document {
  senderId: string;
  recipientId: string;
  content: string;
  isRead: boolean;
  messageType?: 'message' | 'video_rejected' | 'info';
  metadata?: string | object;
}

interface NotificationDocument extends Models.Document {
  recipientId: string;
  title: string;
  message: string;
  isRead: boolean;
  type?: string;
  senderId: string;
  senderName: string;
  recipientType: string;
  metadata?: string | object;
}

interface Conversation {
  id: string;
  name: string;
  lastMessage: ChatMessage;
  unread: number;
}

interface ChatContextType {
  messages: ChatMessage[];
  notifications: Notification[];
  unreadCount: number;
  isChatOpen: boolean;
  currentChat: string | null;
  conversations: Conversation[];
  sendMessage: (content: string, receiverId: string, metadata?: any) => Promise<ChatMessage | undefined>;
  sendRejection: (receiverId: string, video: { id: string; videoId: string; title: string; thumbnailUrl?: string }, reason: string) => Promise<void>;
  markAsRead: (messageId: string) => Promise<void>;
  toggleChat: () => void;
  setCurrentChat: (userId: string | null) => void;
  markNotificationAsRead: (notificationId: string) => void;
  fetchMessages: (otherUserId: string) => Promise<ChatMessage[]>;
  getConversations: () => Promise<Conversation[]>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [currentChat, setCurrentChat] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [conversations, setConversations] = useState<Conversation[]>([]);

  // Format message from database document
  const formatMessage = (doc: MessageDocument): ChatMessage => {
    // Ensure messageType has a valid value
    const messageType: MessageType = 
      (doc.messageType && ['message', 'video_rejected', 'info'].includes(doc.messageType) 
        ? doc.messageType
        : 'message') as MessageType;
        
    return {
      id: doc.$id,
      senderId: doc.senderId,
      receiverId: doc.recipientId,
      content: doc.content,
      isRead: doc.isRead,
      type: messageType,
      createdAt: doc.$createdAt || new Date().toISOString(),
      metadata: doc.metadata ? (typeof doc.metadata === 'string' ? JSON.parse(doc.metadata) : doc.metadata) : {}
    };
  };

  // Format notification from database document
  const formatNotification = (doc: NotificationDocument): Notification => ({
    id: doc.$id,
    userId: doc.recipientId,
    title: doc.title,
    message: doc.message,
    isRead: doc.isRead,
    type: doc.type || 'message',
    createdAt: doc.$createdAt,
    senderId: doc.senderId,
    senderName: doc.senderName,
    recipientType: doc.recipientType,
    metadata: typeof doc.metadata === 'string' ? JSON.parse(doc.metadata) : {}
  });

  // Send a new message
  const sendMessage = useCallback(async (content: string, receiverId: string, metadata: any = {}): Promise<ChatMessage | undefined> => {
    if (!user?.$id || !receiverId) {
      console.error('Cannot send message: missing user ID or receiver ID');
      return;
    }

    try {
      const now = new Date().toISOString();
      // Ensure messageType is one of the allowed values
      const messageType: 'message' | 'video_rejected' | 'info' = 
        ['message', 'video_rejected', 'info'].includes(metadata.type) 
          ? metadata.type as 'message' | 'video_rejected' | 'info'
          : 'message';
          
      const messageData = {
        content,
        senderId: user.$id,
        recipientId: receiverId,
        isRead: false,
        messageType,
        metadata: JSON.stringify(metadata),
        $createdAt: now,
        $updatedAt: now,
        $permissions: [
          `read(user:${user.$id})`,
          `write(user:${user.$id})`,
          `read(user:${receiverId})`
        ]
      };

      // Ensure we're not including undefined values which can cause validation errors
      const cleanMessageData = Object.fromEntries(
        Object.entries(messageData).filter(([_, v]) => v !== undefined)
      );

      const newMessage = await databases.createDocument<MessageDocument>(
        DATABASE_ID,
        CHAT_MESSAGES_COLLECTION,
        ID.unique(),
        cleanMessageData
      ) as MessageDocument;

      const formattedMessage = formatMessage(newMessage);
      
      // Update local messages state
      setMessages(prev => [...prev, formattedMessage]);
      
      // Update conversations with the new message
      setConversations(prev => {
        const existingConvoIndex = prev.findIndex(c => c.id === receiverId);
        if (existingConvoIndex >= 0) {
          const updated = [...prev];
          updated[existingConvoIndex] = {
            ...updated[existingConvoIndex],
            lastMessage: formattedMessage
          };
          // Move to top
          return [updated[existingConvoIndex], ...updated.filter((_, i) => i !== existingConvoIndex)];
        }
        return prev;
      });

      return formattedMessage;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }, [user?.$id]);

  // Send a rejection message for a video
  const sendRejection = useCallback(async (receiverId: string, video: { id: string; videoId: string; title: string; thumbnailUrl?: string }, reason: string) => {
    if (!user?.$id) return;

    const rejectionMessage = `Your video "${video.title}" has been rejected. Reason: ${reason}`;
    
    await sendMessage(rejectionMessage, receiverId, {
      type: 'video_rejected' as const,  // Ensure type is inferred as 'video_rejected' literal
      videoId: video.videoId,
      title: video.title,
      thumbnailUrl: video.thumbnailUrl,
      reason: reason
    });
  }, [user?.$id, sendMessage]);

  // Mark a message as read
  const markAsRead = useCallback(async (messageId: string) => {
    if (!messageId || !user?.$id) return;
    
    try {
      // First verify the message exists
      const message = await databases.getDocument<MessageDocument>(
        DATABASE_ID,
        CHAT_MESSAGES_COLLECTION,
        messageId
      );
      
      // Only update if the current user is the recipient
      if (message.recipientId === user.$id) {
        // Update the message as read
        await databases.updateDocument(
          DATABASE_ID,
          CHAT_MESSAGES_COLLECTION,
          messageId,
          { isRead: true }
        );
        
        // Update local state
        setMessages(prev => 
          prev.map(msg => 
            msg.id === messageId ? { ...msg, isRead: true } : msg
          )
        );
        
        // Update unread count
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error: any) {
      console.error('Error marking message as read:', error);
      if (error?.code === 404) {
        // Remove the message from local state if it doesn't exist on the server
        setMessages(prev => prev.filter(msg => msg.id !== messageId));
      }
    }
  }, [user?.$id]);
  
  // Mark a notification as read
  const markNotificationAsRead = useCallback(async (notificationId: string) => {
    if (!notificationId) return;
    
    try {
      await databases.updateDocument(
        DATABASE_ID,
        NOTIFICATIONS_COLLECTION,
        notificationId,
        { 
          isRead: true,
          readAt: new Date().toISOString()
        }
      );
      
      // Update local state
      setNotifications(prev => 
        prev.filter(n => n.id !== notificationId)
      );
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  // Fetch messages between current user and another user
  const fetchMessages = useCallback(async (otherUserId: string): Promise<ChatMessage[]> => {
    if (!user?.$id) return [];
    
    try {
      const response = await databases.listDocuments<MessageDocument>(
        DATABASE_ID,
        CHAT_MESSAGES_COLLECTION,
        [
          Query.or([
            Query.and([
              Query.equal('senderId', user.$id),
              Query.equal('recipientId', otherUserId)
            ]),
            Query.and([
              Query.equal('senderId', otherUserId),
              Query.equal('recipientId', user.$id)
            ])
          ]),
          Query.orderAsc('$createdAt')
        ]
      );
      
      // Mark messages as read
      const unreadMessages = response.documents.filter(
        (msg) => msg.senderId === otherUserId && !msg.isRead
      );

      if (unreadMessages.length > 0) {
        await Promise.all(
          unreadMessages.map((msg) =>
            databases.updateDocument(
              DATABASE_ID,
              CHAT_MESSAGES_COLLECTION,
              msg.$id,
              { isRead: true }
            )
          )
        );
      }

      return response.documents.map(formatMessage);
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  }, [user?.$id]);

  // Send a new message
  const sendMessage = useCallback(async (content: string, receiverId: string, metadata: any = {}): Promise<ChatMessage | undefined> => {
    if (!user?.$id || !receiverId) {
      console.error('Cannot send message: missing user ID or receiver ID');
      return;
    }

    try {
      const now = new Date().toISOString();
      // Ensure messageType is one of the allowed values
      const messageType: 'message' | 'video_rejected' | 'info' = 
        ['message', 'video_rejected', 'info'].includes(metadata.type) 
          ? metadata.type as 'message' | 'video_rejected' | 'info'
          : 'message';
          
      const messageData = {
        content,
        senderId: user.$id,
        recipientId: receiverId,
        isRead: false,
        messageType,
        metadata: JSON.stringify(metadata),
        $createdAt: now,
        $updatedAt: now,
        $permissions: [
          `read(user:${user.$id})`,
          `write(user:${user.$id})`,
          `read(user:${receiverId})`
        ]
      };

      // Ensure we're not including undefined values which can cause validation errors
      const cleanMessageData = Object.fromEntries(
        Object.entries(messageData).filter(([_, v]) => v !== undefined)
      );

      const newMessage = await databases.createDocument<MessageDocument>(
        DATABASE_ID,
        CHAT_MESSAGES_COLLECTION,
        ID.unique(),
        cleanMessageData
      ) as MessageDocument;

      const formattedMessage = formatMessage(newMessage);
      
      // Update local messages state
      setMessages(prev => [...prev, formattedMessage]);
      
      // Update conversations with the new message
      setConversations(prev => {
        const existingConvoIndex = prev.findIndex(c => c.id === receiverId);
        if (existingConvoIndex >= 0) {
          const updated = [...prev];
          updated[existingConvoIndex] = {
            ...updated[existingConvoIndex],
            lastMessage: formattedMessage
          };
          // Move to top
          return [updated[existingConvoIndex], ...updated.filter((_, i) => i !== existingConvoIndex)];
        }
        return prev;
      });

      return formattedMessage;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }, [user?.$id]);

  // Get all conversations for the current user
  const getConversations = useCallback(async (): Promise<Conversation[]> => {
    if (!user?.$id) return [];
    
    try {
      // Get all messages where the current user is either sender or recipient
      const response = await databases.listDocuments<MessageDocument>(
        DATABASE_ID,
        CHAT_MESSAGES_COLLECTION,
        [
          Query.or([
            Query.equal('senderId', user.$id),
            Query.equal('recipientId', user.$id)
          ]),
          Query.orderDesc('$createdAt')
        ]
      );
      
      // Get unique user IDs from conversations
      const userIds = new Set<string>();
      response.documents.forEach(msg => {
        if (msg.senderId && msg.senderId !== user.$id) userIds.add(msg.senderId);
        if (msg.recipientId && msg.recipientId !== user.$id) userIds.add(msg.recipientId);
      });
      
      // Process each conversation - filter out any invalid user IDs
      const validUserIds = Array.from(userIds).filter(id => id && typeof id === 'string' && id.trim() !== '');
      
      const conversationPromises = validUserIds.map(async (userId) => {
        try {
          // Get last message in conversation
          const lastMessageRes = await databases.listDocuments<MessageDocument>(
            DATABASE_ID,
            CHAT_MESSAGES_COLLECTION,
            [
              Query.or([
                Query.and([
                  Query.equal('senderId', user.$id),
                  Query.equal('recipientId', userId)
                ]),
                Query.and([
                  Query.equal('senderId', userId),
                  Query.equal('recipientId', user.$id)
                ])
              ]),
              Query.orderDesc('$createdAt'),
              Query.limit(1)
            ]
          );
          
          // Get unread count
          const unreadRes = await databases.listDocuments<MessageDocument>(
            DATABASE_ID,
            CHAT_MESSAGES_COLLECTION,
            [
              Query.equal('senderId', userId),
              Query.equal('recipientId', user.$id),
              Query.equal('isRead', false)
            ]
          );
          
          const lastMessage = lastMessageRes.documents[0] ? formatMessage(lastMessageRes.documents[0]) : null;
          
          if (!lastMessage) return null;
          
          return {
            id: userId,
            name: `User ${userId.substring(0, 6)}`,
            lastMessage,
            unread: unreadRes.total
          };
        } catch (error) {
          console.error(`Error processing conversation with user ${userId}:`, error);
          return null;
        }
      });
      
      const conversationResults = await Promise.all(conversationPromises);
      
      // Filter out any failed conversations and sort by last message time
      return conversationResults
        .filter((conv): conv is Conversation => conv !== null)
        .sort((a, b) => 
          new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime()
        );
    } catch (error) {
      console.error('Error fetching conversations:', error);
      return [];
    }
  }, [user?.$id]);
  
  // Load conversations on mount and when user changes
  useEffect(() => {
    const loadConversations = async () => {
      const convos = await getConversations();
      setConversations(convos);
      
      // Calculate total unread count
      const totalUnread = convos.reduce((sum, conv) => sum + conv.unread, 0);
      setUnreadCount(totalUnread);
    };
    
    if (user?.$id) {
      loadConversations();
    }
  }, [getConversations, user?.$id]);
  
  // Poll for new messages
  useEffect(() => {
    if (!user?.$id) return;
    
    const pollMessages = async () => {
      try {
        const convos = await getConversations();
        setConversations(convos);
        
        // Update unread count
        const totalUnread = convos.reduce((sum, conv) => sum + conv.unread, 0);
        setUnreadCount(totalUnread);
        
        // If in a chat, update messages
        if (currentChat) {
          const msgs = await fetchMessages(currentChat);
          setMessages(msgs);
        }
      } catch (error) {
        console.error('Error polling messages:', error);
      }
    };
    
    // Initial fetch
    pollMessages();
    
    // Set up polling (every 5 seconds)
    const interval = setInterval(pollMessages, 5000);
    
    return () => clearInterval(interval);
  }, [user?.$id, currentChat, fetchMessages, getConversations]);
  
  // Provide the context value
  const contextValue: ChatContextType = {
    messages,
    notifications,
    unreadCount,
    isChatOpen,
    currentChat,
    conversations,
    sendMessage,
    sendRejection,
    markAsRead,
    toggleChat,
    setCurrentChat,
    markNotificationAsRead,
    fetchMessages,
    getConversations
  };
  
  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
};

// Custom hook to use the chat context
export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export default ChatContext;
