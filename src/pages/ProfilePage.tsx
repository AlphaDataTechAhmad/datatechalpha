import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  User, Mail, Edit, BookOpen, LogOut, 
  Camera, Loader2, GraduationCap, Phone,
  Award, FileText, Calendar, UserCheck, RefreshCw, Globe
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { databases, storage } from '../Services/appwrite';
import TestReport from '../components/TestReport';
import { ID, Query } from 'appwrite';
import { DATABASE_ID, PROFILE_COLLECTION_ID } from '../config';
import { getTeacherIDByUser } from '../Services/teacherService';
import EnrolledStudents from './teacher/EnrolledStudents';
import TeacherRewards from '../components/teacher/TeacherRewards';
import { TeacherAssignedCourses } from '../components/teacher/TeacherAssignedCourses';
import { 
  sqlCourses, 
  aptitudeCourses, 
  machineLearningCourses, 
  pythonCourses, 
  sscCourses, 
  bankingCourses,
  Course
} from './courseData';

// Appwrite configuration
const PROFILE_BUCKET_ID = '6826481d00212029492a';

interface AppUser {
  $id: string;
  name: string;
  email: string;
  role?: string;
  phone?: string;
  bio?: string;
  location?: string;
  profilePicture?: string;
  imageUrl?: string;
  $createdAt?: string;
  is_active?: boolean;
  teacherId?: string;
}

interface EnrolledCourse {
  $id: string;
  courseId: string;
  receiptId: string;
  enrollmentDate: string;
  courseDetails: {
    id: string;
    title: string;
    description: string;
    duration: string;
    level: string;
    image: string;
    category?: string;
    students?: string;
    successRate?: string;
    syllabus?: string[];
    features?: string[];
  };
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  bio: string;
  location: string;
}

