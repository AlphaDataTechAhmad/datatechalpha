import { databases, Query } from './appwrite';
import { DATABASE_ID, PROFILE_COLLECTION_ID } from './appwrite';

export interface UserProfile {
  $id: string;
  name: string;
  email: string;
  avatar?: string;
  role?: string;
}

export interface TeacherProfile extends UserProfile {
  userId: string;
  role: 'teacher' | 'admin' | 'student';
  phone?: string;
  bio?: string;
  subjects?: string[];
  experience?: number;
  qualification?: string;
  isVerified?: boolean;
}

// Helper function to transform raw document results to TeacherProfile format
function transformTeacherResults(documents: any[]): TeacherProfile[] {
  return documents.map(doc => ({
    $id: doc.$id,
    userId: doc.userId || doc.$id,
    name: doc.name || 'Teacher',
    email: doc.email,
    avatar: doc.avatar,
    role: doc.role || 'teacher',
    phone: doc.phone || '',
    bio: doc.bio || '',
    // These fields might not exist in the document
    subjects: doc.subjects || [],
    experience: doc.experience || 0,
    qualification: doc.qualification || '',
    isVerified: doc.isVerified || false
  }));
}

export const searchTeachers = async (query: string): Promise<TeacherProfile[]> => {
  try {
    console.log('Searching for teachers with query:', query);
    
    // Search for teachers with name or email starting with the query
    const results = await databases.listDocuments(
      DATABASE_ID,
      PROFILE_COLLECTION_ID,
      [
        Query.limit(10),
        Query.equal('role', 'teacher'),
        Query.or([
          Query.startsWith('name', query),
          Query.startsWith('email', query)
        ])
      ]
    );
    
    return transformTeacherResults(results.documents);
  } catch (error) {
    console.error('Error searching users:', error);
    throw error;
  }
};
