import {
  Client,
  Account,
  Databases,
  ID,
  Permission,
  Role,
  Query,
  Storage,
  Models,
  type Models as AppwriteModels
} from "appwrite";

// Initialize the Appwrite client
const client = new Client()
  .setEndpoint("https://cloud.appwrite.io/v1")
  .setProject("68261b5200198bea6bdf");
  // Note: .setSelfSigned() is not needed for cloud.appwrite.io

// Function to get the session token from cookies
const getSessionToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name.startsWith('a_session_')) {
      return value;
    }
  }
  return null;
};

// Set initial session token if it exists
const initialSession = getSessionToken();
if (initialSession) {
  client.headers['X-Appwrite-Session'] = initialSession;
}

// Function to update client with session token
export const updateClientSession = (sessionToken?: string) => {
  if (sessionToken) {
    client.headers['X-Appwrite-Session'] = sessionToken;
  } else {
    delete client.headers['X-Appwrite-Session'];
  }
};

// Constants
export const DATABASE_ID = "68261b6a002ba6c3b584";
export const USER_COLLECTION_ID = "68261bbe00050e9a6cda";
export const PROFILE_COLLECTION_ID = "68261bb5000a54d8652b";
export const TEACHER_IDS_COLLECTION_ID = "682c054e0029e175bc85";
export const COURSES_COLLECTION_ID = "682644ed002b437582d3";
export const TESTS_COLLECTION_ID = "686520c7001bd5bb53b3";

export const STORAGE_BUCKET_ID = "6826481d00212029492a"; // Appwrite Storage Bucket ID for video uploads

// Initialize services
export const account = new Account(client);
export const databases = new Databases(client);

// Collection IDs
export const NOTIFICATIONS_COLLECTION = '6853e351000f87a36c80';
export const USER_NOTIFICATIONS_COLLECTION = '6853e3fb00397e343bbb';

export const CHAT_MESSAGES_COLLECTION = 'chat_messages';
export const NOTIFICATIONS_COLLECTION_ID = NOTIFICATIONS_COLLECTION; // Alias for backward compatibility

// Type for session data
export type Session = AppwriteModels.Session;

/**
 * Check if user is currently authenticated
 */
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    await account.getSession('current');
    return true;
  } catch (error) {
    console.error('Auth check failed:', error);
    return false;
  }
};

/**
 * Get current user session
 */
export const getCurrentSession = async (): Promise<Session | null> => {
  try {
    return await account.getSession('current');
  } catch (error) {
    console.error('Failed to get session:', error);
    return null;
  }
};

/**
 * Refresh the current session
 */
