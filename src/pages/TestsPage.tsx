import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, Flag, Sun, Moon, ChevronDown } from 'lucide-react';
import { allCourses } from './courseData';
import { CourseTest, getTestByCourseId } from './Tests';
import { useAuth } from '../contexts/AuthContext';
import { databases } from '../Services/appwrite';
import { ID } from 'appwrite';

// Translation dictionary
const DATABASE_ID = '68261b6a002ba6c3b584';
const TEST_RESULTS_COLLECTION_ID = '684da84500159ddfea6f';

const translations = {
  english: {
    practiceTests: "Practice Tests",
    selectCourse: "Select Course",
    startTest: "Start Test",
    testInstructions: "Test Instructions",
    backToCourses: "Back to Courses",
    question: "Question",
    of: "of",
    mark: "Mark",
    marked: "Marked",
    previous: "Previous",
    next: "Next",
    nextSection: "Next Section",
    review: "Review",
    submitEnd: "SUBMIT/END",
    submitTest: "Submit Test",
    endTest: "End Test",
    testPassed: "Test Passed!",
    testCompleted: "Test Completed",
    answered: "Answered",
    retakeTest: "Retake Test",
    endTestConfirmation: "End Test Confirmation",
    endTestMessage: "Are you sure you want to end the test? The test will be submitted with your current answers.",
    confirmEnd: "Type \"END\" in capital letters to confirm:",
    cancel: "Cancel",
    confirmEndTest: "Confirm End Test",
    completeAllQuestions: "Complete All Questions",
    continueTest: "Continue Test",
    goToMarked: "Go to Marked",
    tabSwitchWarning: "Warning: Tab Switch Detected",
    tabSwitchMessage: "You have switched tabs {count} time(s). You have {remaining} remaining switch(es) before the test is automatically submitted.",
    tabSwitchWarningDetail: "Please remain on this tab during the test to avoid automatic submission.",
    understand: "I Understand",
    questions: "Questions",
    marksObtained: "Marks Obtained",
    markingScheme: "Marking Scheme",
    markingSchemeDetail: "Marking Scheme: +2 for correct, -0.5 for wrong",
    passingScore: "Passing Score",
    loadingQuestions: "Loading test questions..."
  },
  hindi: {
    practiceTests: "अभ्यास परीक्षण",
    selectCourse: "पाठ्यक्रम चुनें",
    startTest: "परीक्षण शुरू करें",
    testInstructions: "परीक्षण निर्देश",
    backToCourses: "पाठ्यक्रम पर वापस जाएं",
    question: "प्रश्न",
    of: "का",
    mark: "चिह्नित करें",
    marked: "चिह्नित",
    previous: "पिछला",
    next: "अगला",
    nextSection: "अगला खंड",
    review: "समीक्षा करें",
    submitEnd: "जमा करें/समाप्त",
    submitTest: "परीक्षण जमा करें",
    endTest: "परीक्षण समाप्त करें",
    testPassed: "परीक्षण पास हो गया!",
    testCompleted: "परीक्षण पूर्ण हुआ",
    answered: "उत्तर दिया",
    retakeTest: "परीक्षण फिर से दें",
    endTestConfirmation: "परीक्षण समाप्त करने की पुष्टि",
    endTestMessage: "क्या आप वाकई परीक्षण समाप्त करना चाहते हैं? परीक्षण आपके वर्तमान उत्तरों के साथ जमा कर दिया जाएगा।",
    confirmEnd: "पुष्टि करने के लिए \"END\" बड़े अक्षरों में टाइप करें:",
    cancel: "रद्द करें",
    confirmEndTest: "परीक्षण समाप्त करने की पुष्टि करें",
    completeAllQuestions: "सभी प्रश्न पूर्ण करें",
    continueTest: "परीक्षण जारी रखें",
    goToMarked: "चिह्नित पर जाएं",
    tabSwitchWarning: "चेतावनी: टैब स्विच का पता चला",
    tabSwitchMessage: "आपने {count} बार टैब बदला है। परीक्षण के स्वचालित रूप से जमा होने से पहले आपके पास {remaining} स्विच(es) शेष हैं।",
    tabSwitchWarningDetail: "स्वचालित जमा होने से बचने के लिए कृपया परीक्षण के दौरान इस टैब पर बने रहें।",
    understand: "मैं समझ गया",
    questions: "प्रश्न",
    marksObtained: "प्राप्त अंक",
    markingScheme: "अंकन योजना",
    markingSchemeDetail: "अंकन योजना: +2 सही के लिए, -0.5 गलत के लिए",
    passingScore: "उत्तीर्ण अंक",
    loadingQuestions: "परीक्षण प्रश्न लोड हो रहे हैं..."
  }
};

