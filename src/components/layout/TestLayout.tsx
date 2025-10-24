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
    
    // Hide header and footer elements
    const header = document.querySelector('header');
    const footer = document.querySelector('footer');
    const mainContent = document.querySelector('main');
    
    if (header) header.style.display = 'none';
    if (footer) footer.style.display = 'none';
    if (mainContent) mainContent.style.padding = '0';
    
    // Add test-mode class to body for additional styling
    document.body.classList.add('test-mode');
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    
    // Cleanup function to restore original state
    return () => {
      if (header) header.style.display = '';
      if (footer) footer.style.display = '';
      if (mainContent) mainContent.style.padding = '';
      document.body.classList.remove('test-mode');
      document.body.style.margin = '';
      document.body.style.padding = '';
    };
  }, [location]);

  return (
    <div className="test-layout" style={{
      minHeight: '100vh',
      width: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {children}
    </div>
  );
};

export default TestLayout;
