import React, { useEffect, useState, useMemo } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LayoutDashboard, Users, BookOpen, Bell, Menu, X, Video, FileText } from 'lucide-react';
import { canReviewVideos, canReviewNotes, canManageTeachers, canManageStudents } from '../../utils/permissions';
import Header from '../layout/Header';

interface NavItemProps {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;}

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

const SubAdminLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { user, isLoading, refreshUserData } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // This state is used to force a re-render when permissions change
  const [permissionsVersion, setPermissionsVersion] = useState(0);

  // Effect to handle permission changes
  useEffect(() => {
    const handlePermissionChange = async () => {
      console.log('Permission change detected, updating UI...');
      try {
        if (refreshUserData) {
          // Force a refresh of user data to get the latest permissions
          await refreshUserData();
          console.log('User data refreshed');
          
          // Force a re-render by updating the version
          setPermissionsVersion(prev => prev + 1);
        }
      } catch (error) {
        console.error('Error refreshing user data:', error);
      }
    };

    // Add event listener for permission changes
    const eventListener = () => {
      console.log('Permission change event received, refreshing...');
      handlePermissionChange();
    };
    
    window.addEventListener('permissionsUpdated', eventListener);
    
    // Clean up the event listener
    return () => {
      window.removeEventListener('permissionsUpdated', eventListener);
    };
  }, [refreshUserData]);
  
  // Debug effect to log permission changes
  useEffect(() => {
    console.log('Permissions updated, current user:', user);
    console.log('Current permissions:', user?.subAdminPermissions);
  }, [user?.subAdminPermissions]);
  
  // Memoize navigation to prevent unnecessary re-renders
  const navigation = useMemo(() => {
    console.log('Regenerating navigation with user:', user);
    console.log('Current permissions:', user?.subAdminPermissions);
    
    const navItems = [
      { name: 'Dashboard', to: '/subadmin', icon: LayoutDashboard },
    ];

    // Add role-based navigation items
    if (user?.role === 'admin') {
      // Admin has access to everything
      navItems.push(
        { name: 'Teachers', to: '/subadmin/teachers', icon: Users },
        { name: 'Students', to: '/subadmin/students', icon: Users },
        { name: 'Courses', to: '/subadmin/courses', icon: BookOpen },
        { name: 'Notifications', to: '/subadmin/notifications', icon: Bell },
        { name: 'Video Review', to: '/subadmin/video-review', icon: Video },
        { name: 'Notes Review', to: '/subadmin/notes-review', icon: FileText }
      );
    } else if (user?.role === 'subadmin' && user?.subAdminPermissions) {
      // Sub-admin has permissions-based access
      const { subAdminPermissions } = user;
      
      if (subAdminPermissions.teacherManagement) {
        navItems.push({ name: 'Teachers', to: '/subadmin/teachers', icon: Users });
      }
      if (subAdminPermissions.studentManagement) {
        navItems.push({ name: 'Students', to: '/subadmin/students', icon: Users });
      }
      
      // Always show these items
      navItems.push(
        { name: 'Courses', to: '/subadmin/courses', icon: BookOpen },
        { name: 'Notifications', to: '/subadmin/notifications', icon: Bell }
      );
      
      if (subAdminPermissions.videoReview) {
        navItems.push({ name: 'Video Review', to: '/subadmin/video-review', icon: Video });
      }
      if (subAdminPermissions.notesReview) {
        navItems.push({ name: 'Notes Review', to: '/subadmin/notes-review', icon: FileText });
      }
    }

    console.log('Generated navigation items:', navItems);
    return navItems as Array<{ name: string; to: string; icon: React.ComponentType<{ className?: string }> }>;
  }, [user, permissionsVersion]); // Update when user or permissionsVersion changes

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'subadmin')) {
      navigate('/login', { state: { from: location.pathname } });
    }
  }, [user, isLoading, navigate, location]);

  if (isLoading || !user || user.role !== 'subadmin') {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-dark-900 dark:to-dark-950">
      <Header />
      <div className="pt-20 lg:pt-6 relative">
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
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Sub Admin Panel</h1>
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
            <div className="flex items-center justify-between mb-8 px-2">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Sub Admin Panel</h1>
            </div>
            <nav className="space-y-1.5">
              {navigation.map((item) => (
                <NavItem key={item.name} to={item.to} icon={item.icon}>
                  {item.name}
                </NavItem>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Mobile top bar */}
      <div className="fixed top-0 left-0 right-0 z-40 flex h-16 items-center justify-between bg-white dark:bg-dark-800 px-4 shadow-sm lg:hidden">
        <button
          type="button"
          className="text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300"
          onClick={() => setSidebarOpen(true)}
        >
          <span className="sr-only">Open sidebar</span>
          <Menu className="h-6 w-6" aria-hidden="true" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Sub Admin Panel</h1>
        <div className="w-6"></div> {/* Spacer for alignment */}
      </div>

      {/* Main content */}
      <main className="lg:pl-80">
        <Header />
        <div className="p-4 lg:p-8">
            {children || <Outlet />}
        </div>
      </main>
      </div>
    </div>
  );
};

export default SubAdminLayout;