const TestConductor: React.FC = () => {
  const { user } = useAuth();
  // Theme state
  const [localTheme, setLocalTheme] = useState<'dark' | 'light'>('dark');
  // Language state
  const [language, setLanguage] = useState<'english' | 'hindi'>('english');

  // Course selection state
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedCourseTitle, setSelectedCourseTitle] = useState<string>('');
  const [showCourseDropdown, setShowCourseDropdown] = useState(false);

  // Test state
  const [selectedTest, setSelectedTest] = useState<CourseTest | null>(null);
  const [testStarted, setTestStarted] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Question state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: number }>({});
  const [markedQuestions, setMarkedQuestions] = useState<{ sectionIndex: number, questionId: number }[]>([]);

  // Timer and scoring
  const [timeLeft, setTimeLeft] = useState(0);
  const [score, setScore] = useState(0);
  const [totalMarks, setTotalMarks] = useState(0);
  const [maxPossibleMarks, setMaxPossibleMarks] = useState(0);

  // Modals
  const [showEndTestModal, setShowEndTestModal] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const [showMarkedWarningModal, setShowMarkedWarningModal] = useState(false);
  const [markedWarningMessage, setMarkedWarningMessage] = useState('');
  const [showSubmitOptions, setShowSubmitOptions] = useState(false);

  // Tab switching control
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showTabSwitchWarning, setShowTabSwitchWarning] = useState(false);
  const MAX_TAB_SWITCHES = 3;

  // Get current questions
  const currentQuestions = selectedTest?.sections
    ? selectedTest.sections[currentSectionIndex]?.questions || []
    : selectedTest?.questions || [];
  const currentQuestion = currentQuestions[currentIndex];

  // Helper function to format numbers based on language
  const formatNumber = (num: number) => {
    if (language === 'hindi') {
      return new Intl.NumberFormat('hi-IN').format(num);
    }
    return num.toString();
  };

  // Helper function to translate strings with placeholders
  const t = (key: keyof typeof translations.english, params: Record<string, string | number> = {}) => {
    let translation = translations[language][key];
    Object.entries(params).forEach(([param, value]) => {
      translation = translation.replace(`{${param}}`, value.toString());
    });
    return translation;
  };

  // Timer effect
  useEffect(() => {
    if (!testStarted || isSubmitted) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          calculateScoreAndSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [testStarted, isSubmitted]);

  // Hide navbar and footer when test starts
  useEffect(() => {
    if (testStarted && !isSubmitted) {
      document.body.classList.add('test-mode');
      document.querySelector('header')?.classList.add('hidden');
      return () => {
        document.body.classList.remove('test-mode');
        document.querySelector('header')?.classList.remove('hidden');
      };
    }
  }, [testStarted, isSubmitted]);

  // Tab switching detection
  useEffect(() => {
    if (testStarted && !isSubmitted) {
      const handleVisibilityChange = () => {
        if (document.hidden) {
          const newCount = tabSwitchCount + 1;
          setTabSwitchCount(newCount);
          
          if (newCount >= MAX_TAB_SWITCHES) {
            calculateScoreAndSubmit();
          } else {
            setShowTabSwitchWarning(true);
          }
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, [testStarted, isSubmitted, tabSwitchCount]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showSubmitOptions && !(event.target as Element).closest('.submit-options-container')) {
        setShowSubmitOptions(false);
      }
      if (showCourseDropdown && !(event.target as Element).closest('.course-dropdown-container')) {
        setShowCourseDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSubmitOptions, showCourseDropdown]);

  // Calculate and submit score
  const calculateScoreAndSubmit = async () => {
    if (!selectedTest) return;

    let marks = 0;
    let maxMarks = 0;

    const calculateSection = (questions: any[]) => {
      questions.forEach(q => {
        maxMarks += 2;
        if (answers[q.id] !== undefined) {
          if (answers[q.id] === q.correctAnswer) {
            marks += 2;
          } else if (selectedTest.negativeMarking) {
            marks -= selectedTest.negativeMarking;
          }
        }
      });
    };

    if (selectedTest.sections) {
      selectedTest.sections.forEach(section => calculateSection(section.questions));
    } else {
      calculateSection(selectedTest.questions || []);
    }

    marks = Math.max(0, marks);
    setTotalMarks(marks);
    setMaxPossibleMarks(maxMarks);
    const percentage = Math.round((marks / maxMarks) * 100);
    setScore(percentage);
    setIsSubmitted(true);

    if (user) {
      const resultData = {
        userId: user.$id,
        testId: selectedTest.courseId,
        testName: selectedTest.title,
        score: marks,
        totalMarks: maxMarks,
        percentage: percentage,
        takenAt: new Date().toISOString(),
      };

      try {
        await databases.createDocument(
          DATABASE_ID,
          TEST_RESULTS_COLLECTION_ID,
          ID.unique(),
          resultData
        );
        console.log('Test result saved successfully!');
      } catch (error) {
        console.error('Failed to save test result:', error);
        // Optionally, show an error message to the user
      }
    }
  };

  // Answer handler
  const handleAnswer = (questionId: number, optionIndex: number) => {
    setAnswers(prev => {
      const newAnswers = { ...prev, [questionId]: optionIndex };
      const isMarked = markedQuestions.some(mq =>
        mq.sectionIndex === currentSectionIndex && mq.questionId === questionId
      );

      if (isMarked) {
        setMarkedQuestions(prev =>
          prev.filter(mq => !(mq.sectionIndex === currentSectionIndex && mq.questionId === questionId))
        );
      }

      return newAnswers;
    });
  };

  // Mark question handler
  const handleMark = (questionId: number) => {
    const isMarked = markedQuestions.some(mq =>
      mq.sectionIndex === currentSectionIndex && mq.questionId === questionId
    );

    setMarkedQuestions(prev =>
      isMarked
        ? prev.filter(mq => !(mq.sectionIndex === currentSectionIndex && mq.questionId === questionId))
        : [...prev, { sectionIndex: currentSectionIndex, questionId }]
    );
  };

  // Navigation handlers
  const handleNextQuestion = () => {
    if (currentIndex < currentQuestions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else if (selectedTest?.sections && currentSectionIndex < selectedTest.sections.length - 1) {
      setCurrentSectionIndex(currentSectionIndex + 1);
      setCurrentIndex(0);
    } else {
      setShowSubmitOptions(true);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    } else if (selectedTest?.sections && currentSectionIndex > 0) {
      setCurrentSectionIndex(currentSectionIndex - 1);
      setCurrentIndex((selectedTest.sections[currentSectionIndex - 1].questions.length - 1));
    }
  };

  // Submit handler
  const handleSubmit = () => {
    if (!selectedTest) return;

    if (selectedTest.sections) {
      const unansweredSections = selectedTest.sections.filter((section, idx) => {
        const hasUnanswered = section.questions.some(q => answers[q.id] === undefined);
        const hasMarked = markedQuestions.some(mq => mq.sectionIndex === idx);
        return hasUnanswered || hasMarked;
      });

      if (unansweredSections.length > 0) {
        setMarkedWarningMessage(
          t('tabSwitchMessage', { 
            count: unansweredSections.length, 
            sections: unansweredSections.map(s => language === 'hindi' ? s.name : s.name).join(', ')
          })
        );
        setShowMarkedWarningModal(true);
        return;
      }
    }

    calculateScoreAndSubmit();
  };

  // End test handlers
  const confirmEndTest = () => {
    if (confirmationText === 'END') {
      calculateScoreAndSubmit();
      setShowEndTestModal(false);
      setConfirmationText('');
    }
  };

  const handleEndTest = () => {
    setSelectedTest(null);
    setTestStarted(false);
    setSelectedCourseId('');
    setSelectedCourseTitle('');
    setCurrentIndex(0);
    setCurrentSectionIndex(0);
    setAnswers({});
    setMarkedQuestions([]);
    setIsSubmitted(false);
    setTotalMarks(0);
    setMaxPossibleMarks(0);
    setTabSwitchCount(0);
  };

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Start test handler
  const startTest = (courseId: string, courseTitle: string) => {
    const test = getTestByCourseId(courseId);
    if (test) {
      setSelectedTest(test);
      setSelectedCourseTitle(courseTitle);
      setTimeLeft(test.duration);
      setTestStarted(false);
      setCurrentIndex(0);
      setCurrentSectionIndex(0);
      setAnswers({});
      setMarkedQuestions([]);
      setIsSubmitted(false);
      setTotalMarks(0);
      setMaxPossibleMarks(0);
      setTabSwitchCount(0);
    }
  };

  // Select course handler
  const selectCourse = (courseId: string, courseTitle: string) => {
    setSelectedCourseId(courseId);
    setSelectedCourseTitle(courseTitle);
    setShowCourseDropdown(false);
  };

  // Container styling - modified for test mode
  const containerStyle = testStarted && !isSubmitted
    ? `fixed inset-1 overflow-auto mt-2 rounded-lg shadow-lg transition-colors duration-300 ${
        localTheme === 'dark' ? 'bg-dark-800 text-white' : 'bg-white text-gray-800'
      }`
    : `mx-auto p-7 mt-20 rounded-lg shadow-lg transition-colors duration-300 ${
        localTheme === 'dark' ? 'bg-dark-800 text-white' : 'bg-white text-gray-800'
      } max-w-7xl my-8`;

  // Section tabs component
  const SectionTabs = () => {
    if (!selectedTest?.sections) return null;

    return (
      <div className={`flex mb-6 rounded-lg overflow-hidden ${
        localTheme === 'dark' ? 'bg-dark-700' : 'bg-gray-100'
      }`}>
        {selectedTest.sections.map((section, index) => {
          const hasUnanswered = section.questions.some(q => answers[q.id] === undefined);
          const hasMarked = markedQuestions.some(mq => mq.sectionIndex === index);
          const isCurrent = currentSectionIndex === index;

          return (
            <button
              key={index}
              onClick={() => {
                setCurrentSectionIndex(index);
                setCurrentIndex(0);
              }}
              className={`flex-1 py-3 px-4 text-center font-medium transition-colors relative ${
                isCurrent
                  ? localTheme === 'dark'
                    ? 'bg-green-600 text-white'
                    : 'bg-green-600 text-white'
                  : localTheme === 'dark'
                    ? 'hover:bg-dark-600'
                    : 'hover:bg-gray-200'
              }`}
            >
              <div className="flex items-center justify-center">
                <span>{section.name}</span>
                {(hasUnanswered || hasMarked) && (
                  <span className="ml-2 w-2 h-2 rounded-full bg-red-500"></span>
                )}
              </div>
              {isCurrent && (
                <div className={`absolute bottom-0 left-0 right-0 h-1 ${
                  localTheme === 'dark' ? 'bg-yellow-400' : 'bg-yellow-500'
                }`}></div>
              )}
            </button>
          );
        })}
      </div>
    );
  };

  const QuestionNavigator = () => {
    if (!selectedTest) return null;

    const questionsToShow = selectedTest.sections
      ? selectedTest.sections[currentSectionIndex]?.questions || []
      : selectedTest.questions || [];

    return (
      <div className="mt-4">
        <h4 className="text-sm font-medium mb-3">{t('questions')}</h4>
        <div className="flex flex-wrap gap-2">
          {questionsToShow.map((q, index) => (
            <button
              key={q.id}
              onClick={() => setCurrentIndex(index)}
              className={`w-8 h-8 rounded flex items-center justify-center text-sm border ${
                currentIndex === index
                  ? localTheme === 'dark'
                    ? 'bg-primary-600 text-white border-primary-700'
                    : 'bg-blue-600 text-white border-blue-700'
                  : answers[q.id] !== undefined
                    ? localTheme === 'dark'
                      ? 'bg-green-800/60 text-green-100 border-green-700'
                      : 'bg-green-600 text-white border-green-700'
                    : markedQuestions.some(mq =>
                      mq.sectionIndex === currentSectionIndex && mq.questionId === q.id
                    )
                      ? localTheme === 'dark'
                        ? 'bg-yellow-900/30 text-yellow-300 border-yellow-700'
                        : 'bg-yellow-100 text-yellow-800 border-yellow-400'
                      : localTheme === 'dark'
                        ? 'bg-dark-700 text-gray-400 border-gray-600'
                        : 'bg-gray-100 text-gray-700 border-gray-300'
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>
    );
  };

  // End test modal component
  const EndTestModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`p-6 rounded-lg shadow-xl max-w-md w-full mx-4 ${
        localTheme === 'dark' ? 'bg-dark-800' : 'bg-white'
      }`}>
        <h3 className="text-xl font-bold mb-4">{t('endTestConfirmation')}</h3>
        <p className="mb-4">{t('endTestMessage')}</p>
        <p className="mb-2">{t('confirmEnd')}</p>
        <input
          type="text"
          value={confirmationText}
          onChange={(e) => setConfirmationText(e.target.value)}
          className={`w-full p-3 border rounded-lg mb-4 ${
            localTheme === 'dark' ? 'bg-dark-700 border-dark-600' : 'bg-white border-gray-300'
          }`}
          placeholder={t('confirmEnd')}
          autoFocus
        />
        {confirmationText && confirmationText !== 'END' && (
          <p className="text-red-500 mb-4">{t('confirmEnd')}</p>
        )}
        <div className="flex gap-4">
          <button
            onClick={() => {
              setShowEndTestModal(false);
              setConfirmationText('');
            }}
            className={`flex-1 py-2 rounded-lg font-medium ${
              localTheme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            {t('cancel')}
          </button>
          <button
            onClick={confirmEndTest}
            disabled={confirmationText !== 'END'}
            className={`flex-1 py-2 rounded-lg font-medium text-white ${
              confirmationText === 'END'
                ? localTheme === 'dark'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-red-500 hover:bg-red-600'
                : localTheme === 'dark'
                  ? 'bg-red-900/50 cursor-not-allowed'
                  : 'bg-red-300 cursor-not-allowed'
            }`}
          >
            {t('confirmEndTest')}
          </button>
        </div>
      </div>
    </div>
  );

  // Marked warning modal component
  const MarkedWarningModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`p-6 rounded-lg shadow-xl max-w-md w-full mx-4 ${
        localTheme === 'dark' ? 'bg-dark-800' : 'bg-white'
      }`}>
        <h3 className="text-xl font-bold mb-4">{t('completeAllQuestions')}</h3>
        <p className="mb-6">{markedWarningMessage}</p>
        <div className="flex gap-4">
          <button
            onClick={() => setShowMarkedWarningModal(false)}
            className={`flex-1 py-2 rounded-lg font-medium ${
              localTheme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            {t('continueTest')}
          </button>
          <button
            onClick={() => {
              if (selectedTest?.sections && markedQuestions.length > 0) {
                const firstMarked = markedQuestions[0];
                if (firstMarked) {
                  setCurrentSectionIndex(firstMarked.sectionIndex);
                  const questionIndex = selectedTest.sections[firstMarked.sectionIndex].questions
                    .findIndex(q => q.id === firstMarked.questionId);
                  setCurrentIndex(questionIndex);
                }
              }
              setShowMarkedWarningModal(false);
            }}
            className={`flex-1 py-2 rounded-lg font-medium text-white ${
              localTheme === 'dark'
                ? 'bg-primary-600 hover:bg-primary-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {t('goToMarked')}
          </button>
        </div>
      </div>
    </div>
  );

  // Tab switch warning modal component
  const TabSwitchWarningModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`p-6 rounded-lg shadow-xl max-w-md w-full mx-4 ${
        localTheme === 'dark' ? 'bg-dark-800' : 'bg-white'
      }`}>
        <h3 className="text-xl font-bold mb-4">{t('tabSwitchWarning')}</h3>
        <p className="mb-4">
          {t('tabSwitchMessage', { 
            count: tabSwitchCount, 
            remaining: MAX_TAB_SWITCHES - tabSwitchCount 
          })}
        </p>
        <p className="mb-6 text-red-500">
          {t('tabSwitchWarningDetail')}
        </p>
        <button
          onClick={() => setShowTabSwitchWarning(false)}
          className={`w-full py-2 rounded-lg font-medium text-white ${
            localTheme === 'dark'
              ? 'bg-primary-600 hover:bg-primary-700'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {t('understand')}
        </button>
      </div>
    </div>
  );

  // Loading state
  if (!selectedTest && !testStarted && !isSubmitted) {
    return (
      <div className={containerStyle}>
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold">{t('practiceTests')}</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLanguage(prev => prev === 'english' ? 'hindi' : 'english')}
              className={`px-3 py-1 rounded-md text-sm ${
                localTheme === 'dark' ? 'bg-dark-700 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              {language === 'english' ? 'हिंदी' : 'English'}
            </button>
            <button
              onClick={() => setLocalTheme(prev => prev === 'light' ? 'dark' : 'light')}
              className={`p-2 rounded-full ${
                localTheme === 'dark' ? 'bg-dark-700 text-yellow-300' : 'bg-gray-100 text-gray-700'
              }`}
            >
              {localTheme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">{t('selectCourse')}</label>
          <div className="relative course-dropdown-container">
            <button
              onClick={() => setShowCourseDropdown(!showCourseDropdown)}
              className={`w-full flex justify-between items-center p-3 border rounded-lg ${
                localTheme === 'dark' ? 'bg-dark-700 border-dark-600' : 'bg-white border-gray-300'
              }`}
            >
              <span>{selectedCourseTitle || t('selectCourse')}</span>
              <ChevronDown className={`h-5 w-5 transition-transform ${
                showCourseDropdown ? 'transform rotate-180' : ''
              }`} />
            </button>

            {showCourseDropdown && (
              <div className={`absolute z-10 w-full mt-1 rounded-lg shadow-lg max-h-96 overflow-y-auto ${
                localTheme === 'dark' ? 'bg-dark-700 border-dark-600' : 'bg-white border border-gray-300'
              }`}>
                {allCourses.map((category) => (
                  <div key={category.category}>
                    <div className={`px-3 py-2 font-medium sticky top-0 ${
                      localTheme === 'dark' ? 'bg-dark-800 text-gray-300' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {category.category}
                    </div>
                    {category.courses.map((course) => (
                      <div
                        key={course.id}
                        onClick={() => selectCourse(course.id, course.title)}
                        className={`px-6 py-2 cursor-pointer hover:${
                          localTheme === 'dark' ? 'bg-dark-600' : 'bg-gray-100'
                        } ${
                          selectedCourseId === course.id
                            ? localTheme === 'dark'
                              ? 'bg-green-900/30'
                              : 'bg-green-50'
                            : ''
                        }`}
                      >
                        {course.title}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {selectedCourseId && (
          <button
            onClick={() => startTest(selectedCourseId, selectedCourseTitle)}
            className={`w-full py-3 rounded-lg font-medium transition-colors ${
              localTheme === 'dark'
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {t('startTest')}
          </button>
        )}
      </div>
    );
  }

  // Test instructions screen
  if (selectedTest && !testStarted) {
    return (
      <div className={containerStyle}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">{selectedTest.title}</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLanguage(prev => prev === 'english' ? 'hindi' : 'english')}
              className={`px-3 py-1 rounded-md text-sm ${
                localTheme === 'dark' ? 'bg-dark-700 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              {language === 'english' ? 'हिंदी' : 'English'}
            </button>
            <button
              onClick={() => setLocalTheme(prev => prev === 'light' ? 'dark' : 'light')}
              className={`p-2 rounded-full ${
                localTheme === 'dark' ? 'bg-dark-700 text-yellow-300' : 'bg-gray-100 text-gray-700'
              }`}
            >
              {localTheme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </div>

        <div className={`mb-8 p-6 rounded-lg ${
          localTheme === 'dark' ? 'bg-dark-700' : 'bg-gray-50'
        }`}>
          <h3 className="text-lg font-semibold mb-4">{t('testInstructions')}</h3>
          <ul className="space-y-3">
            {(selectedTest.instructions || [
              'Read each question carefully before answering.',
              'You cannot go back to previous questions once answered.',
              'The test will auto-submit when time expires.'
            ]).map((instruction, index) => (
              <li key={index} className="flex items-start">
                <span className="mr-2">•</span>
                <span>{instruction}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => setTestStarted(true)}
            className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
              localTheme === 'dark'
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {t('startTest')}
          </button>
          <button
            onClick={handleEndTest}
            className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
              localTheme === 'dark'
                ? 'bg-gray-700 hover:bg-gray-600'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
            }`}
          >
            {t('backToCourses')}
          </button>
        </div>
      </div>
    );
  }

  // Test results screen
  if (isSubmitted && selectedTest) {
    const answeredCount = Object.keys(answers).length;
    let totalQuestions = 0;

    if (selectedTest.sections) {
      selectedTest.sections.forEach(section => {
        totalQuestions += section.questions.length;
      });
    } else {
      totalQuestions = selectedTest.questions?.length || 0;
    }

    return (
      <div className={containerStyle}>
        <div className="text-center">
          {score >= selectedTest.passingScore ? (
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          ) : (
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          )}
          <h2 className="text-2xl font-bold mb-2">
            {score >= selectedTest.passingScore ? t('testPassed') : t('testCompleted')}
          </h2>
          <p className={`text-4xl font-bold mb-6 ${
            score >= selectedTest.passingScore ? 'text-green-500' : 'text-red-500'
          }`}>
            {score}%
          </p>

          {selectedTest.negativeMarking && (
            <div className={`mb-4 text-lg ${
              localTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}>
              <p>{t('marksObtained')}: {totalMarks}/{maxPossibleMarks}</p>
              <p>{t('markingSchemeDetail')}</p>
            </div>
          )}

          {selectedTest.passingScore && (
            <p className="mb-4">
              {t('passingScore')}: {selectedTest.passingScore}%
            </p>
          )}

          <div className={`grid grid-cols-2 gap-4 mb-8 ${
            localTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>
            <div className={`p-4 rounded-lg ${
              localTheme === 'dark' ? 'bg-dark-700' : 'bg-gray-100'
            }`}>
              <div className="text-xl font-bold">
                {formatNumber(answeredCount)}
              </div>
              <div className="text-sm">{t('answered')}</div>
            </div>
            <div className={`p-4 rounded-lg ${
              localTheme === 'dark' ? 'bg-dark-700' : 'bg-gray-100'
            }`}>
              <div className="text-xl font-bold">
                {formatNumber(markedQuestions.length)}
              </div>
              <div className="text-sm">{t('marked')}</div>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => {
                setTestStarted(false);
                setIsSubmitted(false);
                setCurrentIndex(0);
                setCurrentSectionIndex(0);
                setAnswers({});
                setMarkedQuestions([]);
                setTotalMarks(0);
                setMaxPossibleMarks(0);
                if (selectedTest) {
                  setTimeLeft(selectedTest.duration);
                }
              }}
              className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
                localTheme === 'dark'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {t('retakeTest')}
            </button>
            <button
              onClick={handleEndTest}
              className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
                localTheme === 'dark'
                  ? 'bg-gray-700 hover:bg-gray-600'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
              }`}
            >
              {t('backToCourses')}
            </button>
          </div>
        </div>
      </div>
    );
  }

if (!selectedTest) {
    // Course selection UI
    return (
      <div className={containerStyle}>
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-6">{t('practiceTests')}</h1>
          <p className="mb-8 text-lg text-gray-600 dark:text-gray-400">{t('selectCourse')}</p>
          <div className="relative inline-block text-left course-dropdown-container">
            <button
              onClick={() => setShowCourseDropdown(!showCourseDropdown)}
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 flex items-center"
            >
              {selectedCourseTitle || t('selectCourse')}
              <ChevronDown className="ml-2 h-5 w-5" />
            </button>
            {showCourseDropdown && (
              <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-72 rounded-md shadow-lg bg-white dark:bg-dark-700 ring-1 ring-black ring-opacity-5 z-10">
                <div className="py-1">
                  {allCourses.flatMap(category => category.courses).map(course => (
                    <button
                      key={course.id}
                      onClick={() => selectCourse(course.id, course.title)}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-dark-600"
                    >
                      {course.title}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!testStarted) {
    // Test instructions UI
    return (
      <div className={containerStyle}>
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">{selectedTest.title}</h1>
          <h2 className="text-xl font-semibold mb-6">{t('testInstructions')}</h2>
          <div className="text-left inline-block bg-gray-100 dark:bg-dark-700 p-6 rounded-lg max-w-md mx-auto">
            <p className="mb-2">- {t('questions')}: {selectedTest.questions?.length || selectedTest.sections?.reduce((acc, s) => acc + s.questions.length, 0)}</p>
            <p className="mb-2">- {t('markingScheme')}: +2 for correct, -{selectedTest.negativeMarking || 0} for wrong</p>
            <p className="mb-4">- {t('passingScore')}: {selectedTest.passingScore}%</p>
            <button
              onClick={() => setTestStarted(true)}
              className="w-full py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700"
            >
              {t('startTest')}
            </button>
            <button
              onClick={handleEndTest}
              className="w-full mt-2 py-2 text-sm text-gray-600 dark:text-gray-400 hover:underline"
            >
              {t('backToCourses')}
            </button>
          </div>
        </div>
      </div>
    );
  }

   // Test in progress screen
return (
  <div className={containerStyle}>
    <div className="flex justify-between items-center mb-4">
      <div>
        <h3 className="text-xl font-bold">{selectedTest.title}</h3>
        <p className={`text-sm ${
          localTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
        }`}>
          {t('question')} {currentIndex + 1} {t('of')} {currentQuestions.length}
          {selectedTest.sections && ` (${selectedTest.sections[currentSectionIndex].name})`}
        </p>
      </div>

      <div className="flex items-center space-x-4">
        <button
          onClick={() => setLanguage(prev => prev === 'english' ? 'hindi' : 'english')}
          className={`px-3 py-1 rounded-md text-sm ${
            localTheme === 'dark' ? 'bg-dark-700 text-white' : 'bg-gray-100 text-gray-700'
          }`}
        >
          {language === 'english' ? 'हिंदी' : 'English'}
        </button>
        <button
          onClick={() => setLocalTheme(prev => prev === 'light' ? 'dark' : 'light')}
          className={`p-2 rounded-full ${
            localTheme === 'dark' ? 'bg-dark-700 text-yellow-300' : 'bg-gray-100 text-gray-700'
          }`}
        >
          {localTheme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <div className={`flex items-center px-3 py-2 rounded-lg ${
          localTheme === 'dark' ? 'bg-dark-700 text-red-400' : 'bg-red-100 text-red-600'
        }`}>
          <Clock className="h-5 w-5 mr-2" />
          <span className="font-medium">{formatTime(timeLeft)}</span>
        </div>
      </div>
    </div>

    {selectedTest.sections && <SectionTabs />}

    <div className="flex flex-col md:flex-row gap-6">
      {/* Left column - Question and options */}
      <div className={`flex-1 p-6 rounded-lg ${
        localTheme === 'dark' ? 'bg-dark-700' : 'bg-gray-50'
      }`}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium">
            {language === 'hindi' && currentQuestion.hindiQuestion 
              ? currentQuestion.hindiQuestion 
              : currentQuestion.question}
          </h3>
          <button
            onClick={() => handleMark(currentQuestion.id)}
            className={`flex items-center px-3 py-1 rounded-full ${
              markedQuestions.some(mq =>
                mq.sectionIndex === currentSectionIndex && mq.questionId === currentQuestion.id
              )
                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                : localTheme === 'dark'
                  ? 'text-gray-400 hover:text-gray-300'
                  : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Flag className="h-4 w-4 mr-1" />
            {markedQuestions.some(mq =>
              mq.sectionIndex === currentSectionIndex && mq.questionId === currentQuestion.id
            ) ? t('marked') : t('mark')}
          </button>
        </div>

        <div className="space-y-3">
          {currentQuestion.options.map((option, index) => (
            <div
              key={index}
              onClick={() => handleAnswer(currentQuestion.id, index)}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                answers[currentQuestion.id] === index
                  ? localTheme === 'dark'
                    ? 'border-green-500 bg-green-900/30'
                    : 'border-green-500 bg-green-50'
                  : localTheme === 'dark'
                    ? 'border-dark-600 hover:bg-dark-600'
                    : 'border-gray-200 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center">
                <div className={`w-6 h-6 rounded-full border mr-3 flex items-center justify-center ${
                  answers[currentQuestion.id] === index
                    ? 'border-green-500 bg-green-500 text-white'
                    : localTheme === 'dark'
                      ? 'border-gray-500'
                      : 'border-gray-300'
                }`}>
                  {String.fromCharCode(65 + index)}
                </div>
                <span>
                  {language === 'hindi' && currentQuestion.hindiOptions?.[index] 
                    ? currentQuestion.hindiOptions[index] 
                    : option}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-between gap-4 mt-6">
          <button
            onClick={handlePreviousQuestion}
            disabled={currentIndex === 0 && (!selectedTest?.sections || currentSectionIndex === 0)}
            className={`px-4 py-2 rounded-lg font-medium w-32 ${
              localTheme === 'dark'
                ? 'bg-dark-700 text-white disabled:opacity-50'
                : 'bg-gray-100 text-gray-700 disabled:opacity-50'
            }`}
          >
            {t('previous')}
          </button>

          <button
            onClick={handleNextQuestion}
            className={`px-4 py-2 rounded-lg font-medium w-32 ${
              localTheme === 'dark'
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {currentIndex < currentQuestions.length - 1 ? t('next') : 
             selectedTest?.sections && currentSectionIndex < selectedTest.sections.length - 1 ? t('nextSection') : t('review')}
          </button>

          <div className="relative submit-options-container w-32">
            <button
              onClick={() => setShowSubmitOptions(!showSubmitOptions)}
              className={`px-4 py-2 rounded-lg font-medium flex items-center justify-center w-full ${
                localTheme === 'dark'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {t('submitEnd')} <ChevronDown className="inline ml-1 h-4 w-4" />
            </button>

            {showSubmitOptions && (
              <div className={`absolute right-0 mt-1 w-48 rounded-md shadow-lg z-10 ${
                localTheme === 'dark' ? 'bg-dark-700' : 'bg-white'
              }`}>
                <div className="py-1">
                  <button
                    onClick={() => {
                      setShowSubmitOptions(false);
                      handleSubmit();
                    }}
                    className={`block w-full text-left px-4 py-2 text-sm ${
                      localTheme === 'dark' ? 'text-white hover:bg-dark-600' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {t('submitTest')}
                  </button>
                  <button
                    onClick={() => {
                      setShowSubmitOptions(false);
                      setShowEndTestModal(true);
                    }}
                    className={`block w-full text-left px-4 py-2 text-sm ${
                      localTheme === 'dark' ? 'text-white hover:bg-dark-600' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {t('endTest')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right column - Question navigator and other controls */}
      <div className="w-full md:w-64">
        <div className={`p-4 rounded-lg sticky top-4 ${
          localTheme === 'dark' ? 'bg-dark-700' : 'bg-gray-100'
        }`}>
          <QuestionNavigator />
        </div>
      </div>
    </div>

    {/* Modals */}
    {showEndTestModal && <EndTestModal />}
    {showMarkedWarningModal && <MarkedWarningModal />}
    {showTabSwitchWarning && <TabSwitchWarningModal />}
  </div>
  );
};

export default TestConductor;
