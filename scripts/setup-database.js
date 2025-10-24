// First, let's verify the database exists
import { Client, Databases, ID, Query } from 'node-appwrite';

const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1') // Your Appwrite endpoint
    .setProject('68261b5200198bea6bdf') // Your project ID
    .setKey('standard_db4da41dd63064a8f6e28ebcd3d3e31171e9c316912aaebfe8eb0c685d34abb41f7328f10a2e074905922fa906a8cac4ba9e6b877f4525c9d3adf04b6303d76b8d42e7057d1cc60dfd90ea382a6d5ddd058f1265439b95362b08cb692a8633643b6f44af5b9c8ce6e3574fa7993173444504ef80e4cbca5a358dfe3d497b95e7'); // Your API key with admin access

const databases = new Databases(client);
const DATABASE_ID = '68cb297b003c9c7471fc';

async function setupDatabase() {
  try {
    console.log('Setting up Data Vision database...');
    
    // 1. Create Exams Collection
    await createExamsCollection();
    
    // 2. Create Questions Collection
    await createQuestionsCollection();
    
    // 3. Create Exam Attempts Collection
    await createExamAttemptsCollection();
    
    // 4. Create Question Banks Collection
    await createQuestionBanksCollection();
    
    // 5. Create Results Collection
    await createResultsCollection();
    
    console.log('✅ Database setup completed successfully!');
  } catch (error) {
    console.error('Error setting up database:', error);
  }
}

// 1. Exams Collection
async function createExamsCollection() {
  const EXAMS_COLLECTION_ID = 'exams';
  
  try {
    // Check if collection already exists
    try {
      await databases.get(DATABASE_ID, EXAMS_COLLECTION_ID);
      console.log('Exams collection already exists');
      return;
    } catch (e) {
      // Collection doesn't exist, create it
    }
    
    // Create the collection
    await databases.createCollection(
      DATABASE_ID,
      EXAMS_COLLECTION_ID,
      'Exams',
      [
        // Permissions
        'read("any")', // Anyone can read
        'create("users")', // Any authenticated user can create
        'update("users")', // Any authenticated user can update
        'delete("role:admin")', // Only admins can delete
      ]
    );
    
    // Add attributes
    await Promise.all([
      databases.createStringAttribute(DATABASE_ID, EXAMS_COLLECTION_ID, 'title', 255, true),
      databases.createStringAttribute(DATABASE_ID, EXAMS_COLLECTION_ID, 'description', 1000, true),
      databases.createIntegerAttribute(DATABASE_ID, EXAMS_COLLECTION_ID, 'duration', true),
      databases.createIntegerAttribute(DATABASE_ID, EXAMS_COLLECTION_ID, 'totalMarks', true),
      databases.createIntegerAttribute(DATABASE_ID, EXAMS_COLLECTION_ID, 'passingMarks', true),
      databases.createStringAttribute(DATABASE_ID, EXAMS_COLLECTION_ID, 'instructions', 0, true, null, true), // Array of strings
      databases.createStringAttribute(DATABASE_ID, EXAMS_COLLECTION_ID, 'sections', 0, true, null, true), // Array of objects
      databases.createStringAttribute(DATABASE_ID, EXAMS_COLLECTION_ID, 'negativeMarking', 0, true), // Object
      databases.createBooleanAttribute(DATABASE_ID, EXAMS_COLLECTION_ID, 'showResult', true),
      databases.createBooleanAttribute(DATABASE_ID, EXAMS_COLLECTION_ID, 'showAnswers', true),
      databases.createDatetimeAttribute(DATABASE_ID, EXAMS_COLLECTION_ID, 'startTime', true),
      databases.createDatetimeAttribute(DATABASE_ID, EXAMS_COLLECTION_ID, 'endTime', true),
      databases.createStringAttribute(DATABASE_ID, EXAMS_COLLECTION_ID, 'status', 20, true),
      databases.createStringAttribute(DATABASE_ID, EXAMS_COLLECTION_ID, 'createdBy', 36, true), // User ID
      databases.createDatetimeAttribute(DATABASE_ID, EXAMS_COLLECTION_ID, 'createdAt', true),
      databases.createDatetimeAttribute(DATABASE_ID, EXAMS_COLLECTION_ID, 'updatedAt', true)
    ]);
    
    // Create indexes
    await Promise.all([
      databases.createIndex(DATABASE_ID, EXAMS_COLLECTION_ID, 'idx_createdBy', 'key', ['createdBy']),
      databases.createIndex(DATABASE_ID, EXAMS_COLLECTION_ID, 'idx_status', 'key', ['status']),
      databases.createIndex(DATABASE_ID, EXAMS_COLLECTION_ID, 'idx_startTime', 'key', ['startTime']),
      databases.createIndex(DATABASE_ID, EXAMS_COLLECTION_ID, 'idx_endTime', 'key', ['endTime'])
    ]);
    
    console.log('✅ Created Exams collection');
  } catch (error) {
    console.error('Error creating Exams collection:', error);
    throw error;
  }
}

