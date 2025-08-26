import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../contexts/AuthContext';
import { databases } from '../../../../lib/appwrite';
import { ID } from 'appwrite';

// Types
interface Option {
  id: string;
  text: string;
}

interface Question {
  id: string;
  text: string;
  options: Option[];
  correctAnswer: string;
  explanation?: string;
  marks: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  category?: string;
}

interface Section {
  id: string;
  name: string;
  questions: Question[];
  totalMarks: number;
  passingMarks: number;
}

interface Test {
  id: string;
  title: string;
  description?: string;
  instructions: string[];
  duration: number;
  totalQuestions: number;
  passingScore: number;
  negativeMarking: boolean;
  negativeMarksPerWrongAnswer: number;
  sections?: Section[];
  questions?: Question[];
  totalMarks: number;
  passingMarks: number;
}

interface TestResults {
  score: number;
  totalMarks: number;
  correctAnswers: number;
  incorrectAnswers: number;
  unanswered: number;
  timeSpent: number;
  answers: Array<{
    questionId: string;
    selectedOption: string | null;
    isCorrect: boolean;
    timeSpent: number;
    markedForReview: boolean;
  }>;
}

// Import test data loading utility
import { loadTestData } from '../utils/testLoader';
  
  const MOCK_TEST: Test = {
    id: 'test-1',
    title: 'Sample Test',
    description: 'This is a sample test description',
    instructions: [
      'Read each question carefully',
      'Select the best answer',
      'You can mark questions for review',
      'Time limit: 60 minutes'
    ],
    duration: 3600, // 1 hour in seconds
    totalQuestions: 1,
    passingScore: 70,
    negativeMarking: false,
    negativeMarksPerWrongAnswer: 0,
    totalMarks: 100,
    passingMarks: 70,
    sections: [
      {
        id: 'section-1',
        name: 'General Knowledge',
        questions: [
          {
            id: 'q1',
            text: 'What is the capital of France?',
            options: [
              { id: 'a', text: 'London' },
              { id: 'b', text: 'Paris' },
              { id: 'c', text: 'Berlin' },
              { id: 'd', text: 'Madrid' }
            ],
            correctAnswer: 'b',
            marks: 20,
            explanation: 'Paris is the capital of France.',
            difficulty: 'easy',
            category: 'Geography'
          }
        ],
        totalMarks: 20,
        passingMarks: 10
      }
    ]
  };

