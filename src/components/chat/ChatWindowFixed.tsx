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
import { useChat, type ChatMessage } from '@/contexts/ChatContext';

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
}

interface ChatConversation {
  id: string;
  name: string;
  displayName?: string;
  role?: string;
  lastMessage: {
    content: string;
    timestamp: string;
    isRead: boolean;
    isCurrentUser: boolean;
    senderId?: string;
    createdAt?: string;
  };
  lastMessageTime: string;
  unreadCount: number;
  isOnline: boolean;
  avatar: string;
  email: string;
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
      staggerChildren: 0.1,
      when: "beforeChildren"
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.3
    }
  }
};

const messageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.2 } },
  exit: { opacity: 0, x: -10, transition: { duration: 0.15 } }
};

const slideIn = {
  hidden: { x: '100%', opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { type: 'spring', damping: 30, stiffness: 300 } },
  exit: { x: '100%', opacity: 0, transition: { duration: 0.2 } }
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.2 } }
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
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
};

const ChatWindow: React.FC<ChatWindowProps> = ({
  isOpen,
  onClose,
  onMinimize,
  receiverId,
  user: authUser
}) => {
  // State hooks
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
  
  // Safe date formatting utility
  const safeFormatDate = useCallback((dateString: string, formatStr: string): string => {
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
  }, []);

  // Format message time (e.g., '2:30 PM')
  const formatMessageTime = useCallback((dateString: string) => {
    return safeFormatDate(dateString, 'h:mm a');
  }, [safeFormatDate]);

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
  
  // Group messages by date
  const groupedMessages = useMemo<Array<{ date: string; messages: Message[] }>>(() => {
    // This will be implemented later
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
  
  // Handle message input change
  const handleMessageChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
  }, []);
  
  // Handle send message
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

  // Handle key down in message input
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e as unknown as React.FormEvent);
    }
  }, [handleSendMessage]);

  // Handle user selection
  const handleSelectUser = useCallback((user: ChatUser) => {
    setSelectedUser(user);
    setShowInbox(false);
  }, []);

  // Handle conversation selection
  const handleSelectConversation = useCallback((conversation: ChatConversation) => {
    const user: ChatUser = {
      id: conversation.id,
      name: conversation.name,
      email: conversation.email,
      avatar: conversation.avatar,
      role: conversation.role,
      isOnline: conversation.isOnline
    };
    setSelectedUser(user);
    setShowInbox(false);
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [groupedMessages]);

  // Set initial selected user if receiverId is provided
  useEffect(() => {
    if (receiverId && conversations.length > 0) {
      const conversation = conversations.find(conv => conv.id === receiverId);
      if (conversation) {
        handleSelectConversation(conversation);
      }
    }
  }, [receiverId, conversations, handleSelectConversation]);

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Render message list
  const renderMessages = useCallback(() => {
    if (groupedMessages.length === 0) {
      return (
        <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
          <p>No messages yet. Start the conversation!</p>
        </div>
      );
    }

    return (
      <div className="flex-1 overflow-y-auto p-4">
        {groupedMessages.map((group, groupIndex) => (
          <div key={groupIndex} className="mb-6">
            <div className="text-center text-xs text-gray-500 dark:text-gray-400 mb-2">
              {group.date}
            </div>
            <div className="space-y-2">
              {group.messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  className={`flex ${msg.senderId === currentUser?.$id ? 'justify-end' : 'justify-start'}`}
                  variants={messageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <div 
                    className={`max-w-xs md:max-w-md lg:max-w-lg xl:max-w-xl rounded-lg px-4 py-2 ${
                      msg.senderId === currentUser?.$id 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                    <div className="text-xs mt-1 text-right opacity-70">
                      {formatMessageTime(msg.createdAt)}
                      {msg.senderId === currentUser?.$id && (
                        <span className="ml-1">
                          {msg.isRead ? <CheckCheck size={14} className="inline" /> : <Check size={14} className="inline" />}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
    );
  }, [groupedMessages, currentUser, formatMessageTime]);

  // Render chat header
  const renderHeader = useCallback(() => {
    if (!selectedUser) return null;

    return (
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          {isMobile && (
            <button 
              onClick={() => setShowInbox(true)}
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <ChevronLeft size={20} />
            </button>
          )}
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
            onClick={onMinimize}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            title="Minimize"
          >
            <Minimize2 size={18} />
          </button>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    );
  }, [selectedUser, isMobile, onClose, onMinimize]);

  // Render message input
  const renderInput = useCallback(() => (
    <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 dark:border-gray-700">
      <div className="flex items-end space-x-2">
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={handleMessageChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="min-h-[40px] max-h-32 resize-none pr-10"
            rows={1}
          />
          <div className="absolute right-2 bottom-2 flex space-x-1">
            <button
              type="button"
              className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              title="Attach file"
            >
              <Paperclip size={18} />
            </button>
            <button
              type="button"
              className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              title="Send image"
            >
              <ImageIcon size={18} />
            </button>
          </div>
        </div>
        <button
          type="submit"
          disabled={!message.trim() || isSending}
          className="p-2 rounded-full bg-blue-500 text-white disabled:opacity-50 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          title="Send message"
        >
          {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        </button>
      </div>
    </form>
  ), [message, isSending, handleMessageChange, handleKeyDown, handleSendMessage]);

  // Render conversation list
  const renderInbox = useCallback(() => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="pl-10"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {searchResults.length > 0 ? (
          searchResults.map((user) => (
            <div
              key={user.id}
              onClick={() => handleSelectUser(user)}
              className="p-4 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex items-center space-x-3"
            >
              <Avatar>
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback>{user.name?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{user.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
              </div>
            </div>
          ))
        ) : (
          conversations.map((conversation) => (
            <div
              key={conversation.id}
              onClick={() => handleSelectConversation(conversation)}
              className={`p-4 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex items-center space-x-3 ${
                selectedUser?.id === conversation.id ? 'bg-gray-100 dark:bg-gray-700' : ''
              }`}
            >
              <div className="relative">
                <Avatar>
                  <AvatarImage src={conversation.avatar} alt={conversation.name} />
                  <AvatarFallback>{conversation.name?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                {conversation.isOnline && (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <p className="font-medium truncate">{conversation.name}</p>
                  <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap ml-2">
                    {formatConversationTime(conversation.lastMessageTime)}
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {conversation.lastMessage.isCurrentUser ? 'You: ' : ''}
                  {conversation.lastMessage.content}
                </p>
              </div>
              {conversation.unreadCount > 0 && (
                <span className="bg-blue-500 text-white text-xs font-medium rounded-full h-5 w-5 flex items-center justify-center">
                  {conversation.unreadCount}
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  ), [
    searchQuery, 
    searchResults, 
    conversations, 
    selectedUser, 
    handleSearchChange, 
    handleSelectUser, 
    handleSelectConversation
  ]);

  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed bottom-0 right-4 w-full max-w-md h-[600px] bg-white dark:bg-gray-800 rounded-t-lg shadow-xl flex flex-col z-50 overflow-hidden"
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={slideIn}
      layout
    >
      {showInbox || !selectedUser ? renderInbox() : (
        <>
          {renderHeader()}
          {renderMessages()}
          {renderInput()}
        </>
      )}
    </motion.div>
  );
};

export default ChatWindow;
