import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, ReactNode } from 'react';
import { TestData, TestSection, TestQuestion } from '@/types/test';
import { loadTestData } from '../utils/testLoader';

type AnswerState = {
  answer: number | null;
  markedForReview: boolean;
  skipped: boolean;
};

type TestContextType = {
  test: TestData | null;
  loading: boolean;
  error: Error | null;
  setTest: (test: TestData | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: Error | null) => void;
  currentSectionIndex: number;
  currentQuestionIndex: number;
  userAnswers: Record<string, AnswerState>;
  setCurrentSectionIndex: (index: number) => void;
  setCurrentQuestionIndex: (index: number) => void;
  setUserAnswer: (sectionId: string, questionId: string, answer: number | null) => void;
  toggleMarkForReview: (sectionId: string, questionId: string) => void;
  getCurrentSection: () => TestSection | undefined;
  getCurrentQuestion: () => TestQuestion | undefined;
  getQuestionState: (sectionId: string, questionId: string) => AnswerState;
  getSectionQuestions: (sectionId: string) => TestQuestion[];
  getTotalQuestions: () => number;
  getAnsweredCount: () => number;
  getMarkedForReviewCount: () => number;
  moveToNextQuestion: () => void;
  moveToPreviousQuestion: () => void;
  moveToQuestion: (sectionIndex: number, questionIndex: number) => void;
};

const TestContext = createContext<TestContextType | undefined>(undefined);

type TestProviderProps = {
  testId: string;
  children: ReactNode;
};

