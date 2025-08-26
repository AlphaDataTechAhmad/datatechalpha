import { useState, useCallback, useMemo } from 'react';
import { Question, Section } from '../types';

interface AnswerState {
  selectedOption: string | null;
  isMarked: boolean;
  isBookmarked: boolean;
  isAnswered: boolean;
  isCorrect: boolean | null;
  timeSpent: number; // in seconds
  lastUpdated: number; // timestamp
}

interface TestState {
  answers: Record<string, AnswerState>;
  bookmarks: Set<string>;
  markedForReview: Set<string>;
  visitedQuestions: Set<string>;
  currentQuestionId: string | null;
  startTime: number | null;
  endTime: number | null;
  isSubmitted: boolean;
}

interface UseTestStateProps {
  sections?: Section[];
  questions?: Question[];
  onStateChange?: (state: TestState) => void;
  initialAnswers?: Record<string, Partial<AnswerState>>;
  initialBookmarks?: string[];
  initialMarkedForReview?: string[];
}

export const useTestState = ({
  sections,
  questions,
  onStateChange,
  initialAnswers = {},
  initialBookmarks = [],
  initialMarkedForReview = [],
}: UseTestStateProps) => {
  const [state, setState] = useState<TestState>(() => ({
    answers: {},
    bookmarks: new Set(initialBookmarks),
    markedForReview: new Set(initialMarkedForReview),
    visitedQuestions: new Set<string>(),
    currentQuestionId: null,
    startTime: null,
    endTime: null,
    isSubmitted: false,
  }));

  // Get all question IDs from sections or questions
  const allQuestionIds = useMemo(() => {
    const ids: string[] = [];
    
    if (sections?.length) {
      sections.forEach((section) => {
        section.questions?.forEach((question) => {
          ids.push(question.id);
        });
      });
    } else if (questions?.length) {
      questions.forEach((question) => {
        ids.push(question.id);
      });
    }
    
    return ids;
  }, [sections, questions]);

  // Initialize answers for all questions
  const initializeAnswers = useCallback(() => {
    const newAnswers: Record<string, AnswerState> = {};
    
    allQuestionIds.forEach((questionId) => {
      const existingAnswer = initialAnswers[questionId];
      
      newAnswers[questionId] = {
        selectedOption: existingAnswer?.selectedOption || null,
        isMarked: existingAnswer?.isMarked || false,
        isBookmarked: existingAnswer?.isBookmarked || false,
        isAnswered: existingAnswer?.isAnswered || false,
        isCorrect: existingAnswer?.isCorrect || null,
        timeSpent: existingAnswer?.timeSpent || 0,
        lastUpdated: existingAnswer?.lastUpdated || 0,
      };
    });
    
    setState((prev) => ({
      ...prev,
      answers: newAnswers,
      bookmarks: new Set(initialBookmarks),
      markedForReview: new Set(initialMarkedForReview),
      visitedQuestions: new Set<string>(),
      startTime: Date.now(),
      isSubmitted: false,
    }));
    
    return newAnswers;
  }, [allQuestionIds, initialAnswers, initialBookmarks, initialMarkedForReview]);

  // Select an answer for a question
  const selectAnswer = useCallback((questionId: string, optionId: string | null) => {
    setState((prev) => {
      const currentTime = Date.now();
      const currentQuestion = prev.answers[questionId] || {};
      
      const newAnswers = {
        ...prev.answers,
        [questionId]: {
          ...currentQuestion,
          selectedOption: optionId,
          isAnswered: optionId !== null,
          lastUpdated: currentTime,
        },
      };
      
      const newState = {
        ...prev,
        answers: newAnswers,
      };
      
      onStateChange?.(newState);
      return newState;
    });
  }, [onStateChange]);

  // Toggle bookmark for a question
  const toggleBookmark = useCallback((questionId: string) => {
    setState((prev) => {
      const newBookmarks = new Set(prev.bookmarks);
      
      if (newBookmarks.has(questionId)) {
        newBookmarks.delete(questionId);
      } else {
        newBookmarks.add(questionId);
      }
      
      const newAnswers = {
        ...prev.answers,
        [questionId]: {
          ...(prev.answers[questionId] || {}),
          isBookmarked: newBookmarks.has(questionId),
          lastUpdated: Date.now(),
        },
      };
      
      const newState = {
        ...prev,
        answers: newAnswers,
        bookmarks: newBookmarks,
      };
      
      onStateChange?.(newState);
      return newState;
    });
  }, [onStateChange]);

  // Toggle mark for review
  const toggleMarkForReview = useCallback((questionId: string) => {
    setState((prev) => {
      const newMarkedForReview = new Set(prev.markedForReview);
      
      if (newMarkedForReview.has(questionId)) {
        newMarkedForReview.delete(questionId);
      } else {
        newMarkedForReview.add(questionId);
      }
      
      const newAnswers = {
        ...prev.answers,
        [questionId]: {
          ...(prev.answers[questionId] || {}),
          isMarked: newMarkedForReview.has(questionId),
          lastUpdated: Date.now(),
        },
      };
      
      const newState = {
        ...prev,
        answers: newAnswers,
        markedForReview: newMarkedForReview,
      };
      
      onStateChange?.(newState);
      return newState;
    });
  }, [onStateChange]);

  // Mark a question as visited
  const markAsVisited = useCallback((questionId: string) => {
    setState((prev) => {
      const newVisited = new Set(prev.visitedQuestions);
      newVisited.add(questionId);
      
      const newState = {
        ...prev,
        visitedQuestions: newVisited,
      };
      
      onStateChange?.(newState);
      return newState;
    });
  }, [onStateChange]);

  // Update time spent on a question
  const updateTimeSpent = useCallback((questionId: string, timeInSeconds: number) => {
    setState((prev) => {
      const currentAnswer = prev.answers[questionId] || {};
      
      const newAnswers = {
        ...prev.answers,
        [questionId]: {
          ...currentAnswer,
          timeSpent: (currentAnswer.timeSpent || 0) + timeInSeconds,
          lastUpdated: Date.now(),
        },
      };
      
      const newState = {
        ...prev,
        answers: newAnswers,
      };
      
      onStateChange?.(newState);
      return newState;
    });
  }, [onStateChange]);

  // Set current question
  const setCurrentQuestion = useCallback((questionId: string) => {
    setState((prev) => ({
      ...prev,
      currentQuestionId: questionId,
    }));
    
    markAsVisited(questionId);
  }, [markAsVisited]);

  // Mark test as submitted
  const submitTest = useCallback(() => {
    setState((prev) => ({
      ...prev,
      endTime: Date.now(),
      isSubmitted: true,
    }));
  }, []);

  // Reset test state
  const resetTest = useCallback(() => {
    const newState: TestState = {
      answers: {},
      bookmarks: new Set(),
      markedForReview: new Set(),
      visitedQuestions: new Set(),
      currentQuestionId: null,
      startTime: null,
      endTime: null,
      isSubmitted: false,
    };
    
    setState(newState);
    onStateChange?.(newState);
    return newState;
  }, [onStateChange]);

  // Get answer state for a question
  const getAnswerState = useCallback((questionId: string): AnswerState => {
    return state.answers[questionId] || {
      selectedOption: null,
      isMarked: false,
      isBookmarked: false,
      isAnswered: false,
      isCorrect: null,
      timeSpent: 0,
      lastUpdated: 0,
    };
  }, [state.answers]);

  // Check if a question is answered
  const isQuestionAnswered = useCallback((questionId: string): boolean => {
    return !!state.answers[questionId]?.isAnswered;
  }, [state.answers]);

  // Check if a question is bookmarked
  const isQuestionBookmarked = useCallback((questionId: string): boolean => {
    return state.bookmarks.has(questionId);
  }, [state.bookmarks]);

  // Check if a question is marked for review
  const isQuestionMarkedForReview = useCallback((questionId: string): boolean => {
    return state.markedForReview.has(questionId);
  }, [state.markedForReview]);

  // Check if a question has been visited
  const isQuestionVisited = useCallback((questionId: string): boolean => {
    return state.visitedQuestions.has(questionId);
  }, [state.visitedQuestions]);

  // Get statistics
  const getStatistics = useCallback(() => {
    const answered = Object.values(state.answers).filter(a => a.isAnswered).length;
    const marked = state.markedForReview.size;
    const bookmarked = state.bookmarks.size;
    const total = allQuestionIds.length;
    
    return {
      answered,
      unanswered: total - answered,
      marked,
      bookmarked,
      total,
      progress: total > 0 ? Math.round((answered / total) * 100) : 0,
    };
  }, [state.answers, state.markedForReview, state.bookmarks, allQuestionIds]);

  return {
    // State
    state,
    answers: state.answers,
    bookmarks: state.bookmarks,
    markedForReview: state.markedForReview,
    visitedQuestions: state.visitedQuestions,
    currentQuestionId: state.currentQuestionId,
    startTime: state.startTime,
    endTime: state.endTime,
    isSubmitted: state.isSubmitted,
    
    // Actions
    initializeAnswers,
    selectAnswer,
    toggleBookmark,
    toggleMarkForReview,
    markAsVisited,
    updateTimeSpent,
    setCurrentQuestion,
    submitTest,
    resetTest,
    
    // Getters
    getAnswerState,
    isQuestionAnswered,
    isQuestionBookmarked,
    isQuestionMarkedForReview,
    isQuestionVisited,
    getStatistics,
  };
};

export default useTestState;
