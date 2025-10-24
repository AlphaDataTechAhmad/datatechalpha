import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { databases, DATABASE_ID } from '@/appwriteConfig';
import { Query } from 'appwrite';
import { Loader2, AlertCircle, ArrowLeft, XCircle, MessageCircle, Eye, EyeOff } from 'lucide-react';
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
  const [showPassword, setShowPassword] = useState(false);
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
          <div className="text-center space-y-6">
            <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-red-50 dark:bg-red-900/20 mb-2">
              <XCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl md:text-3xl font-bold text-black dark:text-black">
                Test Link Error
              </h2>
              <p className="text-black dark:text-black max-w-md mx-auto">
                {error || 'There was an issue with your test link. Please try again or contact support.'}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
              <Button 
                asChild 
                size="lg"
                className="px-6 py-3 text-base font-medium bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md transition-all"
              >
                <Link to="/" className="flex items-center justify-center gap-2">
                  <ArrowLeft className="h-5 w-5" />
                  Return to Home
                </Link>
              </Button>
              
              <Button 
                variant="outline" 
                size="lg"
                className="px-6 py-3 text-base font-medium border-blue-600 text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-900/30"
                asChild
              >
                <Link to="/contact" className="flex items-center justify-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Contact Support
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="relative">
          {/* Animated background elements */}
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
          
          <Card className="relative z-10 overflow-hidden border-0 shadow-2xl">
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
            
            <CardHeader className="space-y-1 text-center pt-8 pb-6 px-8">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg transform transition-transform duration-300 hover:scale-105">
                <AlertCircle className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Sign In to Start Test
              </CardTitle>
              <CardDescription className="text-gray-600">
                Please sign in with the email address you used to register for this test.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="px-8 pb-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-1.5">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full pl-10 py-5 text-base text-gray-900 bg-white border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    />
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                      Password
                    </label>
                    <Link 
                      to="/forgot-password" 
                      className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors duration-200"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full pl-10 pr-10 py-5 text-base text-gray-900 bg-white border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
                
                {error && (
                  <div className="animate-fade-in-down text-sm text-red-600 bg-red-50 p-4 rounded-lg flex items-start border border-red-100">
                    <XCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
                
                <Button 
                  type="submit" 
                  className="w-full py-6 text-base font-medium bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transform transition-all duration-300 hover:scale-[1.02] shadow-lg hover:shadow-xl"
                  disabled={loginLoading}
                >
                  {loginLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <span className="flex items-center justify-center">
                      <span>Sign In & Start Test</span>
                      <svg className="ml-2 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </span>
                  )}
                </Button>
                
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">New to our platform?</span>
                  </div>
                </div>
                
                <div className="text-center">
                  <Link 
                    to="/register" 
                    className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors duration-200"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Create an account
                    <svg className="ml-1 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default InternshipTestLogin;