// 2. Questions Collection
async function createQuestionsCollection() {
  const QUESTIONS_COLLECTION_ID = 'questions';
  
  try {
    // Check if collection already exists
    try {
      await databases.get(DATABASE_ID, QUESTIONS_COLLECTION_ID);
      console.log('Questions collection already exists');
      return;
    } catch (e) {
      // Collection doesn't exist, create it
    }
    
    // Create the collection
    await databases.createCollection(
      DATABASE_ID,
      QUESTIONS_COLLECTION_ID,
      'Questions',
      [
        'read("any")',
        'create("users")',
        'update("users")',
        'delete("role:admin")'
      ]
    );
    
    // Add attributes
    await Promise.all([
      databases.createStringAttribute(DATABASE_ID, QUESTIONS_COLLECTION_ID, 'type', 20, true),
      databases.createStringAttribute(DATABASE_ID, QUESTIONS_COLLECTION_ID, 'question', 0, true), // Large text
      databases.createStringAttribute(DATABASE_ID, QUESTIONS_COLLECTION_ID, 'options', 0, false, null, true), // Array of objects
      databases.createStringAttribute(DATABASE_ID, QUESTIONS_COLLECTION_ID, 'correctAnswer', 0, false), // Mixed type
      databases.createStringAttribute(DATABASE_ID, QUESTIONS_COLLECTION_ID, 'explanation', 0, false),
      databases.createFloatAttribute(DATABASE_ID, QUESTIONS_COLLECTION_ID, 'marks', true),
      databases.createStringAttribute(DATABASE_ID, QUESTIONS_COLLECTION_ID, 'difficulty', 10, true),
      databases.createStringAttribute(DATABASE_ID, QUESTIONS_COLLECTION_ID, 'tags', 0, false, null, true), // Array of strings
      databases.createStringAttribute(DATABASE_ID, QUESTIONS_COLLECTION_ID, 'category', 50, true),
      databases.createStringAttribute(DATABASE_ID, QUESTIONS_COLLECTION_ID, 'createdBy', 36, true), // User ID
      databases.createDatetimeAttribute(DATABASE_ID, QUESTIONS_COLLECTION_ID, 'createdAt', true),
      databases.createDatetimeAttribute(DATABASE_ID, QUESTIONS_COLLECTION_ID, 'updatedAt', true)
    ]);
    
    // Create indexes
    await Promise.all([
      databases.createIndex(DATABASE_ID, QUESTIONS_COLLECTION_ID, 'idx_type', 'key', ['type']),
      databases.createIndex(DATABASE_ID, QUESTIONS_COLLECTION_ID, 'idx_difficulty', 'key', ['difficulty']),
      databases.createIndex(DATABASE_ID, QUESTIONS_COLLECTION_ID, 'idx_category', 'key', ['category']),
      databases.createIndex(DATABASE_ID, QUESTIONS_COLLECTION_ID, 'idx_createdBy', 'key', ['createdBy']),
      databases.createIndex(DATABASE_ID, QUESTIONS_COLLECTION_ID, 'idx_tags', 'key', ['tags'], ['array'])
    ]);
    
    console.log('✅ Created Questions collection');
  } catch (error) {
    console.error('Error creating Questions collection:', error);
    throw error;
  }
}

