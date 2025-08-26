import { databases } from '../src/Services/appwrite';
import { ID } from 'appwrite';

// Configuration
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID || import.meta.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const LECTURES_COLLECTION_ID = import.meta.env.VITE_APPWRITE_LIVE_LECTURES_COLLECTION_ID || import.meta.env.NEXT_PUBLIC_APPWRITE_LECTURES_COLLECTION_ID;

async function updateAllMeetingUrls() {
  try {
    // Fetch all lectures
    const response = await databases.listDocuments(DATABASE_ID, LECTURES_COLLECTION_ID);
    const lectures = response.documents;

    console.log(`Found ${lectures.length} lectures to update`);

    // Update each lecture
    for (const lecture of lectures) {
      try {
        // Skip if already a Google Meet URL
        if (lecture.meetingUrl?.includes('meet.google.com')) {
          console.log(`Skipping already updated lecture: ${lecture.$id}`);
          continue;
        }

        // Generate new Google Meet URL
        const meetId = `meet-${ID.unique().substring(0, 8)}`;
        const meetingUrl = `https://meet.google.com/${meetId}`;

        // Update the lecture
        console.log(`Updating lecture ${lecture.$id} with new URL: ${meetingUrl}`);
        
        await databases.updateDocument(
          DATABASE_ID,
          LECTURES_COLLECTION_ID,
          lecture.$id,
          {
            meetingUrl: meetingUrl,
            updatedAt: new Date().toISOString()
          }
        );

        console.log(`Successfully updated lecture: ${lecture.$id}`);
      } catch (error) {
        console.error(`Error updating lecture ${lecture.$id}:`, error);
      }
    }

    console.log('All lectures have been updated successfully!');
  } catch (error) {
    console.error('Error fetching lectures:', error);
  }
}

// Run the update
updateAllMeetingUrls();
