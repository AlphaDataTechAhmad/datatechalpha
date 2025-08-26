import { Client, Databases, ID } from 'node-appwrite';

// Load environment variables from .env file
import dotenv from 'dotenv';
dotenv.config();

if (!process.env.APPWRITE_ENDPOINT || !process.env.APPWRITE_PROJECT_ID || !process.env.APPWRITE_API_KEY) {
  console.error('Error: Missing required environment variables. Please create a .env file with:');
  console.error('APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1');
  console.error('APPWRITE_PROJECT_ID=your_project_id');
  console.error('APPWRITE_API_KEY=your_api_key');
  process.exit(1);
}

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

// Main function to create the notifications collection
async function createNotificationsCollection() {
  console.log('Starting to set up notifications collection...');
  try {
    // Get database and collection IDs from environment variables
    const databaseId = process.env.VITE_APPWRITE_DATABASE_ID || '68261b6a002ba6c3b584';
    const collectionId = process.env.VITE_APPWRITE_NOTIFICATIONS_COLLECTION_ID || '6853e351000f87a36c80';
    
    console.log(`Using database: ${databaseId}, collection: ${collectionId}`);

    // Check if collection exists
    let collection;
    try {
      collection = await databases.getCollection(databaseId, collectionId);
      console.log('Notifications collection already exists:', collection.$id);
    } catch (error) {
      try {
        // Collection doesn't exist, create it
        collection = await databases.createCollection(
          databaseId,
          collectionId,
          'Notifications'
        );
        console.log('Created notifications collection:', collection.$id);

        // Add attributes
        await databases.createStringAttribute(databaseId, collectionId, 'title', 100, true);
        await databases.createStringAttribute(databaseId, collectionId, 'message', 500, true);
        await databases.createEnumAttribute(databaseId, collectionId, 'recipientType', ['all', 'student', 'teacher'], true);
        await databases.createStringAttribute(databaseId, collectionId, 'recipientId', 36, false);
        await databases.createBooleanAttribute(databaseId, collectionId, 'isRead', false);
        await databases.createStringAttribute(databaseId, collectionId, 'senderId', 36, true);
        await databases.createStringAttribute(databaseId, collectionId, 'senderName', 100, false);
        await databases.createStringAttribute(databaseId, collectionId, 'type', 50, false);
        await databases.createDatetimeAttribute(databaseId, collectionId, 'createdAt', true);
        
        console.log('Added attributes to notifications collection');

        // Add index for better querying
        await databases.createIndex(
          databaseId,
          collectionId,
          'idx_recipient',
          'key',
          ['recipientType', 'recipientId', 'read'],
          []
        );
        
        console.log('Added index to notifications collection');
      } catch (createError) {
        console.error('Error creating collection or attributes:', createError);
        throw createError; // Re-throw to be caught by the outer try-catch
      }
    }

    console.log('Notifications collection is ready');
  } catch (error) {
    if (error.response) {
      console.error('Appwrite API Error:', {
        code: error.code || 'N/A',
        message: error.message,
        type: error.type || 'N/A',
        response: error.response || 'N/A'
      });
    } else {
      console.error('Error setting up notifications:', error);
    }
    process.exit(1);
  }
}

createNotificationsCollection();
