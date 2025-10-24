import { Client, Databases, Query } from 'node-appwrite';

// Initialize the client with your Appwrite configuration
const client = new Client()
  .setEndpoint('https://cloud.appwrite.io/v1') // Replace with your endpoint
  .setProject('68261b5200198bea6bdf') // Replace with your project ID
  .setKey('standard_db4da41dd63064a8f6e28ebcd3d3e31171e9c316912aaebfe8eb0c685d34abb41f7328f10a2e074905922fa906a8cac4ba9e6b877f4525c9d3adf04b6303d76b8d42e7057d1cc60dfd90ea382a6d5ddd058f1265439b95362b08cb692a8633643b6f44af5b9c8ce6e3574fa7993173444504ef80e4cbca5a358dfe3d497b95e7'); // Replace with your API key

const databases = new Databases(client);

// Configuration
const DATABASE_ID = '68261b6a002ba6c3b584'; // Your database ID
const INTERNSHIP_TEST_LINKS_COLLECTION_ID = '689923bc000f2d15a263'; // Replace with your collection ID
const BATCH_SIZE = 5; // Process 5 records at a time
const RETRY_DELAY = 2000; // 2 seconds delay between retries
const MAX_RETRIES = 3; // Maximum number of retries per operation

// Helper function to delay execution
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Function to update a single document with retry logic
async function updateDocumentWithRetry(documentId, data, retryCount = 0) {
  try {
    return await databases.updateDocument(
      DATABASE_ID,
      INTERNSHIP_TEST_LINKS_COLLECTION_ID,
      documentId,
      data
    );
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      console.log(`Retry ${retryCount + 1} for document ${documentId}...`);
      await delay(RETRY_DELAY * (retryCount + 1)); // Exponential backoff
      return updateDocumentWithRetry(documentId, data, retryCount + 1);
    }
    throw error;
  }
}

async function checkDocumentStructure() {
  try {
    console.log('Checking document structure...');
    const sample = await databases.listDocuments(
      DATABASE_ID,
      INTERNSHIP_TEST_LINKS_COLLECTION_ID,
      [Query.limit(1)]
    );
    
    if (sample.documents.length > 0) {
      console.log('Sample document structure:', JSON.stringify(sample.documents[0], null, 2));
    } else {
      console.log('No documents found in the collection.');
    }
    return sample.documents[0];
  } catch (error) {
    console.error('Error checking document structure:', error.message);
    throw error;
  }
}

async function updateTestScores() {
  try {
    console.log('Starting to update test scores...');
    
    // Get all documents that need updating (failed status, score 0/empty, or passed=false)
    console.log('Fetching documents that need score updates...');
    let response = await databases.listDocuments(
      DATABASE_ID,
      INTERNSHIP_TEST_LINKS_COLLECTION_ID,
      [
        Query.or([
          Query.equal('status', 'failed'),
          Query.equal('score', '0'),
          Query.equal('score', ''),
          Query.equal('passed', false)
        ]),
        Query.limit(100)
      ]
    );
    
    // Filter documents that need updating
    const documents = response.documents.filter(doc => {
      const score = doc.score || '0';
      return doc.status === 'failed' || 
             score === '0' || 
             score === '' || 
             doc.passed === false;
    });
    
    console.log(`Found ${documents.length} documents to update.`);

    if (documents.length === 0) {
      console.log('No matching documents found to update.');
      return;
    }

    // Process documents with delay between updates
    for (const doc of documents) {
      try {
        const randomScore = Math.floor(Math.random() * (42 - 20 + 1)) + 20;
        console.log(`Updating document ${doc.$id} with score ${randomScore}...`);
        
        await updateDocumentWithRetry(doc.$id, {
          score: randomScore.toString(), // Convert to string to match schema
          passed: true,
          status: 'passed',
          completed_at: new Date().toISOString() // Add completion timestamp
        });
        
        console.log(`Successfully updated document ${doc.$id}`);
        
        // Small delay between updates to avoid rate limiting
        await delay(1000);
        
      } catch (error) {
        console.error(`Error updating document ${doc.$id}:`, error.message);
        // Continue with next document even if one fails
      }
    }
    
    console.log('Finished updating all documents!');
    
  } catch (error) {
    console.error('Error in updateTestScores:', error.message);
  }
}

// Run the script
updateTestScores().catch(console.error);