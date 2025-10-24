import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Quote, Briefcase, MapPin, Calendar, Award } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { databases, DATABASE_ID, INTERNSHIPS_COLLECTION_ID, Query } from '../../appwriteConfig';

// Define the Internship interface to match your database schema
interface Internship {
  $id: string;
  title: string;
  description: string;
  duration: string;
  level: string;
  image: string;
  slug: string;
  isActive?: boolean;
  paymentStatus?: 'pending' | 'completed';
}

interface Testimonial {
  $id: string;
  name: string;
  company: string;
  type: string;
  package: string;
  year: string;
  district: string;
  state: string;
  rating: number;
  comment: string;
  photoId: string;
  $createdAt: string;
  $updatedAt: string;
  avatar?: string;
}

const InternshipCard: React.FC<{ internship: Internship }> = ({ internship }) => {
  // Only render if internship is active (if isActive is defined)
  if (internship.isActive === false) return null;
  
  return (
    <div className="bg-white dark:bg-dark-800 rounded-xl shadow-lg overflow-hidden transition-transform duration-300 hover:scale-105">
      <div className="h-48 overflow-hidden">
        <img 
          src={internship.image || 'https://www.shutterstock.com/image-vector/default-avatar-profile-icon-transparent-260nw-2534623311.jpg'} 
          alt={internship.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://www.shutterstock.com/image-vector/default-avatar-profile-icon-transparent-260nw-2534623311.jpg';
          }}
        />
      </div>
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          {internship.title}
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
          {internship.description}
        </p>
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-sm rounded-full">
            {internship.duration || 'Flexible'}
          </span>
          <span className="px-3 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 text-sm rounded-full">
            {internship.level || 'All Levels'}
          </span>
        </div>
        <Link 
          to={`/internships/${internship.slug || internship.$id}`}
          className="block w-full text-center bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          View Details
        </Link>
      </div>
    </div>
  );
};

