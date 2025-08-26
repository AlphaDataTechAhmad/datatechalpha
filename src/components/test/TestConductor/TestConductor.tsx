import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Flag, Bookmark, Check, ChevronLeft, ChevronRight, Loader2, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import useTestTaker from './hooks/useTestTaker';
// Import types from the correct path
import { Test, TestOption, AccessibilitySettings, TestQuestion } from './types';
import { getTestById } from '@/utils/testUtils';

// Default accessibility settings
const defaultAccessibility: AccessibilitySettings = {
  fontSize: 'medium',
  colorBlindMode: false,
  highContrast: false,
};

// Simple toast notification function
const showToast = (title: string, description?: string, variant: 'default' | 'destructive' = 'default') => {
  console.log(`[${variant.toUpperCase()}] ${title}: ${description || ''}`);
  // You can replace this with a more sophisticated toast implementation later
  alert(`${title}: ${description || ''}`);
};

// Function to map our new test format to the expected format
const mapTestFormat = (testData: any): Test => {
  return {
    id: testData.testId,
    title: testData.title,
    description: testData.description,
    duration: testData.duration || 60, // Default to 60 minutes if not specified
    totalMarks: testData.questions.length * 10, // Assuming 10 marks per question
    passingScore: testData.passingScore || 40, // Default to 40% if not specified
    negativeMarking: true,
    instructions: [
      `This test contains ${testData.questions.length} questions`,
      'Each question carries 10 marks',
      'There is negative marking for wrong answers',
      `You have ${testData.duration || 60} minutes to complete the test`,
    ],
    sections: [
      {
        id: 'section-1',
        title: 'Main Section',
        description: 'General Questions',
        instructions: [],
        questions: testData.questions.map((q: any, index: number) => ({
          id: q.id || `q${index + 1}`,
          text: q.question,
          options: q.options.map((opt: string, i: number) => ({
            id: String.fromCharCode(97 + i), // a, b, c, d, etc.
            text: opt,
            isCorrect: i === q.correctAnswer
          })),
          correctAnswer: String.fromCharCode(97 + q.correctAnswer), // Convert index to a, b, c, d
          marks: 10, // Assuming 10 marks per question
          explanation: q.explanation,
          type: 'single-correct',
          difficulty: q.difficulty || 'medium',
          category: q.category || 'General',
          timeLimit: q.timeLimit || 90, // seconds per question
        })),
      },
    ],
    questions: [], // This will be populated by the sections
  };
};

// Removed unused defaultTestTakerState since we're using the hook directly

console.log('TestConductor - Component is being imported');

