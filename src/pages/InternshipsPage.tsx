import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import { Loader2, Briefcase, Search, Filter, Star, Quote } from 'lucide-react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import InternshipCard from '../components/internships/InternshipCard';
import Testimonials3D from '../components/internships/Testimonials3D';
import { getAllInternships } from '../Services/internshipService';
import { getTestimonials } from '../Services/testimonialService';

// Import the Testimonial type from the service
import type { Testimonial } from '../Services/testimonialService';

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

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80';

const getCardImage = (imageUrl?: string) => {
  if (!imageUrl) return DEFAULT_IMAGE;
  return imageUrl.includes('w=1000') 
    ? imageUrl.replace('w=1000', 'w=500')
    : imageUrl;
};

const InternshipsPage: React.FC = () => {
  // State hooks - must be called unconditionally at the top level
  const [internships, setInternships] = useState<Internship[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTestimonials, setLoadingTestimonials] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedDuration, setSelectedDuration] = useState('all');
  const [isPageReady, setIsPageReady] = useState(false);
  
  // Other hooks - must be called unconditionally at the top level
  const navigate = useNavigate();
  const { user } = useAuth();
  const pageRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(pageRef, { once: true, amount: 0.1 });
  
  // Initial data fetch
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setLoadingTestimonials(true);
      setError(null);
      
      try {
        // Fetch both internships and testimonials in parallel
        const [internshipsData, testimonialsData] = await Promise.all([
          getAllInternships(),
          getTestimonials()
        ]);
        
        if (internshipsData && internshipsData.length > 0) {
          // Process and validate internships
          const mappedInternships = internshipsData
            .filter(internship => {
              const isValid = internship.$id && /^[a-zA-Z0-9_]{1,36}$/.test(internship.$id);
              if (!isValid) {
                console.warn('Skipping invalid internship ID:', internship.$id, internship);
              }
              return isValid;
            })
            .map((internship) => ({
              ...internship,
              id: internship.$id!, // We know $id exists because we filtered for it
              image: getCardImage(internship.image)
            }));
          
          console.log('Mapped internships:', mappedInternships);
          setInternships(mappedInternships);
          
          // Set testimonials if available
          if (testimonialsData) {
            setTestimonials(testimonialsData);
          } else {
            setTestimonials([]);
          }
        } else {
          // No internships available
          setInternships([]);
          setTestimonials(testimonialsData || []);
          toast.info('No internships available at the moment');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
        setLoadingTestimonials(false);
      }
    };

    fetchData();
  }, []);
  
  // Effect for page ready state
  useEffect(() => {
    if (!loading && !error) {
      const timer = setTimeout(() => setIsPageReady(true), 100);
      return () => clearTimeout(timer);
    }
  }, [loading, error]);
  
  // Memoized filtered internships
  const filteredInternships = useMemo(() => {
    return internships.filter((internship: Internship) => {
      if (!internship) return false;
      
      // Search term matching
      const matchesSearch = !searchTerm || 
        (internship.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
         (internship.shortDescription?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false));
      
      // Level matching
      const matchesLevel = selectedLevel === 'all' || 
        (internship.level?.toLowerCase() === selectedLevel.toLowerCase());
      
      // Duration matching
      const duration = parseInt(internship.duration, 10) || 0;
      const matchesDuration = selectedDuration === 'all' || 
        (selectedDuration === 'short' && duration <= 3) ||
        (selectedDuration === 'medium' && duration > 3 && duration <= 6) ||
        (selectedDuration === 'long' && duration > 6);
      
      return matchesSearch && matchesLevel && matchesDuration;
    });
  }, [internships, searchTerm, selectedLevel, selectedDuration]);

  // Render loading state
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

  // Render Testimonial Card
  const renderTestimonialCard = (testimonial: Testimonial) => (
    <motion.div 
      key={testimonial.id}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 h-full flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center mb-4">
        <img 
          src={testimonial.avatar} 
          alt={testimonial.name}
          className="w-12 h-12 rounded-full object-cover mr-4 border-2 border-primary-500"
        />
        <div>
          <h4 className="font-semibold text-gray-900 dark:text-white">{testimonial.name}</h4>
          <p className="text-sm text-gray-600 dark:text-gray-300">{testimonial.designation} at {testimonial.company}</p>
        </div>
      </div>
      <div className="flex items-center mb-3">
        {[...Array(5)].map((_, i) => (
          <Star 
            key={i} 
            className={`w-4 h-4 ${i < testimonial.rating ? 'text-yellow-400 fill-current' : 'text-gray-300 dark:text-gray-600'}`} 
          />
        ))}
      </div>
      <Quote className="text-gray-400 dark:text-gray-500 w-6 h-6 mb-2" />
      <p className="text-gray-600 dark:text-gray-300 mb-4 flex-grow">{testimonial.comment}</p>
      <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-700">
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full">
            {testimonial.package}
          </span>
          <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-full">
            {testimonial.type}
          </span>
          <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 rounded-full">
            {testimonial.year}
          </span>
        </div>
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          {testimonial.district}, {testimonial.state}
        </div>
      </div>
    </motion.div>
  );

  // Render error state
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



  return (
    <div 
      className="min-h-screen pt-24 pb-16 bg-gray-50 dark:bg-dark-900"
      style={{
        opacity: isPageReady ? 1 : 0,
        transition: 'opacity 0.3s ease'
      }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full"
        >
          <div className="container mx-auto px-4">
            {/* Hero Section */}
            <div className="relative text-center mb-16 py-16 px-6 overflow-hidden rounded-3xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 mx-4">
              {/* Simple background */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800"></div>
              
              {/* Content container with high z-index */}
              <div className="relative z-10">
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
                  Find Your Dream Internship
                </h1>
                <p className="text-xl text-gray-700 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
                  Gain real-world experience and kickstart your career with our industry-leading internship programs
                </p>
                
                <div className="max-w-2xl mx-auto relative">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                    <input
                      type="text"
                      placeholder="Search internships..."
                      className="w-full pl-12 pr-6 py-4 rounded-full border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Filter className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                  </div>
                </div>
              </div>
            </div>

            {/* Testimonials Section */}
            {loadingTestimonials ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : testimonials.length > 0 ? (
            <Testimonials3D testimonials={testimonials} />
          ) : (
            <div className="text-center py-12 text-gray-500">
              No testimonials available at the moment.
            </div>
          )}

            {/* Main Content */}
            <div className="container mx-auto px-4 mt-12">
              {/* Filters */}
              <div className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex flex-wrap gap-2 mb-4">
                  <button
                    onClick={() => setSelectedLevel('all')}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      selectedLevel === 'all'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    All Levels
                  </button>
                  {['Beginner', 'Intermediate', 'Advanced'].map((level) => (
                    <button
                      key={level}
                      onClick={() => setSelectedLevel(level)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        selectedLevel === level
                          ? 'bg-blue-600 text-white'
                          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400 self-center">Duration:</span>
                  <select
                    value={selectedDuration}
                    onChange={(e) => setSelectedDuration(e.target.value)}
                    className="px-4 py-2 rounded-full text-sm font-medium bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Durations</option>
                    <option value="short">1-3 months</option>
                    <option value="medium">3-6 months</option>
                    <option value="long">6+ months</option>
                  </select>
                </div>
              </div>

              {/* Internships Grid */}
              <div className="mb-8 w-full">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {filteredInternships.length} Internship{filteredInternships.length !== 1 ? 's' : ''} Found
                  </h2>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Showing {filteredInternships.length} of {internships.length} internships
                  </div>
                </div>
                
                {filteredInternships.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 px-4 sm:px-0">
                    {filteredInternships.map((internship, index) => (
                      <div 
                        key={internship.id}
                        className="h-full"
                        style={{
                          opacity: 0,
                          animation: `fadeIn 0.5s ease-out ${index * 0.1}s forwards`
                        }}
                      >
                        <InternshipCard internship={internship} />
                      </div>
                    ))}
                    <style jsx={"true"} global={"true"}>
                      {`
                        @keyframes fadeIn {
                          from { opacity: 0; transform: translateY(10px); }
                          to { opacity: 1; transform: translateY(0); }
                        }
                      `}
                    </style>
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <Briefcase className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-xl font-medium text-gray-600 dark:text-gray-300">No internships found</h3>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">
                      {searchTerm 
                        ? 'No internships match your search criteria. Try different keywords.'
                        : 'No internship opportunities are currently available. Please check back later.'}
                    </p>
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Clear Search
                      </button>
                    )}
                  </div>
                )}
              </div>
              
              {/* Call to Action */}
              {filteredInternships.length > 0 && (
                <div className="mt-16 text-center">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Can't find what you're looking for?</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-2xl mx-auto">
                    We're constantly adding new internship opportunities. Join our newsletter to stay updated on the latest openings.
                  </p>
                  <button className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
                    Subscribe to Updates
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default InternshipsPage;