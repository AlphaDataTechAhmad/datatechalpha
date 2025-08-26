import { client } from '@/Services/appwrite';
import { DATABASE_ID } from '@/lib/constants';

export interface Collection {
  $id: string;
  name: string;
  $permissions: string[];
  $createdAt: string;
  $updatedAt: string;
}

export const listCollections = async (): Promise<Collection[]> => {
  try {
    // Using the client directly to make a raw API call
    const response = await fetch(
      `${client.config.endpoint}/databases/${DATABASE_ID}/collections`,
      {
        method: 'GET',
        headers: {
          'X-Appwrite-Project': client.config.project,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch collections: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Available collections:', data.collections);
    return data.collections || [];
  } catch (error) {
    console.error('Error listing collections:', error);
    throw error;
  }
};
