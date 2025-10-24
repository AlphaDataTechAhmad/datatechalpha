import { databases, Query, account, ID } from './appwrite';

// Use the datavision database ID for the test conductor
const TEST_CONDUCTOR_DATABASE_ID = '68cb297b003c9c7471fc';

// Collection IDs from your Appwrite database
const COLLECTIONS = {
  USERS: '68f7ccb10013cf388666',         // users
  EXAMS: '68f7ccbb00119804710b',        // exams
  QUESTIONS: '68f7cccd002fd40cf2bb',    // questions
  EXAM_ATTEMPTS: '68f7ccd7002cb2d2d180', // exam_attempts
  ANSWERS: '68f7cce100162084fe2e',      // answers
  RESULTS: '68f7ccea0030a7db0de9',      // results
  QUESTION_BANKS: '68f7ccf300235b36b231', // question_banks
  NOTIFICATIONS: '68f7ccfa000282b70bde', // notifications
  CERTIFICATES: '68f7cd0100116d77577c',  // certificates
  SYSTEM_SETTINGS: '68f7cd0a0032ab53d73f' // system_settings
} as const;

// Types for our data models
type User = {
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  status: 'active' | 'suspended' | 'pending';
  institution?: string;
  department?: string;
  phone?: string;
  createdAt: string;
  lastLogin?: string;
};

type Exam = {
  title: string;
  description?: string;
  duration: number; // in minutes
  totalMarks: number;
  passingMarks: number;
  instructions?: string;
  startTime: string;
  endTime: string;
  createdBy: string;
  status: 'draft' | 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showResults: boolean;
  allowReview: boolean;
  webcamRequired: boolean;
  fullScreenRequired: boolean;
  maxAttempts: number;
  timeLimitPerQuestion?: number;
};

