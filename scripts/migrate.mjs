import { Client, Databases, ID } from 'appwrite';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import dotenv from 'dotenv';

// Configure environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../.env') });

// Initialize the Appwrite client
const client = new Client()
  .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
  .setProject(process.env.VITE_APPWRITE_PROJECT_ID || '68261b5200198bea6bdf');

const databases = new Databases(client);

// Collection ID for tests
const TESTS_COLLECTION_ID = process.env.APPWRITE_TESTS_COLLECTION_ID || '686520c7001bd5bb53b3';
const DATABASE_ID = process.env.VITE_APPWRITE_DATABASE_ID || '68261b6a002ba6c3b584';

// Read and parse the test data
async function getTestData() {
  const testDataPath = resolve(__dirname, '../src/pages/Tests.tsx');
  const testDataContent = await readFile(testDataPath, 'utf8');
  
  // Extract the courseTests array using a more robust regex
  const courseTestsMatch = testDataContent.match(/export const courseTests: CourseTest\[\] = (\[[\s\S]*?\]);/);
  if (!courseTestsMatch) {
    throw new Error('Could not find courseTests in Tests.tsx');
  }

  let arrayContent = courseTestsMatch[1];
  
  // Clean up the content
  arrayContent = arrayContent
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
    .replace(/\/\/.*$/gm, '') // Remove line comments
    .replace(/\r?\n/g, ' ') // Normalize newlines
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/([{,])(\s*)([A-Za-z0-9_]+?)\s*:/g, '$1"$3":') // Add quotes to keys
    .replace(/'/g, '"') // Replace single quotes with double quotes
    .replace(/,\s*([}\]])/g, '$1') // Remove trailing commas
    .replace(/\b(true|false|null)\b/g, '"$1"') // Quote booleans and null
    .replace(/\s*:\s*/g, ':') // Remove spaces around colons
    .replace(/\s*,\s*/g, ',') // Remove spaces around commas
    .replace(/\s*\[\s*/g, '[') // Remove spaces after [
    .replace(/\s*\]\s*/g, ']') // Remove spaces before ]
    .replace(/\s*\{\s*/g, '{') // Remove spaces after {
    .replace(/\s*\}\s*/g, '}'); // Remove spaces before }

  // Handle any remaining unquoted values
  arrayContent = arrayContent.replace(/:\s*([^\[\]{}:,\s][^\[\]{}:,]*?)([,\}])/g, ':"$1"$2');
  
  try {
    return JSON.parse(arrayContent);
  } catch (e) {
    console.error('Error parsing test data:', e);
    console.log('Problematic JSON:', arrayContent.substring(190, 200)); // Show area around the error
    throw e;
  }
}

// Function to migrate tests
async function migrateTests() {
  console.log('Starting test migration...');
  
  try {
    const tests = await getTestData();
    console.log(`Found ${tests.length} tests to migrate`);
    
    for (const test of tests) {
      console.log(`Migrating test: ${test.title}`);
      
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
        createdBy: 'system',
        updatedAt: new Date().toISOString(),
      };

      try {
        await databases.createDocument(
          DATABASE_ID,
          TESTS_COLLECTION_ID,
          ID.unique(),
          testData
        );
        console.log(`✓ Successfully migrated: ${test.title}`);
      } catch (error) {
        console.error(`Error migrating test ${test.title}:`, error.message);
      }
      
      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('Migration completed!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
migrateTests();
