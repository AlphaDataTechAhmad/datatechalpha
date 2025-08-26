import { Client, Databases, ID, Models } from 'appwrite';
import type { Course } from '../types/course';

// Appwrite configuration
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID || '68261b6a002ba6c3b584';
const COURSES_COLLECTION_ID = import.meta.env.VITE_APPWRITE_COURSES_COLLECTION_ID || '682644ed002b437582d3';

if (!DATABASE_ID || !COURSES_COLLECTION_ID) {
  console.error('Missing required Appwrite environment variables for courses');
  console.log('Using fallback values for database and collection IDs');
}


// Define the shape of course data for creation/update
export interface CourseInput {
  title: string;
  description: string;
  category: string;
  thumbnail?: string;
  price: number | string;
  duration: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  isPublished: boolean;
  instructor: string;
}

export class AppwriteService {
  private static client = new Client()
    .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID || '68261b5200198bea6bdf');

  private static databases = new Databases(AppwriteService.client);

  static async createCourse(courseData: CourseInput): Promise<Course> {
    try {
      const data = {
        title: courseData.title,
        description: courseData.description,
        category: courseData.category,
        thumbnail: courseData.thumbnail || '',
        price: Number(courseData.price) || 0,
        duration: courseData.duration,
        level: courseData.level,
        isPublished: Boolean(courseData.isPublished),
        instructor: courseData.instructor,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const response = await AppwriteService.databases.createDocument(
        DATABASE_ID,
        COURSES_COLLECTION_ID,
        ID.unique(),
        data
      );
      
      // Map the response to the Course type
      return this.mapToCourse(response);
    } catch (error: unknown) {
      throw new Error(`Failed to create course: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static mapToCourse(doc: any): Course {
    return {
      $id: doc.$id,
      $createdAt: doc.$createdAt,
      $updatedAt: doc.$updatedAt,
      $collectionId: doc.$collectionId,
      $databaseId: doc.$databaseId,
      $permissions: doc.$permissions,
      title: doc.title,
      description: doc.description,
      category: doc.category,
      thumbnail: doc.thumbnail || '',
      price: Number(doc.price) || 0,
      duration: doc.duration,
      level: doc.level,
      isPublished: Boolean(doc.isPublished),
      instructor: doc.instructor
    };
  }

  static async getCourses(): Promise<Course[]> {
    try {
      const response = await AppwriteService.databases.listDocuments(
        DATABASE_ID,
        COURSES_COLLECTION_ID,
        [
          // Add any queries here if needed
        ]
      );
      
      return response.documents.map(doc => this.mapToCourse(doc));
    } catch (error: unknown) {
      throw new Error(`Failed to fetch courses: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async deleteCourse(courseId: string): Promise<void> {
    try {
      await AppwriteService.databases.deleteDocument(
        DATABASE_ID,
        COURSES_COLLECTION_ID,
        courseId
      );
    } catch (error: unknown) {
      throw new Error(`Failed to delete course: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async updateCourse(courseId: string, data: Partial<CourseInput>): Promise<Course> {
    try {
      const updateData: Record<string, any> = { ...data };
      
      // Convert price to number if it exists
      if ('price' in updateData && updateData.price !== undefined) {
        updateData.price = Number(updateData.price) || 0;
      }
      
      // Ensure boolean for isPublished
      if ('isPublished' in updateData) {
        updateData.isPublished = Boolean(updateData.isPublished);
      }
      
      // Add updatedAt timestamp
      updateData.updatedAt = new Date().toISOString();
      
      const response = await AppwriteService.databases.updateDocument(
        DATABASE_ID,
        COURSES_COLLECTION_ID,
        courseId,
        updateData
      );
      
      return this.mapToCourse(response);
    } catch (error: unknown) {
      throw new Error(`Failed to update course: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
