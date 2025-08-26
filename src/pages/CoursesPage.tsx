import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { BookOpen, Clock, Users, Star, ArrowRight, Award, BarChart2, CheckCircle, Loader2 } from 'lucide-react';
import { allCourses, Course } from './courseData';
import { databases } from '../Services/appwrite';
import { Query } from 'appwrite';

// Course interface is defined in courseData.ts


interface CourseCardProps {
  course: Course;
  index: number;
}

const CourseCard: React.FC<CourseCardProps> = ({ course, index }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(cardRef, { once: true, amount: 0.1 });
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isCheckingEnrollment, setIsCheckingEnrollment] = useState(true);
  const [isAssignedTeacher, setIsAssignedTeacher] = useState(false);
  const [isCheckingAssignment, setIsCheckingAssignment] = useState(true);
  
  // Check if user is admin or subadmin
  const isAdmin = user?.role === 'admin' || user?.role === 'subadmin';

  const checkEnrollmentStatus = useCallback(async () => {
    if (!user) {
      setIsCheckingEnrollment(false);
      return;
    }

    try {
      const response = await databases.listDocuments(
        '68261b6a002ba6c3b584', // DATABASE_ID
        '684dc01f003312e04f0c', // ENROLLMENTS_COLLECTION_ID
        [
          Query.equal('userId', user.$id),
          Query.equal('courseId', course.id),
        ]
      );
      setIsEnrolled(response.documents.length > 0);
    } catch (error) {
      console.error('Error checking enrollment status:', error);
    } finally {
      setIsCheckingEnrollment(false);
    }
  }, [user, course.id]);

  const checkTeacherAssignment = useCallback(async () => {
    console.log('=== DEBUG: Starting teacher assignment check ===');
    console.log('Teacher ID:', user?.$id);
    console.log('Course object:', JSON.stringify(course, null, 2));
    
    if (!user || user.role !== 'teacher') {
      console.log('DEBUG: User is not a teacher or not logged in');
      setIsCheckingAssignment(false);
      return;
    }

    try {
      console.log('DEBUG: Getting teacher profile...');
      // Get the teacher's profile to check assigned courses
      const teacherProfile = await databases.getDocument(
        '68261b6a002ba6c3b584', // DATABASE_ID
        '68261bb5000a54d8652b',  // PROFILE_COLLECTION_ID
        user.$id
      );
      
      console.log('DEBUG: Teacher profile data:', JSON.stringify(teacherProfile, null, 2));
      
      if (!teacherProfile) {
        console.log('DEBUG: Teacher profile not found');
        setIsAssignedTeacher(false);
        setIsCheckingAssignment(false);
        return;
      }
      
      const assignedCourseIds = Array.isArray(teacherProfile.courses) 
        ? teacherProfile.courses.map((course: any) => 
            typeof course === 'object' ? (course.$id || course.id) : course
          )
        : [];
      
      console.log('DEBUG: Assigned course IDs:', assignedCourseIds);
      
      if (assignedCourseIds.length === 0) {
        console.log('DEBUG: No courses assigned to this teacher');
        setIsAssignedTeacher(false);
        setIsCheckingAssignment(false);
        return;
      }
      
      // Get the current course ID from the course object
      const currentCourseId = course.id;
      console.log('DEBUG: Current course ID to check:', currentCourseId);
      
      // Check if the current course ID is in the assigned course IDs
      const isAssigned = assignedCourseIds.includes(currentCourseId);
      
      console.log('DEBUG: Final assignment status - Is teacher assigned to course?', isAssigned);
      setIsAssignedTeacher(isAssigned);
    } catch (error) {
      console.error('ERROR in checkTeacherAssignment:', error);
      // In case of error, assume not assigned to prevent false positives
      setIsAssignedTeacher(false);
    } finally {
      setIsCheckingAssignment(false);
      console.log('=== DEBUG: Finished teacher assignment check ===');
    }
  }, [user, course.$id, course.id]);

  useEffect(() => {
    checkEnrollmentStatus();
    checkTeacherAssignment();
  }, [checkEnrollmentStatus, checkTeacherAssignment]);

  // Helper function to get card image (uses smaller version for cards)
  const getCardImage = (imageUrl: string) => {
    return imageUrl.replace('w=1000', 'w=500');
  };

  const handleEnrollClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (!user) {
      // Redirect to login with a return URL
      navigate(`/login?redirect=/courses/${course.id}`);
      return;
    }
    
    // For teachers, go directly to the course without enrollment
    if (user.role === 'teacher') {
      navigate(`/courses/${course.id}`);
    } else {
      // For students, handle enrollment flow
      navigate(`/courses/${course.id}?enrolled=true`);
    }
  };

  const coursePrice = course.price || 999; // Default price if not specified

  return (
    <>
      <motion.div
        ref={cardRef}
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{ 
          type: "spring",
          stiffness: 100,
          damping: 20,
          delay: index * 0.05 
        }}
        whileHover={{ y: -5 }}
        className="glass-card group overflow-hidden transition-all duration-300 hover:shadow-neon-lg"
      >
        <div className="h-48 overflow-hidden relative">
          <div className="absolute top-3 left-3 z-10 bg-secondary-500 text-white text-xs font-medium py-1 px-2 rounded">
            {course.level}
          </div>
          {course.rating && (
            <div className="absolute top-3 right-3 z-10 bg-dark-800/70 backdrop-blur-sm text-white text-xs font-medium py-1 px-2 rounded flex items-center gap-1">
              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
              {course.rating}
            </div>
          )}
          <img 
            src={getCardImage(course.image)} 
            alt={course.title} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-dark-900/80 to-transparent" />
        </div>
        
        <div className="p-6">
          <h3 className="text-xl font-bold mb-2 group-hover:text-primary-500 transition-colors duration-300">
            {course.title}
          </h3>
          <p className="text-dark-600 dark:text-dark-300 mb-4 line-clamp-2">
            {course.description}
          </p>
          
          <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
            <div className="flex items-center text-dark-500 dark:text-dark-400">
              <Clock className="h-4 w-4 mr-2 text-primary-500" />
              <span>{course.duration}</span>
            </div>
            <div className="flex items-center text-dark-500 dark:text-dark-400">
              <Users className="h-4 w-4 mr-2 text-primary-500" />
              <span>{course.students}</span>
            </div>
            <div className="flex items-center text-dark-500 dark:text-dark-400">
              <BookOpen className="h-4 w-4 mr-2 text-primary-500" />
              <span>{course.level}</span>
            </div>
            <div className="flex items-center text-dark-500 dark:text-dark-400">
              <span className="text-lg font-bold text-primary-600">₹{coursePrice}</span>
              {course.originalPrice && (
                <span className="ml-2 text-sm text-gray-400 line-through">₹{course.originalPrice}</span>
              )}
            </div>
          </div>
          
          <div className="flex flex-col gap-3">
            {(() => {
              if (isCheckingAssignment) {
                return (
                  <button
                    disabled
                    className="w-full py-3 text-center block font-medium transition-all duration-200 flex items-center justify-center gap-2 bg-gray-200 text-gray-600 rounded-lg"
                  >
                    <Loader2 className="animate-spin h-5 w-5" />
                    Loading...
                  </button>
                );
              }
              
              // Teacher is assigned to this course
              if (isAssignedTeacher) {
                return (
                  <button
                    onClick={handleEnrollClick}
                    className="w-full py-3 text-center block font-medium transition-all duration-200 flex items-center justify-center gap-2 bg-blue-600 text-white hover:bg-blue-700 hover:scale-[1.02] rounded-lg"
                  >
                    <BookOpen className="h-5 w-5" />
                    Continue Teaching
                  </button>
                );
              }
              
              // Teacher not assigned to this course
              if (user?.role === 'teacher') {
                return (
                  <button
                    disabled
                    className="w-full py-3 text-center block font-medium transition-all duration-200 flex items-center justify-center gap-2 bg-gray-200 text-gray-600 rounded-lg cursor-not-allowed"
                  >
                    Not Assigned
                  </button>
                );
              }
              
              // Student is enrolled
              if (isEnrolled) {
                return (
                  <button
                    onClick={handleEnrollClick}
                    className="w-full py-3 text-center block font-medium transition-all duration-200 flex items-center justify-center gap-2 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg"
                  >
                    <CheckCircle className="h-5 w-5" />
                    Open Course
                  </button>
                );
              }
              
              // Admin/Subadmin view
              if (isAdmin) {
                return (
                  <Link
                    to={`/courses/${course.id}`}
                    className="w-full py-3 text-center block font-medium transition-all duration-200 flex items-center justify-center gap-2 bg-green-600 text-white hover:bg-green-700 hover:scale-[1.02] rounded-lg"
                  >
                    <Award className="h-5 w-5" />
                    Admin Access
                  </Link>
                );
              }
              
              // Regular student not enrolled
              return (
                <button
                  onClick={handleEnrollClick}
                  className="w-full py-3 text-center block font-medium transition-all duration-200 flex items-center justify-center gap-2 bg-primary-600 text-white hover:bg-primary-700 hover:scale-[1.02] rounded-lg"
                >
                  Enroll Now
                </button>
              );
            })()}
            <Link 
              to={`/courses/${course.id}`}
              className="text-primary-500 font-medium flex items-center justify-center gap-1 text-sm group-hover:text-primary-400 transition-colors duration-300"
            >
              View Details
              <ArrowRight className="w-4 h-4 mt-0.5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </motion.div>
    </>
  );
};

