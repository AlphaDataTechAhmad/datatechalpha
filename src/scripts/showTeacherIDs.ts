// Script to generate and display teacher IDs
import { generateTeacherIDs } from '../data/teacherIDs';

// Generate teacher IDs
const teacherIDs = generateTeacherIDs();

// Display the generated teacher IDs
console.log('\n=== Teacher IDs (50 total) ===');
console.log(teacherIDs.map((t, i) => `${i + 1}. ${t.teacher_id}`).join('\n'));

// Also log them in a copy-paste friendly format
console.log('\nCopy-paste format:');
console.log(JSON.stringify(teacherIDs.map(t => t.teacher_id), null, 2));
