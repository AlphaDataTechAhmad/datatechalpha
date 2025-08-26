import React, { useState } from 'react';
import { cn } from '../../../../../lib/utils';
import { CheckCircle, Circle, Flag } from 'lucide-react';

type Theme = 'light' | 'dark' | 'system';

interface Option {
  id: string;
  text: string;
}

interface QuestionProps {
  question: {
    id: string;
    text: string;
    options: Option[];
    explanation?: string;
  };
  selectedAnswer?: string | null;
  onSelectAnswer: (optionId: string) => void;
  isMarked: boolean;
  onMarkForReview: () => void;
  theme?: Theme;
  className?: string;
}

export const TestQuestion: React.FC<QuestionProps> = ({
  question,
  selectedAnswer,
  onSelectAnswer,
  isMarked,
  onMarkForReview,
  theme = 'light',
  className = '',
}) => {
  const [showExplanation, setShowExplanation] = useState(false);

  const getThemeClasses = (baseClasses: string) => {
    switch (theme) {
      case 'dark':
        return `${baseClasses} bg-gray-800 text-white`;
      case 'light':
        return `${baseClasses} bg-white text-gray-900`;
      default:
        return `${baseClasses} bg-white dark:bg-gray-800 text-gray-900 dark:text-white`;
    }
  };

  const getOptionClasses = (isSelected: boolean, isHovered: boolean) => {
    if (isSelected) {
      return 'border-primary-500 bg-primary-50 dark:bg-primary-900/30';
    }
    if (isHovered) {
      return 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700';
    }
    return 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600';
  };

  return (
    <div className={cn('space-y-6', className)}>
      <div className="flex justify-between items-start gap-4">
        <h2 className="text-xl font-medium leading-relaxed">
          {question.text}
        </h2>
        <button
          onClick={onMarkForReview}
          className={cn(
            'p-2 rounded-full transition-colors',
            isMarked 
              ? 'text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20' 
              : 'text-gray-400 hover:text-yellow-500 hover:bg-gray-50 dark:hover:bg-gray-700',
            'flex-shrink-0'
          )}
          aria-label={isMarked ? 'Marked for review' : 'Mark for review'}
        >
          <Flag className={cn('h-5 w-5', { 'fill-current': isMarked })} />
        </button>
      </div>

      <div className="space-y-3">
        {question.options.map((option) => {
          const isSelected = selectedAnswer === option.id;
          const [isHovered, setIsHovered] = useState(false);

          return (
            <button
              key={option.id}
              onClick={() => onSelectAnswer(option.id)}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              className={cn(
                'w-full text-left p-4 rounded-lg border transition-all duration-200 flex items-start gap-3',
                getOptionClasses(isSelected, isHovered),
                'group'
              )}
            >
              <div className="flex-shrink-0 mt-0.5">
                {isSelected ? (
                  <CheckCircle className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                ) : (
                  <Circle className="h-5 w-5 text-gray-400 group-hover:text-primary-400" />
                )}
              </div>
              <span className="text-left">{option.text}</span>
            </button>
          );
        })}
      </div>

      {question.explanation && (
        <div className="mt-6">
          <button
            onClick={() => setShowExplanation(!showExplanation)}
            className="text-sm text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
          >
            {showExplanation ? 'Hide' : 'Show'} explanation
          </button>
          
          {showExplanation && (
            <div className="mt-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm">
              {question.explanation}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TestQuestion;
