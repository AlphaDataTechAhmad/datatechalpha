import { useState, useEffect, useCallback } from 'react';
import { Search, Trash2, Mail, Loader2, AlertCircle, PlusCircle } from 'lucide-react';
import { databases, client } from '../../Services/appwrite';
import { RealtimeResponseEvent } from 'appwrite';
import { Query } from 'appwrite';
import AssignCourseModal from '../../components/admin/AssignCourseModal';
import { getTeacherIDByUser } from '../../Services/teacherService';

// Constants for database
const DATABASE_ID = '68261b6a002ba6c3b584';
const PROFILE_COLLECTION_ID = '68261bb5000a54d8652b';
const COURSES_COLLECTION_ID = '682644ed002b437582d3';

// Define base Course interface
interface BaseCourse {
  $id: string;
  title: string;
  description?: string;
}

// Type that represents either a course ID (string) or a full course object
type Course = string | BaseCourse;

// Teacher type for our application
type Teacher = {
  $id: string;
  $createdAt: string;
  $permissions: string[];
  name: string;
  email: string;
  teacherId: string;
  courses?: Course[];
  students: number;
  is_active: boolean;
  role?: string;
  status: 'active' | 'inactive';
};

const TeachersPage = () => {
  // State
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [filteredTeachers, setFilteredTeachers] = useState<Teacher[]>([]);
  const [allCourses, setAllCourses] = useState<BaseCourse[]>([]);
  const [realtimeSubscription, setRealtimeSubscription] = useState<(() => void) | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<{ id: string; name: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Helper function to get course ID from either string or Course object
  const getCourseId = (course: Course): string => {
    return typeof course === 'string' ? course : course?.$id || '';
  };
  
  // Helper to check if a value is a Course object
  const isCourseObject = (course: Course): course is BaseCourse => {
    return typeof course === 'object' && course !== null && '$id' in course;
  };
  
  // Helper to get course title
  const getCourseTitle = (course: Course): string => {
    if (typeof course === 'string') return 'Unknown Course';
    return course.title || 'Untitled Course';
  };

  // Setup real-time subscription
  const setupRealtimeSubscription = useCallback(() => {
    // Unsubscribe from previous subscription if exists
    if (realtimeSubscription) {
      realtimeSubscription();
    }

    // Subscribe to changes in the profiles collection
    const unsubscribe = client.subscribe(
      `databases.${DATABASE_ID}.collections.${PROFILE_COLLECTION_ID}.documents`,
      (response: RealtimeResponseEvent<any>) => {
        // Handle document update
        if (response.events.includes(`databases.${DATABASE_ID}.collections.${PROFILE_COLLECTION_ID}.documents.*.update`)) {
          const updatedTeacher = response.payload as TeacherDocument;
          
          // Update the teacher in the local state
          setTeachers(prevTeachers => 
            prevTeachers.map(teacher => 
              teacher.$id === updatedTeacher.$id 
                ? { 
                    ...teacher, 
                    is_active: updatedTeacher.is_active,
                    status: updatedTeacher.is_active ? 'active' : 'inactive'
                  } 
                : teacher
            )
          );
        }
      }
    );

    setRealtimeSubscription(() => unsubscribe);
    return unsubscribe;
  }, [realtimeSubscription]);

  // Cleanup real-time subscription on unmount
  useEffect(() => {
    const unsubscribe = setupRealtimeSubscription();
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [setupRealtimeSubscription]);

  // Fetch all teachers
  const fetchTeachers = async () => {
    try {
      setIsLoading(true);
      const response = await databases.listDocuments(
        DATABASE_ID,
        PROFILE_COLLECTION_ID,
        [Query.equal('role', 'teacher'), Query.limit(100)]
      );

      const teachersData: Teacher[] = await Promise.all(
        response.documents.map(async (doc: any) => {
          let teacherId = doc.teacherId || '';
          if (!teacherId) {
            try {
              const id = await getTeacherIDByUser(doc.$id);
              teacherId = id || 'N/A';
            } catch (err) {
              console.error(`Error fetching teacher ID for ${doc.$id}:`, err);
              teacherId = 'Error';
            }
          }
          
          // Ensure courses is an array and filter out any invalid entries
          const courses = (Array.isArray(doc.courses) 
            ? doc.courses.filter((course: Course) => {
                const id = getCourseId(course);
                return id && typeof id === 'string' && id.length > 0;
              })
            : []) as Course[];
          
          // Create a properly typed teacher object
          const teacher: Teacher = {
            $id: doc.$id,
            $createdAt: doc.$createdAt,
            $permissions: doc.$permissions || [],
            name: doc.name || 'No Name',
            email: doc.email || 'No Email',
            teacherId,
            courses,
            status: doc.is_active ? 'active' : 'inactive',
            students: doc.students || 0,
            is_active: !!doc.is_active,
            role: doc.role,
          };
          
          return teacher;
        })
      );

      setTeachers(teachersData);
      setFilteredTeachers(teachersData);
      setError(null);
    } catch (err) {
      console.error('Error fetching teachers:', err);
      setError('Failed to load teachers. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch all courses (keeping this for future use if needed)
  const fetchCourses = async () => {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COURSES_COLLECTION_ID,
        [Query.limit(100)]
      );
      // Cast the response to BaseCourse array
      const courses = response.documents.map((doc: any) => ({
        $id: doc.$id,
        title: doc.title || '',
        description: doc.description
      }));
      setAllCourses(courses);
    } catch (err) {
      console.error('Error fetching courses:', err);
      // Don't show error to user for this background operation
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchTeachers();
    fetchCourses();
  }, []);

  // Filter teachers based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredTeachers(teachers);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = teachers.filter(
        (teacher) =>
          teacher.name?.toLowerCase().includes(query) ||
          teacher.email?.toLowerCase().includes(query) ||
          teacher.teacherId?.toLowerCase().includes(query)
      );
      setFilteredTeachers(filtered);
    }
  }, [searchQuery, teachers]);

  // Handle course assignment
  const handleAssignCourse = async (courseId: string) => {
    if (!selectedTeacher) return;

    try {
      // Get the current teacher data from our local state
      const teacher = teachers.find(t => t.$id === selectedTeacher.id);
      if (!teacher) return;

      // Handle both array of strings and array of objects for backward compatibility
      const currentCourses = Array.isArray(teacher.courses) 
        ? teacher.courses.map(getCourseId).filter(Boolean)
        : [];
      
      const isAssigned = currentCourses.includes(courseId);
      let updatedCourses: string[]; // Store only course IDs

      if (isAssigned) {
        updatedCourses = currentCourses.filter(id => id !== courseId);
      } else {
        updatedCourses = [...currentCourses, courseId];
      }

      // Update in database
      await databases.updateDocument(
        DATABASE_ID,
        PROFILE_COLLECTION_ID,
        selectedTeacher.id,
        { 
          courses: updatedCourses,
          $permissions: teacher.$permissions // Preserve existing permissions
        }
      );

      // Create an update function to avoid code duplication
      const updateTeacherCourses = (t: Teacher) => {
        if (t.$id !== selectedTeacher.id) return t;
        
        // If we have course objects, update the ones that match the updated courses
        if (Array.isArray(t.courses) && t.courses.length > 0 && isCourseObject(t.courses[0])) {
          const updatedCourseObjects = (t.courses as BaseCourse[])
            .filter(course => updatedCourses.includes(course.$id));
            
          // Add any new courses that don't have objects yet
          updatedCourses.forEach(courseId => {
            if (!updatedCourseObjects.some(c => c.$id === courseId)) {
              updatedCourseObjects.push({ $id: courseId, title: `Course ${courseId.substring(0, 4)}` });
            }
          });
          return { ...t, courses: updatedCourseObjects };
        }
        
        // Otherwise just update with the course IDs
        return { ...t, courses: updatedCourses };
      };

      // Update both teachers and filteredTeachers states
      setTeachers(prev => prev.map(updateTeacherCourses));
      setFilteredTeachers(prev => prev.map(updateTeacherCourses));

      // Show success message
      alert(
        `Course ${isAssigned ? 'unassigned from' : 'assigned to'} ${
          selectedTeacher.name
        } successfully`
      );
    } catch (error) {
      console.error('Error assigning course:', error);
      setError('Failed to update course assignment. Please try again.');
    }
  };

  // Toggle teacher active status
  const toggleTeacherStatus = async (teacher: Teacher) => {
    if (!confirm(`Are you sure you want to ${teacher.is_active ? 'deactivate' : 'activate'} ${teacher.name}?`)) {
      return;
    }
    
    try {
      const updatedStatus = !teacher.is_active;
      
      // Optimistically update the UI
      setTeachers(prevTeachers => 
        prevTeachers.map(t => 
          t.$id === teacher.$id 
            ? { 
                ...t, 
                is_active: updatedStatus, 
                status: updatedStatus ? 'active' : 'inactive' as const
              } 
            : t
        )
      );
      
      // Update in database
      await databases.updateDocument(
        DATABASE_ID,
        PROFILE_COLLECTION_ID,
        teacher.$id,
        { 
          is_active: updatedStatus,
          $permissions: teacher.$permissions // Preserve existing permissions
        }
      );
      
      // Show success toast
      const event = new CustomEvent('toast', {
        detail: {
          type: 'success',
          message: `Teacher ${updatedStatus ? 'activated' : 'deactivated'} successfully`
        }
      });
      window.dispatchEvent(event);
      
    } catch (error) {
      console.error('Error updating teacher status:', error);
      
      // Revert UI on error
      setTeachers(prevTeachers => [...prevTeachers]);
      
      // Show error toast
      const event = new CustomEvent('toast', {
        detail: {
          type: 'error',
          message: `Failed to ${teacher.is_active ? 'deactivate' : 'activate'} teacher. Please try again.`
        }
      });
      window.dispatchEvent(event);
    }
  };

  // Open assign course modal
  const openAssignModal = (teacher: Teacher) => {
    setSelectedTeacher({
      id: teacher.$id,
      name: teacher.name
    });
    setIsAssignModalOpen(true);
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="p-4 text-red-600 bg-red-100 rounded-md">
        <div className="flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Teachers</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage all teachers and their permissions
          </p>
        </div>
        
        {/* Search Bar */}
        <div className="relative w-full sm:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white dark:bg-dark-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Search teachers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Teachers Table */}
      <div className="bg-white dark:bg-dark-800 shadow overflow-hidden sm:rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-700">
            <thead className="bg-gray-50 dark:bg-dark-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Email
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Teacher ID
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Courses
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-dark-800 divide-y divide-gray-200 dark:divide-dark-700">
              {filteredTeachers.map((teacher) => (
                <tr key={teacher.$id} className="hover:bg-gray-50 dark:hover:bg-dark-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                          <span className="text-indigo-600 dark:text-indigo-300 font-medium">
                            {teacher.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {teacher.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">{teacher.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">{teacher.teacherId}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {Array.isArray(teacher.courses) 
                        ? teacher.courses.filter(course => {
                            const id = getCourseId(course);
                            return id && id.length > 0;
                          }).length 
                        : 0} courses
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <button
                        onClick={() => toggleTeacherStatus(teacher)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                          teacher.is_active ? 'bg-green-600' : 'bg-red-600'
                        }`}
                      >
                        <span
                          className={`${
                            teacher.is_active ? 'translate-x-6' : 'translate-x-1'
                          } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                        />
                      </button>
                      <span className={`ml-2 text-sm font-medium ${
                        teacher.is_active ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {teacher.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => openAssignModal(teacher)}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        title="Add Course"
                      >
                        Add Course
                      </button>
                      <button
                        onClick={() => window.location.href = `mailto:${teacher.email}`}
                        className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                        title="Send Email"
                      >
                        <Mail className="h-5 w-5" />
                      </button>

                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assign Course Modal */}
      {selectedTeacher && (
        <AssignCourseModal
          isOpen={isAssignModalOpen}
          onClose={() => {
            setIsAssignModalOpen(false);
            setSelectedTeacher(null);
          }}
          teacherId={selectedTeacher.id}
          teacherName={selectedTeacher.name}
          onAssign={handleAssignCourse}
        />
      )}
    </div>
  );
};

export default TeachersPage;
