import React, { ReactNode } from 'react';
import { cn } from '../../../../../lib/utils';

type Theme = 'light' | 'dark' | 'system';

interface TestLayoutProps {
  header: ReactNode;
  content: ReactNode;
  footer: ReactNode;
  theme?: Theme;
  className?: string;
}

export const TestLayout: React.FC<TestLayoutProps> = ({
  header,
  content,
  footer,
  theme = 'light',
  className = '',
}) => {
  const themeClasses = {
    light: 'bg-white text-gray-900',
    dark: 'bg-gray-900 text-white',
    system: 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white',
  };

  return (
    <div 
      className={cn(
        'flex flex-col min-h-screen transition-colors duration-200',
        themeClasses[theme],
        className
      )}
    >
      <div className="h-10 w-full bg-transparent"></div> {/* Spacer for website header */}
      <header className="sticky top-16 z-10 border-b bg-white dark:bg-gray-900">
        {header}
      </header>
      
      <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
        <div className="max-w-4xl mx-auto w-full">
          {content}
        </div>
      </main>
      
      <footer className="border-t">
        {footer}
      </footer>
    </div>
  );
};

export default TestLayout;
