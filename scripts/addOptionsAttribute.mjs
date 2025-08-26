import { Client, Databases } from 'appwrite';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Configure environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../.env') });

// Initialize the Appwrite client
const client = new Client()
  .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
  .setProject(process.env.VITE_APPWRITE_PROJECT_ID || '68261b5200198bea6bdf')
  .setKey(process.env.VITE_APPWRITE_API_KEY || '');

const databases = new Databases(client);

// Collection and database IDs
const DATABASE_ID = process.env.VITE_APPWRITE_DATABASE_ID || '68261b6a002ba6c3b584';
const TESTS_COLLECTION_ID = process.env.APPWRITE_TESTS_COLLECTION_ID || '686520c7001bd5bb53b3';

async function addOptionsAttribute() {
  try {
    console.log('Adding options attribute to tests collection...');
    
    // Add options attribute as a string type
    await databases.createStringAttribute(
      DATABASE_ID,
      TESTS_COLLECTION_ID,
      'options',
      2000, // max length
      false, // not required
      '', // default value
      false // not array
    );
    
    console.log('Successfully added options attribute to tests collection');
  } catch (error) {
    if (error.code === 409) {
      console.log('Options attribute already exists in the collection');
    } else {
      console.error('Error adding options attribute:', error.message);
    }
  }
}

// Run the function
addOptionsAttribute();
