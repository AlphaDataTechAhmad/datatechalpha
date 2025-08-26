import { Client, Databases, Query } from 'node-appwrite';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// Configure dotenv to load .env file from project root
const envPath = path.resolve(process.cwd(), '.env');
console.log('Loading .env from:', envPath);

const envConfig = dotenv.config({ path: envPath });
if (envConfig.error) {
    console.error('Error loading .env file:', envConfig.error);
    process.exit(1);
}

// Initialize the client SDK with server-side environment variables
const APPWRITE_ENDPOINT = process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = process.env.APPWRITE_PROJECT_ID;
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY;
const DATABASE_ID = process.env.VITE_APPWRITE_DATABASE_ID;

console.log('Using Appwrite configuration:', {
    endpoint: APPWRITE_ENDPOINT,
    projectId: APPWRITE_PROJECT_ID ? '***' : 'MISSING',
    apiKey: APPWRITE_API_KEY ? '***' : 'MISSING',
    databaseId: DATABASE_ID || 'MISSING'
});

if (!APPWRITE_ENDPOINT || !APPWRITE_PROJECT_ID || !APPWRITE_API_KEY) {
    throw new Error('Missing required Appwrite configuration in .env file');
}

const client = new Client()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID)
    .setKey(APPWRITE_API_KEY);

const databases = new Databases(client);

// Collection IDs
const PROFILES_COLLECTION = 'users'; // Adjust if your profiles collection has a different ID
const TEST_LINKS_COLLECTION = '689923bc000f2d15a263'; // internship_test_links collection ID

async function updateTestLinkUserIds() {
    try {
        console.log('Starting to update test link user IDs...');
        console.log('Using database:', DATABASE_ID);
        console.log('Using test links collection:', TEST_LINKS_COLLECTION);

        // First, get all test link documents
        const testLinksResponse = await databases.listDocuments(
            DATABASE_ID,
            TEST_LINKS_COLLECTION,
            [
                Query.limit(10000) // Adjust based on your needs
            ]
        );

        console.log(`Found ${testLinksResponse.documents.length} test link documents to process`);

        let updatedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;

        // Process each test link document
        for (const testLink of testLinksResponse.documents) {
            try {
                // Skip if userId is already in the correct format (24 chars, alphanumeric)
                if (/^[a-z0-9]{24}$/.test(testLink.userId)) {
                    console.log(`Skipping document ${testLink.$id} - userId is already in correct format`);
                    skippedCount++;
                    continue;
                }

                if (!testLink.email) {
                    console.log(`Skipping document ${testLink.$id} - no email found`);
                    errorCount++;
                    continue;
                }

                console.log(`Processing document ${testLink.$id} for email: ${testLink.email}`);

                // Find the user's profile by email
                const profilesResponse = await databases.listDocuments(
                    DATABASE_ID,
                    PROFILES_COLLECTION,
                    [
                        Query.equal('email', testLink.email),
                        Query.limit(1)
                    ]
                );

                if (profilesResponse.documents.length === 0) {
                    console.log(`No profile found for email: ${testLink.email}`);
                    errorCount++;
                    continue;
                }

                const profile = profilesResponse.documents[0];
                const profileId = profile.$id;

                // Update the test link document with the profile ID
                await databases.updateDocument(
                    DATABASE_ID,
                    TEST_LINKS_COLLECTION,
                    testLink.$id,
                    {
                        userId: profileId
                    }
                );

                console.log(`✅ Updated test link ${testLink.$id}: ${testLink.userId} -> ${profileId}`);
                updatedCount++;

                // Add a small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 100));

            } catch (error) {
                console.error(`❌ Error processing document ${testLink.$id}:`, error.message);
                errorCount++;
            }
        }

        console.log('\nUpdate completed!');
        console.log(`Total documents processed: ${testLinksResponse.documents.length}`);
        console.log(`Successfully updated: ${updatedCount}`);
        console.log(`Skipped (already correct): ${skippedCount}`);
        console.log(`Errors: ${errorCount}`);

    } catch (error) {
        console.error('Error in updateTestLinkUserIds:', error);
    }
}

// Run the script
updateTestLinkUserIds().catch(console.error);
