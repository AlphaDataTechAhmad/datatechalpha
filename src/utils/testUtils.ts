import { TestData, TestMetadata } from '@/types/test';

// This will be populated with all test metadata at build time
const testMetadataCache: Record<string, TestMetadata> = {};

// Load test metadata (fast, loads only metadata, not questions)
export async function getTestMetadata(): Promise<TestMetadata[]> {
  if (Object.keys(testMetadataCache).length === 0) {
    // In a real app, this would be an API call or dynamic import
    // For now, we'll use require.context at build time
    const testModules = import.meta.glob('../data/tests/*.ts');
    
    for (const path in testModules) {
      const testModule = await testModules[path]();
      const testData: TestData = testModule.default;
      
      testMetadataCache[testData.testId] = {
        testId: testData.testId,
        title: testData.title,
        description: testData.description,
        duration: testData.duration,
        category: testData.category,
        thumbnail: testData.thumbnail,
        passingScore: testData.passingScore,
        questionCount: testData.questions.length,
      };
    }
  }
  
  return Object.values(testMetadataCache);
}

// Load full test data including questions (slower, loads all test data)
export async function getTestById(testId: string): Promise<TestData | null> {
  console.log(`Attempting to load test with ID: ${testId}`);
  
  if (!testId) {
    console.error('No testId provided to getTestById');
    return null;
  }

  try {
    console.log(`Attempting to import test file: @/data/tests/${testId}.ts`);
    
    // Dynamic import of the test file
    const testModule = await import(`@/data/tests/${testId}.ts`);
    
    if (!testModule || !testModule.default) {
      console.error(`Test module for ${testId} is empty or missing default export`, testModule);
      return null;
    }
    
    const testData = testModule.default as TestData;
    console.log(`Successfully loaded test: ${testData.title} (ID: ${testData.testId})`);
    
    return testData;
  } catch (error) {
    console.error(`Failed to load test ${testId}:`, error);
    
    // Log specific error details
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
      
      // Check for common issues
      if (error.message.includes('Cannot find module')) {
        console.error(`Test file not found: ${testId}.ts - Please check the file exists in src/data/tests/`);
      } else if (error.message.includes('Unexpected token')) {
        console.error('Syntax error in test file - please check the file for errors');
      }
    }
    
    return null;
  }
}

// Get test metadata by ID (fast, doesn't load questions)
export async function getTestMetadataById(testId: string): Promise<TestMetadata | null> {
  const allTests = await getTestMetadata();
  return allTests.find(test => test.testId === testId) || null;
}