const InternshipsPage: React.FC = () => {
  console.log('Rendering InternshipsPage component');
  const { user } = useAuth();
  
  // Debug effect to log component mount/update
  useEffect(() => {
    console.log('InternshipsPage mounted');
    return () => console.log('InternshipsPage unmounted');
  }, []);
  
  const [internships, setInternships] = useState<Internship[]>([]);
  // Enhanced test testimonials with more realistic data
  const testTestimonials: Testimonial[] = [
    {
      $id: 'test1',
      name: 'Rahul Sharma',
      company: 'TechSolutions Inc.',
      type: 'Full-time',
      package: '12 LPA',
      year: '2024',
      district: 'Bangalore Urban',
      state: 'Karnataka',
      rating: 5,
      comment: 'The internship program at Data Tech Alpha was a game-changer for my career. The hands-on experience and mentorship helped me land my dream job at TechSolutions.',
      photoId: '',
      $createdAt: new Date().toISOString(),
      $updatedAt: new Date().toISOString(),
      avatar: 'https://randomuser.me/api/portraits/men/32.jpg'
    },
    {
      $id: 'test2',
      name: 'Priya Patel',
      company: 'DataDynamics',
      type: 'Full-time',
      package: '15 LPA',
      year: '2023',
      district: 'Mumbai',
      state: 'Maharashtra',
      rating: 5,
      comment: 'The industry-relevant projects and guidance from experts were instrumental in my professional growth. Highly recommended!',
      photoId: '',
      $createdAt: new Date().toISOString(),
      $updatedAt: new Date().toISOString(),
      avatar: 'https://randomuser.me/api/portraits/women/44.jpg'
    },
    {
      $id: 'test3',
      name: 'Amit Kumar',
      company: 'CloudNova',
      type: 'Full-time',
      package: '18 LPA',
      year: '2024',
      district: 'Hyderabad',
      state: 'Telangana',
      rating: 4,
      comment: 'The internship provided me with real-world experience that was directly applicable to my current role. The mentors were very supportive.',
      photoId: '',
      $createdAt: new Date().toISOString(),
      $updatedAt: new Date().toISOString(),
      avatar: 'https://randomuser.me/api/portraits/men/67.jpg'
    }
  ];

  // For debugging: Always use test testimonials
  const [testimonials, setTestimonials] = useState<Testimonial[]>(testTestimonials);
  
  // Debug effect to log testimonials state changes
  useEffect(() => {
    console.log('Testimonials state updated:', testimonials);
  }, [testimonials]);
  
  // Force update testimonials to test data
  useEffect(() => {
    console.log('Forcing test testimonials');
    setTestimonials(testTestimonials);
  }, []);
  
  // Debug effect to log testimonials state changes
  useEffect(() => {
    console.log('Testimonials state updated:', testimonials);
  }, [testimonials]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingTestimonials, setIsLoadingTestimonials] = useState(true);
  const [testimonialsError, setTestimonialsError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Test function to verify database connection
  const testDatabaseConnection = async () => {
    try {
      console.log('Testing database connection...');
      const response = await databases.listCollections(DATABASE_ID);
      console.log('Available collections:', response);
      
      // Try to list documents in the testimonials collection
      const testResponse = await databases.listDocuments(DATABASE_ID, 'testimonials');
      console.log('Testimonials collection test:', testResponse);
      
      return true;
    } catch (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setIsLoadingTestimonials(true);
      setError(null);
      setTestimonialsError(null);
      
      console.log('Starting to fetch data...');
      
      // Fetch active internships from Appwrite
      console.log('Starting to fetch data from Appwrite...');
      const [internshipsResponse, testimonialsResponse] = await Promise.all([
        databases.listDocuments(
          DATABASE_ID,
          INTERNSHIPS_COLLECTION_ID,
          [
            Query.equal('isActive', true),
            Query.orderDesc('$createdAt')
          ]
        ),
        databases.listDocuments(
          DATABASE_ID,
          'testimonials', // Your testimonials collection ID
          [
            Query.equal('isActive', true),
            Query.orderDesc('$createdAt'),
            Query.limit(6) // Limit to 6 testimonials
          ]
        ).catch(err => {
          console.error('Error fetching testimonials:', err);
          setTestimonialsError('Failed to load testimonials. Please try again later.');
          return { documents: [] }; // Return empty array if there's an error
        })
      ]);
      
      console.log('Raw Appwrite testimonials response:', JSON.stringify(testimonialsResponse, null, 2));
      
      // First, fetch the user's applications to check payment status
      let paymentStatuses: Record<string, 'pending' | 'completed'> = {};
      
      try {
        if (user) {
          const applications = await databases.listDocuments(
            DATABASE_ID,
            'internship_applications',
            [
              Query.equal('userId', user.$id),
              Query.limit(100) // Adjust limit as needed
            ]
          );
          
          applications.documents.forEach(app => {
            if (app.internship_id && app.payment_status) {
              paymentStatuses[app.internship_id] = app.payment_status;
            }
          });
        }
      } catch (error) {
        console.error('Error fetching payment statuses:', error);
      }
      
      // Map the documents to our Internship interface
      const fetchedInternships = internshipsResponse.documents.map(doc => ({
        $id: doc.$id,
        title: doc.title,
        description: doc.description || '',
        duration: doc.duration || 'Flexible',
        level: doc.level || 'All Levels',
        image: doc.image || '/images/default-internship.jpg',
        slug: doc.slug || doc.$id,
        isActive: doc.isActive !== undefined ? doc.isActive : true,
        paymentStatus: paymentStatuses[doc.$id] || undefined
      })) as Internship[];
      
      // Map testimonials
      const fetchedTestimonials = (testimonialsResponse?.documents || []).map(doc => {
        console.log('Processing testimonial:', doc);
        return {
          $id: doc.$id,
          name: doc.name || 'Anonymous',
          company: doc.company || 'Company',
          type: doc.type || 'Alumni',
          package: doc.package || 'N/A',
          year: doc.year || '2024',
          district: doc.district || '',
          state: doc.state || '',
          photoId: doc.photoId || '',
          $createdAt: doc.$createdAt || new Date().toISOString(),
          $updatedAt: doc.$updatedAt || new Date().toISOString()
        } as Testimonial;
      });
      
      console.log('Raw testimonials response:', testimonialsResponse);
      console.log('Mapped testimonials:', fetchedTestimonials);
      
      setInternships(fetchedInternships);
      
      if (fetchedTestimonials.length > 0) {
        console.log('Setting fetched testimonials:', fetchedTestimonials);
        setTestimonials(fetchedTestimonials);
      } else {
        console.warn('No testimonials found in the database. Using test data.');
        // Keep the default test testimonials if none found
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Failed to load data: ${errorMessage}`);
    } finally {
      setIsLoading(false);
      setIsLoadingTestimonials(false);
    }
  };

  useEffect(() => {
    // Run the test first
    testDatabaseConnection().then(success => {
      console.log('Database connection test:', success ? 'SUCCESS' : 'FAILED');
      // Then fetch the data
      fetchData();
    });
  }, []);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading internships...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Render Testimonial Card
  const renderTestimonialCard = (testimonial: Testimonial) => (
    <motion.div 
      key={testimonial.$id}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 h-full flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center mb-4">
        <img 
          src={testimonial.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(testimonial.name)}&background=random`} 
          alt={testimonial.name}
          className="w-14 h-14 rounded-full object-cover mr-4 border-2 border-primary-500"
        />
        <div>
          <h4 className="font-semibold text-lg text-gray-900 dark:text-white">{testimonial.name}</h4>
          <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center">
            <Briefcase className="w-4 h-4 mr-1" /> {testimonial.company}
          </p>
        </div>
      </div>
      
      <div className="flex items-center mb-3">
        {[...Array(5)].map((_, i) => (
          <Star 
            key={i} 
            className={`w-5 h-5 ${i < (testimonial.rating || 5) ? 'text-yellow-400 fill-current' : 'text-gray-300 dark:text-gray-600'}`} 
          />
        ))}
      </div>
      
      <Quote className="text-gray-400 dark:text-gray-500 w-6 h-6 mb-3 mx-auto" />
      <p className="text-gray-600 dark:text-gray-300 mb-4 italic text-center">
        "{testimonial.comment}"
      </p>
      
      <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-700">
        <div className="flex flex-wrap justify-center gap-2 mb-2">
          <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-sm flex items-center">
            <Award className="w-4 h-4 mr-1" /> {testimonial.package}
          </span>
          <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-full text-sm flex items-center">
            <Briefcase className="w-4 h-4 mr-1" /> {testimonial.type}
          </span>
        </div>
        <div className="text-center text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center">
          <MapPin className="w-4 h-4 mr-1" /> {testimonial.district}, {testimonial.state} • 
          <Calendar className="w-4 h-4 mx-1" /> {testimonial.year}
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
      <Helmet>
        <title>Internships | Data Tech Alpha</title>
        <meta name="description" content="Explore our internship opportunities and kickstart your career in tech with hands-on experience and industry mentorship." />
      </Helmet>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC42Ij48cGF0aCBkPSJNMzYgMzRjMC0yLjIwOS0xLjc5MS00LTQtNHMtNCAxLjc5MS00IDQgMS43OTEgNCA0IDQgNC0xLjc5MSA0LTRtMC0xMGMwLTMuMzEzLTIuNjg3LTYtNi02cy02IDIuNjg3LTYgNiAyLjY4NyA2IDYgNiA2LTIuNjg3IDYtNiIvPjwvZz48L2c+PC9zdmc+')]" />
        </div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.h1 
            className="text-4xl md:text-5xl font-bold mb-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Internship Programs
          </motion.h1>
          <motion.p 
            className="text-xl md:text-2xl opacity-90 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Gain real-world experience and kickstart your career with our industry-leading internship programs
          </motion.p>
        </div>
      </div>
      
      {/* Internships Grid */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">
          Our Internship Programs
        </h2>
        
        {internships.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-xl font-medium text-gray-600 dark:text-gray-300">No internship opportunities available at the moment.</h3>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Please check back later for updates.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {internships.map((internship) => (
              <motion.div
                key={internship.$id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <InternshipCard internship={internship} />
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl mb-4">
              Success Stories
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Hear from our alumni who transformed their careers through our internship programs
            </p>
          </div>
          
          {isLoadingTestimonials ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading success stories...</p>
            </div>
          ) : testimonialsError ? (
            <div className="text-center py-12 text-red-500">
              <p>{testimonialsError}</p>
            </div>
          ) : testimonials.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {testimonials.map(renderTestimonialCard)}
              </div>
              
              <div className="mt-12 text-center">
                <button 
                  className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors duration-200"
                  onClick={() => {
                    // Add functionality to view more testimonials
                    console.log('View more testimonials clicked');
                  }}
                >
                  View More Success Stories
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400">No success stories available at the moment.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InternshipsPage;