const ProfilePage: React.FC = () => {
  const { user: authUser, logout, isLoading: authLoading, setUser, refreshUserData, isInitialized } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const user = authUser as AppUser | null;
  
  // Refs for managing component state
  const formInitialLoad = useRef(true);
  const teacherIdInitialLoad = useRef(true);
  const isMounted = useRef(true);
  
  const [activeTab, setActiveTab] = useState('profile');
  const [editMode, setEditMode] = useState(false);
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    bio: 'Tell us about yourself...',
    location: 'Not specified'
  });
  
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [teacherIdError, setTeacherIdError] = useState<string | null>(null);
  const [isProcessingTeacherId, setIsProcessingTeacherId] = useState(false);
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [coursesError, setCoursesError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Check if user is a deactivated teacher
  useEffect(() => {
    if (user?.role === 'teacher' && user?.is_active === false) {
      // Force logout and redirect to login with message
      const logoutAndRedirect = async () => {
        await logout();
        navigate('/login', { 
          state: { 
            message: 'Your account has been deactivated. Please contact the administrator.'
          },
          replace: true
        });
      };
      logoutAndRedirect();
      return;
    }
  }, [user, navigate, logout]);

  useEffect(() => {
    if (authLoading || !isInitialized) return;

    if (!user) {
      navigate('/login', { 
        state: { 
          from: location.pathname,
          message: 'Please log in to access your profile'
        },
        replace: true
      });
      return;
    }

    if (user && !authLoading && formInitialLoad.current) {
      const newFormData = {
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        bio: user.bio || 'Tell us about yourself...',
        location: user.location || 'Not specified',
      };
      setFormData(newFormData);
      formInitialLoad.current = false;
    }
  }, [user, authLoading, navigate, location, isInitialized]);

  // Teacher ID state management
  const teacherIdProcessed = useRef(false);

  // Handle teacher ID processing
  useEffect(() => {
    isMounted.current = true;
    
    // Only process if this is a teacher and we haven't processed yet
    if (!user?.$id || user.role !== 'teacher' || teacherIdProcessed.current) {
      return;
    }

    const processTeacherId = async () => {
      try {
        // If teacherId is already set, use it
        if (user.teacherId) {
          console.log('Using existing teacher ID:', user.teacherId);
          setTeacherId(user.teacherId);
          teacherIdProcessed.current = true;
          return;
        }

        // Only fetch if this is the initial load
        if (teacherIdInitialLoad.current) {
          setIsProcessingTeacherId(true);
          setTeacherIdError(null);
          
          console.log('Fetching teacher ID for user:', user.$id);
          const id = await getTeacherIDByUser(user.$id);
          
          if (!isMounted.current) return;
          
          if (id) {
            console.log('Updating teacher ID in profile:', id);
            // Update the profile with the new teacher ID
            await databases.updateDocument(
              DATABASE_ID,
              PROFILE_COLLECTION_ID,
              user.$id,
              { teacherId: id }
            );
            
            // Update local state
            setTeacherId(id);
            
            // Don't refresh user data here to prevent loops
            // Just update the local state
            if (isMounted.current) {
              toast.success('Teacher ID processed successfully!');
            }
          } else if (isMounted.current) {
            setTeacherIdError('No teacher ID found for this user');
          }
        }
        
        teacherIdProcessed.current = true;
      } catch (error: any) {
        if (!isMounted.current) return;
        
        console.error('Error processing teacher ID:', error);
        setTeacherIdError('Failed to process teacher ID. Please try again.');
        
        if (error.code === 429) {
          setTeacherIdError('Rate limited. Please try again later.');
        }
      } finally {
        if (isMounted.current) {
          setIsProcessingTeacherId(false);
          teacherIdInitialLoad.current = false;
        }
      }
    };

    processTeacherId();
    
    // Cleanup function
    return () => {
      isMounted.current = false;
    };
  }, [user?.$id, user?.role, user?.teacherId]);

  // Manual refresh handler
  const handleRefreshTeacherId = async () => {
    if (!user?.$id || user.role !== 'teacher' || isProcessingTeacherId) return;
    
    try {
      setIsProcessingTeacherId(true);
      setTeacherIdError(null);
      
      const id = await getTeacherIDByUser(user.$id);
      
      if (id) {
        await databases.updateDocument(
          DATABASE_ID,
          PROFILE_COLLECTION_ID,
          user.$id,
          { teacherId: id }
        );
        
        setTeacherId(id);
        await refreshUserData();
        toast.success('Teacher ID refreshed successfully!');
      } else {
        setTeacherIdError('No teacher ID found for this user');
      }
    } catch (error: any) {
      console.error('Error refreshing teacher ID:', error);
      setTeacherIdError(error.message || 'Failed to refresh teacher ID');
      
      if (error.code === 429) {
        setTeacherIdError('Rate limited. Please try again later.');
      }
    } finally {
      setIsProcessingTeacherId(false);
    }
  };

  // Fetch user's enrolled courses
  useEffect(() => {
    const fetchEnrolledCourses = async () => {
      if (!user?.$id || activeTab !== 'courses') return;
      
      setCoursesLoading(true);
      setCoursesError(null);
      try {
        // Get all courses from courseData
        const allCoursesData = [
          ...sqlCourses,
          ...aptitudeCourses,
          ...machineLearningCourses,
          ...pythonCourses,
          ...sscCourses,
          ...bankingCourses
        ];

        // Fetch user's enrollments from Appwrite
        const response = await databases.listDocuments(
          DATABASE_ID,
          '684dc01f003312e04f0c', // ENROLLMENTS_COLLECTION_ID
          [
            Query.equal('userId', user.$id),
            Query.orderDesc('$createdAt')
          ]
        );

        console.log('Enrollments response:', response);
        
        const coursesData = response.documents.map((enrollment: any) => {
          const foundCourse = allCoursesData.find((c: Course) => c.id === enrollment.courseId);
          const course: Course = foundCourse ? {
            ...foundCourse,
            category: foundCourse.category || 'Uncategorized'
          } : {
            id: enrollment.courseId,
            title: 'Course not found',
            description: 'This course could not be found',
            duration: 'N/A',
            level: 'Unknown',
            image: 'https://via.placeholder.com/300x200?text=Course+Not+Found',
            students: '0',
            successRate: '0%',
            syllabus: [],
            features: [],
            category: 'Uncategorized'
          };
          
          return {
            $id: enrollment.$id,
            courseId: enrollment.courseId,
            receiptId: enrollment.receiptId || '',
            enrollmentDate: enrollment.$createdAt || new Date().toISOString(),
            courseDetails: {
              id: course.id,
              title: course.title,
              description: course.description,
              duration: course.duration,
              level: course.level,
              image: course.image,
              category: course.category,
              students: course.students,
              successRate: course.successRate,
              syllabus: course.syllabus || [],
              features: course.features || []
            }
          } as EnrolledCourse;
        });

        console.log('Processed enrolled courses:', coursesData);
        setEnrolledCourses(coursesData);
      } catch (error) {
        console.error('Failed to fetch enrolled courses:', error);
        setCoursesError('Failed to load your courses. Please try again later.');
      } finally {
        setCoursesLoading(false);
      }
    };

    fetchEnrolledCourses();
  }, [activeTab, user?.$id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setUpdateError('');
    setUpdateSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editMode) {
      setEditMode(true);
      return;
    }
    
    try {
      setIsUpdating(true);
      setUpdateError('');
      
      if (!user) {
        throw new Error('No user logged in');
      }

      const updateData = {
        name: formData.name,
        phone: formData.phone || '',
        bio: formData.bio || '',
        location: formData.location || ''
      };

      try {
        await databases.updateDocument(
          DATABASE_ID,
          PROFILE_COLLECTION_ID,
          user.$id,
          updateData
        );
      } catch (updateError) {
        if (updateError instanceof Error && updateError.message.includes('document with the requested ID could not be found')) {
          await databases.createDocument(
            DATABASE_ID,
            PROFILE_COLLECTION_ID,
            user.$id,
            {
              accountId: user.$id,
              ...updateData,
              role: 'user',
              enrolledCourses: []
            }
          );
        } else {
          throw updateError;
        }
      }

      if (setUser) {
        setUser(prev => ({
          ...prev!,
          ...updateData
        }));
      }

      setUpdateSuccess(true);
      setEditMode(false);
      await refreshUserData();
      setTimeout(() => setUpdateSuccess(false), 3000);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
      setUpdateError(errorMessage);
      setTimeout(() => setUpdateError(''), 5000);
    } finally {
      setIsUpdating(false);
    }
  };

  const uploadProfilePicture = async (file: File) => {
    if (!user) return null;
    
    try {
      setIsUploading(true);
      
      // Delete old profile picture if it exists and isn't the default avatar
      if (user.imageUrl && !user.imageUrl.includes('ui-avatars.com')) {
        try {
          const fileId = user.imageUrl.split('/').pop();
          if (fileId) {
            await storage.deleteFile(PROFILE_BUCKET_ID, fileId);
          }
        } catch (error) {
          console.error('Error deleting old profile picture:', error);
          // Don't fail the upload if deletion of old image fails
        }
      }
      
      // Upload new file
      const fileId = ID.unique();
      const response = await storage.createFile(
        PROFILE_BUCKET_ID,
        fileId,
        file
      );
      
      // Construct file URL
      const fileUrl = `https://cloud.appwrite.io/v1/storage/buckets/${PROFILE_BUCKET_ID}/files/${response.$id}/view?project=68261b5200198bea6bdf`;
      
      try {
        // First try to update the user's document with the new image URL
        await databases.updateDocument(
          DATABASE_ID,
          PROFILE_COLLECTION_ID,
          user.$id,
          { 
            imageUrl: fileUrl,
            // Keep existing fields to prevent data loss
            name: user.name || '',
            email: user.email || '',
            ...(user.phone && { phone: user.phone }),
            ...(user.bio && { bio: user.bio }),
            ...(user.location && { location: user.location }),
            role: user.role || 'user'
          }
        );

        // Update local user state
        if (setUser) {
          setUser(prev => prev ? { ...prev, imageUrl: fileUrl } : null);
        }
        
        // Show success message
        setUpdateSuccess(true);
        setTimeout(() => setUpdateSuccess(false), 3000);
        
        return fileUrl;
      } catch (updateError) {
        console.error('Error updating profile with new image:', updateError);
        // If update fails, try to create a new document (shouldn't normally happen)
        try {
          await databases.createDocument(
            DATABASE_ID,
            PROFILE_COLLECTION_ID,
            user.$id,
            {
              accountId: user.$id,
              name: user.name || '',
              email: user.email || '',
              imageUrl: fileUrl,
              role: user.role || 'user',
              ...(user.phone && { phone: user.phone }),
              ...(user.bio && { bio: user.bio }),
              ...(user.location && { location: user.location }),
              createdAt: new Date().toISOString()
            },
            [
              `read("user:${user.$id}")`,
              `update("user:${user.$id}")`,
              `delete("user:${user.$id}")`
            ]
          );
          
          if (setUser) {
            setUser(prev => prev ? { ...prev, imageUrl: fileUrl } : null);
          }
          
          setUpdateSuccess(true);
          setTimeout(() => setUpdateSuccess(false), 3000);
          return fileUrl;
        } catch (createError) {
          console.error('Failed to create profile document:', createError);
          throw new Error('Failed to update profile with new image');
        }
      }
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      setUpdateError('Failed to upload profile picture. Please try again.');
      setTimeout(() => setUpdateError(''), 5000);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  if (authLoading || !isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-900">
        <div className="text-center">
          <Loader2 className="w-12 h-12 mx-auto text-primary-500 animate-spin mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-900">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-4">You need to be logged in to view this page</p>
          <button
            onClick={() => navigate('/login', { state: { from: location.pathname } })}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const pageVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.5 }
    },
    exit: { opacity: 0 }
  };

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="min-h-screen pt-24 pb-16 bg-gray-50 dark:bg-dark-900"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-64 shrink-0">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-md mx-auto">
                {user.imageUrl || previewImage ? (
                  <img 
                    src={previewImage || user.imageUrl} 
                    alt={user.name || 'User'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-4xl font-bold">
                    {user.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
              </div>
              {editMode && (
                <label 
                  className="absolute bottom-0 right-0 bg-white dark:bg-gray-800 p-2 rounded-full shadow-lg cursor-pointer group-hover:opacity-100 opacity-90 transition-opacity"
                  title="Change profile picture"
                >
                  {isUploading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-primary-600 dark:text-primary-400" />
                  ) : (
                    <Camera className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  )}
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        try {
                          await uploadProfilePicture(file);
                          // Refresh user data to ensure everything is in sync
                          await refreshUserData();
                          // Reset the input to allow selecting the same file again if needed
                          e.target.value = '';
                        } catch (error) {
                          console.error('Error uploading profile picture:', error);
                          setUpdateError('Failed to upload profile picture. Please try again.');
                          setTimeout(() => setUpdateError(''), 5000);
                        } finally {
                          e.target.value = ''; // Reset the input
                        }
                      }
                    }}
                    disabled={isUploading}
                  />
                </label>
              )}
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-2">
                <h3 className="text-2xl font-bold dark:text-white">
                  {user.name || 'User'}
                </h3>
                {user.role === 'admin' && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200">
                    ADMIN
                  </span>
                )}
                {user.role === 'subadmin' && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200">
                    SUB-ADMIN
                  </span>
                )}
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                {user.email || 'user@example.com'}
              </p>
            </div>
            
            {user.role === 'teacher' && (
              <div className="flex flex-col items-center gap-2 mt-2">
                {teacherId ? (
                  <div className="bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm font-medium px-3 py-1.5 rounded-full inline-flex items-center shadow-sm">
                    <GraduationCap className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="font-mono tracking-wider">ID: {teacherId}</span>
                  </div>
                ) : (
                  <div className="flex items-center text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-full">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Loading Teacher ID...
                  </div>
                )}
                {user.role === 'admin' && (
                  <div className="text-xs text-yellow-600 dark:text-yellow-400 font-medium mt-1">
                    Admin privileges enabled
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-center text-sm text-gray-500 dark:text-gray-400 mb-6">
              <Calendar className="w-4 h-4 mr-1" />
              Joined {new Date(user.$createdAt).toLocaleDateString()}
            </div>

            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${
                  activeTab === 'profile'
                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700'
                }`}
              >
                <User className="w-5 h-5 mr-3" />
                Profile
              </button>

              <button
                onClick={() => setActiveTab('courses')}
                className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${
                  activeTab === 'courses'
                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700'
                }`}
              >
                <BookOpen className="w-5 h-5 mr-3" />
                Assigned Courses
              </button>

              <button
                onClick={() => setActiveTab('certificates')}
                className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${
                  activeTab === 'certificates'
                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700'
                }`}
              >
                <Award className="w-5 h-5 mr-3" />
                Certificates
              </button>

              {!['admin', 'subadmin', 'teacher'].includes(user.role) && (
                <button
                  onClick={() => setActiveTab('test-report')}
                  className={`w-full flex items-center px-4 py-2 rounded-lg transition-colors ${
                    activeTab === 'test-report'
                      ? 'bg-primary-100 text-primary-700 dark:bg-primary-500/20 dark:text-primary-400'
                      : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-dark-700'
                  }`}
                >
                  <FileText className="w-5 h-5 mr-3" />
                  Test Report
                </button>
              )}
              
              {user.role === 'teacher' && (
                <>
                  <button
                    onClick={() => setActiveTab('enrolled-students')}
                    className={`w-full flex items-center px-4 py-2 rounded-lg transition-colors ${
                      activeTab === 'enrolled-students'
                        ? 'bg-primary-100 text-primary-700 dark:bg-primary-500/20 dark:text-primary-400'
                        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-dark-700'
                    }`}
                  >
                    <UserCheck className="w-5 h-5 mr-3" />
                    Enrolled Students
                  </button>
                  <button
                    onClick={() => setActiveTab('rewards')}
                    className={`w-full flex items-center px-4 py-2 rounded-lg transition-colors ${
                      activeTab === 'rewards'
                        ? 'bg-primary-100 text-primary-700 dark:bg-primary-500/20 dark:text-primary-400'
                        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-dark-700'
                    }`}
                  >
                    <Award className="w-5 h-5 mr-3" />
                    My Rewards
                  </button>
                  {user.role === 'admin' && (
                    <button
                      onClick={() => setActiveTab('admin-panel')}
                      className={`w-full flex items-center px-4 py-2 rounded-lg transition-colors ${
                        activeTab === 'admin-panel'
                          ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                          : 'text-yellow-600 hover:bg-yellow-50 dark:text-yellow-400 dark:hover:bg-yellow-900/20'
                      }`}
                    >
                      <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Admin Panel
                    </button>
                  )}
                </>
              )}

              <button
                onClick={logout}
                className="w-full flex items-center px-4 py-3 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <LogOut className="w-5 h-5 mr-3" />
                Sign Out
              </button>
            </nav>
          </div>

          <div className="flex-1">
            {updateError && (
              <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg border border-red-200 dark:border-red-800">
                {updateError}
              </div>
            )}

            {updateSuccess && (
              <div className="mb-6 p-4 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg border border-green-200 dark:border-green-800">
                Profile updated successfully!
              </div>
            )}

            {activeTab === 'admin-panel' && user.role === 'admin' && (
              <div className="bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-gray-200 dark:border-dark-700 p-6">
                <h2 className="text-2xl font-bold dark:text-white mb-6 flex items-center">
                  <svg className="w-6 h-6 mr-2 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Admin Dashboard
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-900/30 rounded-lg p-6">
                    <h3 className="font-medium text-yellow-800 dark:text-yellow-200 mb-4">Teacher Management</h3>
                    <ul className="space-y-3">
                      <li className="flex items-center text-sm text-yellow-700 dark:text-yellow-300">
                        <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                        View all teachers
                      </li>
                      <li className="flex items-center text-sm text-yellow-700 dark:text-yellow-300">
                        <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                        Grant/Revoke admin rights
                      </li>
                      <li className="flex items-center text-sm text-yellow-700 dark:text-yellow-300">
                        <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                        Manage teacher profiles
                      </li>
                    </ul>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 rounded-lg p-6">
                    <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-4">System Analytics</h3>
                    <ul className="space-y-3">
                      <li className="flex items-center text-sm text-blue-700 dark:text-blue-300">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                        View user statistics
                      </li>
                      <li className="flex items-center text-sm text-blue-700 dark:text-blue-300">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                        Monitor course enrollments
                      </li>
                      <li className="flex items-center text-sm text-blue-700 dark:text-blue-300">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                        System performance
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'enrolled-students' && user.role === 'teacher' && (
              <div className="bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-gray-200 dark:border-dark-700 p-6">
                <h2 className="text-2xl font-bold dark:text-white mb-6">Enrolled Students</h2>
                <EnrolledStudents />
              </div>
            )}

            {activeTab === 'rewards' && user.role === 'teacher' && (
              <div className="bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-gray-200 dark:border-dark-700 p-6">
                <h2 className="text-2xl font-bold dark:text-white mb-6">My Rewards</h2>
                <TeacherRewards userId={user.$id} />
              </div>
            )}

            {activeTab === 'test-report' && !['admin', 'subadmin', 'teacher'].includes(user.role) && (
              <div className="bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-gray-200 dark:border-dark-700 p-6">
                <h2 className="text-2xl font-bold dark:text-white mb-6">My Test Reports</h2>
                <TestReport />
              </div>
            )}


            {activeTab === 'profile' && (
              <div className="bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-gray-200 dark:border-dark-700 p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold dark:text-white">Profile Information</h2>
                    {!editMode ? (
                      <button
                        type="button"
                        onClick={() => setEditMode(true)}
                        className="flex items-center text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit Profile
                      </button>
                    ) : (
                      <div className="space-x-2">
                        <button
                          type="button"
                          onClick={() => setEditMode(false)}
                          className="px-3 py-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isUpdating}
                          className="px-3 py-1 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center"
                        >
                          {isUpdating ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : 'Save Changes'}
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Full Name
                      </label>
                      {editMode ? (
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-dark-700 dark:text-white"
                          required
                        />
                      ) : (
                        <p className="px-4 py-2 text-gray-800 dark:text-gray-200">
                          {formData.name || 'Not provided'}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Email Address
                      </label>
                      <div className="flex items-center">
                        <div className="flex items-center px-4 py-2 text-gray-800 dark:text-gray-200">
                          <Mail className="w-5 h-5 mr-2 text-gray-400 dark:text-gray-500" />
                          {user.email}
                        </div>
                      </div>
                    </div>

                    {user.role === 'teacher' && (
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Teacher ID
                        </label>
                        <div className="flex items-center">
                          {teacherId ? (
                            <div className="flex items-center px-4 py-2 text-gray-800 dark:text-gray-200">
                              <GraduationCap className="w-5 h-5 mr-2 text-gray-400 dark:text-gray-500" />
                              {teacherId}
                            </div>
                          ) : (
                            <div className="flex items-center px-4 py-2 text-gray-800 dark:text-gray-200">
                              <Loader2 className="w-5 h-5 mr-2 animate-spin text-gray-400 dark:text-gray-500" />
                              {teacherIdError || 'Loading teacher ID...'}
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={handleRefreshTeacherId}
                            disabled={isProcessingTeacherId}
                            className="p-1 text-blue-600 hover:text-blue-800 disabled:opacity-50"
                            title="Refresh Teacher ID"
                          >
                            {isProcessingTeacherId ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <RefreshCw className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                        {teacherIdError && (
                          <p className="mt-1 text-sm text-red-500">{teacherIdError}</p>
                        )}
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Phone Number
                      </label>
                      {editMode ? (
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-dark-700 dark:text-white"
                        />
                      ) : (
                        <div className="flex items-center px-4 py-2 text-gray-800 dark:text-gray-200">
                          <Phone className="w-5 h-5 mr-2 text-gray-400 dark:text-gray-500" />
                          {formData.phone || 'Not provided'}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Location
                      </label>
                      {editMode ? (
                        <input
                          type="text"
                          name="location"
                          value={formData.location}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-dark-700 dark:text-white"
                        />
                      ) : (
                        <div className="flex items-center px-4 py-2 text-gray-800 dark:text-gray-200">
                          <Globe className="w-5 h-5 mr-2 text-gray-400 dark:text-gray-500" />
                          {formData.location}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        About Me
                      </label>
                      {editMode ? (
                        <textarea
                          name="bio"
                          value={formData.bio}
                          onChange={handleInputChange}
                          rows={4}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-dark-700 dark:text-white"
                        />
                      ) : (
                        <p className="px-4 py-2 text-gray-800 dark:text-gray-200 whitespace-pre-line">
                          {formData.bio}
                        </p>
                      )}
                    </div>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'courses' && (
              <div className="bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-gray-200 dark:border-dark-700 p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold dark:text-white">Assigned Courses</h2>
                </div>
                {user.role === 'teacher' ? (
                  <div className="space-y-6">
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-4">
                      <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Assigned Courses</h3>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        These are the courses you're currently teaching. Click on a course to manage students and content.
                      </p>
                    </div>
                    <TeacherAssignedCourses userId={user.$id} />
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <BookOpen className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">No courses yet</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {user.role === 'student' 
                        ? 'Enroll in courses to see them here.' 
                        : 'You are not registered as a teacher.'}
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'certificates' && (
              <div className="bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-gray-200 dark:border-dark-700 p-6">
                <h2 className="text-2xl font-bold dark:text-white mb-6">My Certificates</h2>
                <div className="text-center py-12">
                  <Award className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No certificates earned yet</p>
                </div>
              </div>
            )}

            {activeTab === 'test-report' && (
              <div className="bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-gray-200 dark:border-dark-700 p-6">
                <h2 className="text-2xl font-bold dark:text-white mb-6">Test Report</h2>
                <TestReport />
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProfilePage;