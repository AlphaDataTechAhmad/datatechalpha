import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { client, databases } from '@/Services/appwrite';
import { ID, Query, type Models } from 'appwrite';
import type { Notification, MessageType } from '@/types/notification.types';

export interface ChatMessage {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  recipientId?: string; // For compatibility with server response
  isRead: boolean;
  type: 'message' | 'video_rejected' | 'video_approved' | 'info';
  metadata: any;
  createdAt: string;
  $id?: string;
  $createdAt?: string;
  $updatedAt?: string;
  [key: string]: any; // Allow additional properties
}

// Constants
const DATABASE_ID = '68261b6a002ba6c3b584';
const CHAT_MESSAGES_COLLECTION = '68554d8d0014e7c5c239';
const NOTIFICATIONS_COLLECTION = '6853e351000f87a36c80';
const PROFILES_COLLECTION = '68261bb5000a54d8652b';

interface MessageDocument extends Models.Document {
  senderId: string;
  recipientId: string;
  content: string;
  isRead: boolean;
  messageType?: MessageType;
  metadata?: string | object;
}


interface Conversation {
  id: string;
  name: string;
  role?: string;
  lastMessage: ChatMessage;
  unread: number;
  email?: string;
  avatar?: string;
  isOnline?: boolean;
}

interface UserProfile {
  name: string;
  avatar?: string;
  email?: string;
  role?: string;
}

interface ChatContextType {
  messages: ChatMessage[];
  notifications: Notification[];
  unreadCount: number;
  isChatOpen: boolean;
  currentChat: string | null;
  conversations: Conversation[];
  userProfiles: Map<string, UserProfile>;
  sendMessage: (content: string, receiverId: string, metadata?: any) => Promise<ChatMessage | undefined>;
  sendRejection: (receiverId: string, video: { id: string; videoId: string; title: string; thumbnailUrl?: string }, reason: string) => Promise<void>;
  sendApproval: (receiverId: string, video: { id: string; videoId: string; title: string; thumbnailUrl?: string }) => Promise<void>;
  markAsRead: (messageId: string) => Promise<void>;
  toggleChat: () => void;
  setCurrentChat: (userId: string | null) => void;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  fetchMessages: (otherUserId: string) => Promise<ChatMessage[]>;
  getConversations: () => Promise<Conversation[]>;
  searchTeachers: (query: string) => Promise<Conversation[]>;
  getUserProfile: (userId: string) => Promise<UserProfile>;
}

