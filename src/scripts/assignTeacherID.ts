import { Client, Databases, Query } from 'appwrite';
import { DATABASE_ID, TEACHER_IDS_COLLECTION_ID, APPWRITE_ENDPOINT, PROJECT_ID, PROFILE_COLLECTION_ID } from '../config';

// Initialize Appwrite client
const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(PROJECT_ID);

const databases = new Databases(client);

// The user ID that needs a teacher ID (replace with actual user ID)
const USER_ID = '684effc7000ee67a76a3';
// The teacher ID document ID from the previous step
const TEACHER_DOC_ID = '684eff4f0005fb8259dd';
// The actual teacher ID (for reference)
const TEACHER_ID = 'TECH10060590';

async function assignTeacherID() {
  try {
    console.log(`Assigning teacher ID ${TEACHER_ID} to user ${USER_ID}...`);
    
    // 1. Update the teacher ID document to mark it as claimed by the user
    await databases.updateDocument(
      DATABASE_ID,
      TEACHER_IDS_COLLECTION_ID,
      TEACHER_DOC_ID,
      {
        is_used: true,
        claimed_by: USER_ID
      }
    );

    console.log('Successfully updated teacher ID document');

    // 2. Update the user's profile with the teacher ID
    try {
      // First, try to get the user's profile
      const profileResponse = await databases.listDocuments(
        DATABASE_ID,
        PROFILE_COLLECTION_ID,
        [Query.equal('accountId', USER_ID)]
      );

      if (profileResponse.documents.length > 0) {
        // Update existing profile
        const profile = profileResponse.documents[0];
        await databases.updateDocument(
          DATABASE_ID,
          PROFILE_COLLECTION_ID,
          profile.$id,
          {
            teacher_id: TEACHER_ID,
            role: 'teacher' // Ensure the role is set to teacher
          }
        );
        console.log('Updated existing profile with teacher ID');
      } else {
        // Create new profile if it doesn't exist
        await databases.createDocument(
          DATABASE_ID,
          PROFILE_COLLECTION_ID,
          USER_ID,
          {
            accountId: USER_ID,
            teacher_id: TEACHER_ID,
            role: 'teacher'
          }
        );
        console.log('Created new profile with teacher ID');
      }

      console.log('Successfully assigned teacher ID to user profile');
      console.log('\nDone! The teacher ID has been assigned to the user.');
      console.log(`Teacher ID: ${TEACHER_ID}`);
      console.log(`User ID: ${USER_ID}`);
      
    } catch (profileError) {
      console.error('Error updating user profile:', profileError);
      throw profileError;
    }
    
  } catch (error) {
    console.error('Error assigning teacher ID:', error);
    throw error;
  }
}

// Run the function
assignTeacherID()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });
