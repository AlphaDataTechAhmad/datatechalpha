import { useState, useEffect } from 'react';
import { databases } from '../Services/appwrite';
import { DATABASE_ID, TESTS_COLLECTION_ID } from '../appwriteConfig';
import { CourseTest } from '../components/test/TestConductor';

interface AppwriteDocument extends Omit<CourseTest, 'questions'> {
  $id: string;
  $collectionId: string;
  $databaseId: string;
  $createdAt: string;
  $updatedAt: string;
  $permissions: string[];
  options?: Record<string, any>;
  questions?: any[];
}

interface UseTestDataResult {
  test: CourseTest | null;
  loading: boolean;
  error: Error | null;
}

export const useTestData = (testId: string): UseTestDataResult => {
  const [test, setTest] = useState<CourseTest | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchTest = async () => {
      if (!testId) {
        setError(new Error('Test ID is required'));
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const testData = await databases.getDocument<AppwriteDocument>(
          DATABASE_ID,
          TESTS_COLLECTION_ID,
          testId
        );
        
        console.log('Raw test data from DB:', testData);
        
        // Transform the test data to match the CourseTest interface
        const formattedTest: CourseTest = {
          id: testData.$id,
          title: testData.title,
          description: testData.description || '',
          duration: Number(testData.duration) || 60,
          questions: [],
          negativeMarking: Boolean(testData.negativeMarking),
          instructions: testData.instructions || 'Read all questions carefully before answering.',
          totalMarks: Number(testData.totalMarks) || 0
        };

        // Debug log the structure of testData
        console.log('Test data structure:', {
          hasQuestions: Array.isArray(testData.questions),
          questionsCount: Array.isArray(testData.questions) ? testData.questions.length : 0,
          questionsSample: Array.isArray(testData.questions) ? testData.questions.slice(0, 2) : 'Not an array',
          hasOptions: testData.options !== undefined,
          optionsKeys: testData.options ? Object.keys(testData.options) : []
        });

        // Parse questions from JSON string
        let questionsArray = [];
        try {
          questionsArray = typeof testData.questions === 'string' 
            ? JSON.parse(testData.questions) 
            : testData.questions || [];
          
          console.log('Parsed questions:', questionsArray);
        } catch (e) {
          console.error('Error parsing questions:', e);
          questionsArray = [];
        }

        // Parse options from JSON string if it exists
        let optionsMap = {};
        try {
          optionsMap = typeof testData.options === 'string'
            ? JSON.parse(testData.options)
            : testData.options || {};
          
          console.log('Parsed options:', optionsMap);
        } catch (e) {
          console.error('Error parsing options:', e);
        }

        // Process questions if we have them
        if (Array.isArray(questionsArray) && questionsArray.length > 0) {
          console.log('Processing', questionsArray.length, 'questions...');
          
          formattedTest.questions = questionsArray.map((q: any) => {
            const questionId = q.id?.toString();
            const questionOptions = [];
            
            // Get options from the options map using question ID
            if (optionsMap[questionId]?.choices) {
              questionOptions.push(...optionsMap[questionId].choices.map((c: any) => 
                typeof c === 'object' ? c.text || c.id?.toString() || '' : String(c)
              ));
            }
            
            // Fallback to any options in the question object
            if (questionOptions.length === 0 && q.choices) {
              questionOptions.push(...(Array.isArray(q.choices) ? q.choices : []).map(String));
            }

            const questionData = {
              id: questionId || Math.random().toString(),
              question: q.text || q.question || '',
              options: questionOptions,
              correctAnswer: q.correctAnswer || 0,
              marks: q.points || 1,
              negativeMarking: q.negativeMarking || 0
            };

            console.log(`Processed question ${questionData.id}:`, questionData);
            return questionData;
          });
        } else {
          console.warn('No valid questions array found in test data');
        }
        
        console.log('Extracted questions:', formattedTest.questions);
        
        setTest(formattedTest);
        setError(null);
      } catch (err) {
        console.error('Error fetching test:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch test'));
        setTest(null);
      } finally {
        setLoading(false);
      }
    };

    fetchTest();
  }, [testId]);

  return { test, loading, error };
};

export default useTestData;