export const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Define the ChatProvider component
const ChatProviderComponent = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  
  // State for chat
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [currentChat, setCurrentChat] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [userProfiles, setUserProfiles] = useState<Map<string, UserProfile>>(new Map());
  
  // Refs
  const currentUserIdRef = useRef<string | undefined>(user?.$id);

  // Get conversations for the current user
  const getConversations = useCallback(async (): Promise<Conversation[]> => {
    if (!user?.$id) return [];
    
    try {
      // Get all unique user IDs that the current user has chatted with
      const messages = await databases.listDocuments<MessageDocument>(
        DATABASE_ID,
        CHAT_MESSAGES_COLLECTION,
        [
          Query.or([
            Query.equal('senderId', user.$id),
            Query.equal('recipientId', user.$id)
          ]),
          Query.orderDesc('$createdAt'),
          Query.limit(100) // Limit to recent messages for better performance
        ]
      );

      // Get unique user IDs from messages
      const userIds = new Set<string>();
      messages.documents.forEach(msg => {
        if (msg.senderId !== user.$id) userIds.add(msg.senderId);
        if (msg.recipientId !== user.$id) userIds.add(msg.recipientId);
      });

      const validUserIds = Array.from(userIds);
      
      const conversationPromises = validUserIds.map(async (userId: string) => {
        if (userId === user?.$id) return null;
        
        try {
          const [lastMessageRes, unreadRes] = await Promise.all([
            databases.listDocuments<MessageDocument>(
              DATABASE_ID,
              CHAT_MESSAGES_COLLECTION,
              [
                Query.orderDesc('$createdAt'),
                Query.limit(1),
                Query.or([
                  Query.and([
                    Query.equal('senderId', user?.$id || ''),
                    Query.equal('recipientId', userId)
                  ]),
                  Query.and([
                    Query.equal('senderId', userId),
                    Query.equal('recipientId', user?.$id || '')
                  ])
                ])
              ]
            ).catch(() => ({ documents: [] })),
            databases.listDocuments<MessageDocument>(
              DATABASE_ID,
              CHAT_MESSAGES_COLLECTION,
              [
                Query.equal('isRead', false),
                Query.equal('senderId', userId),
                Query.equal('recipientId', user?.$id || '')
              ]
            ).catch((error) => {
              console.error('Error fetching unread messages:', error);
              return { documents: [], total: 0 };
            })
          ]);

          const lastMessage = lastMessageRes.documents[0];
          if (!lastMessage) return null;

          // Get user profile
          let profile: UserProfile = { name: userId };
          try {
            const userDoc = await databases.getDocument(DATABASE_ID, PROFILES_COLLECTION, userId);
            profile = {
              name: userDoc.name,
              avatar: userDoc.avatar,
              email: userDoc.email,
              role: userDoc.role
            };
            setUserProfiles(prev => {
              const newMap = new Map(prev);
              newMap.set(userId, profile);
              return newMap;
            });
          } catch (error) {
            console.error('Error fetching user profile:', error);
          }

          return {
            id: userId,
            name: profile.name || userId,
            role: profile.role,
            email: profile.email,
            avatar: profile.avatar,
            lastMessage: lastMessage as unknown as ChatMessage,
            unread: unreadRes.total
          };
        } catch (error) {
          console.error(`Error processing conversation with user ${userId}:`, error);
          return null;
        }
      });

      const conversations = (await Promise.all(conversationPromises)).filter(Boolean) as Conversation[];
      setConversations(conversations);
      return conversations;
    } catch (error) {
      console.error('Error fetching conversations:', error);
      return [];
    }
  }, [user?.$id]);

  const updateConversationWithNewMessage = useCallback((message: ChatMessage) => {
    setConversations(prevConversations => {
      try {
        // Determine the other user in the conversation
        const otherUserId = message.senderId === user?.$id ? message.receiverId : message.senderId;
        if (!otherUserId) return prevConversations;
        
        // Check if we already have a conversation with this user
        const existingConversationIndex = prevConversations.findIndex(
          conv => conv.id === otherUserId || conv.id === message.senderId || conv.id === message.receiverId
        );
        
        const updatedConversations = [...prevConversations];
        const now = new Date().toISOString();
        
        if (existingConversationIndex >= 0) {
          // Update existing conversation
          const existingConversation = updatedConversations[existingConversationIndex];
          
          // Skip if this message is already the last message
          if (existingConversation.lastMessage?.id === message.id || 
              existingConversation.lastMessage?.$id === message.$id) {
            return prevConversations;
          }
          
          const updatedConversation = {
            ...existingConversation,
            lastMessage: message,
            unread: message.senderId !== user?.$id && !message.isRead 
              ? (existingConversation.unread || 0) + 1 
              : message.senderId === user?.$id ? 0 : existingConversation.unread || 0,
            updatedAt: now,
            // Ensure we have the latest user info
            name: existingConversation.name || message.senderName || message.recipientName,
            avatar: existingConversation.avatar || message.senderAvatar || message.recipientAvatar
          };
          
          // Remove the conversation from its current position
          updatedConversations.splice(existingConversationIndex, 1);
          
          // Add it to the beginning of the array (most recent first)
          return [updatedConversation, ...updatedConversations];
        } else {
          // For a new conversation, create a minimal conversation object
          const newConversation = {
            id: otherUserId,
            name: message.senderId === user?.$id ? message.receiverName : message.senderName,
            avatar: message.senderId === user?.$id ? message.receiverAvatar : message.senderAvatar,
            lastMessage: message,
            unread: message.senderId !== user?.$id && !message.isRead ? 1 : 0,
            updatedAt: message.createdAt || now,
            userId: otherUserId
          };
          
          // Add the new conversation to the beginning of the list
          return [newConversation, ...prevConversations];
        }
      } catch (error) {
        console.error('Error updating conversation:', error);
        return prevConversations;
      }
    });
  }, [user?.$id]);

  // Track processed message IDs to prevent duplicates
  const processedMessageIds = useRef<Set<string>>(new Set());
  
  // Set up real-time message subscriptions
  useEffect(() => {
    currentUserIdRef.current = user?.$id;
    
    if (!user?.$id) return;
    
    // Clear processed messages when user changes
    processedMessageIds.current.clear();
    
    // Initial fetch of conversations
    getConversations();
    
    // Subscribe to new messages
    const channel = `databases.${DATABASE_ID}.collections.${CHAT_MESSAGES_COLLECTION}.documents`;
    
    const handleNewMessage = (message: any) => {
      // Skip if we've already processed this message
      const messageId = message.$id || message.id;
      if (!messageId || processedMessageIds.current.has(messageId)) {
        return;
      }
      
      // Mark this message as processed
      processedMessageIds.current.add(messageId);
      
      // Only process messages relevant to the current user
      if (message.senderId === user.$id || message.recipientId === user.$id) {
        const formattedMessage = formatMessage(message);
        
        setMessages(prev => {
          // Check if message already exists to prevent duplicates
          const exists = prev.some(msg => 
            msg.id === formattedMessage.id || 
            msg.$id === formattedMessage.$id ||
            (msg.senderId === formattedMessage.senderId && 
             msg.content === formattedMessage.content && 
             Math.abs(new Date(msg.createdAt).getTime() - new Date(formattedMessage.createdAt).getTime()) < 1000)
          );
          if (exists) return prev;
          return [...prev, formattedMessage];
        });
        
        // Update unread count if it's a new message to the current user
        if (formattedMessage.recipientId === user.$id && !formattedMessage.isRead) {
          setUnreadCount(prev => prev + 1);
        }
        
        // Update conversations list
        updateConversationWithNewMessage(formattedMessage);
      }
    };
    
    // Subscribe to create and update events
    const unsubscribeCreate = client.subscribe(channel, (response: any) => {
      if (response.events.includes('databases.*.collections.*.documents.*.create')) {
        handleNewMessage(response.payload);
      }
    });
    
    const unsubscribeUpdate = client.subscribe(channel, (response: any) => {
      if (response.events.includes('databases.*.collections.*.documents.*.update')) {
        handleNewMessage(response.payload);
      }
    });
    
    return () => {
      if (unsubscribeCreate && typeof unsubscribeCreate === 'function') {
        unsubscribeCreate();
      }
      if (unsubscribeUpdate && typeof unsubscribeUpdate === 'function') {
        unsubscribeUpdate();
      }
    };
  }, [user?.$id, updateConversationWithNewMessage, getConversations]);

  // Toggle chat visibility
  const toggleChat = useCallback(() => {
    console.log('Toggling chat, current state:', isChatOpen);
    setIsChatOpen(prev => !prev);
  }, [isChatOpen]);

  // Function to get user profile by ID
  const getUserProfile = useCallback(async (userId: string): Promise<UserProfile> => {
    if (!userId) return { name: 'Unknown User' };
    
    // Check if we already have the profile
    const existingProfile = userProfiles.get(userId);
    if (existingProfile) return existingProfile;
    
    try {
      // Try to fetch the profile from the database
      const userDoc = await databases.getDocument(DATABASE_ID, PROFILES_COLLECTION, userId);
      const profile: UserProfile = {
        name: userDoc.name || 'Unknown User',
        avatar: userDoc.avatar,
        email: userDoc.email,
        role: userDoc.role
      };
      
      // Update the userProfiles state
      setUserProfiles(prev => {
        const newMap = new Map(prev);
        newMap.set(userId, profile);
        return newMap;
      });
      
      return profile;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // Return a default profile if we can't fetch the user
      return { name: userId, role: 'user' };
    }
  }, [userProfiles]);

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
      
      const unreadMessages = response.documents.filter(
        (msg) => msg.recipientId === user.$id && !msg.isRead
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

  const formatMessage = (doc: MessageDocument | any): ChatMessage => {
    try {
      // Handle both MessageDocument and plain object formats
      const message = doc as any;
      
      // Parse metadata if it exists and is a string
      let parsedMetadata = {};
      if (message.metadata) {
        try {
          parsedMetadata = typeof message.metadata === 'string' 
            ? JSON.parse(message.metadata) 
            : message.metadata;
        } catch (e) {
          console.error('Error parsing message metadata:', e);
          parsedMetadata = {};
        }
      }

      // Determine message type with fallback
      const messageType = (
        message.type || 
        message.messageType || 
        'message'
      ) as 'message' | 'video_rejected' | 'video_approved' | 'info';
      
      // Create the base message object
      const formattedMessage: ChatMessage = {
        id: message.$id || message.id || ID.unique(),
        content: message.content || '',
        senderId: message.senderId || '',
        receiverId: message.recipientId || message.receiverId || '',
        recipientId: message.recipientId || message.receiverId || '', // For compatibility
        isRead: Boolean(message.isRead),
        type: messageType,
        metadata: parsedMetadata,
        createdAt: message.$createdAt || message.createdAt || new Date().toISOString(),
      };

      // Add Appwrite-specific fields if they exist
      if (message.$id) formattedMessage.$id = message.$id;
      if (message.$createdAt) formattedMessage.$createdAt = message.$createdAt;
      if (message.$updatedAt) formattedMessage.$updatedAt = message.$updatedAt;
      
      // Add any additional fields that might be useful
      if (message.senderName) formattedMessage.senderName = message.senderName;
      if (message.senderAvatar) formattedMessage.senderAvatar = message.senderAvatar;
      if (message.recipientName) formattedMessage.recipientName = message.recipientName;
      if (message.recipientAvatar) formattedMessage.recipientAvatar = message.recipientAvatar;
      
      return formattedMessage;
    } catch (error) {
      console.error('Error formatting message:', error, doc);
      // Return a safe default message in case of errors
      return {
        id: `error-${Date.now()}`,
        content: 'Error loading message',
        senderId: 'system',
        receiverId: user?.$id || 'unknown',
        recipientId: user?.$id || 'unknown',
        isRead: true,
        type: 'info',
        metadata: { error: true },
        createdAt: new Date().toISOString()
      };
    }
  };



  const sendMessage = useCallback(async (message: string, receiverId: string, metadata: any = {}) => {
    if (!user?.$id) return;

    try {
      const now = new Date().toISOString();
      const messageType = metadata.type || 'message';
      const newMessage = {
        content: message,
        senderId: user.$id,
        recipientId: receiverId,
        isRead: false,
        type: 'message',
        messageType: messageType,
        metadata: JSON.stringify(metadata),
        createdAt: now,
        $permissions: [
          `read(user:${receiverId})`,
          `write(user:${user.$id})`
        ]
      };

      await databases.createDocument(
        DATABASE_ID,
        CHAT_MESSAGES_COLLECTION,
        ID.unique(),
        newMessage
      );
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }, [user?.$id]);

  const sendRejection = useCallback(async (receiverId: string, video: { id: string; videoId: string; title: string; thumbnailUrl?: string }, reason: string) => {
    if (!user?.$id) return;

    try {
      const rejectionMessage = `Your video "${video.title}" has been rejected.\n\nReason: ${reason}\n\nVideo ID: ${video.videoId}`;
      
      await sendMessage(rejectionMessage, receiverId, {
        type: 'video_rejected',
        videoId: video.videoId,
        title: video.title,
        thumbnailUrl: video.thumbnailUrl,
        reason: reason
      });

      const notificationData = {
        recipientId: receiverId,
        title: 'Video Rejected',
        message: `Your video "${video.title}" was rejected. Tap to view details.`,
        isRead: false,
        type: 'video_rejected',
        senderId: user.$id,
        senderName: 'Administrator',
        recipientType: 'teacher',
        createdAt: new Date().toISOString(),
        metadata: JSON.stringify({
          videoId: video.videoId,
          title: video.title,
          thumbnailUrl: video.thumbnailUrl,
          reason: reason
        }),
        $permissions: [
          `read(user:${receiverId})`,
          `write(user:${user.$id})`
        ]
      };

      await databases.createDocument(
        DATABASE_ID,
        NOTIFICATIONS_COLLECTION,
        ID.unique(),
        notificationData
      );

      // Create a properly typed notification object with all required fields
      const newNotification: Notification = {
        id: ID.unique(),
        userId: notificationData.recipientId,
        title: notificationData.title,
        message: notificationData.message,
        isRead: false,
        type: 'video_rejected',
        createdAt: new Date().toISOString(),
        senderId: notificationData.senderId,
        senderName: notificationData.senderName,
        recipientType: notificationData.recipientType,
        metadata: typeof notificationData.metadata === 'string' 
          ? JSON.parse(notificationData.metadata) 
          : notificationData.metadata || {}
      };
      
      setNotifications(prev => [...prev, newNotification]);

      setUnreadCount(prev => prev + 1);
    } catch (error) {
      console.error('Error sending video rejection:', error);
      throw error;
    }
  }, [user?.$id, sendMessage]);

  const sendApproval = useCallback(async (receiverId: string, video: { id: string; videoId: string; title: string; thumbnailUrl?: string }) => {
    if (!user?.$id) return;

    try {
      const approvalMessage = `Your video "${video.title}" has been approved and is now live!\n\nVideo ID: ${video.videoId}`;
      
      await sendMessage(approvalMessage, receiverId, {
        type: 'video_approved',
        videoId: video.videoId,
        title: video.title,
        thumbnailUrl: video.thumbnailUrl
      });

      const notificationData = {
        recipientId: receiverId,
        title: 'Video Approved',
        message: `Your video "${video.title}" has been approved and is now live!`,
        isRead: false,
        type: 'video_approved',
        senderId: user.$id,
        senderName: 'Administrator',
        recipientType: 'teacher',
        createdAt: new Date().toISOString(),
        metadata: JSON.stringify({
          videoId: video.videoId,
          title: video.title,
          thumbnailUrl: video.thumbnailUrl
        }),
        $permissions: [
          `read(user:${receiverId})`,
          `write(user:${user.$id})`
        ]
      };

      await databases.createDocument(
        DATABASE_ID,
        NOTIFICATIONS_COLLECTION,
        ID.unique(),
        notificationData
      );

    } catch (error) {
      console.error('Error sending approval:', error);
      throw error;
    }
  }, [user?.$id, sendMessage]);

  const markAsRead = useCallback(async (messageId: string) => {
    if (!messageId || !user?.$id) return;
    
    try {
      const message = await databases.getDocument<MessageDocument>(
        DATABASE_ID,
        CHAT_MESSAGES_COLLECTION,
        messageId
      );
      
      if (message.recipientId === user.$id) {
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
        
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error: any) {
      console.error('Error marking message as read:', error);
      if (error?.code === 404) {
        setMessages(prev => prev.filter(msg => msg.id !== messageId));
      }
    }
  }, [user?.$id]);

  // Search for teachers
  const searchTeachers = useCallback(async (searchQuery: string): Promise<Conversation[]> => {
    if (!searchQuery.trim()) return [];
    
    try {
      // This is a simplified search - you might want to enhance this with more sophisticated search logic
      const response = await databases.listDocuments<Models.Document & {
        name?: string;
        role?: string;
        email?: string;
        avatar?: string;
        imageUrl?: string;
      }>(
        DATABASE_ID,
        PROFILES_COLLECTION,
        [
          Query.search('name', searchQuery),
          Query.equal('role', 'teacher')
        ]
      );

      return response.documents.map(doc => {
        const now = new Date().toISOString();
        const lastMessage: ChatMessage = {
          id: `temp-${Date.now()}`,
          content: '',
          senderId: doc.$id,
          receiverId: user?.$id || '',
          isRead: true,
          type: 'message',
          metadata: {},
          createdAt: now
        };

        return {
          id: doc.$id,
          name: doc.name || 'Teacher',
          role: doc.role,
          email: doc.email,
          avatar: doc.avatar || doc.imageUrl || '',
          lastMessage,
          unread: 0,
          isOnline: false
        };
      });
    } catch (error) {
      console.error('Error searching teachers:', error);
      return [];
    }
  }, [user?.$id]);

  // Mark notification as read
  const markNotificationAsRead = useCallback(async (notificationId: string): Promise<void> => {
    if (!notificationId) return;
    
    try {
      await databases.updateDocument(
        DATABASE_ID,
        NOTIFICATIONS_COLLECTION,
        notificationId,
        { isRead: true }
      );
      
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId ? { ...notif, isRead: true } : notif
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  useEffect(() => {
    const loadConversations = async () => {
      const convos = await getConversations();
      setConversations(convos);
      setUnreadCount(convos.reduce((sum, conv) => sum + conv.unread, 0));
    };
    
    if (user?.$id) {
      loadConversations();
    }
  }, [getConversations, user?.$id]);
  
  
  // Load user notifications
  const loadUserNotifications = useCallback(async () => {
    if (!user?.$id) return;
    
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        NOTIFICATIONS_COLLECTION,
        [
          Query.equal('recipientId', user.$id),
          Query.orderDesc('$createdAt'),
          Query.limit(50)
        ]
      );
      
      const notifications = response.documents.map(doc => ({
        ...doc,
        id: doc.$id,
        userId: doc.recipientId,
        metadata: typeof doc.metadata === 'string' ? JSON.parse(doc.metadata) : (doc.metadata || {})
      })) as unknown as Notification[];
      
      setNotifications(notifications);
      
      // Update unread count
      const unread = notifications.filter(n => !n.isRead).length;
      setUnreadCount(unread);
      
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  }, [user?.$id]);

  // Load notifications when user changes
  useEffect(() => {
    loadUserNotifications();
  }, [loadUserNotifications]);

  // Create the context value object with all required properties
  const contextValue: ChatContextType = {
    messages,
    notifications,
    unreadCount,
    isChatOpen,
    currentChat,
    conversations,
    userProfiles,
    sendMessage,
    sendRejection,
    sendApproval,
    markAsRead,
    toggleChat,
    setCurrentChat,
    markNotificationAsRead,
    fetchMessages,
    getConversations,
    searchTeachers,
    getUserProfile
  };

  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  ) as JSX.Element;
}

// Define and export the useChat hook
export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

// Export the ChatProvider
export const ChatProvider = ChatProviderComponent;