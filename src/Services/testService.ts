import { databases, DATABASE_ID, TESTS_COLLECTION_ID, COURSES_COLLECTION_ID, ID, Query } from '../Services/appwrite';
import type { CourseTest, TestQuestion } from '../pages/Tests';

import type { TestQuestion as BackendTestQuestion } from '../pages/Tests';

interface TestDocument {
  $id: string;
  title: string;
  description: string;
  courseId: string;
  duration: number;
  passingScore: number;
  negativeMarking?: number;
  instructions: string[];
  questions: BackendTestQuestion[];
  sections?: {
    name: string;
    questions: BackendTestQuestion[];
  }[];
  createdBy: string;
  updatedAt: string;
  Category?: string;
}

/**
 * Create a new test in Appwrite
 */
interface CreateTestData extends Omit<CourseTest, 'id' | 'questions'> {
  questions: any[];
  $permissions?: string[];
  Category?: string;
  category?: string;
}

export const createTest = async (testData: CreateTestData, userId: string): Promise<TestDocument> => {
  try {
    console.log('Creating test with data:', testData);
    
    // Use the exact permission format required by the server
    const permissions = [
      `read("user:${userId}")`,
      `update("user:${userId}")`,
      `delete("user:${userId}")`
    ];
    
    // Prepare the document data with only the required fields
    const documentData: any = {
      title: testData.title,
      description: testData.description,
      category: testData.category,
      courseId: testData.courseId,
      duration: testData.duration,
      passingScore: testData.passingScore,
      negativeMarking: testData.negativeMarking || 0,
      instructions: testData.instructions || [],
      createdBy: userId,
      updatedAt: new Date().toISOString(),
      $permissions: permissions
    };
    
    // Format questions if they exist
    if (Array.isArray(testData.questions) && testData.questions.length > 0) {
      console.log('Processing questions:', testData.questions);
      
      // If questions is already a string, use it directly
      if (typeof testData.questions === 'string') {
        console.log('Questions is already a string, using as is');
        documentData.questions = testData.questions;
      } 
      // If it's an array of strings, join them
      else if (testData.questions.every(q => typeof q === 'string')) {
        console.log('Questions is an array of strings, joining with newlines');
        documentData.questions = testData.questions.join('\n');
      }
      // If it's an array of objects, format them properly
      else {
        console.log('Formatting array of question objects');
        const formattedQuestions = testData.questions.map((q: any) => {
          // If it's already a string, return as is
          if (typeof q === 'string') return q;
          
          // Format as a string with question and options
          let questionStr = q.text || '';
          if (Array.isArray(q.options)) {
            q.options.forEach((opt: any, index: number) => {
              const optionText = typeof opt === 'object' ? (opt.text || '') : String(opt);
              questionStr += `\n${String.fromCharCode(97 + index)}) ${optionText}`;
            });
          }
          if (q.explanation) {
            questionStr += `\nExplanation: ${q.explanation}`;
          }
          return questionStr;
        });
        
        console.log('Formatted questions as strings:', formattedQuestions);
        // Join multiple questions with double newlines
        documentData.questions = formattedQuestions.join('\n\n');
      }
    } else {
      console.log('No questions provided or empty questions array');
      documentData.questions = '';
    }
    
    console.log('Final document data being saved:', documentData);

    const test = await databases.createDocument(
      DATABASE_ID,
      TESTS_COLLECTION_ID,
      ID.unique(),
      documentData
    ) as unknown as TestDocument;

    return test;
  } catch (error) {
    console.error('Error creating test:', error);
    throw error;
  }
};

/**
 * Get a test by ID
 */
export const getTestById = async (testId: string): Promise<TestDocument> => {
  try {
    const test = await databases.getDocument(
      DATABASE_ID,
      TESTS_COLLECTION_ID,
      testId
    ) as unknown as any; // Use any type to handle the raw document

    // Parse the questions string back to an array if it exists
    if (test.questions && typeof test.questions === 'string') {
      test.questions = JSON.parse(test.questions);
    } else if (!test.questions) {
      test.questions = [];
    }

    return test as TestDocument;
  } catch (error) {
    console.error('Error getting test by ID:', error);
    throw error;
  }
};

/**
 * Get all tests for a specific course
 */
export const getTestsByCourseId = async (courseId: string): Promise<TestDocument[]> => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      TESTS_COLLECTION_ID,
      [Query.equal('courseId', courseId)]
    );
    
    return response.documents as unknown as TestDocument[];
  } catch (error) {
    console.error(`Error getting tests for course ${courseId}:`, error);
    throw error;
  }
};

/**
 * Get all tests with optional filtering
 */
export const getAllTests = async (filters: { category?: string } = {}): Promise<TestDocument[]> => {
  try {
    let queries = [];
    
    if (filters.category) {
      queries.push(Query.equal('category', filters.category));
    }
    
    const response = await databases.listDocuments(
      DATABASE_ID,
      TESTS_COLLECTION_ID,
      queries.length > 0 ? queries : undefined
    );
    
    return response.documents as unknown as TestDocument[];
  } catch (error) {
    console.error('Error getting tests:', error);
    throw error;
  }
};

