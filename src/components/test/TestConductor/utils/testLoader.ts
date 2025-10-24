import { TestData } from '@/types/test';

// Import test data dynamically
console.log('testLoader: Importing test modules...');
const testModules = import.meta.glob('@/data/tests/*.ts', { eager: true });
console.log('testLoader: Available test modules:', Object.keys(testModules));

// Helper to find and load test data
export const loadTestData = (testId: string): TestData | null => {
  console.log('testLoader: loadTestData called with testId:', testId);
  try {
    console.log('testLoader: Loading test data for testId:', testId);
    
    if (!testId) {
      console.error('testLoader: No testId provided');
      return null;
    }
    
    // Remove file extension if present and convert to lowercase for case-insensitive matching
    const cleanTestId = testId.replace(/\.ts$/, '').toLowerCase();
    console.log('testLoader: Cleaned testId:', cleanTestId);
    
    // Get all available test files
    const testFiles = Object.keys(testModules);
    console.log('testLoader: Available test files:', testFiles);
    
    // Try to find the test file (case-insensitive match)
    const testFile = testFiles.find(file => {
      const fileName = file.toLowerCase().split('/').pop()?.replace(/\.ts$/, '');
      console.log('testLoader: Checking file:', file, 'fileName:', fileName);
      return fileName === cleanTestId;
    });
    
    console.log('testLoader: Found matching test file:', testFile);
    
    if (testFile) {
      console.log('testLoader: Test file found, loading module...');
      const module = testModules[testFile] as { default: any };
      
      if (module?.default) {
        const testData = module.default;
        console.log('Successfully loaded test data:', testData);
        
        // Transform the test data to match the TestData interface
        const sections = testData.sections?.map((section: any, index: number) => ({
          id: section.id || `section-${index + 1}`,
          title: section.title || `Section ${index + 1}`,
          description: section.description || '',
          questionCount: section.questions?.length || 0,
          questions: (section.questions || []).map((q: any, qIndex: number) => ({
            id: q.id || `q-${index + 1}-${qIndex + 1}`,
            question: q.question || 'Question text missing',
            options: q.options || [],
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            marks: q.marks || 1,
            sectionId: section.id || `section-${index + 1}`
          }))
        })) || [];

        // For backward compatibility, include questions at the root level
        const allQuestions = sections.flatMap(section => section.questions);

        return {
          internshipId: testData.internshipId || '', // Required by interface
          testId: testData.testId || cleanTestId,
          title: testData.title || 'Untitled Test',
          description: testData.description || '',
          category: testData.category || 'General',
          duration: testData.duration || 60,
          passingScore: testData.passingScore || 50,
          instructions: {
            generalInstructions: testData.instructions?.generalInstructions || [],
            importantNotes: testData.instructions?.importantNotes || []
          },
          sections: sections,
          questions: allQuestions // For backward compatibility
        };
      }
    }
    
    console.error('testLoader: No matching test file found for testId:', testId);
    console.log('testLoader: Available test files:', Object.keys(testModules).map(f => f.split('/').pop()));
    return null;
  } catch (error) {
    console.error('Error loading test data:', error);
    return null;
  }
};
