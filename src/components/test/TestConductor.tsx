import { useState, useEffect, useCallback, useRef } from 'react';
import { Clock, CheckCircle, XCircle, Flag, Sun, Moon, ChevronDown, X, AlertTriangle } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTestData } from '../../hooks/useTestData';
import { Button } from '../ui/button';
import { useLayout } from '../../contexts/LayoutContext';

// Define types for test data
export interface TestQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  marks: number;
  section?: string;
  hindiQuestion?: string;
  hindiOptions?: string[];
  negativeMarking?: number;
  imageUrl?: string;
}

export interface TestSection {
  name: string;
  questions: TestQuestion[];
}

export interface CourseTest {
  id: string;
  title: string;
  description: string;
  duration: number;
  questions?: TestQuestion[];
  sections?: TestSection[];
  negativeMarking: boolean;
  instructions: string[] | string;
  totalMarks: number;
  passingScore?: number;
  category?: string;
  thumbnail?: string;
}

// Mock ThemeContext since it's not found
const useTheme = () => ({
  theme: 'light',
  toggleTheme: () => {}
});

// Translation dictionary
const translations = {
  en: {
    question: 'Question',
    of: 'of',
    mark: 'Mark',
    marked: 'Marked',
    previous: 'Previous',
    next: 'Next',
    review: 'Review',
    submitTest: 'Submit Test',
    endTest: 'End Test',
    testPassed: 'Test Passed!',
    testCompleted: 'Test Completed',
    answered: 'Answered',
    retakeTest: 'Retake Test',
    endTestConfirmation: 'End Test Confirmation',
    endTestMessage: 'Are you sure you want to end the test?',
    confirmEnd: 'Type "END" to confirm:',
    cancel: 'Cancel',
    confirmEndTest: 'Confirm End Test',
    questions: 'Questions',
    marksObtained: 'Marks Obtained',
    passingScore: 'Passing Score',
    loadingQuestions: 'Loading test questions...',
    testInstructions: 'Test Instructions',
    backToTests: 'Back to Tests',
    startTest: 'Start Test',
    timeLeft: 'Time Left',
    testSubmitted: 'Test Submitted',
    yourScore: 'Your Score',
    thankYou: 'Thank you for taking the test!',
    totalQuestions: 'Total Questions',
    duration: 'Duration',
    minutes: 'minutes',
    section: 'Section',
    complete: 'Complete',
    markForReview: 'Mark for Review',
    nextMarked: 'Next Marked',
    showGrid: 'Show Grid',
    hideGrid: 'Hide Grid',
    questionGrid: 'Question Grid',
    submitTestConfirm: 'Submit Test Confirmation',
    submitConfirmation: 'Are you sure you want to submit the test? You cannot change answers after submission.',
    typeConfirmToSubmit: 'Type "END" to confirm submission:',
    typeHere: 'Type here',
    score: 'Score',
    passed: 'Passed',
    notPassed: 'Not Passed',
    unanswered: 'Unanswered'
  },
  hi: {
    question: 'प्रश्न',
    of: 'का',
    mark: 'चिह्नित करें',
    marked: 'चिह्नित',
    previous: 'पिछला',
    next: 'अगला',
    review: 'समीक्षा',
    submitTest: 'परीक्षण जमा करें',
    endTest: 'परीक्षण समाप्त करें',
    testPassed: 'परीक्षा पास हो गई!',
    testCompleted: 'परीक्षा पूरी हुई',
    answered: 'उत्तर दिया',
    retakeTest: 'फिर से परीक्षा दें',
    endTestConfirmation: 'परीक्षा समाप्त करने की पुष्टि',
    endTestMessage: 'क्या आप वाकई परीक्षा समाप्त करना चाहते हैं?',
    confirmEnd: 'पुष्टि करने के लिए "END" टाइप करें:',
    cancel: 'रद्द करें',
    confirmEndTest: 'परीक्षा समाप्त करने की पुष्टि करें',
    questions: 'प्रश्न',
    marksObtained: 'प्राप्त अंक',
    passingScore: 'उत्तीर्ण अंक',
    loadingQuestions: 'प्रश्न लोड हो रहे हैं...',
    testInstructions: 'परीक्षा निर्देश',
    backToTests: 'परीक्षाओं पर वापस जाएं',
    startTest: 'परीक्षा शुरू करें',
    timeLeft: 'शेष समय',
    testSubmitted: 'परीक्षा जमा हो गई',
    yourScore: 'आपका स्कोर',
    thankYou: 'परीक्षा देने के लिए धन्यवाद!',
    totalQuestions: 'कुल प्रश्न',
    duration: 'अवधि',
    minutes: 'मिनट',
    section: 'अनुभाग',
    complete: 'पूर्ण',
    markForReview: 'समीक्षा के लिए चिह्नित करें',
    nextMarked: 'अगला चिह्नित',
    showGrid: 'ग्रिड दिखाएं',
    hideGrid: 'ग्रिड छिपाएं',
    questionGrid: 'प्रश्न ग्रिड',
    submitTestConfirm: 'परीक्षण जमा करने की पुष्टि',
    submitConfirmation: 'क्या आप वाकई परीक्षण जमा करना चाहते हैं? जमा करने के बाद आप उत्तर नहीं बदल सकते।',
    typeConfirmToSubmit: 'पुष्टि करने के लिए "END" टाइप करें:',
    typeHere: 'यहाँ टाइप करें',
    score: 'स्कोर',
    passed: 'पास',
    notPassed: 'फेल',
    unanswered: 'अनुत्तरित'
  }
};

