import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function VerifyUsers() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [verifiedCount, setVerifiedCount] = useState(0);
  const { user } = useAuth();

  const navigate = useNavigate();

  // Check if user is admin on component mount
  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/unauthorized');
    }
  }, [user, navigate]);

  const verifyAllUsers = async () => {
    if (!user) {
      setMessage('❌ Error: You must be logged in to perform this action');
      return;
    }
    
    setIsLoading(true);
    setMessage('Verifying users...');
    
    try {
      console.log('Sending verification request...');
      const response = await fetch('/api/admin/verify-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        let errorDetails = '';
        
        try {
          const errorData = await response.text();
          console.log('Error response:', errorData);
          
          try {
            const parsedError = JSON.parse(errorData);
            errorMessage = parsedError.error || errorMessage;
            errorDetails = parsedError.details || '';
          } catch (e) {
            errorDetails = errorData;
          }
        } catch (e) {
          console.error('Error reading error response:', e);
        }
        
        throw new Error(
          `Failed to verify users: ${errorMessage}${errorDetails ? `\n\n${errorDetails}` : ''}`
        );
      }

      // Only try to parse JSON if there's content
      const responseText = await response.text();
      console.log('Response text:', responseText);
      
      let result;
      try {
        result = responseText ? JSON.parse(responseText) : { verifiedCount: 0 };
      } catch (e) {
        console.error('Error parsing response:', e);
        throw new Error('Received invalid response from server');
      }
      
      // If we get here, the request was successful
      const count = result.verifiedCount || 0;
      setVerifiedCount(count);
      setMessage(`✅ Successfully verified ${count} users!`);
    } catch (error: unknown) {
      console.error('Error verifying users:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setMessage(`❌ Error: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">User Verification</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            This tool will verify all unverified users in the system with a single click.
            Use this feature carefully as it bypasses email verification.
          </p>
          
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  <strong>Note:</strong> This action cannot be undone. Only proceed if you're certain you want to verify all users.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Button
              onClick={verifyAllUsers}
              disabled={isLoading}
              variant={isLoading ? 'outline' : 'default'}
              className={`${isLoading ? 'bg-gray-100' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Verifying...
                </>
              ) : 'Verify All Users'}
            </Button>
            
            {verifiedCount > 0 && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {verifiedCount} users verified
              </span>
            )}
          </div>

          {message && (
            <div className={`mt-4 p-3 rounded-md ${
              message.startsWith('✅') 
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' 
                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
            }`}>
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
