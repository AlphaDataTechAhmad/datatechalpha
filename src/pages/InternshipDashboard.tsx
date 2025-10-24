import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { databases } from '../Services/appwrite';
import { DATABASE_ID, INTERNSHIPS_COLLECTION_ID, INTERNSHIP_APPLICATIONS_COLLECTION_ID } from '../Services/appwrite';
import { Query } from 'appwrite';
import { Clock, Award, ChevronLeft, Loader, FileText, Video, CheckCircle, Home, Book } from 'lucide-react';
import { toast } from 'react-toastify';

interface Internship {
  $id: string;
  title: string;
  description: string;
  duration: string;
  company: string;
  location: string;
  stipend: string;
  startDate: string;
  applyBy: string;
  image: string;
  requirements: string[];
  responsibilities: string[];
  skills: string[];
  type: 'full-time' | 'part-time' | 'remote';
  category: string;
  createdAt: string;
  updatedAt: string;
}

interface InternshipApplication {
  $id: string;
  userId: string;
  internship_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  appliedAt: string;
  payment_status: 'pending' | 'completed' | 'failed';
  test_link?: string;
  test_attempt_id?: string;
  test_score?: number;
  test_status?: 'not_taken' | 'in_progress' | 'completed';
}


const InternshipDashboard: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [verifyingPayment, setVerifyingPayment] = useState(true);
  const [internship, setInternship] = useState<Internship | null>(null);
  const [application, setApplication] = useState<InternshipApplication | null>(null);
  
  // Navigation items
  const navItems = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <Home className="w-5 h-5" />,
      path: `/internships/${id}/dashboard/overview`
    },
    {
      id: 'live-classes',
      label: 'Live Classes',
      icon: <Video className="w-5 h-5" />,
      path: `/internships/${id}/dashboard/live-classes`,
      requiresPayment: true
    },
    {
      id: 'notes',
      label: 'Study Materials',
      icon: <Book className="w-5 h-5" />,
      path: `/internships/${id}/dashboard/notes`,
      requiresPayment: true
    }
  ];
  
  // Check if payment is completed, if the internship is free, or if user is a teacher/admin
  const isPaymentCompleted = application?.payment_status === 'completed' || 
    (internship?.stipend === '0' || internship?.stipend === 'Free') ||
    user?.role === 'teacher' || user?.role === 'admin' || user?.role === 'subadmin';

  // Verify payment status and load internship data
  useEffect(() => {
    const verifyPaymentStatus = async () => {
      if (!id || !user) {
        setLoading(false);
        setVerifyingPayment(false);
        return;
      }

      try {
        setVerifyingPayment(true);
        
        console.log('Fetching application for user:', user.$id, 'and internship:', id);
        
        // Fetch user's application for this internship
        const { documents: applications } = await databases.listDocuments(
          DATABASE_ID,
          INTERNSHIP_APPLICATIONS_COLLECTION_ID,
          [
            Query.equal('userId', user.$id),
            Query.equal('internship_id', id)
          ]
        );

        console.log('Fetched applications:', applications);
        const applicationData = applications[0] as unknown as InternshipApplication;
        
        if (!applicationData) {
          console.error('No application found for this internship');
          toast.error('No application found for this internship');
          navigate(`/internships/${id}`);
          return;
        }
        
        console.log('Application data:', applicationData);
        setApplication(applicationData);
        
        // Fetch internship data first
        console.log('Fetching internship data for ID:', id);
        const internshipData = await databases.getDocument(
          DATABASE_ID,
          INTERNSHIPS_COLLECTION_ID,
          id
        ) as unknown as Internship;
        
        console.log('Fetched internship data:', internshipData);
        
        if (!internshipData) {
          console.error('Internship not found');
          toast.error('The requested internship could not be found.');
          navigate('/internships');
          return;
        }
        
        setInternship(internshipData);
        
        // Check if user has admin/teacher privileges
        if (user?.role === 'teacher' || user?.role === 'admin' || user?.role === 'subadmin') {
          console.log('User is a teacher/admin - allowing full access');
          return;
        }
        
        // If we're on the payment verification page, don't redirect
        if (location.pathname.includes('verify-payment')) {
          console.log('Already on payment verification page');
          return;
        }
        
        // Check all applications for a completed payment
        const hasCompletedPayment = applications.some(app => app.payment_status === 'completed');
        const isFreeInternship = internshipData.stipend === '0' || internshipData.stipend === 'Free';
        
        console.log('Payment status check:', {
          isFreeInternship,
          hasCompletedPayment,
          stipend: internshipData.stipend,
          applications: applications.map(app => ({
            id: app.$id,
            payment_status: app.payment_status,
            isCurrent: app.$id === applicationData?.$id
          }))
        });
        
        // Only redirect if no completed payment and not a free internship
        if (!hasCompletedPayment && !isFreeInternship) {
          console.log('No completed payment found, redirecting to payment page');
          toast.info('Please complete the payment process');
          navigate(`/internships/${id}/verify-payment`, { 
            state: { fromDashboard: true },
            replace: true 
          });
        }
      } catch (error) {
        console.error('Error in verifyPaymentStatus:', {
          error,
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          id,
          userId: user?.$id
        });
        toast.error('Failed to load internship details. Please try again.');
        navigate(`/internships`);
      } finally {
        setLoading(false);
        setVerifyingPayment(false);
      }
    };

    verifyPaymentStatus();
  }, [id, user, navigate, location.pathname]);

  if (verifyingPayment || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader className="animate-spin h-12 w-12 text-blue-500 mx-auto mb-4" />
          <p className="text-lg text-gray-600 dark:text-gray-300">
            {verifyingPayment ? 'Verifying payment status...' : 'Loading internship dashboard...'}
          </p>
          {verifyingPayment && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Please wait while we verify your access...
            </p>
          )}
        </div>
      </div>
    );
  }

  if (!internship) {
    // If we're still verifying but don't have the internship yet, show a loading state
    if (verifyingPayment) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader className="animate-spin h-12 w-12 text-blue-500 mx-auto mb-4" />
            <p className="text-lg text-gray-600 dark:text-gray-300">Preparing your dashboard...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
          <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Internship Not Found</h2>
          <p className="mb-4 text-gray-600 dark:text-gray-300">
            The requested internship could not be found or you don't have permission to view it.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Go Back
            </button>
            <button
              onClick={() => navigate('/internships')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Browse Internships
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/internships')}
          className="flex items-center text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 mb-6 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          Back to Internships
        </button>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader className="animate-spin h-8 w-8 text-blue-500" />
          </div>
        ) : internship ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
            <div className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row gap-8">
                {/* Sidebar Navigation */}
                <div className="w-full md:w-1/4 lg:w-1/5">
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 sticky top-4">
                    <div className="mb-6">
                      <img
                        src={internship.image || '/placeholder-internship.jpg'}
                        alt={internship.title}
                        className="w-full h-32 object-cover rounded-lg mb-4"
                      />
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                        {internship.title}
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        {internship.company} • {internship.type}
                      </p>
                      
                      {isPaymentCompleted && (
                        <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-sm p-3 rounded-lg mb-4">
                          <div className="flex items-center">
                            <CheckCircle className="w-4 h-4 mr-2" />
                            <span>Enrolled</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <nav className="space-y-1">
                      {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        const navItemClass = `flex items-center px-4 py-3 rounded-lg transition-colors ${
                          isActive
                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                        }`;

                        // Always show all navigation items
                        return (
                          <Link
                            key={item.id}
                            to={item.path}
                            className={navItemClass}
                          >
                            <span className="mr-3">{item.icon}</span>
                            {item.label}
                          </Link>
                        );
                      })}
                    </nav>

                    <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                      <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                        Internship Details
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center text-sm">
                          <Clock className="w-4 h-4 mr-2 text-gray-400" />
                          <span className="text-gray-700 dark:text-gray-300">
                            {internship.duration}
                          </span>
                        </div>
                        <div className="flex items-center text-sm">
                          <Award className="w-4 h-4 mr-2 text-gray-400" />
                          <span className="text-gray-700 dark:text-gray-300">
                            {internship.stipend || 'Unpaid'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Main Content */}
                <div className="flex-1">
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
                    <Outlet context={{ internship, application, user }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">No internship data available</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InternshipDashboard;
