import { createContext, useContext, useEffect, useState, useCallback, useMemo, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { account, databases, signInAccount, client } from '../Services/appwrite';
import { Query, Models } from 'appwrite';
import { User, SubAdminPermissions } from '../types/user.types';

// Lazy load the DeactivationModal component
const DeactivationModal = lazy(() => import('../components/DeactivationModal'));

// Database constants
const DATABASE_ID = '68261b6a002ba6c3b584';
const PROFILE_COLLECTION_ID = "68261bb5000a54d8652b";

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

interface AuthContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  isLoading: boolean;
  isInitialized: boolean;
  isAuthenticated: boolean;
  error: AuthError | null;
  isDeactivated: boolean;
  login: (email: string, password: string) => Promise<AuthCheckResult>;
  checkAuthUser: () => Promise<AuthCheckResult>;
  refreshUserData: () => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
}

// Removed unused AppwriteAccount interface

interface ProfileDoc extends Models.Document {
  $id: string;
  accountId: string;
  name: string;
  email: string;
  phone?: string;
  bio?: string;
  location?: string; // This is our custom location field
  imageUrl: string;
  enrolledCourses: any[];
  $createdAt: string;
  $updatedAt: string;
  role?: 'user' | 'teacher' | 'admin' | 'subadmin';
  is_active?: boolean;
  $collectionId: string;
  $databaseId: string;
  $permissions: string[];
}

const INITIAL_STATE: AuthContextType = {
  user: null,
  setUser: () => {},
  isLoading: true,
  isInitialized: false,
  isAuthenticated: false,
  error: null,
  isDeactivated: false,
  login: async () => ({ isAuthenticated: false, user: null }),
  checkAuthUser: async () => ({ isAuthenticated: false, user: null }),
  refreshUserData: async () => false,
  logout: async () => {},
  clearError: () => {}
};

