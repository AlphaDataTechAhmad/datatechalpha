import { Client, Databases, Query } from 'appwrite';
import { DATABASE_ID, TEACHER_IDS_COLLECTION_ID, APPWRITE_ENDPOINT, PROJECT_ID } from '../config';

// Initialize Appwrite client
const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(PROJECT_ID);

const databases = new Databases(client);

async function listTeacherIDs() {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      TEACHER_IDS_COLLECTION_ID,
      [
        Query.limit(100) // Adjust based on number of teacher IDs
      ]
    );

    console.log('=== Teacher IDs in Database ===');
    response.documents.forEach(doc => {
      console.log(`ID: ${doc.teacher_id}, Used: ${doc.is_used}, Claimed by: ${doc.claimed_by || 'N/A'}`);
    });
    
    const usedCount = response.documents.filter(doc => doc.is_used).length;
    const totalCount = response.documents.length;
    
    console.log(`\nTotal: ${totalCount} IDs (${usedCount} used, ${totalCount - usedCount} available)`);
    
  } catch (error) {
    console.error('Error listing teacher IDs:', error);
  }
}

listTeacherIDs();