export const refreshSession = async (): Promise<boolean> => {
  try {
    const session = await getCurrentSession();
    if (session) {
      await account.getSession(session.$id);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Session refresh failed:', error);
    return false;
  }
};

/**
 * Make an authenticated request with automatic session refresh
 */
export const authenticatedRequest = async <T>(
  request: () => Promise<T>,
  options: { retryOnAuthFailure: boolean } = { retryOnAuthFailure: true }
): Promise<T> => {
  try {
    return await request();
  } catch (error: any) {
    // If unauthorized and we should retry, try to refresh session
    if (error.code === 401 && options.retryOnAuthFailure) {
      const refreshed = await refreshSession();
      if (refreshed) {
        return request(); // Retry the request once
      }
    }
    throw error; // Re-throw if still failing after refresh or not a 401
  }
};
export const storage = new Storage(client);
// Export all the necessary functions and variables
export {
  // Client and utilities
  client,
  Query,
  Permission,
  Role,
  ID
};

const handleError = (error: unknown, defaultMessage: string) => {
  console.error("Appwrite error:", error);
  throw new Error(error instanceof Error ? error.message : defaultMessage);
};

export const createAccount = async (
  email: string, 
  password: string, 
  name: string, 
  phone: string, 
  role: string
): Promise<Models.User<{}>> => {
  try {
    const newAccount = await account.create(ID.unique(), email, password, name);
    if (!newAccount) throw new Error("Account creation failed");

    const profileData = {
      userId: newAccount.$id,
      accountId: newAccount.$id,
      name,
      email,
      phone: phone || "",
      role: role || "student",
      bio: "",
      location: "",
      imageUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
      createdAt: new Date().toISOString(),
    };

    await databases.createDocument(
      DATABASE_ID,
      PROFILE_COLLECTION_ID,
      ID.unique(),
      profileData,
      [
        Permission.read(Role.user(newAccount.$id)),
        Permission.update(Role.user(newAccount.$id)),
        Permission.delete(Role.user(newAccount.$id)),
        Permission.read(Role.any()),
      ]
    );

    return newAccount;
  } catch (error) {
    console.error("Account creation error:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to create account");
  }
};

export const signInAccount = async ({
  email,
  password,
}: {
  email: string;
  password: string;
}) => {
  console.log('Starting sign in process for:', email);
  
  // Validate input parameters
  if (!email || typeof email !== 'string') {
    console.error('Invalid email parameter:', email);
    throw new Error('A valid email is required');
  }
  
  if (!password || typeof password !== 'string') {
    console.error('Invalid password parameter');
    throw new Error('A password is required');
  }
  
  try {
    // Clean up any existing sessions
    try {
      console.log('Checking for existing sessions...');
      await account.deleteSessions();
      console.log('Cleared existing sessions');
    } catch (sessionError) {
      console.log('No active sessions to clean up or cleanup failed:', sessionError);
      // Continue with login even if session cleanup fails
    }

    // Create a new session
    console.log('Creating new session...');
    let session;
    try {
      // First try to create a session with the provided credentials
      session = await account.createEmailPasswordSession(email, password);
      console.log('Session created successfully');
      
      // Update the client with the new session
      updateClientSession(session.secret);
      
      // Set the session cookie with proper attributes
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 30); // 30 days from now
      document.cookie = `a_session_${client.config.project}=${session.secret}; expires=${expirationDate.toUTCString()}; path=/; secure; samesite=lax`;
    } catch (authError: any) {
      console.error('Authentication failed:', {
        message: authError.message,
        code: authError.code,
        type: authError.type,
        response: authError.response?.message
      });
      
      // Provide more specific error messages
      if (authError.code === 401) {
        throw new Error('Invalid credentials. Please check your email and password.');
      } else if (authError.code === 429) {
        throw new Error('Too many login attempts. Please try again later.');
      } else if (authError.message?.toLowerCase().includes('verification')) {
        throw new Error('Please verify your email before logging in.');
      } else {
        throw new Error(`Authentication failed: ${authError.message || 'Unknown error'}`);
      }
    }
    
    // Make the session persistent
    try {
      const cookies = new URLSearchParams(document.cookie.split('; ').join('&'));
      const sessionCookies = Array.from(cookies.entries())
        .filter(([key]) => key.startsWith('a_session_'));
        
      if (sessionCookies.length > 0) {
        const [cookieName, cookieValue] = sessionCookies[0];
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + 30); // 30 days from now
        document.cookie = `${cookieName}=${cookieValue}; expires=${expirationDate.toUTCString()}; path=/; samesite=lax; secure`;
        console.log('Session cookie set as persistent');
      }
    } catch (cookieError) {
      console.warn('Failed to set persistent cookie:', cookieError);
      // Continue even if cookie setting fails
    }
    
    // Get current account details
    console.log('Fetching account details...');
    const currentAccount = await account.get();
    
    // Check email verification status
    if (currentAccount.emailVerification === false) {
      console.log('Email not verified, cleaning up session...');
      await account.deleteSession('current');
      throw new Error('Please verify your email first. Check your inbox.');
    }

    // Get user profile
    console.log('Fetching user profile...');
    let profile = null;
    try {
      const profileResponse = await databases.listDocuments(
        DATABASE_ID,
        PROFILE_COLLECTION_ID,
        [Query.equal("accountId", currentAccount.$id)]
      );
      profile = profileResponse.documents[0] || null;
      console.log('Profile found:', !!profile);
    } catch (profileError) {
      console.error('Error fetching profile:', profileError);
      // Don't fail login if profile fetch fails, just log it
    }

    console.log('Sign in successful for user:', currentAccount.email);
    
    // Update the client with the new session token
    if (session?.secret) {
      updateClientSession(session.secret);
    }
    
    return {
      account: currentAccount,
      profile,
      session
    };
  } catch (error) {
    console.error('Sign in process failed:', error);
    // Re-throw with more context if needed
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unknown error occurred during sign in');
  }
};

