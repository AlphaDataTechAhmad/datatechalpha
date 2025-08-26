// Test data structure
export interface TestQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  sectionId?: string;
  marks?: number;
}

export interface TestSection {
  id: string;
  title: string;
  description: string;
  questionCount?: number;
  questions: TestQuestion[];
}

export interface TestData {
  testId: string;
  title: string;
  description: string;
  duration: number; // in minutes
  category: string;
  thumbnail?: string;
  passingScore: number;
  questions: TestQuestion[]; // Array of questions
  totalQuestions: number; // Total count of questions
  instructions?: {
    generalInstructions?: string[];
    markingScheme?: Record<string, { correct: number; incorrect: number }>;
    navigationInstructions?: string[];
    importantNotes?: string[];
  };
  sections?: TestSection[]; // Optional sections for organized tests
}

// Import test data from individual test files
import generalKnowledgeTest from './tests/general-knowledge-1';
import logicalReasoningTest from './tests/log-1';
import advancedSqlTest from './tests/ads-1';
import bankingTest from './tests/banking-test-1';
import pythonTest from './tests/python-test-1';

// Helper function to count questions in a test
export const countQuestions = (test: any): number => {
  if (!test) return 0;
  
  if (test.questions) {
    return Array.isArray(test.questions) ? test.questions.length : 0;
  }
  
  if (test.sections) {
    return test.sections.reduce((total: number, section: any) => {
      return total + (section.questions?.length || 0);
    }, 0);
  }
  
  return 0;
};

const baseTestData: Omit<TestData, 'questions'>[] = [
  {
    testId: 'general-knowledge-1',
    title: 'SSC CGL - Practice Paper',
    description: 'Test your knowledge with this Test',
    duration: 60*60,
    category: 'SSC',
    thumbnail: 'https://1.bp.blogspot.com/-WxHciPtsyyI/Xql_Hxllk7I/AAAAAAAAMdw/okgXrbs9Jf8Khpy-PR0rocTrr0sOqvTqgCNcBGAsYHQ/s1600/ssc-cgl-tier-1-result.jpg',
    passingScore: 60,
    totalQuestions: 10,
  },
  {
    testId: 'banking-test-1',
    title: 'Banking Exam',
    description: 'Test your banking and financial knowledge',
    duration: 60*60,
    category: 'Banking Test Series',
    thumbnail: 'https://via.placeholder.com/300x200?text=Banking+Exam',
    passingScore: 70,
    totalQuestions: 10,
  },
  {
    testId: 'ads-1',
    title: 'Advanced SQL Test',
    description: 'Test your advanced SQL knowledge',
    duration: 60*60,
    category: 'Advanced SQL',
    thumbnail: 'https://cdn.sanity.io/images/oaglaatp/production/feb9c80a48a201140dcfa20559b73ab1b803e59b-1200x800.png?w=1200&h=800&auto=format',
    passingScore: 70,
    totalQuestions: 10,
  },
  {
    testId: 'log-1',
    title: 'Logical Reasoning',
    description: 'Test your logical reasoning skills',          
    duration: 60*60,
    category: 'Logical Reasoning',          
    thumbnail: 'https://cdn.sanity.io/images/oaglaatp/production/feb9c80a48a201140dcfa20559b73ab1b803e59b-1200x800.png?w=1200&h=800&auto=format',
    passingScore: 70,
    totalQuestions: 10,
  },
  {
    testId: 'python-test-1',
    title: 'Python Programming Test',
    description: 'Test your Python programming knowledge',
    duration: 60,
    category: 'Python Test Series',
    thumbnail: 'https://via.placeholder.com/300x200?text=Python+Test',
    passingScore: 60,
    totalQuestions: 30,
  },
];

// Map of testId to imported test data
const testDataMap: Record<string, any> = {
  'general-knowledge-1': generalKnowledgeTest,
  'log-1': logicalReasoningTest,
  'ads-1': advancedSqlTest,
  'banking-test-1': bankingTest,
  'python-test-1': pythonTest,
  // Add more test data imports as needed
};

// Create final test data with dynamic question counts and proper question arrays
export const testData: TestData[] = baseTestData.map(test => {
  const fullTestData = testDataMap[test.testId] || {};
  const questions = fullTestData.questions || [];
  const sections = fullTestData.sections || [];
  
  // Flatten all questions from sections if they exist
  const allQuestions = questions.length > 0 
    ? questions 
    : sections.flatMap(section => section.questions || []);
  
  const totalQuestions = allQuestions.length;
  
  return {
    ...test,
    ...fullTestData,
    questions: allQuestions,
    totalQuestions,
  };
});
                                                                                                                                                                                                                                                                                                                                  