import React, { useEffect, useState } from 'react';
import { getEnrolledStudents, getTeacherIDByUser, debugEnrollments } from '../../Services/teacherService';
import { useAuth } from '../../contexts/AuthContext';
import { EnrolledStudent } from '../../Services/teacherService';
import { format } from 'date-fns';

interface EnrolledStudentsProps {
  courseId?: string;
}

const EnrolledStudents: React.FC<EnrolledStudentsProps> = ({ courseId }) => {
  const [students, setStudents] = useState<EnrolledStudent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const { user } = useAuth();

  useEffect(() => {
    const fetchEnrolledStudents = async () => {
      if (!user?.$id) {
        setError('User not authenticated');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        
        // First verify the user is a teacher and has a teacher ID
        const teacherId = await getTeacherIDByUser(user.$id);
        if (!teacherId) {
          throw new Error('You must be a verified teacher to view enrolled students');
        }
        
        console.log('=== DEBUG MODE: Fetching enrollment data ===');
        
        // First, run the debug function to see what's happening
        const debugData = await debugEnrollments(teacherId);
        console.log('Debug data:', debugData);
        
        // Then get the actual data
        console.log('Fetching enrolled students for teacher ID:', teacherId);
        const enrolledStudents = await getEnrolledStudents(teacherId, courseId);
        
        if (!enrolledStudents || enrolledStudents.length === 0) {
          console.warn('No enrolled students found. Showing debug data instead.');
          setStudents(debugData);
        } else {
          setStudents(enrolledStudents);
        }
        
        // If a specific course is selected, set it as the selected course
        if (courseId) {
          const course = enrolledStudents.find(s => s.courseId === courseId);
          if (course) {
            setSelectedCourse(courseId);
          }
        }
        setError(null);
      } catch (err) {
        console.error('Failed to fetch enrolled students:', err);
        setError(err instanceof Error ? err.message : 'Failed to load enrolled students. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchEnrolledStudents();
  }, [user?.$id, courseId]);

  // Get unique courses for filter dropdown
  const courses = React.useMemo(() => {
    const courseMap = new Map<string, string>();
    students.forEach(student => {
      if (student.courseId && student.courseName && !courseMap.has(student.courseId)) {
        courseMap.set(student.courseId, student.courseName);
      }
    });
    return Array.from(courseMap.entries()).map(([id, name]) => ({
      id,
      name
    }));
  }, [students]);

  const handleCourseChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCourse(event.target.value);
  };

  // Filter students based on selected course
  const filteredStudents = React.useMemo(() => {
    if (selectedCourse === 'all') return students;
    return students.filter(student => student.courseId === selectedCourse);
  }, [students, selectedCourse]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">
          <p className="font-medium">Error loading students</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (filteredStudents.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="bg-gray-50 p-6 rounded-lg">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="bg-gray-100 p-3 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900">No students found</h3>
            <p className="text-gray-500 max-w-md">
              {selectedCourse === 'all' 
                ? 'No students are currently enrolled in your courses.'
                : 'No students found for the selected course.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Enrolled Students</h1>
          <p className="text-sm text-gray-500 mt-1">
            View and manage students enrolled in your courses
          </p>
        </div>
        
        <div className="w-full md:w-64">
          <label htmlFor="course-filter" className="block text-sm font-medium text-gray-700 mb-1">
            Filter by Course
          </label>
          <select
            id="course-filter"
            value={selectedCourse}
            onChange={handleCourseChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="all">All Courses</option>
            {courses.map(course => (
              <option key={course.id} value={course.id}>
                {course.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student ID
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Course
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Enrolled
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Progress
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStudents.map((student) => (
                <tr key={`${student.userId}-${student.courseId}`} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{student.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {student.studentId || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {student.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {student.courseName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(student.enrollmentDate), 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                        <div 
                          className="bg-primary-600 h-2.5 rounded-full" 
                          style={{ width: `${student.progress}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-500">
                        {Math.round(student.progress)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EnrolledStudents;
