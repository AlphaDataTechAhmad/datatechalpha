import { ID, Query } from 'appwrite';
import { databases } from './appwrite';
import { ILiveLecture } from '@/models/LiveLecture';

// Get environment variables with fallbacks
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID || import.meta.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const LECTURES_COLLECTION_ID = import.meta.env.VITE_APPWRITE_LIVE_LECTURES_COLLECTION_ID || import.meta.env.NEXT_PUBLIC_APPWRITE_LECTURES_COLLECTION_ID;
const PARTICIPANTS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_LECTURE_PARTICIPANTS_COLLECTION_ID || import.meta.env.NEXT_PUBLIC_APPWRITE_PARTICIPANTS_COLLECTION_ID;
const CHAT_COLLECTION_ID = import.meta.env.VITE_APPWRITE_LECTURE_CHAT_COLLECTION_ID || import.meta.env.NEXT_PUBLIC_APPWRITE_CHAT_COLLECTION_ID;

// Validate required environment variables
if (!DATABASE_ID || !LECTURES_COLLECTION_ID || !PARTICIPANTS_COLLECTION_ID || !CHAT_COLLECTION_ID) {
  console.error('Missing required Appwrite configuration. Please check your environment variables.');
  console.log('Current environment variables:', {
    DATABASE_ID,
    LECTURES_COLLECTION_ID,
    PARTICIPANTS_COLLECTION_ID,
    CHAT_COLLECTION_ID
  });
  throw new Error('Missing required Appwrite configuration. Please check your environment variables.');
}

export interface CreateLiveLectureData {
  title: string;
  description?: string;
  courseId: string;
  teacherId: string;
  teacherName: string;
  startTime: string; // ISO string
  maxParticipants?: number;
}

export interface UpdateLiveLectureData {
  title?: string;
  description?: string;
  startTime?: string; // ISO string
  endTime?: string;   // ISO string
  status?: 'scheduled' | 'live' | 'ended' | 'cancelled';
  meetingUrl?: string;
  recordingUrl?: string;
  participants?: Array<{
    userId: string;
    userName: string;
    joinedAt: string;
  }>;
  participantsCount?: number;
  roomName?: string;
  updatedAt?: string;
}

