import { Client, Databases, Query } from 'node-appwrite';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// Load environment variables from .env file in project root
const envPath = path.resolve(process.cwd(), '.env');
console.log('Loading .env from:', envPath);

const envConfig = dotenv.config({ path: envPath });
if (envConfig.error) {
    console.error('Error loading .env file:', envConfig.error);
    process.exit(1);
}

// Debug: Log available environment variables
console.log('Environment variables loaded successfully');
console.log('Available variables:', Object.keys(process.env).filter(key => key.startsWith('APPWRITE_') || key.startsWith('VITE_')));

// Initialize the client SDK with hardcoded values from .env
const APPWRITE_ENDPOINT = 'https://cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = '68261b5200198bea6bdf';
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY;

if (!APPWRITE_API_KEY) {
    console.error('Error: APPWRITE_API_KEY is not set in .env file');
    process.exit(1);
}
const DATABASE_ID = '68261b6a002ba6c3b584'; // Hardcoded database ID
const TEST_LINKS_COLLECTION = '689923bc000f2d15a263'; // internship_test_links collection ID
const PROFILES_COLLECTION = '68261bb5000a54d8652b';

console.log('Initializing Appwrite client...');

const client = new Client()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID)
    .setKey(APPWRITE_API_KEY);

const databases = new Databases(client);

async function fixTestLinkUserIds() {
    try {
        console.log('Starting to fix test link user IDs...');
        
        // Get all test link documents
        const testLinks = await databases.listDocuments(
            DATABASE_ID,
            TEST_LINKS_COLLECTION,
            [
                Query.limit(10000) // Adjust based on your needs
            ]
        );

        console.log(`Found ${testLinks.documents.length} test link documents`);

        let fixedCount = 0;
        let errorCount = 0;
        let skippedCount = 0;

        for (const testLink of testLinks.documents) {
            try {
                const userId = testLink.userId;
                
                // Skip if userId is already a profile ID (24 chars, alphanumeric)
                if (/^[a-z0-9]{24}$/.test(userId)) {
                    console.log(`Skipping document ${testLink.$id} - already using profile ID`);
                    skippedCount++;
                    continue;
                }

                // Find the user's profile by account ID
                const profiles = await databases.listDocuments(
                    DATABASE_ID,
                    PROFILES_COLLECTION,
                    [
                        Query.equal('accountId', userId),
                        Query.limit(1)
                    ]
                );

                if (profiles.documents.length === 0) {
                    console.log(`No profile found for account ID: ${userId}`);
                    errorCount++;
                    continue;
                }

                const profile = profiles.documents[0];
                const profileId = profile.$id;

                // Update the test link with the profile ID and log user info
                await databases.updateDocument(
                    DATABASE_ID,
                    TEST_LINKS_COLLECTION,
                    testLink.$id,
                    {
                        userId: profileId
                    }
                );

                console.log(`✅ Updated test link for user: ${profile.name || 'Unknown'}`);
                console.log(`   Document ID: ${testLink.$id}`);
                console.log(`   Old userId: ${userId} -> New userId: ${profileId}`);
                console.log(`   Email: ${testLink.email || 'No email'}`);
                fixedCount++;

                // Add a small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 100));

            } catch (error) {
                console.error(`❌ Error processing document ${testLink.$id}:`, error.message);
                errorCount++;
            }
        }

        console.log('\nFix completed!');
        console.log(`Total documents processed: ${testLinks.documents.length}`);
        console.log(`Successfully fixed: ${fixedCount}`);
        console.log(`Skipped (already correct): ${skippedCount}`);
        console.log(`Errors: ${errorCount}`);

    } catch (error) {
        console.error('Error in fixTestLinkUserIds:', error);
    }
}

// Run the script
fixTestLinkUserIds().catch(console.error);
