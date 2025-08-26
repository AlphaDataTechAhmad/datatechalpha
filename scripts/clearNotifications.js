import { Client, Databases, Query } from 'node-appwrite';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

const DATABASE_ID = process.env.VITE_APPWRITE_DATABASE_ID || '68261b6a002ba6c3b584';
const NOTIFICATIONS_COLLECTION_ID = process.env.VITE_APPWRITE_NOTIFICATIONS_COLLECTION_ID || '6853e351000f87a36c80';

async function clearAllNotifications() {
  try {
    console.log('Fetching all notifications...');
    
    // Get all notifications
    const response = await databases.listDocuments(DATABASE_ID, NOTIFICATIONS_COLLECTION_ID, [
      Query.limit(100)
    ]);
    
    const notifications = response.documents;
    console.log(`Found ${notifications.length} notifications to delete`);
    
    // Delete each notification
    for (const notification of notifications) {
      console.log(`Deleting notification: ${notification.$id} - ${notification.title}`);
      await databases.deleteDocument(DATABASE_ID, NOTIFICATIONS_COLLECTION_ID, notification.$id);
    }
    
    console.log('Successfully deleted all notifications');
  } catch (error) {
    console.error('Error clearing notifications:', error);
    throw error;
  }
}

clearAllNotifications()
  .then(() => console.log('Cleanup complete'))
  .catch(console.error);
