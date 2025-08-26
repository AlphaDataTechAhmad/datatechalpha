const { Client, Databases, ID, Permission, Role } = require('appwrite');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Import the test data directly
const testData = require('../src/pages/Tests');
const { courseTests } = testData;

// Initialize the Appwrite client
const client = new Client()
  .setEndpoint('https://cloud.appwrite.io/v1')
  .setProject('68261b5200198bea6bdf');

// Initialize the database service
const databases = new Databases(client);

// Collection ID for tests
const TESTS_COLLECTION_ID = '686520c7001bd5bb53b3';

// Function to migrate tests
async function migrateTests() {
  try {
    console.log('Starting test migration...');
    
    // Process each test in the courseTests array
    for (const test of courseTests) {
      console.log(`Migrating test: ${test.title}`);
      
      // Prepare the test data for Appwrite
      const testData = {
        title: test.title,
        description: test.description,
        courseId: test.courseId,
        duration: test.duration,
        passingScore: test.passingScore,
        negativeMarking: test.negativeMarking || 0,
        instructions: JSON.stringify(test.instructions || []),
        questions: JSON.stringify(test.questions || []),
        sections: test.sections ? JSON.stringify(test.sections) : '[]',
        createdBy: 'system', // or the admin user ID
        updatedAt: new Date().toISOString(),
      };

      try {
        // Create the test document in Appwrite
        const result = await databases.createDocument(
          '68261b6a002ba6c3b584', // Your database ID
          TESTS_COLLECTION_ID,
          ID.unique(),
          testData,
          [
            Permission.read(Role.any()), // Adjust permissions as needed
            Permission.update(Role.any()),
            Permission.delete(Role.any()),
          ]
        );
        
        console.log(`Successfully migrated test: ${test.title} (ID: ${result.$id})`);
      } catch (error) {
        console.error(`Error migrating test ${test.title}:`, error);
      }
      
      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('Test migration completed!');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

// Run the migration
migrateTests();
