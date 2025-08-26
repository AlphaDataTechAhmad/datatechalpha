import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { useTest } from './hooks/useTest';
import { TestLayout } from './components/TestLayout';
import { TestInstructions } from './components/Instructions';
import { TestQuestion } from './components/Question';
import { TestResults } from './components/Results';
import { TestHeader } from './components/Header';
import { Button } from '../../ui/button';
import { Loader2 } from 'lucide-react';

interface TestConductorProps {
  testId: string;
  onComplete?: (results: TestResults) => void;
}

export const TestConductor: React.FC<TestConductorProps> = ({
  testId,
  onComplete,
}) => {
  const { theme } = useTheme();
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  
  const {
    test,
    loading,
    error,
    currentQuestion,
    currentIndex,
    totalQuestions,
    selectedAnswer,
    timeLeft,
    submitTest,
    selectAnswer,
    nextQuestion,
    prevQuestion,
    markForReview,
    isMarkedForReview,
    isLastQuestion,
    results,
  } = useTest(testId);

  const toggleFullScreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(console.error);
      setIsFullScreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(console.error);
        setIsFullScreen(false);
      }
    }
  }, []);

  const handleStartTest = useCallback(() => {
    setShowInstructions(false);
  }, []);

  const handleCompleteTest = useCallback(async () => {
    const testResults = await submitTest();
    if (onComplete) {
      onComplete(testResults);
    }
  }, [onComplete, submitTest]);

  if (loading || !test) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500">
        Error loading test: {error.message}
      </div>
    );
  }

  if (showInstructions) {
    return (
      <TestInstructions 
        test={test} 
        onStart={handleStartTest}
        theme={theme}
      />
    );
  }

  if (results) {
    return <TestResults results={results} test={test} />;
  }

  return (
    <TestLayout
      header={
        <TestHeader
          title={test.title}
          currentQuestion={currentIndex + 1}
          totalQuestions={totalQuestions}
          timeLeft={timeLeft}
          onFullScreenToggle={toggleFullScreen}
          isFullScreen={isFullScreen}
          theme={theme}
        />
      }
      content={
        <TestQuestion
          question={currentQuestion}
          selectedAnswer={selectedAnswer}
          onSelectAnswer={selectAnswer}
          isMarked={isMarkedForReview(currentQuestion.id)}
          onMarkForReview={() => markForReview(currentQuestion.id)}
          theme={theme}
        />
      }
      footer={
        <div className="flex justify-between items-center p-4 border-t">
          <Button
            variant="outline"
            onClick={prevQuestion}
            disabled={currentIndex === 0}
          >
            Previous
          </Button>
          
          <div className="flex gap-2">
            <Button
              variant={isMarkedForReview(currentQuestion.id) ? "default" : "outline"}
              onClick={() => markForReview(currentQuestion.id)}
            >
              {isMarkedForReview(currentQuestion.id) ? "Marked" : "Mark for Review"}
            </Button>
            
            {isLastQuestion ? (
              <Button onClick={handleCompleteTest} variant="destructive">
                Submit Test
              </Button>
            ) : (
              <Button onClick={nextQuestion}>
                Next Question
              </Button>
            )}
          </div>
        </div>
      }
      theme={theme}
    />
  );
};

export default TestConductor;
