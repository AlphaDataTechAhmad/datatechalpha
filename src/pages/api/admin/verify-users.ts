import { NextApiRequest, NextApiResponse } from 'next';
import { Client, Users } from 'node-appwrite';

// Initialize Appwrite Admin Client
console.log('Initializing Appwrite client with endpoint:', process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT);
console.log('Project ID:', process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);
console.log('API Key:', process.env.APPWRITE_API_KEY ? '***' + process.env.APPWRITE_API_KEY.slice(-4) : 'Not set');

let adminClient;
try {
  adminClient = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || '')
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '')
    .setKey(process.env.APPWRITE_API_KEY || '');
} catch (error) {
  console.error('Failed to initialize Appwrite client:', error);
  throw error;
}

const adminUsers = new Users(adminClient);

// Helper function to log errors with context
function logError(context: string, error: unknown, extra: Record<string, any> = {}) {
  const timestamp = new Date().toISOString();
  console.error(`\n=== ERROR [${timestamp}] ===`);
  console.error(`Context: ${context}`);
  
  if (error instanceof Error) {
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      ...(error as any).code && { code: (error as any).code },
      ...(error as any).type && { type: (error as any).type },
    });
  } else {
    console.error('Unknown error type:', error);
  }
  
  if (Object.keys(extra).length > 0) {
    console.error('Additional context:', extra);
  }
  console.error('=== END ERROR ===\n');
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Log environment variables (without sensitive data)
  console.log('Environment:', {
    NODE_ENV: process.env.NODE_ENV,
    APPWRITE_ENDPOINT: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ? 'set' : 'missing',
    APPWRITE_PROJECT_ID: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ? 'set' : 'missing',
    APPWRITE_API_KEY: process.env.APPWRITE_API_KEY ? 'set' : 'missing'
  });
  // Log request details
  console.log('\n=== INCOMING REQUEST ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Headers:', req.headers);
  console.log('Cookies:', req.cookies);
  console.log('=== END REQUEST ===\n');
  
  // Only allow POST requests
  if (req.method !== 'POST') {
    const error = 'Method not allowed';
    logError('Method validation', new Error(error), { method: req.method });
    return res.status(405).json({ 
      success: false,
      error
    });
  }

  console.log('Starting verify-users API handler');
  
  try {
    console.log('Starting user verification process...');
    console.log('Environment variables:', {
      endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ? 'Set' : 'Missing',
      projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ? 'Set' : 'Missing',
      apiKey: process.env.APPWRITE_API_KEY ? 'Set' : 'Missing'
    });
    
    // Get all users (simplified - in production, implement pagination)
    console.log('Fetching users list...');
    let result;
    try {
      result = await adminUsers.list();
      console.log(`Found ${result.users.length} users to process`);
    } catch (listError) {
      logError('fetching users list', listError);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch users list',
        details: listError instanceof Error ? listError.message : 'Unknown error'
      });
    }
    
    let verifiedCount = 0;
    const errors: string[] = [];
    
    // Process each user
    for (const user of result.users) {
      try {
        console.log(`Processing user: ${user.email} (${user.$id})`);
        
        // Skip if already verified
        if (user.emailVerification) {
          console.log(`User ${user.email} is already verified`);
          continue;
        }
        
        // Update verification status
        console.log(`Verifying user: ${user.email}`);
        await adminUsers.updateEmailVerification(user.$id, true);
        verifiedCount++;
        console.log(`✅ Verified: ${user.email}`);
        
      } catch (userError) {
        const errorMsg = `Error processing user ${user.$id}: ${userError instanceof Error ? userError.message : 'Unknown error'}`;
        console.error(errorMsg);
        errors.push(errorMsg);
        // Continue with next user on error
      }
    }
    
    const successMessage = `✅ Successfully verified ${verifiedCount} users`;
    console.log(successMessage);
    
    // Always return a JSON response
    if (errors.length > 0) {
      console.warn(`Completed with ${errors.length} errors`);
      return res.status(207).json({
        success: true,
        verifiedCount,
        message: successMessage,
        warnings: errors,
        hasWarnings: true
      });
    }
    
    return res.status(200).json({
      success: true,
      verifiedCount,
      message: successMessage,
      hasWarnings: false
    });
    
  } catch (error) {
    console.error('Error in verify-users API:', error);
    
    // Detailed error logging
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
    }
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}
