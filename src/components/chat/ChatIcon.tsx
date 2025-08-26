import React, { useEffect, useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { useChat } from '@/contexts/ChatContext';
import { cn } from '@/lib/utils';

interface ChatIconProps {
  onClick?: () => void;
  className?: string;
  showBadge?: boolean;
}

const ChatIcon: React.FC<ChatIconProps> = ({ onClick, className, showBadge = true }) => {
  const { unreadCount } = useChat();
  const [isBouncing, setIsBouncing] = useState(false);

  // Handle bounce animation when new messages arrive
  useEffect(() => {
    if (unreadCount > 0) {
      setIsBouncing(true);
      const timer = setTimeout(() => setIsBouncing(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [unreadCount]);

  return (
    <div 
      className={cn(
        'relative cursor-pointer transition-transform hover:scale-110',
        isBouncing && 'animate-bounce',
        className
      )}
      onClick={onClick}
      aria-label="Chat"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
    >
      <MessageSquare className="h-6 w-6" />
      {showBadge && unreadCount > 0 && (
        <span 
          className={cn(
            'absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center',
            'transition-all duration-300 transform',
            isBouncing ? 'scale-125' : 'scale-100'
          )}
          aria-label={`${unreadCount} unread messages`}
        >
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </div>
  );
};

export default ChatIcon;
