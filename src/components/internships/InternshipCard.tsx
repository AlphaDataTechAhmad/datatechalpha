import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Clock, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { databases } from '../../appwriteConfig';
import { DATABASE_ID } from '../../appwriteConfig';
import { Query } from 'appwrite';

interface Internship {
  id: string;
  title: string;
  description?: string;
  image?: string;
  slug?: string;
  price?: number;
  currency?: string;
  testResult?: 'pass' | 'fail' | null;
  testScheduled?: boolean;
  paymentStatus?: 'pending' | 'completed';
}

const TEST_LINKS_COLLECTION_ID = '689923bc000f2d15a263';

const InternshipCard: React.FC<{ internship: Internship }> = ({ internship }) => {
  // Fallback image if none provided or if there's an error
  const fallbackImage = 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80';
  const [imageError, setImageError] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [status, setStatus] = useState<'not_scheduled' | 'scheduled' | 'passed' | 'failed' | 'enrolled'>('not_scheduled');
  const { user } = useAuth();

  // Memoize the image URL to prevent unnecessary re-renders
  const imageUrl = React.useMemo(() => {
    return imageError || !internship.image ? fallbackImage : internship.image;
  }, [imageError, internship.image, fallbackImage]);

  // Check application and exam status on component mount
  useEffect(() => {
    const checkStatus = async () => {
      if (!user) return;

      try {
        // First try to find by user ID and internship ID
        let response = await databases.listDocuments(
          DATABASE_ID,
          TEST_LINKS_COLLECTION_ID,
          [
            Query.equal('userId', user.$id),
            Query.equal('internship_id', internship.id),
            Query.limit(1)
          ]
        );

        // If no results and user has email, try by email and internship ID
        if (response.documents.length === 0 && user.email) {
          response = await databases.listDocuments(
            DATABASE_ID,
            TEST_LINKS_COLLECTION_ID,
            [
              Query.equal('email', user.email),
              Query.equal('internship_id', internship.id),
              Query.limit(1)
            ]
          );
        }

        const testLink = response.documents[0];
        console.log('Test link found:', testLink);

        if (testLink) {
          if (testLink.passed === true) {
            setStatus('passed');
          } else if (testLink.passed === false) {
            setStatus('failed');
          } else {
            setStatus('scheduled');
          }
        }

        // Check if enrolled (payment completed)
        if (internship.paymentStatus === 'completed') {
          setStatus('enrolled');
        }
      } catch (error) {
        console.error('Error checking test status:', error);
      }
    };

    checkStatus();
  }, [user, internship.id, internship.paymentStatus]);

  const renderActionButton = () => {
    switch (status) {
      case 'not_scheduled':
        return (
          <Link
            to={`/internships/${internship.id}`}
            className="w-full inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            <Briefcase className="w-4 h-4 mr-2" />
            Apply Now
          </Link>
        );
      case 'scheduled':
        return (
          <Link
            to={`/internships/${internship.id}`}
            className="w-full inline-flex items-center justify-center px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-medium rounded-lg transition-colors"
          >
            <Clock className="w-4 h-4 mr-2" />
            Give Exam
          </Link>
        );
      case 'passed':
        return (
          <Link
            to={`/internships/${internship.id}`}
            className="w-full inline-flex items-center justify-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Open Internship
          </Link>
        );
      case 'enrolled':
        return (
          <Link
            to={`/internships/${internship.id}`}
            className="w-full inline-flex items-center justify-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Open Internship
          </Link>
        );
      case 'failed':
        return (
          <Link
            to={`/internships/${internship.id}`}
            className="w-full inline-flex items-center justify-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
          >
            <XCircle className="w-4 h-4 mr-2" />
            Re-Apply
          </Link>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden h-full flex flex-col border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow duration-300">
      <div className="relative h-48 w-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
        <Link to={`/internships/${internship.id}`} className="block w-full h-full">
          {status === 'passed' && (
            <span className="absolute top-2 right-2 bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              Passed
            </span>
          )}
          {status === 'failed' && (
            <span className="absolute top-2 right-2 bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              Failed
            </span>
          )}
          {status === 'enrolled' && (
            <span className="absolute top-2 right-2 bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              Enrolled
            </span>
          )}
          {isImageLoading && (
            <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
          )}
          <img 
            src={imageUrl} 
            alt={internship.title || 'Internship'}
            onError={() => setImageError(true)}
            onLoad={() => setIsImageLoading(false)}
            className={`w-full h-full object-cover transition-transform duration-300 hover:scale-105 ${
              isImageLoading ? 'opacity-0' : 'opacity-100'
            }`}
            loading="lazy"
          />
        </Link>
      </div>
      
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
          {internship.title}
        </h3>
        
        {(internship.duration || internship.level) && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 mb-3">
            {internship.duration && <span>{internship.duration}</span>}
            {internship.duration && internship.level && <span>•</span>}
            {internship.level && <span>{internship.level}</span>}
          </div>
        )}
        
        {internship.description && (
          <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3">
            {internship.description}
          </p>
        )}
        
        <div className="mt-auto pt-3">
          {renderActionButton()}
        </div>
      </div>
    </div>
  );
};

export default InternshipCard;
