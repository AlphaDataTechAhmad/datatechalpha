import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { databases, DATABASE_ID } from '@/appwriteConfig';
import { Query } from 'appwrite';
import { Loader2, AlertCircle, Clock, ArrowLeft, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
// Dynamically import test data based on internshipId
const loadTestData = async (internshipId: string) => {
  try {
    console.log('Loading test data for internship ID:', internshipId);
    
    // Map of internship IDs to their corresponding test data files
    const testDataMap: Record<string, () => Promise<{ default: any }>> = {
      '68992eb5000dcc34dc1f': () => import('@/data/tests/internship-1'),
      '6898b14f00083f004360': () => import('@/data/tests/internship-2'),
      '6899578b00398ade2cad': () => import('@/data/tests/internship-3'),
      '689b080e001f591184bd': () => import('@/data/tests/internship-4'),
      // Add other internship IDs and their corresponding imports here
    };

    const importTestData = testDataMap[internshipId];
    
    if (!importTestData) {
      throw new Error(`No test data found for internship ID: ${internshipId}`);
    }

    const module = await importTestData();
    console.log('Loaded test data:', module.default);
    return module.default;
  } catch (error) {
    console.error('Error loading test data:', error);
    throw error;
  }
};

const INTERNSHIP_TEST_LINKS_COLLECTION = '689923bc000f2d15a263'; // Collection ID for internship_test_links

interface Question {
  id: string | number;
  question: string;
  options?: string[];
  correctAnswer?: number;
  points?: number;
  type?: string;
}

interface Section {
  id: string;
  title: string;
  description?: string;
  questionCount?: number;
  questions: Question[];
}

interface TestData {
  internshipId: string;
  testId: string;
  title: string;
  description: string;
  duration: number;
  category: string;
  thumbnail: string;
  passingScore: number;
  instructions: {
    generalInstructions: string[];
    markingScheme?: Record<string, any>;
    navigationInstructions?: string[];
    importantNotes?: string[];
    beforeTest?: string[];
    duringTest?: string[];
  };
  sections: Section[];
}

interface TestLink {
  $id: string;
  user_id: string;  // Changed from userId to user_id to match database
  userId?: string;  // Keep for backward compatibility
  internship_id: string;
  start_date: string;
  expiry_date: string;
  is_used: boolean;
  created_at: string;
  full_name: string;
  email: string;
  phone: string;
  test_attempt_id?: string;
}

const NewInternshipTestConductor = () => {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated, login } = useAuth();
  
  const [status, setStatus] = useState<'loading' | 'validating' | 'ready' | 'error' | 'unauthorized' | 'expired' | 'not_started' | 'completed'>('loading');
  const [error, setError] = useState('');
  const [testLink, setTestLink] = useState<TestLink | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Check test link validity and activation status
  useEffect(() => {
    const checkTestLink = async () => {
      if (!testId) {
        setError('Invalid test link');
        setStatus('error');
        return;
      }

      setStatus('validating');

      try {
        console.log('Validating test link:', testId);
        
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
          console.log('Test link not found');
          setError('Test link not found');
          setStatus('error');
          return;
        }

        const link = response.documents[0] as unknown as TestLink;
        console.log('Retrieved test link:', link);
        
        // If user is authenticated, verify they are the test taker
        const testLinkUserId = link.user_id || link.userId; // Handle both formats
        if (isAuthenticated && user?.$id !== testLinkUserId) {
          console.log('User ID mismatch:', { 
            testLinkUserId: testLinkUserId,
            currentUserId: user?.$id,
            testLinkData: link
          });
          setError('You are not authorized to take this test. Please ensure you are logged in with the correct account.');
          setStatus('unauthorized');
          return;
        }
        
        setTestLink(link);

        // Check if test has been used
        if (link.is_used) {
          console.log('Test already completed');
          setError('This test has already been completed');
          setStatus('completed');
          return;
        }

        const now = new Date();
        const startDate = new Date(link.start_date);
        const expiryDate = new Date(link.expiry_date);

        // Check if test has expired
        if (now > expiryDate) {
          setError('This test link has expired');
          setStatus('expired');
          return;
        }

        // Check if test has started (24h after creation)
        if (now < startDate) {
          setStatus('not_started');
          return;
        }

        // If we get here, the test is valid and active
        setStatus('ready');
      } catch (err) {
        console.error('Error validating test link:', err);
        setError('An error occurred while validating the test link');
        setStatus('error');
      }
    };

    checkTestLink();
  }, [testId]);

  // Handle login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setError('');

    try {
      await login(email, password);
      // After successful login, the auth state will update and the effect will re-run
    } catch (err) {
      setError('Invalid email or password');
      console.error('Login error:', err);
    } finally {
      setLoginLoading(false);
    }
  };

  // Start the test
  const startTest = async () => {
    if (!testLink) return;
    
    try {
      // Load the appropriate test data based on internshipId
      const testData: TestData = await loadTestData(testLink.internship_id);
      
      // Transform the test data to match the expected format
      const transformedTestData = {
        ...testData,
        sections: testData.sections.map((section: Section) => {
          // Handle case where section might be undefined
          if (!section) return { id: 'default', title: 'Default Section', questions: [] };
          
          return {
            ...section,
            questions: section.questions.map((question: Question) => {
              // Handle case where question might be undefined
              if (!question) return { id: 0, question: 'Invalid question', options: [], type: 'text', points: 0 };
              
              return {
                ...question,
                id: question.id ? parseInt(String(question.id).replace(/\D/g, '')) || 0 : 0,
                type: (question.options && question.options.length > 0) ? 'multiple_choice' : 'text',
                points: typeof question.points === 'number' ? question.points : 1,
                options: question.options || []
              };
            })
          };
        }),
        duration: testData.duration || 60,
        passingScore: testData.passingScore || 60,
        instructions: {
          generalInstructions: testData.instructions?.generalInstructions || [],
          beforeTest: testData.instructions?.beforeTest || [],
          duringTest: testData.instructions?.duringTest || []
        }
      };
      
      // Navigate to the test questions page with the transformed data
      navigate(`/internship-test/${testLink.$id}/questions`, { 
        state: { 
          testData: transformedTestData,
          testLinkId: testLink.$id
        } 
      });
    } catch (error) {
      console.error('Error loading test data:', error);
      setError('Failed to load test. Please try again.');
      setStatus('error');
    }
  };

  // Render loading state
  if (status === 'loading' || status === 'validating') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg font-medium">Validating test link...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (status === 'error') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              <XCircle className="h-12 w-12 text-red-500" />
            </div>
            <CardTitle className="text-center text-2xl">Test Link Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-gray-600 dark:text-gray-300 mb-6">
              {error || 'There was an error with your test link.'}
            </p>
            <div className="flex justify-center">
              <Button onClick={() => navigate('/')}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Return to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render login form if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Sign In to Take Test</CardTitle>
            <CardDescription className="text-center">
              Please sign in to access your test
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-1">Password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>
              {error && (
                <div className="text-red-500 text-sm flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {error}
                </div>
              )}
              <Button type="submit" className="w-full" disabled={loginLoading}>
                {loginLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render test not started yet
  if (status === 'not_started' && testLink) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              <Clock className="h-12 w-12 text-yellow-500" />
            </div>
            <CardTitle className="text-center text-2xl">Test Not Yet Available</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-gray-600 dark:text-gray-300 mb-6">
              Your test is not yet available. Please check back later.
            </p>
            <div className="flex justify-center">
              <Button onClick={() => navigate('/')}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Return to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render test expired
  if (status === 'expired') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              <XCircle className="h-12 w-12 text-red-500" />
            </div>
            <CardTitle className="text-center text-2xl">Test Expired</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-gray-600 dark:text-gray-300 mb-6">
              The test period has ended. Please contact support if you believe this is an error.
            </p>
            <div className="flex justify-center">
              <Button onClick={() => navigate('/')}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Return to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render test ready to start
  if (!testLink) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg font-medium">Loading test information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Ready to Start Your Test</CardTitle>
          <CardDescription className="text-center">
            {testLink.internship_id === '68992eb5000dcc34dc1f' ? 'DSA Internship Test' : 
             testLink.internship_id === '6898b14f00083f004360' ? 'Full Stack Web Development Test' :
             'Internship Test'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Test Instructions</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm text-blue-700 dark:text-blue-300">
                <li>Total duration of the test is 60 minutes.</li>
                <li>The test contains multiple questions divided into sections.</li>
                <li>Each question carries 1 mark.</li>
                <li>There is no negative marking for incorrect answers.</li>
                <li>You can navigate between questions using the question palette.</li>
                <li>You can mark questions for review and come back to them later.</li>
              </ul>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Test Details</h4>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <li>• Duration: 60 minutes</li>
                  <li>• Questions: Multiple choice and text-based</li>
                  <li>• Passing Score: 60%</li>
                </ul>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Time Remaining</h4>
                <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  60 minutes
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  The timer will start when you begin the test
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button 
                onClick={startTest}
                className="w-full py-6 text-lg"
                size="lg"
              >
                Start Test Now
              </Button>
              <p className="mt-2 text-xs text-center text-gray-500 dark:text-gray-400">
                By starting the test, you agree to our terms and conditions
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NewInternshipTestConductor;
