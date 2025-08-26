import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import styles from './SearchInput.module.css';
import { 
  Loader2, 
  Send, 
  X, 
  ChevronLeft, 
  Search, 
  Paperclip, 
  Check,
  CheckCheck,
  MessageSquare,
  Minimize2,
  Mic
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format, isToday, isYesterday } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/contexts/ChatContext';
import type { ChatMessage } from '@/contexts/ChatContext';

// Define Conversation interface locally since it's not exported from ChatContext
interface Conversation {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  role?: string;
  isOnline?: boolean;
  unreadCount?: number;
  unread?: number; // For backward compatibility
  lastMessage?: {
    id?: string;
    content: string;
    timestamp: string;
    isRead: boolean;
    senderId?: string;
    createdAt?: string;
    type?: string;
    metadata?: any;
    // Add any additional fields that might be present in ChatMessage
    [key: string]: any;
  };
  lastMessageTime?: string;
  userId?: string;
  [key: string]: any; // For any additional properties
}

// Types
interface AuthUser {
  $id: string;
  name?: string;
  email?: string;
  avatar?: string;
  role?: string;
}

interface ChatUser {
  id: string;
  $id?: string;
  name: string;
  email: string;
  avatar?: string;
  role?: string;
  isOnline?: boolean;
  imageUrl?: string;
  lastSeen?: string;
}

interface Message {
  id: string;
  $id?: string;
  content: string;
  senderId: string;
  senderName?: string;
  senderRole?: string;
  senderAvatar?: string;
  receiverId: string;
  receiverName?: string;
  receiverAvatar?: string;
  isRead: boolean;
  createdAt: string;
  type: 'message' | 'video_rejected' | 'video_approved' | 'info';
  metadata?: any;
  $createdAt?: string;
  $updatedAt?: string;
  recipientId?: string;
  isCurrentUser?: boolean;
}

interface ChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
  onMinimize: () => void;
  receiverId?: string;
  user?: AuthUser;
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut'
    }
  },
  exit: { 
    opacity: 0, 
    y: 20,
    transition: {
      duration: 0.2,
      ease: 'easeIn'
    }
  }
};

// Custom hook for mobile detection
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  return isMobile;
};

