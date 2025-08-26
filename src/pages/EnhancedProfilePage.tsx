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
import { ID, Query } from 'appwrite';
import { DATABASE_ID, PROFILE_COLLECTION_ID } from '../config';

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

const EnhancedProfilePage: React.FC = () => {
  const { user: authUser, logout, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const sectionRef = useRef<HTMLDivElement>(null);
  
  const user = authUser as AppUser | null;
  const [activeTab, setActiveTab] = useState('profile');
  const [editMode, setEditMode] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    bio: 'Tell us about yourself...',
    location: 'Not specified'
  });

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
      toast.error('Failed to log out. Please try again.');
    }
  };

  // Set initial form data when user loads
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        bio: user.bio || 'Tell us about yourself...',
        location: user.location || 'Not specified'
      });
    }
  }, [user]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login', { 
        state: { 
          from: location.pathname,
          message: 'Please log in to access your profile'
        },
        replace: true
      });
    }
  }, [authLoading, user, navigate, location]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="w-12 h-12 mx-auto text-primary-500 animate-spin mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-dark-900 dark:to-dark-800 pb-20">
        {/* Background elements */}
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
        
        <div className="container mx-auto px-4 pt-32 pb-16 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Welcome back, {user.name?.split(' ')[0] || 'User'}
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Manage your account, view your courses, and track your progress
            </p>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <motion.div 
        className="container mx-auto px-4 py-8 -mt-16 relative z-20"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        ref={sectionRef}
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar */}
          <motion.div 
            className="md:col-span-1"
            variants={itemVariants}
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 sticky top-6 border border-gray-100 dark:border-gray-700">
              <div className="flex flex-col items-center">
                <div className="relative group w-32 h-32 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden mb-4">
                  {user.profilePicture || user.imageUrl ? (
                    <img 
                      src={user.imageUrl || user.profilePicture} 
                      alt={user.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-4xl font-bold">
                      {user.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                  
                  <label 
                    className="absolute bottom-0 right-0 bg-white dark:bg-gray-700 p-2 rounded-full shadow-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                    title="Change photo"
                  >
                    <Camera className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={(e) => {
                        // Handle image upload
                        const file = e.target.files?.[0];
                        if (file) {
                          setIsUploading(true);
                          // TODO: Implement image upload
                          setTimeout(() => setIsUploading(false), 1500);
                        }
                      }}
                    />
                  </label>
                </div>

                <h2 className="text-xl font-bold text-gray-900 dark:text-white text-center">
                  {user.name}
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                  {user.email}
                </p>

                {user.role === 'teacher' && user.teacherId && (
                  <div className="mt-3 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium px-3 py-1 rounded-full">
                    Teacher ID: {user.teacherId}
                  </div>
                )}
              </div>

              <nav className="mt-8 space-y-2">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-full flex items-center px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === 'profile'
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <User className="w-5 h-5 mr-3" />
                  Profile
                </button>

                <button
                  onClick={() => setActiveTab('courses')}
                  className={`w-full flex items-center px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === 'courses'
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <BookOpen className="w-5 h-5 mr-3" />
                  My Courses
                </button>

                {user.role === 'teacher' && (
                  <button
                    onClick={() => setActiveTab('students')}
                    className={`w-full flex items-center px-4 py-3 rounded-lg text-left transition-colors ${
                      activeTab === 'students'
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    <Users className="w-5 h-5 mr-3" />
                    My Students
                  </button>
                )}

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center px-4 py-3 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors mt-4 font-medium"
                >
                  <LogOut className="w-5 h-5 mr-2" />
                  Sign Out
                </button>
              </nav>
            </div>
          </motion.div>

          {/* Main Content */}
          <motion.div 
            className="md:col-span-3 space-y-6"
            variants={itemVariants}
          >
            {activeTab === 'profile' && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Profile Information
                  </h2>
                  <button
                    onClick={() => setEditMode(!editMode)}
                    className="flex items-center text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                  >
                    {editMode ? (
                      <>
                        <span>Cancel</span>
                      </>
                    ) : (
                      <>
                        <Edit className="w-4 h-4 mr-1" />
                        <span>Edit Profile</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Full Name
                      </label>
                      {editMode ? (
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                        />
                      ) : (
                        <p className="text-gray-900 dark:text-white">
                          {formData.name || 'Not provided'}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Email Address
                      </label>
                      <p className="text-gray-900 dark:text-white">
                        {user.email}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Phone Number
                      </label>
                      {editMode ? (
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({...formData, phone: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                          placeholder="Enter your phone number"
                        />
                      ) : (
                        <p className="text-gray-900 dark:text-white">
                          {formData.phone || 'Not provided'}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Location
                      </label>
                      {editMode ? (
                        <input
                          type="text"
                          value={formData.location}
                          onChange={(e) => setFormData({...formData, location: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                          placeholder="Enter your location"
                        />
                      ) : (
                        <p className="text-gray-900 dark:text-white">
                          {formData.location}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      About Me
                    </label>
                    {editMode ? (
                      <textarea
                        value={formData.bio}
                        onChange={(e) => setFormData({...formData, bio: e.target.value})}
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                        placeholder="Tell us about yourself..."
                      />
                    ) : (
                      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                        {formData.bio}
                      </p>
                    )}
                  </div>

                  {editMode && (
                    <div className="flex justify-end space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setEditMode(false)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          // TODO: Implement save functionality
                          toast.success('Profile updated successfully');
                          setEditMode(false);
                        }}
                        className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        Save Changes
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'courses' && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  My Courses
                </h2>
                
                <div className="text-center py-12">
                  <BookOpen className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                    No courses yet
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                    {user.role === 'teacher' 
                      ? 'You haven\'t been assigned any courses yet.' 
                      : 'Enroll in courses to see them here.'}
                  </p>
                  {user.role !== 'teacher' && (
                    <button
                      onClick={() => navigate('/courses')}
                      className="mt-4 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      Browse Courses
                    </button>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'students' && user.role === 'teacher' && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  My Students
                </h2>
                
                <div className="text-center py-12">
                  <Users className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                    No students yet
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                    Students who enroll in your courses will appear here.
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default EnhancedProfilePage;
