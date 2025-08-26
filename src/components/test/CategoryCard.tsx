import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Star, BookOpen, ChevronRight, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CategoryCardProps {
  category: {
    $id: string;
    title: string;
    description: string;
    thumbnail: string;
    rating?: number;
    languages?: string[];
    attempts?: number;
    TestId?: string[];
  };
  testCount: number;
  onClick: () => void;
}

// Color variants for different categories
const categoryColors = [
  'bg-gradient-to-r from-blue-500 to-blue-600',
  'bg-gradient-to-r from-purple-500 to-pink-500',
  'bg-gradient-to-r from-green-500 to-teal-500',
  'bg-gradient-to-r from-yellow-500 to-orange-500',
  'bg-gradient-to-r from-red-500 to-pink-500',
  'bg-gradient-to-r from-indigo-500 to-purple-600',
];

// Function to get a consistent color based on category ID
const getCategoryColor = (id: string) => {
  const index = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % categoryColors.length;
  return categoryColors[index];
};

export function CategoryCard({ category, testCount, onClick }: CategoryCardProps) {
  const colorClass = getCategoryColor(category.$id);
  
  return (
    <div className="w-full h-full px-1 py-1">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ 
          y: -4, 
          transition: { 
            type: 'spring',
            stiffness: 400,
            damping: 15,
            duration: 0.2
          }
        }}
        className="h-full w-full"
      >
        <Card className="overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200 h-full flex flex-col w-full bg-white dark:bg-gray-800 hover:shadow-lg dark:hover:shadow-gray-700/50">
        {/* Header with colored background */}
        <div className="relative h-2 w-full overflow-hidden">
          <motion.div 
            className={cn("h-full w-full", colorClass)}
            whileHover={{ height: 4, transition: { duration: 0.2 } }}
          />
        </div>
        
        <CardContent className="p-5 flex flex-col flex-grow">
          <motion.div 
            className="flex items-start gap-4 mb-4"
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.2 }}
          >
            <div className={cn("p-3 rounded-xl flex-shrink-0 mt-1", colorClass, 'bg-opacity-10')}>
              {category.thumbnail ? (
                <img
                  src={category.thumbnail}
                  alt={category.title}
                  className="w-10 h-10 object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const fallback = document.createElement('div');
                    fallback.innerHTML = '<BookOpen className="w-6 h-6 text-current" />';
                    target.parentNode?.insertBefore(fallback.firstChild!, target.nextSibling);
                  }}
                />
              ) : (
                <BookOpen className="w-6 h-6 text-current" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-2 leading-tight">
                  {category.title || 'Uncategorized'}
                </h3>
                
                {/* Rating */}
                {category.rating !== undefined && (
                  <div className="flex items-center mt-1">
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-3.5 h-3.5 ${i < Math.floor(category.rating || 0) ? 'fill-current' : ''} ${i > 0 ? 'ml-0.5' : ''}`} 
                        />
                      ))}
                    </div>
                    <span className="ml-1.5 text-xs text-gray-600 dark:text-gray-400">
                      {category.rating.toFixed(1)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
          
          {/* Description */}
          <motion.p 
            className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-3 flex-grow leading-relaxed"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.2 }}
          >
            {category.description || 'No description available'}
          </motion.p>
          
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {/* Languages */}
            <motion.div 
              className="space-y-1.5"
              whileHover={{ scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            >
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Languages</p>
              <div className="flex flex-wrap gap-1.5">
                {category.languages && category.languages.length > 0 ? (
                  category.languages.slice(0, 2).map((lang, index) => (
                    <motion.span 
                      key={index}
                      className="text-[11px] px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full inline-block whitespace-nowrap overflow-hidden text-ellipsis max-w-full"
                      whileHover={{ scale: 1.05 }}
                      transition={{ type: 'spring', stiffness: 500 }}
                      title={lang}
                    >
                      {lang}
                    </motion.span>
                  ))
                ) : (
                  <span className="text-xs text-gray-400">-</span>
                )}
              </div>
            </motion.div>
            
            {/* Attempts */}
            <motion.div 
              className="space-y-1.5"
              whileHover={{ scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            >
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Attempts</p>
              <motion.div 
                className="flex items-center"
                whileHover={{ x: 1 }}
              >
                <motion.div
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{ duration: 1.8, repeat: Infinity, repeatType: 'reverse' }}
                  className="flex-shrink-0"
                >
                  <Users className="w-3.5 h-3.5 text-gray-400" />
                </motion.div>
                <span className="text-xs font-medium text-gray-900 dark:text-white ml-1.5">
                  {category.attempts !== undefined ? (
                    <motion.span 
                      className="px-2 py-0.5 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full inline-flex items-center"
                      whileHover={{ scale: 1.05 }}
                      transition={{ type: 'spring', stiffness: 500 }}
                    >
                      {category.attempts >= 1000 
                        ? `${(category.attempts / 1000).toFixed(1)}k` 
                        : category.attempts.toLocaleString()}
                    </motion.span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </span>
              </motion.div>
            </motion.div>
          </div>
          
          {/* Footer */}
          <div className="mt-auto pt-3 border-t border-gray-100 dark:border-gray-700">
            <motion.div 
              className="w-full"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.3 }}
            >
              <Button 
                variant="outline" 
                className="w-full flex items-center justify-between group bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                onClick={(e) => {
                  e.stopPropagation();
                  onClick();
                }}
              >
                View Tests
                <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </motion.div>
          </div>
        </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}