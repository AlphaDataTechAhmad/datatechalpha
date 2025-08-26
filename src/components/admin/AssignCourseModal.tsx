import { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { databases } from '../../Services/appwrite';
import { Query } from 'appwrite';

const DATABASE_ID = '68261b6a002ba6c3b584';
const PROFILE_COLLECTION_ID = '68261bb5000a54d8652b';
const COURSES_COLLECTION_ID = '682644ed002b437582d3'; // Updated collection ID

interface Course {
  $id: string;
  title: string;
  description: string;
}

interface AssignCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacherId: string;
  teacherName: string;
  onAssign: (courseId: string) => void;
}

export const AssignCourseModal = ({
  isOpen,
  onClose,
  teacherId,
  teacherName,
  onAssign,
}: AssignCourseModalProps) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignedCourses, setAssignedCourses] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch all courses and teacher data in parallel
        const [coursesRes, teacherData] = await Promise.all([
          databases.listDocuments(DATABASE_ID, COURSES_COLLECTION_ID, [
            Query.limit(100)
          ]),
          databases.getDocument(DATABASE_ID, PROFILE_COLLECTION_ID, teacherId)
        ]);

        setCourses(coursesRes.documents as Course[]);
        
        // Handle both array of strings and array of objects for backward compatibility
        const teacherCourses = teacherData.courses || [];
        const courseIds = Array.isArray(teacherCourses) 
          ? teacherCourses.map(c => typeof c === 'string' ? c : c?.$id).filter(Boolean)
          : [];
          
        setAssignedCourses(courseIds);
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load courses. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isOpen, teacherId]);

  const handleAssignCourse = async (courseId: string) => {
    try {
      // Get current teacher data
      const teacher = await databases.getDocument(
        DATABASE_ID,
        PROFILE_COLLECTION_ID,
        teacherId
      );

      // Initialize as array of strings (course IDs)
      const currentCourses = Array.isArray(teacher.courses) 
        ? teacher.courses.filter(Boolean) // Ensure we don't have any null/undefined values
        : [];

      // Check if course is already assigned
      const isAssigned = currentCourses.includes(courseId);
      
      let updatedCourses;
      if (isAssigned) {
        updatedCourses = currentCourses.filter(id => id !== courseId);
      } else {
        updatedCourses = [...currentCourses, courseId];
      }

      // Update the document with the new courses array
      await databases.updateDocument(
        DATABASE_ID,
        PROFILE_COLLECTION_ID,
        teacherId,
        { 
          courses: updatedCourses,
          $permissions: teacher.$permissions // Preserve existing permissions
        }
      );

      // Update local state
      setAssignedCourses(updatedCourses);
      onAssign(courseId);
    } catch (err) {
      console.error('Error updating courses:', err);
      setError('Failed to update course assignment. Please check console for details.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-dark-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              Assign Courses to {teacherName}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X size={24} />
            </button>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <div className="space-y-3">
              {courses.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400">No courses available</p>
              ) : (
                <div className="space-y-2">
                  {courses.map((course) => (
                    <div
                      key={course.$id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:border-dark-700 dark:hover:bg-dark-700"
                    >
                      <div>
                        <h3 className="font-medium">{course.title}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                          {course.description}
                        </p>
                      </div>
                      <button
                        onClick={() => handleAssignCourse(course.$id)}
                        className={`p-2 rounded-full ${
                          assignedCourses.includes(course.$id)
                            ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                            : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-600'
                        }`}
                        title={
                          assignedCourses.includes(course.$id)
                            ? 'Unassign course'
                            : 'Assign course'
                        }
                      >
                        <Check
                          size={20}
                          className={assignedCourses.includes(course.$id) ? 'opacity-100' : 'opacity-0'}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-dark-700 dark:border-dark-600 dark:text-gray-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignCourseModal;
