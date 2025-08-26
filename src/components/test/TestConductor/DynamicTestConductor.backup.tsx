import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TestData } from '@/types/test';
import { testData as defaultTestData } from '@/data/TestQues';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, XCircle, Clock, Bookmark, SkipForward, ChevronLeft, ChevronRight, Sun, Moon } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';

// Type for the dynamically imported test module
type TestModule = {
  default: TestData;
};

// Dynamically import all test files from the tests folder
const testModules = import.meta.glob<TestModule>('@/data/tests/*.ts', { eager: false });

interface AnswerState {
  answer: number | null;
  markedForReview: boolean;
  skipped: boolean;
}

const TEST_DURATION = 60 * 60; // 60 minutes/

// Define test stages
type TestStage = 'instructions' | 'section-selection' | 'in-progress' | 'completed';

const DynamicTestConductor: React.FC = () => {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const [test, setTest] = useState<TestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testStage, setTestStage] = useState<TestStage>('instructions');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<AnswerState[]>([]);
  const [timeLeft, setTimeLeft] = useState(TEST_DURATION);
  const [tabChangeCount, setTabChangeCount] = useState(0);
  const [showTabWarning, setShowTabWarning] = useState(false);
  const [showEndTestDialog, setShowEndTestDialog] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showUnansweredWarning, setShowUnansweredWarning] = useState(false);
  const [unansweredQuestionIndex, setUnansweredQuestionIndex] = useState<number | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const savedTheme = localStorage.getItem('theme');
    return (savedTheme as 'light' | 'dark') || 'light';
  });
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const tabChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get current question
  const currentQuestion = test?.questions?.[currentQuestionIndex];
  
  // Toggle theme function
  const toggleTheme = useCallback(() => {
    setTheme(prevTheme => {
      const newTheme = prevTheme === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', newTheme);
      document.documentElement.classList.toggle('dark', newTheme === 'dark');
      return newTheme;
    });
  }, []);

  // Apply theme on mount
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  // Set test as completed
  const setTestCompleted = useCallback((completed: boolean) => {
    setTestStage(completed ? 'completed' : 'in-progress');
    if (completed && timerRef.current) {
      clearInterval(timerRef.current);
    }
  }, []);

  // Load test data
  useEffect(() => {
    const loadTest = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Try to load test data dynamically
        let testData: TestData | null = null;
        
        // Normalize testId for matching
        const normalizedTestId = testId?.toLowerCase().replace(/\s+/g, '-');
        
        // Find matching test file
        const testFile = Object.keys(testModules).find(file => 
          file.toLowerCase().includes(normalizedTestId || '')
        );
        
        if (testFile) {
          const module = await testModules[testFile]();
          testData = module.default;
        } else {
          // Fallback to default test data if no matching file found
          testData = defaultTestData;
        }
        
        if (testData) {
          setTest(testData);
          // Initialize user answers array
          setUserAnswers(
            Array(testData.questions.length).fill(null).map(() => ({
              answer: null,
              markedForReview: false,
              skipped: false
            }))
          );
        } else {
          setError('Test data not found');
        }
      } catch (err) {
        console.error('Error loading test:', err);
        setError('Failed to load test. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadTest();
  }, [testId]);
  
  // Timer effect - only runs when test is in progress
  useEffect(() => {
    if (testStage !== 'in-progress' || !test) return;
    
    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    // Start the timer
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current as NodeJS.Timeout);
          setTestCompleted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    // Cleanup function to clear the interval
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [testStage, test, setTestCompleted]);
  
  // Tab change detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        setTabChangeCount(prev => {
          const newCount = prev + 1;
          if (newCount >= 2) {
            setTestCompleted(true);
          } else {
            setShowTabWarning(true);
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
  
  const calculateScore = (): number => {
    if (!test) return 0;
    
    let correct = 0;
    userAnswers.forEach((answer, index) => {
      if (answer.answer === test.questions[index].correctAnswer) {
        correct++;
      }
    });
    
    return Math.round((correct / test.questions.length) * 100);
  };
  
  // Event handlers
  const handleAnswerSelect = (optionIndex: number) => {
    setUserAnswers(prev => {
      const newAnswers = [...prev];
      newAnswers[currentQuestionIndex] = {
        ...newAnswers[currentQuestionIndex],
        answer: optionIndex,
        skipped: false
      };
      return newAnswers;
    });
  };
  
  const handleMarkForReview = () => {
    setUserAnswers(prev => {
      const newAnswers = [...prev];
      newAnswers[currentQuestionIndex] = {
        ...newAnswers[currentQuestionIndex],
        markedForReview: !newAnswers[currentQuestionIndex].markedForReview
      };
      return newAnswers;
    });
  };
  
  const handleSkipQuestion = () => {
    setUserAnswers(prev => {
      const newAnswers = [...prev];
      newAnswers[currentQuestionIndex] = {
        ...newAnswers[currentQuestionIndex],
        answer: null,
        markedForReview: false,
        skipped: true
      };
      return newAnswers;
    });
    
    // Move to next question if not last
    if (currentQuestionIndex < (test?.questions.length || 0) - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };
  
  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };
  
  const handleNextQuestion = () => {
    if (test && currentQuestionIndex < test.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };
  
  const validateAndSubmitTest = (forceSubmit = false) => {
    if (!test) return;
    
    // Check for marked but unanswered questions
    const hasMarkedUnanswered = userAnswers.some(
      (answer, index) => answer.markedForReview && answer.answer === null
    );
    
    if (hasMarkedUnanswered && !forceSubmit) {
      // Find first marked but unanswered question
      const firstMarkedUnanswered = userAnswers.findIndex(
        answer => answer.markedForReview && answer.answer === null
      );
      
      if (firstMarkedUnanswered !== -1) {
        setUnansweredQuestionIndex(firstMarkedUnanswered);
        setShowUnansweredWarning(true);
        setCurrentQuestionIndex(firstMarkedUnanswered);
        return;
      }
    }
    
    // If we get here, either there are no marked unanswered questions or we're forcing submit
    setTestCompleted(true);
    setShowSubmitDialog(false);
    setShowUnansweredWarning(false);
  };
  
  const handleSubmitTest = useCallback(() => {
    setShowSubmitDialog(true);
  }, []);
  
  const handleEndTest = useCallback(() => {
    setShowEndTestDialog(true);
  }, []);
  
  const confirmEndTest = () => {
    validateAndSubmitTest(true);
    setShowEndTestDialog(false);
  };
  
  // Render loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading test data...</p>
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
          {error}
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
  if (testStage === 'completed') {
    const score = calculateScore();
    const passed = score >= test.passingScore;
    const answeredQuestions = userAnswers.filter(a => a.answer !== null).length;
    const markedForReview = userAnswers.filter(a => a.markedForReview).length;
    const skippedQuestions = userAnswers.filter(a => a.skipped).length;

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
                  {answeredQuestions}/{test.questions.length}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">Questions Answered</span>
              </div>
              <div className="flex flex-col items-center p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <span className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                  {markedForReview}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">Marked for Review</span>
              </div>
            </div>
            
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-3">Question Summary</h3>
              <div className="flex flex-wrap gap-2">
                {test.questions.map((_, index) => {
                  const answer = userAnswers[index];
                  let bgColor = 'bg-gray-200 dark:bg-gray-700';
                  let textColor = 'text-gray-800 dark:text-gray-200';
                  
                  if (answer) {
                    if (answer.answer !== null) {
                      bgColor = answer.markedForReview 
                        ? 'bg-yellow-100 dark:bg-yellow-900/30' 
                        : 'bg-green-100 dark:bg-green-900/30';
                      textColor = answer.markedForReview 
                        ? 'text-yellow-800 dark:text-yellow-200' 
                        : 'text-green-800 dark:text-green-200';
                    } else if (answer.skipped) {
                      bgColor = 'bg-gray-100 dark:bg-gray-800';
                      textColor = 'text-gray-500 dark:text-gray-400';
                    } else if (answer.markedForReview) {
                      bgColor = 'bg-yellow-100 dark:bg-yellow-900/30';
                      textColor = 'text-yellow-800 dark:text-yellow-200';
                    }
                  }
                  
                  return (
                    <button
                      key={index}
                      className={`w-10 h-10 rounded-md flex items-center justify-center ${bgColor} ${textColor} font-medium`}
                      onClick={() => setCurrentQuestionIndex(index)}
                    >
                      {index + 1}
                    </button>
                  );
                })}
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
  if (testStage === 'instructions' && test) {
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
                  onClick={() => setTestStage('in-progress')}
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
  if (test && testStage !== 'instructions') {
    const currentAnswer = userAnswers[currentQuestionIndex];
    const isLastQuestion = currentQuestionIndex === (test.questions.length - 1);
    
    return (
      <div className="max-w-6xl mx-auto p-4 md:p-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Question Grid Sidebar */}
        <div className="w-full md:w-1/4">
          <Card className="sticky top-4">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Questions</h3>
                <div className="text-sm text-gray-500">
                  {currentQuestionIndex + 1} / {test.questions.length}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-5 gap-2">
                {test.questions.map((_, index) => {
                  const answer = userAnswers[index];
                  let bgColor = 'bg-gray-100 dark:bg-gray-800';
                  let borderColor = 'border-transparent';
                  
                  if (answer) {
                    if (answer.answer !== null) {
                      bgColor = answer.markedForReview 
                        ? 'bg-yellow-100 dark:bg-yellow-900/30' 
                        : 'bg-green-100 dark:bg-green-900/30';
                    } else if (answer.skipped) {
                      bgColor = 'bg-gray-100 dark:bg-gray-800';
                    } else if (answer.markedForReview) {
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
        <div className="flex-1">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">{test.title}</h2>
                <div className="text-sm text-gray-500">
                  Question {currentQuestionIndex + 1} of {test.questions.length}
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-4">{currentQuestion?.question}</h3>
                
                <div className="space-y-3">
                  {currentQuestion?.options.map((option, optionIndex) => (
                    <div 
                      key={optionIndex}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        currentAnswer?.answer === optionIndex 
                          ? 'border-primary bg-primary/10' 
                          : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                      }`}
                      onClick={() => handleAnswerSelect(optionIndex)}
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
                        <span>{option}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex gap-2">
                  <Button 
                    variant={currentAnswer?.markedForReview ? 'secondary' : 'outline'}
                    onClick={handleMarkForReview}
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
                    disabled={currentQuestionIndex === 0}
                    className="flex items-center gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  
                  {isLastQuestion ? (
                    <Button 
                      onClick={handleSubmitTest}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Submit Test
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
      {showTabWarning && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium mb-2">Warning: Tab Change Detected</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {tabChangeCount === 1 
                ? 'Please do not switch tabs during the test. This is your first warning.'
                : 'This is your final warning. One more tab switch will automatically submit your test.'}
            </p>
            <div className="flex justify-end">
              <Button 
                onClick={() => setShowTabWarning(false)}
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
};

export default DynamicTestConductor;