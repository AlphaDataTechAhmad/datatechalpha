import React from 'react';
import { Button } from '../../../../ui/button';
import { Maximize2, Minimize2, Clock, Bookmark, Flag } from 'lucide-react';
import { cn } from '../../../../../lib/utils';

type Theme = 'light' | 'dark' | 'system';

interface TestHeaderProps {
  title: string;
  currentQuestion: number;
  totalQuestions: number;
  timeLeft: number;
  onFullScreenToggle: () => void;
  isFullScreen: boolean;
  theme?: Theme;
  className?: string;
}

export const TestHeader: React.FC<TestHeaderProps> = ({
  title,
  currentQuestion,
  totalQuestions,
  timeLeft,
  onFullScreenToggle,
  isFullScreen,
  theme = 'light',
  className = '',
}) => {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const getThemeClasses = (baseClasses: string) => {
    switch (theme) {
      case 'dark':
        return `${baseClasses} bg-gray-800 text-white`;
      case 'light':
        return `${baseClasses} bg-white text-gray-900`;
      default:
        return `${baseClasses} bg-white dark:bg-gray-800 text-gray-900 dark:text-white`;
    }
  };

  return (
    <header className={cn(
      'w-full p-4 flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors',
      getThemeClasses(''),
      className
    )}>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Bookmark className="h-5 w-5 text-primary-500" />
          <h1 className="text-lg font-semibold truncate max-w-xs" title={title}>
            {title}
          </h1>
        </div>
        
        <div className="hidden md:flex items-center gap-2 text-sm">
          <Flag className="h-4 w-4" />
          <span>
            Question {currentQuestion} of {totalQuestions}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-opacity-10 bg-black dark:bg-white">
          <Clock className="h-5 w-5 text-primary-500" />
          <span className="font-mono text-sm font-medium">
            {formatTime(timeLeft)}
          </span>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={onFullScreenToggle}
          className="rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
          aria-label={isFullScreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        >
          {isFullScreen ? (
            <Minimize2 className="h-5 w-5" />
          ) : (
            <Maximize2 className="h-5 w-5" />
          )}
        </Button>
      </div>
    </header>
  );
};

export default TestHeader;
