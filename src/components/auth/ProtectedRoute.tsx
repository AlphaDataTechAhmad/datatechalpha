import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ReactNode } from 'react';
import { UserRole } from '@/types/user.types';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: UserRole | 'student';
  redirectTo?: string;
}

export const ProtectedRoute = ({
  children,
  requiredRole = 'student',
  redirectTo = '/login',
}: ProtectedRouteProps) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // If user is not logged in, redirect to login
  if (!user) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Check if user has the required role
  const hasRequiredRole = () => {
    console.log('Checking required role:', { 
      hasUser: !!user,
      userRole: user?.role, 
      requiredRole,
      currentPath: window.location.pathname
    });

    if (!user?.role) {
      console.log('No user role found');
      return false;
    }
    
    // If user is admin, they have access to everything
    if (user.role === 'admin') {
      console.log('User is admin, access granted');
      return true;
    }
    
    // Subadmin has access to subadmin routes and below
    if (user.role === 'subadmin' && requiredRole !== 'admin') {
      console.log('User is subadmin, access granted');
      return true;
    }
    
    // For other roles, check if they match the required role
    if (requiredRole === 'student' || requiredRole === 'user') {
      console.log('User has student/user access');
      return true; // All logged-in users have student/user access
    }
    
    if (requiredRole === 'teacher' && user.role === 'teacher') {
      console.log('User is teacher, access granted');
      return true;
    }
    
    // Check for exact role match
    if (user.role === requiredRole) {
      console.log('Exact role match, access granted');
      return true;
    }
    
    console.log('Role check failed', { 
      userRole: user.role, 
      requiredRole,
      user,
      location: window.location
    });
    return false;
  };

  const roleCheck = hasRequiredRole();
  console.log('ProtectedRoute debug:', {
    isAuthenticated: !!user,
    userRole: user?.role,
    requiredRole,
    hasRequiredRole: roleCheck,
    currentPath: window.location.pathname
  });

  if (!roleCheck) {
    console.log('Redirecting to home due to failed role check');
    // Redirect to home page or show unauthorized page
    return <Navigate to="/" replace state={{ from: location, reason: 'role_check_failed' }} />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
