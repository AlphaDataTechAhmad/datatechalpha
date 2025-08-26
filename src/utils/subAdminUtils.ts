import { ID } from 'appwrite';
import { databases } from '../Services/appwrite';
import { DATABASE_ID, PROFILE_COLLECTION_ID } from '../config';
import { User } from '../types/user.types';

// Define a type for the account service to avoid circular dependency
type AccountService = {
  create: (userId: string, email: string, password: string, name: string) => Promise<{ $id: string }>;
};

let _accountService: AccountService | null = null;

export const setAccountService = (accountService: AccountService) => {
  _accountService = accountService;
};

// Define the shape of permissions
export interface SubAdminPermissions {
  videoReview: boolean;
  notesReview: boolean;
  teacherManagement: boolean;
  studentManagement: boolean;
}

export const createSubAdmin = async (userData: {
  name: string;
  email: string;
  password: string;
  permissions: {
    videoReview: boolean;
    notesReview: boolean;
    teacherManagement: boolean;
    studentManagement: boolean;
  };
}) => {
  if (!_accountService) {
    throw new Error('Account service not initialized. Call setAccountService() first.');
  }

  try {
    // First create the user in the authentication system
    const account = await _accountService.create(
      ID.unique(),
      userData.email,
      userData.password,
      userData.name
    );

    // Convert permissions to JSON string for storage
    const permissionsJson = JSON.stringify(userData.permissions);
    
    // Then create the user profile in the database
    const profile = await databases.createDocument(
      DATABASE_ID,
      PROFILE_COLLECTION_ID,
      ID.unique(),
      {
        accountId: account.$id,
        name: userData.name,
        email: userData.email,
        role: 'subadmin',
        subAdminPermissions: permissionsJson,
        is_active: true,
      }
    );

    return { ...account, ...profile };
  } catch (error) {
    console.error('Error creating sub-admin:', error);
    throw error;
  }
};

export const updateSubAdminPermissions = async (
  userId: string,
  permissions: {
    videoReview: boolean;
    notesReview: boolean;
    teacherManagement: boolean;
    studentManagement: boolean;
  }
) => {
  try {
    // Convert permissions to JSON string for storage
    const permissionsJson = JSON.stringify(permissions);
    
    const updatedUser = await databases.updateDocument(
      DATABASE_ID,
      PROFILE_COLLECTION_ID,
      userId,
      {
        subAdminPermissions: permissionsJson,
        role: 'subadmin' as const
      }
    );

    return updatedUser;
  } catch (error) {
    console.error('Error updating sub-admin permissions:', error);
    throw error;
  }
};

export const getSubAdmin = async (userId: string): Promise<User | null> => {
  try {
    const user = await databases.getDocument(
      DATABASE_ID,
      PROFILE_COLLECTION_ID,
      userId
    );

    if (user.role !== 'subadmin') {
      throw new Error('User is not a sub-admin');
    }

    return user as unknown as User;
  } catch (error) {
    console.error('Error fetching sub-admin:', error);
    return null;
  }
};
