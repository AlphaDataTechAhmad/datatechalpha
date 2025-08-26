import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { databases, DATABASE_ID, EXAM_REGISTRATIONS_COLLECTION_ID } from '@/appwriteConfig';
import { getTestStatus, formatTimeRemaining } from '@/utils/testLinkUtils';
import { Button } from '@/components/ui/button';
import { Loader2, Clock, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

const TestConductor = () => {
  const { testId } = useParams<{ testId: string }>();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [testData, setTestData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    const loadTestData = async () => {
      try {
        // In a real app, you would fetch this from your database
        // This is a simplified example
        const response = await databases.getDocument(
          DATABASE_ID,
          EXAM_REGISTRATIONS_COLLECTION_ID,
          testId || ''
        );

        if (!response) {
          throw new Error('Test not found');
        }

        const status = getTestStatus(response.testStartTime, response.testEndTime);
        
        // If test is not active, don't need to check auth
        if (status !== 'active') {
          setTestData({
            ...response,
            status
          });
          setLoading(false);
          return;
        }

        // If test is active, check authentication
        if (!isAuthenticated) {
          // Redirect to login with return URL
          navigate(`/login?returnUrl=/test/${testId}`);
          return;
        }

        // Verify user is the one who should take this test
        if (response.userId !== user?.$id) {
          throw new Error('You are not authorized to take this test');
        }

        setTestData({
          ...response,
          status
        });
      } catch (err) {
        console.error('Error loading test:', err);
        setError(err instanceof Error ? err.message : 'Failed to load test');
      } finally {
        setLoading(false);
      }
    };

    if (testId) {
      loadTestData();
    }
  }, [testId, isAuthenticated, user, navigate]);

  // Update time remaining every second
  useEffect(() => {
    if (!testData?.testEndTime) return;

    const timer = setInterval(() => {
      setTimeLeft(formatTimeRemaining(testData.testEndTime));
      
      // Check if test has ended
      const status = getTestStatus(testData.testStartTime, testData.testEndTime);
      if (status === 'expired') {
        clearInterval(timer);
        setTestData((prev: any) => ({
          ...prev,
          status: 'expired'
        }));
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [testData?.testStartTime, testData?.testEndTime]);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
          <p className="text-gray-600">Loading test information...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <XCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      );
    }

    if (!testData) return null;

    switch (testData.status) {
      case 'scheduled':
        return (
          <div className="text-center py-12">
            <Clock className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Test Not Started</h2>
            <p className="text-gray-600 mb-6">
              This test is scheduled to start at {new Date(testData.testStartTime).toLocaleString()}
            </p>
            <p className="text-sm text-gray-500">
              Please come back at the scheduled time to begin your test.
            </p>
          </div>
        );
      
      case 'active':
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Clock className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700 font-medium">
                    {timeLeft}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  {testData.testTitle || 'Online Test'}
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  Test Instructions
                </p>
              </div>
              <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
                <dl className="sm:divide-y sm:divide-gray-200">
                  <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Duration</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {testData.duration || '60 minutes'}
                    </dd>
                  </div>
                  <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Ends at</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {new Date(testData.testEndTime).toLocaleString()}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button
                onClick={() => {
                  // Start the test
                  // This would navigate to the actual test questions
                  alert('Starting test...');
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Start Test
              </Button>
            </div>
          </div>
        );

      case 'expired':
        return (
          <div className="text-center py-12">
            <XCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Test Expired</h2>
            <p className="text-gray-600 mb-6">
              This test expired on {new Date(testData.testEndTime).toLocaleString()}
            </p>
            <p className="text-sm text-gray-500">
              Please contact the test administrator if you believe this is an error.
            </p>
          </div>
        );

      case 'completed':
        return (
          <div className="text-center py-12 px-4">
            <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Test Completed</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              You have successfully completed this test. Your results will be reviewed and you'll be notified of the next steps.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
              <Button 
                onClick={() => navigate('/')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Return to Home
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => window.open('mailto:support@datatechalpha.com', '_blank')}
                className="border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Contact Support
              </Button>
            </div>
            
            <p className="text-sm text-gray-500 mt-8">
              Need help? Email us at{' '}
              <a 
                href="mailto:support@datatechalpha.com" 
                className="text-blue-600 hover:underline"
              >
                support@datatechalpha.com
              </a>
            </p>
          </div>
        );

      default:
        return (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  Unable to determine test status. Please contact support.
                </p>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h1 className="text-2xl font-bold text-gray-900">
              {testData?.testTitle || 'Online Test'}
            </h1>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestConductor;
