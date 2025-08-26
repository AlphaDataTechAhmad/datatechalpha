import { databases, DATABASE_ID, INTERNSHIPS_COLLECTION_ID } from '../appwriteConfig';
import { ID } from 'appwrite';

interface CreateInternshipData {
  title: string;
  description: string;
  shortDescription: string;
  duration: string;
  level: string;
  slug: string;
  startDate: string;
  endDate: string;
  isActive?: boolean;
  maxStudents?: number;
  price: number;
  currency: string;
  tags?: string[];
  image?: string;
  projects?: any[];
  videos?: any[];
  liveSessions?: any[];
}

export const createInternship = async (internshipData: CreateInternshipData) => {
  try {
    // Add default values
    const data = {
      ...internshipData,
      isActive: internshipData.isActive ?? true,
      currentStudents: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const response = await databases.createDocument(
      DATABASE_ID,
      INTERNSHIPS_COLLECTION_ID,
      ID.unique(),
      data
    );

    return response;
  } catch (error) {
    console.error('Error creating internship:', error);
    throw error;
  }
};

// Function to filter out Appwrite metadata fields
const filterAppwriteMetadata = (data: any) => {
  const metadataFields = ['$id', '$collectionId', '$databaseId', '$createdAt', '$updatedAt', '$permissions'];
  const filtered: any = {};
  
  for (const key in data) {
    if (!metadataFields.includes(key) && !key.startsWith('$')) {
      filtered[key] = data[key];
    }
  }
  
  return filtered;
};

export const updateInternship = async (internshipId: string, updates: Partial<CreateInternshipData>) => {
  try {
    // Filter out any Appwrite metadata fields from updates
    const filteredUpdates = filterAppwriteMetadata(updates);
    
    console.log('Updating internship with data:', filteredUpdates);
    
    const response = await databases.updateDocument(
      DATABASE_ID,
      INTERNSHIPS_COLLECTION_ID,
      internshipId,
      filteredUpdates
    );

    return response;
  } catch (error) {
    console.error('Error updating internship:', error);
    throw error;
  }
};
