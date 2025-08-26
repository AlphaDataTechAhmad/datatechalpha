import { generateTeacherIDs } from '../data/teacherIDs';
import { initializeTeacherIDs } from '../Services/teacherService';

async function main() {
  try {
    console.log('Initializing teacher IDs in the database...');
    const teacherIDs = generateTeacherIDs();
    await initializeTeacherIDs(teacherIDs);
    console.log('Teacher IDs have been successfully initialized in the database.');
  } catch (error) {
    console.error('Failed to initialize teacher IDs:', error);
    process.exit(1);
  }
}

main();
