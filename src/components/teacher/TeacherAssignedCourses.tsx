import { useEffect, useState } from 'react';
import { BookOpen, Loader2, AlertCircle } from 'lucide-react';
import { databases } from '../../Services/appwrite';
import { Query, Models } from 'appwrite'; // Added Models import

const DATABASE_ID = '68261b6a002ba6c3b584';
const PROFILE_COLLECTION_ID = '68261bb5000a54d8652b';
const COURSES_COLLECTION_ID = '682644ed002b437582d3'; // Updated collection ID

interface Course extends Models.Document {
  title: string;
  description: string;
  duration: string;
  level: string;
  thumbnail?: string;
  category?: string;
  students?: number;
  successRate?: string;
  syllabus?: string[];
  features?: string[];
}

interface TeacherProfile extends Models.Document {
  courses?: Array<{
    $id: string;
    title: string;
  }>;
}

interface TeacherAssignedCoursesProps {
  userId: string;
}

export const TeacherAssignedCourses = ({ userId }: TeacherAssignedCoursesProps) => {
  const [assignedCourses, setAssignedCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAssignedCourses = async () => {
      if (!userId) {
        setError('User ID is required');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        
        // First, get the teacher's profile to get the assigned courses
        const teacherProfile = await databases.getDocument<TeacherProfile>(
          DATABASE_ID,
          PROFILE_COLLECTION_ID,
          userId
        );

        // Handle both string and object formats for courses
        const courses = teacherProfile.courses || [];
        const courseIds = courses.map(course => 
          typeof course === 'string' ? course : course?.$id
        ).filter(Boolean) as string[];
        
        if (courseIds.length === 0) {
          setAssignedCourses([]);
          setIsLoading(false);
          return;
        }

        // Fetch each course individually since Appwrite doesn't support array lookups with Query.equal
        const coursesPromises = courseIds.map(courseId => 
          databases.getDocument<Course>(DATABASE_ID, COURSES_COLLECTION_ID, courseId)
            .catch(err => {
              console.error(`Error fetching course ${courseId}:`, err);
              return null;
            })
        );

        const coursesResults = await Promise.all(coursesPromises);
        
        // Filter out any failed fetches and ensure we have valid Course objects
        const validCourses = coursesResults.filter((course): course is Course => 
          course !== null && 
          typeof course.title === 'string' && 
          typeof course.description === 'string' &&
          typeof course.duration === 'string' &&
          typeof course.level === 'string'
        );

        setAssignedCourses(validCourses);
        setError(null);
      } catch (err) {
        console.error('Error fetching assigned courses:', err);
        setError('Failed to load assigned courses. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      fetchAssignedCourses();
    }
  }, [userId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
        <span className="ml-2">Loading assigned courses...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-red-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading courses</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (assignedCourses.length === 0) {
    return (
      <div className="text-center py-8">
        <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No courses assigned</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          You haven't been assigned to any courses yet.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {assignedCourses.map((course) => (
        <div 
          key={course.$id}
          className="group relative bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200"
        >
          {course.thumbnail ? (
            <img
              src={course.thumbnail}
              alt={course.title}
              className="h-40 w-full object-cover"
            />
          ) : (
            <div className="h-40 w-full bg-gray-100 dark:bg-dark-700 flex items-center justify-center">
              <BookOpen className="h-12 w-12 text-gray-400" />
            </div>
          )}
          <div className="p-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1 line-clamp-1">
              {course.title}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">
              {course.description}
            </p>
            <div className="flex items-center justify-between mt-3">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                {course.level}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {course.duration}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TeacherAssignedCourses;
