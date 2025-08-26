import { Client, Databases, Query } from 'appwrite';

// Initialize the client with your Appwrite configuration
const client = new Client()
  .setEndpoint('https://cloud.appwrite.io/v1')
  .setProject('68261b5200198bea6bdf');

const databases = new Databases(client);

// Use the database ID from your app config
const DATABASE_ID = '68261b6a002ba6c3b584';
const INTERNSHIP_TEST_LINKS_COLLECTION = '689923bc000f2d15a263';

async function deleteTestLinksByEmail(email) {
  try {
    console.log(`Searching for test links with email: ${email}`);
    
    // First, find all test links for this email
    const response = await databases.listDocuments(
      DATABASE_ID,
      INTERNSHIP_TEST_LINKS_COLLECTION,
      [
        Query.equal('email', email)
      ]
    );

    console.log(`Found ${response.total} test links to delete`);

    if (response.total === 0) {
      console.log('No test links found for this email');
      return;
    }

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
    console.error('Error deleting test links:', error.message);
    if (error.response) {
      console.error('Error details:', error.response);
    }
  }
}

// Run the function with the specified email
deleteTestLinksByEmail('paramsingh081021@gmail.com');
