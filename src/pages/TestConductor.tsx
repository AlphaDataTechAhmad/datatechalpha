import { useState, useEffect, useMemo, useContext } from 'react';
import { Account } from 'appwrite';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { databases, DATABASE_ID, client } from '@/appwriteConfig';
import { Loader2, ArrowLeft, Clock, Check, X } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { Moon, Sun } from 'lucide-react';
import { Functions } from 'appwrite';
import { toast } from 'sonner';

const SmallThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full hover:bg-accent transition-colors"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </button>
  );
};
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { getTestDataById } from '@/data/tests';

const INTERNSHIP_TEST_LINKS_COLLECTION = '689923bc000f2d15a263';

interface Question {
  id: number;
  question: string;
  type: string;
  points: number;
  options?: string[];
  correctAnswer?: string;
  selectedAnswer?: string | null;
}

interface Section {
  title: string;
  instructions: string[];
  questions: Question[];
}

interface TestData {
  id: string;
  title: string;
  description: string;
  duration: number; // in minutes
  passingScore: number;
  instructions: {
    generalInstructions: string[];
    beforeTest: string[];
    duringTest: string[];
  };
  sections: Section[];
}

const InternshipTestQuestions = () => {
  const { testId } = useParams<{ testId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [testData, setTestData] = useState<TestData | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [activeSection, setActiveSection] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string | null>>({});
  const [timeLeft, setTimeLeft] = useState<number>(0); // Will be set when testData loads
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabChangeCount, setTabChangeCount] = useState(0);
  const [showTabWarning, setShowTabWarning] = useState(false);
  const [hasValidTestData, setHasValidTestData] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [isTestUsed, setIsTestUsed] = useState(false);

  const processedTestData = useMemo(() => {
    if (!testData) return null;
    
    const questionsWithSections = testData.sections.flatMap((section, sectionIndex) => {
      return section.questions.map((question, questionIndex) => ({
        ...question,
        sectionIndex,
        sectionTitle: section.title,
        questionNumber: questionIndex + 1
      }));
    });
    
    return {
      ...testData,
      questions: questionsWithSections
    };
  }, [testData]);

  const currentSectionQuestions = useMemo(() => {
    if (!testData || !testData.sections[activeSection]) return [];
    return testData.sections[activeSection].questions;
  }, [testData, activeSection]);

  const currentQuestionInSection = useMemo(() => {
    if (!currentSectionQuestions.length) return null;
    return currentSectionQuestions.find((_, index) => 
      index === currentQuestionIndex
    );
  }, [currentSectionQuestions, currentQuestionIndex]);

  const handleSectionChange = (sectionIndex: number) => {
    setActiveSection(sectionIndex);
    setCurrentQuestionIndex(0);
  };
  
  const totalQuestions = useMemo(() => {
    if (!testData?.sections) return 0;
    return testData.sections.reduce((sum: number, section: Section) => 
      sum + (section.questions?.length || 0), 0);
  }, [testData]);

  useEffect(() => {
    let isMounted = true;
    
    const loadTestData = async () => {
      try {
        setIsLoading(true);
        
        if (!testId) {
          setError('Invalid test ID');
          setIsLoading(false);
          return;
        }

        // Check if test has already been taken
        const testLinkDoc = await databases.getDocument(
          DATABASE_ID,
          INTERNSHIP_TEST_LINKS_COLLECTION,
          testId
        );

        if (testLinkDoc.isUsed) {
          setIsTestUsed(true);
          setIsLoading(false);
          return;
        }

        try {
          let testData;
          
          if (location.state?.testData) {
            // Use test data from location state if available
            testData = location.state.testData;
            console.log('Using test data from location state:', testData);
          } else {
            // Try to load test data from the database if not in location state
            testData = await getTestDataById(testId);
            if (!isMounted) return;
          }
          
          // Ensure test data is in the correct format
          const transformedTestData = {
            ...testData,
            id: testId,
            title: testData.title || 'Internship Test',
            description: testData.description || '',
            duration: testData.duration || 60,
            passingScore: testData.passingScore || 60,
            instructions: {
              generalInstructions: testData.instructions?.generalInstructions || [],
              beforeTest: testData.instructions?.beforeTest || [],
              duringTest: testData.instructions?.duringTest || []
            },
            sections: testData.sections.map((section, sectionIndex) => ({
              ...section,
              title: section.title || `Section ${sectionIndex + 1}`,
              questions: section.questions.map((q, questionIndex) => ({
                ...q,
                id: typeof q.id === 'string' ? parseInt(q.id.replace(/\D/g, '')) || questionIndex : q.id || questionIndex,
                type: (q.options?.length > 0) ? 'multiple_choice' : 'text',
                points: typeof q.points === 'number' ? q.points : 1,
                sectionIndex,
                sectionTitle: section.title || `Section ${sectionIndex + 1}`,
                questionNumber: questionIndex + 1,
                options: q.options || [],
                correctAnswer: q.correctAnswer !== undefined ? q.correctAnswer : undefined
              }))
            }))
          };
          
          if (!isMounted) return;
          
          setTestData(transformedTestData);
          const hasQuestions = transformedTestData.sections.some(s => s.questions?.length > 0);
          console.log('Has valid questions:', hasQuestions);
          setHasValidTestData(hasQuestions);
          
          const durationInSeconds = (testData.duration || 60) * 60;
          console.log('Setting initial time:', durationInSeconds, 'seconds');
          setTimeLeft(durationInSeconds);
          
        } catch (err) {
          console.error('Error loading test data:', err);
          if (isMounted) {
            setError('Test not found or failed to load. Please check the test link and try again.');
          }
        } finally {
          if (isMounted) {
            setIsLoading(false);
          }
        }
      } catch (err) {
        console.error('Error in loadTestData:', err);
        if (isMounted) {
          setError('An unexpected error occurred. Please try again.');
          setIsLoading(false);
        }
      }
    };

    loadTestData();

    return () => {
      isMounted = false;
    };
  }, [testId, location.state]);

  useEffect(() => {
    if (!testData || !hasValidTestData) return;
    
    console.log('Test data loaded, duration:', testData.duration);
    
    // Set the initial time when testData is loaded
    if (testData.duration) {
      const durationInSeconds = testData.duration * 60;
      console.log('Setting time left to:', durationInSeconds, 'seconds');
      setTimeLeft(durationInSeconds);
      
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            handleSubmitTest();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [testData, hasValidTestData]);

  // Handle tab/window visibility change
  useEffect(() => {
    if (!testData || !hasValidTestData) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabChangeCount(prev => {
          const newCount = prev + 1;
          if (newCount >= 5) {
            handleSubmitTest();
            return newCount;
          }
          setShowTabWarning(true);
          return newCount;
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [testData, hasValidTestData]);

  const handleAnswerSelect = (questionId: number, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleNextQuestion = () => {
    if (!testData) return;
    
    if (currentQuestionIndex < currentSectionQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else if (activeSection < testData.sections.length - 1) {
      handleSectionChange(activeSection + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleMarkForReview = () => {
    console.log('Marked question for review:', currentQuestionIndex + 1);
    handleNextQuestion();
  };

  // Function to send test result email
  const sendTestResultEmail = async (testResult: any) => {
    try {
      const functions = new Functions(client);
      
      // Prepare the payload with all required fields including testId
      const payload = {
        testId: testResult.testId,
        email: testResult.userEmail,
        name: testResult.userName,
        testName: testResult.testName || 'Internship Test',
        score: testResult.score,
        totalMarks: testResult.totalMarks,
        percentage: testResult.percentage,
        passed: testResult.passed
      };
      
      console.log('Sending test result with payload:', JSON.stringify(payload, null, 2));
      
      const response = await functions.createExecution(
        '68e25ded00193fabd29b',
        JSON.stringify(payload)
      );
      
      console.log('Email function execution result:', response);
      return response;
    } catch (error) {
      console.error('Error sending test result email:', error);
      throw error;
    }
  };

  // Function to send SMS notification
const sendSMSNotification = async (testResult: any) => {
  try {
    const functions = new Functions(client);
    
    // Prepare the message based on test result and percentage
    let message = '';
    
    if (testResult.percentage >= 90) {
      // For students who scored 90% or above
      message = `Dear ${testResult.userName}, your Pre-Exam result: passed, Score: ${testResult.score}/${testResult.totalMarks} (${testResult.percentage}%). Congratulations! You are Qualified and directly eligible for the Technical Test. Click Here for Schedule your Technical Test (https://datatechalpha.com/internships)`;
    } else {
      // For students who scored below 90%
      message = `Dear ${testResult.userName}, your Pre-Exam result: failed, Score: ${testResult.score}/${testResult.totalMarks} (${testResult.percentage}%). Congratulations! You are not Qualified. Unfortunately, you have not qualified in the Pre-Exam. However, you still have an opportunity to become eligible for the upcoming Technical Test (Coding Test).

To qualify, you are required to complete a 20-day training program, which includes:

10 days of Theory Lectures
10 days of Project Work

Upon successful completion of this training, you will be eligible to appear for the Technical Test.
Click Here for Enroll training (https://datatechalpha.com/internships)
We encourage you to take this opportunity to strengthen your skills and continue your journey toward success.`;
    }
    
    const payload = {
      to: testResult.phone,
      message: message
    };
    
    console.log('Sending SMS with payload:', JSON.stringify(payload, null, 2));
    
    const response = await functions.createExecution(
      '68e75d6d001a88114165', // SMS function ID
      JSON.stringify(payload)
    );
    
    console.log('SMS function execution result:', response);
    return response;
  } catch (error) {
    console.error('Error sending SMS notification:', error);
    throw error;
  }
};

  const handleSubmitTest = async () => {
    if (!testData) {
      console.error('No test data available');
      return;
    }
    
    console.log('=== Starting test submission ===');
    console.log('Test ID:', testId);
    console.log('Test data:', testData);
    
    setIsSubmitting(true);

    try {
      const urlParams = new URLSearchParams(window.location.search);
      const userEmail = urlParams.get('email') || 'candidate@example.com';
      const userName = urlParams.get('name') || 'Candidate';
      const userId = urlParams.get('userId') || 'unknown-user';

      let score = 0;
      let maxScore = 0;
      let totalQuestions = 0;
      let answeredQuestions = 0;

      // Calculate score and prepare submission data
      for (const section of testData.sections) {
        for (const question of section.questions) {
          const points = question.points || 1;
          maxScore += points;
          totalQuestions++;
          
          // Only count the score if an answer was provided
          const userAnswer = answers[question.id];
          if (userAnswer !== undefined && userAnswer !== null) {
            answeredQuestions++;
            
            // Handle both numeric indices and direct string answers
            const correctAnswer = question.correctAnswer;
            let isCorrect = false;
            
            if (correctAnswer !== undefined && correctAnswer !== null) {
              // If correctAnswer is a number, treat it as an index into the options array
              if (typeof correctAnswer === 'number' && question.options) {
                const correctOption = question.options[correctAnswer];
                isCorrect = userAnswer.trim().toLowerCase() === correctOption?.toString().trim().toLowerCase();
              } 
              // Otherwise, do a direct string comparison
              else {
                isCorrect = userAnswer.trim().toLowerCase() === correctAnswer.toString().trim().toLowerCase();
              }
              
              if (isCorrect) {
                score += points;
                correctAnswers++;
              }
            }
          }
        }
      }

      // Calculate percentage based on correct answers
      const percentage = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
      const passed = percentage >= (testData.passingScore || 60);
      const scoreString = score.toString();
      const completedAt = new Date().toISOString();
      const status = passed ? 'passed' : 'failed';
      const percentageStr = percentage.toString();
      
      console.log('Test results:', {
        testId,
        score,
        maxScore,
        percentage,
        passed,
        correctAnswers,
        totalQuestions,
        fieldsToUpdate: {
          is_used: true,
          score: scoreString,
          status: status,
          completed_at: completedAt,
          passed: passed,
          percentage: percentageStr,
          $updatedAt: completedAt
        }
      });

      // Update test results in the database with all required fields
      const updateData = {
        is_used: true,
        score: scoreString,
        status: status,
        completed_at: completedAt,
        passed: passed,
        percentage: percentageStr
      };
      
      console.log('Attempting to update document with:', updateData);
      
      const result = await databases.updateDocument(
        DATABASE_ID,
        INTERNSHIP_TEST_LINKS_COLLECTION,
        testId,
        updateData
      );

      console.log('Document update successful:', result);
      
      // Send email notification
      try {
        await sendTestResultEmail({
          userEmail,
          userName,
          testName: testData.title,
          score,
          totalMarks: totalQuestions,
          percentage,
          passed,
          testId,
          userId
        });
        toast.success('Test submitted successfully! Results have been emailed to you.');
        
        // Send SMS notification if phone number is available
        if (result.phone) {
          try {
            await sendSMSNotification({
              userName,
              testName: testData.title,
              score,
              totalMarks: totalQuestions,
              percentage,
              passed,
              phone: result.phone,
              testId
            });
            console.log('SMS notification sent successfully');
          } catch (smsError) {
            console.error('Failed to send SMS notification:', smsError);
            // Don't show error to user, just log it
          }
        } else {
          console.log('No phone number available for SMS notification');
        }
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
        toast.success('Test submitted successfully!');
      }
      
      setShowThankYou(true);
      
    } catch (error) {
      console.error('Error submitting test:', error);
      toast.error('Failed to submit test. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!testData) {
      console.error('No test data available');
      return;
    }
    
    console.log('=== Starting test submission ===');
    console.log('Test ID:', testId);
    console.log('Test data:', testData);
    
    setIsSubmitting(true);

    try {
      // Calculate score and prepare submission data
      // ... existing submission code ...
      
      // Use for...of loops for proper async/await handling
      for (const section of testData.sections) {
        for (const question of section.questions) {
          const points = question.points || 1;
          maxScore += points;
          totalQuestions++;
          
          // Only count the score if an answer was provided
          const userAnswer = answers[question.id];
          if (userAnswer !== undefined && userAnswer !== null) {
            answeredQuestions++;
            
            // Handle both numeric indices and direct string answers
            const correctAnswer = question.correctAnswer;
            let isCorrect = false;
            
            if (correctAnswer !== undefined && correctAnswer !== null) {
              // If correctAnswer is a number, treat it as an index into the options array
              if (typeof correctAnswer === 'number' && question.options) {
                const correctOption = question.options[correctAnswer];
                isCorrect = userAnswer.trim().toLowerCase() === correctOption?.toString().trim().toLowerCase();
              } 
              // Otherwise, do a direct string comparison
              else {
                isCorrect = userAnswer.trim().toLowerCase() === correctAnswer.toString().trim().toLowerCase();
              }
              
              if (isCorrect) {
                score += points;
                correctAnswers++;
              }
            }
          }
        }
      }
      // Calculate percentage based on correct answers
      const percentage = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
      const passed = percentage >= testData.passingScore;
      const scoreString = score.toString();

      const completedAt = new Date().toISOString();
      const status = passed ? 'passed' : 'failed';
      const percentageStr = percentage.toString();
      
      console.log('Test results:', {
        testId,
        score,
        maxScore,
        percentage,
        passed,
        correctAnswers,
        totalQuestions,
        fieldsToUpdate: {
          is_used: true,
          score: scoreString,
          status: status,
          completed_at: completedAt,
          passed: passed,
          percentage: percentageStr,
          $updatedAt: completedAt
        }
      });

      // Update test results in the database with all required fields
      const updateData = {
        is_used: true,
        score: scoreString,
        status: status,
        completed_at: completedAt,
        passed: passed,
        percentage: percentageStr
      };
      
      console.log('Attempting to update document with:', updateData);
      
      try {
        const result = await databases.updateDocument(
          DATABASE_ID,
          INTERNSHIP_TEST_LINKS_COLLECTION,
          testId,
          updateData
        );

        console.log('Document update successful:', result);
        
        // Verify the update by fetching the document again
        try {
          const updatedDoc = await databases.getDocument(
            DATABASE_ID,
            INTERNSHIP_TEST_LINKS_COLLECTION,
            testId
          );
          console.log('Verified document after update:', updatedDoc);
          
          // Ensure the document was updated as expected
          if (updatedDoc.status !== status || 
              updatedDoc.passed !== passed || 
              updatedDoc.percentage !== percentageStr) {
            console.warn('Document verification failed - fields not updated as expected');
            console.warn('Expected:', updateData);
            console.warn('Actual:', {
              status: updatedDoc.status,
              passed: updatedDoc.passed,
              percentage: updatedDoc.percentage,
              completed_at: updatedDoc.completed_at
            });
          }
        } catch (verifyError) {
          console.error('Error verifying document update:', verifyError);
        }
      } catch (updateError) {
        console.error('Error updating document:', updateError);
        throw updateError; // Re-throw to be caught by the outer try-catch
      }
      
      setShowThankYou(true);
    } catch (error) {
      console.error('Error submitting test:', error);
      alert('There was an error submitting your test. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getQuestionStatus = (questionId: number) => {
    return answers[questionId] ? 'answered' : 'unanswered';
  };

  const getAbsoluteQuestionIndex = (sectionIndex: number, questionIndex: number) => {
    if (!testData) return 0;
    let absoluteIndex = 0;
    for (let i = 0; i < sectionIndex; i++) {
      absoluteIndex += testData.sections[i]?.questions.length || 0;
    }
    return absoluteIndex + questionIndex;
  };

  const navigateToQuestion = (sectionIndex: number, questionIndex: number) => {
    setActiveSection(sectionIndex);
    const absIndex = getAbsoluteQuestionIndex(sectionIndex, questionIndex);
    setCurrentQuestionIndex(absIndex);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (isTestUsed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full bg-card p-6 rounded-lg shadow-lg border border-red-500 text-center">
          <X className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Test Already Taken</h2>
          <p className="text-muted-foreground mb-6">
            This test link has already been used. Each test can only be taken once.
          </p>
          <Button 
            onClick={() => navigate('/')}
            className="w-full"
            variant="destructive"
          >
            Return to Home
          </Button>
        </div>
      </div>
    );
  }

  if (showTabWarning) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full bg-card p-6 rounded-lg shadow-lg border border-red-500">
          <div className="text-center space-y-4">
            <X className="h-12 w-12 text-red-500 mx-auto" />
            <h2 className="text-2xl font-bold">Warning: Tab Change Detected</h2>
            <p className="text-muted-foreground">
              You have changed tabs/windows {tabChangeCount} time(s). After {5 - tabChangeCount} more changes, your test will be automatically submitted.
            </p>
            <div className="pt-4">
              <Button 
                onClick={() => setShowTabWarning(false)}
                className="w-full"
                variant="destructive"
              >
                I understand, return to test
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showThankYou) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-2xl w-full bg-white p-8 rounded-lg shadow-md text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="mt-4 text-2xl font-bold text-gray-900">Thank You!</h2>
          <p className="mt-2 text-gray-600">
            Your test has been successfully submitted. Your results will be reviewed and shared with you via email shortly.
          </p>
          <div className="mt-6">
            <Button 
              onClick={() => navigate('/')}
              className="bg-primary hover:bg-primary/90"
            >
              Return to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full text-center">
          <h2 className="text-xl font-bold text-red-600 mb-4">Error Loading Test</h2>
          <p className="text-gray-700 mb-6">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!testData || !processedTestData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <X className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-lg font-medium">Error loading test data</p>
          <Button 
            onClick={() => navigate(-1)} 
            className="mt-4"
            variant="outline"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <h1 className="text-xl font-bold">{testData.title}</h1>
        </div>
        <div className="flex items-center space-x-4">
          <SmallThemeToggle />
          <div className="flex items-center text-sm font-medium bg-accent px-4 py-2 rounded-md">
            <Clock className="h-4 w-4 mr-2" />
            <span>Time Left: </span>
            <span className="font-bold ml-1 min-w-[50px] text-right">
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </span>
            {process.env.NODE_ENV === 'development' && (
              <span className="ml-2 text-xs opacity-50">
                (Debug: {timeLeft}s)
              </span>
            )}
          </div>
          <Button 
            onClick={handleSubmitTest} 
            disabled={isSubmitting}
            className="bg-green-600 hover:bg-green-700"
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
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6 min-h-[calc(100vh-180px)] bg-background">
        <div className="w-full md:w-64 flex-shrink-0 flex flex-col gap-4">
          <Card className="flex-1 bg-card dark:bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Sections</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <Tabs 
                value={activeSection.toString()} 
                onValueChange={(value) => handleSectionChange(Number(value))}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-1 gap-2">
                  {testData.sections.map((section, index) => (
                    <TabsTrigger 
                      key={index} 
                      value={index.toString()}
                      className="justify-start h-auto py-2 px-3 text-left"
                    >
                      <span className="truncate">{section.title}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </CardContent>
          </Card>

          <Card className="flex-1 overflow-hidden flex flex-col bg-card dark:bg-card">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-lg">Questions</CardTitle>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span className="flex items-center">
                  <span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span>
                  <span>Answered</span>
                </span>
                <span className="flex items-center">
                  <span className="w-3 h-3 rounded-full bg-red-500 mr-2"></span>
                  <span>Unanswered</span>
                </span>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto p-4">
              <div className="grid grid-cols-5 gap-2">
                {currentSectionQuestions.map((question, index) => {
                  const isAnswered = !!answers[question.id];
                  const isCurrent = index === currentQuestionIndex;
                  
                  return (
                    <button
                      key={question.id}
                      onClick={() => setCurrentQuestionIndex(index)}
                      className={`w-10 h-10 rounded-md flex items-center justify-center text-sm font-medium transition-colors ${
                        isCurrent 
                          ? 'bg-primary text-primary-foreground ring-2 ring-offset-2 ring-primary/50' 
                          : isAnswered 
                            ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                      }`}
                      title={`Question ${index + 1}`}
                    >
                      {index + 1}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex-1 min-w-0">
          <Card className="h-full flex flex-col bg-card dark:bg-card">
            <CardHeader className="border-b">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <CardTitle className="text-xl">
                    Question {currentQuestionIndex + 1} of {currentSectionQuestions.length}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Section: {testData.sections[activeSection]?.title}
                  </p>
                </div>
                <div className="text-sm font-medium text-muted-foreground bg-accent/50 px-3 py-1 rounded-md">
                  {currentQuestionInSection?.points} point{currentQuestionInSection?.points !== 1 ? 's' : ''}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="flex-1 p-6 overflow-auto">
              <div className="max-w-3xl mx-auto w-full">
                <p className="text-lg leading-relaxed mb-8 text-foreground">
                  {currentQuestionInSection?.question}
                </p>
                
                {currentQuestionInSection?.options?.length > 0 ? (
                  <div className="space-y-3 max-w-2xl">
                    {currentQuestionInSection.options.map((option: string, index: number) => (
                      <div 
                        key={index} 
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          answers[currentQuestionInSection.id] === option 
                            ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                            : 'hover:bg-accent/30 border-gray-200'
                        }`}
                        onClick={() => handleAnswerSelect(currentQuestionInSection.id, option)}
                      >
                        <div className="flex items-center space-x-4">
                          <div className={`flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full border ${
                            answers[currentQuestionInSection.id] === option 
                              ? 'bg-primary text-primary-foreground border-primary' 
                              : 'border-gray-300'
                          }`}>
                            {answers[currentQuestionInSection.id] === option && (
                              <Check className="h-4 w-4" />
                            )}
                          </div>
                          <span className="text-base">{option}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="max-w-2xl">
                    <textarea
                      value={answers[currentQuestionInSection?.id] || ''}
                      onChange={(e) => handleAnswerSelect(currentQuestionInSection.id, e.target.value)}
                      className="w-full h-40 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary text-base"
                      placeholder="Type your answer here..."
                    />
                  </div>
                )}

                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-12 pt-6 border-t">
                  <Button 
                    onClick={handlePreviousQuestion}
                    disabled={currentQuestionIndex === 0}
                    variant="outline"
                    className="w-full sm:w-auto min-w-[120px]"
                  >
                    Previous
                  </Button>
                  
                  <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                    <Button 
                      onClick={handleMarkForReview}
                      variant="outline"
                      className="w-full sm:w-auto border-amber-300 text-amber-700 hover:bg-amber-50 hover:text-amber-800"
                    >
                      Mark for Review
                    </Button>
                    <Button 
                      onClick={handleNextQuestion}
                      disabled={currentQuestionIndex === currentSectionQuestions.length - 1}
                      className="w-full sm:w-auto min-w-[120px]"
                    >
                      {currentQuestionIndex === currentSectionQuestions.length - 1 ? 'Submit Test' : 'Next'}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
    </div>
  );
};

export default InternshipTestQuestions;

