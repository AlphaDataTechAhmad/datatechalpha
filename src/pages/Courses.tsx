import React, { useState, useEffect } from 'react';
import { Search, Clock, DollarSign, BookOpen } from 'lucide-react';
import { databases } from '../Services/appwrite';
import { DATABASE_ID, COURSES_COLLECTION_ID } from '../Services/appwrite';
import { Query } from 'appwrite';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface Course {
  $id: string;
  title: string;
  description: string;
  category: string;
  duration: string;
  level: string;
  price: number;
  image?: string;
  thumbnail?: string;
  createdAt: string;
}

const CoursesPage = () => {
  const { user, setUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Helper function to check admin status
  const isAdmin = user?.role === 'admin' || user?.role === 'subadmin';
  
  // Debug effect to log user info
  useEffect(() => {
    console.log('=== USER STATE CHANGED ===');
    console.log('User exists:', !!user);
    console.log('User ID:', user?.$id || 'N/A');
    console.log('User email:', user?.email || 'N/A');
    console.log('User role:', user?.role || 'N/A');
    console.log('Is admin:', user?.role === 'admin' || user?.role === 'subadmin');
    console.log('User object:', user);
    
    // Check if user is authenticated
    const auth = useAuth();
    console.log('Auth context state:', {
      isAuthenticated: auth.isAuthenticated,
      isInitialized: auth.isInitialized,
      isLoading: auth.isLoading,
      error: auth.error
    });
  }, [user]);

  // Fetch published courses from Appwrite
  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await databases.listDocuments(
        DATABASE_ID,
        COURSES_COLLECTION_ID,
        [
          Query.equal('isPublished', true),
          Query.orderDesc('$createdAt')
        ]
      );
      setCourses(response.documents as unknown as Course[]);
      setError(null);
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError('Failed to load courses. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch courses on component mount
  useEffect(() => {
    fetchCourses();
  }, []);

  // Filter courses based on search query and category
  const filteredCourses = courses.filter(course => {
    const matchesSearch = 
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (course.description && course.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || course.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Get unique categories for filter
  const categories = ['all', ...new Set(courses.map(course => course.category).filter(Boolean))];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700 dark:text-red-300">
                  {error}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Debug Info */}
      <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-700" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">Debug Information</h3>
            <div className="mt-2 text-sm text-yellow-700 space-y-1">
              <p>User Status: {user ? 'Logged In' : 'Not Logged In'}</p>
              <p>User Role: {user?.role || 'N/A'}</p>
              <p>User ID: {user?.$id || 'N/A'}</p>
              <p>Is Admin: {user?.role === 'admin' || user?.role === 'subadmin' ? 'Yes' : 'No'}</p>
              <p>User Object: {JSON.stringify(user || {})}</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white sm:text-5xl sm:tracking-tight lg:text-6xl">
          Our Courses
        </h1>
        <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 dark:text-gray-300 sm:mt-4">
          Learn new skills and advance your career with our expert-led courses
        </p>
      </div>

      <div className="mb-8 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          className="block pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md bg-white dark:bg-gray-700"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="all">All Categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      {filteredCourses.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No courses found</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {searchQuery || selectedCategory !== 'all' 
              ? 'Try adjusting your search or filter criteria.' 
              : 'Check back later for new courses.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {filteredCourses.map((course) => (
            <div key={course.$id} className="flex flex-col overflow-hidden rounded-lg shadow-lg bg-white dark:bg-gray-800 hover:shadow-xl transition-shadow duration-300">
              <div className="flex-shrink-0">
                {course.image || course.thumbnail ? (
                  <img 
                    className="h-48 w-full object-cover" 
                    src={course.image || course.thumbnail} 
                    alt={course.title} 
                  />
                ) : (
                  <div className="h-48 bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center">
                    <BookOpen className="h-16 w-16 text-white opacity-20" />
                  </div>
                )}
              </div>
              <div className="flex-1 p-6 flex flex-col justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                    {course.category || 'Uncategorized'}
                  </p>
                  <Link to={`/course/${course.$id}`} className="block mt-2">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {course.title}
                    </h3>
                    <p className="mt-3 text-base text-gray-500 dark:text-gray-300 line-clamp-3">
                      {course.description}
                    </p>
                  </Link>
                </div>
                <div className="mt-6 flex items-center justify-between">
                  <div className="flex items-center">
                    <Clock className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {course.duration}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      {course.price > 0 ? `$${course.price}` : 'Free'}
                    </span>
                  </div>
                </div>
                <div className="mt-6">
                  <div className="space-y-2">
                    {/* Temporary admin override button - FOR TESTING ONLY */}
                    <button 
                      onClick={() => {
                        const newIsAdminMode = !isAdminMode;
                        setIsAdminMode(newIsAdminMode);
                        console.log('Admin mode:', newIsAdminMode);
                        
                        if (user) {
                          const newUser = { 
                            ...user, 
                            role: newIsAdminMode ? 'admin' as const : 'user' as const 
                          };
                          console.log('Updating user role to:', newUser.role);
                          setUser(newUser);
                        }
                      }}
                      className={`w-full text-white p-1 text-xs rounded ${
                        isAdminMode ? 'bg-green-600' : 'bg-red-600'
                      }`}
                    >
                      {isAdminMode ? 'Admin Mode: ON' : 'Admin Mode: OFF'}
                    </button>
                    
                    {/* Actual course button */}
                    <div className="relative group">
                      <Link
                        to={`/course/${course.$id}`}
                        className={`w-full flex items-center justify-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${
                          isAdmin 
                            ? 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500 border-transparent'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white focus:ring-indigo-500 border-transparent'
                        }`}
                      >
                        {isAdmin ? 'View Course' : 'Enroll Now'}
                      </Link>
                      {/* Debug info on hover */}
                      <div className="absolute -top-2 -right-2 bg-yellow-500 text-white text-xs px-1.5 py-0.5 rounded-full group-hover:bg-yellow-600 transition-colors cursor-help" 
                           title={`Role: ${user?.role || 'guest'}\nID: ${user?.$id || 'N/A'}`}>
                        {user?.role ? user.role.charAt(0).toUpperCase() : '?'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CoursesPage;