// Helper function to generate a unique room name for 8x8.vc
export const generate8x8RoomName = (): string => {
  // Generate a random string for the room name
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let roomName = '';
  
  // Generate 10-12 character room name
  const length = 10 + Math.floor(Math.random() * 3); // 10-12 characters
  for (let i = 0; i < length; i++) {
    roomName += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return roomName;
};

export const createLiveLecture = async (lectureData: CreateLiveLectureData): Promise<ILiveLecture> => {
  try {
    // Generate a unique room name for 8x8.vc
    const roomName = generate8x8RoomName();
    console.log('Generated 8x8.vc room name:', roomName);
    
    console.log('Creating new lecture with 8x8.vc room:', roomName);
    
    // Create the lecture document in Appwrite with only the fields that exist in the schema
    const lecture = await databases.createDocument(
      DATABASE_ID,
      LECTURES_COLLECTION_ID,
      ID.unique(),
      {
        // Only include fields that exist in your Appwrite collection schema
        title: lectureData.title,
        description: lectureData.description || '',
        teacherId: lectureData.teacherId,
        teacherName: lectureData.teacherName,
        courseId: lectureData.courseId,
        startTime: lectureData.startTime,
        status: 'scheduled',
        roomName: roomName,
        // Include maxParticipants if provided
        ...(lectureData.maxParticipants && { maxParticipants: lectureData.maxParticipants }),
        // Don't include roomName if it's not in the schema
        // participants: [], // Only include if participants array is in the schema
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      [
        'role:all', // Allow all users to read
        `user:${lectureData.teacherId}` // Allow the teacher to manage
      ]
    ) as unknown as ILiveLecture;
    
    return lecture;
  } catch (error: any) {
    console.error('Error in createLiveLecture:', error);
    throw new Error(error.message || 'Failed to create live lecture');
  }
};

export const getLiveLecture = async (lectureId: string): Promise<ILiveLecture> => {
  try {
    const lecture = await databases.getDocument(
      DATABASE_ID,
      LECTURES_COLLECTION_ID,
      lectureId
    ) as unknown as ILiveLecture;
    
    // Ensure the lecture has a room name for 8x8.vc
    if (!lecture.roomName && lecture.$id && lecture.title) {
      const roomName = `${lecture.$id}-${lecture.title.replace(/\s+/g, '-').toLowerCase()}`;
      
      // Update the lecture with the room name if it doesn't exist
      await databases.updateDocument(
        DATABASE_ID,
        LECTURES_COLLECTION_ID,
        lectureId,
        { roomName }
      );
      
      // Return the updated lecture with the new room name
      return { ...lecture, roomName };
    }
    
    return lecture;
  } catch (error: any) {
    console.error('Error in getLiveLecture:', error);
    throw new Error(error.message || 'Failed to fetch live lecture');
  }
};

export const updateLiveLecture = async (
  lectureId: string,
  data: UpdateLiveLectureData
): Promise<ILiveLecture> => {
  try {
    const updated = await databases.updateDocument(
      DATABASE_ID,
      LECTURES_COLLECTION_ID,
      lectureId,
      {
        ...data,
        updatedAt: new Date().toISOString(),
      }
    ) as unknown as ILiveLecture;
    
    return updated;
  } catch (error: any) {
    console.error('Error in updateLiveLecture:', error);
    throw new Error(error.message || 'Failed to update live lecture');
  }
};

export const deleteLiveLecture = async (lectureId: string): Promise<void> => {
  try {
    await databases.deleteDocument(
      DATABASE_ID,
      LECTURES_COLLECTION_ID,
      lectureId
    );
  } catch (error: any) {
    console.error('Error in deleteLiveLecture:', error);
    throw new Error(error.message || 'Failed to delete live lecture');
  }
};

export const startLiveLecture = async (lectureId: string): Promise<ILiveLecture> => {
  try {
    // Update status to live
    const updated = await updateLiveLecture(lectureId, {
      status: 'live',
      startTime: new Date().toISOString(),
    });
    
    return updated;
  } catch (error: any) {
    console.error('Error in startLiveLecture:', error);
    throw new Error(error.message || 'Failed to start live lecture');
  }
};

export const endLiveLecture = async (lectureId: string, recordingUrl?: string): Promise<ILiveLecture> => {
  try {
    const updated = await updateLiveLecture(lectureId, {
      status: 'ended',
      endTime: new Date().toISOString(),
      recordingUrl,
    });
    
    return updated;
  } catch (error: any) {
    console.error('Error in endLiveLecture:', error);
    throw new Error(error.message || 'Failed to end live lecture');
  }
};

export const addParticipant = async (lectureId: string, userId: string, userName: string): Promise<void> => {
  try {
    await databases.createDocument(
      DATABASE_ID,
      PARTICIPANTS_COLLECTION_ID,
      ID.unique(),
      {
        lectureId,
        userId,
        userName,
        joinedAt: new Date().toISOString(),
      }
    );
    
    // Update participants count in the lecture
    const participants = await databases.listDocuments(
      DATABASE_ID,
      PARTICIPANTS_COLLECTION_ID,
      [Query.equal('lectureId', lectureId)]
    );
    
    // Update the participants array in the lecture
    await updateLiveLecture(lectureId, {
      participants: participants.documents.map((p: any) => ({
        userId: p.userId,
        userName: p.userName,
        joinedAt: p.joinedAt
      }))
    });
  } catch (error: any) {
    console.error('Error in addParticipant:', error);
    throw new Error(error.message || 'Failed to add participant');
  }
};

export const sendChatMessage = async (lectureId: string, userId: string, userName: string, message: string): Promise<void> => {
  try {
    await databases.createDocument(
      DATABASE_ID,
      CHAT_COLLECTION_ID,
      ID.unique(),
      {
        lectureId,
        userId,
        userName,
        message,
        timestamp: new Date().toISOString(),
      }
    );
  } catch (error: any) {
    console.error('Error in sendChatMessage:', error);
    throw new Error(error.message || 'Failed to send chat message');
  }
};

export interface ChatMessage {
  $id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: string;
  lectureId: string;
}

export const getChatMessages = async (lectureId: string): Promise<ChatMessage[]> => {
  try {
    const messages = await databases.listDocuments(
      DATABASE_ID,
      CHAT_COLLECTION_ID,
      [
        Query.equal('lectureId', lectureId),
        Query.orderAsc('timestamp')
      ]
    );
    
    return messages.documents.map(doc => ({
      $id: doc.$id,
      userId: doc.userId,
      userName: doc.userName,
      message: doc.message,
      timestamp: doc.timestamp,
      lectureId: doc.lectureId
    }));
  } catch (error: any) {
    console.error('Error in getChatMessages:', error);
    throw new Error(error.message || 'Failed to fetch chat messages');
  }
};

export const getLiveLectures = async (courseId: string): Promise<ILiveLecture[]> => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      LECTURES_COLLECTION_ID,
      [
        Query.equal('courseId', courseId),
        Query.orderDesc('startTime')
      ]
    );
    
    // Process lectures to ensure they have a room name for 8x8.vc
    const updatedLectures = await Promise.all(
      response.documents.map(async (lecture: any) => {
        // If the lecture doesn't have a room name, generate one
        if (!lecture.roomName && lecture.$id && lecture.title) {
          const roomName = `${lecture.$id}-${lecture.title.replace(/\s+/g, '-').toLowerCase()}`;
          
          try {
            // Update the lecture with the room name
            await databases.updateDocument(
              DATABASE_ID,
              LECTURES_COLLECTION_ID,
              lecture.$id,
              { roomName }
            );
            
            // Return the updated lecture with room name
            return { ...lecture, roomName };
          } catch (error) {
            console.error(`Error updating lecture ${lecture.$id}:`, error);
            return lecture; // Return original if update fails
          }
        }
        return lecture;
      })
    );
    
    return updatedLectures as unknown as ILiveLecture[];
  } catch (error: any) {
    console.error('Error in getLiveLectures:', error);
    throw new Error(error.message || 'Failed to fetch live lectures');
  }
};
