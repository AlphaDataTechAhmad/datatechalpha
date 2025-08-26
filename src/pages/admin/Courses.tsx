import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  DollarSign, 
  BookOpen, 
  Edit2, 
  Trash2, 
  Folder, 
  Search, 
  Plus, 
  FolderOpen, 
  Users, 
  BookOpen as BookOpenIcon, 
  TrendingUp, 
  RefreshCw 
} from 'lucide-react';
import type { Course } from '../../types/course';
import { AppwriteService } from '../../Services/courseService';
import { CourseForm } from './CourseForm';

interface CategoryGroup {
  category: string;
  courses: Course[];
}

interface CategoryGroup {
  category: string;
  courses: Course[];
}

export default function Courses() {
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [courses, setCourses] = useState<CategoryGroup[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      const response = await AppwriteService.getCourses();
      
      // Group courses by category
      const groupedCourses = response.reduce<CategoryGroup[]>((acc, course) => {
        const categoryGroup = acc.find(group => group.category === course.category);
        if (categoryGroup) {
          categoryGroup.courses.push(course);
        } else {
          acc.push({
            category: course.category,
            courses: [course]
          });
        }
        return acc;
      }, []);

      setCourses(groupedCourses);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch courses';
      setError(errorMessage);
      console.error('Error fetching courses:', errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCourseCreated = useCallback((newCourse: Course) => {
    setCourses((prevCourses: CategoryGroup[]) => {
      const updatedCourses = [...prevCourses];
      const categoryIndex = updatedCourses.findIndex(group => group.category === newCourse.category);
      
      if (categoryIndex !== -1) {
        // Check if course exists in the category
        const courseIndex = updatedCourses[categoryIndex].courses.findIndex(c => c.$id === newCourse.$id);
        if (courseIndex !== -1) {
          // Update existing course
          updatedCourses[categoryIndex].courses[courseIndex] = newCourse;
        } else {
          // Add new course to existing category
          updatedCourses[categoryIndex].courses.push(newCourse);
        }
      } else {
        // Create new category with the course
        updatedCourses.push({
          category: newCourse.category,
          courses: [newCourse]
        });
      }
      
      return updatedCourses;
    });
    setShowForm(false);
    setEditingCourse(null);
    toast.success(`Course ${editingCourse ? 'updated' : 'created'} successfully!`);
  }, [editingCourse]);

  const handleDeleteCourse = useCallback(async (courseId: string) => {
    if (!confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      return;
    }

    try {
      setIsDeleting(prev => ({ ...prev, [courseId]: true }));
      await AppwriteService.deleteCourse(courseId);
      
      setCourses((prevCourses: CategoryGroup[]) => {
        // Filter out the deleted course from all categories
        const updatedCategories = prevCourses
          .map((group: CategoryGroup) => ({
            ...group,
            courses: group.courses.filter((course: Course) => course.$id !== courseId)
          }))
          .filter((group: CategoryGroup) => group.courses.length > 0); // Remove empty categories
        
        return updatedCategories;
      });
      
      toast.success('Course deleted successfully!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete course';
      console.error('Error deleting course:', errorMessage);
      toast.error('Failed to delete course');
    } finally {
      setIsDeleting((prev: Record<string, boolean>) => {
        const newState = { ...prev };
        delete newState[courseId];
        return newState;
      });
    }
  }, []);

  const togglePublishStatus = useCallback(async (courseId: string, currentStatus: boolean) => {
    try {
      const updatedCourse = await AppwriteService.updateCourse(courseId, { isPublished: !currentStatus });
      
      setCourses((prevCourses: CategoryGroup[]) => 
        prevCourses.map((group: CategoryGroup) => ({
          ...group,
          courses: group.courses.map((course: Course) => 
            course.$id === courseId 
              ? updatedCourse 
              : course
          )
        }))
      );
      toast.success(`Course ${!currentStatus ? 'published' : 'unpublished'} successfully!`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update course status';
      console.error('Error toggling publish status:', errorMessage);
      toast.error('Failed to update course status');
    }
  }, []);

  // Fetch courses on component mount
  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // Render loading state
  if (loading) {
    return <div className="p-4">Loading courses...</div>;
  }

  // Render error state
  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  // Render empty state
  if (courses.length === 0) {
    return (
      <div className="p-4">
        <p>No courses found. Create your first course to get started.</p>
        <button
          onClick={() => setShowForm(true)}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Create Course
        </button>
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-2xl">
              <CourseForm 
                onClose={() => setShowForm(false)} 
                onSuccess={handleCourseCreated} 
                initialData={editingCourse || undefined} 
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  // Stats data
  const stats = [
    { name: 'Total Courses', value: courses.reduce((acc, group) => acc + group.courses.length, 0), icon: BookOpenIcon },
    { name: 'Categories', value: courses.length, icon: Folder },
    { name: 'Active Students', value: '0', icon: Users },
    { name: 'Completion Rate', value: '0%', icon: TrendingUp },
  ];

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Courses Management</h1>
        <p className="text-gray-500 dark:text-gray-400">Manage your courses and categories with ease</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow duration-300"
          >
            <div className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/30">
                  <stat.icon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {stat.name}
                  </p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {stat.value}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-4">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2.5 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 flex items-center gap-2 shadow-md hover:shadow-lg"
          >
            <Plus className="w-5 h-5" />
            <span>Add New Course</span>
          </motion.button>
          <button
            onClick={() => fetchCourses()}
            className="bg-white text-indigo-600 px-4 py-2 rounded-lg hover:bg-indigo-50 transition-colors flex items-center gap-2"
            title="Refresh courses"
          >
            <RefreshCw className="w-5 h-5" />
            <span className="text-sm">Refresh</span>
          </button>
        </div>
      </div>

      <div className="mt-6">
        {error && (
          <div className="bg-red-100 border border-red-500 text-red-800 px-4 py-3 rounded mb-4 shadow-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center min-h-[200px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Category Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {courses.map((categoryGroup) => (
                <motion.div 
                  whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden cursor-pointer border border-gray-100 dark:border-gray-700 transition-all duration-300 ${selectedCategory === categoryGroup.category ? 'ring-2 ring-indigo-500' : ''}"
                  key={categoryGroup.category}
                  onClick={() => {
                    // Update selected category state
                    setSelectedCategory(selectedCategory === categoryGroup.category ? null : categoryGroup.category);
                  }}
                >
                  <div className="p-6">
                    <div className="relative">
                      <h3 className="text-xl font-semibold text-gray-800 dark:text-white">{categoryGroup.category}</h3>
                      <p className="text-gray-500 dark:text-gray-300">{categoryGroup.courses.length} Courses</p>
                      {selectedCategory === categoryGroup.category && (
                        <div className="absolute top-2 right-2 w-2 h-2 bg-indigo-500 rounded-full"></div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Search and Category Filter */}
            <div className="flex gap-4 mb-8">
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="w-5 h-5 text-indigo-500" />
                </div>
                <input
                  type="text"
                  placeholder="🔍 Search courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-indigo-50 placeholder:text-gray-400"
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-indigo-500 hover:text-indigo-600 transition-colors"
                  title="Clear search"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="w-5 h-5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <div className="relative">
                  <select
                    className="bg-white border border-indigo-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 cursor-pointer"
                    value={selectedCategory || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSelectedCategory(value ? value : null);
                      setSearchQuery('');
                    }}
                  >
                    <option value="">All Categories</option>
                    {courses.map((group) => (
                      <option key={group.category} value={group.category}>
                        {group.category} ({group.courses.length})
                      </option>
                    ))}
                  </select>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Category-Specific Courses Grid */}
            {selectedCategory ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses
                  .filter(group => selectedCategory ? group.category === selectedCategory : true)
                  .flatMap(group => group.courses)
                  .filter((course: Course) =>
                    course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    course.description.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((course: Course) => (
                    <motion.div 
                      whileHover={{ y: -3, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}
                      className="relative rounded-xl overflow-hidden bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700"
                      key={course.$id}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-50/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"></div>
                      {course.thumbnail && (
                        <div className="relative h-48">
                          <img
                            src={course.thumbnail}
                            alt={course.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent h-1/3"></div>
                        </div>
                      )}
                      <div className="p-6">
                        <div className="relative">
                          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2 group-hover:text-indigo-900 dark:group-hover:text-indigo-400 transition-colors duration-300">{course.title}</h3>
                          <p className="text-gray-500 dark:text-gray-300 line-clamp-2 group-hover:text-gray-600 dark:group-hover:text-gray-200 transition-colors duration-300">{course.description}</p>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent h-1/3 flex items-end p-4">
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-yellow-400" />
                                <span className="text-sm text-yellow-300">{course.duration}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-green-400" />
                                <span className="text-sm font-medium text-white">₹{course.price}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <BookOpen className="w-4 h-4 text-purple-400" />
                                <span className="text-sm text-purple-300">{course.level}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingCourse(course);
                                    setShowForm(true);
                                  }}
                                  className="text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors p-1"
                                  title="Edit course"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteCourse(course.$id);
                                  }}
                                  className="text-red-500 hover:text-red-600 dark:hover:text-red-400 transition-colors p-1"
                                  disabled={isDeleting[course.$id]}
                                  title="Delete course"
                                >
                                  {isDeleting[course.$id] ? (
                                    <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                                  ) : (
                                    <Trash2 className="w-4 h-4" />
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center min-h-[300px] text-center p-6 col-span-full"
              >
                <FolderOpen className="w-16 h-16 text-indigo-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                  {selectedCategory ? 'No Courses Found' : 'No Category Selected'}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  {selectedCategory 
                    ? 'No courses match your search criteria.' 
                    : 'Click on a category card to view its courses or use the search bar to find specific courses'}
                </p>
                <button
                  onClick={() => setShowForm(true)}
                  className="bg-indigo-600 text-white px-5 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 text-sm font-medium shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Course</span>
                </button>
              </motion.div>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={(e) => e.target === e.currentTarget && setShowForm(false)}
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <CourseForm
                onClose={() => setShowForm(false)}
                onSuccess={() => {
                  setShowForm(false);
                  fetchCourses();
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
