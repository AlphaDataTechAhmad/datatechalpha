const { Client, Databases, Query } = require('appwrite');
require('dotenv').config();

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
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
    for (const doc of response.documents) {
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
