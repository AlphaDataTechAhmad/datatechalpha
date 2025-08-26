import React from 'react';
import { Button } from '../../../../ui/button';
import { CheckCircle, XCircle, BookOpen, Clock, Award, BarChart2 } from 'lucide-react';
import { cn } from '../../../../../lib/utils';

type Theme = 'light' | 'dark' | 'system';

interface TestResultsProps {
  results: {
    score: number;
    totalQuestions: number;
    correctAnswers: number;
    incorrectAnswers: number;
    skipped: number;
    timeSpent: number; // in seconds
    passingScore: number;
    answers: Array<{
      questionId: string;
      isCorrect: boolean;
      timeSpent: number;
    }>;
  };
  test: {
    title: string;
    description?: string;
  };
  theme?: Theme;
  className?: string;
  onRetry?: () => void;
  onReview?: () => void;
}

const ResultStat: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string | number;
  highlight?: boolean;
  theme?: Theme;
}> = ({ icon, label, value, highlight = false, theme = 'light' }) => {
  return (
    <div className={cn(
      'p-4 rounded-lg flex items-center gap-4',
      highlight 
        ? 'bg-primary-50 dark:bg-primary-900/30 border border-primary-100 dark:border-primary-800'
        : 'bg-gray-50 dark:bg-gray-800',
    )}>
      <div className={cn(
        'p-3 rounded-full',
        highlight 
          ? 'bg-primary-100 dark:bg-primary-800/50 text-primary-600 dark:text-primary-300'
          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
      )}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        <p className={cn(
          'text-lg font-semibold',
          highlight ? 'text-primary-700 dark:text-primary-200' : 'text-gray-900 dark:text-white'
        )}>
          {value}
        </p>
      </div>
    </div>
  );
};

export const TestResults: React.FC<TestResultsProps> = ({
  results,
  test,
  theme = 'light',
  className = '',
  onRetry,
  onReview,
}) => {
  const isPassed = results.score >= results.passingScore;
  const accuracy = Math.round((results.correctAnswers / results.totalQuestions) * 100);
  const avgTimePerQuestion = Math.round(results.timeSpent / results.totalQuestions);

  const getThemeClasses = (baseClasses: string) => {
    switch (theme) {
      case 'dark':
        return `${baseClasses} bg-gray-900 text-white`;
      case 'light':
        return `${baseClasses} bg-white text-gray-900`;
      default:
        return `${baseClasses} bg-white dark:bg-gray-900 text-gray-900 dark:text-white`;
    }
  };

  return (
    <div className={cn('min-h-screen flex items-center justify-center p-4', getThemeClasses(''), className)}>
      <div className={cn(
        'w-full max-w-4xl rounded-xl shadow-lg overflow-hidden',
        'border border-gray-200 dark:border-gray-800',
        'transition-all duration-300',
        getThemeClasses('')
      )}>
        <div className="p-6 sm:p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4"
              style={{
                background: isPassed 
                  ? 'radial-gradient(circle, rgba(34, 197, 94, 0.1) 0%, rgba(34, 197, 94, 0.2) 100%)' 
                  : 'radial-gradient(circle, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.2) 100%)'
              }}>
              {isPassed ? (
                <CheckCircle className="h-10 w-10 text-green-500" />
              ) : (
                <XCircle className="h-10 w-10 text-red-500" />
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">
              {isPassed ? 'Test Passed!' : 'Test Completed'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {isPassed 
                ? 'Congratulations! You have successfully passed the test.'
                : `You need ${results.passingScore - results.score}% more to pass.`}
              }
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <ResultStat
              icon={<Award className="h-5 w-5" />}
              label="Your Score"
              value={`${results.score}%`}
              highlight
              theme={theme}
            />
            <ResultStat
              icon={<BarChart2 className="h-5 w-5" />}
              label="Accuracy"
              value={`${accuracy}%`}
              theme={theme}
            />
            <ResultStat
              icon={<Clock className="h-5 w-5" />}
              label="Time Spent"
              value={`${Math.floor(results.timeSpent / 60)}m ${results.timeSpent % 60}s`}
              theme={theme}
            />
            <ResultStat
              icon={<CheckCircle className="h-5 w-5" />}
              label="Correct Answers"
              value={`${results.correctAnswers} / ${results.totalQuestions}`}
              theme={theme}
            />
            <ResultStat
              icon={<XCircle className="h-5 w-5" />}
              label="Incorrect Answers"
              value={results.incorrectAnswers.toString()}
              theme={theme}
            />
            <ResultStat
              icon={<Clock className="h-5 w-5" />}
              label="Avg. Time/Question"
              value={`${avgTimePerQuestion}s`}
              theme={theme}
            />
          </div>

          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Performance Summary</h2>
            <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500"
                style={{ width: `${results.score}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-sm text-gray-600 dark:text-gray-400">
              <span>0%</span>
              <span>Passing: {results.passingScore}%</span>
              <span>100%</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {onRetry && (
              <Button
                variant="outline"
                onClick={onRetry}
                className="px-8 py-6 text-lg font-medium"
              >
                Retry Test
              </Button>
            )}
            {onReview && (
              <Button
                onClick={onReview}
                className="px-8 py-6 text-lg font-medium"
              >
                Review Answers
              </Button>
            )}
            <Button
              variant="secondary"
              className="px-8 py-6 text-lg font-medium"
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestResults;