// 3. Exam Attempts Collection
async function createExamAttemptsCollection() {
  const EXAM_ATTEMPTS_COLLECTION_ID = 'exam_attempts';
  
  try {
    // Check if collection already exists
    try {
      await databases.get(DATABASE_ID, EXAM_ATTEMPTS_COLLECTION_ID);
      console.log('Exam Attempts collection already exists');
      return;
    } catch (e) {
      // Collection doesn't exist, create it
    }
    
    // Create the collection
    await databases.createCollection(
      DATABASE_ID,
      EXAM_ATTEMPTS_COLLECTION_ID,
      'Exam Attempts',
      [
        // Users can read their own attempts
        'read("user:{userId}")',
        // Users can create their own attempts
        'create("users")',
        // Users can update their own in-progress attempts
        'update("user:{userId}")',
        // Only admins can delete
        'delete("role:admin")'
      ]
    );
    
    // Add attributes
    await Promise.all([
      databases.createStringAttribute(DATABASE_ID, EXAM_ATTEMPTS_COLLECTION_ID, 'examId', 36, true),
      databases.createStringAttribute(DATABASE_ID, EXAM_ATTEMPTS_COLLECTION_ID, 'userId', 36, true),
      databases.createDatetimeAttribute(DATABASE_ID, EXAM_ATTEMPTS_COLLECTION_ID, 'startTime', true),
      databases.createDatetimeAttribute(DATABASE_ID, EXAM_ATTEMPTS_COLLECTION_ID, 'endTime', false),
      databases.createIntegerAttribute(DATABASE_ID, EXAM_ATTEMPTS_COLLECTION_ID, 'timeSpent', false),
      databases.createStringAttribute(DATABASE_ID, EXAM_ATTEMPTS_COLLECTION_ID, 'answers', 0, false, null, true), // Array of objects
      databases.createStringAttribute(DATABASE_ID, EXAM_ATTEMPTS_COLLECTION_ID, 'status', 20, true),
      databases.createFloatAttribute(DATABASE_ID, EXAM_ATTEMPTS_COLLECTION_ID, 'score', false),
      databases.createFloatAttribute(DATABASE_ID, EXAM_ATTEMPTS_COLLECTION_ID, 'percentage', false),
      databases.createIntegerAttribute(DATABASE_ID, EXAM_ATTEMPTS_COLLECTION_ID, 'rank', false),
      databases.createStringAttribute(DATABASE_ID, EXAM_ATTEMPTS_COLLECTION_ID, 'proctoringEvents', 0, false, null, true), // Array of objects
      databases.createStringAttribute(DATABASE_ID, EXAM_ATTEMPTS_COLLECTION_ID, 'warnings', 0, false, null, true), // Array of objects
      databases.createDatetimeAttribute(DATABASE_ID, EXAM_ATTEMPTS_COLLECTION_ID, 'submittedAt', false),
      databases.createDatetimeAttribute(DATABASE_ID, EXAM_ATTEMPTS_COLLECTION_ID, 'gradedAt', false),
      databases.createStringAttribute(DATABASE_ID, EXAM_ATTEMPTS_COLLECTION_ID, 'gradedBy', 36, false), // User ID
      databases.createDatetimeAttribute(DATABASE_ID, EXAM_ATTEMPTS_COLLECTION_ID, 'createdAt', true),
      databases.createDatetimeAttribute(DATABASE_ID, EXAM_ATTEMPTS_COLLECTION_ID, 'updatedAt', true)
    ]);
    
    // Create indexes
    await Promise.all([
      databases.createIndex(DATABASE_ID, EXAM_ATTEMPTS_COLLECTION_ID, 'idx_examId', 'key', ['examId']),
      databases.createIndex(DATABASE_ID, EXAM_ATTEMPTS_COLLECTION_ID, 'idx_userId', 'key', ['userId']),
      databases.createIndex(DATABASE_ID, EXAM_ATTEMPTS_COLLECTION_ID, 'idx_status', 'key', ['status']),
      databases.createIndex(DATABASE_ID, EXAM_ATTEMPTS_COLLECTION_ID, 'idx_score', 'key', ['score']),
      databases.createIndex(DATABASE_ID, EXAM_ATTEMPTS_COLLECTION_ID, 'idx_createdAt', 'key', ['createdAt']),
      // Compound index for common queries
      databases.createIndex(DATABASE_ID, EXAM_ATTEMPTS_COLLECTION_ID, 'idx_user_exam', 'key', ['userId', 'examId'])
    ]);
    
    console.log('✅ Created Exam Attempts collection');
  } catch (error) {
    console.error('Error creating Exam Attempts collection:', error);
    throw error;
  }
}

// 4. Question Banks Collection
async function createQuestionBanksCollection() {
  const QUESTION_BANKS_COLLECTION_ID = 'question_banks';
  
  try {
    // Check if collection already exists
    try {
      await databases.get(DATABASE_ID, QUESTION_BANKS_COLLECTION_ID);
      console.log('Question Banks collection already exists');
      return;
    } catch (e) {
      // Collection doesn't exist, create it
    }
    
    // Create the collection
    await databases.createCollection(
      DATABASE_ID,
      QUESTION_BANKS_COLLECTION_ID,
      'Question Banks',
      [
        'read("any")',
        'create("users")',
        'update("users")',
        'delete("role:admin")'
      ]
    );
    
    // Add attributes
    await Promise.all([
      databases.createStringAttribute(DATABASE_ID, QUESTION_BANKS_COLLECTION_ID, 'name', 255, true),
      databases.createStringAttribute(DATABASE_ID, QUESTION_BANKS_COLLECTION_ID, 'description', 1000, false),
      databases.createStringAttribute(DATABASE_ID, QUESTION_BANKS_COLLECTION_ID, 'questions', 0, false, null, true), // Array of question IDs
      databases.createStringAttribute(DATABASE_ID, QUESTION_BANKS_COLLECTION_ID, 'tags', 0, false, null, true), // Array of strings
      databases.createBooleanAttribute(DATABASE_ID, QUESTION_BANKS_COLLECTION_ID, 'isPublic', true),
      databases.createStringAttribute(DATABASE_ID, QUESTION_BANKS_COLLECTION_ID, 'createdBy', 36, true), // User ID
      databases.createDatetimeAttribute(DATABASE_ID, QUESTION_BANKS_COLLECTION_ID, 'createdAt', true),
      databases.createDatetimeAttribute(DATABASE_ID, QUESTION_BANKS_COLLECTION_ID, 'updatedAt', true)
    ]);
    
    // Create indexes
    await Promise.all([
      databases.createIndex(DATABASE_ID, QUESTION_BANKS_COLLECTION_ID, 'idx_createdBy', 'key', ['createdBy']),
      databases.createIndex(DATABASE_ID, QUESTION_BANKS_COLLECTION_ID, 'idx_tags', 'key', ['tags'], ['array']),
      databases.createIndex(DATABASE_ID, QUESTION_BANKS_COLLECTION_ID, 'idx_isPublic', 'key', ['isPublic'])
    ]);
    
    console.log('✅ Created Question Banks collection');
  } catch (error) {
    console.error('Error creating Question Banks collection:', error);
    throw error;
  }
}

