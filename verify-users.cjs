const { Client, Databases } = require('node-appwrite');
require('dotenv').config();
const readline = require('readline');

// Configuration
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

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function verifyAllUsers() {
  try {
    console.log('🚀 Starting user verification process...');
    console.log(`🔍 Connecting to Appwrite at: ${config.endpoint}`);
    
    // Get all unverified users
    console.log('🔍 Fetching unverified users...');
    // Get all users with pagination
    let allUsers = [];
    let totalUsers = 0;
    let totalUnverified = 0;
    let lastId = '';
    const limit = 100; // Max allowed by Appwrite
    
    console.log('Fetching all users (this might take a moment)...');
    
    // Fetch users in batches with pagination
    let offset = 0;
    while (true) {
      try {
        const response = await databases.listDocuments(
          config.databaseId,
          config.collectionId,
          [
            ['limit', limit],
            ['offset', offset]
          ]
        );
        
        if (response.documents.length === 0) break;
        
        allUsers = [...allUsers, ...response.documents];
        totalUsers = response.total;
        offset += response.documents.length;
        
        // Show progress
        console.log(`Fetched ${allUsers.length} of ${totalUsers} users...`);
        
        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
        
        if (response.documents.length < limit) break;
      } catch (error) {
        console.error('Error fetching users:', error.message);
        break;
      }
    }
    
    // Check verification status of all users
    const verificationStatus = allUsers.reduce((acc, user) => {
      if (user.isVerified === true) acc.verified++;
      else if (user.isVerified === false) acc.unverified++;
      else acc.unknown++;
      return acc;
    }, { verified: 0, unverified: 0, unknown: 0 });
    
    console.log('\n🔍 Verification Status Analysis:');
    console.log(`👥 Total users: ${totalUsers}`);
    console.log(`✅ Verified (true): ${verificationStatus.verified}`);
    console.log(`❌ Unverified (false): ${verificationStatus.unverified}`);
    console.log(`❓ Unknown/Not Set: ${verificationStatus.unknown}`);
    
    // Show sample of users with different verification statuses
    console.log('\n📝 Sample Users:');
    const samples = [
      ...allUsers.filter(u => u.isVerified === true).slice(0, 2),
      ...allUsers.filter(u => u.isVerified === false).slice(0, 2),
      ...allUsers.filter(u => u.isVerified === undefined || u.isVerified === null).slice(0, 2)
    ];
    
    samples.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.email || 'No email'} (${user.$id}): isVerified = ${JSON.stringify(user.isVerified)}`);
    });
    
    const unverifiedUsers = allUsers.filter(user => user.isVerified !== true);
    console.log(`✅ Found ${unverifiedUsers.length} unverified users`);

    if (unverifiedUsers.length === 0) {
      console.log('ℹ️  No users need verification.');
      return;
    }

    // Show first few users as preview
    console.log('\nFirst few users to be verified:');
    users.slice(0, 3).forEach((user, index) => {
      console.log(`${index + 1}. ${user.email || 'No email'} (${user.$id})`);
    });
    if (users.length > 3) {
      console.log(`... and ${users.length - 3} more`);
    }

    // Ask for confirmation
    const answer = await askQuestion(`\n⚠️  Verify ${users.length} users? (y/n): `);
    
    if (answer.toLowerCase() !== 'y') {
      console.log('❌ Operation cancelled');
      return;
    }

    // Update users
    let successCount = 0;
    const errors = [];

    for (const user of users) {
      try {
        await databases.updateDocument(
          config.databaseId,
          config.collectionId,
          user.$id,
          { isVerified: true }
        );
        console.log(`✅ Verified: ${user.email || user.$id}`);
        successCount++;
      } catch (error) {
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

  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    if (error.response) {
      console.error('Response:', error.response);
    }
  } finally {
    rl.close();
  }
}

// Run the script
verifyAllUsers();
