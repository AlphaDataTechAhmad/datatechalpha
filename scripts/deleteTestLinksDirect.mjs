import { Client, Databases, Query } from 'appwrite';

// Initialize the client
const client = new Client()
  .setEndpoint('https://cloud.appwrite.io/v1')  // Replace with your Appwrite endpoint
  .setProject('your-project-id')               // Replace with your project ID
  .setKey('your-api-key');                     // Replace with your API key

const databases = new Databases(client);

const DATABASE_ID = 'your-database-id';        // Replace with your database ID
const INTERNSHIP_TEST_LINKS_COLLECTION = '689923bc000f2d15a263';

async function deleteTestLinksByEmail(email) {
  try {
    console.log(`Searching for test links with email: ${email}`);
    
    // First, find all test links for this email
    const response = await databases.listDocuments(
      DATABASE_ID,
      INTERNSHIP_TEST_LINKS_COLLECTION,
      [
        Query.equal('userEmail', email)
      ]
    );

    console.log(`Found ${response.total} test links to delete`);

    // Delete each test link
    for (const doc of response.docments) {
      console.log(`Deleting test link ${doc.$id}...`);
      await databases.deleteDocument(
        DATABASE_ID,
        INTERNSHIP_TEST_LINKS_COLLECTION,
        doc.$id
      );
      console.log(`Deleted test link ${doc.$id}`);
    }

    console.log('All matching test links have been deleted successfully');
  } catch (error) {
    console.error('Error deleting test links:', error);
  }
}

// Run the function with the specified email
deleteTestLinksByEmail('paramsingh081021@gmail.com');
