import { Client, Account, Databases, Storage, ID, Query, Avatars } from 'appwrite';
import { Users } from 'node-appwrite';
import { NextApiRequest } from 'next';

// Log environment variables for debugging
console.log('Appwrite Endpoint:', import.meta.env.VITE_APPWRITE_ENDPOINT);
console.log('Appwrite Project ID:', import.meta.env.VITE_APPWRITE_PROJECT_ID);
console.log('Database ID:', import.meta.env.VITE_APPWRITE_DATABASE_ID);

// Environment variables
const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT as string;
const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID as string;

if (!endpoint || !projectId) {
  console.error('Missing required Appwrite environment variables');
  console.error('VITE_APPWRITE_ENDPOINT:', endpoint);
  console.error('VITE_APPWRITE_PROJECT_ID:', projectId);
  throw new Error('Missing required Appwrite environment variables');
}

// Initialize the Appwrite client
const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId);

const account = new Account(client);
const databases = new Databases(client);
const storage = new Storage(client);
const avatars = new Avatars(client);

// Log Appwrite configuration
console.log('Appwrite client initialized with:', {
  endpoint: endpoint ? '***' : 'MISSING',
  projectId: projectId ? '***' : 'MISSING',
  nodeEnv: import.meta.env.MODE
});

// Export the Appwrite client and services
export { client, account, databases, storage, avatars };

// Database and Collection IDs
export const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID as string;
if (!DATABASE_ID) {
  console.error('Missing VITE_APPWRITE_DATABASE_ID environment variable');
}

export const LIVE_LECTURES_COLLECTION_ID = import.meta.env.VITE_APPWRITE_LIVE_LECTURES_COLLECTION_ID as string;
export const PAYMENTS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_PAYMENTS_COLLECTION_ID as string;
export const STUDY_MATERIALS_COLLECTION_ID = '682c0545000d9a62893e'; // Your study materials collection ID
export const STUDY_MATERIALS_BUCKET_ID = import.meta.env.VITE_APPWRITE_STUDY_MATERIALS_BUCKET_ID as string;

// Server-side admin client (only for API routes)
let adminUsers: Users | null = null;

// This function should only be called in server-side code
const getAdminUsers = () => {
  if (typeof window !== 'undefined') {
    throw new Error('Admin client cannot be used in browser');
  }
  
  if (!adminUsers) {
    const { Client, Users: ServerUsers } = require('node-appwrite');
    const adminClient = new Client()
      .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
      .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY || '');
    
    adminUsers = new ServerUsers(adminClient);
  }
  
  return adminUsers;
};

// Auth utilities
export const getAuth = (req: NextApiRequest) => {
  // Extract token from Authorization header
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    return { userId: null };
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return { userId: null };
  }

  // In a real implementation, you would verify the JWT token here
  // For now, we'll just return the token as the user ID
  return {
    userId: token, // This is a placeholder - in production, verify the JWT
    token
  };
};

// Export the admin users getter for server-side use only
export { ID, Query, getAdminUsers };

// Log client configuration
console.log('Appwrite client initialized with:', {
  endpoint,
  projectId,
  databaseId: DATABASE_ID,
  studyMaterialsCollectionId: STUDY_MATERIALS_COLLECTION_ID,
  studyMaterialsBucketId: STUDY_MATERIALS_BUCKET_ID
});

export interface SavePaymentParams {
  userId: string;
  courseId?: string;
  internshipId?: string;
  paymentId: string;
  orderId: string;
  amount: number;
  currency: string;
  status: string;
  receipt?: string;
  metadata?: Record<string, any>;
  type?: 'course' | 'internship';
}

export const savePaymentToAppwrite = async ({
  userId,
  courseId,
  internshipId,
  paymentId,
  orderId,
  amount,
  currency,
  status,
  receipt,
  metadata = {},
  type = courseId ? 'course' : 'internship',
}: SavePaymentParams) => {
  if (!DATABASE_ID || !PAYMENTS_COLLECTION_ID) {
    throw new Error('Appwrite database or collection ID not configured');
  }

  try {
    if (!DATABASE_ID || !PAYMENTS_COLLECTION_ID) {
      throw new Error('Appwrite database or collection ID not configured');
    }

    if (!courseId && !internshipId) {
      throw new Error('Either courseId or internshipId must be provided');
    }

    const document = await databases.createDocument(
      DATABASE_ID,
      PAYMENTS_COLLECTION_ID,
      ID.unique(),
      {
        userId,
        ...(courseId && { courseId }),
        ...(internshipId && { internshipId }),
        paymentId,
        orderId,
        amount,
        currency,
        status,
        type,
        receipt,
        ...metadata,
      }
    );
    return document;
  } catch (error) {
    console.error('Error saving payment to Appwrite:', error);
    throw error;
  }
};

export const getPaymentByOrderId = async (orderId: string) => {
  if (!process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || !process.env.NEXT_PUBLIC_APPWRITE_PAYMENTS_COLLECTION_ID) {
    throw new Error('Appwrite database or collection ID not configured');
  }

  try {
    const response = await databases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
      process.env.NEXT_PUBLIC_APPWRITE_PAYMENTS_COLLECTION_ID,
      [
        `orderId=${orderId}`,
      ]
    );
    
    return response.documents[0] || null;
  } catch (error) {
    console.error('Error fetching payment from Appwrite:', error);
    throw error;
  }
};
