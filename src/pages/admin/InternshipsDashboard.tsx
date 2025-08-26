import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { databases, DATABASE_ID, INTERNSHIPS_COLLECTION_ID } from '../../appwriteConfig';
import { Query } from 'appwrite';
import { useAuth } from '../../contexts/AuthContext';
import type { Internship } from '../internships/[slug]';

const InternshipsDashboard: React.FC = () => {
  const [internships, setInternships] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const toggleInternshipStatus = async (id: string, currentStatus: boolean) => {
    try {
      await databases.updateDocument(
        DATABASE_ID,
        INTERNSHIPS_COLLECTION_ID,
        id,
        { isActive: !currentStatus }
      );
      
      setInternships(prev => 
        prev.map(item => 
          item.$id === id ? { ...item, isActive: !currentStatus } : item
        )
      );
    } catch (err) {
      console.error('Error toggling internship status:', err);
      setError('Failed to update internship status');
    }
  };

  const fetchInternships = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      // Check authentication first
      if (!user || !isAuthenticated) {
        console.log('User not authenticated, showing public internships');
        // Continue to show public internships even if not authenticated
      } else {
        console.log('Current user:', {
          id: user.$id,
          email: user.email,
          isAuthenticated
        });
      }

      console.log('Fetching internships with:', {
        databaseId: DATABASE_ID,
        collectionId: INTERNSHIPS_COLLECTION_ID,
        userId: user.$id,
        userEmail: user.email,
        timestamp: new Date().toISOString()
      });
      
      // Define queries
      const queries = [
        Query.orderDesc('$createdAt'),
        Query.limit(100)
      ];
      
      console.log('Sending query to Appwrite:', {
        databaseId: DATABASE_ID,
        collectionId: INTERNSHIPS_COLLECTION_ID,
        queries: queries.map(q => q.toString())
      });
      
      // Make the API call to fetch internships
      const response = await databases.listDocuments(
        DATABASE_ID,
        INTERNSHIPS_COLLECTION_ID,
        queries
      );
      
      console.log('API Response received:', {
        total: response.total,
        documents: response.documents?.length || 0,
        firstDocumentId: response.documents?.[0]?.$id || 'none',
        documentKeys: response.documents?.[0] ? Object.keys(response.documents[0]) : []
      });
      
      if (response && Array.isArray(response.documents)) {
        console.log('Setting internships:', response.documents);
        setInternships(response.documents as unknown as Internship[]);
        if (response.documents.length === 0) {
          console.warn('No internships found in the collection');
          setError('No internships found. Please add some internships.');
        }
      } else {
        console.warn('Unexpected response format:', response);
        setError('Unexpected response format from server');
      }
    } catch (err: any) {
      console.error('Error in fetchInternships:', {
        message: err.message,
        code: err.code,
        type: err.type,
        stack: err.stack
      });
      setError(`Failed to load internships: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, [user, isAuthenticated]);

  useEffect(() => {
    const loadInternships = async () => {
      try {
        console.log('Loading internships...');
        
        // If not authenticated, still load the page but show public content
        if (!authLoading) {
          console.log('Loading internships for user...');
          await fetchInternships();
        }
      } catch (error) {
        console.error('Error loading internships:', error);
        setError('An error occurred while loading internships');
        setLoading(false);
      }
    };
    
    loadInternships();
  }, [authLoading, fetchInternships]);

  const filteredInternships = React.useMemo(() => 
    internships.filter((internship: Internship) => 
      (internship.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (internship.tags?.some((tag: string) => 
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      ) || false)
    ),
    [internships, searchTerm]
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
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
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Internships Dashboard</h1>
        <Link
          to="/admin/internships/new"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add New Internship
        </Link>
      </div>

      <div className="mb-6">
        <div className="relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>
          <input
            type="text"
            className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border"
            placeholder="Search internships..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {filteredInternships.length > 0 ? (
            filteredInternships.map((internship) => (
              <li key={internship.$id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <Link 
                      to={`/internships/${internship.slug}`}
                      className="text-sm font-medium text-blue-600 hover:text-blue-500 truncate"
                    >
                      {internship.title}
                    </Link>
                    <div className="ml-2 flex-shrink-0 flex">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        internship.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {internship.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <p className="flex items-center text-sm text-gray-500">
                        {internship.shortDescription}
                      </p>
                      <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                        <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                        </svg>
                        {new Date(internship.startDate).toLocaleDateString()} - {new Date(internship.endDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                      <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                      </svg>
                      {internship.currentStudents || 0} enrolled
                    </div>
                  </div>
                  <div className="mt-4 flex justify-between items-center">
                    <div className="flex space-x-2">
                      {internship.tags && internship.tags.slice(0, 3).map((tag, index) => (
                        <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="flex space-x-2">
                      <Link
                        to={`/admin/internships/edit/${internship.$id}`}
                        className="text-sm font-medium text-blue-600 hover:text-blue-500"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => toggleInternshipStatus(internship.$id!, internship.isActive ?? false)}
                        className={`text-sm font-medium ${
                          internship.isActive 
                            ? 'text-yellow-600 hover:text-yellow-500' 
                            : 'text-green-600 hover:text-green-500'
                        }`}
                      >
                        {internship.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))
          ) : (
            <li className="px-4 py-12 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No internships</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating a new internship.
              </p>
              <div className="mt-6">
                <Link
                  to="/admin/internships/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  New Internship
                </Link>
              </div>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default InternshipsDashboard;