const TestConductor: React.FC = () => {
  console.log('TestConductor - Component mounting');
  const params = useParams<{ testId: string }>();
  const testId = params?.testId;
  console.log('TestConductor - Params:', params);
  console.log('TestConductor - testId:', testId);
  
  const navigate = useNavigate();
  const [testStarted, setTestStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadedTest, setLoadedTest] = useState<Test | null>(null);
  
  console.log('TestConductor - State initialized:', {
    testId,
    testStarted,
    isLoading,
    error: error?.substring(0, 50) + (error && error.length > 50 ? '...' : ''),
    hasLoadedTest: !!loadedTest
  });
  const testContainerRef = React.useRef<HTMLDivElement>(null);
  
  console.log('Initial state:', {
    testId,
    testStarted,
    isLoading,
    error,
    hasLoadedTest: !!loadedTest,
    testTitle: loadedTest?.title
  });

  console.log('TestConductor - Initial render', {
    testId,
    testStarted,
    isLoading,
    error,
    hasLoadedTest: !!loadedTest,
    testTitle: loadedTest?.title
  });

  // Initialize test taker with the loaded test
  console.log('Initializing testTaker with test:', loadedTest ? 'Test loaded' : 'No test loaded');
  
  let testTaker;
  try {
    testTaker = useTestTaker({
      test: loadedTest as Test,
      autoStart: true,
      showTimer: true,
      allowNavigation: true,
      allowReview: true,
      allowBookmarking: true,
      saveProgress: true,
      shouldSaveProgress: true,
    });
    
    console.log('testTaker initialized successfully:', {
      currentQuestion: testTaker?.currentQuestion?.id,
      testStarted: testTaker?.testStarted,
      timeRemaining: testTaker?.timeRemaining,
      answers: testTaker ? Object.keys(testTaker.answers).length : 0
    });
  } catch (err) {
    console.error('Error initializing testTaker:', err);
    setError(`Failed to initialize test: ${err instanceof Error ? err.message : 'Unknown error'}`);
    setIsLoading(false);
  }

  // Update test taker state when test is loaded
  useEffect(() => {
    if (loadedTest) {
      setTestStarted(true);
    }
  }, [loadedTest]);

  // Load test data
  useEffect(() => {
    console.log('useEffect - Loading test data for testId:', testId);
    
    const loadTest = async () => {
      if (!testId) {
        const errorMsg = 'No test ID provided';
        console.error(errorMsg);
        setError(errorMsg);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        console.log('Fetching test data for ID:', testId);
        
        const testData = await getTestById(testId);
        console.log('Received test data:', testData ? 'Test data received' : 'No test data');

        if (!testData) {
          const errorMsg = `Test with ID '${testId}' not found`;
          console.error(errorMsg);
          throw new Error(errorMsg);
        }

        // Map the test data to the expected format
        console.log('Mapping test data to expected format');
        const mappedTest = mapTestFormat(testData);
        console.log('Mapped test:', {
          id: mappedTest.id,
          title: mappedTest.title,
          questionCount: mappedTest.sections?.[0]?.questions?.length || 0
        });
        
        setLoadedTest(mappedTest);
        setError(null);
      } catch (err) {
        console.error('Error loading test:', err);
        setError(err instanceof Error ? err.message : 'Failed to load test');
        showToast('Error', 'Failed to load test. Please try again.', 'destructive');
        navigate('/tests');
      } finally {
        setIsLoading(false);
      }
    };

    loadTest();
  }, [testId, navigate]);

  // Destructure test taker state
  const {
    test,
    currentQuestion,
    currentQuestionNumber,
    totalQuestions,
    isFirstQuestion,
    isLastQuestion,
    isSubmitted,
    answers,
    bookmarks,
    markedForReview,
    results,
    goToNextQuestion,
    goToPreviousQuestion,
    selectAnswer,
    toggleBookmark,
    toggleMarkForReview,
    submitTest,
    exitTest,
  } = testTaker;

    // State for accessibility settings - using _ prefix to indicate it's intentionally unused for now
  const [_accessibility, _setAccessibility] = useState<AccessibilitySettings>(defaultAccessibility);

  // Toggle fullscreen mode
  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await (testContainerRef.current || document.documentElement).requestFullscreen();
      } else if (document.exitFullscreen) {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error('Error toggling fullscreen:', err);
    }
  }, []);

  // Handle start test
  const handleStartTest = useCallback(async () => {
    if (loadedTest) {
      setTestStarted(true);
      document.body.classList.add('test-mode');
      goToQuestion(0, 0);
      // Auto-start fullscreen when test starts
      await toggleFullscreen();
    }
  }, [loadedTest, setTestStarted, toggleFullscreen, goToQuestion]);

  // Handle test submission
  const handleSubmitTest = async () => {
    try {
      await submitTest();
      showToast('Test Submitted', 'Your test has been submitted successfully.');
    } catch (error) {
      console.error('Failed to submit test:', error);
      showToast('Error', 'Failed to submit test. Please try again.', 'destructive');
    }
  };

  // Handle exit test
  const handleExit = () => {
    // Show confirmation dialog
    if (window.confirm('Are you sure you want to exit the test? Your progress will be saved.')) {
      exitTest();
      navigate('/dashboard');
    }
  };

  // Render test instructions
  const renderInstructions = useCallback(() => {
    console.log('Rendering instructions for test:', {
      hasLoadedTest: !!loadedTest,
      instructions: loadedTest?.instructions,
      testTitle: loadedTest?.title,
      testId: loadedTest?.id
    });
    
    if (!loadedTest?.instructions?.length) {
      console.log('No instructions found for test');
      return (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Test Instructions</h2>
          <p>No specific instructions provided for this test.</p>
        </div>
      );
    }

    return (
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Instructions</h3>
        <ul className="space-y-2">
          {loadedTest.instructions.map((instruction: string, idx: number) => (
            <li key={`instruction-${idx}`} className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
              <span>{instruction}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }, [loadedTest?.instructions]);

  // Render option button
  const renderOptionButton = useCallback((option: TestOption & { isCorrect?: boolean }) => {
    const isSelected = answers[currentQuestion.id]?.selectedOption === option.id;
    const isCorrect = currentQuestion.correctAnswer === option.id;
    const showResults = isSubmitted && results;

    return (
      <button
        key={option.id}
        type="button"
        onClick={() => !isSubmitted && selectAnswer(currentQuestion.id, option.id)}
        disabled={isSubmitted}
        className={cn(
          'w-full text-left p-4 rounded-lg border transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
          'disabled:opacity-70 disabled:cursor-not-allowed',
          isSelected
            ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700'
            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700',
          showResults && isCorrect && 'border-green-500 dark:border-green-600 bg-green-50 dark:bg-green-900/30',
          showResults && isSelected && !isCorrect && 'border-red-500 dark:border-red-600 bg-red-50 dark:bg-red-900/30',
          showResults && !isSelected && !isCorrect && 'opacity-70'
        )}
      >
        <div className="flex items-start">
          <div className={cn(
            'flex-shrink-0 w-6 h-6 rounded-full border flex items-center justify-center mr-3 mt-0.5',
            isSelected
              ? 'bg-blue-500 border-blue-500 text-white'
              : 'border-gray-300 dark:border-gray-600',
            showResults && isCorrect && 'bg-green-500 border-green-500',
            showResults && isSelected && !isCorrect && 'bg-red-500 border-red-500'
          )}>
            {isSelected && <Check className="w-3 h-3" />}
          </div>
          <div className="flex-1">
            <span className="block font-medium">{option.text}</span>

            {/* Show explanation after submission */}
            {showResults && isCorrect && currentQuestion.explanation && (
              <div className="mt-2 text-sm text-green-700 dark:text-green-400">
                {currentQuestion.explanation}
              </div>
            )}

            {showResults && isSelected && !isCorrect && currentQuestion.explanation && (
              <div className="mt-2 text-sm text-red-700 dark:text-red-400">
                {currentQuestion.explanation}
              </div>
            )}
          </div>
        </div>
      </button>
    );
  }, [answers, currentQuestion, isSubmitted, results, selectAnswer]);

  if (!currentQuestion) {
    return (
      <div className={cn(
        'min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4 sm:px-6 lg:px-8',
        !testStarted && 'pt-28' // Add more padding when showing instructions before test starts
      )}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-6">
              <Bookmark className="w-10 h-10 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white sm:text-5xl bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
              {test?.title}
            </h1>
            <p className="mt-4 text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              {test?.description}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700 transition-all duration-300 hover:shadow-2xl">
            <div className="p-8">
              <div className="mb-10">
                <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/30 mb-6">
                  <span className="text-blue-600 dark:text-blue-400 font-medium">📋 Test Guidelines</span>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 pb-3 border-b border-gray-200 dark:border-gray-700">
                  Instructions to Follow
                </h2>
                <div className="prose dark:prose-invert max-w-none">
                  <ul className="space-y-5">
                    {Array.isArray(test?.instructions) ? (
                      test.instructions.map((instruction, index) => (
                        <li key={index} className="flex items-start group">
                          <span className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 flex items-center justify-center mr-4 mt-0.5 transform transition-transform group-hover:scale-110">
                            {index + 1}
                          </span>
                          <span className="text-lg text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-blue-100 transition-colors">
                            {instruction}
                          </span>
                        </li>
                      ))
                    ) : (
                      <li className="text-lg text-gray-700 dark:text-gray-300">{test?.instructions}</li>
                    )}
                  </ul>
                </div>
              </div>

              <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-between gap-6">
                <Button
                  variant="outline"
                  onClick={() => navigate(-1)}
                  className="px-8 py-4 text-base font-medium rounded-xl border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 hover:shadow-md text-gray-800 dark:text-gray-200 hover:border-blue-500 dark:hover:border-blue-400"
                >
                  <ChevronLeft className="w-5 h-5 mr-2" />
                  Back to Tests
                </Button>
                <Button
                  onClick={handleStartTest}
                  className="px-10 py-4 text-base font-semibold rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white transition-all duration-300 shadow-md hover:shadow-lg hover:scale-[1.02] flex items-center"
                >
                  Start Test Now
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </div>

            {/* Test Info Footer */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800/50 dark:to-gray-800/30 px-8 py-6 border-t border-gray-100 dark:border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center bg-white dark:bg-gray-700/50 p-4 rounded-lg shadow-sm">
                  <div className="p-2.5 rounded-lg bg-blue-100 dark:bg-blue-900/30 mr-4">
                    <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Duration</p>
                    <p className="text-lg font-semibold text-gray-800 dark:text-white">{test?.duration} minutes</p>
                  </div>
                </div>
                <div className="flex items-center bg-white dark:bg-gray-700/50 p-4 rounded-lg shadow-sm">
                  <div className="p-2.5 rounded-lg bg-green-100 dark:bg-green-900/30 mr-4">
                    <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Passing Score</p>
                    <p className="text-lg font-semibold text-gray-800 dark:text-white">{test?.passingScore}% Required</p>
                  </div>
                </div>
                <div className="flex items-center bg-white dark:bg-gray-700/50 p-4 rounded-lg shadow-sm">
                  <div className="p-2.5 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 mr-4">
                    <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Negative Marking</p>
                    <p className="text-lg font-semibold text-gray-800 dark:text-white">
                      {test?.negativeMarking ? 'Yes' : 'No'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Accessibility Note */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Need accessibility adjustments? You can modify display settings after starting the test.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Render test results
  if (isSubmitted && results) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mb-4">
              {results.isPassed ? (
                <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
              ) : (
                <XCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
              )}
            </div>
            <h1 className="text-2xl font-bold mb-2">
              {results.isPassed ? 'Test Passed!' : 'Test Failed'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              You scored {results.score} out of {results.totalMarks} ({results.percentage.toFixed(1)}%)
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <div className="text-sm text-gray-500 dark:text-gray-400">Correct Answers</div>
              <div className="text-2xl font-bold">{results.correctAnswers}</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <div className="text-sm text-gray-500 dark:text-gray-400">Incorrect Answers</div>
              <div className="text-2xl font-bold">{results.incorrectAnswers}</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <div className="text-sm text-gray-500 dark:text-gray-400">Time Spent</div>
              <div className="text-2xl font-bold">
                {Math.floor(results.timeSpent / 60)}m {results.timeSpent % 60}s
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-4">
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </Button>
            <Button onClick={() => window.location.reload()}>
              Review Answers
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Set up and clean up test mode
  useEffect(() => {
    if (testStarted) {
      document.body.classList.add('test-mode');
    }
    return () => {
      document.body.classList.remove('test-mode');
    };
  }, [testStarted]);

  // Show loading state
  if (isLoading) {
    console.log('Rendering loading state');
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 text-blue-600 dark:text-blue-400 animate-spin" />
          <p className="text-lg font-medium text-gray-700 dark:text-gray-300">Loading test...</p>
          <p className="text-sm text-gray-500 mt-2">Test ID: {testId}</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 px-4">
        <div className="max-w-md w-full p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg text-center">
          <XCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Error Loading Test</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
          <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-md text-left text-sm text-red-700 dark:text-red-300 mb-6">
            <p className="font-medium">Debug Information:</p>
            <p>Test ID: {testId || 'Not provided'}</p>
            <p>Test Loaded: {loadedTest ? 'Yes' : 'No'}</p>
            <p>Test Started: {testStarted ? 'Yes' : 'No'}</p>
            {loadedTest && (
              <p>Test Title: {loadedTest.title}</p>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline"
              className="w-full sm:w-auto"
            >
              Reload Page
            </Button>
            <Button 
              onClick={() => navigate('/tests')} 
              className="w-full sm:w-auto"
            >
              Back to Tests
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Render test interface
  return (
    <div
      className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col"
      ref={testContainerRef}
      style={{
        '--font-size': {
          small: '14px',
          medium: '16px',
          large: '18px',
        }[accessibility.fontSize],
      } as React.CSSProperties}
    >
      {/* Test Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              {test?.title}
            </h1>
            <div className="flex items-center bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-md">
              <span className="font-mono text-sm">{formattedTimeLeft}</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => {
                if (window.confirm('Are you sure you want to end the test? Your progress will be saved.')) {
                  handleSubmitTest();
                }
              }}
              className="text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/30"
            >
              Submit Test
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Question Panel */}
          <div className="lg:col-span-3 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  Question {currentQuestionNumber}
                </span>
                {bookmarks.has(currentQuestion.id) && (
                  <Bookmark className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                )}
                {markedForReview.has(currentQuestion.id) && (
                  <Flag className="w-4 h-4 text-orange-500 fill-orange-500" />
                )}
              </div>

              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleMarkForReview(currentQuestion.id)}
                  className={cn(
                    'flex items-center space-x-1',
                    markedForReview.has(currentQuestion.id) ? 'bg-orange-50 dark:bg-orange-900/30' : ''
                  )}
                >
                  <Flag className={cn(
                    'w-4 h-4',
                    markedForReview.has(currentQuestion.id) ? 'fill-orange-500 text-orange-500' : ''
                  )} />
                  <span>{markedForReview.has(currentQuestion.id) ? 'Marked' : 'Mark'}</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleBookmark(currentQuestion.id)}
                  className={cn(
                    'flex items-center space-x-1',
                    bookmarks.has(currentQuestion.id) ? 'bg-yellow-50 dark:bg-yellow-900/30' : ''
                  )}
                >
                  <Bookmark className={cn(
                    'w-4 h-4',
                    bookmarks.has(currentQuestion.id) ? 'fill-yellow-500 text-yellow-500' : ''
                  )} />
                  <span>Bookmark</span>
                </Button>
              </div>
            </div>

            {/* Question Text */}
            <div className="prose dark:prose-invert max-w-none mb-8">
              <p className="text-lg">{currentQuestion.text}</p>

              {/* Question Image */}
              {currentQuestion.imageUrl && (
                <div className="my-4">
                  <img
                    src={currentQuestion.imageUrl}
                    alt="Question illustration"
                    className="max-w-full h-auto rounded border border-gray-200 dark:border-gray-700"
                  />
                </div>
              )}
            </div>

            {/* Options */}
            <div className="space-y-3 mb-8">
              {currentQuestion.options.map((option, index) => renderOptionButton(option, index))}
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                onClick={goToPreviousQuestion}
                disabled={isFirstQuestion || isSubmitted}
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              <div className="flex space-x-2">
                {!isLastQuestion && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      const answer = answers[currentQuestion.id];
                      if (answer?.selectedOption) {
                        goToNextQuestion();
                      } else if (window.confirm('You have not selected an answer. Are you sure you want to continue?')) {
                        goToNextQuestion();
                      }
                    }}
                    disabled={isSubmitted}
                  >
                    Skip
                  </Button>
                )}

                <Button
                  onClick={isLastQuestion ? handleSubmitTest : goToNextQuestion}
                  disabled={isSubmitted}
                >
                  {isLastQuestion ? 'Submit Test' : 'Next'}
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sticky top-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium">Questions</h3>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {Object.keys(answers).length} / {totalQuestions}
                </div>
              </div>

              <div className="grid grid-cols-5 gap-2 mb-4">
                {Array.from({ length: totalQuestions }).map((_, index) => {
                  const questionIndex = index;
                  const question = test?.questions?.[questionIndex];
                  const isCurrent = questionIndex === currentQuestionNumber - 1;
                  const isAnswered = question && answers[question.id]?.selectedOption !== undefined;
                  const isMarked = question && markedForReview.has(question.id);
                  const isBookmarked = question && bookmarks.has(question.id);

                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => goToQuestion(0, questionIndex)}
                      className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
                        isCurrent
                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-100 border-2 border-blue-500'
                          : isAnswered
                          ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-100 border border-green-300 dark:border-green-700'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600',
                        isMarked && 'border-orange-500 dark:border-orange-600',
                        isBookmarked && 'ring-1 ring-yellow-400 dark:ring-yellow-500'
                      )}
                      aria-label={`Go to question ${index + 1}${isAnswered ? ' (answered)' : ''}${isMarked ? ' (marked for review)' : ''}${isBookmarked ? ' (bookmarked)' : ''}`}
                    >
                      {index + 1}
                      {isMarked && (
                        <span className="absolute -top-1 -right-1">
                          <Flag className="w-3 h-3 text-orange-500" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                  <span>Answered</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-gray-300 dark:bg-gray-600 mr-2"></div>
                  <span>Unanswered</span>
                </div>
                <div className="flex items-center">
                  <Flag className="w-3 h-3 text-orange-500 mr-2" />
                  <span>Marked for review</span>
                </div>
                <div className="flex items-center">
                  <Bookmark className="w-3 h-3 text-yellow-500 fill-yellow-500 mr-2" />
                  <span>Bookmarked</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleExit}
                >
                  Exit Test
                </Button>
              </div>
            </div>
            
            {/* Accessibility Controls */}
            <div className="mt-4 bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <h3 className="font-medium mb-3">Accessibility</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span>High Contrast</span>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => accessibility.toggleHighContrast()}
                    className={accessibility.highContrast ? 'bg-blue-100 dark:bg-blue-900' : ''}
                  >
                    {accessibility.highContrast ? 'On' : 'Off'}
                  </Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <span>Font Size</span>
                  <div className="flex space-x-1">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => accessibility.decreaseFontSize()}
                      disabled={accessibility.fontSize === 'small'}
                    >
                      A-
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => accessibility.increaseFontSize()}
                      disabled={accessibility.fontSize === 'large'}
                    >
                      A+
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span>Reduce Motion</span>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => accessibility.toggleReduceMotion()}
                    className={accessibility.reduceMotion ? 'bg-blue-100 dark:bg-blue-900' : ''}
                  >
                    {accessibility.reduceMotion ? 'On' : 'Off'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

    </div>
  );
};

export default TestConductor;