/**
 * Get tests by category
 */
export const getTestsByCategory = async (category: string): Promise<TestDocument[]> => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      TESTS_COLLECTION_ID,
      [
        Query.equal('category', category)
      ]
    );
    
    return response.documents as unknown as TestDocument[];
  } catch (error) {
    console.error('Error getting tests by category:', error);
    throw error;
  }
};

/**
 * Search tests by title or description
 */
export const searchTests = async (query: string): Promise<TestDocument[]> => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      TESTS_COLLECTION_ID,
      [
        Query.search('title', query),
        Query.search('description', query)
      ]
    );
    
    return response.documents as unknown as TestDocument[];
  } catch (error) {
    console.error('Error searching tests:', error);
    throw error;
  }
};

/**
 * Update a test
 */
export const updateTest = async (
  testId: string, 
  testData: Partial<CourseTest> & { $permissions?: string[] },
  _userId: string // Prefix with _ to indicate it's intentionally unused
): Promise<TestDocument> => {
  try {
    const dataToUpdate: any = { 
      ...testData,
      updatedAt: new Date().toISOString()
    };

    // Handle questions array - convert to JSON string if it exists
    if (Array.isArray(testData.questions)) {
      dataToUpdate.questions = JSON.stringify(testData.questions);
    }
    
    // Format questions if they exist
    if (Array.isArray(dataToUpdate.questions)) {
      dataToUpdate.questions = dataToUpdate.questions.map((q: any) => ({
        ...q,
        marked: false,
        options: Array.isArray(q.options) ? q.options.map((opt: any) => 
          typeof opt === 'object' ? (opt.text || opt) : opt
        ) : [],
        hindiOptions: Array.isArray(q.options) ? q.options.map((opt: any) => 
          typeof opt === 'object' ? (opt.hindiText || '') : ''
        ) : []
      }));
    }
    
    const test = await databases.updateDocument(
      DATABASE_ID,
      TESTS_COLLECTION_ID,
      testId,
      {
        ...dataToUpdate,
        updatedAt: new Date().toISOString(),
      }
    );

    return test as unknown as TestDocument;
  } catch (error) {
    console.error('Error updating test:', error);
    throw error;
  }
};

/**
 * Delete a test
 */
export const deleteTest = async (testId: string): Promise<void> => {
  try {
    await databases.deleteDocument(
      DATABASE_ID,
      TESTS_COLLECTION_ID,
      testId
    );
  } catch (error) {
    console.error(`Error deleting test ${testId}:`, error);
    throw error;
  }
};

/**
 * Add a question to a test
 */
export const addQuestionToTest = async (
  testId: string, 
  question: Omit<TestQuestion, 'id' | 'marked'>
): Promise<TestDocument> => {
  try {
    const test = await getTestById(testId);
    const questions = test.questions || [];
    
    const newQuestion: TestQuestion = {
      ...question,
      id: questions.length > 0 ? Math.max(...questions.map(q => q.id)) + 1 : 1,
      marked: undefined
    };

    return await updateTest(testId, {
      questions: [...questions, newQuestion]
    }, test.createdBy);
  } catch (error) {
    console.error('Error adding question to test:', error);
    throw error;
  }
};

/**
 * Update a question in a test
 */
export const updateQuestionInTest = async (
  testId: string,
  questionId: number,
  updates: Partial<Omit<TestQuestion, 'id' | 'marked'>>
): Promise<TestDocument> => {
  try {
    const test = await getTestById(testId);
    const questions = test.questions || [];
    
    const updatedQuestions = questions.map(q => 
      q.id === questionId ? { ...q, ...updates } : q
    );

    return await updateTest(testId, { questions: updatedQuestions }, test.createdBy);
  } catch (error) {
    console.error('Error updating question in test:', error);
    throw error;
  }
};

/**
 * Delete a question from a test
 */
// Get all courses
export const getCourses = async (): Promise<Array<{ $id: string; name: string }>> => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COURSES_COLLECTION_ID || 'courses' // Fallback to 'courses' if not defined
    );
    return response.documents.map(doc => ({
      $id: doc.$id,
      name: doc.name || 'Unnamed Course'
    }));
  } catch (error) {
    console.error('Error fetching courses:', error);
    return [];
  }
};

export const deleteQuestionFromTest = async (
  testId: string,
  questionId: number
): Promise<TestDocument> => {
  try {
    const test = await getTestById(testId);
    const questions = (test.questions || []).filter(q => q.id !== questionId);
    
    return await updateTest(testId, { questions }, test.createdBy);
  } catch (error) {
    console.error('Error deleting question from test:', error);
    throw error;
  }
};