// Safe date formatting utility
const safeFormatDate = (dateString: string, formatStr: string): string => {
  try {
    if (!dateString) return '';
    const date = new Date(dateString);
    // Check if date is valid
    if (isNaN(date.getTime())) return '';
    return format(date, formatStr);
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

// Custom hook to manage chat window state
const useChatWindowState = (_isOpen: boolean, onMinimize: () => void, receiverId?: string) => {
  // State hooks - all at the top level
  const [isMinimized, setIsMinimized] = useState(false);
  const [showInbox, setShowInbox] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ChatUser[]>([]);
  const [message, setMessage] = useState('');
  const [localConversations, setLocalConversations] = useState<Conversation[]>([]);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  
  // Custom hooks - after state and refs
  const isMobile = useIsMobile();
  
  // Get chat context
  const chatContext = useChat();
  const { user: currentUser } = useAuth() as { user: AuthUser | null };
  
  // Destructure with defaults to avoid type issues
  const {
    conversations = [],
    sendMessage: sendChatMessage = async () => undefined,
    messages: allMessages = [],
    fetchMessages: fetchChatMessages = async () => [],
    searchTeachers = async () => [],
    getUserProfile = async () => ({ name: 'User', role: 'user' })
  } = chatContext || {};
  
  // Alias the functions to maintain consistency with the rest of the code
  const sendMessage = sendChatMessage;
  const fetchMessages = fetchChatMessages;

  // Format message time (e.g., '2:30 PM')
  const formatMessageTime = useCallback((dateString: string) => {
    return safeFormatDate(dateString, 'h:mm a');
  }, []);

  // Function to get user profile with avatar
  const getUserWithAvatar = useCallback(async (userId: string) => {
    if (!userId) return null;
    
    try {
      const profile = await getUserProfile(userId);
      return {
        id: userId,
        name: profile.name || 'User',
        avatar: profile.avatar,
        role: profile.role || 'user',
        email: profile.email || ''
      };
    } catch (error) {
      console.error('Error getting user profile:', error);
      return {
        id: userId,
        name: 'User',
        role: 'user'
      };
    }
  }, [getUserProfile]);

  // Format conversation time (e.g., '2:30 PM' or 'Yesterday' or 'MM/dd/yyyy')
  const formatConversationTime = useCallback((dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (isToday(date)) {
      return format(date, 'h:mm a');
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return format(date, 'EEEE'); // Day name (e.g., Monday)
    } else {
      return format(date, 'MM/dd/yyyy');
    }
  }, []); 

  const handleMinimize = useCallback(() => {
    setIsMinimized(true);
    onMinimize?.();
  }, [onMinimize]);

  const handleRestore = useCallback(() => {
    setIsMinimized(false);
  }, []);

  // Get messages for the selected conversation from the chat context
  const [conversationMessages, setConversationMessages] = useState<Message[]>([]);

  // Fetch messages when selected user changes
  useEffect(() => {
    let isMounted = true;
    
    const loadMessages = async () => {
      if (!selectedUser?.id || !currentUser?.$id || !fetchMessages) {
        if (isMounted) {
          setConversationMessages([]);
        }
        return;
      }

      try {
        // Fetch messages for the selected conversation
        const fetchedMessages = await fetchChatMessages(selectedUser.id);
        
        if (!isMounted || !Array.isArray(fetchedMessages)) return;
        
        // Get user profiles for all unique user IDs in the conversation
        const userIds = new Set<string>();
        fetchedMessages.forEach(msg => {
          if (msg.senderId) userIds.add(msg.senderId);
          if (msg.recipientId) userIds.add(msg.recipientId);
        });
        
        // Map the fetched messages to the Message type expected by the component
        const mappedMessages: Message[] = await Promise.all(fetchedMessages.map(async (msg: ChatMessage) => {
          const senderProfile = await getUserWithAvatar(msg.senderId);
          const receiverProfile = await getUserWithAvatar((msg as any).receiverId || selectedUser.id);
          
          return {
            id: msg.id || (msg as any).$id || `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            content: msg.content,
            senderId: msg.senderId,
            senderName: senderProfile?.name || 'User',
            senderAvatar: senderProfile?.avatar,
            receiverId: (msg as any).receiverId || selectedUser.id,
            receiverName: receiverProfile?.name || 'User',
            receiverAvatar: receiverProfile?.avatar,
            isRead: (msg as any).isRead !== undefined ? (msg as any).isRead : true,
            type: (msg as any).type || 'message',
            createdAt: (msg as any).createdAt || (msg as any).$createdAt || new Date().toISOString(),
            metadata: (msg as any).metadata || {},
            isCurrentUser: msg.senderId === currentUser.$id
          };
        }));
        
        setConversationMessages(mappedMessages);
      } catch (error) {
        console.error('Error loading messages:', error);
      }
    };

    if (selectedUser?.id) {
      loadMessages();
    }
    
    return () => {
      isMounted = false;
    };
  }, [selectedUser?.id, currentUser?.$id, fetchChatMessages]);

  // Update local messages when new messages come in from the context
  useEffect(() => {
    if (!selectedUser || !currentUser?.$id) return;
    
    const relevantMessages = (allMessages || []).filter(
      (msg: ChatMessage) => 
        (msg.senderId === selectedUser.id && msg.receiverId === currentUser.$id) ||
        (msg.receiverId === selectedUser.id && msg.senderId === currentUser.$id) ||
        (msg.senderId === currentUser.$id && msg.receiverId === selectedUser.id)
    );
    
    if (relevantMessages.length === 0) return;
    
    const mappedMessages: Message[] = relevantMessages.map((msg: ChatMessage) => ({
      id: msg.id || (msg as any).$id || `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      content: msg.content,
      senderId: msg.senderId,
      receiverId: (msg as any).receiverId || selectedUser.id,
      isRead: (msg as any).isRead !== undefined ? (msg as any).isRead : true,
      type: (msg as any).type || 'message',
      createdAt: (msg as any).createdAt || (msg as any).$createdAt || new Date().toISOString(),
      metadata: (msg as any).metadata || {},
      isCurrentUser: msg.senderId === currentUser.$id
    }));
    
    setConversationMessages(prevMessages => {
      // Only update if there are actual changes to prevent unnecessary re-renders
      const existingIds = new Set(prevMessages.map(m => m.id));
      const newMessages = mappedMessages.filter(msg => !existingIds.has(msg.id));
      
      if (newMessages.length === 0) return prevMessages;
      
      return [...prevMessages, ...newMessages].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    });
  }, [allMessages, selectedUser, currentUser?.$id]);

  // Group messages by date
  const groupedMessages = useMemo<Array<{ date: string; messages: Message[] }>>(() => {
    if (!conversationMessages.length) return [];
    
    const groups: { [key: string]: Message[] } = {};
    
    // Sort messages by timestamp (oldest first)
    const sortedMessages = [...conversationMessages].sort(
      (a: Message, b: Message) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    
    // Group messages by date
    sortedMessages.forEach((message: Message) => {
      const date = new Date(message.createdAt).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    
    // Convert to array format
    return Object.entries(groups).map(([date, messages]) => ({
      date: format(new Date(date), 'MMMM d, yyyy'),
      messages
    }));
  }, [conversationMessages]);
  
  // Handle search input change with debounce
  const handleSearchChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(async () => {
      if (!query.trim()) {
        setSearchResults([]);
        return;
      }

      // If user is admin or subadmin, search teachers
      if (currentUser?.role === 'admin' || currentUser?.role === 'subadmin') {
        try {
          const teacherResults = await searchTeachers(query);
          setSearchResults(teacherResults.map(teacher => ({
            id: teacher.id,
            name: teacher.name,
            email: teacher.email || '',
            avatar: teacher.avatar || '',
            role: teacher.role || 'teacher',
            isOnline: teacher.isOnline || false,
            lastSeen: new Date().toISOString()
          })));
        } catch (error) {
          console.error('Error searching teachers:', error);
          setSearchResults([]);
        }
      } else {
        // Regular user search in conversations
        if (conversations) {
          const queryLower = query.toLowerCase().trim();
          const results = conversations.filter((conv) => {
            const nameMatch = conv.name?.toLowerCase().includes(queryLower) || false;
            const emailMatch = conv.email?.toLowerCase().includes(queryLower) || false;
            const nameParts = conv.name?.toLowerCase().split(' ') || [];
            const partialNameMatch = nameParts.some(part => part.startsWith(queryLower));
            return nameMatch || emailMatch || partialNameMatch;
          });
          
          setSearchResults(results.map((conv) => ({
            id: conv.id,
            name: conv.name,
            email: conv.email || '',
            avatar: conv.avatar || '',
            role: conv.role || 'user',
            isOnline: conv.isOnline || false,
            lastSeen: new Date().toISOString()
          })));
        } else {
          setSearchResults([]);
        }
      }
    }, 300);
  }, [conversations, currentUser?.role, searchTeachers]);

  // Handle sending a message
  const handleSendMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !selectedUser || isSending) return;
    
    try {
      setIsSending(true);
      await sendMessage(message, selectedUser.id, { type: 'message' });
      setMessage('');
      // Auto-scroll to bottom after sending a message
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  }, [message, selectedUser, isSending, sendMessage]);

  // Handle key down in message input (for shift+enter new line)
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e as unknown as React.FormEvent);
    }
  }, [handleSendMessage]);

  // Auto-resize textarea as user types
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [message]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [groupedMessages]);

  // Update local conversations when conversations change
  useEffect(() => {
    const updateConversations = async () => {
      if (!conversations || conversations.length === 0) return;
      
      const updatedConversations = await Promise.all(conversations.map(async (conv) => {
        try {
          // Get the other user's profile
          const otherUserId = conv.id;
          const profile = await chatContext?.getUserProfile?.(otherUserId) || {};
          
          return {
            ...conv,
            name: profile?.name || conv.name || 'User',
            avatar: profile?.avatar || conv.avatar,
            lastMessage: {
              id: conv.lastMessage?.id || '',
              content: conv.lastMessage?.content || '',
              timestamp: conv.lastMessage?.createdAt || new Date().toISOString(),
              isRead: conv.lastMessage?.isRead !== undefined ? conv.lastMessage.isRead : true,
              senderId: conv.lastMessage?.senderId || '',
              type: conv.lastMessage?.type || 'message',
              metadata: conv.lastMessage?.metadata || {}
            },
            unreadCount: (conv as any).unread || 0
          } as Conversation;
        } catch (error) {
          console.error('Error updating conversation:', error);
          return conv;
        }
      }));
      
      setLocalConversations(updatedConversations);
    };
    
    updateConversations();
  }, [conversations, chatContext]);

  // Set selected user when receiverId changes
  useEffect(() => {
    if (receiverId) {
      const user = conversations.find(c => c.id === receiverId);
      if (user) {
        setSelectedUser({
          id: user.id,
          name: user.name,
          email: user.email || '',
          avatar: user.avatar,
          role: user.role,
          isOnline: user.isOnline
        });
        setShowInbox(false);
      }
    }
  }, [receiverId, conversations]);

  return {
    isMinimized,
    isMobile,
    showInbox,
    setShowInbox,
    selectedUser,
    setSelectedUser,
    isSending,
    searchQuery,
    searchResults,
    message,
    setMessage,
    messagesEndRef,
    textareaRef,
    conversations,
    currentUser,
    formatMessageTime,
    formatConversationTime,
    handleMinimize,
    handleRestore,
    handleSearchChange,
    handleSendMessage,
    handleKeyDown,
    groupedMessages
  };
};

