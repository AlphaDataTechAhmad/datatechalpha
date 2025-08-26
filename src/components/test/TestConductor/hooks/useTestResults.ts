import { useCallback, useMemo } from 'react';
import { Test, Question, Section } from '../types';
import { AnswerState } from './useTestState';

interface TestResults {
  score: number;
  totalMarks: number;
  maxPossibleScore: number;
  percentage: number;
  correctAnswers: number;
  incorrectAnswers: number;
  unanswered: number;
  timeSpent: number; // in seconds
  passingScore: number;
  isPassed: boolean;
  sectionWiseResults: Array<{
    sectionId: string;
    sectionName: string;
    correct: number;
    incorrect: number;
    unanswered: number;
    marksObtained: number;
    totalMarks: number;
    percentage: number;
  }>;
  questionWiseResults: Array<{
    questionId: string;
    sectionId: string;
    isCorrect: boolean;
    marksObtained: number;
    timeSpent: number;
    selectedOption: string | null;
    correctOption: string;
    isMarkedForReview: boolean;
    isBookmarked: boolean;
  }>;
}

interface UseTestResultsProps {
  test: Test | null;
  answers: Record<string, AnswerState>;
  markedForReview: Set<string>;
  bookmarks: Set<string>;
  startTime: number | null;
  endTime: number | null;
}

