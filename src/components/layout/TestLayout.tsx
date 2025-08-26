import React, { ReactNode, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface TestLayoutProps {
  children: ReactNode;
}

/**
 * A minimal layout component specifically for test routes
 * Does not include header, footer, or other UI elements
 */
const TestLayout: React.FC<TestLayoutProps> = ({ children }) => {
  const location = useLocation();
  
  useEffect(() => {
    console.log('TestLayout - Current path:', location.pathname);
    
    // Add test-mode class to body when component mounts
    document.body.classList.add('test-mode');
    
    // Clean up function to remove the class when component unmounts
    return () => {
      document.body.classList.remove('test-mode');
    };
  }, [location]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="min-h-screen p-4">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default TestLayout;
