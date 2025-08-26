import { NextApiRequest, NextApiResponse } from 'next';
import { Client, Databases } from 'node-appwrite';

// Initialize the Appwrite client
const client = new Client()
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID || '')
  .setKey(import.meta.env.VITE_APPWRITE_API_KEY || '');

const databases = new Databases(client);

// Collection and database IDs
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID || '';
const INTERNSHIP_APPLICATIONS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_INTERNSHIP_APPLICATIONS_COLLECTION_ID || '';

// Log configuration
console.log('Appwrite configuration:', {
  endpoint: import.meta.env.VITE_APPWRITE_ENDPOINT ? '***' : 'MISSING',
  projectId: import.meta.env.VITE_APPWRITE_PROJECT_ID ? '***' : 'MISSING',
  databaseId: DATABASE_ID ? '***' : 'MISSING',
  collectionId: INTERNSHIP_APPLICATIONS_COLLECTION_ID ? '***' : 'MISSING'
});

type UpdateRequest = {
  applicationId: string;
  userId: string;
  paymentId: string;
  amount: number;
  currency: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  try {
    const { applicationId, userId, paymentId, amount, currency } = req.body as UpdateRequest;

    if (!applicationId || !userId || !paymentId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
      });
    }

    // Update the internship application document
    const updatedDoc = await databases.updateDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '',
      'internship_applications', // Make sure this matches your collection ID
      applicationId,
      {
        payment_status: 'completed',
        payment_id: paymentId,
        payment_amount: amount,
        payment_currency: currency,
        payment_date: new Date().toISOString(),
        status: 'enrolled',
      }
    );

    return res.status(200).json({
      success: true,
      data: updatedDoc,
    });
  } catch (error) {
    console.error('Error updating internship application:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update internship application',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
