import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ReactNode } from 'react';
import { UserRole } from '@/types/user.types';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: UserRole | 'student' | 'user';
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

    const userRole = user.role;
    
    // Define role hierarchy (each role has access to itself and all roles below it)
    const roleHierarchy: Record<string, number> = {
      'admin': 4,
      'subadmin': 3,
      'teacher': 2,
      'testconductor': 2,
      'student': 1,
      'user': 0
    };

    // If required role is not in the hierarchy, deny access
    if (requiredRole && !(requiredRole in roleHierarchy)) {
      console.log(`Unknown required role: ${requiredRole}`);
      return false;
    }

    // If user role is not in the hierarchy, deny access
    if (!(userRole in roleHierarchy)) {
      console.log(`Unknown user role: ${userRole}`);
      return false;
    }

    // If no specific role is required, just check if user is authenticated
    if (!requiredRole) {
      console.log('No specific role required, access granted');
      return true;
    }

    // Check if user's role has sufficient privileges
    const userLevel = roleHierarchy[userRole];
    const requiredLevel = roleHierarchy[requiredRole];
    const hasAccess = userLevel >= requiredLevel;

    console.log('Role check:', {
      userRole,
      requiredRole,
      userLevel,
      requiredLevel,
      hasAccess
    });

    return hasAccess;
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
