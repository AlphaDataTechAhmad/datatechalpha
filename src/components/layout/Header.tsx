import React, { useState, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { Moon, Sun, User, Loader2, Bell, X, CheckCircle, Bot, Clapperboard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { useChat } from '@/contexts/ChatContext';
import { useGemini } from '@/contexts/GeminiContext';
import ChatIcon from '../chat/ChatIcon';
import { getReels } from '@/Services/reelService';
import ReelsModal from '../reels/ReelsModal';

interface HeaderProps {
  onToggleChat?: () => void;
}
import Logo from '../ui/Logo';
import { formatDistanceToNow } from 'date-fns';

const Header: React.FC<HeaderProps> = ({ onToggleChat }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  
  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated, isLoading, isInitialized } = useAuth();
  const { 
    notifications, 
    unreadCount: notificationUnreadCount, 
    markAsRead, 
    markAllAsRead,
    fetchNotifications 
  } = useNotifications();
  
  const { unreadCount: chatUnreadCount } = useChat();
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  // Define the local Reel type that matches what we need
  type LocalReel = {
    videoId: string;
    title: string;
    description: string;
    videoUrl: string;
    isActive: boolean;
  };

  const [reels, setReels] = useState<LocalReel[]>([]);
  const [showReels, setShowReels] = useState(false);
  const [isLoadingReels, setIsLoadingReels] = useState(true);
  const [currentReelIndex, setCurrentReelIndex] = useState(0);
  const { messages: aiMessages, sendMessage, isLoading: isAILoading } = useGemini();
  const location = useLocation();
  // const navigate = useNavigate();
  
  // Fetch notifications when user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    }
  }, [isAuthenticated, fetchNotifications]);

  // Fetch reels
  useEffect(() => {
    const fetchReels = async () => {
      if (!user) {
        console.log('No user, skipping reels fetch');
        return;
      }
      
      try {
        setIsLoadingReels(true);
        const reelsData = await getReels();
        // Map the reels data to match our expected type
        const formattedReels = reelsData.map(reel => {
          // Ensure all required properties are present with fallbacks
          const localReel: LocalReel = {
            videoId: reel.videoId || '',
            title: reel.title || 'Untitled Reel',
            description: reel.description || '',
            videoUrl: reel.videoUrl || '',
            isActive: Boolean(reel.isActive)
          };
          return localReel;
        });
        setReels(formattedReels);
      } catch (error) {
        console.error('Error fetching reels:', error);
      } finally {
        setIsLoadingReels(false);
      }
    };

    fetchReels();
  }, [user]);
  
  // Close mobile menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const closeMenu = () => setIsOpen(false);

  const defaultNavItems = [
    { title: 'Home', path: '/' },
    { title: 'Courses', path: '/courses' },
    { title: 'Internships', path: '/internships' },
    { title: 'Scholarship', path: '/scholarship' },
    { title: 'About', path: '/about' },
    { title: 'Practice Tests', path: '/testz' },
    { title: 'Contact', path: '/contact' },
    { title: 'Instructor', path: '/instructor' } // Added Instructor page for all users
  ];

  const teacherNavItems = [
    { title: 'Home', path: '/' },
    { title: 'Courses', path: '/courses' },
    { title: 'Internships', path: '/internships' },
    { title: 'Practice Tests', path: '/testz' },
    { title: 'Students', path: '/students' }
  ];

  const adminNavItems = [
    { title: 'Home', path: '/' },
    { title: 'Admin Panel', path: '/admin' },
    { title: 'Courses', path: '/courses' },
    { title: 'Internships', path: '/internships' },
    { title: 'About', path: '/about' },
    { title: 'Contact', path: '/contact' },
  ];

  const subAdminNavItems = [
    { title: 'Home', path: '/' },
    { title: 'Sub-Admin Panel', path: '/subadmin' },
    { title: 'Courses', path: '/courses' },
    { title: 'Internships', path: '/internships' },
    { title: 'About', path: '/about' },
  ];

  let navItems = defaultNavItems;
  if (isAuthenticated) {
    if (user?.role === 'teacher') {
      navItems = teacherNavItems;
    } else if (user?.role === 'admin') {
      navItems = adminNavItems;
    } else if (user?.role === 'subadmin') {
      navItems = subAdminNavItems;
    }
  }

  return (
    <header
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/90 dark:bg-gray-900/90 backdrop-blur shadow-md py-3'
          : 'bg-white dark:bg-gray-900 py-5'
      }`}
    >
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link to="/" className="flex items-center">
          <Logo className="h-10 w-auto" />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `font-medium transition-colors hover:text-primary-600 dark:hover:text-primary-400 ${
                  isActive 
                    ? 'text-primary-600 dark:text-primary-400 font-semibold' 
                    : 'text-gray-800 dark:text-gray-100'
                }`
              }
            >
              {item.title}
            </NavLink>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center space-x-4">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5 text-yellow-400" />
            ) : (
              <Moon className="h-5 w-5 text-dark-600" />
            )}
          </button>
          {!isInitialized || isLoading ? (
            <div className="w-10 h-10 flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-primary-500" />
            </div>
          ) : !isAuthenticated ? (
            <>
              <Link 
                to="/login" 
                className="btn-outline btn-sm py-2 px-4 rounded-lg text-sm hover:bg-primary-50 dark:hover:bg-dark-700 transition-colors"
              >
                Log In
              </Link>
              <Link 
                to="/signup" 
                className="btn-primary btn-sm py-2 px-4 rounded-lg text-sm hover:bg-primary-600 transition-colors"
              >
                Sign Up
              </Link>
            </>
          ) : (
            <div className="flex items-center space-x-3">
              {isAuthenticated && (
                <div className="flex items-center space-x-4">
                  {/* Reels Button */}
                  <div className="relative">
                    <button
                      onClick={() => {
                        console.log('Reels button clicked');
                        console.log('isLoadingReels:', isLoadingReels);
                        console.log('reels count:', reels.length);
                        if (!isLoadingReels && reels.length > 0) {
                          console.log('Setting showReels to true');
                          setShowReels(true);
                        }
                      }}
                      className={`p-2 relative ${
                        isLoadingReels || reels.length === 0
                          ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                          : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white cursor-pointer'
                      }`}
                      aria-label={reels.length > 0 ? "View reels" : "No reels available"}
                      disabled={isLoadingReels || reels.length === 0}
                      title={reels.length === 0 ? "No reels available" : "View reels"}
                    >
                      {isLoadingReels ? (
                        <Loader2 className="h-6 w-6 animate-spin" />
                      ) : (
                        <Clapperboard className="h-6 w-6" />
                      )}
                    </button>
                  </div>

                  {/* AI Assistant Button */}
                  <div className="relative">
                    <button
                      onClick={() => setShowAIAssistant(!showAIAssistant)}
                      className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white relative"
                      aria-label="Open AI Assistant"
                    >
                      <Bot className="h-6 w-6" />
                    </button>
                  </div>
                  
                  {/* Chat Icon - Hidden for students */}
                  {user?.role && user.role !== 'student' && (
                    <div className="relative">
                      <button
                        onClick={onToggleChat}
                        className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white relative"
                        aria-label="Open chat"
                      >
                        <ChatIcon />
                      </button>
                    </div>
                  )}
                  
                  {/* Notifications */}
                  <div className="relative">
                    <button
                      onClick={() => setShowNotifications(!showNotifications)}
                      className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white relative"
                      aria-label="Notifications"
                    >
                      <Bell className="h-6 w-6" />
                      {notificationUnreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {notificationUnreadCount > 9 ? '9+' : notificationUnreadCount}
                        </span>
                      )}
                    </button>
                  
                  {/* AI Assistant Chat */}
                  <AnimatePresence>
                    {showAIAssistant && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 mt-2 w-80 bg-white dark:bg-dark-800 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 z-50 overflow-hidden"
                      >
                        <div className="p-4 border-b border-gray-200 dark:border-dark-700">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium text-gray-900 dark:text-white">AI Assistant</h3>
                            <button
                              onClick={() => setShowAIAssistant(false)}
                              className="text-gray-400 hover:text-gray-500 dark:text-gray-400 dark:hover:text-gray-300"
                              aria-label="Close AI Assistant"
                            >
                              <X className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                        <div className="h-64 overflow-y-auto p-4 space-y-4">
                          {aiMessages.map((msg, index) => (
                            <div 
                              key={index} 
                              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                              <div 
                                className={`max-w-[80%] rounded-lg p-3 text-sm ${
                                  msg.role === 'user' 
                                    ? 'bg-primary-100 dark:bg-primary-900 text-primary-900 dark:text-primary-100' 
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                                }`}
                              >
                                {msg.content}
                              </div>
                            </div>
                          ))}
                          {isAILoading && (
                            <div className="flex justify-start">
                              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 text-sm">
                                <div className="flex space-x-1">
                                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"></div>
                                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="border-t border-gray-200 dark:border-dark-700 p-3">
                          <form 
                            onSubmit={async (e) => {
                              e.preventDefault();
                              const form = e.currentTarget;
                              const input = form.querySelector('input');
                              if (input && input.value.trim()) {
                                try {
                                  await sendMessage(input.value);
                                  input.value = '';
                                } catch (error) {
                                  console.error('Error sending message:', error);
                                }
                              }
                            }}
                            className="flex items-center space-x-2"
                          >
                            <input
                              type="text"
                              className="flex-1 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50"
                              placeholder="Ask me anything..."
                              disabled={isAILoading}
                            />
                            <button
                              type="submit"
                              className="bg-primary-500 hover:bg-primary-600 text-white rounded-lg p-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              aria-label="Send message"
                              disabled={isAILoading}
                            >
                              {isAILoading ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                              )}
                            </button>
                          </form>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Notification dropdown */}
                  <AnimatePresence>
                    {showNotifications && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 mt-2 w-80 bg-white dark:bg-dark-800 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 z-50"
                      >
                        <div className="p-4 border-b border-gray-200 dark:border-dark-700">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Notifications</h3>
                            <div className="flex items-center space-x-2">
                              {notificationUnreadCount > 0 && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markAllAsRead();
                                  }}
                                  className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                  title="Mark all as read"
                                >
                                  Mark all as read
                                </button>
                              )}
                              <button
                                onClick={() => setShowNotifications(false)}
                                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                              >
                                <span className="sr-only">Close notifications</span>
                                <X className="h-5 w-5" />
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                          {notifications.length > 0 ? (
                            <div className="divide-y divide-gray-200 dark:divide-dark-700">
                              {notifications.map((notification) => (
                                <div 
                                  key={notification.id}
                                  className={`p-4 hover:bg-gray-50 dark:hover:bg-dark-700 cursor-pointer transition-colors ${
                                    !notification.isRead ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                                  }`}
                                  onClick={() => {
                                    // Mark as read and navigate to relevant page
                                    if (!notification.isRead) {
                                      markAsRead(notification.id);
                                    }
                                    // TODO: Add navigation based on notification type
                                    setShowNotifications(false);
                                  }}
                                >
                                  <div className="flex items-start">
                                    <div className="flex-shrink-0 pt-0.5">
                                      {notification.isRead ? (
                                        <CheckCircle className="h-5 w-5 text-gray-400" />
                                      ) : (
                                        <Bell className="h-5 w-5 text-blue-500" />
                                      )}
                                    </div>
                                    <div className="ml-3 flex-1">
                                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                                        {notification.title || 'New Notification'}
                                      </p>
                                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                        {notification.message}
                                      </p>
                                      <div className="mt-2 flex items-center text-xs text-gray-500 dark:text-gray-400">
                                        <span>
                                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                        </span>
                                        {!notification.isRead && (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              markAsRead(notification.id);
                                            }}
                                            className="ml-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                          >
                                            Mark as read
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                              No notifications
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  </div>
                </div>
              )}
              <Link 
                to="/profile" 
                className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-primary-500 hover:border-primary-600 transition-colors"
                aria-label="User profile"
              >
                {user?.imageUrl ? (
                  <img 
                    src={user.imageUrl} 
                    alt={user.name || 'User profile'} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=random`;
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 dark:bg-dark-600 flex items-center justify-center">
                    <User className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                  </div>
                )}
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="flex items-center space-x-4 md:hidden">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5 text-yellow-400" />
            ) : (
              <Moon className="h-5 w-5 text-dark-600" />
            )}
          </button>

          {/* Improved Hamburger Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="relative w-8 h-8 flex items-center justify-center z-50"
            aria-label="Toggle menu"
          >
            <span className="sr-only">Toggle menu</span>
            <div className="relative w-6 h-6 flex flex-col justify-center items-center space-y-1.5">
              <span
                className={`h-0.5 w-6 bg-dark-700 dark:bg-white rounded transition-all duration-300 transform ${
                  isOpen ? 'rotate-45 translate-y-1.5' : ''
                }`}
              />
              <span
                className={`h-0.5 w-6 bg-dark-700 dark:bg-white rounded transition-all duration-300 transform ${
                  isOpen ? 'opacity-0' : ''
                }`}
              />
              <span
                className={`h-0.5 w-6 bg-dark-700 dark:bg-white rounded transition-all duration-300 transform ${
                  isOpen ? '-rotate-45 -translate-y-1.5' : ''
                }`}
              />
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-white dark:bg-dark-800 shadow-lg"
          >
            <nav className="container mx-auto px-4 py-4 flex flex-col space-y-4">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={closeMenu}
                  className={({ isActive }) =>
                    `font-medium py-2 px-4 rounded-lg transition-colors ${
                      isActive
                        ? 'text-primary-500 bg-primary-50 dark:bg-dark-700'
                        : 'text-dark-700 dark:text-white hover:bg-gray-100 dark:hover:bg-dark-700'
                    }`
                  }
                >
                  {item.title}
                </NavLink>
              ))}
              <div className="flex flex-col space-y-2 pt-2 border-t border-gray-200 dark:border-dark-700">
                {!isInitialized || isLoading ? (
                  <div className="py-2 flex justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-primary-500" />
                  </div>
                ) : !isAuthenticated ? (
                  <>
                    <Link 
                      to="/login" 
                      onClick={closeMenu} 
                      className="btn-outline py-2 text-center hover:bg-primary-50 dark:hover:bg-dark-700 transition-colors"
                    >
                      Log In
                    </Link>
                    <Link 
                      to="/signup" 
                      onClick={closeMenu} 
                      className="btn-primary py-2 text-center hover:bg-primary-600 transition-colors"
                    >
                      Sign Up
                    </Link>
                  </>
                ) : (
                  <Link 
                    to="/profile" 
                    onClick={closeMenu}
                    className="flex items-center justify-center py-2 space-x-2 text-center hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-primary-500 flex-shrink-0">
                      {user?.imageUrl ? (
                        <img 
                          src={user.imageUrl} 
                          alt={user.name || 'User profile'} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.onerror = null;
                            target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=random`;
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 dark:bg-dark-600 flex items-center justify-center">
                          <User className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                        </div>
                      )}
                    </div>
                    <span className="truncate">{user?.name || 'Profile'}</span>
                  </Link>
                )}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reels Modal */}
      {showReels && reels.length > 0 && (
        <div className="fixed inset-0 z-50">
          <ReelsModal
            reels={reels}
            currentIndex={currentReelIndex}
            onClose={() => {
              console.log('Closing reels modal');
              setShowReels(false);
            }}
            onNext={() => {
              console.log('Next reel');
              setCurrentReelIndex(prev => {
                const nextIndex = prev < reels.length - 1 ? prev + 1 : 0;
                console.log('New reel index:', nextIndex);
                return nextIndex;
              });
            }}
            onPrev={() => {
              console.log('Previous reel');
              setCurrentReelIndex(prev => {
                const prevIndex = prev > 0 ? prev - 1 : reels.length - 1;
                console.log('New reel index:', prevIndex);
                return prevIndex;
              });
            }}
          />
        </div>
      )}
    </header>
  );
};

export default Header;