import { databases } from '../Services/appwrite';
import { DATABASE_ID, COURSES_COLLECTION_ID } from '../Services/appwrite';
import { sqlCourses, pythonCourses, sscCourses, bankingCourses, aptitudeCourses } from '../pages/courseData';
import { ID } from 'appwrite';

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  duration: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  price: number;
  image?: string;
  thumbnail?: string;
  createdAt?: string;
  teacherId?: string;
}

// Map the course data to match the Appwrite collection schema
const mapCourseToAppwrite = (course: Course) => {
  // Validate and normalize level
  const validLevels = ['beginner', 'intermediate', 'advanced'];
  const normalizedLevel = course.level?.toLowerCase();
  const level = validLevels.includes(normalizedLevel) ? normalizedLevel : 'beginner';

  // Validate and normalize thumbnail
  const thumbnail = course.thumbnail || course.image || '';
  const validThumbnail = thumbnail.length > 50 ? thumbnail.substring(0, 50) : thumbnail;

  return {
    courseId: course.id,
    title: course.title,
    description: course.description,
    duration: course.duration,
    level,
    price: course.price || 0,
    isPublished: true,
    category: course.category || 'Uncategorized',
    image: course.image || '',
    thumbnail: validThumbnail,
    teacherId: course.teacherId || 'default-teacher',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
};

// Function to migrate a single course
const migrateCourse = async (course: Course) => {
  try {
    // Generate a valid Appwrite document ID
    const documentId = ID.unique();
    
    const courseData = mapCourseToAppwrite(course);
    
    await databases.createDocument(
      DATABASE_ID,
      COURSES_COLLECTION_ID,
      documentId,
      courseData
    );
    
    console.log(`✅ Migrated course: ${course.title}`);
    return true;
  } catch (error) {
    console.error(`❌ Error migrating course ${course.title}:`, error);
    return false;
  }
};

// Function to migrate all courses
const migrateAllCourses = async () => {
  try {
    console.log('🚀 Starting course migration...');
    
    // Combine all courses from different categories
    const allCourses = [
      ...sqlCourses,
      ...pythonCourses,
      ...sscCourses,
      ...bankingCourses,
      ...aptitudeCourses
    ];

    console.log(`📊 Found ${allCourses.length} courses to migrate`);
    
    let successCount = 0;
    let errorCount = 0;

    // Process each course
    for (const course of allCourses) {
      const result = await migrateCourse(course);
      if (result) {
        successCount++;
      } else {
        errorCount++;
      }
      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('🎉 Migration completed!');
    console.log(`✅ Successfully migrated: ${successCount} courses`);
    if (errorCount > 0) {
      console.warn(`⚠️  Failed to migrate: ${errorCount} courses`);
    }
    
    return { success: successCount, error: errorCount };
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
};

// Export the migration function
export { migrateAllCourses };

// Uncomment the line below to run the migration when this file is executed directly
// migrateAllCourses().catch(console.error);
