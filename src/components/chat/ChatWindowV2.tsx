import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  Loader2, 
  Send, 
  X, 
  ChevronLeft, 
  Search, 
  Paperclip, 
  Image as ImageIcon,
  Mic,
  Check,
  CheckCheck,
  MessageSquare,
  Menu,
  Minimize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isToday, isYesterday } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useChat, type ChatMessage, type Conversation } from '@/contexts/ChatContext';

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

interface Message extends Omit<ChatMessage, 'receiverId' | 'type'> {
  id: string;
  $id?: string;
  content: string;
  senderId: string;
  receiverId: string;
  isRead: boolean;
  createdAt: string;
  type: 'message' | 'video_rejected' | 'video_approved' | 'info';
  metadata?: any;
  $createdAt?: string;
  $updatedAt?: string;
  recipientId?: string;
  isCurrentUser?: boolean;
}

interface ChatConversation extends Omit<Conversation, 'lastMessage' | 'unreadCount'> {
  lastMessage: {
    content: string;
    timestamp: string;
    isRead: boolean;
    isCurrentUser?: boolean;
    senderId?: string;
    createdAt?: string;
  };
  lastMessageTime: string;
  unreadCount?: number;
  isOnline?: boolean;
  avatar?: string;
  email?: string;
  userId?: string;
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
const useChatWindowState = (isOpen: boolean, onMinimize: () => void) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const isMobile = useIsMobile();
  const [showInbox, setShowInbox] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ChatUser[]>([]);
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  
  // Context and data
  const { conversations, sendMessage } = useChat();
  const { user: currentUser } = useAuth() as { user: AuthUser | null };

  // Format message time (e.g., '2:30 PM')
  const formatMessageTime = useCallback((dateString: string) => {
    return safeFormatDate(dateString, 'h:mm a');
  }, []);

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
  }, []); // Removed formatMessageTime from deps as it's not used here

  const handleMinimize = useCallback(() => {
    setIsMinimized(true);
    onMinimize?.();
  }, [onMinimize]);

  const handleRestore = useCallback(() => {
    setIsMinimized(false);
  }, []);

  // Group messages by date
  const groupedMessages = useMemo<Array<{ date: string; messages: Message[] }>>(() => {
    // Implementation will be added later
    return [];
  }, []);
  
  // Handle search input change with debounce
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      if (query.trim()) {
        const results = conversations.filter(conv => 
          conv.name.toLowerCase().includes(query.toLowerCase()) ||
          (conv.email && conv.email.toLowerCase().includes(query.toLowerCase()))
        );
        
        setSearchResults(results.map(conv => ({
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
    }, 300);
  }, [conversations]);

  // Handle sending a message
  const handleSendMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !selectedUser || isSending) return;
    
    try {
      setIsSending(true);
      await sendMessage({
        content: message,
        receiverId: selectedUser.id,
      });
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

const ChatWindowV2: React.FC<ChatWindowProps> = ({
  isOpen,
  onClose,
  onMinimize,
  receiverId,
  user: authUser
}) => {
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
  } = useChatWindowState(isOpen, onMinimize);

  if (!isOpen) return null;

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

  // Render chat header
  const renderHeader = useCallback(() => {
    if (!selectedUser) return null;

    return (
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
            <Avatar>
              <AvatarImage src={selectedUser.avatar} alt={selectedUser.name} />
              <AvatarFallback>
                {selectedUser.name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            {selectedUser.isOnline && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></span>
            )}
          </div>
          <div>
            <h3 className="font-medium">{selectedUser.name}</h3>
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
  }, [selectedUser, handleMinimize, onClose, setShowInbox]);

  // Render message input
  const renderMessageInput = useCallback(() => (
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
            className="min-h-[44px] max-h-40 pr-12 resize-none"
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
  ), [message, isSending, handleSendMessage, handleKeyDown]);

  // Render chat messages
  const renderMessages = useCallback(() => (
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
              {group.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.senderId === currentUser?.$id ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      msg.senderId === currentUser?.$id
                        ? 'bg-blue-500 text-white rounded-br-none'
                        : 'bg-gray-100 dark:bg-gray-800 rounded-bl-none'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    <div className={`text-xs mt-1 flex items-center justify-end space-x-1 ${
                      msg.senderId === currentUser?.$id ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      <span>{formatMessageTime(msg.createdAt)}</span>
                      {msg.senderId === currentUser?.$id && (
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
              ))}
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
  ), [groupedMessages, currentUser, formatMessageTime]);

  // Render conversation list
  const renderConversationList = useCallback(() => (
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
            className="pl-10"
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
        )}
      </div>
    </div>
  ), [conversations, currentUser, searchQuery, searchResults, formatConversationTime, handleSearchChange, setSelectedUser, setShowInbox]);

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
          {renderHeader()}
          {renderMessages()}
          {renderMessageInput()}
        </>
      ) : (
        renderConversationList()
      )}
    </motion.div>
  );
};

export default ChatWindowV2;
