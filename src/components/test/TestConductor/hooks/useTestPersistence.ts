import { useState, useEffect, useCallback } from 'react';
import { AnswerState } from './useTestState';

const STORAGE_KEY_PREFIX = 'test_progress_';

interface TestProgress {
  testId: string;
  answers: Record<string, AnswerState>;
  bookmarks: string[];
  markedForReview: string[];
  currentQuestionId: string | null;
  startTime: number | null;
  lastSaved: number;
  version: string;
}

const VERSION = '1.0.0';

export const useTestPersistence = (testId: string) => {
  const storageKey = `${STORAGE_KEY_PREFIX}${testId}`;
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Load progress from localStorage
  const loadProgress = useCallback((): Partial<TestProgress> | null => {
    try {
      const savedData = localStorage.getItem(storageKey);
      if (!savedData) return null;
      
      const parsed = JSON.parse(savedData) as TestProgress;
      
      // Validate version
      if (parsed.version !== VERSION) {
        console.warn('Test progress version mismatch, discarding old data');
        return null;
      }
      
      // Validate that the data is for the current test
      if (parsed.testId !== testId) {
        console.warn('Test ID mismatch, discarding saved progress');
        return null;
      }
      
      return parsed;
    } catch (error) {
      console.error('Failed to load test progress:', error);
      return null;
    }
  }, [storageKey, testId]);
  
  // Save progress to localStorage
  const saveProgress = useCallback((data: {
    answers: Record<string, AnswerState>;
    bookmarks: Set<string>;
    markedForReview: Set<string>;
    currentQuestionId: string | null;
    startTime: number | null;
  }) => {
    try {
      const progress: TestProgress = {
        testId,
        answers: data.answers,
        bookmarks: Array.from(data.bookmarks),
        markedForReview: Array.from(data.markedForReview),
        currentQuestionId: data.currentQuestionId,
        startTime: data.startTime,
        lastSaved: Date.now(),
        version: VERSION,
      };
      
      localStorage.setItem(storageKey, JSON.stringify(progress));
      return true;
    } catch (error) {
      console.error('Failed to save test progress:', error);
      return false;
    }
  }, [storageKey, testId]);
  
  // Clear saved progress
  const clearProgress = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
      return true;
    } catch (error) {
      console.error('Failed to clear test progress:', error);
      return false;
    }
  }, [storageKey]);
  
  // Auto-save effect
  const useAutoSave = useCallback((
    data: {
      answers: Record<string, AnswerState>;
      bookmarks: Set<string>;
      markedForReview: Set<string>;
      currentQuestionId: string | null;
      startTime: number | null;
    },
    saveInterval: number = 10000, // 10 seconds
    isEnabled: boolean = true
  ) => {
    useEffect(() => {
      if (!isEnabled || !isInitialized) return;
      
      const save = () => {
        saveProgress(data);
      };
      
      // Initial save
      save();
      
      // Set up auto-save interval
      const intervalId = setInterval(save, saveInterval);
      
      // Save when the page is about to unload
      const handleBeforeUnload = () => {
        save();
      };
      
      window.addEventListener('beforeunload', handleBeforeUnload);
      
      return () => {
        clearInterval(intervalId);
        window.removeEventListener('beforeunload', handleBeforeUnload);
        
        // Final save when unmounting
        if (document.visibilityState === 'visible') {
          save();
        }
      };
    }, [data, saveInterval, isEnabled, isInitialized]);
  }, [saveProgress, isInitialized]);
  
  // Handle tab visibility changes to save when tab becomes hidden
  const useVisibilitySave = useCallback((
    saveHandler: () => void
  ) => {
    useEffect(() => {
      if (!isInitialized) return;
      
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'hidden') {
          saveHandler();
        }
      };
      
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }, [saveHandler, isInitialized]);
  }, [isInitialized]);
  
  // Initialize the hook
  useEffect(() => {
    setIsInitialized(true);
    return () => {
      // Cleanup if needed
    };
  }, []);
  
  return {
    loadProgress,
    saveProgress,
    clearProgress,
    useAutoSave,
    useVisibilitySave,
    isInitialized,
  };
};

export default useTestPersistence;
