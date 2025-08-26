import React from 'react';
import { Button } from '../../../../ui/button';
import { AlertCircle, Clock, Bookmark, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '../../../../../lib/utils';

type Theme = 'light' | 'dark' | 'system';

interface TestInstructionsProps {
  test: {
    title: string;
    description?: string;
    duration: number;
    totalQuestions: number;
    passingScore: number;
    instructions: string[];
  };
  onStart: () => void;
  theme?: Theme;
  className?: string;
}

const InstructionItem: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({
  icon,
  title,
  children,
}) => (
  <div className="flex gap-4">
    <div className="flex-shrink-0 mt-0.5">
      <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400">
        {icon}
      </div>
    </div>
    <div>
      <h3 className="font-medium">{title}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">{children}</p>
    </div>
  </div>
);

export const TestInstructions: React.FC<TestInstructionsProps> = ({
  test,
  onStart,
  theme = 'light',
  className = '',
}) => {
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${minutes}m`;
  };

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
        'transform hover:shadow-xl',
        getThemeClasses('')
      )}>
        <div className="p-6 sm:p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">{test.title}</h1>
            {test.description && (
              <p className="text-gray-600 dark:text-gray-400">
                {test.description}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <InstructionItem icon={<Clock className="h-4 w-4" />} title="Duration">
              {formatDuration(test.duration)}
            </InstructionItem>
            <InstructionItem icon={<Bookmark className="h-4 w-4" />} title="Questions">
              {test.totalQuestions} questions
            </InstructionItem>
            <InstructionItem icon={<CheckCircle className="h-4 w-4" />} title="Passing Score">
              {test.passingScore}% or higher
            </InstructionItem>
            <InstructionItem icon={<XCircle className="h-4 w-4" />} title="Negative Marking">
              No negative marking
            </InstructionItem>
          </div>

          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              Important Instructions
            </h2>
            <ul className="space-y-3 pl-2">
              {test.instructions.map((instruction, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-primary-500">•</span>
                  <span className="text-gray-700 dark:text-gray-300">{instruction}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 mb-8 rounded-r">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  <span className="font-medium">Note:</span> The test will be automatically submitted when the time runs out.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={onStart}
              size="lg"
              className="w-full sm:w-auto px-8 py-6 text-lg font-medium"
            >
              Start Test
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestInstructions;
