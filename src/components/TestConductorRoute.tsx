import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useTestConductorAuth } from '../contexts/TestConductorAuthContext';
import { Loader2 } from 'lucide-react';

interface TestConductorRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

const TestConductorRoute: React.FC<TestConductorRouteProps> = ({
  children,
  redirectTo = '/test-conductor/login',
}) => {
  const { isAuthenticated, isLoading, checkAuthUser } = useTestConductorAuth();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        await checkAuthUser();
      } catch (error) {
        console.error('Auth verification error:', error);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    verifyAuth();
  }, [checkAuthUser]);

  if (isLoading || isCheckingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to the login page, but save the current location they were trying to go to
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // If authenticated, render the child components
  return <>{children}</>;
};

export default TestConductorRoute;