const TestConductor: React.FC = () => {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const { setHideLayout } = useLayout();
  const { theme: appTheme, toggleTheme } = useTheme();
  
  // Fetch test data using the useTestData hook
  const { test, loading, error } = useTestData(testId || '');
  const selectedTest = test as CourseTest | null;
  
  // State management
  const [testState, setTestState] = useState({
    testStarted: false,
    currentQuestionIndex: 0,
    currentSectionIndex: 0,
    answers: {} as Record<string, number>,
    timeLeft: 0,
    testSubmitted: false,
    score: 0,
    markedQuestions: [] as Array<{sectionIndex: number, questionIndex: number, questionId: string}>,
    tabSwitchCount: 0,
    showTabSwitchWarning: false,
    showEndTestModal: false,
    showQuestionGrid: false,
    confirmationText: '',
    theme: appTheme,
    language: 'en' as 'en' | 'hi'
  });

  // Destructure state for easier access
  const {
    testStarted,
    currentQuestionIndex,
    currentSectionIndex,
    answers,
    timeLeft,
    testSubmitted,
    score,
    markedQuestions,
    tabSwitchCount,
    showTabSwitchWarning,
    showEndTestModal,
    showQuestionGrid,
    confirmationText,
    theme,
    language
  } = testState;

  // Refs
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const tabSwitchWarningTimer = useRef<NodeJS.Timeout | null>(null);

  // Update theme when app theme changes
  useEffect(() => {
    setTestState(prev => ({
      ...prev,
      theme: appTheme
    }));
  }, [appTheme]);

  // Initialize test timer when test starts
  useEffect(() => {
    if (testStarted && !testSubmitted && selectedTest) {
      setTestState(prev => ({
        ...prev,
        timeLeft: selectedTest.duration * 60 // Convert minutes to seconds
      }));

      // Set up timer
      timerRef.current = setInterval(() => {
        setTestState(prev => {
          if (prev.timeLeft <= 1) {
            clearInterval(timerRef.current as NodeJS.Timeout);
            handleSubmitTest();
            return { ...prev, timeLeft: 0 };
          }
          return { ...prev, timeLeft: prev.timeLeft - 1 };
        });
      }, 1000);
    }

    return () => {
      // Always show layout when unmounting
      setHideLayout(false);
      
      // Clear any running timers
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [testStarted, testSubmitted, selectedTest, setHideLayout]);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Toggle language between English and Hindi
  const toggleLanguage = useCallback(() => {
    setTestState(prev => ({
      ...prev,
      language: prev.language === 'en' ? 'hi' : 'en'
    }));
  }, []);

  // Toggle theme
  const handleToggleTheme = useCallback(() => {
    toggleTheme();
  }, [toggleTheme]);

  // Toggle end test confirmation modal
  const toggleEndTestModal = useCallback(() => {
    setTestState(prev => ({
      ...prev,
      showEndTestModal: !prev.showEndTestModal,
      confirmationText: ''
    }));
  }, []);

  // Handle confirmation text change
  const handleConfirmationTextChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setTestState(prev => ({
      ...prev,
      confirmationText: e.target.value
    }));
  }, []);

  // Check if current question is marked
  const isQuestionMarked = useCallback((questionId: string) => {
    return markedQuestions.some(q => q.questionId === questionId);
  }, [markedQuestions]);

  // Check if answer is selected for current question
  const isAnswerSelected = useCallback((questionId: string, optionIndex: number) => {
    return answers[questionId] === optionIndex;
  }, [answers]);

  // Get current question number in the test
  const getCurrentQuestionNumber = useCallback(() => {
    if (!selectedTest?.sections) return currentQuestionIndex + 1;
    
    let questionCount = 0;
    for (let i = 0; i < currentSectionIndex; i++) {
      questionCount += selectedTest.sections[i]?.questions?.length || 0;
    }
    return questionCount + currentQuestionIndex + 1;
  }, [currentSectionIndex, currentQuestionIndex, selectedTest]);

  // Get current question and section
  const currentSection = selectedTest?.sections?.[currentSectionIndex];
  const currentQuestion = currentSection?.questions?.[currentQuestionIndex] || 
                        selectedTest?.questions?.[currentQuestionIndex];
  
  // Calculate total questions
  const totalQuestions = selectedTest?.sections 
    ? selectedTest.sections.reduce((sum, section) => sum + (section.questions?.length || 0), 0)
    : selectedTest?.questions?.length || 0;

  // Handle answer selection
  const handleAnswerSelect = useCallback((questionId: string, answerIndex: number) => {
    setTestState(prev => ({
      ...prev,
      answers: {
        ...prev.answers,
        [questionId]: answerIndex
      }
    }));
  }, []);

  // Toggle mark question for review
  const toggleMarkQuestion = useCallback((questionId: string) => {
    setTestState(prev => {
      const isMarked = prev.markedQuestions.some(q => q.questionId === questionId);
      return {
        ...prev,
        markedQuestions: isMarked
          ? prev.markedQuestions.filter(q => q.questionId !== questionId)
          : [
              ...prev.markedQuestions,
              {
                sectionIndex: prev.currentSectionIndex,
                questionIndex: prev.currentQuestionIndex,
                questionId
              }
            ]
      };
    });
  }, [currentSectionIndex, currentQuestionIndex]);

  // Navigate to previous question
  const goToPreviousQuestion = useCallback(() => {
    setTestState(prev => {
      if (prev.currentQuestionIndex > 0) {
        return {
          ...prev,
          currentQuestionIndex: prev.currentQuestionIndex - 1
        };
      } else if (currentSectionIndex > 0) {
        // Go to last question of previous section
        const prevSection = selectedTest?.sections?.[currentSectionIndex - 1];
        return {
          ...prev,
          currentSectionIndex: currentSectionIndex - 1,
          currentQuestionIndex: (prevSection?.questions?.length || 1) - 1
        };
      }
      return prev;
    });
  }, [currentSectionIndex, selectedTest?.sections]);

  // Navigate to next question
  const goToNextQuestion = useCallback(() => {
    setTestState(prev => {
      const currentSection = selectedTest.sections?.[prev.currentSectionIndex] || null;
      const questions = currentSection?.questions || selectedTest.questions || [];
      const isLastQuestion = prev.currentQuestionIndex >= questions.length - 1;
      
      if (isLastQuestion) {
        if (selectedTest.sections && prev.currentSectionIndex < selectedTest.sections.length - 1) {
          // Move to next section
          return {
            ...prev,
            currentSectionIndex: prev.currentSectionIndex + 1,
            currentQuestionIndex: 0
          };
        }
        return prev; // Already at last question of last section
      }
      
      return {
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex + 1
      };
    });
  }, [selectedTest]);

  // Start test
  const startTest = useCallback(() => {
    if (!selectedTest) return;
    
    // Hide the layout when test starts
    setHideLayout(true);
    
    setTestState(prev => ({
      ...prev,
      testStarted: true,
      timeLeft: selectedTest.duration * 60, // Convert minutes to seconds
      currentQuestionIndex: 0,
      currentSectionIndex: 0
    }));
  }, [selectedTest, setHideLayout]);

  // Submit test
  const handleSubmitTest = useCallback(() => {
    if (!selectedTest) return;
    
    // Calculate score
    let score = 0;
    const answeredQuestions = Object.entries(answers);
    
    answeredQuestions.forEach(([questionId, selectedOption]) => {
      const question = selectedTest.questions?.find(q => q.id === questionId) || 
                      selectedTest.sections?.flatMap(s => s.questions || []).find(q => q.id === questionId);
      
      if (selectedOption === question.correctAnswer) {
        score += question.marks || 1;
      } else if (selectedTest.negativeMarking && question.negativeMarking) {
        score -= question.negativeMarking;
      }
    });
    
    setHideLayout(false);
    setTestState(prev => ({
      ...prev,
      testSubmitted: true,
      score: Math.max(0, score)
    }));
  }, [answers, selectedTest, setHideLayout]);

  // Toggle question grid visibility
  const toggleQuestionGrid = useCallback(() => {
    setTestState(prev => ({
      ...prev,
      showQuestionGrid: !prev.showQuestionGrid
    }));
  }, []);

  // Find next marked question
  const findNextMarkedQuestion = useCallback(() => {
    if (markedQuestions.length === 0) return null;
    
    const currentGlobalIndex = getCurrentQuestionNumber() - 1;
    let nextMarked = null;
    let minDistance = Infinity;
    
    for (const mq of markedQuestions) {
      const markedGlobalIndex = selectedTest?.sections 
        ? selectedTest.sections.slice(0, mq.sectionIndex).reduce((sum, section) => sum + (section.questions?.length || 0), 0) + mq.questionIndex
        : mq.questionIndex;
      
      const distance = markedGlobalIndex > currentGlobalIndex 
        ? markedGlobalIndex - currentGlobalIndex
        : markedGlobalIndex + (totalQuestions - currentGlobalIndex);
        
      if (distance > 0 && distance < minDistance) {
        minDistance = distance;
        nextMarked = mq;
      }
    }
    
    // If no next marked question, loop back to the first one
    if (!nextMarked && markedQuestions.length > 0) {
      nextMarked = markedQuestions[0];
    }
    
    return nextMarked;
  }, [markedQuestions, selectedTest, totalQuestions, getCurrentQuestionNumber]);

  // Get question index by ID
  const getQuestionIndexById = useCallback((questionId: string) => {
    if (!selectedTest?.sections) return { sectionIndex: -1, questionIndex: -1 };
    
    for (let i = 0; i < selectedTest.sections.length; i++) {
      const section = selectedTest.sections[i];
      const questionIndex = section.questions?.findIndex(q => q.id === questionId) ?? -1;
      if (questionIndex !== -1) {
        return { sectionIndex: i, questionIndex };
      }
    }
    return { sectionIndex: -1, questionIndex: -1 };
  }, [selectedTest]);

  // Get all questions
  const allQuestions = selectedTest?.sections
    ? selectedTest.sections.flatMap(section => section.questions)
    : selectedTest?.questions || [];

  // Get question status (answered, marked, etc.)
  const getQuestionStatus = useCallback((questionId: string) => {
    if (testState.answers[questionId] !== undefined) return 'answered' as const;
    if (testState.markedQuestions.some(q => q.questionId === questionId)) return 'marked' as const;
    return 'unanswered' as const;
  }, [testState.answers, testState.markedQuestions]);

  // Helper function for translations
  const t = useCallback((key: keyof typeof translations.en) => {
    return translations[language][key] || translations.en[key];
  }, [language]);

  // Show loading state
  if (loading) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-4 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className={`animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 ${
          theme === 'dark' ? 'border-blue-500' : 'border-blue-600'
        }`}></div>
        <p className={`mt-4 text-lg font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
          {t('loadingQuestions')}
        </p>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-6 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className={`max-w-md w-full p-6 rounded-xl shadow-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className={`text-xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Error Loading Test
            </h2>
            <p className={`mb-6 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
              {error.message || 'Unable to load the test. Please try again later.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                onClick={() => window.location.reload()}
                className="px-6"
              >
                {t('retakeTest')}
              </Button>
              <Button 
                variant="outline"
                onClick={() => navigate('/tests')}
                className="px-6"
              >
                {t('backToTests')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show test not found state
  if (!selectedTest || (!selectedTest.questions && !selectedTest.sections)) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-6 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className={`max-w-md w-full p-6 rounded-xl shadow-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="text-center">
            <XCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h2 className={`text-xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Test Not Found
            </h2>
            <p className={`mb-6 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
              The requested test could not be found.
            </p>
            <Button 
              onClick={() => navigate('/tests')}
              className="px-6"
            >
              {t('backToTests')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show test instructions if not started
  if (!testStarted) {
    const totalQuestionsCount = selectedTest?.sections
      ? selectedTest.sections.reduce((sum, section) => sum + (section.questions?.length || 0), 0)
      : selectedTest?.questions?.length || 0;
    
    const instructions = Array.isArray(selectedTest?.instructions)
      ? selectedTest.instructions
      : [selectedTest?.instructions || 'Read all questions carefully before answering.'];
    
    return (
      <div className={`min-h-screen pt-16 p-4 md:p-8 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="max-w-4xl mx-auto">
          <div className={`rounded-xl shadow-lg overflow-hidden ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="p-6 md:p-8">
              <h1 className={`text-2xl md:text-3xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {selectedTest?.title || 'Test Instructions'}
              </h1>
              
              <div className="mb-8 mt-6">
                <h2 className={`text-xl font-semibold mb-4 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
                  {t('testInstructions')}
                </h2>
                <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                  <ul className="space-y-3">
                    {instructions.map((instruction: string, index: number) => (
                      <li key={index} className="flex items-start">
                        <span className={`mr-2 mt-1 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>•</span>
                        <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>{instruction}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className={`flex items-start p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                  <Clock className={`h-5 w-5 mt-0.5 mr-3 flex-shrink-0 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
                  <div>
                    <div className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                      {t('duration')}
                    </div>
                    <div className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {selectedTest?.duration || 60} {t('minutes')}
                    </div>
                  </div>
                </div>
                
                <div className={`flex items-start p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                  <div className={`h-5 w-5 mt-0.5 mr-3 flex items-center justify-center flex-shrink-0 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  </div>
                  <div>
                    <div className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                      {t('totalQuestions')}
                    </div>
                    <div className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {totalQuestionsCount}
                    </div>
                  </div>
                </div>
                
                {selectedTest?.passingScore && (
                  <div className={`flex items-start p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <CheckCircle className={`h-5 w-5 mt-0.5 mr-3 flex-shrink-0 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`} />
                    <div>
                      <div className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                        {t('passingScore')}
                      </div>
                      <div className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {selectedTest.passingScore}%
                      </div>
                    </div>
                  </div>
                )}
                
                {selectedTest?.negativeMarking && (
                  <div className={`flex items-start p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <AlertTriangle className={`h-5 w-5 mt-0.5 mr-3 flex-shrink-0 ${theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'}`} />
                    <div>
                      <div className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                        Negative Marking
                      </div>
                      <div className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        Yes
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={startTest}
                  size="lg"
                  className="w-full sm:w-auto"
                >
                  {t('startTest')}
                </Button>
                <Button 
                  onClick={() => navigate('/tests')} 
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto"
                >
                  {t('backToTests')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show test submission screen
  if (testSubmitted) {
    const isPassed = score >= (selectedTest?.passingScore || 0);
    const answeredCount = Object.keys(answers).length;
    const totalQuestions = allQuestions.length;
    
    return (
      <div className={`min-h-screen p-4 md:p-8 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="max-w-4xl mx-auto">
          <div className={`rounded-xl shadow-lg overflow-hidden ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="p-6 md:p-8 text-center">
              <div className="flex justify-center mb-6">
                <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full ${
                  isPassed 
                    ? 'bg-green-100 dark:bg-green-900/30' 
                    : 'bg-red-100 dark:bg-red-900/30'
                }`}>
                  {isPassed ? (
                    <CheckCircle className="h-12 w-12 text-green-500" />
                  ) : (
                    <XCircle className="h-12 w-12 text-red-500" />
                  )}
                </div>
              </div>
              
              <h1 className={`text-2xl md:text-3xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {isPassed ? t('testPassed') : t('testCompleted')}
              </h1>
              
              <div className={`text-5xl font-bold my-6 ${
                isPassed ? 'text-green-500' : 'text-red-500'
              }`}>
                {score}%
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 max-w-2xl mx-auto">
                <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                  <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    {t('totalQuestions')}
                  </div>
                  <div className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {totalQuestions}
                  </div>
                </div>
                
                <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                  <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    {t('answered')}
                  </div>
                  <div className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {answeredCount}
                  </div>
                </div>
                
                <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                  <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    {t('score')}
                  </div>
                  <div className={`text-2xl font-bold ${
                    isPassed ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {score}%
                  </div>
                </div>
              </div>
              
              {selectedTest?.passingScore && (
                <div className={`p-4 rounded-lg mb-8 ${
                  theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'
                }`}>
                  <div className="flex items-center justify-center">
                    <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      {t('passingScore')}: <span className="font-medium">{selectedTest.passingScore}%</span>
                    </div>
                    <div className={`mx-3 text-gray-500`}>•</div>
                    <div className={`text-sm font-medium ${
                      isPassed ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {isPassed ? t('passed') : t('notPassed')}
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button 
                  onClick={() => {
                    setTestState(prev => ({
                      ...prev,
                      testStarted: false,
                      testSubmitted: false,
                      currentQuestionIndex: 0,
                      currentSectionIndex: 0,
                      answers: {},
                      markedQuestions: [],
                      timeLeft: (selectedTest?.duration || 60) * 60,
                      tabSwitchCount: 0,
                      showTabSwitchWarning: false
                    }));
                  }}
                  variant="outline"
                  size="lg"
                >
                  {t('retakeTest')}
                </Button>
                <Button 
                  onClick={() => navigate('/tests')}
                  size="lg"
                >
                  {t('backToTests')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show test interface
  if (!currentQuestion || !selectedTest) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-screen p-4 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className={`text-lg font-medium mb-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
          {t('loadingQuestions')}...
        </div>
        <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${
          theme === 'dark' ? 'border-blue-400' : 'border-blue-600'
        }`}></div>
      </div>
    );
  }

  // Get current question text based on language
  const questionText = language === 'hi' && currentQuestion.hindiQuestion 
    ? currentQuestion.hindiQuestion 
    : currentQuestion.question;
  
  // Get options for current question
  const options = language === 'hi' && currentQuestion.hindiOptions
    ? currentQuestion.hindiOptions
    : currentQuestion.options;

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-800">
      {/* Blue Header */}
      <header className="bg-blue-600 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="text-lg font-semibold">
              {selectedTest.title}
            </div>
            <div className="flex items-center bg-blue-700 px-3 py-1 rounded-full">
              <Clock className="h-4 w-4 mr-1" />
              <span className="text-sm">{formatTime(timeLeft)}</span>
            </div>
            
            {/* Section tabs for multi-section tests */}
            {selectedTest.sections && selectedTest.sections.length > 1 && (
              <div className="ml-2 flex items-center">
                <span className="text-sm text-blue-100 mr-2">
                  {t('section')}:
                </span>
                <select
                  value={currentSectionIndex}
                  onChange={(e) => {
                    const newSectionIndex = parseInt(e.target.value, 10);
                    setTestState(prev => ({
                      ...prev,
                      currentSectionIndex: newSectionIndex,
                      currentQuestionIndex: 0
                    }));
                  }}
                  className="text-sm rounded-md bg-white/20 border border-white/30 text-white py-1 px-2"
                >
                  {selectedTest.sections.map((section, idx) => (
                    <option key={idx} value={idx}>
                      {section.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="bg-blue-500 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
              title={language === 'en' ? 'हिंदी में बदलें' : 'Switch to English'}
            >
              {language === 'en' ? 'हिंदी' : 'ENG'}
            </button>
            
            {/* Theme Toggle */}
            <button
              onClick={handleToggleTheme}
              className="bg-blue-500 hover:bg-blue-700 text-white p-1 rounded-full"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-6">
        <div className="container mx-auto max-w-4xl">
          <div className={`rounded-lg shadow-sm ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} p-6 border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            {/* Progress bar */}
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-1">
                <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                  {t('question')} {getCurrentQuestionNumber()} {t('of')} {totalQuestions}
                </span>
                <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                  {Math.round((getCurrentQuestionNumber() / totalQuestions) * 100)}% {t('complete')}
                </span>
              </div>
              <div className="w-full h-2 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                <div 
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${(getCurrentQuestionNumber() / totalQuestions) * 100}%` }}
                />
              </div>
            </div>
            
            {/* Question Header */}
            <div className="pb-4 mb-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {currentSection?.name && `${currentSection.name} - `}
                  Question {getCurrentQuestionNumber()}
                </h2>
                <button
                  onClick={toggleMarkQuestion}
                  className={`flex items-center text-sm px-3 py-1 rounded ${
                    isQuestionMarked(currentQuestion.id)
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' 
                      : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  <Flag className={`h-4 w-4 mr-1 ${isQuestionMarked(currentQuestion.id) ? 'fill-current' : ''}`} />
                  {isQuestionMarked(currentQuestion.id) ? t('marked') : t('markForReview')}
                </button>
              </div>
            </div>

            {/* Question Content */}
            <div className="p-6">
              <div className="prose dark:prose-invert max-w-none mb-8">
                <p className={`text-lg ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
                  {questionText}
                </p>
                
                {currentQuestion.imageUrl && (
                  <div className="mt-4 mb-6">
                    <img 
                      src={currentQuestion.imageUrl} 
                      alt="Question" 
                      className="max-w-full h-auto rounded-lg border border-gray-200 dark:border-gray-700"
                    />
                  </div>
                )}
                
                <div className="mt-6 space-y-3">
                  {options && options.map((option, index) => {
                    const isSelected = isAnswerSelected(currentQuestion.id, index);
                    const optionLetter = String.fromCharCode(65 + index);
                    
                    return (
                      <div 
                        key={index}
                        onClick={() => handleAnswerSelect(currentQuestion.id, index)}
                        className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                            : `border ${theme === 'dark' ? 'border-gray-700 hover:bg-gray-700/50' : 'border-gray-200 hover:bg-gray-50'}`
                        }`}
                      >
                        <div className="flex items-start">
                          <div 
                            className={`flex items-center justify-center flex-shrink-0 h-6 w-6 rounded-full border mr-3 mt-0.5 ${
                              isSelected
                                ? 'border-blue-500 bg-blue-500 text-white'
                                : theme === 'dark' ? 'border-gray-500' : 'border-gray-400'
                            }`}
                          >
                            <span className="text-sm font-medium">{optionLetter}</span>
                          </div>
                          <span className={theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}>
                            {option}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Navigation Buttons */}
              <div className="mt-8 flex flex-col sm:flex-row justify-between gap-3">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={goToPreviousQuestion}
                    disabled={getCurrentQuestionNumber() === 1}
                    className="flex-1 sm:flex-none"
                  >
                    {t('previous')}
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={goToNextQuestion}
                    disabled={getCurrentQuestionNumber() === totalQuestions}
                    className="flex-1 sm:flex-none"
                  >
                    {t('next')}
                  </Button>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      const nextMarked = findNextMarkedQuestion();
                      if (nextMarked) {
                        setTestState(prev => ({
                          ...prev,
                          currentSectionIndex: nextMarked.sectionIndex,
                          currentQuestionIndex: nextMarked.questionIndex
                        }));
                      }
                    }}
                    disabled={markedQuestions.length === 0}
                    className="flex-1 sm:flex-none"
                  >
                    {t('nextMarked')}
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={toggleQuestionGrid}
                    className="flex-1 sm:flex-none"
                  >
                    {showQuestionGrid ? t('hideGrid') : t('showGrid')}
                  </Button>
                </div>
                
                <Button
                  variant="destructive"
                  onClick={toggleEndTestModal}
                  className="flex-1 sm:flex-none"
                >
                  {t('submitTest')}
                </Button>
              </div>
              
              {/* Question Grid Overlay */}
              {showQuestionGrid && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={toggleQuestionGrid}>
                  <div 
                    className={`max-w-4xl w-full max-h-[80vh] overflow-y-auto rounded-lg p-6 ${
                      theme === 'dark' ? 'bg-gray-800' : 'bg-white'
                    }`}
                    onClick={e => e.stopPropagation()}
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium">{t('questionGrid')}</h3>
                      <button 
                        onClick={toggleQuestionGrid}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
                      {allQuestions.map((q, idx) => {
                        const questionIndex = getQuestionIndexById(q.id);
                        const isCurrent = questionIndex.sectionIndex === currentSectionIndex && 
                                        questionIndex.questionIndex === currentQuestionIndex;
                        const isAnswered = answers[q.id] !== undefined;
                        const isMarked = isQuestionMarked(q.id);
                        
                        return (
                          <button
                            key={q.id}
                            onClick={() => {
                              setTestState(prev => ({
                                ...prev,
                                currentSectionIndex: questionIndex.sectionIndex,
                                currentQuestionIndex: questionIndex.questionIndex,
                                showQuestionGrid: false
                              }));
                            }}
                            className={`flex items-center justify-center h-10 w-10 rounded-md text-sm font-medium ${
                              isCurrent
                                ? 'bg-blue-600 text-white'
                                : isMarked
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                : isAnswered
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                : theme === 'dark'
                                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {idx + 1}
                          </button>
                        );
                      })}
                    </div>
                    
                    <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm">
                      <div className="flex items-center">
                        <div className="h-3 w-3 rounded-sm bg-green-100 dark:bg-green-900/30 mr-1"></div>
                        <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>{t('answered')}</span>
                      </div>
                      <div className="flex items-center">
                        <div className="h-3 w-3 rounded-sm bg-yellow-100 dark:bg-yellow-900/30 mr-1"></div>
                        <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>{t('marked')}</span>
                      </div>
                      <div className="flex items-center">
                        <div className={`h-3 w-3 rounded-sm ${
                          theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                        } mr-1`}></div>
                        <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>{t('unanswered')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* End Test Confirmation Modal */}
              {showEndTestModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                  <div className={`rounded-lg max-w-md w-full mx-4 ${
                    theme === 'dark' ? 'bg-gray-800' : 'bg-white'
                  } shadow-xl`}>
                    <div className="p-6">
                      <div className="flex items-center">
                        <div className={`flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${
                          theme === 'dark' ? 'bg-red-900/30' : 'bg-red-100'
                        }`}>
                          <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                        </div>
                        <div className="ml-4">
                          <h3 className={`text-lg font-medium ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>
                            {t('endTestConfirmation')}
                          </h3>
                        </div>
                      </div>
                      
                      <div className={`mt-4 px-1 ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        <p className="mb-4">{t('endTestMessage')}</p>
                        
                        <div className={`p-4 rounded-lg ${
                          theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'
                        }`}>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-500 dark:text-gray-400">{t('totalQuestions')}</p>
                              <p className="font-medium">{totalQuestions}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500 dark:text-gray-400">{t('answered')}</p>
                              <p className="font-medium">{Object.keys(answers).length}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500 dark:text-gray-400">{t('marked')}</p>
                              <p className="font-medium">{markedQuestions.length}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500 dark:text-gray-400">{t('unanswered')}</p>
                              <p className="font-medium">{totalQuestions - Object.keys(answers).length}</p>
                            </div>
                          </div>
                          
                          <div className="mt-4">
                            <label htmlFor="confirmText" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              {t('confirmEnd')}
                            </label>
                            <input
                              type="text"
                              id="confirmText"
                              value={confirmationText}
                              onChange={handleConfirmationTextChange}
                              placeholder={t('typeHere')}
                              className={`w-full px-3 py-2 rounded-md border ${
                                theme === 'dark' 
                                  ? 'bg-gray-700 border-gray-600 text-white' 
                                  : 'bg-white border-gray-300 text-gray-900'
                              }`}
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-6 flex justify-end space-x-3">
                        <Button
                          variant="outline"
                          onClick={toggleEndTestModal}
                        >
                          {t('cancel')}
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={handleSubmitTest}
                          disabled={confirmationText !== 'END'}
                        >
                          {t('confirmEndTest')}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      
      {/* Fixed Footer */}
      <div className={`border-t ${theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'} p-4`}>
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <button
              onClick={goToPreviousQuestion}
              disabled={getCurrentQuestionNumber() === 1}
              className={`px-4 py-2 rounded ${
                getCurrentQuestionNumber() === 1 
                  ? 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              Previous
            </button>
            <button
              onClick={goToNextQuestion}
              disabled={getCurrentQuestionNumber() === totalQuestions}
              className={`px-4 py-2 rounded ${
                getCurrentQuestionNumber() === totalQuestions 
                  ? 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              Next
            </button>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleQuestionGrid}
              className="px-4 py-2 border border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400 rounded hover:bg-blue-50 dark:hover:bg-gray-700"
            >
              {showQuestionGrid ? 'Hide Grid' : 'Show Grid'}
            </button>
            <button
              onClick={toggleEndTestModal}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Submit Test
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};



export default TestConductor;