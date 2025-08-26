import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
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
  // Add other fields that exist in your database
}

const InternshipCard: React.FC<{ internship: Internship }> = ({ internship }) => {
  // Only render if internship is active (if isActive is defined)
  if (internship.isActive === false) return null;
  
  return (
    <div className="bg-white dark:bg-dark-800 rounded-xl shadow-lg overflow-hidden transition-transform duration-300 hover:scale-105">
      <div className="h-48 overflow-hidden">
        <img 
          src={internship.image || '/images/default-internship.jpg'} 
          alt={internship.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/images/default-internship.jpg';
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
  const [internships, setInternships] = useState<Internship[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInternships = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch active internships from Appwrite
        const response = await databases.listDocuments(
          DATABASE_ID,
          INTERNSHIPS_COLLECTION_ID,
          [
            Query.equal('isActive', true), // Only fetch active internships
            Query.orderDesc('$createdAt') // Sort by creation date, newest first
          ]
        );
        
        // Map the documents to our Internship interface
        const fetchedInternships = response.documents.map(doc => ({
          $id: doc.$id,
          title: doc.title,
          description: doc.description || '',
          duration: doc.duration || 'Flexible',
          level: doc.level || 'All Levels',
          image: doc.image || '/images/default-internship.jpg',
          slug: doc.slug || doc.$id,
          isActive: doc.isActive !== undefined ? doc.isActive : true
        })) as Internship[];
        
        setInternships(fetchedInternships);
      } catch (err) {
        console.error('Error fetching internships:', err);
        setError('Failed to load internships. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInternships();
  }, []);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
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

  return (
    <div className="container mx-auto px-4 py-8">
      <Helmet>
        <title>Internships - Your Site Name</title>
        <meta name="description" content="Browse our available internship opportunities" />
      </Helmet>
      
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Internship Opportunities</h1>
        <p className="text-xl text-gray-600 dark:text-gray-300">Gain real-world experience and build your career</p>
      </div>
      
      {internships.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-xl font-medium text-gray-600 dark:text-gray-300">No internship opportunities available at the moment.</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Please check back later for updates.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {internships.map((internship) => (
            <InternshipCard key={internship.$id} internship={internship} />
          ))}
        </div>
      )}
    </div>
  );
};

export default InternshipsPage;
