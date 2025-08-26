import { databases } from '../src/Services/appwrite';

// Configuration
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID || import.meta.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const LECTURES_COLLECTION_ID = import.meta.env.VITE_APPWRITE_LIVE_LECTURES_COLLECTION_ID || import.meta.env.NEXT_PUBLIC_APPWRITE_LECTURES_COLLECTION_ID;

async function listAllLectures() {
  try {
    const response = await databases.listDocuments(DATABASE_ID, LECTURES_COLLECTION_ID);
    const lectures = response.documents;

    console.log(`Found ${lectures.length} lectures:`);
    lectures.forEach(lecture => {
      console.log(`- ${lecture.title} (${lecture.$id}): ${lecture.meetingUrl || 'No URL'}`);
    });
  } catch (error) {
    console.error('Error fetching lectures:', error);
  }
}

// Run the script
listAllLectures();
