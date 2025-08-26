// This script will update all Jitsi meeting URLs to Google Meet URLs in the database
const { Client, Databases, ID } = require('node-appwrite');

// Initialize the client
const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject('68261b5200198bea6bdf'); // Your project ID

const databases = new Databases(client);

// Configuration
const DATABASE_ID = '68261b6a002ba6c3b584'; // Your database ID
const LECTURES_COLLECTION_ID = '684bc356000b2a6e138f'; // liveLectures collection ID

async function updateAllMeetings() {
  try {
    console.log('Fetching all lectures...');
    
    // Fetch all lectures
    const response = await databases.listDocuments(DATABASE_ID, LECTURES_COLLECTION_ID);
    const lectures = response.documents;
    
    console.log(`Found ${lectures.length} lectures`);
    
    // Filter and update lectures with Jitsi URLs
    const updates = [];
    for (const lecture of lectures) {
      if (lecture.meetingUrl && lecture.meetingUrl.includes('meet.jit.si')) {
        console.log(`\nFound Jitsi URL in lecture: ${lecture.title} (${lecture.$id})`);
        console.log(`Current URL: ${lecture.meetingUrl}`);
        
        // Generate a new Google Meet URL
        const meetId = `${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 6)}`;
        const newUrl = `https://meet.google.com/${meetId}`;
        
        console.log(`Updating to: ${newUrl}`);
        
        // Add to update queue
        updates.push(
          databases.updateDocument(DATABASE_ID, LECTURES_COLLECTION_ID, lecture.$id, {
            meetingUrl: newUrl
          })
          .then(() => {
            console.log(`✅ Successfully updated ${lecture.title}`);
            return { id: lecture.$id, success: true };
          })
          .catch(error => {
            console.error(`❌ Error updating ${lecture.title}:`, error.message);
            return { id: lecture.$id, success: false, error: error.message };
          })
        );
      }
    }
    
    if (updates.length === 0) {
      console.log('\nNo Jitsi URLs found to update!');
      return;
    }
    
    console.log(`\nUpdating ${updates.length} lectures...`);
    const results = await Promise.all(updates);
    
    // Count successful updates
    const successCount = results.filter(r => r.success).length;
    const errorCount = results.length - successCount;
    
    console.log('\nUpdate Summary:');
    console.log(`✅ ${successCount} lectures updated successfully`);
    console.log(`❌ ${errorCount} updates failed`);
    
  } catch (error) {
    console.error('Error in updateAllMeetings:', error);
  }
}

// Run the function
updateAllMeetings();
