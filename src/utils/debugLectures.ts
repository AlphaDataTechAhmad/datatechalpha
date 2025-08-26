import { databases } from '../Services/appwrite';

// Configuration
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID || import.meta.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const LECTURES_COLLECTION_ID = import.meta.env.VITE_APPWRITE_LIVE_LECTURES_COLLECTION_ID || import.meta.env.NEXT_PUBLIC_APPWRITE_LECTURES_COLLECTION_ID;

export async function debugLectures() {
  try {
    console.log('Fetching all lectures...');
    const response = await databases.listDocuments(DATABASE_ID, LECTURES_COLLECTION_ID);
    
    console.log('Found lectures:');
    response.documents.forEach((lecture: any) => {
      console.log(`\n--- Lecture: ${lecture.title} (${lecture.$id}) ---`);
      console.log('Meeting URL:', lecture.meetingUrl);
      console.log('Status:', lecture.status);
      console.log('Created At:', lecture.$createdAt);
      console.log('Updated At:', lecture.$updatedAt);
      
      // Check if URL is Jitsi
      if (lecture.meetingUrl?.includes('meet.jit.si')) {
        console.warn('⚠️ This lecture is still using Jitsi!');
      }
    });
    
    return response.documents;
  } catch (error) {
    console.error('Error debugging lectures:', error);
    throw error;
  }
}

// Export the debug function for use in components
export default debugLectures;
