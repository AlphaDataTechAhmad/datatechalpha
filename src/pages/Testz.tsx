import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { TestCard } from '@/components/test/TestCard';
import { CategoryCard } from '@/components/test/CategoryCard';
import { getTestCategories, TestCategory as AppwriteTestCategory } from '@/Services/categoryService';
import { testData, TestData } from '@/data/TestQues';
import { Input } from '@/components/ui/input';
import { Search, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

interface TestCategory {
  $id: string;
  title: string;
  description: string;
  thumbnail: string;
  TestId: string[];
  rating: number;
  languages: string[];
  attempts: number;
  categoryThumbnail?: string;
  Title?: string; // Keep for backward compatibility with Appwrite data
}

// Simple notification function to replace toast
const showNotification = (title: string, description?: string) => {
  console.log(`[${title}] ${description || ''}`);
  // You can replace this with a more sophisticated notification system later
  alert(`${title}: ${description || ''}`);
};



interface Test extends Omit<TestData, 'testId'> {
  $id: string;
  TestTitle?: string;
  TestDescription?: string;
  TestDuration?: number;
  sections?: any[];
  categoryThumbnail?: string;
}

export default function TestzPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<TestCategory[]>([]);
  
  // Get category from URL or default to 'all'
  const categoryFilter = searchParams.get('category') || 'all';
  
  useEffect(() => {
    const fetchCategoriesAndTests = async () => {
      try {
        setLoading(true);
        
        // Fetch categories from Appwrite
        const appwriteCategories = await getTestCategories();
        
        // Transform Appwrite categories to match our TestCategory interface
        const transformedCategories: TestCategory[] = appwriteCategories.map(cat => {
          // Ensure all required fields are present
          const category: TestCategory = {
            $id: cat.$id,
            title: cat.Title || 'Uncategorized',
            description: cat.description || `${cat.Title || 'Uncategorized'} tests`,
            thumbnail: cat.categoryThumbnail || `https://via.placeholder.com/300x200/4F46E5/FFFFFF?text=${encodeURIComponent((cat.Title || 'UC').slice(0, 10))}`,
            TestId: Array.isArray(cat.TestId) ? cat.TestId : [],
            rating: typeof cat.rating === 'number' ? cat.rating : 4.5,
            languages: Array.isArray(cat.languages) ? cat.languages : ['English'],
            attempts: Math.floor(Math.random() * 1000), // Add random attempts for demo
            categoryThumbnail: cat.categoryThumbnail,
            Title: cat.Title // Keep original Title for reference
          };
          return category;
        });
        
        setCategories(transformedCategories);
        
        // Filter tests based on category
        let filteredTests: TestData[] = [];
        if (categoryFilter === 'all') {
          filteredTests = [...testData];
        } else {
          // Find the selected category
          const selectedCategory = transformedCategories.find(
            cat => cat.$id === categoryFilter || cat.title.toLowerCase() === categoryFilter.toLowerCase()
          );
          
          if (selectedCategory) {
            filteredTests = testData.filter(test => {
              // Match by test ID in the category's TestId array
              const matchesById = selectedCategory.TestId.includes(test.testId);
              // OR match by category name (case insensitive)
              const matchesByName = test.category.toLowerCase() === selectedCategory.title.toLowerCase();
              return matchesById || matchesByName;
            });
          } else if (categoryFilter === 'uncategorized') {
            filteredTests = testData.filter(test => !test.category || test.category.trim() === '');
          }
        }
        
        // Format tests for display
        const formattedTests: Test[] = filteredTests.map(test => ({
          ...test,
          $id: test.testId,
          TestTitle: test.title,
          TestDescription: test.description,
          TestDuration: test.duration,
          categoryThumbnail: transformedCategories.find(cat => cat.TestId?.includes(test.testId))?.thumbnail
        }));
        
        setTests(formattedTests);
      } catch (error) {
        console.error('Error fetching categories:', error);
        showNotification('Error', 'Failed to load categories. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCategoriesAndTests();
  }, [categoryFilter]);

  const filteredTests = tests.filter((test: Test) => {
    const title = test.title || test.TestTitle || '';
    const description = test.description || test.TestDescription || '';
    const searchLower = searchQuery.toLowerCase();
    return title.toLowerCase().includes(searchLower) ||
           description.toLowerCase().includes(searchLower);
  });
  
  const currentCategory = categories.find(cat => cat.$id === categoryFilter);
  
  const handleCategorySelect = (category: string) => {
    // Update URL with the selected category
    const params = new URLSearchParams(searchParams);
    if (category === 'all') {
      params.delete('category');
    } else {
      params.set('category', category);
    }
    setSearchParams(params);
    window.scrollTo(0, 0);
  };

  const handleTestClick = (testId: string) => {
    if (!user) {
      showNotification('Authentication Required', 'Please sign in to take this test.');
      return;
    }
    
    // Navigate to the test using the correct route
    navigate(`/test/${testId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  // Show categories view if 'all' is selected
  if (categoryFilter === 'all') {
    return (
      <AnimatePresence mode="wait">
        <motion.div 
          key="categories-view"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="container mx-auto px-4 pt-24 pb-16"
        >
          {/* Hero Section */}
          <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-6 md:p-8 mb-8 text-white">
            <div className="relative z-10 max-w-4xl mx-auto text-center">
              <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-3">
                Master Your Test Preparation
              </h1>
              <p className="text-lg text-blue-100 max-w-3xl mx-auto mb-6">
                Join thousands of successful candidates with our comprehensive practice tests designed by top educators
              </p>
              
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mt-6 max-w-md mx-auto">
                <div className="text-center">
                  <div className="text-2xl font-bold">50,000+</div>
                  <div className="text-blue-100 text-xs">Students</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">1,200+</div>
                  <div className="text-blue-100 text-xs">Selections</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">92%</div>
                  <div className="text-blue-100 text-xs">Success Rate</div>
                </div>
              </div>
              
              {/* Decorative elements */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500 rounded-full opacity-20"></div>
              <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-blue-400 rounded-full opacity-20"></div>
            </div>
          </div>

          {/* Search and Filter */}
          {/* All Categories Section */}
          <section className="mt-2">
            <div className="relative overflow-hidden bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 mb-4">
              <div className="relative z-10">
                {/* Header with title and categories count */}
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">All Categories</h2>
                  <span className="text-sm text-blue-700 dark:text-blue-300 font-medium px-3 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                    {categories.filter(category => {
                      if (!searchQuery) return true;
                      const query = searchQuery.toLowerCase();
                      return (
                        category.title.toLowerCase().includes(query) ||
                        category.description.toLowerCase().includes(query) ||
                        (category.languages?.some((lang: string) => lang.toLowerCase().includes(query)) || false)
                      );
                    }).length} {searchQuery ? 'results' : 'categories available'}
                  </span>
                </div>
                
                {/* Search bar */}
                <div className="mb-4">
                  <div className="relative max-w-x2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search categories..."
                      className="w-full pl-10 pr-4 py-3 text-base bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              
              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-blue-100 dark:bg-blue-900/20 rounded-full"></div>
              <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-indigo-100 dark:bg-indigo-900/20 rounded-full"></div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 px-2 sm:px-0">
              {categories
                .filter(category => {
                  if (!searchQuery) return true;
                  const query = searchQuery.toLowerCase();
                  return (
                    category.title.toLowerCase().includes(query) ||
                    category.description.toLowerCase().includes(query) ||
                    (category.languages?.some((lang: string) => lang.toLowerCase().includes(query)) || false)
                  );
                })
                .map((category) => (
                  <CategoryCard
                    key={category.$id}
                    category={{
                      $id: category.$id,
                      title: category.title || 'Uncategorized',
                      description: category.description || 'Test your knowledge with our practice tests',
                      thumbnail: category.thumbnail || 'https://via.placeholder.com/300x200?text=Test',
                      TestId: Array.isArray(category.TestId) ? category.TestId : [],
                      rating: typeof category.rating === 'number' ? category.rating : 4.5,
                      languages: category.languages || [],
                      attempts: category.attempts || 0
                    }}
                    testCount={Array.isArray(category.TestId) ? category.TestId.length : 0}
                    onClick={() => handleCategorySelect(category.title)}
                  />
                ))}
            </div>
          </section>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div 
        key={categoryFilter}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-28"
      >
        {/* Header Section */}
        <div className="fixed top-0 left-0 right-0 z-10 bg-gradient-to-r from-blue-600 to-indigo-700 dark:from-gray-800 dark:to-gray-900 shadow-md pt-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:items-center justify-between">
              <Button 
                variant="ghost" 
                className="w-max px-4 py-2 bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm transition-all duration-200"
                onClick={() => setSearchParams({ category: 'all' })}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Categories
              </Button>
              
              <div className="relative w-full sm:max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300" />
                <Input
                  type="search"
                  placeholder="Search tests..."
                  className="w-full pl-10 pr-4 py-5 text-base bg-white/10 border-0 text-white placeholder-gray-300 focus:ring-2 focus:ring-white/30 focus:bg-white/20 transition-colors duration-200"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <div className="mt-6">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
                {currentCategory?.title || 'All Tests'}
              </h1>
              <p className="text-blue-100 dark:text-blue-200">
                {filteredTests.length} {filteredTests.length === 1 ? 'test' : 'tests'} available
                {searchQuery && ` matching "${searchQuery}"`}
              </p>
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-40">
          {loading ? (
            <div className="flex justify-center items-center min-h-[400px]">
              <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-300">Loading tests...</p>
              </div>
            </div>
          ) : filteredTests.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTests.map((test: Test, index) => (
                <motion.div
                  key={test.$id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="h-full"
                >
                  <TestCard
                    id={test.$id}
                    title={test.title || test.TestTitle || 'Untitled Test'}
                    description={test.description || test.TestDescription || 'No description available'}
                    duration={test.duration || test.TestDuration || 0}
                    questionCount={test.questions?.length || 0}
                    category={test.category || currentCategory?.title || 'Uncategorized'}
                    thumbnail={test.thumbnail}
                    passingScore={test.passingScore}
                    onClick={() => handleTestClick(test.$id)}
                    className="cursor-pointer"
                  />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4">
                <Search className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No tests found</h3>
              <p className="text-gray-500 dark:text-gray-400">
                {searchQuery 
                  ? `We couldn't find any tests matching "${searchQuery}"`
                  : 'There are no tests available in this category at the moment.'}
              </p>
              {searchQuery && (
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setSearchQuery('')}
                >
                  Clear search
                </Button>
              )}
            </div>
          )}
        </main>
        
        {/* Footer */}
        <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <p className="text-center text-gray-500 dark:text-gray-400 text-sm">
              © {new Date().getFullYear()} Test Portal. All rights reserved.
            </p>
          </div>
        </footer>
      </motion.div>
    </AnimatePresence>
  );
}

// Global type declarations for window object
type GlobalWindow = Window & typeof globalThis & {
  // Add any global window properties here if needed
};

declare const window: GlobalWindow;
