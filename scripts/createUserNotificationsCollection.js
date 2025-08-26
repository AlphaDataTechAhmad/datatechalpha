import { Client, Databases, ID } from 'node-appwrite';
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

async function createUserNotificationsCollection() {
  console.log('Starting to set up user notifications collection...');
  try {
    const databaseId = process.env.VITE_APPWRITE_DATABASE_ID || '68261b6a002ba6c3b584';
    const collectionId = process.env.VITE_APPWRITE_USER_NOTIFICATIONS_COLLECTION || 'user_notifications';
    
    console.log(`Using database: ${databaseId}, collection: ${collectionId}`);

    // Check if collection exists
    try {
      const collection = await databases.getCollection(databaseId, collectionId);
      console.log('User notifications collection already exists:', collection.$id);
      return;
    } catch (error) {
      // Collection doesn't exist, create it
      console.log('Creating user notifications collection...');
    }

    // Create the collection
    const collection = await databases.createCollection(
      databaseId,
      collectionId,
      'User Notifications',
      [
        { label: 'User ID', key: 'userId', type: 'string', required: true, array: false },
        { label: 'Notification ID', key: 'notificationId', type: 'string', required: true, array: false },
        { label: 'Is Read', key: 'isRead', type: 'boolean', required: true, array: false, default: false },
        { label: 'Read At', key: 'readAt', type: 'datetime', required: false, array: false },
      ]
    );

    console.log('Created user notifications collection:', collection.$id);

    // Create indexes for better querying
    await databases.createIndex(
      databaseId,
      collectionId,
      'idx_user_notifications',
      'key',
      ['userId', 'isRead', 'readAt'],
      []
    );

    console.log('Added indexes to user notifications collection');

  } catch (error) {
    console.error('Error setting up user notifications collection:');
    if (error.response) {
      console.error('Appwrite API Error:', {
        code: error.code || 'N/A',
        message: error.message,
        type: error.type || 'N/A',
        response: error.response || 'N/A'
      });
    } else {
      console.error(error);
    }
    process.exit(1);
  }
}

createUserNotificationsCollection();
