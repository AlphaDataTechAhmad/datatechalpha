import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Don't expose sensitive data in production
  const isDev = process.env.NODE_ENV !== 'production';
  
  const envVars = {
    NODE_ENV: process.env.NODE_ENV,
    APPWRITE_ENDPOINT: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT,
    APPWRITE_PROJECT_ID: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID,
    APPWRITE_API_KEY: isDev ? process.env.APPWRITE_API_KEY : '***',
    APPWRITE_DATABASE_ID: process.env.APPWRITE_DATABASE_ID,
    // Verify if API key is properly formatted
    API_KEY_STARTS_WITH_STANDARD: process.env.APPWRITE_API_KEY?.startsWith('standard_') || false,
    API_KEY_LENGTH: process.env.APPWRITE_API_KEY?.length || 0
  };

  console.log('Environment variables:', JSON.stringify(envVars, null, 2));

  return res.status(200).json({
    success: true,
    environment: process.env.NODE_ENV,
    appwrite: {
      endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT,
      projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID,
      // Only show API key in development
      apiKey: isDev ? process.env.APPWRITE_API_KEY : '***',
      databaseId: process.env.APPWRITE_DATABASE_ID,
      apiKeyValid: process.env.APPWRITE_API_KEY?.startsWith('standard_') || false
    }
  });
}
