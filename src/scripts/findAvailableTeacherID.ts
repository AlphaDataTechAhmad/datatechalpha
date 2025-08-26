import { Client, Databases, Query } from 'appwrite';
import { DATABASE_ID, TEACHER_IDS_COLLECTION_ID, APPWRITE_ENDPOINT, PROJECT_ID } from '../config';

// Initialize Appwrite client
const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(PROJECT_ID);

const databases = new Databases(client);

async function findAvailableTeacherID() {
  try {
    // Find an unused teacher ID
    const response = await databases.listDocuments(
      DATABASE_ID,
      TEACHER_IDS_COLLECTION_ID,
      [
        Query.equal('is_used', false),
        Query.limit(1)
      ]
    );

    if (response.documents.length > 0) {
      const teacherID = response.documents[0];
      console.log('Available Teacher ID:', teacherID.teacher_id);
      console.log('Document ID:', teacherID.$id);
      return teacherID;
    } else {
      console.log('No available teacher IDs found');
      return null;
    }
  } catch (error) {
    console.error('Error finding available teacher ID:', error);
    return null;
  }
}

// Run the function
findAvailableTeacherID()
  .then(() => {
    console.log('Done');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
