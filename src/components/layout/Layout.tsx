import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { useTestMode } from './useTestMode';
import ChatWindow from '../chat/ChatWindow';

const Layout: React.FC = () => {
  const { isTestMode } = useTestMode();
  const location = useLocation();
  
  // Check route conditions
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isTestzPage = location.pathname === '/testz';

  const [isChatOpen, setIsChatOpen] = useState(false);

  // Debug log for chat state changes
  useEffect(() => {
    console.log('Chat open state changed:', isChatOpen);
  }, [isChatOpen]);

  // Always show header on all routes, including admin
  const showHeader = !isTestMode;
  // Show footer only on non-admin routes and not on Testz page
  const showFooter = !isTestMode && !isAdminRoute && !isTestzPage;
  // Show chat on all routes except test mode
  const showChat = !isTestMode;

  return (
    <div className="flex flex-col min-h-screen">
      {showHeader && <Header onToggleChat={() => setIsChatOpen(!isChatOpen)} />}
      <main className="flex-grow">
        <Outlet />
      </main>
      {showFooter && <Footer />}
      {showChat && (
        <ChatWindow 
          isOpen={isChatOpen} 
          onClose={() => setIsChatOpen(false)}
          onMinimize={() => setIsChatOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;