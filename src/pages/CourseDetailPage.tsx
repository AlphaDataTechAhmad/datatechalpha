import React, { useState, useEffect, memo, useCallback } from 'react';
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';
import { Outlet, useParams, Link, useNavigate, useLocation, Route, Routes } from 'react-router-dom';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import LiveLecture from './LiveLecture';
import { motion } from 'framer-motion';
import { BookOpen, Video, FileText, Clock, Award, Users, ChevronLeft, Loader, Radio } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { allCourses } from './courseData';
import { CourseProvider } from '../contexts/CourseContext';
import { databases } from '../Services/appwrite';
import { DATABASE_ID, COURSES_COLLECTION_ID } from '../Services/appwrite';
import { Query } from 'appwrite';

interface Course {
  $id: string;
  title: string;
  description: string;
  duration: string;
  students: string;
  successRate: string;
  level: string;
  image: string;
  price?: number;
  category?: string;
  originalPrice?: number;
  syllabus: string[];
  features: string[];
  rating?: React.ReactNode;
  videoLectures?: Array<{
    id: string;
    title: string;
    youtubeId: string;
    description: string;
    duration?: string;
  }>;
  overview?: string;
  teacherId?: string;
  liveLectures?: Array<{
    id: string;
    title: string;
    description: string;
    scheduledTime: string;
    duration: string;
    meetingLink?: string;
    status: 'scheduled' | 'live' | 'completed';
    teacherId: string;
  }>;
  studyMaterials?: Array<{
    id: string;
    title: string;
    description: string;
    fileUrl: string;
    fileType: 'pdf' | 'doc' | 'ppt' | 'video' | 'other';
    uploadDate: string;
    teacherId: string;
  }>;
}

interface StatItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

interface NavLinkProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}

const StatItem = memo<StatItemProps>(({ icon, label, value }) => (
  <div className="flex items-center gap-3">
    <span className="text-primary-500">{icon}</span>
    <div>
      <p className="text-sm text-dark-500 dark:text-dark-300">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  </div>
));

StatItem.displayName = 'StatItem';

const NavLink = memo<NavLinkProps>(({ to, icon, label, active, onClick }) => (
  <Link
    to={to}
    className={`flex items-center px-4 py-3 rounded-lg transition-colors ${active
      ? 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400'
      : 'text-dark-700 dark:text-dark-200 hover:bg-gray-100 dark:hover:bg-dark-700'
      }`}
    onClick={onClick}
  >
    <span className="mr-3">{icon}</span>
    {label}
  </Link>
));

NavLink.displayName = 'NavLink';