export const getUserProfile = async (accountId: string): Promise<Models.Document | null> => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      PROFILE_COLLECTION_ID,
      [Query.equal("accountId", accountId)]
    );
    return response.documents[0] || null;
  } catch (error) {
    console.error("Error getting user profile:", error);
    return null;
  }
};

export const sendVerificationEmail = async (): Promise<boolean> => {
  try {
    await account.createVerification(`${window.location.origin}/verify-email`);
    return true;
  } catch (error) {
    console.error("Error sending verification email:", error);
    throw new Error("Failed to send verification email");
  }
};

export const createAccountWithVerification = async (
  email: string, 
  password: string, 
  name: string, 
  phone: string, 
  role: string,
  teacherId?: string
): Promise<Models.User<{}>> => {
  try {
    console.log('Starting account creation for:', email);
    
    // 1. First create the account
    const newAccount = await account.create(ID.unique(), email, password, name);
    if (!newAccount) throw new Error("Account creation failed");
    console.log('Account created:', newAccount.$id);

    // 2. Delete any existing sessions first
    try {
      await account.deleteSessions();
      console.log('Cleared existing sessions');
    } catch (deleteError) {
      console.log("No sessions to delete or error deleting sessions:", deleteError);
    }

    // 3. Create a new session
    console.log('Creating new session...');
    await account.createEmailPasswordSession(email, password);

    // 4. Prepare verification
    try {
      // Use current domain for verification URL
      const currentDomain = window.location.origin;
      const verificationUrls = [
        `${currentDomain}/verify-email`,
        `https://datatechalpha.com/verify-email`,
        `http://localhost:5173/verify-email`
      ];
      
      console.log('Using verification URLs:', verificationUrls);
      
      // First, ensure we have a valid session
      let session;
      try {
        session = await account.getSession('current');
        console.log('Active session found:', session.$id);
      } catch (sessionError) {
        console.log('No active session, creating new one...');
        try {
          session = await account.createEmailPasswordSession(email, password);
          console.log('New session created:', session.$id);
        } catch (sessionCreateError) {
          console.error('Failed to create session:', sessionCreateError);
          throw new Error('Failed to create user session');
        }
      }

      // 5. Try each verification URL until one succeeds
      let verificationSent = false;
      let lastError;
      
      for (const verificationUrl of verificationUrls) {
        console.log('\n--- Attempting verification with URL:', verificationUrl);
        let retries = 2;
        
        while (retries > 0 && !verificationSent) {
          try {
            console.log(`Attempting to send verification to ${verificationUrl}...`);
            
            // Try with custom SMTP first
            try {
              console.log('Trying with SMTP...');
              const result = await account.createVerification(verificationUrl);
              console.log('SMTP Response:', result);
              console.log(`✅ Verification email sent to ${verificationUrl} via SMTP`);
              verificationSent = true;
              
              // Log successful verification URL for debugging
              console.log('Successfully sent verification email to:', email);
              console.log('Verification URL used:', verificationUrl);
              
              break;
            } catch (error) {
              const smtpError = error as {
                code?: number;
                message: string;
                type?: string;
                response?: any;
              };
              
              console.warn('❌ SMTP send failed:', smtpError);
              console.error('SMTP Error details:', {
                code: smtpError.code,
                message: smtpError.message,
                type: smtpError.type,
                response: smtpError.response
              });
              
              // Check if it's a rate limit error
              if (smtpError.code === 429) {
                console.warn('Rate limit hit, waiting before retry...');
                await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
              }
              
              throw smtpError; // Move to default service
            }
          } catch (error) {
            console.warn('Falling back to default email service...');
            try {
              const result = await account.createVerification(verificationUrl);
              console.log('Default Service Response:', result);
              console.log(`✅ Verification email sent to ${verificationUrl} via default service`);
              verificationSent = true;
              break;
            } catch (defaultError) {
              lastError = defaultError;
              console.error('❌ Default service failed:', defaultError);
              retries--;
              
              if (retries > 0) {
                console.log(`↻ Retrying ${verificationUrl}... (${retries} attempts left)`);
                await new Promise(resolve => setTimeout(resolve, 1500));
              } else {
                console.error(`❌ All attempts failed for ${verificationUrl}`);
              }
            }
          }
        }
        
        if (verificationSent) {
          console.log('🎉 Verification email successfully sent!');
          break;
        }
      }
      
      if (!verificationSent) {
        const errorMessage = 'All verification attempts failed. Please check your email settings.';
        console.error('❌', errorMessage);
        console.error('Last error details:', JSON.stringify(lastError, null, 2));
        console.warn('Verification URLs attempted:', verificationUrls);
        
        // Log additional debug information
        try {
          const sessionInfo = await account.getSession('current');
          console.log('Current session info:', JSON.stringify(sessionInfo, null, 2));
        } catch (e) {
          console.error('Failed to get session info:', e);
        }
        
        throw new Error(errorMessage);
      }
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Continue with account creation even if email fails
    }
    
    // 5. Create profile document
    const profileData = {
      accountId: newAccount.$id,
      name,
      email,
      phone: phone || "",
      role: role || "student",
      bio: "",
      location: "",
      isVerified: false,
      imageUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
      createdAt: new Date().toISOString(),
      ...(teacherId && { teacherId }), // Include teacherId if provided
    };

    console.log('Creating profile document...');
    await databases.createDocument(
      DATABASE_ID,
      PROFILE_COLLECTION_ID,
      ID.unique(),
      profileData,
      [
        Permission.read(Role.user(newAccount.$id)),
        Permission.update(Role.user(newAccount.$id)),
        Permission.delete(Role.user(newAccount.$id)),
        Permission.read(Role.any()),
      ]
    );

    return newAccount;
  } catch (error) {
    console.error("Account creation error:", error);
    throw error;
  }
};

