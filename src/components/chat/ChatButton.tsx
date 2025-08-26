import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import ChatIcon from './ChatIcon';
import ChatInterface from './ChatInterface';
import { useChat } from '@/contexts/ChatContext';

const ChatButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { unreadCount } = useChat();

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      <div 
        className={cn(
          'fixed bottom-6 right-6 z-50 transition-transform duration-300',
          'hover:scale-110 active:scale-95',
          'shadow-lg rounded-full',
          'bg-blue-600 hover:bg-blue-700 text-white',
          'dark:bg-blue-700 dark:hover:bg-blue-800',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
          'cursor-pointer',
          isOpen && 'scale-90 opacity-0 pointer-events-none'
        )}
        onClick={toggleChat}
        role="button"
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && toggleChat()}
      >
        <div className="relative p-3">
          <ChatIcon 
            className={cn(
              'text-white',
              unreadCount > 0 ? 'animate-pulse' : ''
            )} 
            showBadge={true}
          />
        </div>
      </div>

      <ChatInterface 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
      />
    </>
  );
};

export default ChatButton;
