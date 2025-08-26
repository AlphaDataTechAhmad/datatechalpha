import { NextApiRequest, NextApiResponse } from 'next';
import { databases, DATABASE_ID, LIVE_LECTURES_COLLECTION_ID } from '@/lib/appwrite';
import { Permission, Role, Query, ID } from 'appwrite';

// Helper function to handle errors
const handleError = (res: NextApiResponse, error: any, statusCode: number = 400) => {
  console.error('Error:', error);
  res.status(statusCode).json({ error: error.message || 'Something went wrong' });
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  if (!id) {
    return res.status(400).json({ error: 'Lecture ID is required' });
  }

  try {
    // Get the current lecture
    const currentLecture = await databases.getDocument(
      DATABASE_ID,
      LIVE_LECTURES_COLLECTION_ID,
      id as string
    );

    if (!currentLecture) {
      return res.status(404).json({ error: 'Lecture not found' });
    }

    // In a real app, verify the user has permission to end this lecture
    // For example, check if the current user is the teacher who created the lecture
    // const { user } = await getSession(req);
    // if (user.id !== currentLecture.teacherId) {
    //   return res.status(403).json({ error: 'Not authorized to end this lecture' });
    // }


    // Update the lecture status to 'ended' and set the end time
    const updatedLecture = await databases.updateDocument(
      DATABASE_ID,
      LIVE_LECTURES_COLLECTION_ID,
      id as string,
      {
        status: 'ended',
        endTime: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    );

    res.status(200).json(updatedLecture);
  } catch (error: any) {
    if (error.code === 404) {
      return res.status(404).json({ error: 'Lecture not found' });
    }
    handleError(res, error, 500);
  }
}