export const updateUserProfile = async (
  profileId: string,
  data: {
    name?: string;
    phone?: string;
    bio?: string;
    location?: string;
    imageUrl?: string;
  }
): Promise<Models.Document> => {
  try {
    const result = await databases.updateDocument(
      DATABASE_ID,
      PROFILE_COLLECTION_ID,
      profileId,
      data
    );
    return result;
  } catch (error) {
    return handleError(error, "Failed to update profile");
  }
};

// Send password reset email
export const sendPasswordResetEmail = async (email: string): Promise<boolean> => {
  try {
    const resetUrl = `${window.location.origin}/reset-password`;
    await account.createRecovery(
      email,
      resetUrl
    );
    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
};

// Reset password with token
export const resetPassword = async (
  userId: string,
  secret: string,
  newPassword: string,
  confirmPassword: string
): Promise<boolean> => {
  try {
    if (newPassword !== confirmPassword) {
      throw new Error('Passwords do not match');
    }
    
    await account.updateRecovery(
      userId,
      secret,
      newPassword
    );
    
    return true;
  } catch (error) {
    console.error('Error resetting password:', error);
    throw error;
  }
}

export const signOutAccount = async (): Promise<boolean> => {
  try {
    // Try to delete the current session if it exists
    try {
      await account.deleteSession('current');
    } catch (error) {
      console.log('No active session to delete or error deleting session:', error);
    }
    
    // Clear all sessions if possible
    try {
      await account.deleteSessions();
    } catch (error) {
      console.log('Error deleting all sessions:', error);
    }
    
    // Clear the session token from the client
    updateClientSession(undefined);
    
    // Clear all cookies that might be related to the session
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      const eqPos = cookie.indexOf('=');
      const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
      
      // Delete any session-related cookies
      if (name.startsWith('a_session_') || name === 'X-Fallback-Cookies-Accepted') {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${window.location.hostname}`;
      }
    }
    
    // Clear local storage and session storage
    localStorage.removeItem('isAuthenticated');
    sessionStorage.clear();
    
    // Force a hard reload to ensure all state is cleared
    window.location.href = '/';
    
    return true;
  } catch (error) {
    console.error('Error during sign out:', error);
    // Still try to redirect even if there was an error
    window.location.href = '/';
    return false;
  }
};

export const checkUserExists = async (email: string): Promise<boolean> => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      USER_COLLECTION_ID,
      [Query.equal("email", email)]
    );
    return response.documents.length > 0;
  } catch (error) {
    return handleError(error, "Failed to check user existence");
  }
};
