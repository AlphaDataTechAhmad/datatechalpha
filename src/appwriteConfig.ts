import { Client, Account, Databases, Storage, Functions, Query } from 'appwrite';

// Initialize the Appwrite client
const client = new Client()
    .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID || '68261b5200198bea6bdf');

// In development, you might need to configure your environment to trust the Appwrite certificate
// or use a reverse proxy with proper SSL configuration

/**
 * Utility function to make authenticated requests with automatic session handling
 * @param requestFn - The function that makes the API request
 * @param options - Options for the request
 * @returns Promise with the response data
 */
export const authenticatedRequest = async <T>(
  requestFn: () => Promise<T>,
  options: { retryOnAuthFailure?: boolean } = { retryOnAuthFailure: true }
): Promise<T> => {
  try {
    // First try the request with the current session
    return await requestFn();
  } catch (error: any) {
    // If unauthorized and we should retry on auth failure
    if (error.code === 401 && options.retryOnAuthFailure) {
      try {
        // Try to get a fresh session
        await account.getSession('current');
        // Retry the request with the new session
        return await requestFn();
      } catch (refreshError) {
        console.error('Failed to refresh session:', refreshError);
        // Clear auth state and redirect to login
        window.dispatchEvent(new Event('unauthorized'));
        throw new Error('Session expired. Please log in again.');
      }
    }
    throw error;
  }
};

// Database and Collection IDs
export const DATABASE_ID = '68261b6a002ba6c3b584';

// Collection IDs
export const TESTIMONIALS_COLLECTION_ID = 'testimonials'; // Collection for storing testimonial data

// Storage Bucket IDs
export const TESTIMONIALS_BUCKET_ID = '68f2f194002dcba1f1ba'; // Bucket for storing testimonial photos

// Legacy collection IDs (keep for backward compatibility)
export const LECTURES_COLLECTION_ID = '684bc356000b2a6e138f';
export const ENROLLMENTS_COLLECTION_ID = '684dc01f003312e04f0c';
export const TESTS_COLLECTION_ID = '686520c7001bd5bb53b3';
export const TEST_RESULTS_COLLECTION_ID = '684da84500159ddfea6f';

// New collection IDs for Test Conductor
// Exams collection (for test/exam details)
export const EXAMS_COLLECTION = TESTS_COLLECTION_ID; // Using existing TESTS_COLLECTION_ID

// Questions collection (for storing all questions)
export const QUESTIONS_COLLECTION = '686520c7001bd5bb53b4'; // Replace with actual ID

// Question Banks collection (for grouping questions)
export const QUESTION_BANKS_COLLECTION = '686520c7001bd5bb53b5'; // Replace with actual ID

// Exam Attempts collection (tracks when users take exams)
export const EXAM_ATTEMPTS_COLLECTION = '686520c7001bd5bb53b6'; // Replace with actual ID

// Results collection (stores final exam results)
export const RESULTS_COLLECTION = TEST_RESULTS_COLLECTION_ID; // Using existing TEST_RESULTS_COLLECTION_ID
export const COURSES_COLLECTION_ID = '682644ed002b437582d3';
export const INTERNSHIPS_COLLECTION_ID = '6884925d00189c3d5816';
export const INTERNSHIP_APPLICATIONS_COLLECTION_ID = '6884a2ca0003ae2e2fba';
export const USER_PROFILES_COLLECTION_ID = '68261bb5000a54d8652b';
export const STUDENTDATA_COLLECTION_ID = '6893094c00238ff6f729';
export const EXAM_REGISTRATIONS_COLLECTION_ID = '6884a2ca0003ae2e2fba';
export const SCHOLARSHIP_APPLICATIONS_COLLECTION_ID = import.meta.env.VITE_SCHOLARSHIP_APPLICATIONS_COLLECTION_ID || '68986fdc003214947765';
export const TECHNICAL_FORM_COLLECTION_ID = 'technical_form'; // Replace with actual collection ID from Appwrite

// Initialize the database service
const databases = new Databases(client);
const account = new Account(client);
const storage = new Storage(client);
const functions = new Functions(client);

// Export the services
export { client, databases, account, storage, functions, Query };
