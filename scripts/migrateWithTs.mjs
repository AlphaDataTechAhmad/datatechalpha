import { createSourceFile, ScriptTarget, isExportAssignment, isVariableStatement, isVariableDeclarationList, isVariableDeclaration, isArrayLiteralExpression, isObjectLiteralExpression, isPropertyAssignment, isStringLiteral, isNumericLiteral, isIdentifier, isArrayTypeNode } from 'typescript';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import dotenv from 'dotenv';
import { Client, Databases, ID } from 'appwrite';

// Configure environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../.env') });

// Initialize the Appwrite client
const client = new Client()
  .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
  .setProject(process.env.VITE_APPWRITE_PROJECT_ID || '68261b5200198bea6bdf');

const databases = new Databases(client);

// Collection ID for tests
const TESTS_COLLECTION_ID = process.env.APPWRITE_TESTS_COLLECTION_ID || '686520c7001bd5bb53b3';
const DATABASE_ID = process.env.VITE_APPWRITE_DATABASE_ID || '68261b6a002ba6c3b584';

// Helper function to parse TypeScript value to JavaScript
function parseValue(node) {
  if (isStringLiteral(node)) {
    return node.text;
  } else if (isNumericLiteral(node)) {
    return parseFloat(node.text);
  } else if (node.kind === 110) { // TrueKeyword
    return true;
  } else if (node.kind === 95) { // FalseKeyword
    return false;
  } else if (node.kind === 104) { // NullKeyword
    return null;
  } else if (isArrayLiteralExpression(node)) {
    return node.elements.map(parseValue);
  } else if (isObjectLiteralExpression(node)) {
    const obj = {};
    for (const prop of node.properties) {
      if (isPropertyAssignment(prop)) {
        const key = prop.name.text || prop.name.escapedText.toString();
        obj[key] = parseValue(prop.initializer);
      }
    }
    return obj;
  }
  return undefined;
}

// Read and parse the test data using TypeScript compiler
function getTestData() {
  const testDataPath = resolve(__dirname, '../src/pages/Tests.tsx');
  const fileContent = readFileSync(testDataPath, 'utf8');
  
  // Parse the TypeScript file
  const sourceFile = createSourceFile(
    'Tests.tsx',
    fileContent,
    ScriptTarget.Latest,
    true
  );

  // Find the courseTests export
  for (const statement of sourceFile.statements) {
    if (isVariableStatement(statement)) {
      for (const decl of statement.declarationList.declarations) {
        if (decl.name.text === 'courseTests' && decl.initializer) {
          if (isArrayLiteralExpression(decl.initializer)) {
            return decl.initializer.elements.map(parseValue);
          }
        }
      }
    }
  }
  
  throw new Error('Could not find courseTests array in Tests.tsx');
}

// Function to migrate tests
async function migrateTests() {
  console.log('Starting test migration...');
  
  try {
    const tests = getTestData();
    console.log(`Found ${tests.length} tests to migrate`);
    
    for (const test of tests) {
      console.log(`Migrating test: ${test.title}`);
      
      // Ensure instructions is a string array
      let instructions = [];
      if (Array.isArray(test.instructions)) {
        instructions = test.instructions.map(String);
      } else if (test.instructions) {
        instructions = [String(test.instructions)];
      }
      
      // Ensure negativeMarking is an integer
      const negativeMarking = Number.isInteger(test.negativeMarking) 
        ? test.negativeMarking 
        : 0;

      // Process questions - keep them in sections if available, otherwise as a flat list
      let questionsData = [];
      let sectionsData = [];
      
      if (test.sections && test.sections.length > 0) {
        // If test has sections, organize questions by sections
        test.sections.forEach(section => {
          if (section.questions && section.questions.length > 0) {
            const sectionQuestions = section.questions.map(q => ({
              id: q.id || Math.random().toString(36).substr(2, 9),
              text: q.question || '',
              type: 'multiple_choice',
              points: 1,
              correctAnswer: q.correctAnswer || 0
            }));
            
            questionsData = [...questionsData, ...sectionQuestions];
            
            sectionsData.push({
              name: section.name || 'Unnamed Section',
              description: section.description || '',
              questionIds: sectionQuestions.map(q => q.id)
            });
          }
        });
      } else {
        // If no sections, process as a flat list
        questionsData = (test.questions || []).map(q => ({
          id: q.id || Math.random().toString(36).substr(2, 9),
          text: q.question || '',
          type: 'multiple_choice',
          points: 1,
          correctAnswer: q.correctAnswer || 0
        }));
      }
      
      // Stringify questions with increased limit
      let questionsStr = JSON.stringify(questionsData);
      if (questionsStr.length > 50000) {
        console.warn(`Warning: Questions for test "${test.title}" exceed 50000 characters. Truncating.`);
        questionsStr = questionsStr.substring(0, 50000);
      }

      // Process sections
      let sectionsStr = JSON.stringify(sectionsData);
      if (sectionsStr.length > 1000) {
        console.warn(`Warning: Sections for test "${test.title}" exceed 1000 characters. Truncating.`);
        sectionsStr = sectionsStr.substring(0, 1000);
      }

      // Process options
      const allOptions = {};
      const processQuestions = (questions) => {
        (questions || []).forEach(q => {
          if (q.id && q.options) {
            allOptions[q.id] = {
              choices: q.options.map((text, index) => ({
                id: index + 1,
                text: String(text || '').substring(0, 500) // Limit option text length
              })),
              correctAnswer: q.correctAnswer || 0
            };
          }
        });
      };
      
      // Process questions from sections or flat list
      if (test.sections && test.sections.length > 0) {
        test.sections.forEach(section => processQuestions(section.questions));
      } else {
        processQuestions(test.questions);
      }
      
      // Stringify options with increased limit
      let optionsStr = JSON.stringify(allOptions);
      if (optionsStr.length > 20000) {
        console.warn(`Warning: Options for test "${test.title}" exceed 20000 characters. Truncating.`);
        optionsStr = optionsStr.substring(0, 20000);
      }

      const testData = {
        title: String(test.title || '').substring(0, 255), // Ensure string and limit length
        description: String(test.description || '').substring(0, 1000), // Ensure string and limit length
        courseId: String(test.courseId || ''),
        duration: Math.abs(Math.floor(Number(test.duration) || 1800)), // Ensure positive integer
        passingScore: Math.min(100, Math.max(0, Math.floor(Number(test.passingScore) || 70))), // Ensure between 0-100
        negativeMarking: Math.max(0, negativeMarking), // Ensure non-negative
        instructions: instructions,
        questions: questionsStr,
        sections: sectionsStr,
        options: optionsStr, // Add options field
        createdBy: 'system',
        updatedAt: new Date().toISOString(),
      };

      try {
        await databases.createDocument(
          DATABASE_ID,
          TESTS_COLLECTION_ID,
          ID.unique(),
          testData
        );
        console.log(`✓ Successfully migrated: ${test.title}`);
      } catch (error) {
        console.error(`Error migrating test ${test.title}:`, error.message);
      }
      
      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('Migration completed!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
migrateTests();
