import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Search, Loader2, Send, X } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/contexts/ChatContext';
import { searchTeachers, ChatUser as ServiceChatUser, Message as ServiceMessage } from '@/services/chatService';

type Message = ServiceMessage & {
  id: string;
  $id?: string;
  createdAt?: string;
  isRead?: boolean;
};

interface ChatUser extends ServiceChatUser {
  isOnline: boolean;
  imageUrl?: string;
  role?: string;
}

interface ChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
  receiverId?: string;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ isOpen, onClose, receiverId = '' }) => {
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Hooks
  const { user } = useAuth();
  const { 
    messages = [], 
    sendMessage, 
    markAsRead, 
    fetchMessages,
    currentChat,
    setCurrentChat,
  } = useChat();

  // State
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ChatUser[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<ChatUser | null>(null);
  const [showChatList, setShowChatList] = useState(true);

  // Format message date
  const formatMessageDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMMM d, yyyy');
  }, []);

  // Format message time
  const formatMessageTime = useCallback((dateString: string) => {
    return format(new Date(dateString), 'h:mm a');
  }, []);

  // Handle search input change with debounce
  const handleSearchChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await searchTeachers(query);
        const normalizedResults = results.map(teacher => ({
          ...teacher,
          isOnline: Boolean(teacher.isOnline),
          imageUrl: teacher.avatar,
          role: teacher.role || 'teacher'
        }));
        setSearchResults(normalizedResults);
      } catch (error) {
        console.error('Error searching teachers:', error);
        setSearchResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 500);
  }, []);

  // Handle teacher selection
  const handleSelectTeacher = useCallback((teacher: ChatUser) => {
    setSelectedTeacher(teacher);
    setCurrentChat(teacher.id);
    setShowChatList(false);
    
    // Mark messages as read when selecting a teacher
    if (user) {
      const unreadMessages = messages
        .filter((msg: Message) => 
          msg.senderId === teacher.id && 
          msg.receiverId === user.$id && 
          !msg.read
        )
        .map(msg => msg.id || msg.$id || '');
      
      if (unreadMessages.length > 0) {
        markAsRead(unreadMessages);
      }
    }
  }, [messages, user, markAsRead, setCurrentChat]);

  // Handle sending a message
  const handleSendMessage = useCallback(async () => {
    if (!message.trim() || !selectedTeacher || !user) return;

    try {
      await sendMessage({
        content: message.trim(),
        receiverId: selectedTeacher.id,
        senderId: user.$id,
        read: false
      });
      setMessage('');
      
      // Scroll to bottom after sending a message
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }, [message, selectedTeacher, user, sendMessage]);

  // Handle keyboard events
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  // Effect to handle keyboard shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isOpen, onClose]);

  // Effect to fetch messages when chat changes
  useEffect(() => {
    if (currentChat && user) {
      fetchMessages(currentChat, user.$id);
    }
  }, [currentChat, user, fetchMessages]);

  // Effect to scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Group messages by date
  const groupedMessages = useMemo(() => {
    if (!messages || !Array.isArray(messages)) return [];
    
    const groups: Record<string, Message[]> = {};
    
    messages.forEach((msg: Message) => {
      const date = msg.$createdAt || msg.createdAt || '';
      const dateKey = formatMessageDate(date);
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      
      groups[dateKey].push(msg);
    });
    
    return Object.entries(groups).map(([date, msgs]) => ({
      date,
      messages: msgs.sort((a, b) => 
        new Date(a.$createdAt || a.createdAt || 0).getTime() - 
        new Date(b.$createdAt || b.createdAt || 0).getTime()
      )
    }));
  }, [messages, formatMessageDate]);

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 w-96 max-h-[80vh] bg-white rounded-lg shadow-xl flex flex-col overflow-hidden z-50">
      {/* Header */}
      <div className="bg-primary text-white p-4 flex items-center justify-between">
        <h3 className="font-semibold">Messages</h3>
        <button 
          onClick={onClose}
          className="text-white hover:bg-white/20 p-1 rounded-full"
          aria-label="Close chat"
        >
          <X size={20} />
        </button>
      </div>

      {/* Search */}
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <Input
            type="text"
            placeholder="Search teachers..."
            className="pl-10 w-full"
            value={searchQuery}
            onChange={handleSearchChange}
          />
          {isLoading && (
            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 animate-spin text-gray-400" size={16} />
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {groupedMessages.map(({ date, messages }) => (
          <div key={date} className="space-y-4">
            <div className="text-center text-xs text-gray-500 my-2">
              {date}
            </div>
            {messages.map((msg) => (
              <div
                key={msg.id || msg.$id}
                className={`flex ${msg.senderId === user?.$id ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs p-3 rounded-lg ${
                    msg.senderId === user?.$id
                      ? 'bg-primary text-white rounded-br-none'
                      : 'bg-gray-100 text-gray-800 rounded-bl-none'
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                  <p className="text-xs mt-1 opacity-75 text-right">
                    {formatMessageTime(msg.$createdAt || msg.createdAt || '')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <div className="p-3 border-t">
        <div className="flex items-end gap-2">
          <Textarea
            ref={textareaRef}
            placeholder="Type a message..."
            className="resize-none flex-1 min-h-[40px] max-h-32"
            rows={1}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <Button 
            size="icon" 
            className="h-10 w-10"
            onClick={handleSendMessage}
            disabled={!message.trim()}
          >
            <Send size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
