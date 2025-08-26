import { useParams, useNavigate } from 'react-router-dom';
import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { useTestContext } from './context/TestContext';
import { TestData } from '@/types/test';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
// Custom tabs implementation
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Clock, CheckCircle2, XCircle, AlertCircle, ChevronLeft, ChevronRight, Check, X, Bookmark, SkipForward, Moon, Sun, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { saveTestResults } from '@/lib/testResults';
import { useAuth } from '@/contexts/AuthContext';

// Type for the dynamically imported test module
type TestModule = {
  default: TestData;
};

// Dynamically import all test files from the tests folder
const testModules = import.meta.glob<TestModule>('@/data/tests/*.ts', { eager: false });

const TEST_DURATION = 60 * 60; // 60 minutes

// Define test stages
type TestStage = 'instructions' | 'test' | 'review' | 'results';

const DynamicTestConductor: React.FC = () => {
  console.log('DynamicTestConductor: Rendering');
  const { testId } = useParams<{ testId: string }>();
  console.log('DynamicTestConductor: testId from URL:', testId);
  const navigate = useNavigate();
  
  // All state declarations at the top level
  const [showEndTestDialog, setShowEndTestDialog] = useState(false);
  const [testSubmitted, setTestSubmitted] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(TEST_DURATION);
  const [currentTab, setCurrentTab] = useState<string>('instructions');
  
  // Track when the test starts
  const startTime = useRef<Date>(new Date());
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
  const [tabSwitchCount, setTabSwitchCount] = useState<number>(0);
  const [showTabSwitchWarning, setShowTabSwitchWarning] = useState<boolean>(false);
  const [tabChangeCount, setTabChangeCount] = useState<number>(0);
  const [unansweredQuestionIndex, setUnansweredQuestionIndex] = useState<number | null>(null);
  const [showQuestionPalette, setShowQuestionPalette] = useState(false);
  const [showUnansweredWarning, setShowUnansweredWarning] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [testStage, setTestStage] = useState<TestStage>('instructions');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const savedTheme = localStorage.getItem('theme');
    return (savedTheme as 'light' | 'dark') || 'light';
  });
  
  // Refs
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const questionPaletteRef = useRef<HTMLDivElement>(null);
  
  // Context hooks
  const context = useTestContext();
  const {
    currentSectionIndex,
    currentQuestionIndex,
    moveToNextQuestion,
    moveToPreviousQuestion,
    moveToQuestion,
    getCurrentSection,
    getCurrentQuestion,
    getQuestionState,
    setUserAnswer,
    toggleMarkForReview,
    userAnswers: contextUserAnswers,
    setCurrentSectionIndex,
    setCurrentQuestionIndex,
    test,
    loading,
    error
  } = context;
  
  // Memoize context values to prevent unnecessary re-renders
  const contextValues = useMemo(() => ({
    currentSectionIndex,
    currentQuestionIndex,
    userAnswers: contextUserAnswers,
    test,
    loading,
    error
  }), [currentSectionIndex, currentQuestionIndex, contextUserAnswers, test, loading, error]);
  
  // Log context changes
  useEffect(() => {
    console.log('DynamicTestConductor: Context values changed', {
      currentSectionIndex,
      currentQuestionIndex,
      hasTest: !!test,
      loading,
      error: error?.message,
      answersCount: Object.keys(contextUserAnswers || {}).length
    });
  }, [contextValues]);

  // Get current section and question with memoization
  const currentSection = useMemo(() => {
    const section = getCurrentSection();
    console.log('DynamicTestConductor: Current section:', section?.id);
    return section;
  }, [getCurrentSection, contextValues.currentSectionIndex, contextValues.test]);
  
  const currentQuestion = useMemo(() => {
    const question = getCurrentQuestion();
    console.log('DynamicTestConductor: Current question:', question?.id);
    return question;
  }, [getCurrentQuestion, contextValues.currentQuestionIndex, contextValues.test]);
  
  const sectionQuestions = useMemo(() => {
    const questions = currentSection ? currentSection.questions : [];
    console.log('DynamicTestConductor: Section questions count:', questions.length);
    return questions;
  }, [currentSection]);
  
  // Memoize question state to prevent unnecessary re-renders
  const questionState = useMemo(() => {
    if (!currentSection || !currentQuestion) return null;
    return getQuestionState(currentSection.id, currentQuestion.id);
  }, [currentSection, currentQuestion, getQuestionState, contextValues.userAnswers]);

  // Calculate test statistics and progress
  const { totalQuestions, answeredCount, markedForReviewCount, progress } = useMemo(() => {
    if (loading) {
      return { totalQuestions: 0, answeredCount: 0, markedForReviewCount: 0, progress: 0 };
    }
    if (!test?.sections) {
      return { 
        totalQuestions: 0, 
        answeredCount: 0, 
        markedForReviewCount: 0, 
        progress: 0 
      };
    }
    
    // Calculate total questions
    const total = test.sections.reduce(
      (sum, section) => sum + (section.questions?.length || 0),
      0
    );
    
    // Calculate answered questions
    const answered = Object.keys(contextUserAnswers || {}).filter(
      key => contextUserAnswers[key]?.answer !== null && 
             contextUserAnswers[key]?.answer !== undefined
    ).length;
    
    // Calculate marked for review
    const marked = Object.keys(contextUserAnswers || {}).filter(
      key => contextUserAnswers[key]?.markedForReview
    ).length;
    
    // Calculate progress
    const progressValue = total > 0 ? Math.round((answered / total) * 100) : 0;
    
    return {
      totalQuestions: total,
      answeredCount: answered,
      markedForReviewCount: marked,
      progress: progressValue
    };
  }, [test, contextUserAnswers, loading]);

  // Get all questions across all sections for navigation
  const allQuestions = useMemo(() => {
    if (!test?.sections) return [];
    
    return test.sections.flatMap(section => 
      section.questions.map(question => ({
        id: question.id,
        sectionId: section.id,
        sectionTitle: section.title,
        question: question.question,
        options: question.options,
        correctAnswer: question.correctAnswer
      }))
    );
  }, [test]);
  
  // Get current question index across all sections
  const currentGlobalIndex = useMemo(() => {
    if (!currentSection || !currentQuestion) return -1;
    return allQuestions.findIndex(
      q => q.sectionId === currentSection.id && q.id === currentQuestion.id
    );
  }, [allQuestions, currentSection, currentQuestion]);

  // Type guard for option with text property
  const isOptionWithText = (option: any): option is { id: string; text: string } => {
    return option && typeof option === 'object' && 'text' in option;
  };

  // Get the current question's answer state using context method
  const currentAnswer = useMemo(() => {
    if (!test || !currentSection || !currentQuestion) return null;
    return getQuestionState(currentSection.id, currentQuestion.id);
  }, [test, currentSection, currentQuestion, getQuestionState]);

  // Function to start the test
  const startTest = useCallback(() => {
    console.log('Starting test, setting testStage to "test"');
    setTestStage('test');
    startTime.current = new Date(); // Reset start time when test begins
    setTimeLeft(TEST_DURATION);
    
    // Ensure we have a valid test and sections before proceeding
    if (test && test.sections && test.sections.length > 0) {
      console.log('Moving to first question of first section');
      setCurrentSectionIndex(0);
      setCurrentQuestionIndex(0);
    }
  }, [test, setCurrentSectionIndex, setCurrentQuestionIndex]);

  // Toggle theme function
  const toggleTheme = useCallback(() => {
    setTheme(prevTheme => {
      const newTheme = prevTheme === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', newTheme);
      document.documentElement.classList.toggle('dark', newTheme === 'dark');
      return newTheme;
    });
  }, []);

  // Toggle question palette
  const toggleQuestionPalette = useCallback(() => {
    setShowQuestionPalette(prev => !prev);
  }, []);

  // Handle clicking outside question palette
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (questionPaletteRef.current && !questionPaletteRef.current.contains(event.target as Node)) {
        setShowQuestionPalette(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Apply theme on mount
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  // Set test as completed
  const setTestCompleted = useCallback((completed: boolean) => {
    setTestSubmitted(completed);
    if (completed) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      setTestStage('results');
    }
  }, []);

  // Handle answer selection
  const handleAnswerSelect = useCallback((questionId: string, answer: string | string[]) => {
    const currentSection = getCurrentSection();
    if (!currentSection) return;
    
    setUserAnswer(currentSection.id, questionId, answer);
    
    // Auto-save the answer
    console.log(`Answer saved for question ${questionId}:`, answer);
  }, [getCurrentSection, setUserAnswer]);

  // Toggle mark for review
  const handleMarkForReview = useCallback((e: React.MouseEvent<HTMLButtonElement>, questionId?: string) => {
    e.preventDefault();
    const currentSection = getCurrentSection();
    if (!currentSection || !currentQuestion) return;
    
    // If questionId is not provided, use the current question
    const targetQuestionId = questionId || currentQuestion.id;
    toggleMarkForReview(currentSection.id, targetQuestionId);
  }, [getCurrentSection, toggleMarkForReview, currentQuestion]);

  // Navigate to a specific question
  const goToQuestion = useCallback((sectionIdx: number, questionIdx: number) => {
    moveToQuestion(sectionIdx, questionIdx);
    setShowQuestionPalette(false);
  }, [moveToQuestion]);

  // Handle test submission - shows confirmation dialog first
  const handleSubmitTest = useCallback(() => {
    setShowSubmitDialog(true);
  }, []);

  const handleNextQuestion = useCallback(() => {
    if (!test?.sections?.length) return;
    
    const currentSection = test.sections[currentSectionIndex];
    if (!currentSection) return;
    
    // If it's the last question in the current section
    if (currentQuestionIndex === currentSection.questions.length - 1) {
      // If it's also the last section, submit the test
      if (currentSectionIndex === test.sections.length - 1) {
        handleSubmitTest();
        return;
      }
      // Otherwise, move to the first question of the next section
      setCurrentSectionIndex(currentSectionIndex + 1);
      setCurrentQuestionIndex(0);
    } else {
      // Move to the next question in the current section
      moveToNextQuestion();
    }
  }, [test, currentSectionIndex, currentQuestionIndex, moveToNextQuestion, handleSubmitTest, setCurrentSectionIndex, setCurrentQuestionIndex]);

  // Handle previous question
  const handlePreviousQuestion = useCallback(() => {
    if (!test?.sections?.length) return;
    
    const currentSection = test.sections[currentSectionIndex];
    if (!currentSection) return;
    
    // If it's the first question in the current section
    if (currentQuestionIndex === 0) {
      // If it's also the first section, do nothing
      if (currentSectionIndex === 0) return;
      // Otherwise, move to the last question of the previous section
      setCurrentSectionIndex(currentSectionIndex - 1);
      setCurrentQuestionIndex(test.sections[currentSectionIndex - 1].questions.length - 1);
    } else {
      // Move to the previous question in the current section
      moveToPreviousQuestion();
    }
  }, [test, currentSectionIndex, currentQuestionIndex, moveToPreviousQuestion, setCurrentSectionIndex, setCurrentQuestionIndex]);

  // Load test data when component mounts
  useEffect(() => {
    const loadTestData = async () => {
      if (!testId) return;
      
      try {
        // The actual test data loading is now handled by TestContext
        console.log('DynamicTestConductor: Loading test data for testId:', testId);
      } catch (err) {
        console.error('Error in test data loading:', err);
      }
    };
    
    loadTestData();
  }, [testId]);

  // Timer effect
  useEffect(() => {
    // Don't start the timer if test is submitted or no test is loaded
    if (testSubmitted || !test) return;
    
    // Initialize timer with the test duration if not already set
    if (timeLeft === 0) {
      setTimeLeft(TEST_DURATION);
    }
    
    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    // Only start the timer if we're in the test stage
    if (testStage === 'test') {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current as NodeJS.Timeout);
            // Only submit if test is not already submitted
            if (!testSubmitted) {
              setTestCompleted(true);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [testSubmitted, test, testStage, setTestCompleted]);

  // Tab change detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        setTabSwitchCount(prev => {
          const newCount = prev + 1;
          if (newCount >= 10) {
            setTestCompleted(true);
          } else {
            setShowTabSwitchWarning(true);
          }
          return newCount;
        });
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [setTestCompleted]);

  // Helper functions
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const calculateScore = useCallback(() => {
    if (!test?.sections) return 0;
    
    let correct = 0;
    let total = 0;
    
    test.sections.forEach(section => {
      section.questions.forEach(question => {
        const answerState = getQuestionState(section.id, question.id);
        if (answerState?.answer === question.correctAnswer) {
          correct++;
        }
        total++;
      });
    });
    
    return total > 0 ? Math.round((correct / total) * 100) : 0;
  }, [test, getQuestionState]);

  // Event handlers
  const handleSkipQuestion = useCallback(() => {
    if (!test || !currentSection || !currentQuestion) return;
    
    // Mark the current question as skipped
    setUserAnswer(currentSection.id, currentQuestion.id, null);
    
    // Move to next question if not the last one
    if (currentQuestionIndex < currentSection.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else if (currentSectionIndex < test.sections.length - 1) {
      // Move to next section if available
      setCurrentSectionIndex(currentSectionIndex + 1);
      setCurrentQuestionIndex(0);
    }
  }, [test, currentSection, currentQuestion, currentQuestionIndex, currentSectionIndex, setUserAnswer, setCurrentSectionIndex, setCurrentQuestionIndex]);

  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const calculateTestResults = useCallback(() => {
    if (!test) return null;
    
    let correctAnswers = 0;
    let incorrectAnswers = 0;
    const responses: Array<{
      questionId: string;
      selectedOption: number | null;
      isCorrect: boolean;
      timeSpent: number; // In seconds
    }> = [];
    
    // Calculate scores and prepare responses
    test.sections.forEach((section) => {
      section.questions.forEach((question) => {
        const answerState = getQuestionState(section.id, question.id);
        const selectedOption = answerState?.answer ?? null;
        const isCorrect = selectedOption === question.correctAnswer;
        
        if (selectedOption !== null) {
          if (isCorrect) {
            correctAnswers++;
          } else {
            incorrectAnswers++;
          }
        }
        
        responses.push({
          questionId: question.id,
          selectedOption,
          isCorrect,
          timeSpent: 0, // You might want to track time spent per question
        });
      });
    });
    
    const totalQuestions = responses.length;
    const score = correctAnswers;
    const percentage = Math.round((score / totalQuestions) * 100);
    const passed = percentage >= (test.passingScore || 60);
    
    return {
      score,
      totalMarks: totalQuestions,
      percentage,
      correctAnswers,
      incorrectAnswers,
      passed,
      responses,
    };
  }, [test, getQuestionState]);

  const validateAndSubmitTest = useCallback(async (forceSubmit = false) => {
    if (!test || !user) return;
    
    // Check for any marked but unanswered questions
    let hasMarkedUnanswered = false;
    let firstMarkedUnanswered = -1;
    
    test.sections.forEach((section) => {
      section.questions.forEach((question) => {
        const answerState = getQuestionState(section.id, question.id);
        if (answerState?.markedForReview && answerState?.answer === null) {
          hasMarkedUnanswered = true;
          if (firstMarkedUnanswered === -1) {
            firstMarkedUnanswered = section.questions.indexOf(question);
          }
        }
      });
    });
    
    if (hasMarkedUnanswered && !forceSubmit) {
      if (firstMarkedUnanswered !== -1) {
        setUnansweredQuestionIndex(firstMarkedUnanswered);
        setShowConfirmation(true);
        // Find the section and question index of the first marked unanswered question
        test.sections.some((section, sIndex) => {
          const questionIndex = section.questions.findIndex((_, qIndex) => {
            const answerState = getQuestionState(section.id, section.questions[qIndex].id);
            return answerState?.markedForReview && answerState?.answer === null;
          });
          
          if (questionIndex !== -1) {
            setCurrentSectionIndex(sIndex);
            setCurrentQuestionIndex(questionIndex);
            return true;
          }
          return false;
        });
        return;
      }
    }
    
    try {
      setIsSubmitting(true);
      
      // Calculate test results
      const results = calculateTestResults();
      if (!results) return;
      
      // Save test results to Appwrite
      const endTime = new Date();
      const timeSpent = Math.floor((endTime.getTime() - startTime.current.getTime()) / 1000); // in seconds
      
      console.log('Test object and URL testId:', { testIdFromURL: testId, test });
      
      const testResultData = {
        testId: testId, // Use the testId from URL parameters
        testName: test.title,
        score: results.score,
        totalMarks: results.totalMarks,
        percentage: results.percentage,
        correctAnswers: results.correctAnswers,
        incorrectAnswers: results.incorrectAnswers,
        takenAt: startTime.current.toISOString(),
        userName: user.name || user.email || 'User',
        startTime: startTime.current.toISOString(),
        endTime: endTime.toISOString(),
        timeSpent,
        responses: results.responses,
        maxScore: results.totalMarks,
        passed: results.passed,
        testDetails: {
          title: test.title,
          description: test.description,
          category: test.category,
          passingScore: test.passingScore || 60,
          sections: test.sections.map(section => ({
            id: section.id,
            title: section.title,
            questionCount: section.questions.length
          }))
        }
      };

      console.log('Preparing to save test result with data:', {
        ...testResultData,
        testDetails: '[...]', // Don't log the full testDetails to avoid cluttering the console
        responses: '[...]'    // Don't log the full responses to avoid cluttering the console
      });
      
      await saveTestResults(testResultData);
      
      setTestCompleted(true);
      setShowConfirmation(false);
    } catch (error) {
      console.error('Error saving test results:', error);
      // Still mark as completed even if saving fails
      setTestCompleted(true);
      setShowConfirmation(false);
    } finally {
      setIsSubmitting(false);
    }
  }, [test, getQuestionState, setCurrentSectionIndex, setCurrentQuestionIndex, setTestCompleted]);


  
  const handleEndTest = useCallback(() => {
    setShowEndTestDialog(true);
  }, []);
  
  const confirmEndTest = useCallback(async () => {
    setShowEndTestDialog(false);
    setIsSubmitting(true);
    try {
      await validateAndSubmitTest(true);
      setTestSubmitted(true);
    } catch (error) {
      console.error('Error ending test:', error);
      // Handle error - maybe show a toast notification
    } finally {
      setIsSubmitting(false);
    }
  }, [validateAndSubmitTest]);

  // Debug log for test stage changes
  useEffect(() => {
    console.log('Test stage changed to:', testStage);
  }, [testStage]);

  // Get current section and question with memoization
  const memoizedCurrentSection = useMemo(() => {
    return test?.sections?.[currentSectionIndex];
  }, [test, currentSectionIndex]);

  const memoizedCurrentQuestion = useMemo(() => {
    return memoizedCurrentSection?.questions?.[currentQuestionIndex];
  }, [memoizedCurrentSection, currentQuestionIndex]);

  // Calculate current question number across all sections
  const questionNumber = useMemo(() => {
    if (!test?.sections) return 0;
    let count = 0;
    for (let i = 0; i < currentSectionIndex; i++) {
      count += test.sections[i]?.questions?.length || 0;
    }
    return count + currentQuestionIndex + 1;
  }, [test, currentSectionIndex, currentQuestionIndex]);

  const memoizedTotalQuestions = useMemo(() => allQuestions.length, [allQuestions]);
  
  const isLastQuestion = useMemo(() => {
    if (!test?.sections?.length) return false;
    return currentSectionIndex === test.sections.length - 1 && 
           currentQuestionIndex === (test.sections[currentSectionIndex]?.questions?.length || 0) - 1;
  }, [test, currentSectionIndex, currentQuestionIndex]);

  const currentQuestionState = useMemo(() => {
    return memoizedCurrentSection ? getQuestionState(memoizedCurrentSection.id, memoizedCurrentQuestion?.id) : null;
  }, [memoizedCurrentSection, memoizedCurrentQuestion, getQuestionState]);

  // Render loading state
  if (loading) {
    console.log('DynamicTestConductor: Rendering loading state', { 
      loading, 
      hasTest: !!test, 
      testId 
    });
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-lg font-medium text-gray-700 dark:text-gray-300">Loading test data...</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Test ID: {testId}</p>
          <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-left text-sm">
            <p className="font-mono">Debug Info:</p>
            <pre className="text-xs mt-2">
              {JSON.stringify({
                loading,
                hasTest: !!test,
                testId,
                currentSection: currentSection?.id,
                currentQuestion: currentQuestion?.id,
                sectionQuestions: sectionQuestions?.length,
                testStage
              }, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <Alert variant="destructive" className="max-w-2xl mx-auto mt-8">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error.message || 'An error occurred while loading the test'}
          <div className="mt-4">
            <Button onClick={() => navigate('/testz')}>
              Back to Tests
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // Render test not found state
  if (!test) {
    return (
      <Alert className="max-w-2xl mx-auto mt-8">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Test Not Found</AlertTitle>
        <AlertDescription>
          The requested test could not be found.
          <div className="mt-4">
            <Button onClick={() => navigate('/testz')}>
              Back to Tests
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // Render test completed state
  if (testSubmitted && test) {
    const score = calculateScore();
    const passed = score >= (test.passingScore || 0);

    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="mb-6">
          <CardHeader className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              {passed ? (
                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
              ) : (
                <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
              )}
            </div>
            <CardTitle className="text-2xl font-bold">
              {passed ? 'Test Completed Successfully!' : 'Test Completed'}
            </CardTitle>
            <p className="text-gray-500 dark:text-gray-400">
              {passed 
                ? 'Congratulations! You have passed the test.' 
                : `You need ${test.passingScore - score}% more to pass.`
              }
            </p>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">{score}%</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">Your Score</span>
              </div>
              <div className="flex flex-col items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <span className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {answeredCount}/{totalQuestions}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">Questions Answered</span>
              </div>
              <div className="flex flex-col items-center p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <span className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                  {markedForReviewCount}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">Marked for Review</span>
              </div>
            </div>
            
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-3">Question Summary</h3>
              <div className="flex flex-wrap gap-2">
                {test.sections.flatMap((section) => 
                  section.questions?.map((question, questionIndex) => {
                    const questionId = question.id;
                    if (!questionId) return null;
                    
                    const answer = contextUserAnswers[`${section.id}:${questionId}`];
                    let bgColor = 'bg-gray-200 dark:bg-gray-700';
                    let textColor = 'text-gray-800 dark:text-gray-200';
                    let borderColor = 'border-transparent';
                    
                    if (answer) {
                      if (answer.answer !== null && answer.answer !== undefined) {
                        if (answer.markedForReview) {
                          bgColor = 'bg-yellow-100 dark:bg-yellow-900/30';
                          textColor = 'text-yellow-800 dark:text-yellow-200';
                          borderColor = 'border-yellow-400 dark:border-yellow-600';
                        } else {
                          bgColor = 'bg-green-100 dark:bg-green-900/30';
                          textColor = 'text-green-800 dark:text-green-200';
                          borderColor = 'border-green-400 dark:border-green-600';
                        }
                      } else if (answer.skipped) {
                        bgColor = 'bg-gray-100 dark:bg-gray-800';
                        textColor = 'text-gray-500 dark:text-gray-400';
                        borderColor = 'border-gray-300 dark:border-gray-600';
                      } else if (answer.markedForReview) {
                        bgColor = 'bg-yellow-100 dark:bg-yellow-900/30';
                        textColor = 'text-yellow-800 dark:text-yellow-200';
                        borderColor = 'border-yellow-400 dark:border-yellow-600';
                      }
                    }
                    
                    return (
                      <button
                        key={`${section.id}-${questionId}`}
                        className={`w-10 h-10 rounded-md flex items-center justify-center ${bgColor} border-2 ${borderColor} font-medium text-sm`}
                        onClick={() => {
                          // Find the absolute question index to navigate to
                          let questionCount = 0;
                          for (let i = 0; i < test.sections.length; i++) {
                            const sec = test.sections[i];
                            if (sec.id === section.id) {
                              questionCount += questionIndex;
                              break;
                            }
                            questionCount += sec.questions?.length || 0;
                          }
                          setCurrentQuestionIndex(questionCount);
                        }}
                      >
                        {questionIndex + 1}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={() => navigate('/testz')}>
              Back to Tests
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  // If we're in instructions stage, show only instructions
  if (test && testStage === 'instructions') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">{test.title} - Instructions</CardTitle>
            <CardDescription>
              Please read the instructions carefully before starting the test
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">General Instructions</h3>
                <ul className="list-disc pl-5 space-y-1">
                  {test.instructions?.generalInstructions?.map((instruction, index) => (
                    <li key={index}>{instruction}</li>
                  )) || (
                    <li>No specific instructions provided for this test.</li>
                  )}
                </ul>
              </div>
              
              {test.instructions?.markingScheme && (
                <div>
                  <h3 className="text-lg font-medium mb-2">Marking Scheme</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    {Object.entries(test.instructions.markingScheme).map(([section, scheme]) => (
                      <li key={section}>
                        {section}: {scheme.correct} mark{scheme.correct !== 1 ? 's' : ''} per correct answer
                        {scheme.incorrect !== undefined && 
                          `, ${scheme.incorrect} mark${scheme.incorrect !== 1 ? 's' : ''} per incorrect answer`}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {test.instructions?.navigationInstructions && (
                <div>
                  <h3 className="text-lg font-medium mb-2">Navigation Instructions</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    {test.instructions.navigationInstructions.map((instruction, index) => (
                      <li key={index}>{instruction}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="flex justify-between items-center mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Test Duration: {test.duration} minutes
                </div>
                <Button 
                  onClick={startTest}
                  className="bg-blue-600 hover:bg-blue-700 px-6 py-2"
                  size="lg"
                >
                  Start Test
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If we're past instructions, show the test content
  if (test && testStage === 'test') {
    console.log('Rendering test content', {
      currentSectionIndex,
      sectionCount: test.sections?.length,
      currentQuestionIndex,
      questionCount: test.sections?.[currentSectionIndex]?.questions?.length
    });
    
    if (!memoizedCurrentSection || !memoizedCurrentQuestion) {
      console.log('No current section or question found', { memoizedCurrentSection, memoizedCurrentQuestion });
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-lg font-medium text-gray-700 dark:text-gray-300">Loading question...</p>
          </div>
        </div>
      );
    }
    
    // Calculate section stats for the progress indicators
    const getSectionStats = (sectionIndex: number) => {
      const section = test.sections[sectionIndex];
      let answered = 0;
      let marked = 0;
      
      section.questions.forEach((question, qIndex) => {
        const answerState = getQuestionState(section.id, question.id);
        if (answerState?.answer !== null) answered++;
        if (answerState?.markedForReview) marked++;
      });
      
      return { answered, total: section.questions.length, marked };
    };
    
    return (
      <div className="max-w-6xl mx-auto p-4 md:p-6">
        {/* Section Tabs */}
        <div className="mb-6">
          <div className="w-full">
            <div className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 mb-4">
              {test.sections.map((section, index) => {
                const stats = getSectionStats(index);
                const isActive = currentSectionIndex === index;
                return (
                  <div 
                    key={section.id}
                    className={`flex flex-col rounded-md transition-all ${
                      isActive 
                        ? 'bg-primary/10 border border-primary/20' 
                        : 'hover:bg-accent/50 border border-transparent'
                    }`}
                  >
                    <button
                      onClick={() => {
                        setCurrentSectionIndex(index);
                        setCurrentQuestionIndex(0);
                      }}
                      className="w-full text-left p-3"
                    >
                      <div className="flex items-center w-full">
                        <div className="text-left">
                          <div className="font-medium">{section.title}</div>
                          {isActive && section.description && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {section.description}
                            </div>
                          )}
                        </div>
                        <span className="ml-auto text-sm font-medium">
                          {stats.answered}/{stats.total}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                        <div 
                          className="bg-primary h-1.5 rounded-full transition-all duration-300" 
                          style={{ width: `${Math.max(5, (stats.answered / stats.total) * 100)}%` }}
                        />
                      </div>
                      {stats.marked > 0 && (
                        <div className="mt-1 flex items-center justify-between">
                          <span className="text-xs text-yellow-600 dark:text-yellow-400 flex items-center">
                            <Bookmark className="w-3 h-3 mr-1" /> {stats.marked} marked
                          </span>
                          {isActive && (
                            <span className="text-xs text-muted-foreground">
                              {section.questions.length} questions
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row gap-6">
          {/* Question Grid Sidebar */}
          <div className="w-64 flex-shrink-0 relative">
            <Card className="sticky top-24 h-[calc(100vh-8rem)] overflow-y-auto w-full">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Section: {memoizedCurrentSection?.title}</h3>
                  <div className="text-sm text-gray-500">
                    {currentQuestionIndex + 1} / {memoizedCurrentSection?.questions?.length || 0}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-5 gap-2">
                  {memoizedCurrentSection?.questions?.map((question, index) => {
                    const answerState = getQuestionState(memoizedCurrentSection.id, question.id);
                    let bgColor = 'bg-gray-100 dark:bg-gray-800';
                    let borderColor = 'border-transparent';
                    
                    if (answerState) {
                      if (answerState.answer !== null) {
                        bgColor = answerState.markedForReview 
                          ? 'bg-yellow-100 dark:bg-yellow-900/30' 
                          : 'bg-green-100 dark:bg-green-900/30';
                      } else if (answerState.skipped) {
                        bgColor = 'bg-gray-100 dark:bg-gray-800';
                      } else if (answerState.markedForReview) {
                        bgColor = 'bg-yellow-100 dark:bg-yellow-900/30';
                      }
                    }
                    
                    if (index === currentQuestionIndex) {
                      borderColor = 'border-primary';
                    }
                    
                    return (
                      <button
                        key={index}
                        className={`w-10 h-10 rounded-md flex items-center justify-center ${bgColor} border-2 ${borderColor} font-medium text-sm`}
                        onClick={() => setCurrentQuestionIndex(index)}
                      >
                        {index + 1}
                      </button>
                    );
                  })}
                </div>
                
                <div className="mt-6 space-y-2 text-sm">
                  <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full bg-green-100 dark:bg-green-900/30 mr-2"></div>
                    <span>Answered</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full bg-yellow-100 dark:bg-yellow-900/30 mr-2"></div>
                    <span>Marked for Review</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full bg-gray-100 dark:bg-gray-800 mr-2"></div>
                    <span>Not Answered</span>
                  </div>
                </div>
                
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-500 dark:text-gray-400">Time Left</span>
                    <div className="flex items-center font-medium">
                      <Clock className="h-4 w-4 mr-1" />
                      {formatTime(timeLeft)}
                    </div>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 transition-all duration-1000 ease-linear"
                      style={{ width: `${(timeLeft / TEST_DURATION) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Main Content */}
          <div className="flex-1 max-w-4xl mx-auto w-full">
            <Card className="w-full">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold">{test.title}</h2>
                  <div className="text-sm text-gray-500">
                    Question {currentQuestionIndex + 1} of {memoizedCurrentSection?.questions?.length || 0}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-4">{memoizedCurrentQuestion?.question}</h3>
                  
                  <div className="space-y-3">
                    {memoizedCurrentQuestion?.options?.map((option, optionIndex) => (
                      <div 
                        key={optionIndex}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          currentAnswer?.answer === optionIndex 
                            ? 'border-primary bg-primary/10' 
                            : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                        }`}
                        onClick={() => memoizedCurrentQuestion && handleAnswerSelect(memoizedCurrentQuestion.id, optionIndex)}
                      >
                        <div className="flex items-center">
                          <div 
                            className={`w-5 h-5 rounded-full border mr-3 flex-shrink-0 flex items-center justify-center ${
                              currentAnswer?.answer === optionIndex 
                                ? 'border-primary bg-primary text-white' 
                                : 'border-gray-300 dark:border-gray-600'
                            }`}
                          >
                            {currentAnswer?.answer === optionIndex && (
                              <div className="w-2 h-2 rounded-full bg-white"></div>
                            )}
                          </div>
                          <span>{isOptionWithText(option) ? option.text : String(option)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex gap-2">
                    <Button 
                      variant={currentAnswer?.markedForReview ? 'secondary' : 'outline'}
                      onClick={(e) => memoizedCurrentQuestion && handleMarkForReview(e, memoizedCurrentQuestion.id)}
                      className="flex items-center gap-2"
                    >
                      <Bookmark className="h-4 w-4" />
                      {currentAnswer?.markedForReview ? 'Unmark Review' : 'Mark for Review'}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={handleSkipQuestion}
                      className="flex items-center gap-2"
                    >
                      <SkipForward className="h-4 w-4" />
                      Skip
                    </Button>
                    <button 
                      onClick={toggleTheme}
                      className="p-1.5 rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      aria-label="Toggle dark mode"
                      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                    >
                      <div className="relative w-10 h-5">
                        <div className="absolute inset-0 flex items-center justify-between px-1">
                          <Moon className={`h-3.5 w-3.5 transition-opacity ${
                            theme === 'dark' ? 'opacity-100 text-blue-300' : 'opacity-100 text-gray-600'
                          }`} />
                          <Sun className={`h-3.5 w-3.5 transition-opacity ${
                            theme === 'dark' ? 'opacity-100 text-yellow-400' : 'opacity-100 text-yellow-500'
                          }`} />
                        </div>
                        <div 
                          className={`absolute top-0.5 bottom-0.5 w-4 bg-white dark:bg-white rounded-full shadow-sm transition-transform duration-300 ${
                            theme === 'dark' ? 'translate-x-6' : 'translate-x-0.5'
                          }`}
                        />
                      </div>
                    </button>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline"
                      onClick={handlePreviousQuestion}
                      disabled={isSubmitting || currentQuestionIndex === 0}
                      className="flex items-center gap-2"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    
                    {isLastQuestion ? (
                      <Button 
                        onClick={() => setShowSubmitDialog(true)}
                        className="bg-green-600 hover:bg-green-700"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          'Submit Test'
                        )}
                      </Button>
                    ) : (
                      <Button 
                        onClick={handleNextQuestion}
                        className="flex items-center gap-2"
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="mt-4 flex justify-between items-center">
              <Button 
                variant="ghost" 
                onClick={handleEndTest}
                className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                End Test
              </Button>
              
              <div className="text-sm text-gray-500 flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                Time Left: {formatTime(timeLeft)}
              </div>
            </div>
          </div>
        </div>
        
        {/* Unanswered Questions Warning Dialog */}
        {showUnansweredWarning && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-medium mb-2">Unanswered Questions</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                You have marked some questions for review but haven't answered them. 
                Please answer them or unmark them before submitting.
              </p>
              <div className="flex justify-end gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setShowUnansweredWarning(false)}
                >
                  Go Back
                </Button>
                <Button 
                  variant="destructive"
                  onClick={() => validateAndSubmitTest(true)}
                >
                  Submit Anyway
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {/* Submit Confirmation Dialog */}
        {showSubmitDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-medium mb-2">Submit Test</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Are you sure you want to submit the test? You won't be able to change your answers after submission.
              </p>
              <div className="flex justify-end gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setShowSubmitDialog(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => validateAndSubmitTest()}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Submit Test
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {/* End Test Confirmation Dialog */}
        {showEndTestDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-medium mb-2">End Test</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Are you sure you want to end the test? This will submit your current answers and you won't be able to continue.
              </p>
              <div className="flex justify-end gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setShowEndTestDialog(false)}
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive"
                  onClick={confirmEndTest}
                >
                  End Test
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {/* Tab Change Warning */}
        {showTabSwitchWarning && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-medium mb-2">Warning: Tab Change Detected</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {tabChangeCount < 5 
                  ? `Please do not switch tabs during the test. This is warning ${tabChangeCount} of 10.`
                  : tabChangeCount < 9
                    ? `Warning ${tabChangeCount} of 10: You have ${10 - tabChangeCount} tab changes remaining.`
                    : 'This is your final warning. One more tab switch will automatically submit your test.'}
              </p>
              <div className="flex justify-end">
                <Button 
                  onClick={() => setShowTabSwitchWarning(false)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  I Understand
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
};

export default DynamicTestConductor;