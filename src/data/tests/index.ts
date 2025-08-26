import { TestMetadata, TestData } from '@/types/test';

// Import test data files
import dsaTest from './internship-1';
import internship2 from './internship-2';
import internship3 from './internship-3';
import internship4 from './internship-4';

// Register all test data
const allTests: TestData[] = [
  dsaTest,
  internship2,
  internship3,
  internship4
].filter((test): test is TestData => Boolean(test));

// Transform test data to metadata format
export const allTestsMetadata: TestMetadata[] = allTests.map(test => {
  const questionCount = test.sections.reduce(
    (total, section) => total + (section.questions?.length || 0), 
    0
  );
  
  return {
    testId: test.internshipId,
    title: test.title,
    description: test.description,
    duration: test.duration,
    category: test.category || 'Uncategorized',
    thumbnail: test.thumbnail || '',
    passingScore: test.passingScore || 0,
    questionCount,
    sectionCount: test.sections?.length || 0
  };
});

// Helper function to get test metadata by ID
export function getTestMetadataById(testId: string): TestMetadata | undefined {
  return allTestsMetadata.find(test => test.testId === testId);
}

// Helper to get all tests in a category
export function getTestsByCategory(category: string): TestMetadata[] {
  return allTestsMetadata.filter(test => test.category === category);
}

// Export full test data for dynamic imports
export async function getTestDataById(testId: string): Promise<TestData> {
  const test = allTests.find(t => t.testId === testId);
  if (!test) {
    throw new Error(`No test data found for test ID: ${testId}`);
  }
  return test;
}

export default {
  allTestsMetadata,
  getTestMetadataById,
  getTestsByCategory,
  getTestDataById
};
