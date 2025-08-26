import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import { Loader2, Briefcase, Search, Filter } from 'lucide-react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import InternshipCard from '../components/internships/InternshipCard';
import { getAllInternships } from '../Services/internshipService';

export interface Internship {
  id: string;
  $id?: string;
  title: string;
  slug: string;
  description: string;
  shortDescription: string;
  duration: string;
  level: string;
  startDate: string;
  endDate: string;
  price: number;
  currency: string;
  isActive?: boolean;
  maxStudents?: number;
  currentStudents?: number;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
  image?: string;
}

const InternshipsPageNew: React.FC = () => {
  // State hooks
  const [internships, setInternships] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedDuration, setSelectedDuration] = useState('all');
  const [isPageReady, setIsPageReady] = useState(false);
  
  // Refs and hooks
  const navigate = useNavigate();
  const { user } = useAuth();
  const pageRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(pageRef, { once: true, amount: 0.1 });

  // Data fetching
  useEffect(() => {
    const fetchInternships = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const fetchedInternships = await getAllInternships();
        
        if (fetchedInternships?.length > 0) {
          const mappedInternships = fetchedInternships.map((internship, index) => ({
            ...internship,
            id: internship.$id || `temp-${index}`,
            image: getCardImage(internship.image)
          }));
          
          setInternships(mappedInternships);
        } else {
          setInternships([]);
          toast.info('No internships available at the moment');
        }
      } catch (err: any) {
        const errorMessage = err.response?.message || err.message || 'Failed to load internships';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
        // Set page as ready after initial load
        setTimeout(() => setIsPageReady(true), 100);
      }
    };

    fetchInternships();
  }, []);

  // Filtering logic
  const filteredInternships = React.useMemo(() => {
    return internships.filter(internship => {
      if (!internship) return false;
      
      const matchesSearch = !searchTerm || 
        (internship.title?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (internship.shortDescription?.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesLevel = selectedLevel === 'all' || 
        (internship.level?.toLowerCase() === selectedLevel.toLowerCase());
      
      const duration = parseInt(internship.duration);
      const matchesDuration = selectedDuration === 'all' || 
        (selectedDuration === 'short' && !isNaN(duration) && duration <= 3) ||
        (selectedDuration === 'medium' && !isNaN(duration) && duration > 3 && duration <= 6) ||
        (selectedDuration === 'long' && !isNaN(duration) && duration > 6);
      
      return matchesSearch && matchesLevel && matchesDuration;
    });
  }, [internships, searchTerm, selectedLevel, selectedDuration]);

  // Helper function to get card image URL
  const getCardImage = (imageUrl?: string) => {
    if (!imageUrl) return 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80';
    return imageUrl.replace('w=1000', 'w=500');
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="h-16 w-16 animate-spin text-primary-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Loading Internships</h2>
          <p className="text-gray-600 dark:text-gray-400">Finding the best opportunities for you...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
            <svg className="h-8 w-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Something went wrong</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors w-full sm:w-auto"
            >
              Try Again
            </button>
            {error.includes('log in') && (
              <button
                onClick={() => navigate('/login', { state: { from: '/internships' } })}
                className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700 rounded-md transition-colors w-full sm:w-auto"
              >
                Go to Login
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Main content
  return (
    <div 
      ref={pageRef}
      className={`min-h-screen pt-24 pb-16 bg-gray-50 dark:bg-dark-900 transition-opacity duration-300 ${
        isPageReady ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key="internships-page"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full"
        >
          <div className="container mx-auto px-4">
            {/* Hero Section */}
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={isInView ? { y: 0, opacity: 1 } : {}}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
                Find Your Dream Internship
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
                Gain real-world experience and kickstart your career with our industry-leading internship programs
              </p>
              
              {/* Search Bar */}
              <div className="max-w-2xl mx-auto relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search internships..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </motion.div>

            {/* Filters */}
            <div className="mb-8 flex flex-wrap gap-4 justify-center">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter by:</span>
              </div>
              
              {/* Level Filter */}
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
              
              {/* Duration Filter */}
              <select
                value={selectedDuration}
                onChange={(e) => setSelectedDuration(e.target.value)}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Any Duration</option>
                <option value="short">Short (1-3 months)</option>
                <option value="medium">Medium (4-6 months)</option>
                <option value="long">Long (6+ months)</option>
              </select>
            </div>

            {/* Internships Grid */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
                {filteredInternships.length} Internship{filteredInternships.length !== 1 ? 's' : ''} Available
              </h2>
              
              {filteredInternships.length > 0 ? (
                <motion.div 
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                  initial="hidden"
                  animate={isInView ? "visible" : "hidden"}
                  variants={{
                    hidden: { opacity: 0 },
                    visible: {
                      opacity: 1,
                      transition: {
                        staggerChildren: 0.1,
                        delayChildren: 0.2
                      }
                    }
                  }}
                >
                  {filteredInternships.map((internship) => (
                    <motion.div
                      key={internship.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <InternshipCard internship={internship} />
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <div className="text-center py-12">
                  <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No internships found</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {searchTerm || selectedLevel !== 'all' || selectedDuration !== 'all'
                      ? 'Try adjusting your search or filters'
                      : 'Check back later for new opportunities'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default InternshipsPageNew;
