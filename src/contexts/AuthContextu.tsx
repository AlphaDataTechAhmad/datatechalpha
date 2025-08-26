import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { account, databases, signOutAccount, signInAccount, getUserProfile, createAccount as createAppwriteAccount } from '../Services/appwrite';
import { ID, Permission, Role, Query } from 'appwrite';

// Database constants
const DATABASE_ID = '68261b6a002ba6c3b584';
const PROFILE_COLLECTION_ID = '68261bb5000a54d8652b';

// Types
type User = {
  $id: string;
  accountId: string;
  name: string;
  email: string;
  phone?: string;
  bio?: string;
  location?: string;
  imageUrl?: string;
  enrolledCourses?: string[];
  role?: string;
  $createdAt?: string;
  $updatedAt?: string;
};

type AuthState = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
};

type AuthContextType = AuthState & {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  refreshUserData: () => Promise<void>;
  clearError: () => void;
};

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  error: null,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthProviderProps = {
  children: ReactNode;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [state, setState] = useState<AuthState>(initialState);
  const navigate = useNavigate();

  // Helper to update state
  const updateState = (updates: Partial<AuthState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  // Clear error message
  const clearError = useCallback(() => {
    updateState({ error: null });
  }, []);

  // Check if user is authenticated on mount
  const checkAuthStatus = useCallback(async () => {
    try {
      updateState({ isLoading: true });
      
      // Get current account
      const currentAccount = await account.get();
      
      // Get user profile
      const profile = await getUserProfile(currentAccount.$id);
      
      if (!profile) {
        throw new Error('User profile not found');
      }

      updateState({
        user: {
          $id: currentAccount.$id,
          accountId: currentAccount.$id,
          name: profile.name,
          email: currentAccount.email,
          phone: profile.phone,
          bio: profile.bio,
          location: profile.location,
          imageUrl: profile.imageUrl,
          enrolledCourses: profile.enrolledCourses || [],
          role: profile.role || 'student',
          $createdAt: profile.$createdAt,
          $updatedAt: profile.$updatedAt,
        },
        isAuthenticated: true,
      });
      
    } catch (error) {
      console.error('Auth check failed:', error);
      // Not an error - just means user is not logged in
      updateState({
        user: null,
        isAuthenticated: false,
      });
    } finally {
      updateState({
        isLoading: false,
        isInitialized: true,
      });
    }
  }, []);

  // Login function
  const login = useCallback(async (email: string, password: string) => {
    try {
      updateState({ isLoading: true, error: null });
      
      // Sign in using Appwrite
      await signInAccount({ email, password });
      
      // Refresh user data
      await checkAuthStatus();
      
      // Navigate to home on successful login
      navigate('/');
      
    } catch (error: any) {
      console.error('Login error:', error);
      updateState({
        error: error.message || 'Failed to log in. Please check your credentials.',
      });
      throw error;
    } finally {
      updateState({ isLoading: false });
    }
  }, [checkAuthStatus, navigate]);

  // Signup function
  const signup = useCallback(async (email: string, password: string, name: string) => {
    try {
      updateState({ isLoading: true, error: null });
      
      // Create new account
      await createAppwriteAccount(email, password, name, '', 'student');
      
      // Log in the new user
      await login(email, password);
      
    } catch (error: any) {
      console.error('Signup error:', error);
      updateState({
        error: error.message || 'Failed to create account. Please try again.',
      });
      throw error;
    } finally {
      updateState({ isLoading: false });
    }
  }, [login]);

  // Logout function
  const logout = useCallback(async () => {
    try {
      updateState({ isLoading: true });
      await signOutAccount();
      updateState({
        user: null,
        isAuthenticated: false,
      });
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      updateState({
        error: 'Failed to log out. Please try again.',
      });
    } finally {
      updateState({ isLoading: false });
    }
  }, [navigate]);

  // Refresh user data
  const refreshUserData = useCallback(async () => {
    if (state.isAuthenticated) {
      await checkAuthStatus();
    }
  }, [state.isAuthenticated, checkAuthStatus]);

  // Initialize auth state on mount
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  // Context value
  const contextValue: AuthContextType = {
    ...state,
    login,
    logout,
    signup,
    refreshUserData,
    clearError,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
