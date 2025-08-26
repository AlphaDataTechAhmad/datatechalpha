import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { databases } from '@/Services/appwrite';
import { ID, Query } from 'appwrite';
import { ChatMessage, Notification } from '@/types/notification.types';

// Constants
const DATABASE_ID = '68261b6a002ba6c3b584';
const CHAT_MESSAGES_COLLECTION = '68554d8d0014e7c5c239';
const NOTIFICATIONS_COLLECTION = '6853e351000f87a36c80';

interface ChatContextType {
  messages: ChatMessage[];
  notifications: Notification[];
  unreadCount: number;
  isChatOpen: boolean;
  currentChat: string | null;
  conversations: Array<{
    id: string;
    name: string;
    lastMessage: ChatMessage;
    unread: number;
  }>;
  sendMessage: (content: string, receiverId: string, metadata?: any) => Promise<ChatMessage | undefined>;
  markAsRead: (messageId: string) => Promise<void>;
  toggleChat: () => void;
  setCurrentChat: (userId: string | null) => void;
  markNotificationAsRead: (notificationId: string) => void;
  fetchMessages: (otherUserId: string) => Promise<ChatMessage[]>;
  getConversations: () => Promise<Array<{
    id: string;
    name: string;
    lastMessage: ChatMessage;
    unread: number;
  }>>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [currentChat, setCurrentChat] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [conversations, setConversations] = useState<Array<{
    id: string;
    name: string;
    lastMessage: ChatMessage;
    unread: number;
  }>>([]);

  // Format message from database document
  const formatMessage = (doc: any): ChatMessage => ({
    id: doc.$id,
    senderId: doc.senderId,
    receiverId: doc.recipientId,
    content: doc.content,
    isRead: doc.isRead,
    type: doc.messageType || 'message',
    createdAt: doc.$createdAt,
    metadata: typeof doc.metadata === 'string' ? JSON.parse(doc.metadata) : {}
  });

  // Format notification from database document
  const formatNotification = (doc: any): Notification => ({
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

  // Fetch messages between current user and another user
  const fetchMessages = useCallback(async (otherUserId: string): Promise<ChatMessage[]> => {
    if (!user?.$id) return [];
    
    try {
      const response = await databases.listDocuments(
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
        (msg: any) => msg.senderId === otherUserId && !msg.isRead
      );

      if (unreadMessages.length > 0) {
        await Promise.all(
          unreadMessages.map((msg: any) =>
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
    if (!user?.$id) return;

    try {
      const messageData = {
        content,
        senderId: user.$id,
        recipientId: receiverId,
        isRead: false,
        messageType: metadata.messageType || 'message',
        type: metadata.type || 'message',
        metadata: JSON.stringify({
          ...metadata,
          senderName: user.name,
          senderEmail: user.email,
          senderRole: user.role,
          timestamp: new Date().toISOString()
        }),
        createdAt: new Date().toISOString()
      };

      // Save message to database
      const newMessage = await databases.createDocument(
        DATABASE_ID,
        CHAT_MESSAGES_COLLECTION,
        ID.unique(),
        messageData
      );

      // Create notification for the recipient
      try {
        const notificationContent = metadata.replyContent 
          ? `${content}\n\n[Reply to: ${metadata.replyContent.substring(0, 50)}${metadata.replyContent.length > 50 ? '...' : ''}]`
          : content;
          
        // Only include fields that exist in the notifications collection schema
        const messageWithId = `${notificationContent}\n\n[Message ID: ${newMessage.$id}]`;
        const notificationData = {
          title: `New message from ${user.name || 'User'}`,
          message: messageWithId.length > 100 ? messageWithId.substring(0, 100) + '...' : messageWithId,
          senderId: user.$id,
          senderName: user.name || 'User',
          recipientType: 'user',
          recipientId: receiverId,
          isRead: false,
          type: 'message',
          createdAt: new Date().toISOString()
        };

        await databases.createDocument(
          DATABASE_ID,
          NOTIFICATIONS_COLLECTION,
          ID.unique(),
          notificationData
        );
      } catch (notifError) {
        console.error('Error creating notification:', notifError);
      }

      return formatMessage(newMessage);
    } catch (error) {
      console.error('Error sending message:', error);
      return undefined;
    }
  }, [user]);

  // Mark a message as read
  const markAsRead = useCallback(async (messageId: string) => {
    if (!messageId) return;
    
    try {
      await databases.updateDocument(
        DATABASE_ID,
        CHAT_MESSAGES_COLLECTION,
        messageId,
        { isRead: true }
      );
      
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId ? { ...msg, isRead: true } : msg
        )
      );
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  }, []);

  // Mark a notification as read
  const markNotificationAsRead = useCallback(async (notificationId: string) => {
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
      
      setNotifications(prev => 
        prev.filter(n => n.id !== notificationId)
      );
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  // Fetch user's conversations
  const getConversations = useCallback(async () => {
    if (!user?.$id) return [];
    
    try {
      // Get all unique user IDs that the current user has chatted with
      const sentMessages = await databases.listDocuments(
        DATABASE_ID,
        CHAT_MESSAGES_COLLECTION,
        [
          Query.equal('senderId', user.$id),
          Query.select(['recipientId']),
          Query.limit(100)
        ]
      );
      
      const receivedMessages = await databases.listDocuments(
        DATABASE_ID,
        CHAT_MESSAGES_COLLECTION,
        [
          Query.equal('recipientId', user.$id),
          Query.select(['senderId']),
          Query.limit(100)
        ]
      );
      
      // Get unique user IDs
      const userIds = new Set([
        ...sentMessages.documents.map((m: any) => m.recipientId),
        ...receivedMessages.documents.map((m: any) => m.senderId)
      ]);
      
      // For each user, get the last message and unread count
      const conversations = await Promise.all(
        Array.from(userIds).map(async (userId: string) => {
          const lastMessageRes = await databases.listDocuments(
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
          
          const unreadRes = await databases.listDocuments(
            DATABASE_ID,
            CHAT_MESSAGES_COLLECTION,
            [
              Query.equal('senderId', userId),
              Query.equal('recipientId', user.$id),
              Query.equal('isRead', false)
            ]
          );
          
          // In a real app, you would fetch the user's name here
          return {
            id: userId,
            name: `User ${userId.substring(0, 6)}`, // Placeholder
            lastMessage: lastMessageRes.documents[0] ? formatMessage(lastMessageRes.documents[0]) : {} as ChatMessage,
            unread: unreadRes.total
          };
        })
      );
      
      return conversations;
    } catch (error) {
      console.error('Error fetching conversations:', error);
      return [];
    }
  }, [user?.$id]);

  // Poll for new messages in the current chat
  useEffect(() => {
    if (!currentChat || !user?.$id) return;

    const pollMessages = async () => {
      try {
        const newMessages = await fetchMessages(currentChat);
        setMessages(prev => {
          const allMessages = [...prev, ...newMessages];
          const uniqueMessages = Array.from(new Map(
            allMessages.map(msg => [msg.id, msg])
          ).values());
          return uniqueMessages.sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        });
      } catch (error) {
        console.error('Error polling messages:', error);
      }
    };
    
    // Initial fetch
    pollMessages();
    
    // Set up polling (every 5 seconds)
    const pollInterval = setInterval(pollMessages, 5000);
    
    return () => clearInterval(pollInterval);
  }, [currentChat, user?.$id, fetchMessages]);

  // Check for unread notifications
  useEffect(() => {
    if (!user?.$id) return;
    
    const checkUnread = async () => {
      try {
        const unread = await databases.listDocuments(
          DATABASE_ID,
          NOTIFICATIONS_COLLECTION,
          [
            Query.equal('recipientId', user.$id),
            Query.equal('isRead', false)
          ]
        );
        
        setUnreadCount(unread.total);
        
        // Update notifications list
        const formatted = unread.documents.map(formatNotification);
        setNotifications(formatted);
      } catch (error) {
        console.error('Error checking unread notifications:', error);
      }
    };
    
    // Initial check
    checkUnread();
    
    // Set up polling (every 30 seconds)
    const intervalId = setInterval(checkUnread, 30000);
    
    return () => clearInterval(intervalId);
  }, [user?.$id]);

  // Load conversations on mount
  useEffect(() => {
    const loadConversations = async () => {
      const convos = await getConversations();
      setConversations(convos);
    };
    
    loadConversations();
  }, [getConversations]);

  // Toggle chat window
  const toggleChat = useCallback(() => {
    setIsChatOpen(prev => !prev);
  }, []);

  return (
    <ChatContext.Provider
      value={{
        messages,
        notifications,
        unreadCount,
        isChatOpen,
        currentChat,
        conversations,
        sendMessage,
        markAsRead,
        toggleChat,
        setCurrentChat,
        markNotificationAsRead,
        fetchMessages,
        getConversations
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export default ChatContext;
