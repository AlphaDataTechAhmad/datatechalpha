import React from 'react';
import { CardContent, CardFooter, CardHeader } from '../ui/card';
import { Button } from '../ui/button';
import { formatDuration } from '@/lib/utils';
import { Clock, FileText, Award, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TestCardProps {
  id: string;
  title: string;
  description: string;
  duration: number;
  questionCount?: number;
  category?: string;
  thumbnail?: string | null;
  passingScore?: number;
  onClick?: () => void;
  className?: string;
}

export const TestCard: React.FC<TestCardProps> = ({
  id,
  title,
  description,
  duration,
  questionCount = 0,
  category = 'Uncategorized',
  thumbnail = null,
  passingScore = 0,
  onClick,
  className = ''
}) => {
  // Generate a consistent gradient based on the test ID
  const gradientColors = [
    'from-blue-500 to-indigo-600',
    'from-emerald-500 to-teal-600',
    'from-purple-500 to-pink-600',
    'from-amber-500 to-orange-600',
    'from-rose-500 to-pink-600'
  ];
  const gradient = gradientColors[Math.abs(id.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % gradientColors.length];

  return (
    <div 
      className={cn(
        'group relative h-full flex flex-col overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700',
        'bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all duration-300',
        'transform hover:-translate-y-1',
        className
      )}
      onClick={onClick}
    >
      {/* Thumbnail with gradient overlay */}
      <div className="relative h-36 w-full overflow-hidden">
        {thumbnail ? (
          <img 
            src={thumbnail} 
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const fallback = target.parentElement?.querySelector('.thumbnail-fallback');
              if (fallback) {
                (fallback as HTMLElement).style.display = 'flex';
              }
            }}
          />
        ) : null}
        <div 
          className={cn(
            'thumbnail-fallback w-full h-full flex items-center justify-center',
            'bg-gradient-to-br',
            gradient,
            { 'hidden': thumbnail }
          )}
        >
          <FileText className="h-12 w-12 text-white opacity-90" />
        </div>
        
        {/* Category badge */}
        {category && (
          <div className="absolute top-3 right-3">
            <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-white/90 dark:bg-gray-900/90 text-gray-800 dark:text-gray-100 shadow-sm">
              {category}
            </span>
          </div>
        )}
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>
      
      {/* Card content */}
      <div className="flex-1 p-5 flex flex-col">
        <CardHeader className="p-0 mb-3">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white line-clamp-2 leading-tight">
            {title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
            {description}
          </p>
        </CardHeader>
        
        <CardContent className="p-0 mt-auto">
          <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-2 text-blue-500 flex-shrink-0" />
              <span className="font-medium">{formatDuration(duration)}</span>
            </div>
            <div className="flex items-center">
              <FileText className="h-4 w-4 mr-2 text-emerald-500 flex-shrink-0" />
              <span>{questionCount} {questionCount === 1 ? 'Question' : 'Questions'}</span>
            </div>
            {passingScore > 0 && (
              <div className="flex items-center">
                <Award className="h-4 w-4 mr-2 text-amber-500 flex-shrink-0" />
                <span>Passing Score: <span className="font-medium">{passingScore}%</span></span>
              </div>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="p-0 mt-6">
          <Button 
            className="w-full group/button" 
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              if (onClick) onClick();
            }}
          >
            Start Test
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/button:translate-x-1" />
          </Button>
        </CardFooter>
      </div>
      
      {/* Hover effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-transparent group-hover:from-blue-500/5 group-hover:via-transparent group-hover:to-transparent transition-all duration-300 pointer-events-none" />
    </div>
  );
};