// Define a type for the category filter
type CategoryFilter = 'all' | string;

const CoursesPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { isAuthenticated } = useAuth();

  const pageRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(pageRef, { once: true, amount: 0.1 });
  
  // Flatten courses and add category to each course
  const allCoursesFlat = allCourses.flatMap(category => 
    category.courses.map(course => ({
      ...course, 
      category: category.category
    }))
  );
  
  // Group and filter courses by category and search term
  const filteredCourseGroups = allCourses
    .map(category => ({
      ...category,
      courses: category.courses.filter(course => {
        const matchesCategory = selectedCategory === 'all' || category.category === selectedCategory;
        const matchesLevel = selectedLevel === 'all' || course.level === selectedLevel;
        const matchesSearch = !searchTerm || 
          course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          course.description.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesLevel && matchesSearch;
      })
    }))
    .filter(group => group.courses.length > 0);

  // Handle hash links for course sections
  useEffect(() => {
    window.scrollTo(0, 0);
    
    const handleHash = () => {
      const hash = window.location.hash.substring(1);
      if (hash) {
        const element = document.getElementById(hash);
        if (element) {
          setTimeout(() => {
            element.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);

    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="courses-page"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="min-h-screen pt-24 pb-16 bg-gray-50 dark:bg-dark-900"
      >
        <div className="container mx-auto px-4">
          {/* Hero Section */}
          <div className="relative text-center mb-16 py-16 px-6 overflow-hidden rounded-3xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
            {/* Animated Background - Subtle grid pattern for light mode */}
            <div className="absolute inset-0 -z-10 opacity-30 dark:opacity-10">
              <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#4b5563_1px,transparent_1px)] [background-size:16px_16px]"></div>
            </div>
            
            {/* Animated gradient overlay */}
            <motion.div 
              className="absolute inset-0 -z-10 opacity-50 dark:opacity-30"
              initial={{ 
                background: 'linear-gradient(45deg, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.1))'
              }}
              animate={{
                background: [
                  'linear-gradient(45deg, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.1))',
                  'linear-gradient(135deg, rgba(168, 85, 247, 0.1), rgba(236, 72, 153, 0.1))',
                  'linear-gradient(225deg, rgba(236, 72, 153, 0.1), rgba(245, 158, 11, 0.1))',
                  'linear-gradient(315deg, rgba(245, 158, 11, 0.1), rgba(99, 102, 241, 0.1))'
                ]
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: 'linear'
              }}
            />
            
            {/* Animated Blobs */}
            <motion.div 
              className="absolute -top-48 -right-48 w-96 h-96 rounded-full bg-blue-200/40 dark:bg-blue-400/20 blur-3xl"
              animate={{
                x: [0, 30, 0],
                y: [0, -30, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{
                duration: 15,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            />
            
            <motion.div 
              className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-indigo-200/40 dark:bg-purple-400/20 blur-3xl"
              animate={{
                x: [0, -20, 0],
                y: [0, 20, 0],
                scale: [1, 0.95, 1.05]
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 2
              }}
            />
            
            <div className="relative z-10 max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6 }}
              >
                <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900 dark:text-white">
                  Master Your <span className="text-indigo-600 dark:text-yellow-300">Preparation</span> 
                </h1>
                <p className="text-xl text-gray-600 dark:text-white/90 max-w-3xl mx-auto">
                  Join thousands of successful candidates with our comprehensive courses designed by top educators
                </p>
                <div className="flex flex-wrap justify-center gap-4 mt-8">
                  {[
                    { 
                      icon: <Users className="h-5 w-5 mr-2 text-indigo-600 dark:text-white" />, 
                      text: "50,000+ Students" 
                    },
                    { 
                      icon: <Award className="h-5 w-5 mr-2 text-indigo-600 dark:text-white" />, 
                      text: "1,200+ Selections" 
                    },
                    { 
                      icon: <BarChart2 className="h-5 w-5 mr-2 text-indigo-600 dark:text-white" />, 
                      text: "92% Success Rate" 
                    }
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={isInView ? { opacity: 1, y: 0 } : {}}
                      transition={{ duration: 0.6, delay: 0.2 + i * 0.1 }}
                      className="bg-white/80 dark:bg-white/10 backdrop-blur-sm rounded-full px-6 py-2 flex items-center shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100 dark:border-white/10"
                    >
                      <span className="text-gray-800 dark:text-white">{item.icon}</span>
                      <span className="text-gray-800 dark:text-white font-medium">{item.text}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>

        {/* Search and Filter */}
        <motion.div 
          ref={pageRef}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-12 bg-white dark:bg-dark-800 rounded-xl shadow-md p-6"
        >
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search for courses..."
                className="w-full p-3 pl-10 bg-white/10 rounded-lg border border-transparent focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <svg
                className="absolute left-3 top-3.5 h-5 w-5 text-dark-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
              <select
                className="p-3 bg-white/10 rounded-lg border border-transparent focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="all">All Categories</option>
                {allCourses.map(cat => <option key={cat.category} value={cat.category}>{cat.category}</option>)}
              </select>
              <select
                className="p-3 bg-white/10 rounded-lg border border-transparent focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300"
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
              >
                <option value="all">All Levels</option>
                {[...new Set(allCoursesFlat.map(c => c.level))].map(level => <option key={level} value={level}>{level}</option>)}
              </select>
            </div>
          </motion.div>

          {/* Course Sections */}
          <div>
            <AnimatePresence>
              {filteredCourseGroups.map((group) => (
                <motion.section
                  key={group.category}
                  id={group.category.toLowerCase().replace(/\s+/g, '-')}
                  className="mb-16"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="flex justify-between items-center mb-8">
                    <h2 className="text-3xl font-bold">
                      <span className="gradient-text">{group.category}</span>
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {group.courses.map((course, index) => (
                      <CourseCard 
                        key={course.id} 
                        course={course} 
                        index={index} 
                      />
                    ))}
                  </div>
                </motion.section>
              ))}
            </AnimatePresence>
          </div>

          {/* Testimonials Section */}
          <motion.section
            className="mb-16 bg-gradient-to-r from-primary-500 to-primary-700 rounded-3xl p-8 text-white"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <h2 className="text-3xl font-bold mb-8 text-center">Success Stories</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  name: 'Ankit Chaudhary',
                  position: 'Python Scripter',
                  image: 'https://i.postimg.cc/NM7GQq5r/student-du-k.jpg',
                  testimonial: 'The comprehensive study material and regular mock tests were game-changers for my SSC CGL preparation. I cleared the exam in my very first attempt with an All India Rank of 42!',
                  gender: 'men'
                },
                {
                  name: 'Priya Negi',
                  position: 'Cloud Engineer',
                  image: 'https://i.postimg.cc/7h25DT1K/images.jpg',
                  testimonial: 'The faculty support and structured learning approach helped me secure an IBPS PO position with SBI. The sectional tests were particularly helpful in improving my speed and accuracy.',
                  gender: 'women'
                },
                {
                  name: 'Rahul Verma',
                  position: 'SSC CGL',
                  image: 'https://i.postimg.cc/GtC4LmMr/850488-68316-fhgddikeem-1505291619.jpg',
                  testimonial: 'I was struggling with quantitative aptitude, but the shortcut techniques and practice questions helped me improve my score significantly. Cleared SSC CHSL with flying colors!',
                  gender: 'men'
                }
              ].map((student, index) => (
                <motion.div
                  key={student.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: 0.9 + index * 0.1 }}
                  className="bg-white/10 backdrop-blur-sm rounded-xl p-6"
                >
                  <div className="flex items-center mb-4">
                    <img 
                      src={student.image} 
                      alt={student.name} 
                      className="w-12 h-12 rounded-full mr-4 object-cover"
                      loading="lazy"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://i.postimg.cc/GtC4LmMr/850488-68316-fhgddikeem-1505291619.jpg';
                      }}
                    />
                    <div>
                      <h4 className="font-bold">{student.name}</h4>
                      <p className="text-sm text-white/80">Selected as {student.position}</p>
                    </div>
                  </div>
                  <p className="text-white/90">
                    "{student.testimonial}"
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* Call to Action - Only show when user is not logged in */}
          {!isAuthenticated && (
            <motion.section
              className="text-center py-12"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 1.2 }}
            >
              <h2 className="text-3xl font-bold mb-6">Ready to Start Your Preparation?</h2>
              <p className="text-xl text-dark-500 dark:text-dark-300 max-w-2xl mx-auto mb-8">
                Join thousands of students who have successfully cleared government exams with our courses
              </p>
              <Link
                to="/signup"
                className="btn-primary px-8 py-4 text-lg font-bold inline-block transition-transform duration-200 hover:scale-105"
              >
                Get Started Today
              </Link>
            </motion.section>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CoursesPage;