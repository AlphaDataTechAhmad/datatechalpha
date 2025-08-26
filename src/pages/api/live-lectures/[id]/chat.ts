import { NextApiRequest, NextApiResponse } from 'next';
import { databases, DATABASE_ID, LECTURE_CHAT_COLLECTION_ID } from '@/lib/appwrite';
import { Permission, Role, Query, ID } from 'appwrite';

// Helper function to handle errors
const handleError = (res: NextApiResponse, error: any, statusCode: number = 400) => {
  console.error('Error:', error);
  res.status(statusCode).json({ error: error.message || 'Something went wrong' });
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id: lectureId } = req.query;

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (!lectureId) {
    return res.status(400).json({ error: 'Lecture ID is required' });
  }

  try {
    if (req.method === 'GET') {
      // Get chat messages for this lecture
      const { limit = 50 } = req.query;
      
      const messages = await databases.listDocuments(
        DATABASE_ID,
        LECTURE_CHAT_COLLECTION_ID,
        [
          Query.equal('lectureId', lectureId as string),
          Query.orderDesc('$createdAt'),
          Query.limit(Number(limit) || 50)
        ]
      );
      
      // Reverse to show oldest first
      messages.documents.reverse();
      
      return res.status(200).json(messages.documents);
    } 
    
    if (req.method === 'POST') {
      // Post a new chat message
      const { userId, userName, message } = req.body;
      
      if (!userId || !userName || !message) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      // Create a new chat message
      const newMessage = await databases.createDocument(
        DATABASE_ID,
        LECTURE_CHAT_COLLECTION_ID,
        ID.unique(),
        {
          lectureId,
          userId,
          userName,
          message,
          timestamp: new Date().toISOString(),
        },
        [
          // Allow anyone to read messages
          Permission.read(Role.any()),
          // Only the message creator can update/delete their own messages
          Permission.update(Role.user(userId)),
          Permission.delete(Role.user(userId)),
        ]
      );
      
      return res.status(201).json(newMessage);
    }
    
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (error: any) {
    handleError(res, error, 500);
  }
}