export const useTest = (testId: string) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Test state
  const [test, setTest] = useState<Test | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Test progress
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [markedQuestions, setMarkedQuestions] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [testSubmitted, setTestSubmitted] = useState(false);
  const [results, setResults] = useState<TestResults | null>(null);
  
  // UI state
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showTabSwitchWarning, setShowTabSwitchWarning] = useState(false);
  
  // Get current question
  const currentQuestion = useMemo(() => {
    if (!test) return null;
    
    if (test.sections) {
      return test.sections[currentSectionIndex]?.questions?.[currentQuestionIndex] || null;
    }
    
    return test.questions?.[currentQuestionIndex] || null;
  }, [test, currentSectionIndex, currentQuestionIndex]);
  
  // Get total questions
  const totalQuestions = useMemo(() => {
    if (!test) return 0;
    
    if (test.sections) {
      return test.sections.reduce(
        (total, section) => total + (section.questions?.length || 0),
        0
      );
    }
    
    return test.questions?.length || 0;
  }, [test]);
  
  // Calculate progress
  const progress = useMemo(() => {
    return totalQuestions > 0 ? (Object.keys(answers).length / totalQuestions) * 100 : 0;
  }, [answers, totalQuestions]);
  
  // Load test data
  useEffect(() => {
    const loadTest = async () => {
      try {
        setLoading(true);
        
        // Load test data from file
        const testData = loadTestData(testId);
        
        if (testData) {
          setTest(testData);
          setTimeLeft(testData.duration);
        } else {
          throw new Error('Test not found');
        }
      } catch (err) {
        console.error('Error loading test:', err);
        setError(err instanceof Error ? err : new Error('Failed to load test'));
      } finally {
        setLoading(false);
      }
    };
    
    loadTest();
  }, [testId]);
  
  // Timer effect
  useEffect(() => {
    if (!test || testSubmitted) return;
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [test, testSubmitted]);
  
  // Tab switch detection
  useEffect(() => {
    if (!test || testSubmitted) return;
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        const newCount = tabSwitchCount + 1;
        setTabSwitchCount(newCount);
        
        if (test.negativeMarking && newCount >= 3) {
          setShowTabSwitchWarning(true);
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [test, testSubmitted, tabSwitchCount]);
  
  // Navigation handlers
  const goToNextQuestion = useCallback(() => {
    if (!test) return;
    
    if (test.sections) {
      const currentSection = test.sections[currentSectionIndex];
      if (currentQuestionIndex < currentSection.questions.length - 1) {
        setCurrentQuestionIndex((prev) => prev + 1);
      } else if (currentSectionIndex < test.sections.length - 1) {
        setCurrentSectionIndex((prev) => prev + 1);
        setCurrentQuestionIndex(0);
      }
    } else if (currentQuestionIndex < (test.questions?.length || 0) - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  }, [test, currentSectionIndex, currentQuestionIndex]);
  
  const goToPreviousQuestion = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    } else if (currentSectionIndex > 0 && test?.sections) {
      const prevSection = test.sections[currentSectionIndex - 1];
      setCurrentSectionIndex((prev) => prev - 1);
      setCurrentQuestionIndex(prevSection.questions.length - 1);
    }
  }, [currentQuestionIndex, currentSectionIndex, test]);
  
  // Answer handlers
  const selectAnswer = useCallback((questionId: string, optionId: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
    
    // Auto-advance to next question if enabled
    // goToNextQuestion();
  }, []);
  
  const toggleMarkForReview = useCallback((questionId: string) => {
    setMarkedQuestions((prev) =>
      prev.includes(questionId)
        ? prev.filter((id) => id !== questionId)
        : [...prev, questionId]
    );
  }, []);
  
  // Test submission
  const calculateScore = useCallback((): TestResults => {
    if (!test) {
      throw new Error('Test not loaded');
    }
    
    let correct = 0;
    let incorrect = 0;
    let totalMarks = 0;
    let obtainedMarks = 0;
    
    const answerResults: TestResults['answers'] = [];
    
    const processQuestion = (question: Question) => {
      const selectedOption = answers[question.id];
      const isCorrect = selectedOption === question.correctAnswer;
      const isMarked = markedQuestions.includes(question.id);
      
      totalMarks += question.marks;
      
      if (isCorrect) {
        correct++;
        obtainedMarks += question.marks;
      } else if (selectedOption) {
        incorrect++;
        if (test.negativeMarking) {
          obtainedMarks -= test.negativeMarksPerWrongAnswer;
        }
      }
      
      answerResults.push({
        questionId: question.id,
        selectedOption,
        isCorrect,
        timeSpent: 0, // Track time spent on each question
        markedForReview: isMarked,
      });
    };
    
    if (test.sections) {
      test.sections.forEach((section) => {
        section.questions.forEach(processQuestion);
      });
    } else if (test.questions) {
      test.questions.forEach(processQuestion);
    }
    
    const score = totalMarks > 0 ? (obtainedMarks / totalMarks) * 100 : 0;
    
    return {
      score,
      totalMarks: obtainedMarks,
      correctAnswers: correct,
      incorrectAnswers: incorrect,
      unanswered: totalQuestions - (correct + incorrect),
      timeSpent: test.duration - timeLeft,
      answers: answerResults,
    };
  }, [test, answers, markedQuestions, totalQuestions, timeLeft]);
  
  const handleSubmitTest = useCallback(async () => {
    if (!test || testSubmitted) return;
    
    try {
      const testResults = calculateScore();
      setResults(testResults);
      setTestSubmitted(true);
      
      // Save results to database if user is authenticated
      if (user) {
        await databases.createDocument(
          'test_results',
          ID.unique(),
          {
            userId: user.$id,
            testId: test.id,
            score: testResults.score,
            totalMarks: testResults.totalMarks,
            correctAnswers: testResults.correctAnswers,
            incorrectAnswers: testResults.incorrectAnswers,
            timeSpent: testResults.timeSpent,
            answers: JSON.stringify(testResults.answers),
          }
        );
      }
    } catch (err) {
      console.error('Error submitting test:', err);
      // Handle error
    }
  }, [test, testSubmitted, calculateScore, user]);
  
  // Reset test
  const resetTest = useCallback(() => {
    setCurrentQuestionIndex(0);
    setCurrentSectionIndex(0);
    setAnswers({});
    setMarkedQuestions([]);
    setTestSubmitted(false);
    setResults(null);
    setTimeLeft(test?.duration || 0);
    setTabSwitchCount(0);
    setShowTabSwitchWarning(false);
  }, [test]);
  
  return {
    // State
    test,
    loading,
    error,
    currentQuestion,
    currentQuestionIndex,
    currentSectionIndex,
    totalQuestions,
    answers,
    markedQuestions,
    timeLeft,
    testSubmitted,
    results,
    progress,
    showConfirmation,
    tabSwitchCount,
    showTabSwitchWarning,
    
    // Actions
    selectAnswer,
    toggleMarkForReview,
    goToNextQuestion,
    goToPreviousQuestion,
    handleSubmitTest,
    resetTest,
    setShowConfirmation,
    setShowTabSwitchWarning,
  };
};

export default useTest;