const AuthContext = createContext<AuthContextType>(INITIAL_STATE);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isDeactivated, setIsDeactivated] = useState(false);
  const [showDeactivationModal, setShowDeactivationModal] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);
  const navigate = useNavigate();
  
  const clearError = useCallback(() => setError(null), []);

  const clearAuthState = useCallback(async (): Promise<void> => {
    try {
      // Clear the session token from the client
      if (client.headers['X-Appwrite-Session']) {
        delete client.headers['X-Appwrite-Session'];
      }
      
      // Clear any existing sessions
      try {
        await account.deleteSessions();
      } catch (sessionError) {
        console.log('No active sessions to delete or error deleting sessions:', sessionError);
      }
      
      // Clear session cookies
      document.cookie.split(';').forEach(cookie => {
        const [name] = cookie.trim().split('=');
        if (name.startsWith('a_session_')) {
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        }
      });
      
    } catch (error) {
      console.error('Error during sign out:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('isAuthenticated');
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    await clearAuthState();
    // Clear deactivation state
    setIsDeactivated(false);
    setShowDeactivationModal(false);
    localStorage.removeItem('showDeactivationModal');
    navigate('/login', { replace: true });
  }, [clearAuthState, navigate]);

  const checkDeactivatedStatus = useCallback(async (): Promise<boolean> => {
    if (!user) return false;
    
    try {
      console.log('[AuthContext] Fetching profile for account ID:', user.accountId);
      const response = await databases.listDocuments<ProfileDoc>(
        DATABASE_ID,
        PROFILE_COLLECTION_ID,
        [Query.equal('accountId', user.accountId)]
      );
      
      console.log('[AuthContext] Profile query results:', {
        total: response.total,
        documents: response.documents
      });

      if (response.documents.length > 0) {
        const userDoc = response.documents[0];
        const isDeactivatedNow = userDoc.is_active === false;
        
        if (isDeactivatedNow) {
          if (!isDeactivated) {
            setIsDeactivated(true);
            setShowDeactivationModal(true);
            // Store in local storage to persist across page refreshes
            localStorage.setItem('showDeactivationModal', 'true');
          }
          return true;
        } else {
          // If user is no longer deactivated, hide the modal
          if (isDeactivated) {
            setIsDeactivated(false);
            setShowDeactivationModal(false);
            localStorage.removeItem('showDeactivationModal');
          }
        }
      }
      return false;
    } catch (error) {
      console.error('Error checking deactivated status:', error);
      return false;
    }
  }, [user, isDeactivated]);

  // Check for deactivation status on mount
  useEffect(() => {
    const showModal = localStorage.getItem('showDeactivationModal') === 'true';
    if (showModal && user) {
      setShowDeactivationModal(true);
      setIsDeactivated(true);
    }
  }, [user]);

  // Periodically check if user is deactivated
  useEffect(() => {
    if (!user) return;
    
    // Initial check
    checkDeactivatedStatus();
    
    // Then check every 30 seconds
    const interval = setInterval(async () => {
      await checkDeactivatedStatus();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [user, checkDeactivatedStatus]);

  const checkAuthUser = useCallback(async (): Promise<AuthCheckResult> => {
    setIsLoading(true);
    try {
      console.log('[AuthContext] Checking authentication status...');
      // First check if we have a session cookie
      const sessionCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith(`a_session_${client.config.project}=`));
      
      if (!sessionCookie) {
        throw new Error('No active session found');
      }
      
      // Get the current account
      const currentAccount = await account.get();
      
      if (!currentAccount) {
        throw new Error('Failed to get account information');
      }
      
      console.log('[AuthContext] Active session found, user ID:', currentAccount.$id);
      
      // Get the user's profile
      const profileResponse = await databases.listDocuments<ProfileDoc>(
        DATABASE_ID,
        PROFILE_COLLECTION_ID,
        [Query.equal("accountId", currentAccount.$id)]
      );
      
      const profileDoc = profileResponse.documents[0];
      
      if (!profileDoc) {
        throw new Error('User profile not found');
      }
      
      const isDeactivatedNow = profileDoc?.is_active === false;
      
      // Update deactivated state
      setIsDeactivated(isDeactivatedNow);

      // If deactivated, throw error
      if (isDeactivatedNow) {
        await clearAuthState();
        throw new Error('ACCOUNT_DEACTIVATED: Your profile has been deactivated by the admin. Please contact your administrator.');
      }

      // Parse subAdminPermissions if they exist
      let subAdminPermissions: SubAdminPermissions = {
        videoReview: false,
        notesReview: false,
        teacherManagement: false,
        studentManagement: false,
        reelsManagement: false
      };
      
      if (profileDoc?.subAdminPermissions) {
        try {
          const parsedPermissions = typeof profileDoc.subAdminPermissions === 'string' 
            ? JSON.parse(profileDoc.subAdminPermissions) 
            : profileDoc.subAdminPermissions;
          
          // Ensure all required permissions are set
          subAdminPermissions = {
            videoReview: Boolean(parsedPermissions.videoReview),
            notesReview: Boolean(parsedPermissions.notesReview),
            teacherManagement: Boolean(parsedPermissions.teacherManagement),
            studentManagement: Boolean(parsedPermissions.studentManagement),
            reelsManagement: Boolean(parsedPermissions.reelsManagement || false)
          };
        } catch (e) {
          console.error('Error parsing subAdminPermissions:', e);
        }
      }

      const userData: User = {
        $id: profileDoc.$id,
        accountId: profileDoc.accountId,
        name: profileDoc.name || currentAccount.name || currentAccount.email.split('@')[0],
        email: currentAccount.email,
        phone: profileDoc?.phone || '',
        bio: profileDoc?.bio || '',
        location: profileDoc?.location || '',
        imageUrl: profileDoc?.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(profileDoc?.name || currentAccount.name || currentAccount.email.split('@')[0])}&background=random`,
        enrolledCourses: profileDoc?.enrolledCourses || [],
        $createdAt: profileDoc?.$createdAt || currentAccount.$createdAt || new Date().toISOString(),
        role: (profileDoc?.role as 'user' | 'teacher' | 'admin' | 'subadmin' | undefined) || 'user',
        is_active: profileDoc?.is_active !== false, // Default to true if not set
        subAdminPermissions: subAdminPermissions
      };

      console.log('[AuthContext] User data loaded:', {
        id: userData.$id,
        email: userData.email,
        role: userData.role,
        isAdmin: userData.role === 'admin'
      });

      setUser(userData);
      setIsAuthenticated(true);
      localStorage.setItem('isAuthenticated', 'true');
      
      return { isAuthenticated: true, user: userData };
    } catch (error) {
      await clearAuthState();
      return { isAuthenticated: false, user: null };
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  }, [clearAuthState]);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedAuth = localStorage.getItem('isAuthenticated') === 'true';
      if (storedAuth) {
        await checkAuthUser();
      } else {
        setIsLoading(false);
        setIsInitialized(true);
      }
    };
    initializeAuth();
  }, [checkAuthUser]);

  const login = useCallback(async (email: string, password: string): Promise<AuthCheckResult> => {
    setIsLoading(true);
    try {
      console.log('Attempting to sign in with email:', email);
      if (!email) {
        throw new Error('Email is required');
      }
      if (!password) {
        throw new Error('Password is required');
      }
      
      // First check if this is a teacher and if their account is active
      if (email !== 'Techdata') { // Skip this check for admin
        const usersResponse = await databases.listDocuments<ProfileDoc>(
          DATABASE_ID,
          PROFILE_COLLECTION_ID,
          [
            Query.equal('email', email),
            Query.equal('role', 'teacher')
          ]
        );
        
        if (usersResponse.documents.length > 0) {
          const teacher = usersResponse.documents[0];
          if (teacher.is_active === false) {
            // This error message will be shown to the user
            throw new Error('ACCOUNT_DEACTIVATED: Your profile has been deactivated by the admin. Please contact your administrator.');
          }
        }
      }

      // Check for admin credentials
      if (email === 'Techdata' && password === 'Data@123456') {
        const adminUser: User = {
          $id: 'admin-0001',
          accountId: 'admin-account',
          name: 'Admin',
          email: 'admin@techdata.com',
          phone: '',
          bio: 'System Administrator',
          location: 'Headquarters',
          imageUrl: 'https://ui-avatars.com/api/?name=Admin&background=random',
          enrolledCourses: [],
          $createdAt: new Date().toISOString(),
          role: 'admin',
          isVerified: true,
          is_teacher_verified: false,
          status: 'active'
        };
        
        setUser(adminUser);
        setIsAuthenticated(true);
        setIsInitialized(true);
        localStorage.setItem('isAuthenticated', 'true');
        return { isAuthenticated: true, user: adminUser };
      }

      // Regular user login
      const session = await signInAccount({ email, password });
      console.log('Sign in successful, session:', session);
      return await checkAuthUser();
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error.message || 'Failed to login';
      setError({ message: errorMessage, code: error.code, details: error });
      setIsLoading(false);
      return { isAuthenticated: false, user: null, error: errorMessage };
    }
  }, [checkAuthUser]);

  const refreshUserData = useCallback(async (): Promise<boolean> => {
    const result = await checkAuthUser();
    return result.isAuthenticated;
  }, [checkAuthUser]);

  const contextValue = useMemo(() => ({
    user,
    setUser,
    isAuthenticated,
    isLoading,
    isInitialized,
    error,
    isDeactivated,
    login,
    checkAuthUser,
    refreshUserData,
    logout,
    clearError,
  }), [
    user,
    isAuthenticated,
    isLoading,
    isInitialized,
    error,
    isDeactivated,
    login,
    checkAuthUser,
    refreshUserData,
    logout,
    clearError,
  ]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
      {showDeactivationModal && (
        <Suspense fallback={null}>
          <DeactivationModal 
            onClose={() => {
              setShowDeactivationModal(false);
              localStorage.removeItem('showDeactivationModal');
              // Don't call logout here, let the modal's handleLogout handle it
            }} 
          />
        </Suspense>
      )}
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