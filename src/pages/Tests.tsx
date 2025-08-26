import { useEffect, useState } from 'react';
import { getTestById } from '../Services/testService';
import { courseTests } from './Testdata';

export interface TestQuestion {
  marked: any;
  id: number;
  question: string;
  options: string[];
  correctAnswer: number; // index of correct option
  explanation?: string;
  hindiQuestion?: string;  // Add Hindi translation
  hindiOptions?: string[]; // Add Hindi options
}

export interface CourseTest {
  courseId: string;
  title: string;
  description: string;
  duration: number; // in seconds
  passingScore: number; // minimum percentage to pass
  negativeMarking?: number; // marks to deduct for wrong answers
  sections?: {
    name: string;
    questions: TestQuestion[];
  }[];
  questions?: TestQuestion[]; // For non-sectioned tests
  instructions: string[];
  category?: string;
  thumbnail?: string;
  createdBy?: string;
  updatedAt?: string;
}

// Hook to fetch test data by ID
export const useTestData = (testId: string) => {
  const [test, setTest] = useState<CourseTest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchTest = async () => {
      if (!testId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const testData = await getTestById(testId);
        
        if (!testData) {
          setError(new Error('Test not found'));
          return;
        }

        // Transform the test data to match our CourseTest interface
        const transformedTest: CourseTest = {
          courseId: testData.$id,
          title: testData.title,
          description: testData.description,
          duration: testData.duration,
          passingScore: testData.passingScore,
          negativeMarking: testData.negativeMarking,
          instructions: Array.isArray(testData.instructions) 
            ? testData.instructions 
            : JSON.parse(testData.instructions || '[]'),
          questions: [],
          sections: [],
          category: testData.category,
          thumbnail: testData.thumbnail,
          createdBy: testData.createdBy,
          updatedAt: testData.updatedAt
        };

        // Handle questions and sections data (could be string or already parsed object)
        try {
          if (testData.sections) {
            transformedTest.sections = typeof testData.sections === 'string' 
              ? JSON.parse(testData.sections) 
              : testData.sections;
          }
          if (testData.questions) {
            transformedTest.questions = typeof testData.questions === 'string'
              ? JSON.parse(testData.questions)
              : testData.questions;
          }
        } catch (e) {
          console.error('Error parsing test data:', e);
          console.error('Sections data:', testData.sections);
          console.error('Questions data:', testData.questions);
          setError(new Error('Invalid test data format'));
          return;
        }

        setTest(transformedTest);
      } catch (err) {
        console.error('Error fetching test:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch test'));
      } finally {
        setLoading(false);
      }
    };

    fetchTest();
  }, [testId]);

  return { test, loading, error };
};

// Helper function to get test by course ID
export const getTestByCourseId = async (courseId: string): Promise<CourseTest | undefined> => {
  const localTest = courseTests.find(test => test.courseId === courseId);
  if (localTest) return localTest;

  // If not found locally, fetch from the backend
  try {
    const testData = await getTestById(courseId);
    if (!testData) return undefined;
    
    // Transform the test data to match the CourseTest interface
    return {
      courseId: testData.courseId || testData.$id,
      title: testData.title,
      description: testData.description,
      duration: testData.duration,
      passingScore: testData.passingScore,
      negativeMarking: testData.negativeMarking,
      instructions: testData.instructions || [
        'Read each question carefully before answering.',
        'You cannot go back to previous questions once answered.',
        'The test will auto-submit when time expires.'
      ],
      questions: testData.questions?.map((q: any, index: number) => ({
        id: q.id || index + 1,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        hindiQuestion: q.hindiQuestion,
        hindiOptions: q.hindiOptions,
        marked: undefined
      })) || [],
      sections: testData.sections?.map(section => ({
        ...section,
        questions: section.questions?.map((q: any, idx: number) => ({
          ...q,
          id: q.id || idx + 1,
          marked: undefined
        }))
      }))
    };
  } catch (err) {
    console.error('Error in getTestByCourseId:', err);
    return undefined;
  }
};
