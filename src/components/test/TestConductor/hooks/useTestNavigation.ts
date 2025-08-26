import { useState, useCallback, useMemo } from 'react';
import { Question, Section } from '../types';

interface UseTestNavigationProps {
  sections?: Section[];
  questions?: Question[];
  initialSectionIndex?: number;
  initialQuestionIndex?: number;
  onQuestionChange?: (sectionIndex: number, questionIndex: number) => void;
  onSectionChange?: (sectionIndex: number) => void;
}

export const useTestNavigation = ({
  sections,
  questions,
  initialSectionIndex = 0,
  initialQuestionIndex = 0,
  onQuestionChange,
  onSectionChange,
}: UseTestNavigationProps) => {
  const [currentSectionIndex, setCurrentSectionIndex] = useState(initialSectionIndex);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(initialQuestionIndex);
  
  // Get the current section and question
  const currentSection = useMemo(() => {
    if (!sections?.length) return null;
    return sections[currentSectionIndex] || null;
  }, [sections, currentSectionIndex]);
  
  const currentQuestion = useMemo(() => {
    if (sections?.length) {
      return sections[currentSectionIndex]?.questions?.[currentQuestionIndex] || null;
    }
    return questions?.[currentQuestionIndex] || null;
  }, [sections, questions, currentSectionIndex, currentQuestionIndex]);
  
  // Calculate total number of questions
  const totalQuestions = useMemo(() => {
    if (sections?.length) {
      return sections.reduce((total, section) => total + (section.questions?.length || 0), 0);
    }
    return questions?.length || 0;
  }, [sections, questions]);
  
  // Calculate current question number (1-based)
  const currentQuestionNumber = useMemo(() => {
    if (!sections?.length) return currentQuestionIndex + 1;
    
    return (
      sections
        .slice(0, currentSectionIndex)
        .reduce((total, section) => total + (section.questions?.length || 0), 0) +
      currentQuestionIndex +
      1
    );
  }, [sections, currentSectionIndex, currentQuestionIndex]);
  
  // Check if current question is the first/last in the test
  const isFirstQuestion = useMemo(() => {
    return currentSectionIndex === 0 && currentQuestionIndex === 0;
  }, [currentSectionIndex, currentQuestionIndex]);
  
  const isLastQuestion = useMemo(() => {
    if (!sections?.length) {
      return currentQuestionIndex === (questions?.length || 0) - 1;
    }
    
    return (
      currentSectionIndex === sections.length - 1 &&
      currentQuestionIndex === (sections[currentSectionIndex]?.questions?.length || 0) - 1
    );
  }, [sections, questions, currentSectionIndex, currentQuestionIndex]);
  
  // Navigation functions
  const goToNextQuestion = useCallback(() => {
    if (!sections?.length) {
      // No sections, just go to next question in flat list
      if (currentQuestionIndex < (questions?.length || 0) - 1) {
        const newIndex = currentQuestionIndex + 1;
        setCurrentQuestionIndex(newIndex);
        onQuestionChange?.(0, newIndex);
      }
      return;
    }
    
    // With sections
    const currentSectionQuestions = sections[currentSectionIndex]?.questions || [];
    
    if (currentQuestionIndex < currentSectionQuestions.length - 1) {
      // Next question in current section
      const newIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(newIndex);
      onQuestionChange?.(currentSectionIndex, newIndex);
    } else if (currentSectionIndex < sections.length - 1) {
      // First question in next section
      const newSectionIndex = currentSectionIndex + 1;
      setCurrentSectionIndex(newSectionIndex);
      setCurrentQuestionIndex(0);
      onSectionChange?.(newSectionIndex);
      onQuestionChange?.(newSectionIndex, 0);
    }
  }, [sections, questions, currentSectionIndex, currentQuestionIndex, onQuestionChange, onSectionChange]);
  
  const goToPreviousQuestion = useCallback(() => {
    if (!sections?.length) {
      // No sections, just go to previous question in flat list
      if (currentQuestionIndex > 0) {
        const newIndex = currentQuestionIndex - 1;
        setCurrentQuestionIndex(newIndex);
        onQuestionChange?.(0, newIndex);
      }
      return;
    }
    
    // With sections
    if (currentQuestionIndex > 0) {
      // Previous question in current section
      const newIndex = currentQuestionIndex - 1;
      setCurrentQuestionIndex(newIndex);
      onQuestionChange?.(currentSectionIndex, newIndex);
    } else if (currentSectionIndex > 0) {
      // Last question in previous section
      const newSectionIndex = currentSectionIndex - 1;
      const newSectionQuestions = sections[newSectionIndex]?.questions || [];
      const newQuestionIndex = newSectionQuestions.length - 1;
      
      setCurrentSectionIndex(newSectionIndex);
      setCurrentQuestionIndex(newQuestionIndex);
      onSectionChange?.(newSectionIndex);
      onQuestionChange?.(newSectionIndex, newQuestionIndex);
    }
  }, [sections, currentSectionIndex, currentQuestionIndex, onQuestionChange, onSectionChange]);
  
  // Jump to a specific question
  const goToQuestion = useCallback((sectionIndex: number, questionIndex: number) => {
    if (sections?.length) {
      if (sectionIndex >= 0 && sectionIndex < sections.length) {
        const sectionQuestions = sections[sectionIndex]?.questions || [];
        if (questionIndex >= 0 && questionIndex < sectionQuestions.length) {
          setCurrentSectionIndex(sectionIndex);
          setCurrentQuestionIndex(questionIndex);
          onSectionChange?.(sectionIndex);
          onQuestionChange?.(sectionIndex, questionIndex);
        }
      }
    } else if (questions?.length) {
      if (questionIndex >= 0 && questionIndex < questions.length) {
        setCurrentQuestionIndex(questionIndex);
        onQuestionChange?.(0, questionIndex);
      }
    }
  }, [sections, questions, onQuestionChange, onSectionChange]);
  
  // Get question by global index (across all sections)
  const getQuestionByGlobalIndex = useCallback((globalIndex: number) => {
    if (globalIndex < 0) return null;
    
    if (!sections?.length) {
      return questions?.[globalIndex] || null;
    }
    
    let remaining = globalIndex;
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      if (!section.questions?.length) continue;
      
      if (remaining < section.questions.length) {
        return {
          sectionIndex: i,
          questionIndex: remaining,
          question: section.questions[remaining],
        };
      }
      
      remaining -= section.questions.length;
    }
    
    return null;
  }, [sections, questions]);
  
  // Get global index of current question
  const getCurrentGlobalIndex = useCallback(() => {
    if (!sections?.length) return currentQuestionIndex;
    
    let globalIndex = 0;
    for (let i = 0; i < currentSectionIndex; i++) {
      globalIndex += sections[i]?.questions?.length || 0;
    }
    
    return globalIndex + currentQuestionIndex;
  }, [sections, currentSectionIndex, currentQuestionIndex]);
  
  // Get progress percentage
  const getProgress = useCallback(() => {
    if (totalQuestions === 0) return 0;
    return Math.round((getCurrentGlobalIndex() / totalQuestions) * 100);
  }, [totalQuestions, getCurrentGlobalIndex]);
  
  return {
    // Current state
    currentSectionIndex,
    currentQuestionIndex,
    currentQuestionNumber,
    currentSection,
    currentQuestion,
    totalQuestions,
    
    // Navigation state
    isFirstQuestion,
    isLastQuestion,
    progress: getProgress(),
    
    // Navigation functions
    goToNextQuestion,
    goToPreviousQuestion,
    goToQuestion,
    
    // Utility functions
    getQuestionByGlobalIndex,
    getCurrentGlobalIndex,
    getProgress,
    
    // Direct setters (use with caution)
    setCurrentSectionIndex: (index: number) => {
      if (sections && index >= 0 && index < sections.length) {
        setCurrentSectionIndex(index);
        setCurrentQuestionIndex(0);
        onSectionChange?.(index);
        onQuestionChange?.(index, 0);
      }
    },
    
    setCurrentQuestionIndex: (index: number) => {
      if (sections?.length) {
        const section = sections[currentSectionIndex];
        if (section?.questions && index >= 0 && index < section.questions.length) {
          setCurrentQuestionIndex(index);
          onQuestionChange?.(currentSectionIndex, index);
        }
      } else if (questions && index >= 0 && index < questions.length) {
        setCurrentQuestionIndex(index);
        onQuestionChange?.(0, index);
      }
    },
  };
};

export default useTestNavigation;
