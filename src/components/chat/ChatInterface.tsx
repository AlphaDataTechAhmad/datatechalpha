import React, { useState, useCallback, useEffect } from 'react';
import { X, ChevronLeft, MessageSquare, MessageCircle, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import ChatList from './ChatList';
import ChatWindow from './ChatWindow';
import { useChat } from '@/contexts/ChatContext';
import { useAuth } from '@/contexts/AuthContext';

// Simple media query hook since we can't use the external one
const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    const listener = () => setMatches(media.matches);
    setMatches(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [query]);

  return matches;
};

interface ChatInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ isOpen, onClose }) => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const { currentChat, setCurrentChat } = useChat();
  const [showChatList, setShowChatList] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const { user } = useAuth();

  // Sync selected chat with context
  useEffect(() => {
    setSelectedChat(currentChat);
    if (currentChat) {
      setShowChatList(false);
    }
  }, [currentChat]);

  const handleSelectChat = useCallback((chatId: string) => {
    setCurrentChat(chatId);
    setSelectedChat(chatId);
    if (isMobile) {
      setShowChatList(false);
    }
  }, [isMobile, setCurrentChat]);

  const handleBackToList = useCallback(() => {
    setShowChatList(true);
    setSelectedChat(null);
    setCurrentChat(null);
  }, [setCurrentChat]);

  const toggleMinimize = useCallback(() => {
    setIsMinimized(prev => !prev);
  }, []);

  if (!isOpen) return null;

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={toggleMinimize}
          className="rounded-full h-14 w-14 p-0 bg-primary text-white shadow-lg hover:bg-primary/90 transition-all"
          size="icon"
        >
          <MessageSquare className="h-6 w-6" />
        </Button>
      </div>
    );
  }

  return (
    <div className={cn(
      'fixed bottom-4 right-4 w-full max-w-4xl h-[80vh] bg-white dark:bg-gray-900 rounded-xl shadow-2xl overflow-hidden',
      'flex flex-col md:flex-row border border-gray-200 dark:border-gray-800',
      'transition-all duration-300 transform',
      isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none',
      'z-50'
    )}>
      {/* Chat List Panel - Always visible on desktop, conditionally on mobile */}
      <div 
        className={cn(
          'w-full md:w-80 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900',
          'transition-all duration-300 flex flex-col',
          isMobile && !showChatList ? 'hidden' : 'flex',
          'h-full'
        )}
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center space-x-2">
            <MessageCircle className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Messages</h2>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
              onClick={onClose}
            >
              <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          <ChatList 
            onSelectChat={handleSelectChat} 
            onClose={onClose} 
            isMobile={isMobile} 
          />
        </div>
      </div>

      {/* Chat Window */}
      <div 
        className={cn(
          'flex-1 flex flex-col h-full bg-gray-50 dark:bg-gray-900',
          isMobile && !showChatList ? 'flex' : 'hidden md:flex',
          'relative'
        )}
      >
        {selectedChat ? (
          <>
            <div className="p-3 border-b border-gray-200 dark:border-gray-800 flex items-center bg-white dark:bg-gray-900">
              <Button 
                variant="ghost" 
                size="icon" 
                className="md:hidden mr-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={handleBackToList}
              >
                <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              </Button>
              <div className="flex-1">
                <h3 className="font-medium text-gray-800 dark:text-gray-100">Chat</h3>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={onClose}
              >
                <X className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              </Button>
            </div>
            <div className="flex-1 overflow-hidden">
              {user && (
                <ChatWindow 
                  isOpen={!!selectedChat}
                  onClose={onClose}
                  receiverId={currentChat || undefined}
                  user={user}
                  onMinimize={toggleMinimize}
                />
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 p-6 text-center">
            <div className="mx-auto h-16 w-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <MessageSquare className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">No chat selected</h3>
            <p className="max-w-md text-gray-500 dark:text-gray-400 mb-6">
              Select a conversation from the list or start a new chat to begin messaging
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                variant="outline" 
                className="bg-white dark:bg-gray-800"
                onClick={() => setShowChatList(true)}
              >
                Browse conversations
              </Button>
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                New Message
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;
