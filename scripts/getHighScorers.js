const { databases, Query } = require('../src/Services/appwrite');
const { DATABASE_ID, TEST_RESULTS_COLLECTION_ID } = require('../src/config/appwriteConfig');

async function getHighScorers(minScore = 10) {
  try {
    console.log(`Fetching users who scored above ${minScore}...`);
    
    // Fetch test results where score is greater than minScore
    const response = await databases.listDocuments(
      DATABASE_ID,
      TEST_RESULTS_COLLECTION_ID,
      [
        Query.greaterThan('score', minScore),
        Query.orderDesc('score'),
        Query.limit(100) // Adjust limit as needed
      ]
    );

    if (response.documents.length === 0) {
      console.log(`No users found with score above ${minScore}`);
      return [];
    }

    // Format and display results
    console.log(`\n=== Users with score above ${minScore} ===`);
    console.log('Total found:', response.documents.length);
    console.log('\nUser ID\t\tScore\tTest Name\t\tDate');
    console.log('='.repeat(80));
    
    response.documents.forEach(doc => {
      console.log(
        `${doc.userId}\t${doc.score}\t${doc.testName || 'N/A'}\t${new Date(doc.takenAt).toLocaleDateString()}`
      );
    });

    return response.documents;
  } catch (error) {
    console.error('Error fetching high scorers:', error);
    throw error;
  }
}

// Run the function with default min score of 10
getHighScorers(10)
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
