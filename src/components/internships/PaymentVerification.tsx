import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { databases } from '../../Services/appwrite';
import { DATABASE_ID, INTERNSHIP_APPLICATIONS_COLLECTION_ID } from '../../Services/appwrite';
import { Query } from 'appwrite';
import { Loader, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function PaymentVerification() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isFromPayment, setIsFromPayment] = useState(false);
  
  // Check if we're coming from a payment flow or dashboard
  useEffect(() => {
    console.log('Location state changed:', location.state);
    if (location.state?.fromPayment || location.state?.fromDashboard) {
      const isPaymentFlow = !!location.state.fromPayment;
      console.log(`Detected navigation from ${isPaymentFlow ? 'payment flow' : 'dashboard'}`);
      setIsFromPayment(isPaymentFlow);
      // Clear the state to prevent showing the message again on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const checkPaymentStatus = useCallback(async () => {
    if (!user || !id) {
      const errMsg = !user ? 'User not authenticated' : 'Invalid internship ID';
      console.error('Payment verification error:', errMsg);
      setError(errMsg);
      setIsLoading(false);
      return false;
    }
    
    // Skip payment verification for teachers, admins, and subadmins
    if (user.role === 'teacher' || user.role === 'admin' || user.role === 'subadmin') {
      console.log('User is a teacher/admin, skipping payment verification');
      return true;
    }
    
    // If we just came from payment, give it a small delay to ensure the backend is updated
    if (isFromPayment) {
      console.log('Coming from payment flow, adding initial delay...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log(`Checking payment status for user: ${user.$id} and internship: ${id}`);
    
    try {
      // Fetch all applications for this user and internship
      const { documents: applications } = await databases.listDocuments(
        DATABASE_ID,
        INTERNSHIP_APPLICATIONS_COLLECTION_ID,
        [
          Query.equal('userId', user.$id),
          Query.equal('internship_id', id),
          Query.orderDesc('$createdAt')
        ]
      );

      console.log('Fetched applications:', applications);
      
      if (!applications || applications.length === 0) {
        const errMsg = 'No application found for this internship';
        console.error(errMsg);
        setError(errMsg);
        toast.error('Please complete the application process first');
        setTimeout(() => navigate(`/internships/${id}`), 2000);
        return false;
      }
      
      // Find the most recent completed payment if any
      const completedApplication = applications.find(app => app.payment_status === 'completed');
      const latestApplication = applications[0];
      
      // If there's a completed payment, use that
      const application = completedApplication || latestApplication;
      
      console.log('Payment verification status:', {
        payment_status: application.payment_status,
        applicationId: application.$id,
        isCompletedPayment: !!completedApplication,
        allApplications: applications.map(app => ({
          id: app.$id,
          status: app.payment_status,
          updatedAt: app.$updatedAt,
          isCurrent: app.$id === application.$id
        }))
      });
      
      const currentStatus = application.payment_status;
      
      if (currentStatus === 'completed') {
        // Payment is completed, redirect to dashboard
        console.log('Payment verified, redirecting to dashboard...');
        toast.success('Payment verified! Redirecting to dashboard...');
        
        // Use a small timeout to ensure the toast is visible
        setTimeout(() => {
          navigate(`/internships/${id}/dashboard/overview`, { 
            replace: true,
            state: { paymentVerified: true }
          });
        }, 1000);
        return true;
      } else if (currentStatus === 'pending' && retryCount < 5) {
        // Payment is still pending, retry after a delay
        const newRetryCount = retryCount + 1;
        console.log(`Payment still pending, retry ${newRetryCount} of 5...`);
        setRetryCount(newRetryCount);
        toast.info('Payment is still processing. Checking again...');
        return false;
      } else {
        const errMsg = retryCount >= 5 
          ? 'Payment verification timed out. Please check your payment status.'
          : 'No completed payment found for this internship';
          
        console.error(errMsg);
        setError(errMsg);
        toast.info(errMsg);
        setTimeout(() => navigate(`/internships/${id}`), 3000);
        return false;
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
      setError('Failed to verify payment status. Please try again.');
      toast.error('Failed to verify payment status');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, id, navigate, retryCount]);

  useEffect(() => {
    let isMounted = true;
    let timer: NodeJS.Timeout;

    const verifyPayment = async () => {
      try {
        // If we just came from payment, show a success message
        if (isFromPayment) {
          console.log('Showing payment success message');
          toast.success('Payment processed! Verifying your enrollment...');
        }
        
        console.log('Starting payment verification...');
        const isVerified = await checkPaymentStatus();
        
        // If payment is not verified and we haven't reached max retries, try again after a delay
        if (!isVerified && retryCount < 5 && isMounted) { // Updated to match new max retries
          console.log(`Scheduling next verification attempt (${retryCount + 1}/5)...`);
          const delay = isFromPayment ? 2000 : 3000; // Shorter delay if coming from payment
          timer = setTimeout(() => {
            if (isMounted) checkPaymentStatus();
          }, delay);
        }
      } catch (err) {
        console.error('Error in verifyPayment:', err);
        if (isMounted) {
          setError('An error occurred while verifying your payment');
          setIsLoading(false);
        }
      }
    };
    
    verifyPayment();
    
    // Cleanup function to clear any pending timeouts and state
    return () => {
      isMounted = false;
      if (timer) clearTimeout(timer);
      toast.dismiss();
    };
  }, [checkPaymentStatus, retryCount, isFromPayment]);

  const handleRetry = () => {
    setRetryCount(0);
    checkPaymentStatus();
  };

  const handleGoBack = () => {
    navigate(`/internships/${id}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
        {isLoading ? (
          <div className="space-y-4">
            <div className="flex justify-center">
              <Loader className="animate-spin h-12 w-12 text-blue-500" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
              {isFromPayment && retryCount === 0 
                ? 'Processing Your Payment...'
                : retryCount > 0 
                  ? 'Still verifying...'
                  : 'Verifying Payment Status'}
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              {isFromPayment && retryCount === 0
                ? 'This may take a moment...'
                : retryCount > 0 
                  ? `Attempt ${retryCount + 1} of 3`
                  : 'Please wait while we verify your payment...'}
            </p>
            {isFromPayment && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Do not refresh or close this page.
              </p>
            )}
          </div>
        ) : error ? (
          <div className="space-y-4">
            <div className="flex justify-center text-red-500">
              <AlertCircle className="h-12 w-12" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
              Payment Verification {retryCount >= 3 ? 'Timed Out' : 'Failed'}
            </h2>
            <p className="text-gray-600 dark:text-gray-300">{error}</p>
            <div className="space-y-4">
              <p className="text-red-500 dark:text-red-400">
                {error}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={handleRetry}
                  disabled={retryCount >= 3}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    retryCount >= 3 
                      ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {retryCount >= 3 ? 'Max Retries Reached' : 'Try Again'}
                </button>
                <button
                  onClick={handleGoBack}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  {retryCount >= 3 ? 'Back to Internship' : 'Cancel'}
                </button>
              </div>
              
              {(retryCount >= 2 || isFromPayment) && (
                <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg text-sm text-yellow-700 dark:text-yellow-300">
                  <p className="font-medium">Having trouble?</p>
                  <p className="mt-1">
                    If your payment was successful but verification is failing, 
                    please contact support with your payment reference.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-center text-green-500">
              <CheckCircle className="h-16 w-16" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              {isFromPayment ? 'Payment Successful!' : 'Access Granted'}
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              {isFromPayment 
                ? 'Your payment has been processed successfully.'
                : 'Your payment has been verified.'}
            </p>
            <p className="text-gray-600 dark:text-gray-300">
              Redirecting you to the dashboard...
            </p>
            <div className="pt-4">
              <button
                onClick={() => id && navigate(`/internships/${id}/dashboard/overview`)}
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Go to Dashboard Now
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