// API Functions
export const intelliTestService = {
  // User Management
  getCurrentUser: async (userId: string): Promise<User> => {
    return await databases.getDocument(TEST_CONDUCTOR_DATABASE_ID, COLLECTIONS.USERS, userId);
  },

  // Exam Operations
  getExams: async (filters = {}) => {
    try {
      return await databases.listDocuments(TEST_CONDUCTOR_DATABASE_ID, COLLECTIONS.EXAMS, [
        Query.orderDesc('createdAt'),
        ...Object.entries(filters).map(([key, value]) => Query.equal(key, value))
      ]);
    } catch (error) {
      console.error('Error fetching exams:', error);
      throw error;
    }
  },

  getExamById: async (examId: string) => {
    return await databases.getDocument(TEST_CONDUCTOR_DATABASE_ID, COLLECTIONS.EXAMS, examId);
  },

  // Question Operations
  getQuestions: async (examId: string) => {
    return await databases.listDocuments(TEST_CONDUCTOR_DATABASE_ID, COLLECTIONS.QUESTIONS, [
      Query.equal('examId', examId),
      Query.orderAsc('createdAt')
    ]);
  },

  // Exam Attempts
  startExam: async (examId: string, userId: string) => {
    try {
      // First, check if the user already has an active attempt
      const existingAttempts = await databases.listDocuments(
        TEST_CONDUCTOR_DATABASE_ID,
        COLLECTIONS.EXAM_ATTEMPTS,
        [
          Query.equal('examId', examId),
          Query.equal('userId', userId),
          Query.equal('status', 'in_progress')
        ]
      );

      // If there's an existing active attempt, return it
      if (existingAttempts.documents.length > 0) {
        console.log('Returning existing exam attempt:', existingAttempts.documents[0]);
        return existingAttempts.documents[0];
      }

      // Get current timestamp
      const now = new Date().toISOString();
      
      // Get user agent and IP address
      const userAgent = window.navigator.userAgent;
      let ipAddress = 'unknown';
      try {
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipResponse.json();
        ipAddress = ipData.ip || 'unknown';
      } catch (ipError) {
        console.warn('Could not fetch IP address:', ipError);
      }

      // Create attempt data with only the fields defined in the schema
      const attemptData = {
        examId,
        userId,
        status: 'draft', // Using 'draft' as required by the collection schema
        startedAt: now,
        submittedAt: now, // Will be updated on actual submission
        timeSpent: 0, // Initialize time spent to 0 (in seconds)
        score: 0,
        percentage: 0, // Initialize percentage to 0
        passed: false, // Initialize passed status
        ipAddress, // Add IP address
        userAgent, // Add user agent
        isCompleted: false, // Changed to boolean to match schema
        answers: JSON.stringify([]) // Stringified empty array
      };
      
      console.log('Attempt data being sent:', JSON.stringify(attemptData, null, 2));
      
      console.log('Attempt data being sent:', JSON.stringify(attemptData, null, 2));

      console.log('Creating new exam attempt with data:', attemptData);

      const attempt = await databases.createDocument(
        TEST_CONDUCTOR_DATABASE_ID,
        COLLECTIONS.EXAM_ATTEMPTS,
        ID.unique(),
        attemptData
      );
      
      console.log('Created new exam attempt:', attempt);
      return attempt;
    } catch (error) {
      console.error('Error starting exam:', error);
      throw error;
    }
  },

  submitAnswers: async (attemptId: string, answers: Answer[]) => {
    return await databases.updateDocument(
      TEST_CONDUCTOR_DATABASE_ID,
      COLLECTIONS.EXAM_ATTEMPTS,
      attemptId,
      {
        answers,
        submittedAt: new Date().toISOString()
      }
    );
  },

  getExamAttempt: async (attemptId: string) => {
    return await databases.getDocument(
      TEST_CONDUCTOR_DATABASE_ID,
      COLLECTIONS.EXAM_ATTEMPTS,
      attemptId
    );
  },

  // System Settings
  getSystemSetting: async (key: string) => {
    try {
      const response = await databases.listDocuments(
        TEST_CONDUCTOR_DATABASE_ID,
        COLLECTIONS.SYSTEM_SETTINGS,
        [Query.equal('key', key), Query.limit(1)]
      );
      return response.documents[0]?.value || null;
    } catch (error) {
      console.error('Error getting system setting:', error);
      return null;
    }
  },
  
  // Get current user's profile with assigned exams
  getCurrentUserProfile: async () => {
    try {
      const currentUser = await account.get();
      console.log('Current user:', currentUser);
      
      if (!currentUser || !currentUser.email) {
        throw new Error('No active user session found');
      }
      
      const userId = currentUser.$id;
      console.log('Fetching profile for user ID:', userId);
      
      const databaseId = '68261b6a002ba6c3b584'; // Profile database ID
      const collectionId = '68261bb5000a54d8652b'; // Profile collection ID
      
      console.log('Using database:', databaseId, 'collection:', collectionId);
      
      // Try to get the document by user ID first
      try {
        const response = await databases.getDocument(databaseId, collectionId, userId);
        console.log('Profile found by ID:', response);
        return response;
      } catch (docError) {
        console.log('Document not found by ID, trying email query...');
        
        // If direct get fails, try a query by email
        try {
          const queryResponse = await databases.listDocuments(
            databaseId,
            collectionId,
            [Query.equal('email', currentUser.email)]
          );
          
          if (queryResponse.documents.length > 0) {
            console.log('Profile found by email:', queryResponse.documents[0]);
            return queryResponse.documents[0];
          }
          
          // If still not found, create a new profile
          console.log('No profile found, creating new one...');
          try {
            const newProfile = await databases.createDocument(
              databaseId,
              collectionId,
              userId, // Using the user's ID as the document ID
              {
                email: currentUser.email,
                name: currentUser.name || '',
                exams: [], // Initialize empty exams array
                role: 'student', // Default role
                status: 'active', // Default status
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              }
            );
            
            console.log('Created new profile:', newProfile);
            return newProfile;
          } catch (createError) {
            console.error('Error creating new profile:', createError);
            throw new Error('Failed to create new user profile');
          }
          
        } catch (queryError) {
          console.error('Error querying/creating profile:', queryError);
          throw new Error('Failed to get or create user profile');
        }
        return null;
      }
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  },
  
  // Get exams assigned to a student
  getAssignedExams: async () => {
    try {
      // First get the current user's account
      const currentUser = await account.get();
      console.log('Current user in getAssignedExams:', currentUser);
      
      // Then get the user's profile to get their assigned exams
      const userProfile = await intelliTestService.getCurrentUserProfile();
      console.log('User profile in getAssignedExams:', userProfile);
      
      // Check if userProfile exists and has exams array
      if (!userProfile) {
        console.warn('No user profile found');
        return [];
      }
      
      // Check if exams exists and is an array
      if (!userProfile.exams || !Array.isArray(userProfile.exams)) {
        console.warn('No exams array found in user profile or exams is not an array');
        return [];
      }
      
      const examIds = userProfile.exams.filter(Boolean); // Remove any falsy values
      
      if (examIds.length === 0) {
        console.log('No valid exam IDs found for user:', currentUser.email);
        return [];
      }
      
      console.log('Fetching exams with IDs:', examIds);
      
      // Fetch the exam details for each assigned exam
      const examPromises = examIds.map((examId: string) => 
        intelliTestService.getExamById(examId).catch(error => {
          console.error(`Error fetching exam ${examId}:`, error);
          return null;
        })
      );
      
      const exams = await Promise.all(examPromises);
      const validExams = exams.filter(Boolean); // Remove any null values from failed fetches
      
      console.log(`Found ${validExams.length} valid exams out of ${examIds.length} requested`);
      return validExams;
    } catch (error) {
      console.error('Error getting assigned exams:', error);
      return [];
    }
  }
};

export default intelliTestService;
