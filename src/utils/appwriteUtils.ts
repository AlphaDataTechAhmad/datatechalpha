import { databases } from '@/Services/appwrite';

export async function getCollectionAttributes(databaseId: string, collectionId: string) {
  try {
    const response = await fetch(
      `https://cloud.appwrite.io/v1/databases/${databaseId}/collections/${collectionId}/attributes`,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Appwrite-Project': 'YOUR_PROJECT_ID', // Replace with your actual project ID
          'X-Appwrite-Key': 'YOUR_API_KEY' // Replace with your API key
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Collection attributes:', data);
    return data.attributes;
  } catch (error) {
    console.error('Error fetching collection attributes:', error);
    throw error;
  }
}

// Usage example:
// getCollectionAttributes('68261b6a002ba6c3b584', '685457d5000a277435ef');