export const TestProvider: React.FC<TestProviderProps> = ({ testId, children }) => {
  const [test, setTest] = useState<TestData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, AnswerState>>({});
  
  // Track if we've already loaded the test
  const hasLoaded = useRef<Record<string, boolean>>({});
  const isLoading = useRef<boolean>(false);
  
  // Load test data when testId changes
  useEffect(() => {
    // Skip if no testId, already loaded, or currently loading
    if (!testId || hasLoaded.current[testId] || isLoading.current) {
      console.log('TestContext: Skipping test load -', { 
        testId, 
        hasLoaded: hasLoaded.current[testId],
        isLoading: isLoading.current 
      });
      return;
    }
    
    console.log('TestContext: Starting test load for testId:', testId);
    let isMounted = true;
    isLoading.current = true;
    
    const loadTest = async () => {
      try {
        console.log('TestContext: Setting loading to true');
        setLoading(true);
        
        // First try to load from local test files
        console.log('TestContext: Attempting to load test data locally');
        const testData = loadTestData(testId);
        
        if (testData) {
          console.log('TestContext: Successfully loaded test data locally:', testData);
          if (isMounted) {
            console.log('TestContext: Setting test data from local file');
            setTest(testData);
            hasLoaded.current[testId] = true;
            setLoading(false);
            isLoading.current = false;
            console.log('TestContext: Test data set, loading complete');
            return;
          }
        } else {
          console.log('TestContext: No local test data found, falling back to API');
        }
        
        // Fallback to API if local load fails
        try {
          console.log('TestContext: Attempting to load test data from API');
          const response = await fetch(`/api/tests/${testId}`);
          if (!response.ok) {
            throw new Error(`Failed to load test: ${response.statusText}`);
          }
          const apiTestData = await response.json();
          console.log('TestContext: Successfully loaded test data from API');
          
          if (isMounted) {
            console.log('TestContext: Setting test data from API');
            setTest(apiTestData);
            hasLoaded.current[testId] = true;
            console.log('TestContext: API test data set');
          }
        } catch (apiError) {
          console.error('TestContext: API load failed:', apiError);
          throw apiError; // Re-throw to be caught by the outer catch
        }
      } catch (err) {
        console.error('TestContext: Error in test loading process:', err);
        if (isMounted) {
          const error = err instanceof Error ? err : new Error('Failed to load test');
          console.error('TestContext: Setting error state:', error);
          setError(error);
        }
      } finally {
        if (isMounted) {
          console.log('TestContext: Setting loading to false');
          setLoading(false);
          isLoading.current = false;
        }
      }
    };
    
    loadTest();
    
    return () => {
      console.log('TestContext: Cleanup - unmounting');
      isMounted = false;
      isLoading.current = false;
    };
  }, [testId, hasLoaded]);

  // Get the current section
  const getCurrentSection = useCallback((): TestSection | undefined => {
    if (!test?.sections || test.sections.length === 0) return undefined;
    return test.sections[currentSectionIndex];
  }, [test, currentSectionIndex]);

  // Get the current question
  const getCurrentQuestion = useCallback((): TestQuestion | undefined => {
    const section = getCurrentSection();
    if (!section || !section.questions || section.questions.length === 0) return undefined;
    return section.questions[currentQuestionIndex];
  }, [getCurrentSection, currentQuestionIndex]);

  // Get questions for a specific section
  const getSectionQuestions = useCallback((sectionId: string): TestQuestion[] => {
    if (!test?.sections) return [];
    const section = test.sections.find(s => s.id === sectionId);
    return section?.questions || [];
  }, [test]);

  // Get the state of a specific question
  const getQuestionState = useCallback((sectionId: string, questionId: string): AnswerState => {
    const key = `${sectionId}:${questionId}`;
    return userAnswers[key] || { answer: null, markedForReview: false, skipped: false };
  }, [userAnswers]);

  // Set the user's answer for a question
  const setUserAnswer = useCallback((sectionId: string, questionId: string, answer: number | null) => {
    const key = `${sectionId}:${questionId}`;
    setUserAnswers(prev => ({
      ...prev,
      [key]: {
        ...(prev[key] || { markedForReview: false, skipped: false }),
        answer
      }
    }));
  }, []);

  // Toggle mark for review
  const toggleMarkForReview = useCallback((sectionId: string, questionId: string) => {
    const key = `${sectionId}:${questionId}`;
    setUserAnswers(prev => ({
      ...prev,
      [key]: {
        ...(prev[key] || { answer: null, skipped: false }),
        markedForReview: !prev[key]?.markedForReview
      }
    }));
  }, []);

  // Get total number of questions across all sections
  const getTotalQuestions = useCallback((): number => {
    if (!test?.sections) return 0;
    return test.sections.reduce((total, section) => total + (section.questions?.length || 0), 0);
  }, [test]);

  // Get count of answered questions
  const getAnsweredCount = useCallback((): number => {
    return Object.values(userAnswers).filter(answer => answer.answer !== null).length;
  }, [userAnswers]);

  // Get count of questions marked for review
  const getMarkedForReviewCount = useCallback((): number => {
    return Object.values(userAnswers).filter(answer => answer.markedForReview).length;
  }, [userAnswers]);

  // Navigation functions
  const moveToNextQuestion = useCallback(() => {
    if (!test?.sections) return;
    
    const currentSection = test.sections[currentSectionIndex];
    if (!currentSection?.questions) return;
    
    if (currentQuestionIndex < currentSection.questions.length - 1) {
      // Move to next question in current section
      setCurrentQuestionIndex(prev => prev + 1);
    } else if (currentSectionIndex < test.sections.length - 1) {
      // Move to first question of next section
      setCurrentSectionIndex(prev => prev + 1);
      setCurrentQuestionIndex(0);
    }
  }, [test, currentSectionIndex, currentQuestionIndex]);

  const moveToPreviousQuestion = useCallback(() => {
    if (currentQuestionIndex > 0) {
      // Move to previous question in current section
      setCurrentQuestionIndex(prev => prev - 1);
    } else if (currentSectionIndex > 0) {
      // Move to last question of previous section
      setCurrentSectionIndex(prev => prev - 1);
      const prevSection = test?.sections?.[currentSectionIndex - 1];
      setCurrentQuestionIndex(prevSection?.questions?.length ? prevSection.questions.length - 1 : 0);
    }
  }, [currentSectionIndex, currentQuestionIndex, test]);

  const moveToQuestion = useCallback((sectionIndex: number, questionIndex: number) => {
    if (!test?.sections || sectionIndex < 0 || sectionIndex >= test.sections.length) return;
    
    const targetSection = test.sections[sectionIndex];
    if (questionIndex < 0 || !targetSection.questions || questionIndex >= targetSection.questions.length) return;
    
    setCurrentSectionIndex(sectionIndex);
    setCurrentQuestionIndex(questionIndex);
  }, [test]);

  // Context value
  const contextValue = useMemo<TestContextType>(
    () => ({
      test,
      loading,
      error,
      setTest,
      setLoading,
      setError,
      currentSectionIndex,
      currentQuestionIndex,
      userAnswers,
      setCurrentSectionIndex,
      setCurrentQuestionIndex,
      setUserAnswer,
      toggleMarkForReview,
      getCurrentSection,
      getCurrentQuestion,
      getQuestionState,
      getSectionQuestions,
      getTotalQuestions,
      getAnsweredCount,
      getMarkedForReviewCount,
      moveToNextQuestion,
      moveToPreviousQuestion,
      moveToQuestion,
    }),
    [
      test,
      loading,
      error,
      currentSectionIndex,
      currentQuestionIndex,
      userAnswers,
      setUserAnswer,
      toggleMarkForReview,
      getCurrentSection,
      getCurrentQuestion,
      getQuestionState,
      getSectionQuestions,
      getTotalQuestions,
      getAnsweredCount,
      getMarkedForReviewCount,
      moveToNextQuestion,
      moveToPreviousQuestion,
      moveToQuestion,
    ]
  );
  
  return (
    <TestContext.Provider value={contextValue}>
      {children}
    </TestContext.Provider>
  );
};

export const useTestContext = (): TestContextType => {
  const context = useContext(TestContext);
  if (context === undefined) {
    throw new Error('useTestContext must be used within a TestProvider');
  }
  return context;
};

export default TestContext;
