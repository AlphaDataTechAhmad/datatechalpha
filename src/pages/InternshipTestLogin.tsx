import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { databases, DATABASE_ID } from '@/appwriteConfig';
import { Query } from 'appwrite';
import { Loader2, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';


const INTERNSHIP_TEST_LINKS_COLLECTION = '689923bc000f2d15a263'; // Collection ID for internship_test_links

interface TestLink {
  $id: string;
  user_id: string;
  internship_id: string;
  is_used: boolean;
  expiry_date: string;
  start_date: string;
}

const InternshipTestLogin = () => {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated, login } = useAuth();
  const [loading, setLoading] = useState(true);
  const [testLink, setTestLink] = useState<TestLink | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [error, setError] = useState('');

  // Check if test link is valid
  useEffect(() => {
    const checkTestLink = async () => {
      if (!testId) {
        setError('Invalid test link');
        setLoading(false);
        return;
      }

      try {
        // Get test link from database
        const response = await databases.listDocuments(
          DATABASE_ID,
          INTERNSHIP_TEST_LINKS_COLLECTION,
          [
            Query.equal('$id', testId),
            Query.limit(1)
          ]
        );

        if (response.documents.length === 0) {
          setError('Invalid test link');
          setLoading(false);
          return;
        }

        const link = response.documents[0] as unknown as TestLink;
        setTestLink(link);

        // Check if test has already been used
        if (link.is_used) {
          setError('This test has already been submitted');
          setLoading(false);
          return;
        }

        // Check if test has expired
        const now = new Date();
        const expiryDate = new Date(link.expiry_date);
        if (now > expiryDate) {
          setError('This test link has expired. Please contact support for assistance.');
          setLoading(false);
          return;
        }

        // Check if test hasn't started yet
        const startDate = new Date(link.start_date);
        if (now < startDate) {
          setError(`This test is not available yet. It will be available on ${startDate.toLocaleString()}.`);
          setLoading(false);
          return;
        }

        // If user is already logged in and is the correct user, redirect to test
        if (isAuthenticated && user && user.$id === link.user_id) {
          navigate(`/internship-test/${testId}/take`);
          return;
        }

      } catch (err) {
        console.error('Error checking test link:', err);
        setError('An error occurred while validating the test link');
      } finally {
        setLoading(false);
      }
    };

    checkTestLink();
  }, [testId, isAuthenticated, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setError('');

    try {
      // Login user
      await login(email, password);
      
      // If login successful and test link is valid, redirect to test with internship ID
      if (testLink) {
        navigate(`/internship-test/${testId}/take`, {
          state: {
            internshipId: testLink.internship_id
          }
        });
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to login. Please check your credentials.');
    } finally {
      setLoginLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 mx-auto animate-spin text-primary-600 mb-4" />
          <p className="text-lg font-medium text-gray-700">Validating test link...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Test Link Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex flex-col space-y-3">
            <Button asChild>
              <Link to="/">
                Return to Home
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/contact">
                Contact Support
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex items-center justify-center mb-2">
            <div className="bg-blue-100 p-3 rounded-full">
              <AlertCircle className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Sign In to Start Test</CardTitle>
          <CardDescription>
            Please sign in with the email address you used to register for this test.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium leading-none">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium leading-none">
                  Password
                </label>
                <Link 
                  to="/forgot-password" 
                  className="text-sm text-primary-600 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full"
              />
            </div>
            
            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md flex items-start">
                <XCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loginLoading}
            >
              {loginLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In & Start Test'
              )}
            </Button>
            
            <div className="text-center text-sm text-gray-500 mt-4">
              Don't have an account?{' '}
              <Link 
                to="/register" 
                className="text-primary-600 hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                Sign up
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default InternshipTestLogin;
