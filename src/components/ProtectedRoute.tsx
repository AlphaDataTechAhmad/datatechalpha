import React, { useEffect, useState, useCallback, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Preloader from './ui/Preloader';

interface ProtectedRouteProps {
  children: ReactNode | ((props: { isAuthenticated: boolean }) => ReactNode);
  requiredRole?: 'admin' | 'subadmin' | 'teacher' | 'user';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { 
    isAuthenticated, 
    isLoading, 
    isInitialized, 
    user,
    isDeactivated 
  } = useAuth();
  
  const location = useLocation();
  const navigate = useNavigate();
  const [showDelayedMessage, setShowDelayedMessage] = useState(false);

  // Show delayed message if loading takes too long
  useEffect(() => {
    const timer = setTimeout(() => setShowDelayedMessage(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  // Check if user has the required role
  const hasRequiredRole = useCallback(() => {
    if (!requiredRole) return true; // No role required
    if (!user?.role) return false; // User has no role
    
    // Role hierarchy: admin > subadmin > teacher > user
    const roleHierarchy = {
      'admin': 4,
      'subadmin': 3,
      'teacher': 2,
      'user': 1
    };
    
    const userRoleLevel = roleHierarchy[user.role] || 0;
    const requiredRoleLevel = roleHierarchy[requiredRole] || 0;
    
    return userRoleLevel >= requiredRoleLevel;
  }, [requiredRole, user]);

  // Handle redirects and role checks
  useEffect(() => {
    if (!isInitialized) return;
    
    // Handle deactivated accounts
    if (isDeactivated) {
      console.log('[ProtectedRoute] Account deactivated, redirecting to login');
      navigate('/login', { 
        state: { 
          from: location.pathname,
          error: 'Your account has been deactivated. Please contact support.' 
        },
        replace: true 
      });
      return;
    }
    
    if (!isAuthenticated) {
      console.log('[ProtectedRoute] Not authenticated, redirecting to login');
      navigate('/login', { 
        state: { from: location.pathname },
        replace: true 
      });
    } else if (requiredRole && !hasRequiredRole()) {
      console.log(`[ProtectedRoute] User doesn't have required role: ${requiredRole}`);
      // Redirect to home page if user doesn't have the required role
      navigate('/', { replace: true });
    }
  }, [isInitialized, isAuthenticated, navigate, location.pathname, requiredRole, hasRequiredRole]);

  // Show loading state while initializing
  if (!isInitialized || isLoading) {
    console.log('[ProtectedRoute] Showing loading state', { 
      isInitialized, 
      isLoading,
      isAuthenticated
    });

    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="text-center mb-6">
          <Preloader />
          <p className="mt-4 text-gray-600">Loading your session...</p>
          {showDelayedMessage && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-700 text-sm">
              <p>This is taking longer than expected. Please wait or try refreshing the page.</p>
              <button 
                onClick={() => window.location.reload()}
                className="mt-2 px-3 py-1 bg-yellow-100 hover:bg-yellow-200 rounded-md text-yellow-800 text-xs"
              >
                Refresh Page
              </button>
            </div>
          )}
        </div>
        
        {/* Debug info */}
        <div className="mt-6 p-4 bg-white rounded-lg shadow-sm max-w-md w-full text-left text-sm">
          <h4 className="font-medium text-gray-700 mb-2">Authentication Status</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>Initialized:</div><div className="font-mono">{isInitialized ? '✅ Yes' : '❌ No'}</div>
            <div>Loading:</div><div className="font-mono">{isLoading ? '⏳ Yes' : 'No'}</div>
            <div>Authenticated:</div><div className="font-mono">{isAuthenticated ? '✅ Yes' : '❌ No'}</div>
            {user?.role && <div>Role:</div>}
            {user?.role && <div className="font-mono capitalize">{user.role}</div>}
          </div>
        </div>
      </div>
    );
  }

  // If authenticated and has required role (or no role required), render the protected route
  if (isAuthenticated && hasRequiredRole() && !isLoading && isInitialized) {
    console.log('[ProtectedRoute] Rendering protected route');
    return <>{typeof children === 'function' ? children({ isAuthenticated: true }) : children}</>;
  }

  // Fallback in case something goes wrong
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="text-center">
        <Preloader />
        <p className="mt-4 text-gray-600">Preparing your session...</p>
      </div>
    </div>
  );
};

export default ProtectedRoute;
