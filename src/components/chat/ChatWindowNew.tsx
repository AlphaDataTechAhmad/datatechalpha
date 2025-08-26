import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  Loader2, 
  Send, 
  X, 
  Paperclip, 
  Smile, 
  Phone, 
  Video, 
  MessageSquare,
  Search,
  ChevronLeft
} from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/contexts/ChatContext';
import { searchTeachers } from '@/services/chatService';
import { cn } from '@/lib/utils';

// Types
type Message = {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
  isRead: boolean;
  $id?: string;
};

type ChatUser = {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  isOnline: boolean;
  lastSeen?: string;
  imageUrl?: string;
};

interface GroupedMessages {
  date: string;
  messages: Message[];
}

interface ChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
  receiverId?: string;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ 
  isOpen, 
  onClose, 
  receiverId = '' 
}) => {
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  
  // Context
  const { user } = useAuth();
  const { currentChat, setCurrentChat, sendMessage, fetchMessages } = useChat();
  
  // State
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ChatUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  const [showChatList, setShowChatList] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Format message date
  const formatMessageDate = useCallback((dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isToday(date)) return 'Today';
      if (isYesterday(date)) return 'Yesterday';
      return format(date, 'MMMM d, yyyy');
    } catch (e) {
      return 'Unknown date';
    }
  }, []);

  // Format message time
  const formatMessageTime = useCallback((dateString: string) => {
    try {
      return format(new Date(dateString), 'h:mm a');
    } catch (e) {
      return '';
    }
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
    setError(null);
    
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await searchTeachers(query);
        const normalizedResults = results.map(teacher => ({
          ...teacher,
          isOnline: Boolean(teacher.isOnline),
          imageUrl: teacher.avatar || '',
          role: teacher.role || 'teacher'
        }));
        setSearchResults(normalizedResults);
      } catch (err) {
        console.error('Error searching teachers:', err);
        setError('Failed to load search results');
        setSearchResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 500);
  }, []);

  // Handle selecting a user
  const handleSelectUser = useCallback(async (user: ChatUser) => {
    setSelectedUser(user);
    setCurrentChat(user.id);
    setShowChatList(false);
    
    try {
      setIsLoading(true);
      const fetchedMessages = await fetchMessages(user.id);
      setMessages(fetchedMessages || []);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  }, [fetchMessages, setCurrentChat]);
  
  // Handle sending a message
  const handleSendMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || !selectedUser) return;
    
    const messageContent = message.trim();
    setMessage('');
    setIsSending(true);
    
    try {
      const newMessage: Message = {
        id: `temp-${Date.now()}`,
        content: messageContent,
        senderId: user?.id || '',
        createdAt: new Date().toISOString(),
        isRead: false
      };
      
      // Optimistic update
      setMessages(prev => [...prev, newMessage]);
      
      // Send message to server
      await sendMessage(selectedUser.id, messageContent);
      
      // Refresh messages to get the server-generated ID
      const updatedMessages = await fetchMessages(selectedUser.id);
      setMessages(updatedMessages || []);
      
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
      // Revert optimistic update on error
      setMessages(prev => prev.filter(m => !m.id.startsWith('temp-')));
    } finally {
      setIsSending(false);
    }
  }, [message, selectedUser, user?.id, sendMessage, fetchMessages]);

  // Handle keyboard events
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e as unknown as React.FormEvent);
    }
  }, [handleSendMessage]);

  // Effect to handle keyboard shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
      // Focus the message input when '/' is pressed
      if (e.key === '/' && isOpen) {
        e.preventDefault();
        textareaRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isOpen, onClose]);

  // Effect to load initial data
  useEffect(() => {
    if (receiverId && !selectedUser) {
      const loadReceiver = async () => {
        try {
          setIsLoading(true);
          const results = await searchTeachers('');
          const receiver = results.find(r => r.id === receiverId);
          if (receiver) {
            const normalizedUser: ChatUser = {
              ...receiver,
              isOnline: true,
              imageUrl: receiver.avatar || '',
              role: receiver.role || 'user'
            };
            await handleSelectUser(normalizedUser);
          }
        } catch (err) {
          console.error('Error loading receiver:', err);
          setError('Failed to load chat');
        } finally {
          setIsLoading(false);
        }
      };
      
      loadReceiver();
    }
  }, [receiverId, selectedUser, handleSelectUser]);

  // Group messages by date
  const groupedMessages = useMemo(() => {
    const groups: Record<string, Message[]> = {};
    
    messages.forEach((msg) => {
      const dateKey = formatMessageDate(msg.createdAt);
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(msg);
    });
    
    return Object.entries(groups).map(([date, msgs]) => ({
      date,
      messages: msgs.sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )
    }));
  }, [messages, formatMessageDate]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, showChatList]);

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 w-96 max-h-[80vh] bg-white dark:bg-gray-900 rounded-lg shadow-xl flex flex-col overflow-hidden z-50 border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="bg-primary text-white p-3 flex items-center justify-between">
        <div className="flex items-center">
          {!showChatList && selectedUser && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden mr-2 text-white hover:bg-white/20"
              onClick={() => setShowChatList(true)}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          )}
          <h3 className="font-semibold">
            {!showChatList && selectedUser ? selectedUser.name : 'Messages'}
          </h3>
        </div>
        <div className="flex items-center space-x-1">
          {!showChatList && selectedUser && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                title="Voice call"
              >
                <Phone className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                title="Video call"
              >
                <Video className="h-4 w-4" />
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={onClose}
            aria-label="Close chat"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Search teachers..."
            className="pl-10 w-full bg-gray-50 dark:bg-gray-800 border-0 focus-visible:ring-2 focus-visible:ring-primary"
            value={searchQuery}
            onChange={handleSearchChange}
          />
          {isLoading && (
            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 animate-spin text-gray-400 h-4 w-4" />
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat List */}
        {(showChatList || !selectedUser) && (
          <div className="w-full h-full flex flex-col">
            {searchResults.length > 0 && (
              <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 px-2 mb-1">Search Results</h4>
                <div className="space-y-1">
                  {searchResults.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                      onClick={() => handleSelectUser(user)}
                    >
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={user.imageUrl} alt={user.name} />
                        <AvatarFallback>
                          {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="ml-3">
                        <div className="flex items-center">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {user.name}
                          </p>
                          {user.isOnline && (
                            <span className="ml-2 w-2 h-2 bg-green-500 rounded-full"></span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{user.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {error && (
              <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/20">
                {error}
              </div>
            )}

            {!searchQuery && searchResults.length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-gray-500 dark:text-gray-400">
                <MessageSquare className="h-12 w-12 mb-3 opacity-30" />
                <p className="text-sm">Search for a teacher to start chatting</p>
              </div>
            )}
          </div>
        )}

        {/* Chat Window */}
        {!showChatList && selectedUser && (
          <div className="w-full h-full flex flex-col">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50 dark:bg-gray-900/50">
              {isLoading ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : groupedMessages.length > 0 ? (
                groupedMessages.map((group) => (
                  <div key={group.date} className="space-y-4">
                    <div className="sticky top-0 z-10 -mx-4 px-4 pt-2 pb-1 bg-gradient-to-b from-gray-50 to-transparent dark:from-gray-900/80 backdrop-blur-sm">
                      <div className="relative flex justify-center">
                        <span className="px-3 py-1 text-xs font-medium text-gray-500 bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 rounded-full">
                          {group.date}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-4">
                      {group.messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={cn(
                            'flex group',
                            msg.senderId === user?.id ? 'justify-end' : 'justify-start'
                          )}
                        >
                          <div
                            className={cn(
                              'relative max-w-xs md:max-w-md rounded-2xl px-4 py-2',
                              'transition-all duration-200',
                              msg.senderId === user?.id
                                ? 'bg-primary text-white rounded-br-sm shadow-md'
                                : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-sm shadow-sm border border-gray-100 dark:border-gray-700/70'
                            )}
                          >
                            {msg.senderId !== user?.id && (
                              <div className="absolute -left-2 top-0 w-3 h-3 bg-white dark:bg-gray-800 transform rotate-45 border-l border-t border-gray-100 dark:border-gray-700/70" />
                            )}
                            {msg.senderId === user?.id && (
                              <div className="absolute -right-2 top-0 w-3 h-3 bg-primary transform rotate-45" />
                            )}
                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                            <div className="flex justify-end items-center mt-1 space-x-1">
                              <span className={cn(
                                "text-xs opacity-70",
                                msg.senderId === user?.id ? 'text-primary-100' : 'text-gray-400'
                              )}>
                                {formatMessageTime(msg.createdAt)}
                              </span>
                              {msg.senderId === user?.id && (
                                <span className={cn(
                                  "text-xs",
                                  msg.isRead ? 'text-blue-300' : 'text-gray-300'
                                )}>
                                  {msg.isRead ? '✓✓' : '✓'}
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
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
                  <MessageSquare className="h-12 w-12 mb-3 opacity-30" />
                  <p className="text-sm">No messages yet. Say hello! 👋</p>
                </div>
              )}
              <div ref={messagesEndRef} className="h-4" />
            </div>

            {/* Message Input */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-3 bg-white dark:bg-gray-900">
              <form onSubmit={handleSendMessage} className="flex items-end space-x-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
                >
                  <Paperclip className="h-5 w-5" />
                </Button>
                <div className="relative flex-1">
                  <Textarea
                    ref={textareaRef}
                    rows={1}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    className="min-h-[44px] max-h-32 resize-none pr-10 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 bottom-1.5 h-7 w-7 text-gray-500 dark:text-gray-400 hover:bg-transparent"
                  >
                    <Smile className="h-4 w-4" />
                  </Button>
                </div>
                <Button
                  type="submit"
                  disabled={!message.trim() || isSending}
                  className={cn(
                    "h-10 w-10 p-0 rounded-full bg-primary hover:bg-primary/90 text-white",
                    "transition-all duration-200",
                    (!message.trim() || isSending) ? "opacity-50 cursor-not-allowed" : ""
                  )}
                >
                  {isSending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatWindow;