const CourseOverview = memo<{ course: Course }>(({ course }) => {
  return (
    <div className="bg-white dark:bg-dark-800 rounded-xl shadow-md p-6">
      <h2 className="text-2xl font-bold mb-4">Course Overview</h2>
      {course.overview ? (
        <div
          className="prose dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: course.overview }}
        />
      ) : (
        <p>No overview available for this course.</p>
      )}

      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-3">Syllabus</h3>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {course.syllabus && course.syllabus.length > 0 ? (
            course.syllabus.map((item, index) => (
              <li key={index} className="flex items-start">
                <span className="text-primary-500 mr-2">✓</span>
                {item}
              </li>
            ))
          ) : (
            <li>No syllabus available for this course.</li>
          )}
        </ul>
      </div>

      {course?.features && course.features.length > 0 && (
        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-3">Course Features</h3>
          <div className="flex flex-wrap gap-4">
            {course.features.map((feature, index) => (
              <div
                key={index}
                className="bg-primary-50 dark:bg-primary-900/30 px-4 py-3 rounded-lg"
              >
                {feature}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

CourseOverview.displayName = 'CourseOverview';

const ErrorFallback: React.FC<FallbackProps> = ({ error, resetErrorBoundary }) => (
  <div className="min-h-screen pt-24 pb-16 flex items-center justify-center">
    <div className="text-center p-6 bg-white dark:bg-dark-800 rounded-xl shadow-lg max-w-md">
      <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">Something went wrong</h2>
      <p className="text-dark-700 dark:text-dark-300 mb-6">{error.message}</p>
      <button
        onClick={resetErrorBoundary}
        className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
      >
        Try again
      </button>
    </div>
  </div>
);

const LoadingFallback = () => (
  <div className="min-h-screen pt-24 pb-16 flex items-center justify-center">
    <div className="text-center">
      <Loader className="animate-spin h-12 w-12 text-primary-500 mx-auto mb-4" />
      <p>Loading course details...</p>
    </div>
  </div>
);

const CourseDetailPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isCheckingEnrollment, setIsCheckingEnrollment] = useState(true);
  const [isTeacher, setIsTeacher] = useState(false);
  const [isAssignedTeacher, setIsAssignedTeacher] = useState(false);
  const [enrollmentCount, setEnrollmentCount] = useState<number>(0);
  const [videos, setVideos] = useState<any[]>([]);

  // Sync active tab with current route
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('videos')) {
      setActiveTab('videos');
    } else if (path.includes('TestsPage')) {
      setActiveTab('TestsPage');
    } else if (path.includes('material')) {
      setActiveTab('material');
    } else if (path.includes('live-lectures')) {
      setActiveTab('live-lectures');
    } else {
      setActiveTab('overview');
    }
  }, [location.pathname]);

  const fetchCourse = useCallback(async () => {
    if (!courseId) return;
    try {
      // First try to fetch from database
      try {
        const databaseCourse = await databases.getDocument(
          DATABASE_ID,
          COURSES_COLLECTION_ID,
          courseId
        ) as unknown as Course;
        
        if (databaseCourse) {
          setCourse(databaseCourse);
          setIsLoading(false);
          return;
        }
      } catch (dbError) {
        console.log('Course not found in database, falling back to local data');
      }
      
      // Fallback to local data if not found in database
      let foundCourse: Course | undefined;
      for (const category of allCourses) {
        foundCourse = category.courses.find(c => c.id === courseId);
        if (foundCourse) break;
      }

      if (foundCourse) {
        setCourse(foundCourse);
      } else {
        setError('Course not found');
        console.error('Course not found');
      }
    } catch (error) {
      setError('Failed to fetch course data.');
      console.error('Error fetching course:', error);
    } finally {
      setIsLoading(false);
    }
  }, [courseId, databases]);

  useEffect(() => {
    fetchCourse();
    
    // Subscribe to real-time updates for videos
    if (courseId) {
      const unsubscribe = databases.client.subscribe(
        `databases.68261b6a002ba6c3b584.collections.685457d5000a277435ef.documents`,
        (response: any) => {
          if (response.events.includes('databases.*.collections.685457d5000a277435ef.documents.*.create') ||
              response.events.includes('databases.*.collections.685457d5000a277435ef.documents.*.update')) {
            if (response.payload.courseId === courseId) {
              fetchVideos();
            }
          }
        }
      );

      // Initial fetch of videos
      fetchVideos();

      return () => {
        // Cleanup subscription
        unsubscribe();
      };
    }
  }, [courseId, fetchCourse]);
  
  const fetchVideos = async () => {
    if (!courseId) return;
    
    try {
      const response = await databases.listDocuments(
        '68261b6a002ba6c3b584', // Database ID
        '685457d5000a277435ef', // Videos collection ID
        [
          Query.equal('courseId', courseId),
          Query.orderDesc('$createdAt')
        ]
      );
      setVideos(response.documents);
    } catch (error) {
      console.error('Error fetching videos:', error);
    }
  };

  const fetchEnrollmentCount = useCallback(async (courseId: string) => {
    try {
      const response = await databases.listDocuments(
        '68261b6a002ba6c3b584', // DATABASE_ID
        '684dc01f003312e04f0c', // ENROLLMENTS_COLLECTION_ID
        [
          Query.equal('courseId', courseId),
          Query.limit(1000) // Adjust based on your needs
        ]
      );
      setEnrollmentCount(response.total);
    } catch (error) {
      console.error('Failed to fetch enrollment count:', error);
    }
  }, []);

  const checkTeacherAssignment = useCallback(async () => {
    if (!user || !courseId) {
      setIsTeacher(user?.role === 'teacher');
      setIsAssignedTeacher(false);
      return;
    }

    // Set teacher status
    const isUserTeacher = user.role === 'teacher';
    setIsTeacher(isUserTeacher);

    // If not a teacher, no need to check assignment
    if (!isUserTeacher) {
      setIsAssignedTeacher(false);
      return;
    }

    try {
      const teacherProfile = await databases.getDocument(
        '68261b6a002ba6c3b584', // DATABASE_ID
        '68261bb5000a54d8652b',  // PROFILE_COLLECTION_ID
        user.$id
      );
      
      if (teacherProfile) {
        const assignedCourseIds = Array.isArray(teacherProfile.courses) 
          ? teacherProfile.courses.map((course: any) => 
              typeof course === 'object' ? (course.$id || course.id) : course
            )
          : [];
        
        setIsAssignedTeacher(assignedCourseIds.includes(courseId));
      }
    } catch (error) {
      console.error('Error checking teacher assignment:', error);
      setIsAssignedTeacher(false);
    }
  }, [user, courseId]);

  useEffect(() => {
    const checkEnrollment = async () => {
      if (!user || !courseId) {
        setIsCheckingEnrollment(false);
        return;
      }
      
      // Skip enrollment check for admin, subadmin, and teachers
      if (['admin', 'subadmin', 'teacher'].includes(user.role)) {
        setIsEnrolled(true);
        setIsCheckingEnrollment(false);
        return;
      }
      
      setIsCheckingEnrollment(true);
      try {
        const response = await databases.listDocuments(
          '68261b6a002ba6c3b584', // DATABASE_ID
          '684dc01f003312e04f0c', // ENROLLMENTS_COLLECTION_ID
          [
            Query.equal('userId', user.$id),
            Query.equal('courseId', courseId),
          ]
        );
        setIsEnrolled(response.documents.length > 0);
      } catch (error) {
        console.error('Failed to check enrollment status:', error);
      } finally {
        setIsCheckingEnrollment(false);
      }
    };

    checkEnrollment();
    checkTeacherAssignment();
    
    // Fetch enrollment count for teachers and admins
    if ((user?.role === 'teacher' || user?.role === 'admin' || user?.role === 'subadmin') && courseId) {
      fetchEnrollmentCount(courseId);
    }
  }, [user, courseId, checkTeacherAssignment, fetchEnrollmentCount]);
  
  // Set isTeacher state when user changes
  useEffect(() => {
    if (user) {
      setIsTeacher(user.role === 'teacher');
    }
  }, [user]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (isMobileMenuOpen) {
      setMobileMenuOpen(false);
    }
  };

  if (isLoading) {
    return <LoadingFallback />;
  }

  if (!course) {
    return (
      <div className="min-h-screen pt-24 pb-16 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Course not found</h2>
          <button
            onClick={() => navigate('/courses')}
            className="btn-primary px-6 py-2"
          >
            Browse Courses
          </button>
        </div>
      </div>
    );
  }

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!isMobileMenuOpen);
  };

  if (error) {
    return (
      <div className="min-h-screen pt-24 pb-16 flex items-center justify-center">
        <div className="text-center p-6 bg-white dark:bg-dark-800 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">Error</h2>
          <p className="text-dark-700 dark:text-dark-300">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => window.location.reload()}
    >
      <CourseProvider initialCourse={course}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="min-h-screen pt-24 pb-16 bg-gray-50 dark:bg-dark-900"
      >
        {/* Course Header */}
        <div className="relative h-64 w-full overflow-hidden">
          <img
            src={course.image}
            alt={course.title}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/default-course-image.jpg';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-8">
            <div className="container mx-auto">
              <button
                onClick={() => navigate('/courses')}
                className="flex items-center text-white mb-4 hover:text-primary-300 transition-colors"
                aria-label="Back to courses"
              >
                <ChevronLeft className="h-5 w-5 mr-1" />
                Back to Courses
              </button>
              <h1 className="text-4xl font-bold text-white mb-2">{course.title}</h1>
              <p className="text-xl text-white/90 max-w-3xl">{course.description}</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 mt-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Mobile Menu Toggle */}
            <button 
              onClick={toggleMobileMenu}
              className="lg:hidden flex items-center justify-between w-full mb-4 p-3 bg-white dark:bg-dark-800 rounded-lg shadow-md"
              aria-expanded={isMobileMenuOpen}
              aria-controls="course-sidebar"
            >
              <span>Course Menu</span>
              <svg 
                className={`w-5 h-5 transition-transform ${isMobileMenuOpen ? 'transform rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Sidebar */}
            <div 
              id="course-sidebar"
              className={`${isMobileMenuOpen ? 'block' : 'hidden'} lg:block w-full lg:w-64 flex-shrink-0`}
            >
              <div className="bg-white dark:bg-dark-800 rounded-xl shadow-md p-6 sticky top-24">
                {/* Course Progress (if enrolled) */}
                {user?.enrolledCourses?.includes(course.id) && (
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-dark-500 dark:text-dark-300">
                        Course Progress
                      </span>
                      <span className="text-sm font-bold">25%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-dark-700 rounded-full h-2">
                      <div
                        className="bg-primary-500 h-2 rounded-full"
                        style={{ width: '25%' }}
                      />
                    </div>
                  </div>
                )}

                {/* Course Stats */}
                <div className="space-y-4 mb-6">
                  <StatItem
                    icon={<Clock className="h-5 w-5" />}
                    label="Duration"
                    value={course.duration}
                  />
                  <StatItem
                    icon={<Users className="h-5 w-5" />}
                    label="Students"
                    value={isTeacher && isAssignedTeacher ? `${enrollmentCount} enrolled` : course.students}
                  />
                  <StatItem
                    icon={<Award className="h-5 w-5" />}
                    label="Success Rate"
                    value={course.successRate}
                  />
                </div>

                {/* Navigation for Teachers */}
                {isTeacher && isAssignedTeacher ? (
                  <nav className="space-y-2">
                    <NavLink
                      to={`/courses/${courseId}`}
                      icon={<BookOpen className="h-5 w-5" />}
                      label="Course Overview"
                      active={activeTab === 'overview'}
                      onClick={() => handleTabChange('overview')}
                    />
                    <NavLink
                      to={`/courses/${courseId}/videos`}
                      icon={<Video className="h-5 w-5" />}
                      label="Video Lectures"
                      active={activeTab === 'videos'}
                      onClick={() => handleTabChange('videos')}
                    />
                    <NavLink
                      to={`/courses/${courseId}/TestsPage`}
                      icon={<FileText className="h-5 w-5" />}
                      label="Practice Tests"
                      active={activeTab === 'TestsPage'}
                      onClick={() => handleTabChange('TestsPage')}
                    />
                    <NavLink
                      to={`/courses/${courseId}/material`}
                      icon={<FileText className="h-5 w-5" />}
                      label="Study Material"
                      active={activeTab === 'material'}
                      onClick={() => handleTabChange('material')}
                    />
                    <NavLink
                      to={`/courses/${courseId}/live-lectures`}
                      icon={<Radio className="h-5 w-5" />}
                      label="Live Lectures"
                      active={activeTab === 'live-lectures'}
                      onClick={() => handleTabChange('live-lectures')}
                    />
                  </nav>
                ) : isCheckingEnrollment ? (
                  <div className="flex justify-center items-center h-24">
                    <Loader className="animate-spin h-8 w-8 text-primary-500" />
                  </div>
                ) : user ? (
                  isEnrolled ? (
                    <nav className="space-y-2">
                      <NavLink
                        to={`/courses/${courseId}`}
                        icon={<BookOpen className="h-5 w-5" />}
                        label="Course Overview"
                        active={activeTab === 'overview'}
                        onClick={() => handleTabChange('overview')}
                      />
                      <NavLink
                        to={`/courses/${courseId}/videos`}
                        icon={<Video className="h-5 w-5" />}
                        label="Video Lectures"
                        active={activeTab === 'videos'}
                        onClick={() => handleTabChange('videos')}
                      />
                      <NavLink
                        to={`/courses/${courseId}/TestsPage`}
                        icon={<FileText className="h-5 w-5" />}
                        label="Practice Tests"
                        active={activeTab === 'TestsPage'}
                        onClick={() => handleTabChange('TestsPage')}
                      />
                      <NavLink
                        to={`/courses/${courseId}/material`}
                        icon={<FileText className="h-5 w-5" />}
                        label="Study Material"
                        active={activeTab === 'material'}
                        onClick={() => handleTabChange('material')}
                      />
                      <NavLink
                        to={`/courses/${courseId}/live-lectures`}
                        icon={<Radio className="h-5 w-5" />}
                        label="Live Lectures"
                        active={activeTab === 'live-lectures'}
                        onClick={() => handleTabChange('live-lectures')}
                      />
                      {/* Nested routes for live lectures */}
                      <Routes>
                        <Route 
                          path="live-lecture/:lectureId" 
                          element={
                            <ProtectedRoute>
                              <LiveLecture />
                            </ProtectedRoute>
                          } 
                        />
                      </Routes>
                    </nav>
                  ) : (
                    <div className="mt-6">
                      <button
                        onClick={() => navigate(`/enroll/${courseId}/${encodeURIComponent(course.title)}`)}
                        className="w-full py-3 px-6 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <BookOpen className="h-5 w-5" />
                        Enroll Now
                      </button>
                      <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-2">to access all content</p>
                    </div>
                  )
                ) : (
                  <div className="mt-6 text-center">
                    <Link
                      to="/login"
                      state={{ from: location }}
                      className="w-full py-3 px-6 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <BookOpen className="h-5 w-5" />
                      Login to Enroll
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1">
              {activeTab === 'overview' && <CourseOverview course={course} />}
              <Outlet context={{ course }} />
            </div>
          </div>
        </div>
      </motion.div>
      </CourseProvider>
    </ErrorBoundary>
  );
};

export default CourseDetailPage;