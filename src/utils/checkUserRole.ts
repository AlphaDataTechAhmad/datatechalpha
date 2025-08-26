import { account, databases, DATABASE_ID } from '../appwriteConfig';

// Profile collection ID from Appwrite
const PROFILE_COLLECTION_ID = '68261bb5000a54d8652b';

export interface UserProfile {
  $id: string;
  name: string;
  email: string;
  role: 'admin' | 'teacher' | 'student' | 'subadmin';
  status: 'active' | 'inactive' | 'suspended';
  // Add other profile fields as needed
}

export const createDefaultProfile = async (userId: string, email: string): Promise<UserProfile | null> => {
  try {
    // Check if user exists in Appwrite Auth
    const user = await account.get(userId);
    if (!user) {
      console.error('User not found in Auth');
      return null;
    }

    // Create a minimal profile - Appwrite will add system fields like $createdAt
    const defaultProfile = {
      name: user.name || email.split('@')[0],
      email: email,
      role: 'admin', // Default to admin for now
      status: 'active',
      // Let Appwrite handle system fields like $createdAt, $updatedAt
    };

    console.log('Creating profile with data:', defaultProfile);

    try {
      // Try to create the document with the user ID as the document ID
      const profile = await databases.createDocument(
        DATABASE_ID,
        PROFILE_COLLECTION_ID,
        userId, // Use the user ID as the document ID
        defaultProfile
      ) as unknown as UserProfile;
      
      console.log('Profile created successfully:', profile);
      return profile;
    } catch (error: any) {
      console.error('Detailed error creating profile:', {
        message: error?.message,
        code: error?.code,
        response: error?.response,
        userId,
        email
      });
      throw error; // Re-throw to be handled by the outer try-catch
    }
  } catch (error) {
    console.error('Error creating default profile:', error);
    return null;
  }
};

export const getUserProfile = async (): Promise<UserProfile | null> => {
  try {
    // Get current user session
    const session = await account.getSession('current');
    if (!session) {
      console.log('No active session found');
      return null;
    }

    // Try to get user profile from database
    try {
      const profile = await databases.getDocument(
        DATABASE_ID,
        PROFILE_COLLECTION_ID,
        session.userId
      ) as unknown as UserProfile;

      console.log('User profile found:', profile);
      return profile;
    } catch (error: any) {
      // If profile doesn't exist, create a default one
      if (error.code === 404) {
        console.log('Profile not found, creating default profile...');
        const user = await account.get(session.userId);
        return await createDefaultProfile(session.userId, user.email);
      }
      throw error;
    }
  } catch (error) {
    console.error('Error in getUserProfile:', error);
    return null;
  }
};

export const hasAdminAccess = async (): Promise<boolean> => {
  try {
    const profile = await getUserProfile();
    if (!profile) {
      console.error('No profile found for user');
      return false;
    }
    
    const hasAccess = profile.role === 'admin' && profile.status === 'active';
    console.log(`Admin access check - Role: ${profile.role}, Status: ${profile.status}, Has Access: ${hasAccess}`);
    return hasAccess;
  } catch (error) {
    console.error('Error checking admin access:', error);
    return false;
  }
};