export const useTestResults = ({
  test,
  answers,
  markedForReview,
  bookmarks,
  startTime,
  endTime,
}: UseTestResultsProps) => {
  // Calculate test results
  const calculateResults = useCallback((): TestResults | null => {
    if (!test) return null;
    
    let totalMarks = 0;
    let maxPossibleScore = 0;
    let correctAnswers = 0;
    let incorrectAnswers = 0;
    let unanswered = 0;
    
    const sectionResultsMap: Record<string, {
      sectionId: string;
      sectionName: string;
      correct: number;
      incorrect: number;
      unanswered: number;
      marksObtained: number;
      totalMarks: number;
    }> = {};
    
    const questionResults: TestResults['questionWiseResults'] = [];
    
    // Helper to process a single question
    const processQuestion = (
      question: Question,
      sectionId: string = '',
      sectionName: string = ''
    ) => {
      const answer = answers[question.id] || {};
      const isAnswered = answer.selectedOption !== null;
      const isCorrect = isAnswered && answer.selectedOption === question.correctAnswer;
      const marksObtained = isCorrect ? question.marks : 0;
      
      // Update section results
      if (!sectionResultsMap[sectionId]) {
        sectionResultsMap[sectionId] = {
          sectionId,
          sectionName,
          correct: 0,
          incorrect: 0,
          unanswered: 0,
          marksObtained: 0,
          totalMarks: 0,
        };
      }
      
      const sectionResult = sectionResultsMap[sectionId];
      sectionResult.totalMarks += question.marks;
      
      if (isAnswered) {
        if (isCorrect) {
          correctAnswers++;
          sectionResult.correct++;
          sectionResult.marksObtained += marksObtained;
        } else {
          incorrectAnswers++;
          sectionResult.incorrect++;
          
          // Apply negative marking if enabled
          if (test.negativeMarking) {
            const negativeMarks = test.negativeMarksPerWrongAnswer || 0;
            sectionResult.marksObtained = Math.max(0, sectionResult.marksObtained - negativeMarks);
          }
        }
      } else {
        unanswered++;
        sectionResult.unanswered++;
      }
      
      // Update total marks
      totalMarks += sectionResult.marksObtained;
      maxPossibleScore += question.marks;
      
      // Add to question results
      questionResults.push({
        questionId: question.id,
        sectionId,
        isCorrect,
        marksObtained: isCorrect ? question.marks : 0,
        timeSpent: answer.timeSpent || 0,
        selectedOption: answer.selectedOption,
        correctOption: question.correctAnswer,
        isMarkedForReview: markedForReview.has(question.id),
        isBookmarked: bookmarks.has(question.id),
      });
    };
    
    // Process all questions
    if (test.sections?.length) {
      test.sections.forEach((section) => {
        section.questions?.forEach((question) => {
          processQuestion(question, section.id, section.name);
        });
      });
    } else if (test.questions?.length) {
      test.questions.forEach((question) => {
        processQuestion(question);
      });
    }
    
    // Calculate percentages and finalize section results
    const sectionWiseResults = Object.values(sectionResultsMap).map((section) => ({
      ...section,
      percentage: section.totalMarks > 0 ? (section.marksObtained / section.totalMarks) * 100 : 0,
    }));
    
    const timeSpent = startTime && endTime ? Math.floor((endTime - startTime) / 1000) : 0;
    const percentage = maxPossibleScore > 0 ? (totalMarks / maxPossibleScore) * 100 : 0;
    
    // Auto-pass if score is 10 or above, regardless of percentage
    const isAutoPassed = totalMarks >= 10;
    const isPassed = isAutoPassed || percentage >= (test.passingScore || 0);
    
    return {
      score: totalMarks.toString(), // Convert to string to match database schema
      totalMarks,
      maxPossibleScore,
      percentage,
      correctAnswers,
      incorrectAnswers,
      unanswered,
      timeSpent,
      passingScore: (isAutoPassed ? 10 : (test.passingScore || 0)).toString(), // Convert to string
      isPassed,
      sectionWiseResults,
      questionWiseResults: questionResults,
    };
  }, [test, answers, markedForReview, bookmarks, startTime, endTime]);
  
  // Memoize results to avoid recalculation
  const results = useMemo(() => calculateResults(), [calculateResults]);
  
  // Get question result by ID
  const getQuestionResult = useCallback((questionId: string) => {
    if (!results) return null;
    return results.questionWiseResults.find(q => q.questionId === questionId) || null;
  }, [results]);
  
  // Get section result by ID
  const getSectionResult = useCallback((sectionId: string) => {
    if (!results) return null;
    return results.sectionWiseResults.find(s => s.sectionId === sectionId) || null;
  }, [results]);
  
  // Get performance summary
  const getPerformanceSummary = useCallback(() => {
    if (!results) return null;
    
    const { 
      correctAnswers, 
      incorrectAnswers, 
      unanswered, 
      percentage, 
      isPassed,
      timeSpent 
    } = results;
    
    const totalQuestions = correctAnswers + incorrectAnswers + unanswered;
    const accuracy = correctAnswers > 0 ? (correctAnswers / (correctAnswers + incorrectAnswers)) * 100 : 0;
    
    return {
      totalQuestions,
      correctAnswers,
      incorrectAnswers,
      unanswered,
      percentage,
      isPassed,
      accuracy,
      timeSpent,
      timePerQuestion: totalQuestions > 0 ? timeSpent / totalQuestions : 0,
    };
  }, [results]);
  
  // Get time spent on test in formatted string (e.g., "2h 30m 15s")
  const getFormattedTimeSpent = useCallback(() => {
    if (!results) return '0s';
    
    const { timeSpent } = results;
    const hours = Math.floor(timeSpent / 3600);
    const minutes = Math.floor((timeSpent % 3600) / 60);
    const seconds = timeSpent % 60;
    
    const parts = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0 || hours > 0) parts.push(`${minutes}m`);
    parts.push(`${seconds}s`);
    
    return parts.join(' ');
  }, [results]);
  
  return {
    results,
    calculateResults,
    getQuestionResult,
    getSectionResult,
    getPerformanceSummary,
    getFormattedTimeSpent,
    isPassed: results?.isPassed || false,
    score: results?.score || 0,
    percentage: results?.percentage || 0,
    correctAnswers: results?.correctAnswers || 0,
    incorrectAnswers: results?.incorrectAnswers || 0,
    unanswered: results?.unanswered || 0,
    timeSpent: results?.timeSpent || 0,
  };
};

export default useTestResults;
