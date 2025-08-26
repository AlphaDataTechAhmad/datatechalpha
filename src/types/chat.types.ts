export interface ChatUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  online?: boolean;
  lastSeen?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  metadata?: {
    senderName?: string;
    senderEmail?: string;
    timestamp?: string;
    [key: string]: any;
  };
  isOwn?: boolean;
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'error';
}

export interface Notification {
  id: string;
  recipientId: string;
  title: string;
  message: string;
  isRead: boolean;
  type: 'message' | 'system' | 'alert' | string;
  createdAt: string;
  readAt?: string;
  metadata?: {
    senderId?: string;
    senderName?: string;
    chatId?: string;
    [key: string]: any;
  };
}

export interface Conversation {
  id: string;
  participants: string[];
  lastMessage?: {
    id: string;
    content: string;
    senderId: string;
    isRead: boolean;
    createdAt: string;
  };
  unread: number;
}

export interface ChatContextType {
  // State
  messages: ChatMessage[];
  notifications: Notification[];
  unreadCount: number;
  currentChat: string | null;
  conversations: Array<{
    id: string;
    name: string;
    lastMessage: ChatMessage;
    unread: number;
  }>;
  isLoading: boolean;
  error: string | null;
  
  // Methods
  sendMessage: (content: string, receiverId: string, metadata?: any) => Promise<ChatMessage | undefined>;
  fetchMessages: (otherUserId: string) => Promise<ChatMessage[]>;
  markAsRead: (messageIds: string[]) => Promise<void>;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  createNotification: (data: {
    recipientId: string;
    title: string;
    message: string;
    type: string;
    metadata?: Record<string, any>;
  }) => Promise<Notification | null>;
  setCurrentChat: (userId: string | null) => void;
  getConversations: () => Promise<Array<{
    id: string;
    name: string;
    lastMessage: ChatMessage;
    unread: number;
  }>>;
}
