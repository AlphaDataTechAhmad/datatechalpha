import { databases } from './appwrite';

const DATABASE_ID = '68261b6a002ba6c3b584'; // Replace with your actual database ID
const CATEGORY_COLLECTION_ID = '6866a549001f22349e3a';

export interface TestCategory {
  $id: string;
  Title: string;
  description: string;
  categoryThumbnail: string;
  TestId: string[];
  rating?: number;
  languages?: string[];
}

export const getTestCategories = async (): Promise<TestCategory[]> => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      CATEGORY_COLLECTION_ID
    );
    return response.documents as unknown as TestCategory[];
  } catch (error) {
    console.error('Error fetching test categories:', error);
    throw error;
  }
};

export const getTestsByCategory = async (categoryId: string) => {
  try {
    // First get the category to get the TestId array
    const category = await databases.getDocument(
      DATABASE_ID,
      CATEGORY_COLLECTION_ID,
      categoryId
    ) as unknown as TestCategory;

    if (!category || !category.TestId || category.TestId.length === 0) {
      return [];
    }

    // Fetch each test document individually
    const testPromises = category.TestId.map(testId => 
      databases.getDocument(
        DATABASE_ID,
        '686520c7001bd5bb53b3', // Test collection ID
        testId
      ).catch(error => {
        console.error(`Error fetching test ${testId}:`, error);
        return null;
      })
    );

    // Wait for all test fetches to complete and filter out any failed ones
    const tests = await Promise.all(testPromises);
    return tests.filter(test => test !== null);
  } catch (error) {
    console.error('Error fetching tests by category:', error);
    throw error;
  }
};
