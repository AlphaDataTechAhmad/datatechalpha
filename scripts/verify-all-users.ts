import { Client, Databases, Models } from 'node-appwrite';
import dotenv from 'dotenv';

dotenv.config();

// Configuration - Update these values in your .env file
const config = {
  endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1',
  projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '68261b5200198bea6bdf',
  apiKey: process.env.APPWRITE_API_KEY,
  databaseId: process.env.APPWRITE_DATABASE_ID || '68261b6a002ba6c3b584',
  collectionId: '68261bb5000a54d8652b' // Profile collection
};

// Validate configuration
if (!config.apiKey) {
  console.error('❌ Error: APPWRITE_API_KEY is not set in .env file');
  process.exit(1);
}

// Initialize the client
const client = new Client()
  .setEndpoint(config.endpoint)
  .setProject(config.projectId)
  .setKey(config.apiKey);

const databases = new Databases(client);

async function verifyAllUsers() {
  try {
    console.log('🚀 Starting user verification process...');
    console.log(`🔍 Connecting to Appwrite at: ${config.endpoint}`);
    console.log(`📊 Database: ${config.databaseId}, Collection: ${config.collectionId}`);
    
    // Get all documents
    console.log('🔍 Fetching users...');
    const response = await databases.listDocuments<{
      $id: string;
      email?: string;
      isVerified?: boolean;
    }>(
      config.databaseId,
      config.collectionId,
      ['isVerified!=true'] // Only fetch unverified users
    );

    const users = response.documents;
    console.log(`✅ Found ${users.length} users to verify`);

    if (users.length === 0) {
      console.log('ℹ️  No users need verification.');
      return;
    }

    // Confirm before proceeding
    console.log(`\n⚠️  About to verify ${users.length} users. Continue? (y/n)`);
    
    // Wait for user input
    process.stdin.setRawMode(true);
    process.stdin.resume();
    
    process.stdin.once('data', async (data) => {
      const answer = data.toString().trim().toLowerCase();
      
      if (answer !== 'y') {
        console.log('❌ Operation cancelled by user');
        process.exit(0);
      }

      // Update each user
      let successCount = 0;
      const errors: string[] = [];

      for (const user of users) {
        try {
          await databases.updateDocument(
            config.databaseId,
            config.collectionId,
            user.$id,
            { isVerified: true }
          );
          console.log(`✅ Verified user: ${user.$id} (${user.email || 'no email'})`);
          successCount++;
        } catch (error: any) {
          const errorMsg = `❌ Error updating ${user.$id}: ${error.message}`;
          console.error(errorMsg);
          errors.push(errorMsg);
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Print summary
      console.log('\n📊 Verification Summary:');
      console.log(`✅ Successfully verified: ${successCount} users`);
      
      if (errors.length > 0) {
        console.log(`❌ Failed to verify: ${errors.length} users`);
        console.log('\nError details:');
        errors.forEach((error, index) => {
          console.log(`${index + 1}. ${error}`);
        });
      }

      process.exit(0);
    });

  } catch (error: any) {
    console.error('\n❌ Fatal error:', error.message);
    if (error.response) {
      console.error('Response:', error.response);
    }
    process.exit(1);
  }
}

// Run the script
verifyAllUsers();
