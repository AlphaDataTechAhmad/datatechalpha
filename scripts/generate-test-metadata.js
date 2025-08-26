const fs = require('fs');
const path = require('path');
const glob = require('glob');

const TEST_FILES_PATTERN = path.join(__dirname, '../src/data/tests/*.ts');
const OUTPUT_FILE = path.join(__dirname, '../src/data/tests/index.ts');

console.log('Generating test metadata...');

// Find all test files
const testFiles = glob.sync(TEST_FILES_PATTERN).filter(
  file => !file.endsWith('index.ts')
);

const testMetadata = [];

// Process each test file
for (const file of testFiles) {
  try {
    // This is a simple approach - in a real app, you might want to use a proper TypeScript parser
    const content = fs.readFileSync(file, 'utf-8');
    const testIdMatch = content.match(/testId: ['"]([^'"]+)['"]/);
    const titleMatch = content.match(/title: ['"]([^'"]+)['"]/);
    const descriptionMatch = content.match(/description: ['"]([^'"]+)['"]/);
    const durationMatch = content.match(/duration: (\d+)/);
    const categoryMatch = content.match(/category: ['"]([^'"]+)['"]/);
    const thumbnailMatch = content.match(/thumbnail: ['"]([^'"]+)['"]/);
    const passingScoreMatch = content.match(/passingScore: (\d+)/);
    const questionCount = (content.match(/question:/g) || []).length;

    if (testIdMatch && titleMatch) {
      testMetadata.push({
        testId: testIdMatch[1],
        title: titleMatch[1],
        description: descriptionMatch ? descriptionMatch[1] : '',
        duration: durationMatch ? parseInt(durationMatch[1], 10) : 30,
        category: categoryMatch ? categoryMatch[1] : 'General',
        thumbnail: thumbnailMatch ? thumbnailMatch[1] : undefined,
        passingScore: passingScoreMatch ? parseInt(passingScoreMatch[1], 10) : 60,
        questionCount,
      });
    }
  } catch (error) {
    console.error(`Error processing ${file}:`, error);
  }
}

// Generate the index.ts content
const indexContent = `// Auto-generated file - DO NOT EDIT
import { TestMetadata } from '@/types/test';

export const allTestsMetadata: TestMetadata[] = ${JSON.stringify(testMetadata, null, 2)};

export function getTestMetadataById(testId: string): TestMetadata | undefined {
  return allTestsMetadata.find(test => test.testId === testId);
}

export function getTestsByCategory(category: string): TestMetadata[] {
  return allTestsMetadata.filter(test => test.category === category);
}
`;

// Write the index.ts file
fs.writeFileSync(OUTPUT_FILE, indexContent);

console.log(`Generated metadata for ${testMetadata.length} tests in ${OUTPUT_FILE}`);
