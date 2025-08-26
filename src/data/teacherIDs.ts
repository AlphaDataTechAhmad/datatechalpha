// This file contains the list of valid teacher IDs that can be used for teacher signup
// Each teacher ID can only be used once

interface TeacherID {
  teacher_id: string;
  is_used: boolean;
  claimed_by?: string; // Will store the user ID of the teacher who claimed this ID
  claimed_at?: string;
}

// Predefined list of teacher IDs
const TEACHER_IDS = [
  'TECH10094827', 'TECH10036104', 'TECH10052081', 'TECH10077395', 'TECH10014938',
  'TECH10043706', 'TECH10082163', 'TECH10060590', 'TECH10090371', 'TECH10026749',
  'TECH10073601', 'TECH10019834', 'TECH10059427', 'TECH10087450', 'TECH10031197',
  'TECH10048260', 'TECH10079026', 'TECH10094235', 'TECH10025683', 'TECH10068412',
  'TECH10017593', 'TECH10090386', 'TECH10033820', 'TECH10064129', 'TECH10047013',
  'TECH10088231', 'TECH10013670', 'TECH10076549', 'TECH10030891', 'TECH10099244',
  'TECH10041387', 'TECH10057090', 'TECH10065938', 'TECH10023769', 'TECH10070415',
  'TECH10082340', 'TECH10019205', 'TECH10068394', 'TECH10049578', 'TECH10010539',
  'TECH10093108', 'TECH10031826', 'TECH10084912', 'TECH10027463', 'TECH10074250',
  'TECH10016137', 'TECH10068293', 'TECH10040985', 'TECH10059732', 'TECH10072960'
];

// Convert the list of IDs into TeacherID objects
export const generateTeacherIDs = (): TeacherID[] => {
  return TEACHER_IDS.map(teacher_id => ({
    teacher_id,
    is_used: false
  }));
};

const teacherIDs = generateTeacherIDs();

// Log the teacher IDs for reference
console.log('Teacher IDs:');
console.log(teacherIDs.map(t => t.teacher_id).join('\n'));
console.log(`Total: ${teacherIDs.length} teacher IDs loaded`);

export default teacherIDs;
