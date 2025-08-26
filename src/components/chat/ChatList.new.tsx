import { useState, useEffect, useMemo } from 'react';
import { Search, Plus, UserPlus, Users, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useChat } from '@/contexts/ChatContext';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';

interface ChatListProps {
  onSelectChat: (id: string) => void;
  isMobile?: boolean;
}

interface Conversation {
  id: string;
  name: string;
  lastMessage: {
    content: string;
    createdAt: string;
    isRead: boolean;
    senderId: string;
  };
  unread: number;
  avatar?: string;
  isOnline: boolean;
  isGroup?: boolean;
}

const ChatList: React.FC<ChatListProps> = ({ onSelectChat, isMobile = false }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  
  const { user } = useAuth();
  const { 
    conversations: chatConversations = [], 
    getConversations, 
    currentChatId,
    markAsRead 
  } = useChat();

  // Format time for message timestamps
  const formatTime = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  // Load conversations
  useEffect(() => {
    const loadConversations = async () => {
      if (!user?.$id) return;
      
      try {
        setIsLoading(true);
        await getConversations();
      } catch (error) {
        console.error('Error loading conversations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadConversations();
  }, [user?.$id, getConversations]);

  // Update local conversations when chatConversations changes
  useEffect(() => {
    if (!chatConversations || chatConversations.length === 0) {
      setConversations([]);
      return;
    }

    const processed = chatConversations.map(conv => ({
      id: conv.id,
      name: conv.name || 'Chat',
      lastMessage: {
        content: conv.lastMessage?.content || 'No messages yet',
        createdAt: conv.lastMessage?.createdAt || new Date().toISOString(),
        isRead: conv.lastMessage?.isRead ?? true,
        senderId: conv.lastMessage?.senderId || ''
      },
      unread: conv.unreadCount || 0,
      avatar: conv.avatar || '',
      isOnline: false,
      isGroup: conv.isGroup || false
    }));

    setConversations(processed);
  }, [chatConversations]);

  // Filter conversations based on search query
  const filteredConversations = useMemo(() => {
    if (!searchQuery) return conversations;
    
    const query = searchQuery.toLowerCase();
    return conversations.filter(conv => 
      conv.name.toLowerCase().includes(query) ||
      conv.lastMessage.content.toLowerCase().includes(query)
    );
  }, [conversations, searchQuery]);

  // Handle conversation selection
  const handleSelectConversation = (conversationId: string) => {
    onSelectChat(conversationId);
    markAsRead(conversationId);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-2 text-sm text-gray-500">Loading conversations...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Messages</h2>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Plus className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <UserPlus className="mr-2 h-4 w-4" />
                New Chat
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Users className="mr-2 h-4 w-4" />
                New Group
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <Input
            placeholder="Search conversations..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2"
              onClick={() => setSearchQuery('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Conversation list */}
      <ScrollArea className="flex-1">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-500">
            <p>No conversations found</p>
            <p className="text-sm text-gray-400">Start a new chat to get started</p>
          </div>
        ) : (
          <div className="divide-y">
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`flex items-center p-4 hover:bg-gray-50 cursor-pointer ${
                  currentChatId === conversation.id ? 'bg-blue-50' : ''
                }`}
                onClick={() => handleSelectConversation(conversation.id)}
              >
                <div className="relative mr-3">
                  <Avatar>
                    <AvatarFallback>
                      {conversation.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {conversation.isOnline && (
                    <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium truncate">{conversation.name}</h3>
                    <span className="text-xs text-gray-500">
                      {formatTime(conversation.lastMessage.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <p className="text-sm text-gray-600 truncate">
                      {conversation.lastMessage.senderId === user?.$id
                        ? 'You: '
                        : ''}
                      {conversation.lastMessage.content}
                    </p>
                    {conversation.unread > 0 && (
                      <Badge className="ml-2" variant="default">
                        {conversation.unread > 9 ? '9+' : conversation.unread}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default ChatList;