const ChatWindowV2 = ({
  isOpen,
  onClose,
  onMinimize,
  receiverId,
  user: _authUser // Marked as unused with underscore
}: ChatWindowProps) => {
  // Use the custom hook to manage all state and callbacks
  const {
    isMinimized,
    isMobile,
    showInbox,
    setShowInbox,
    selectedUser,
    setSelectedUser,
    isSending,
    searchQuery,
    searchResults,
    message,
    setMessage,
    messagesEndRef,
    textareaRef,
    conversations,
    currentUser,
    formatMessageTime,
    formatConversationTime,
    handleMinimize,
    handleRestore,
    handleSearchChange,
    handleSendMessage,
    handleKeyDown,
    groupedMessages
  } = useChatWindowState(isOpen, onMinimize, receiverId);

  // Early return must be after all hooks
  if (!isOpen) return null;

  // Render minimized state
  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={handleRestore}
          className="rounded-full h-14 w-14 p-0 bg-blue-500 text-white shadow-lg hover:bg-blue-600 transition-all"
          size="icon"
        >
          <MessageSquare className="h-6 w-6" />
        </Button>
      </div>
    );
  }

  // Check if current user is admin or subadmin
  const isAdminOrSubadmin = currentUser?.role === 'admin' || currentUser?.role === 'subadmin';

  // Header JSX - moved directly into the component return
  const headerContent = selectedUser && !showInbox && (
    <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center space-x-3">
        <button 
          onClick={() => setShowInbox(true)}
          className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          aria-label="Back to inbox"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="relative">
          <Avatar className="h-10 w-10">
            {selectedUser.avatar ? (
              <AvatarImage 
                src={selectedUser.avatar} 
                alt={isAdminOrSubadmin ? selectedUser.name || selectedUser.role : selectedUser.role || 'User'}
                className="object-cover h-full w-full"
              />
            ) : null}
            <AvatarFallback className="bg-blue-100 text-blue-600">
              {isAdminOrSubadmin 
                ? (selectedUser.name || selectedUser.role || 'U').charAt(0).toUpperCase()
                : (selectedUser.role || 'U').charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {selectedUser.isOnline && (
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></span>
          )}
        </div>
        <div>
          <h3 className="font-medium">
            {isAdminOrSubadmin ? selectedUser.name || selectedUser.role : selectedUser.role || 'User'}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {selectedUser.isOnline ? 'Online' : 'Offline'}
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <button
          onClick={handleMinimize}
          className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          aria-label="Minimize chat"
        >
          <Minimize2 size={18} />
        </button>
        <button
          onClick={onClose}
          className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          aria-label="Close chat"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );

  // Message input JSX
  const messageInput = (
    <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 dark:border-gray-700">
      <div className="flex items-end space-x-2">
        <button
          type="button"
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          aria-label="Attach file"
        >
          <Paperclip size={20} />
        </button>
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex h-8 w-full rounded-md border border-input bg-background px-1 py-0.5 text-sm text-black ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-10"
            rows={1}
          />
          <div className="absolute right-2 bottom-2 flex space-x-1">
            <button
              type="button"
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label="Send voice message"
            >
              <Mic size={18} />
            </button>
          </div>
        </div>
        <Button 
          type="submit" 
          disabled={!message.trim() || isSending}
          className="h-10 w-10 p-0 rounded-full"
          aria-label="Send message"
        >
          {isSending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send size={16} />
          )}
        </Button>
      </div>
    </form>
  );

  // Get user profile picture
  const getUserAvatar = (userId: string, message?: Message) => {
    // If this is the current user, return their avatar
    if (userId === currentUser?.$id) {
      return currentUser?.avatar || '';
    }
    
    // If we have the avatar in the message object, use it
    if (message?.senderAvatar && message.senderId === userId) {
      return message.senderAvatar;
    }
    
    // If we have a selected user and this is their message, use their avatar
    if (selectedUser?.id === userId) {
      return selectedUser.avatar || '';
    }
    
    // If we have the user in conversations, use their avatar
    const conversation = conversations.find(c => c.id === userId);
    if (conversation?.avatar) {
      return conversation.avatar;
    }
    
    return '';
  };

  // Get user name for avatar fallback
  const getUserInitials = (userId: string, message?: Message) => {
    // If this is the current user, return their initial
    if (userId === currentUser?.$id) {
      return currentUser?.name?.charAt(0).toUpperCase() || 'U';
    }
    
    // If we have the name in the message object, use it
    if (message?.senderName && message.senderId === userId) {
      return message.senderName.charAt(0).toUpperCase();
    }
    
    // If we have a selected user and this is their message, use their name
    if (selectedUser?.id === userId) {
      return selectedUser.name?.charAt(0).toUpperCase() || 'U';
    }
    
    // If we have the user in conversations, use their name
    const conversation = conversations.find(c => c.id === userId);
    if (conversation?.name) {
      return conversation.name.charAt(0).toUpperCase();
    }
    
    return 'U';
  };

  // Messages JSX
  const messagesContent = (
    <div className="flex-1 overflow-y-auto p-4 space-y-6">
      {groupedMessages.length > 0 ? (
        groupedMessages.map((group, groupIndex) => (
          <div key={groupIndex} className="space-y-4">
            <div className="text-center">
              <span className="inline-block px-2 py-1 text-xs font-medium text-gray-500 bg-gray-100 dark:bg-gray-800 rounded-full">
                {group.date}
              </span>
            </div>
            <div className="space-y-4">
              {group.messages.map((msg, msgIndex) => {
                const isCurrentUser = msg.senderId === currentUser?.$id;
                const showAvatar = msgIndex === 0 || 
                  group.messages[msgIndex - 1]?.senderId !== msg.senderId || 
                  (new Date(msg.createdAt).getTime() - new Date(group.messages[msgIndex - 1]?.createdAt).getTime()) > 5 * 60 * 1000; // 5 minutes
                
                const senderAvatar = isCurrentUser 
                  ? currentUser?.avatar 
                  : selectedUser?.avatar || msg.senderAvatar;
                const senderName = isCurrentUser 
                  ? currentUser?.name || 'You' 
                  : selectedUser?.name || 'User';
                
                return (
                  <div
                    key={msg.id}
                    className={`flex items-end gap-2 ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    <div className={`flex-shrink-0 ${isCurrentUser ? 'invisible' : ''}`}>
                      {showAvatar ? (
                        <Avatar className="h-8 w-8">
                          {senderAvatar ? (
                            <AvatarImage 
                              src={senderAvatar}
                              alt={senderName}
                              className="object-cover h-full w-full"
                            />
                          ) : null}
                          <AvatarFallback className="text-xs bg-blue-100 text-blue-600">
                            {senderName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className="h-8 w-8" />
                      )}
                    </div>
                    <div
                      className={`max-w-[70%] rounded-lg px-4 py-2 ${
                        isCurrentUser
                          ? 'bg-blue-500 text-white rounded-br-none'
                          : 'bg-gray-100 dark:bg-gray-800 rounded-bl-none'
                      }`}
                    >
                      {!isCurrentUser && showAvatar && (
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {currentUser?.role === 'admin' || currentUser?.role === 'subadmin'
                            ? `${senderName || 'User'}${msg.senderRole ? ` (${msg.senderRole})` : ''}`
                            : (msg.senderRole || 'User')}
                        </p>
                      )}
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                      <div className={`text-xs mt-1 flex items-center justify-end space-x-1 ${
                        isCurrentUser ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        <span>{formatMessageTime(msg.createdAt)}</span>
                        {isCurrentUser && (
                          <span>
                            {msg.isRead ? (
                              <CheckCheck size={14} className="inline" />
                            ) : (
                              <Check size={14} className="inline" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      ) : (
        <div className="h-full flex items-center justify-center text-gray-500">
          <p>No messages yet. Start the conversation!</p>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );

  // Conversation list JSX
  const conversationList = (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold">Messages</h2>
      </div>
      <div className="p-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search conversations..."
            className={`${styles.searchInput} flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-black ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-10`}
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {searchResults.length > 0 ? (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {searchResults.map((user) => (
              <button
                key={user.id}
                className="w-full p-3 text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                onClick={() => {
                  setSelectedUser(user);
                  setShowInbox(false);
                }}
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Avatar>
                      <AvatarImage 
                        src={user.avatar} 
                        alt={isAdminOrSubadmin ? user.name || user.role : user.role || 'User'}
                        className="object-cover"
                      />
                      <AvatarFallback>
                        {isAdminOrSubadmin 
                          ? (user.name || user.role || 'U').charAt(0).toUpperCase()
                          : (user.role || 'U').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {user.isOnline && (
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <p className="font-medium truncate">
                        {isAdminOrSubadmin ? user.name || user.role : user.role || 'User'}
                      </p>
                      {user.lastSeen && (
                        <span className="text-xs text-gray-500">
                          {formatConversationTime(user.lastSeen)}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 truncate">
                      {user.email}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {conversations.map((conversation) => {
              const lastMessage = conversation.lastMessage;
              const isCurrentUser = lastMessage?.senderId === currentUser?.$id;
              const unreadCount = conversation.unreadCount || 0;
              
              return (
                <button
                  key={conversation.id}
                  className={`w-full p-3 text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
                    !lastMessage?.isRead && !isCurrentUser ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                  onClick={() => {
                    setSelectedUser({
                      id: conversation.id,
                      name: conversation.name,
                      email: conversation.email || '',
                      avatar: conversation.avatar,
                      role: conversation.role,
                      isOnline: conversation.isOnline
                    });
                    setShowInbox(false);
                  }}
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        {conversation.avatar ? (
                          <AvatarImage 
                            src={conversation.avatar} 
                            alt={isAdminOrSubadmin ? conversation.name || conversation.role : conversation.role || 'User'}
                            className="object-cover h-full w-full"
                          />
                        ) : null}
                        <AvatarFallback className="bg-blue-100 text-blue-600 font-medium">
                          {isAdminOrSubadmin 
                            ? (conversation.name || conversation.role || 'U').charAt(0).toUpperCase()
                            : (conversation.role || 'U').charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {conversation.isOnline && (
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <p className="font-medium truncate">
                          {isAdminOrSubadmin ? conversation.name || conversation.role : conversation.role || 'User'}
                        </p>
                        {lastMessage?.createdAt && (
                          <span className="text-xs text-gray-500">
                            {formatConversationTime(lastMessage.createdAt)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500 truncate max-w-[180px]">
                          {isCurrentUser && 'You: '}
                          {lastMessage?.content || 'No messages yet'}
                        </p>
                        {unreadCount > 0 && (
                          <span className="bg-blue-500 text-white text-xs font-medium rounded-full h-5 min-w-5 flex items-center justify-center">
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={containerVariants}
      className={`fixed bottom-4 right-4 w-full max-w-md h-[600px] bg-white dark:bg-gray-900 rounded-lg shadow-xl flex flex-col z-50 overflow-hidden ${
        isMobile ? 'top-0 left-0 max-w-none rounded-none' : ''
      }`}
    >
      {selectedUser && !showInbox ? (
        <>
          {headerContent}
          {messagesContent}
          {messageInput}
        </>
      ) : (
        <>
          {conversationList}
          {searchResults.length > 0 ? (
            <div className="flex-1 overflow-y-auto">
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {searchResults.map((user) => (
                  <button
                    key={user.id}
                    className="w-full p-3 text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    onClick={() => {
                      setSelectedUser(user);
                      setShowInbox(false);
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <Avatar>
                          <AvatarImage src={user.avatar} alt={user.name} />
                          <AvatarFallback>
                            {user.name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        {user.isOnline && (
                          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <p className="font-medium truncate">{user.name}</p>
                          {user.lastSeen && (
                            <span className="text-xs text-gray-500">
                              {formatConversationTime(user.lastSeen)}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {conversations.map((conversation) => {
                  const lastMessage = conversation.lastMessage;
                  const isCurrentUser = lastMessage?.senderId === currentUser?.$id;
                  const unreadCount = (conversation as any).unreadCount || 0;
                  
                  return (
                    <button
                      key={conversation.id}
                      className={`w-full p-3 text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
                        !lastMessage?.isRead && !isCurrentUser ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                      }`}
                      onClick={() => {
                        setSelectedUser({
                          id: conversation.id,
                          name: conversation.name,
                          email: conversation.email || '',
                          avatar: conversation.avatar,
                          role: conversation.role,
                          isOnline: conversation.isOnline
                        });
                        setShowInbox(false);
                      }}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <Avatar>
                            <AvatarImage src={conversation.avatar} alt={conversation.name} />
                            <AvatarFallback>
                              {conversation.name?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          {conversation.isOnline && (
                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center">
                            <p className="font-medium truncate">{conversation.name}</p>
                            {lastMessage?.createdAt && (
                              <span className="text-xs text-gray-500">
                                {formatConversationTime(lastMessage.createdAt)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-500 truncate max-w-[180px]">
                              {isCurrentUser && 'You: '}
                              {lastMessage?.content || 'No messages yet'}
                            </p>
                            {unreadCount > 0 && (
                              <span className="bg-blue-500 text-white text-xs font-medium rounded-full h-5 min-w-5 flex items-center justify-center">
                                {unreadCount > 9 ? '9+' : unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
};

export default ChatWindowV2;
