import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { account, databases } from '../Services/appwrite';
import { Query, Models } from 'appwrite';
import { User, UserRole } from '../types/user.types';

// Database constants
const DATABASE_ID = '68261b6a002ba6c3b584';
const TEST_CONDUCTOR_COLLECTION = 'test_conductors'; // You'll need to create this collection

interface AuthError {
  message: string;
  code?: string;
  details?: any;
}

interface AuthCheckResult {
  isAuthenticated: boolean;
  user: User | null;
  error?: string;
  errorCode?: string;
}

interface TestConductorAuthContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  isLoading: boolean;
  isInitialized: boolean;
  isAuthenticated: boolean;
  error: AuthError | null;
  login: (email: string, password: string) => Promise<AuthCheckResult>;
  checkAuthUser: () => Promise<AuthCheckResult>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const INITIAL_STATE: TestConductorAuthContextType = {
  user: null,
  setUser: () => {},
  isLoading: true,
  isInitialized: false,
  isAuthenticated: false,
  error: null,
  login: async () => ({ isAuthenticated: false, user: null }),
  checkAuthUser: async () => ({ isAuthenticated: false, user: null }),
  logout: async () => {},
  clearError: () => {},
};

const TestConductorAuthContext = createContext<TestConductorAuthContextType>(INITIAL_STATE);

export const TestConductorAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const clearError = useCallback(() => setError(null), []);

  const login = async (email: string, password: string): Promise<AuthCheckResult> => {
    try {
      setIsLoading(true);
      clearError();

      // Sign in with Appwrite
      await account.createEmailSession(email, password);
      
      // Get the current session
      const session = await account.getSession('current');
      
      // Get the user's profile from the test_conductors collection
      const response = await databases.listDocuments(
        DATABASE_ID,
        TEST_CONDUCTOR_COLLECTION,
        [Query.equal('email', [email])]
      );

      if (response.documents.length === 0) {
        throw new Error('No test conductor account found with this email');
      }

      const conductorData = response.documents[0];
      
      // Create user object
      const userData: User = {
        $id: conductorData.$id,
        accountId: conductorData.accountId,
        name: conductorData.name,
        email: conductorData.email,
        phone: conductorData.phone || '',
        imageUrl: conductorData.imageUrl || '',
        enrolledCourses: conductorData.enrolledCourses || [],
        $createdAt: conductorData.$createdAt,
        role: 'testconductor' as UserRole,
        is_active: conductorData.is_active !== false,
        status: conductorData.status || 'active',
      };

      setUser(userData);
      
      // Redirect to test dashboard after successful login
      const redirectTo = location.state?.from?.pathname || '/test-dashboard';
      navigate(redirectTo, { replace: true });
      
      return { isAuthenticated: true, user: userData };
    } catch (error: any) {
      console.error('Login error:', error);
      const authError: AuthError = {
        message: error.message || 'Failed to sign in',
        code: error.code,
        details: error.response || null,
      };
      setError(authError);
      return { 
        isAuthenticated: false, 
        user: null, 
        error: authError.message,
        errorCode: authError.code
      };
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  };

  const checkAuthUser = useCallback(async (): Promise<AuthCheckResult> => {
    try {
      setIsLoading(true);
      clearError();

      // Check if there's an active session
      const session = await account.getSession('current');
      if (!session) {
        return { isAuthenticated: false, user: null };
      }

      // Get the user's profile from the test_conductors collection
      const response = await databases.listDocuments(
        DATABASE_ID,
        TEST_CONDUCTOR_COLLECTION,
        [Query.equal('accountId', [session.userId])]
      );

      if (response.documents.length === 0) {
        throw new Error('No test conductor account found');
      }

      const conductorData = response.documents[0];
      
      // Create user object
      const userData: User = {
        $id: conductorData.$id,
        accountId: conductorData.accountId,
        name: conductorData.name,
        email: conductorData.email,
        phone: conductorData.phone || '',
        imageUrl: conductorData.imageUrl || '',
        enrolledCourses: conductorData.enrolledCourses || [],
        $createdAt: conductorData.$createdAt,
        role: 'testconductor' as UserRole,
        is_active: conductorData.is_active !== false,
        status: conductorData.status || 'active',
      };

      setUser(userData);
      return { isAuthenticated: true, user: userData };
    } catch (error) {
      console.error('Auth check error:', error);
      // If there's no session or any other error, ensure we're logged out
      await account.deleteSession('current');
      setUser(null);
      return { isAuthenticated: false, user: null };
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await account.deleteSession('current');
      setUser(null);
      navigate('/test-conductor/login', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, [navigate]);

  // Check authentication state on mount
  useEffect(() => {
    checkAuthUser();
  }, [checkAuthUser]);

  const value = useMemo(
    () => ({
      user,
      setUser,
      isLoading,
      isInitialized,
      isAuthenticated: !!user,
      error,
      login,
      checkAuthUser,
      logout,
      clearError,
    }),
    [user, isLoading, isInitialized, error, checkAuthUser, clearError, logout]
  );

  return (
    <TestConductorAuthContext.Provider value={value}>
      {children}
    </TestConductorAuthContext.Provider>
  );
};

export const useTestConductorAuth = (): TestConductorAuthContextType => {
  const context = useContext(TestConductorAuthContext);
  if (context === undefined) {
    throw new Error('useTestConductorAuth must be used within a TestConductorAuthProvider');
  }
  return context;
};

export default TestConductorAuthContext;