// 5. Results Collection
async function createResultsCollection() {
  const RESULTS_COLLECTION_ID = 'results';
  
  try {
    // Check if collection already exists
    try {
      await databases.get(DATABASE_ID, RESULTS_COLLECTION_ID);
      console.log('Results collection already exists');
      return;
    } catch (e) {
      // Collection doesn't exist, create it
    }
    
    // Create the collection
    await databases.createCollection(
      DATABASE_ID,
      RESULTS_COLLECTION_ID,
      'Results',
      [
        // Users can read their own results
        'read("user:{userId}")',
        // Only system and admins can create/update
        'create("role:admin")',
        'update("role:admin")',
        'delete("role:admin")'
      ]
    );
    
    // Add attributes
    await Promise.all([
      databases.createStringAttribute(DATABASE_ID, RESULTS_COLLECTION_ID, 'examAttemptId', 36, true),
      databases.createStringAttribute(DATABASE_ID, RESULTS_COLLECTION_ID, 'examId', 36, true),
      databases.createStringAttribute(DATABASE_ID, RESULTS_COLLECTION_ID, 'userId', 36, true),
      databases.createIntegerAttribute(DATABASE_ID, RESULTS_COLLECTION_ID, 'totalQuestions', true),
      databases.createIntegerAttribute(DATABASE_ID, RESULTS_COLLECTION_ID, 'attempted', true),
      databases.createIntegerAttribute(DATABASE_ID, RESULTS_COLLECTION_ID, 'correct', true),
      databases.createIntegerAttribute(DATABASE_ID, RESULTS_COLLECTION_ID, 'wrong', true),
      databases.createFloatAttribute(DATABASE_ID, RESULTS_COLLECTION_ID, 'score', true),
      databases.createFloatAttribute(DATABASE_ID, RESULTS_COLLECTION_ID, 'percentage', true),
      databases.createIntegerAttribute(DATABASE_ID, RESULTS_COLLECTION_ID, 'rank', false),
      databases.createStringAttribute(DATABASE_ID, RESULTS_COLLECTION_ID, 'responses', 0, true, null, true), // Array of objects
      databases.createStringAttribute(DATABASE_ID, RESULTS_COLLECTION_ID, 'feedback', 0, false),
      databases.createDatetimeAttribute(DATABASE_ID, RESULTS_COLLECTION_ID, 'publishedAt', false),
      databases.createDatetimeAttribute(DATABASE_ID, RESULTS_COLLECTION_ID, 'createdAt', true),
      databases.createDatetimeAttribute(DATABASE_ID, RESULTS_COLLECTION_ID, 'updatedAt', true)
    ]);
    
    // Create indexes
    await Promise.all([
      databases.createIndex(DATABASE_ID, RESULTS_COLLECTION_ID, 'idx_examId', 'key', ['examId']),
      databases.createIndex(DATABASE_ID, RESULTS_COLLECTION_ID, 'idx_userId', 'key', ['userId']),
      databases.createIndex(DATABASE_ID, RESULTS_COLLECTION_ID, 'idx_score', 'key', ['score']),
      databases.createIndex(DATABASE_ID, RESULTS_COLLECTION_ID, 'idx_percentage', 'key', ['percentage']),
      databases.createIndex(DATABASE_ID, RESULTS_COLLECTION_ID, 'idx_createdAt', 'key', ['createdAt']),
      // Compound index for common queries
      databases.createIndex(DATABASE_ID, RESULTS_COLLECTION_ID, 'idx_user_exam', 'key', ['userId', 'examId'])
    ]);
    
    console.log('✅ Created Results collection');
  } catch (error) {
    console.error('Error creating Results collection:', error);
    throw error;
  }
}

// Run the setup
setupDatabase().catch(console.error);