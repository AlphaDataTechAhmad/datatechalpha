import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { databases } from '../Services/appwrite';
import { Loader2 } from 'lucide-react';
import TestConductor from '../components/test/TestConductor';

interface TestData {
  $id: string;
  title: string;
  description: string;
  duration: number;
  questions: Array<{
    id: string;
    question: string;
    options: string[];
    correctAnswer: number;
  }>;
}

const ExamPage: React.FC = () => {
  const { testId } = useParams<{ testId: string }>();
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [test, setTest] = useState<TestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check authentication and load test data
  useEffect(() => {
    const loadTest = async () => {
      if (!testId) {
        setError('No test ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Fetch test data from your database
        const testData = await databases.getDocument(
          'YOUR_DATABASE_ID', // Replace with your database ID
          'tests', // Replace with your collection ID
          testId
        ) as unknown as TestData;
        
        setTest(testData);
      } catch (err) {
        console.error('Error loading test:', err);
        setError('Failed to load test. Please check the link and try again.');
      } finally {
        setLoading(false);
      }
    };

    loadTest();
  }, [testId]);

  // Redirect to login if not authenticated
  if (!isLoading && !isAuthenticated) {
    // Store the intended URL to redirect back after login
    sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
    navigate('/login', { state: { from: window.location.pathname } });
    return null;
  }

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
          <p className="text-lg">Loading exam...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-6 max-w-md mx-auto bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Test Not Found</h2>
          <p>The requested test could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold mb-4">{test.title}</h1>
          <p className="text-gray-600 mb-6">{test.description}</p>
          
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
            <h3 className="font-semibold text-blue-800 mb-2">Instructions</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm text-blue-700">
              <li>Total questions: {test.questions.length}</li>
              <li>Duration: {test.duration} minutes</li>
              <li>Answer all questions before submitting</li>
              <li>You cannot go back once you've submitted the test</li>
            </ul>
          </div>
          
          <TestConductor test={test} />
        </div>
      </div>
    </div>
  );
};

export default ExamPage;
