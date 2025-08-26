import React, { useEffect, useState, useCallback } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, BookOpen, Bell, Menu, X, Video, FileText, UserCog, Briefcase } from 'lucide-react';
import Header from '../layout/Header';
import { useChat } from '@/contexts/ChatContext';
import ChatWindow from '../chat/ChatWindow';

interface NavItemProps {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon: Icon, children }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <NavLink
      to={to}
      className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
        isActive
          ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-white shadow-sm'
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-dark-700 dark:hover:text-white'
      }`}
    >
      <div className={`p-2 mr-3 rounded-lg ${
        isActive 
          ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-800/50 dark:text-indigo-300' 
          : 'bg-gray-100 text-gray-500 dark:bg-dark-700/50 dark:text-gray-400'
      }`}>
        <Icon className="h-5 w-5" />
      </div>
      <span className="font-medium">{children}</span>
      {isActive && (
        <div className="ml-auto w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
      )}
    </NavLink>
  );
};

import { useAuth } from '../../contexts/AuthContext';

const AdminLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { user, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toggleChat, isChatOpen } = useChat();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Debug logging
  useEffect(() => {
    console.log('AdminLayout mounted', { 
      user, 
      isLoading, 
      pathname: location.pathname,
      hasChildren: !!children,
      windowLocation: window.location.href
    });
  }, [user, isLoading, location.pathname, children]);

  // Test component to verify rendering
  const TestBanner = () => (
    <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-4" role="alert">
      <p className="font-bold">Admin Layout Debug</p>
      <div className="grid grid-cols-2 gap-2 text-sm mt-2">
        <div>
          <span className="font-semibold">Current Path:</span> {location.pathname}
        </div>
        <div>
          <span className="font-semibold">User Status:</span> {user ? 'Logged In' : 'Not Logged In'}
        </div>
        <div>
          <span className="font-semibold">User Role:</span> {user?.role || 'N/A'}
        </div>
        <div>
          <span className="font-semibold">Children Count:</span> {React.Children.count(children)}
        </div>
      </div>
    </div>
  );

  const handleToggleChat = useCallback(() => {
    toggleChat();
  }, [toggleChat]);

  // Allow all users to access the internships page
  const isInternshipsPage = location.pathname.startsWith('/admin/internships');
  
  useEffect(() => {
    if (isLoading) return;
    
    // Only redirect if not on internships page and not an admin
    if (!isInternshipsPage && (!user || user.role !== 'admin')) {
      navigate('/login', { state: { from: location.pathname } });
    }
  }, [user, isLoading, navigate, location, isInternshipsPage]);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  // Only check for admin role if not on internships page
  if (!isInternshipsPage && (!user || user.role !== 'admin')) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  const navigation = [
    { name: 'Dashboard', to: '/admin', icon: LayoutDashboard },
    { name: 'Internships', to: '/admin/internships', icon: Briefcase },
    { name: 'Intern Exams', to: '/admin/intern-exams', icon: FileText },
    { name: 'Teachers', to: '/admin/teachers', icon: Users },
    { name: 'Students', to: '/admin/students', icon: Users },
    { name: 'Courses', to: '/admin/courses', icon: BookOpen },
    { name: 'Tests', to: '/admin/tests', icon: FileText },
    { name: 'Sub-Admins', to: '/admin/subadmins', icon: UserCog },
    { name: 'Reels', to: '/admin/reels', icon: Video },
    { name: 'Notifications', to: '/admin/notifications', icon: Bell },
    { name: 'Video Review', to: '/admin/video-review', icon: Video },
    { name: 'Notes Review', to: '/admin/notes-review', icon: FileText },
  ];

  // Debug information
  useEffect(() => {
    console.log('AdminLayout debug:', {
      path: window.location.pathname,
      hasChildren: !!children,
      userRole: user?.role,
      isAuthenticated
    });
  }, [location.pathname, children, user, isAuthenticated]);

  return (
    <div className="flex flex-col min-h-screen">
      <Header onToggleChat={handleToggleChat} />
      <div className="flex-1 flex pt-16">
        {/* Mobile sidebar */}
        <div className={`fixed inset-0 z-50 flex lg:hidden ${sidebarOpen ? '' : 'hidden'}`}>
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)}></div>
          <div className="relative flex w-full max-w-xs flex-1 flex-col bg-white dark:bg-dark-800">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                type="button"
                className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setSidebarOpen(false)}
              >
                <span className="sr-only">Close sidebar</span>
              <X className="h-6 w-6 text-white" aria-hidden="true" />
            </button>
          </div>
          <div className="h-0 flex-1 overflow-y-auto pt-5 pb-4">
            <div className="flex flex-shrink-0 items-center px-4">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Admin Panel</h1>
            </div>
            <nav className="mt-5 space-y-1 px-2">
              {navigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.to}
                  className={({ isActive }) =>
                    `group flex items-center px-2 py-2 text-base font-medium rounded-md ${
                      isActive
                        ? 'bg-indigo-100 text-indigo-900 dark:bg-indigo-900/30 dark:text-white'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-dark-700 dark:hover:text-white'
                    }`
                  }
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon
                    className="mr-4 h-6 w-6 flex-shrink-0 text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300"
                    aria-hidden="true"
                  />
                  {item.name}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
        <div className="w-14 flex-shrink-0">{/* Force sidebar to shrink to fit close icon */}</div>
      </div>

      {/* Fixed sidebar for desktop */}
      <div className="hidden lg:fixed lg:top-20 lg:bottom-4 lg:left-4 lg:z-30 lg:w-72 lg:flex lg:flex-col lg:overflow-y-auto bg-white dark:bg-dark-800 rounded-2xl shadow-xl border border-gray-100 dark:border-dark-700">
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto py-6 px-5">
            <div className="mb-8 px-3">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Admin Panel
              </h1>
            </div>
            <nav className="flex-1 space-y-2 px-2">
              {navigation.map((item) => (
                <NavItem key={item.name} to={item.to} icon={item.icon}>
                  {item.name}
                </NavItem>
              ))}
            </nav>
          </div>

        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 lg:pl-72 relative z-0 pt-24 lg:pt-24">
        {/* Mobile top navigation */}
        <div className="sticky top-0 z-40 bg-white dark:bg-dark-800 pl-1 pt-1 sm:pl-3 sm:pt-3 lg:hidden">
          <button
            type="button"
            className="-ml-0.5 -mt-0.5 inline-flex h-12 w-12 items-center justify-center rounded-md text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        {/* Page content */}
        <main className="flex-1">
          <div className="py-6">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm p-6">
                {children || <Outlet />}
              </div>
            </div>
          </div>
        </main>
      </div>
      </div>
      
      {/* Chat Window */}
      <ChatWindow 
        isOpen={isChatOpen}
        onClose={() => toggleChat()}
        onMinimize={() => toggleChat()}
      />
    </div>
  );
};

export default AdminLayout;
