import { Client, Account, Databases, Query } from 'appwrite';
import { databases, ID } from './appwrite';

// Initialize the Appwrite client
const client = new Client()
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

// Initialize the Account service
const account = new Account(client);

// Get database and collection IDs from environment variables
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const COLLECTION_ID = '684da84500159ddfea6f'; // Your collection ID from Appwrite dashboard

if (!DATABASE_ID) {
  console.error('Missing VITE_APPWRITE_DATABASE_ID environment variable');
  throw new Error('Missing required Appwrite database ID');
}

export interface TestResponse {
  questionId: string;
  selectedOption: number;
  isCorrect: boolean;
  timeSpent: number;
}

export interface TestResult {
  userId: string;
  testId: string;
  testName: string;
  score: number;
  totalMarks: number;
  percentage: number;
  correctAnswers: number;
  incorrectAnswers: number;
  takenAt: string;
  userName: string;
  startTime: string;
  endTime?: string;
  timeSpent: number;
  responses: string; // This will be stringified JSON of TestResponse[]
  maxScore: number;
  passed: boolean;
  testDetails: string; // This will be stringified JSON of test details
}

/**
 * Saves test results to Appwrite
 */
export const saveTestResults = async (testResult: Omit<TestResult, 'userId' | 'userName' | 'takenAt'>) => {
  try {
    console.log('Starting to save test result with data:', {
      ...testResult,
      testDetails: typeof testResult.testDetails === 'string' ? '[string]' : '[object]',
      responses: typeof testResult.responses === 'string' ? '[string]' : '[array]'
    });

    // Get current user
    const user = await account.get();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Log the raw testId value and type
    console.log('Raw testId value:', testResult.testId, 'Type:', typeof testResult.testId);
    
    // Prepare the document data with explicit field mapping
    const documentData: Record<string, any> = {
      // Required fields
      userId: user.$id,
      testId: testResult.testId,
      testName: testResult.testName || 'Unnamed Test',
      score: Number(testResult.score) || 0,
      totalMarks: Number(testResult.totalMarks) || 0,
      percentage: Number(testResult.percentage) || 0,
      correctAnswers: Number(testResult.correctAnswers) || 0,
      incorrectAnswers: Number(testResult.incorrectAnswers) || 0,
      takenAt: new Date().toISOString(),
      userName: user.name || user.email || 'Anonymous',
      startTime: testResult.startTime || new Date().toISOString(),
      endTime: testResult.endTime || new Date().toISOString(),
      timeSpent: Number(testResult.timeSpent) || 0,
      maxScore: Number(testResult.maxScore) || 0,
      passed: Boolean(testResult.passed),
      
      // Convert responses to an array of strings
      responses: (() => {
        try {
          // If it's already an array of strings, use it as-is
          if (Array.isArray(testResult.responses) && 
              testResult.responses.every(item => typeof item === 'string')) {
            return testResult.responses;
          }
          
          // If it's an array of objects, stringify each object
          if (Array.isArray(testResult.responses)) {
            return testResult.responses.map(item => 
              typeof item === 'string' ? item : JSON.stringify(item)
            );
          }
          
          // If it's a string, try to parse it as JSON
          if (typeof testResult.responses === 'string') {
            const parsed = JSON.parse(testResult.responses);
            return Array.isArray(parsed) 
              ? parsed.map(item => typeof item === 'string' ? item : JSON.stringify(item))
              : [JSON.stringify(parsed)];
          }
          
          // Default to empty array
          return [];
        } catch (e) {
          console.error('Error processing responses:', e);
          return [];
        }
      })(),
      
      testDetails: typeof testResult.testDetails === 'string'
        ? testResult.testDetails
        : JSON.stringify(testResult.testDetails || {})
    };

    // Log the complete document data structure
    console.log('Complete document data structure:', JSON.stringify({
      ...documentData,
      testDetails: '[...]',
      responses: '[...]'
    }, null, 2));
    
    // Log each field individually
    console.log('Individual field values:');
    Object.entries(documentData).forEach(([key, value]) => {
      console.log(`- ${key}:`, value, `(Type: ${typeof value})`);
    });

    // Save to Appwrite
    console.log('Attempting to save to Appwrite...');
    const result = await databases.createDocument(
      DATABASE_ID,
      COLLECTION_ID,
      ID.unique(),
      documentData
    );
    
    console.log('Test result saved successfully:', result);
    return result;
  } catch (error) {
    console.error('Error saving test results:', error);
    throw error;
  }
};

/**
 * Gets test results for a specific user
 */
export const getUserTestResults = async (userId: string) => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID,
      [
        Query.equal('userId', userId),
        Query.orderDesc('takenAt')
      ]
    );
    
    return response.documents;
  } catch (error) {
    console.error('Error fetching test results:', error);
    throw error;
  }
};

/**
 * Gets a specific test result by ID
 */
export const getTestResultById = async (resultId: string) => {
  try {
    const result = await databases.getDocument(
      DATABASE_ID,
      COLLECTION_ID,
      resultId
    );
    
    return result;
  } catch (error) {
    console.error('Error fetching test result:', error);
    throw error;
  }
};
