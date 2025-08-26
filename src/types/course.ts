// Appwrite document fields
type AppwriteDocument = {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  $collectionId: string;
  $databaseId: string;
  $permissions: string[];
};

export interface Course extends AppwriteDocument {
  // Course fields
  title: string;
  description: string;
  category: string;
  thumbnail: string;
  price: number;
  duration: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  isPublished: boolean;
  instructor: string;
}

// Type for creating/updating a course (excludes Appwrite metadata)
export type CourseInput = Omit<Course, keyof AppwriteDocument>;

// Type for the form data (can be partial for updates)
export type CourseFormData = Partial<CourseInput> & {
  title: string;  // Required fields
  description: string;
  category: string;
  price: number;
};
