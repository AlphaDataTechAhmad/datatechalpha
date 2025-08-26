import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Test, Question, Section } from '../types';
import useTestNavigation from './useTestNavigation';
import useTestState from './useTestState';
import useTestTimer from './useTestTimer';
import useTestResults from './useTestResults';
import useTestPersistence from './useTestPersistence';
import useAccessibility from './useAccessibility';
import { useAuth } from '../../../../contexts/AuthContext';
import { databases } from '../../../../lib/appwrite';
import { ID } from 'appwrite';

interface UseTestTakerProps {
  test: Test;
  onComplete?: (results: any) => void;
  onExit?: () => void;
  autoStart?: boolean;
  showTimer?: boolean;
  allowNavigation?: boolean;
  allowReview?: boolean;
  allowBookmarking?: boolean;
  showResults?: boolean;
  saveProgress?: boolean; // Keep this for backward compatibility
  shouldSaveProgress?: boolean; // New prop name to avoid conflict
}

const useTestTaker = ({
  test,
  onComplete,
  onExit,
  autoStart = true,
  showTimer = true,
  allowNavigation = true,
  allowReview = true,
  allowBookmarking = true,
  showResults = true,
  saveProgress: shouldSaveProgress = true,
}: UseTestTakerProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { testId } = useParams<{ testId: string }>();
  
  // Initialize test state
  const {
    state: testState,
    answers,
    bookmarks,
    markedForReview,
    currentQuestionId,
    startTime,
    endTime,
    isSubmitted,
    initializeAnswers,
    selectAnswer,
    toggleBookmark,
    toggleMarkForReview,
    markAsVisited,
    updateTimeSpent,
    setCurrentQuestion,
    submitTest: submitTestState,
    resetTest: resetTestState,
    getAnswerState,
    isQuestionAnswered,
    isQuestionBookmarked,
    isQuestionMarkedForReview,
    getStatistics,
  } = useTestState({
    sections: test.sections,
    questions: test.questions,
  });
  
  // Initialize test navigation
  const {
    currentSectionIndex,
    currentQuestionIndex,
    currentQuestionNumber,
    currentSection,
    currentQuestion: navCurrentQuestion,
    totalQuestions,
    isFirstQuestion,
    isLastQuestion,
    progress,
    goToNextQuestion,
    goToPreviousQuestion,
    goToQuestion,
    getQuestionByGlobalIndex,
    getCurrentGlobalIndex,
  } = useTestNavigation({
    sections: test.sections,
    questions: test.questions,
    onQuestionChange: (sectionIdx, questionIdx) => {
      // Update time spent on previous question
      if (currentQuestion?.id) {
        const timeSpent = Math.floor((Date.now() - (lastQuestionTime.current || 0)) / 1000);
        if (timeSpent > 0) {
          updateTimeSpent(currentQuestion.id, timeSpent);
        }
      }
      
      // Update current question reference
      const question = test.sections?.[sectionIdx]?.questions?.[questionIdx] || 
                      test.questions?.[questionIdx];
      
      if (question) {
        setCurrentQuestion(question.id);
        lastQuestionTime.current = Date.now();
      }
    },
  });
  
  // Track time spent on current question
  const lastQuestionTime = useRef<number | null>(null);
  
  // Get current question with state
  const currentQuestion = useMemo(() => {
    const question = navCurrentQuestion;
    if (!question) return null;
    
    const answer = getAnswerState(question.id);
    
    return {
      ...question,
      isAnswered: answer.isAnswered,
      isBookmarked: answer.isBookmarked,
      isMarkedForReview: answer.isMarkedForReview,
      selectedOption: answer.selectedOption,
      timeSpent: answer.timeSpent,
    };
  }, [navCurrentQuestion, getAnswerState]);
  
  // Initialize test timer
  const {
    time: timeLeft,
    formattedTime: formattedTimeLeft,
    isRunning: isTimerRunning,
    isPaused: isTimerPaused,
    start: startTimer,
    pause: pauseTimer,
    resume: resumeTimer,
    reset: resetTimer,
  } = useTestTimer({
    initialTime: test.duration * 60, // Convert minutes to seconds
    onTimeUp: () => {
      // Auto-submit when time is up
      handleSubmitTest();
    },
    autoStart: autoStart && showTimer,
  });
  
  // Calculate test results
  const {
    results,
    calculateResults,
    getQuestionResult,
    getSectionResult,
    getPerformanceSummary,
    getFormattedTimeSpent,
  } = useTestResults({
    test,
    answers: testState.answers,
    markedForReview: testState.markedForReview,
    bookmarks: testState.bookmarks,
    startTime: testState.startTime,
    endTime: testState.endTime,
  });
  
  // Initialize test persistence
  const {
    loadProgress,
    saveProgress,
    clearProgress,
    useAutoSave,
  } = useTestPersistence(test.id);
  
  // Auto-save progress
  useAutoSave(
    {
      answers: testState.answers,
      bookmarks: testState.bookmarks,
      markedForReview: testState.markedForReview,
      currentQuestionId: currentQuestion?.id || null,
      startTime: testState.startTime,
    },
    10000, // 10 seconds
    saveProgress && !isSubmitted
  );
  
  // Initialize accessibility
  const {
    announce,
    focusElement,
    highContrast,
    toggleHighContrast,
    fontSize,
    increaseFontSize,
    decreaseFontSize,
    reduceMotion,
    toggleReduceMotion,
    isKeyboardNavigation,
    toggleKeyboardNavigation,
  } = useAccessibility();
  
  // Load saved progress on mount
  useEffect(() => {
    if (saveProgress) {
      const savedProgress = loadProgress();
      if (savedProgress) {
        // Initialize with saved progress
        initializeAnswers(savedProgress.answers);
        
        // Restore current question
        if (savedProgress.currentQuestionId) {
          // Find the question in the test
          let found = false;
          
          if (test.sections) {
            test.sections.forEach((section, sIdx) => {
              section.questions?.forEach((question, qIdx) => {
                if (question.id === savedProgress.currentQuestionId) {
                  goToQuestion(sIdx, qIdx);
                  found = true;
                }
              });
            });
          } else if (test.questions) {
            test.questions.forEach((question, qIdx) => {
              if (question.id === savedProgress.currentQuestionId) {
                goToQuestion(0, qIdx);
                found = true;
              }
            });
          }
          
          if (!found) {
            // If we couldn't find the saved question, start from the beginning
            goToQuestion(0, 0);
          }
        }
        
        // Announce that progress was restored
        announce('Test progress restored', 'polite');
      } else {
        // Initialize with default values
        initializeAnswers();
        goToQuestion(0, 0);
      }
    } else {
      // Initialize without loading saved progress
      initializeAnswers();
      goToQuestion(0, 0);
    }
    
    // Start the timer if auto-start is enabled
    if (autoStart && showTimer) {
      startTimer();
    }
    
    // Set up beforeunload handler to prevent accidental navigation
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isSubmitted) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [test.id, saveProgress]);
  
  // Handle answer selection
  const handleSelectAnswer = useCallback((questionId: string, optionId: string | null) => {
    selectAnswer(questionId, optionId);
    
    // Announce the selection for screen readers
    if (optionId) {
      const question = test.questions?.find(q => q.id === questionId) || 
                      test.sections?.flatMap(s => s.questions || []).find(q => q.id === questionId);
      
      if (question) {
        const option = question.options.find(opt => opt.id === optionId);
        if (option) {
          announce(`Selected option ${option.id}`, 'polite');
        }
      }
    }
    
    // Auto-move to next question if enabled
    if (test.autoMoveNext && optionId && !isLastQuestion) {
      setTimeout(() => {
        goToNextQuestion();
      }, 300); // Small delay for better UX
    }
  }, [selectAnswer, test.autoMoveNext, test.questions, test.sections, isLastQuestion, goToNextQuestion, announce]);
  
  // Handle test submission
  const handleSubmitTest = useCallback(async () => {
    // Pause the timer
    pauseTimer();
    
    // Calculate final results
    const finalResults = calculateResults();
    
    // Update state
    submitTestState();
    
    // Save results to the database if user is authenticated
    if (user) {
      try {
        await databases.createDocument(
          'test_results',
          ID.unique(),
          {
            userId: user.$id,
            testId: test.id,
            score: finalResults?.score || 0,
            totalMarks: finalResults?.totalMarks || 0,
            percentage: finalResults?.percentage || 0,
            isPassed: finalResults?.isPassed || false,
            timeSpent: finalResults?.timeSpent || 0,
            answers: JSON.stringify(finalResults?.questionWiseResults || []),
            sections: JSON.stringify(finalResults?.sectionWiseResults || []),
          }
        );
      } catch (error) {
        console.error('Failed to save test results:', error);
      }
    }
    
    // Clear saved progress
    if (saveProgress) {
      clearProgress();
    }
    
    // Call the completion callback if provided
    if (onComplete && finalResults) {
      onComplete(finalResults);
    }
    
    // Announce completion
    announce('Test submitted successfully', 'polite');
  }, [
    pauseTimer,
    calculateResults,
    submitTestState,
    user,
    test.id,
    saveProgress,
    clearProgress,
    onComplete,
    announce,
  ]);
  
  // Handle exit
  const handleExit = useCallback(() => {
    if (onExit) {
      onExit();
    } else {
      navigate(-1); // Go back to previous page
    }
  }, [navigate, onExit]);
  
  // Handle visibility change (tab switch)
  useEffect(() => {
    if (test.preventTabSwitch && !isSubmitted) {
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'hidden') {
          // Increment tab switch count
          // If auto-submit is enabled and tab switch limit is reached, submit the test
          if (test.autoSubmitOnTabSwitch) {
            handleSubmitTest();
          }
        }
      };
      
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, [test.preventTabSwitch, test.autoSubmitOnTabSwitch, isSubmitted, handleSubmitTest]);
  
  // Handle keyboard shortcuts
  useEffect(() => {
    if (!isKeyboardNavigation) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }
      
      switch (e.key) {
        case 'ArrowRight':
          if (!isLastQuestion) {
            e.preventDefault();
            goToNextQuestion();
          }
          break;
          
        case 'ArrowLeft':
          if (!isFirstQuestion) {
            e.preventDefault();
            goToPreviousQuestion();
          }
          break;
          
        case ' ':
        case 'Enter':
          if (e.target instanceof HTMLButtonElement) {
            // Let the button handle the event
            return;
          }
          e.preventDefault();
          if (!isLastQuestion) {
            goToNextQuestion();
          }
          break;
          
        case 'Escape':
          // Toggle fullscreen or exit
          if (document.fullscreenElement) {
            document.exitFullscreen().catch(console.error);
          }
          break;
          
        default:
          // Handle number keys for answer selection (1-9)
          if (/^[1-9]$/.test(e.key)) {
            const optionIndex = parseInt(e.key, 10) - 1;
            if (currentQuestion?.options && optionIndex < currentQuestion.options.length) {
              const optionId = currentQuestion.options[optionIndex].id;
              handleSelectAnswer(currentQuestion.id, optionId);
            }
          }
          break;
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    isKeyboardNavigation,
    isFirstQuestion,
    isLastQuestion,
    goToNextQuestion,
    goToPreviousQuestion,
    currentQuestion,
    handleSelectAnswer,
  ]);
  
  // Expose public API
  return {
    // Test state
    test,
    currentSection,
    currentQuestion,
    currentQuestionNumber,
    totalQuestions,
    isFirstQuestion,
    isLastQuestion,
    progress,
    isSubmitted,
    
    // Navigation
    goToNextQuestion,
    goToPreviousQuestion,
    goToQuestion,
    
    // Answers
    answers,
    selectAnswer: handleSelectAnswer,
    getAnswerState,
    isQuestionAnswered,
    isQuestionBookmarked,
    isQuestionMarkedForReview,
    
    // Timer
    timeLeft,
    formattedTimeLeft,
    isTimerRunning,
    isTimerPaused,
    startTimer,
    pauseTimer,
    resumeTimer,
    
    // Bookmarks and review
    bookmarks,
    toggleBookmark,
    markedForReview,
    toggleMarkForReview,
    
    // Results
    results,
    getQuestionResult,
    getSectionResult,
    getPerformanceSummary,
    getFormattedTimeSpent,
    
    // Test actions
    submitTest: handleSubmitTest,
    exitTest: handleExit,
    
    // Accessibility
    accessibility: {
      highContrast,
      toggleHighContrast,
      fontSize,
      increaseFontSize,
      decreaseFontSize,
      reduceMotion,
      toggleReduceMotion,
      isKeyboardNavigation,
      toggleKeyboardNavigation,
      announce,
      focusElement,
    },
    
    // Statistics
    getStatistics,
  };
};

export default useTestTaker;
