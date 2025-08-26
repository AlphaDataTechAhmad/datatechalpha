import { Client, Databases, ID } from 'appwrite';

// Initialize the client
const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1') // Your Appwrite endpoint
    .setProject('68261b5200198bea6bdf'); // Your project ID

const databases = new Databases(client);
const databaseId = '68261b6a002ba6c3b584'; // Your database ID
const collectionId = '682644ed002b437582d3'; // Your collection ID
const currentDate = new Date().toISOString();

// The courses to upload
const coursesToUpload = [
  // SSC CPO
  {
    courseId: ID.unique(),
    title: 'SSC CPO',
    description: 'Complete preparation for Sub-Inspector exams in Delhi Police, BSF, CISF, CRPF, ITBP & SSB',
    duration: '6 months',
    price: 1999,
    level: 'beginner',
    image: 'https://your-image-url/ssc-cpo.jpg',
    updatedAt: currentDate,
    createdAt: currentDate,
  },
  {
    courseId: ID.unique(),
    title: 'Departmental Promotion Exams (LDC to UDC etc.)',
    description: 'Focused preparation for internal promotion exams conducted by departments',
    duration: '2–3 months',
    price: 1999,
    level: 'beginner',
    image: 'https://your-image-url/dept-promo.jpg',
    updatedAt: currentDate,
    createdAt: currentDate,
  },
];

// Function to upload courses
async function uploadCourses() {
    try {
      for (const course of coursesToUpload) {
        try {
          // Create document with auto-generated ID
          const response = await databases.createDocument(
            databaseId,
            collectionId,
            ID.unique(), // Let Appwrite generate a unique ID
            course
          );
          console.log(`✅ Successfully uploaded: ${course.title} (ID: ${response.$id})`);
        } catch (error) {
          console.error(`❌ Error uploading course ${course.title}:`, error.message);
        }
      }
      console.log('🎉 All courses processed!');
    } catch (error) {
      console.error('❌ Error in upload process:', error.message);
    }
  }
  
  // Execute the upload
  uploadCourses();