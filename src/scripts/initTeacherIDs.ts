import { Client, Databases, ID, Permission, Role, Query } from 'appwrite';
import { DATABASE_ID, TEACHER_IDS_COLLECTION_ID, APPWRITE_ENDPOINT, PROJECT_ID } from '../config';
import { generateTeacherIDs } from '../data/teacherIDs';

// Initialize Appwrite client
const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(PROJECT_ID);

const databases = new Databases(client);

async function initializeTeacherIDs() {
  try {
    console.log('Checking for existing teacher IDs...');
    
    // First, check if there are any existing teacher IDs
    const existing = await databases.listDocuments(
      DATABASE_ID,
      TEACHER_IDS_COLLECTION_ID,
      [
        Query.limit(1)
      ]
    );

    if (existing.total > 0) {
      console.log(`Found ${existing.total} existing teacher IDs in the database.`);
      console.log('Skipping initialization as teacher IDs already exist.');
      return;
    }

    console.log('No teacher IDs found. Initializing...');
    
    // Generate teacher IDs
    const teacherIDs = generateTeacherIDs();
    console.log(`Generated ${teacherIDs.length} teacher IDs.`);

    // Add them to the database in batches to avoid rate limiting
    const batchSize = 10;
    for (let i = 0; i < teacherIDs.length; i += batchSize) {
      const batch = teacherIDs.slice(i, i + batchSize);
      const promises = batch.map(teacherID => 
        databases.createDocument(
          DATABASE_ID,
          TEACHER_IDS_COLLECTION_ID,
          ID.unique(),
          {
            ...teacherID,
            id: teacherID.teacher_id, // Use the teacher ID as the document ID
            userId: 'system', // System user ID for initialization
            $permissions: [
              Permission.read(Role.any()),
              Permission.update(Role.any()),
              Permission.delete(Role.any())
            ]
          }
        ).catch(error => {
          console.error(`Failed to create document for ${teacherID.teacher_id}:`, error.message);
          return null;
        })
      );
      
      console.log(`Adding batch ${i / batchSize + 1} of ${Math.ceil(teacherIDs.length / batchSize)}...`);
      await Promise.all(promises);
    }

    console.log('Successfully initialized teacher IDs in the database.');
    
  } catch (error) {
    console.error('Error initializing teacher IDs:', error);
  }
}

// Run the initialization
initializeTeacherIDs()
  .then(() => {
    console.log('Initialization process completed.');
    process.exit(0);
  })
  .catch(error => {
    console.error('Failed to initialize teacher IDs:', error);
    process.exit(1);
  });
