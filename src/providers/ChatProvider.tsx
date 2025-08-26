'use client';

import React, { createContext, useContext, useEffect, useCallback, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { databases, client } from '@/Services/appwrite'; // Using proper casing for Services folder
import { ID, Query, RealtimeResponseEvent } from 'appwrite';
import { ChatContextType, ChatMessage, Notification } from '@/types/chat.types';

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [currentChat, setCurrentChat] = useState<string | null>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Fetch messages for a specific chat
  const fetchMessages = useCallback(async (chatId: string): Promise<ChatMessage[]> => {
    if (!user?.$id) return [];
    
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await databases.listDocuments(
        '68261b6a002ba6c3b584', // DATABASE_ID
        '68554d8d0014e7c5c239', // CHAT_MESSAGES_COLLECTION
        [
          Query.equal('$participants', [user.$id, chatId]),
          Query.orderDesc('$createdAt'),
          Query.limit(50)
        ]
      );

      const fetchedMessages = response.documents.map(doc => ({
        id: doc.$id,
        senderId: doc.senderId,
        receiverId: doc.receiverId,
        content: doc.content,
        isRead: doc.isRead,
        createdAt: doc.$createdAt,
        metadata: typeof doc.metadata === 'string' ? JSON.parse(doc.metadata) : {}
      }));

      setMessages(fetchedMessages);
      return fetchedMessages;
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('Failed to load messages');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [user?.$id]);

  // Send a message
  const sendMessage = useCallback(async (
    content: string, 
    receiverId: string, 
    metadata: Record<string, any> = {}
  ): Promise<ChatMessage | undefined> => {
    if (!user?.$id) return;

    try {
      setIsLoading(true);
      setError(null);

      const messageData = {
        senderId: user.$id,
        receiverId,
        content,
        isRead: false,
        metadata: JSON.stringify({
          ...metadata,
          senderName: user.name,
          senderEmail: user.email,
          timestamp: new Date().toISOString()
        })
      };

      const newMessage = await databases.createDocument(
        '68261b6a002ba6c3b584', // DATABASE_ID
        '68554d8d0014e7c5c239', // CHAT_MESSAGES_COLLECTION
        ID.unique(),
        messageData
      );

      const createdMessage: ChatMessage = {
        id: newMessage.$id,
        senderId: newMessage.senderId,
        receiverId: newMessage.receiverId,
        content: newMessage.content,
        isRead: newMessage.isRead,
        createdAt: newMessage.$createdAt,
        metadata: typeof newMessage.metadata === 'string' 
          ? JSON.parse(newMessage.metadata) 
          : {}
      };

      // Update local state
      setMessages(prev => [...prev, createdMessage]);
      
      // Create notification for the recipient
      await createNotification({
        recipientId: receiverId,
        title: `New message from ${user.name || 'User'}`,
        message: content.length > 50 ? `${content.substring(0, 50)}...` : content,
        type: 'message',
        metadata: {
          senderId: user.$id,
          senderName: user.name,
          chatId: currentChat
        }
      });

      return createdMessage;
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
      return undefined;
    } finally {
      setIsLoading(false);
    }
  }, [user, currentChat]);

  // Mark messages as read
  const markAsRead = useCallback(async (messageIds: string[]) => {
    try {
      await Promise.all(
        messageIds.map(id =>
          databases.updateDocument(
            '68261b6a002ba6c3b584', // DATABASE_ID
            '68554d8d0014e7c5c239', // CHAT_MESSAGES_COLLECTION
            id,
            { isRead: true }
          )
        )
      );

      // Update local state
      setMessages(prev =>
        prev.map(msg =>
          messageIds.includes(msg.id) ? { ...msg, isRead: true } : msg
        )
      );
    } catch (err) {
      console.error('Error marking messages as read:', err);
    }
  }, []);

  // Create a notification
  const createNotification = useCallback(async (data: {
    recipientId: string;
    title: string;
    message: string;
    type: string;
    metadata?: Record<string, any>;
  }) => {
    try {
      const notification = await databases.createDocument(
        '68261b6a002ba6c3b584', // DATABASE_ID
        '6853e351000f87a36c80', // NOTIFICATIONS_COLLECTION
        ID.unique(),
        {
          ...data,
          isRead: false,
          metadata: data.metadata ? JSON.stringify(data.metadata) : undefined
        }
      );

      const newNotification: Notification = {
        id: notification.$id,
        recipientId: notification.recipientId,
        title: notification.title,
        message: notification.message,
        isRead: notification.isRead,
        type: notification.type,
        createdAt: notification.$createdAt,
        metadata: typeof notification.metadata === 'string' 
          ? JSON.parse(notification.metadata) 
          : {}
      };

      setNotifications(prev => [newNotification, ...prev]);
      return newNotification;
    } catch (err) {
      console.error('Error creating notification:', err);
      return null;
    }
  }, []);

  // Mark notification as read
  const markNotificationAsRead = useCallback(async (notificationId: string) => {
    try {
      await databases.updateDocument(
        '68261b6a002ba6c3b584', // DATABASE_ID
        '6853e351000f87a36c80', // NOTIFICATIONS_COLLECTION
        notificationId,
        { isRead: true }
      );

      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId ? { ...notif, isRead: true } : notif
        )
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  }, []);

  // Get conversations for the current user
  const getConversations = useCallback(async () => {
    if (!user?.$id) return [];

    try {
      setIsLoading(true);
      setError(null);

      // First, get all messages where the user is either sender or receiver
      const response = await databases.listDocuments(
        '68261b6a002ba6c3b584', // DATABASE_ID
        '68554d8d0014e7c5c239', // CHAT_MESSAGES_COLLECTION
        [
          Query.or([
            Query.equal('senderId', user.$id),
            Query.equal('receiverId', user.$id)
          ]),
          Query.orderDesc('$createdAt')
        ]
      );

      // Process conversations
      const conversationMap = new Map();
      
      response.documents.forEach(doc => {
        const otherUserId = doc.senderId === user.$id ? doc.receiverId : doc.senderId;
        
        if (!conversationMap.has(otherUserId)) {
          conversationMap.set(otherUserId, {
            id: otherUserId,
            participants: [user.$id, otherUserId],
            lastMessage: {
              id: doc.$id,
              content: doc.content,
              senderId: doc.senderId,
              isRead: doc.isRead,
              createdAt: doc.$createdAt
            },
            unread: (doc.receiverId === user.$id && !doc.isRead) ? 1 : 0
          });
        } else {
          const existing = conversationMap.get(otherUserId);
          // Update unread count if there are newer unread messages
          if (doc.receiverId === user.$id && !doc.isRead) {
            existing.unread += 1;
          }
        }
      });

      const conversationsList = Array.from(conversationMap.values());
      setConversations(conversationsList);
      return conversationsList;
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError('Failed to load conversations');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [user?.$id]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user?.$id) return;

    // Type for the message payload from Appwrite
    type MessageDocument = {
      $id: string;
      senderId: string;
      receiverId: string;
      content: string;
      isRead: boolean;
      $createdAt: string;
      metadata?: string | Record<string, unknown>;
    };

    // Type for Appwrite's realtime response
    type RealtimeResponse = {
      events: string[];
      payload: MessageDocument;
    };

    const subscriptions: (() => void)[] = [];

    const handleNewMessage = (event: RealtimeResponseEvent<RealtimeResponse>) => {
      const message = event.payload;
      
      if (message.events?.some((event: string) => event.includes('create'))) {
        // Only process if the message is for the current user
        if (message.payload?.receiverId === user.$id || message.payload?.senderId === user.$id) {
          let metadata: Record<string, any> = {};
          try {
            metadata = typeof message.payload.metadata === 'string' 
              ? JSON.parse(message.payload.metadata) 
              : message.payload.metadata || {};
          } catch (e) {
            console.error('Error parsing message metadata:', e);
            metadata = {};
          }
            
          const newMessage: ChatMessage = {
            id: message.payload.$id,
            senderId: message.payload.senderId,
            receiverId: message.payload.receiverId,
            content: message.payload.content,
            isRead: message.payload.isRead,
            createdAt: message.payload.$createdAt,
            metadata: metadata as { [key: string]: any; senderName?: string; senderEmail?: string; timestamp?: string; }
          };

          setMessages(prev => [newMessage, ...prev]);
          
          // If this is the active chat, mark as read
          if (currentChat && (message.payload.senderId === currentChat || message.payload.receiverId === currentChat)) {
            markAsRead([message.payload.$id]);
          }
        }
      }
    };

    const handleMessageUpdate = (event: RealtimeResponseEvent<RealtimeResponse>) => {
      const updatedMessage = event.payload;
      
      if (updatedMessage.events?.some((event: string) => event.includes('update'))) {
        setMessages(prev =>
          prev.map(msg => {
            if (msg.id === updatedMessage.payload.$id) {
              let metadata: Record<string, any> = {};
              try {
                metadata = typeof updatedMessage.payload.metadata === 'string'
                  ? JSON.parse(updatedMessage.payload.metadata)
                  : updatedMessage.payload.metadata || {};
              } catch (e) {
                console.error('Error parsing updated message metadata:', e);
                metadata = {};
              }
                
              return {
                ...msg,
                ...updatedMessage.payload,
                isRead: updatedMessage.payload.isRead,
                metadata: metadata as { [key: string]: any; senderName?: string; senderEmail?: string; timestamp?: string; }
              };
            }
            return msg;
          })
        );
      }
    };

    try {
      // Subscribe to new messages
      const messagesUnsubscribe = client.subscribe<RealtimeResponse>(
        `databases.${process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID}.collections.${process.env.NEXT_PUBLIC_CHAT_MESSAGES_COLLECTION_ID}.documents`,
        handleNewMessage
      );
      subscriptions.push(messagesUnsubscribe);

      // Subscribe to message updates (e.g., read status)
      const updatesUnsubscribe = client.subscribe<RealtimeResponse>(
        `databases.${process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID}.collections.${process.env.NEXT_PUBLIC_CHAT_MESSAGES_COLLECTION_ID}.documents`,
        handleMessageUpdate
      );
      subscriptions.push(updatesUnsubscribe);

    } catch (error) {
      console.error('Error setting up subscriptions:', error);
    }

    // Cleanup function
    return () => {
      subscriptions.forEach(unsubscribe => {
        try {
          if (typeof unsubscribe === 'function') {
            unsubscribe();
          }
        } catch (e) {
          console.error('Error unsubscribing:', e);
        }
      });
    };

    // Initial data load
    getConversations();

    // Clean up subscriptions
    return () => {
      subscriptions.forEach(unsubscribe => {
        try {
          if (typeof unsubscribe === 'function') {
            unsubscribe();
          }
        } catch (e) {
          console.error('Error unsubscribing:', e);
        }
      });
    };
  }, [user?.$id, currentChat, getConversations, markAsRead]);

  // Value to be provided by the context
  const value = {
    messages,
    notifications,
    currentChat,
    conversations,
    unreadCount,
    isLoading,
    error,
    fetchMessages,
    sendMessage,
    markAsRead,
    markNotificationAsRead,
    setCurrentChat,
    getConversations,
    createNotification
  };

  return (
    <ChatContext.Provider value={value}>
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
