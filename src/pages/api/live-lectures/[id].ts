import { NextApiRequest, NextApiResponse } from 'next';
import { databases, DATABASE_ID, LIVE_LECTURES_COLLECTION_ID } from '@/lib/appwrite';
import { Permission, Role, Query, ID } from 'appwrite';
import { ILiveLecture } from '@/models/LiveLecture';

// Helper function to handle errors
const handleError = (res: NextApiResponse, error: any, statusCode: number = 400) => {
  console.error('Error:', error);
  res.status(statusCode).json({ error: error.message || 'Something went wrong' });
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (!id) {
    return res.status(400).json({ error: 'Lecture ID is required' });
  }

  try {
    switch (req.method) {
      case 'GET':
        await handleGetLecture(req, res, id as string);
        break;
      case 'PATCH':
        await handleUpdateLecture(req, res, id as string);
        break;
      case 'DELETE':
        await handleDeleteLecture(req, res, id as string);
        break;
      default:
        res.setHeader('Allow', ['GET', 'PATCH', 'DELETE']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    handleError(res, error);
  }
}

// GET /api/live-lectures/:id
async function handleGetLecture(req: NextApiRequest, res: NextApiResponse, lectureId: string) {
  try {
    const lecture = await databases.getDocument(
      DATABASE_ID,
      LIVE_LECTURES_COLLECTION_ID,
      lectureId
    );
    
    if (!lecture) {
      return res.status(404).json({ error: 'Lecture not found' });
    }
    
    res.status(200).json(lecture);
  } catch (error: any) {
    if (error.code === 404) {
      return res.status(404).json({ error: 'Lecture not found' });
    }
    handleError(res, error, 500);
  }
}

// PATCH /api/live-lectures/:id
async function handleUpdateLecture(req: NextApiRequest, res: NextApiResponse, lectureId: string) {
  const { 
    title, 
    description, 
    startTime, 
    endTime, 
    status,
    meetingUrl,
    recordingUrl 
  } = req.body;

  try {
    // Get the current lecture to check permissions
    const currentLecture = await databases.getDocument(
      DATABASE_ID,
      LIVE_LECTURES_COLLECTION_ID,
      lectureId
    ) as unknown as ILiveLecture;

    if (!currentLecture) {
      return res.status(404).json({ error: 'Lecture not found' });
    }

    // In a real app, verify the user has permission to update this lecture
    // For example, check if the current user is the teacher who created the lecture
    // const { user } = await getSession(req);
    // if (user.id !== currentLecture.teacherId) {
    //   return res.status(403).json({ error: 'Not authorized to update this lecture' });
    // }


    // Prepare update data
    const updateData: Partial<ILiveLecture> = {
      ...(title && { title }),
      ...(description !== undefined && { description }),
      ...(startTime && { startTime: new Date(startTime).toISOString() }),
      ...(endTime && { endTime: new Date(endTime).toISOString() }),
      ...(status && { status }),
      ...(meetingUrl && { meetingUrl }),
      ...(recordingUrl && { recordingUrl }),
      updatedAt: new Date().toISOString(),
    };

    // Update the lecture
    const updatedLecture = await databases.updateDocument(
      DATABASE_ID,
      LIVE_LECTURES_COLLECTION_ID,
      lectureId,
      updateData
    );

    res.status(200).json(updatedLecture);
  } catch (error: any) {
    if (error.code === 404) {
      return res.status(404).json({ error: 'Lecture not found' });
    }
    handleError(res, error, 500);
  }
}

// DELETE /api/live-lectures/:id
async function handleDeleteLecture(req: NextApiRequest, res: NextApiResponse, lectureId: string) {
  try {
    // In a real app, verify the user has permission to delete this lecture
    // For example, check if the current user is the teacher who created the lecture
    // const { user } = await getSession(req);
    // const lecture = await databases.getDocument(DATABASE_ID, LIVE_LECTURES_COLLECTION_ID, lectureId);
    // if (user.id !== lecture.teacherId) {
    //   return res.status(403).json({ error: 'Not authorized to delete this lecture' });
    // }


    await databases.deleteDocument(
      DATABASE_ID,
      LIVE_LECTURES_COLLECTION_ID,
      lectureId
    );
    
    res.status(204).end();
  } catch (error: any) {
    if (error.code === 404) {
      return res.status(404).json({ error: 'Lecture not found' });
    }
    handleError(res, error, 500);
  }
}
