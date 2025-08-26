import { Models } from 'appwrite';

export interface ILiveLecture extends Models.Document {
  // Required fields
  title: string;
  courseId: string;
  teacherId: string;
  teacherName: string;
  startTime: string;
  status: 'scheduled' | 'live' | 'ended' | 'cancelled';
  
  // Optional fields
  id?: string; // Made optional since we're using $id from Appwrite
  description?: string;
  endTime?: string;
  meetingUrl?: string;
  roomName?: string; // For Jitsi meeting
  participants?: string[]; // Array of user IDs
  maxParticipants?: number;
  recordingUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const createLiveLecture = (data: Omit<ILiveLecture, keyof Models.Document | 'createdAt' | 'updatedAt' | 'status' | 'participants'>): Omit<ILiveLecture, keyof Models.Document> => {
  return {
    ...data,
    status: 'scheduled',
    participants: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};
