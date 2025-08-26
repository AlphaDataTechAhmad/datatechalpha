import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { Star, ArrowRight } from 'lucide-react';

import { 
  sqlCourses, 
  pythonCourses, 
  sscCourses, 
  bankingCourses, 
  machineLearningCourses,
  Course 
} from '../../pages/courseData';


// Define course categories
const courseCategories = [
  {
    id: 'programming',
    name: 'Programming',
    courses: [...sqlCourses, ...pythonCourses]
  },
  {
    id: 'banking',
    name: 'Banking Exams',
    courses: [...bankingCourses]
  },
  {
    id: 'ssc',
    name: 'SSC Exams',
    courses: [...sscCourses]
  },
  {
    id: 'ai-ml',
    name: 'AI & ML',
    courses: [...machineLearningCourses]
  }
];

interface CourseCardProps {
  course: Course & {
    rating?: number;
    students?: string | number;
    category?: string;
  };
  index: number;
}

const CourseCard: React.FC<CourseCardProps> = ({ course, index }) => {
  const navigate = useNavigate();
  
  const formatPrice = (price?: number) => {
    if (!price) return 'Free';
    return `₹${price.toLocaleString()}`;
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
        className="glass-card group overflow-hidden transition-all duration-300 hover:shadow-neon-lg hover:-translate-y-2 flex flex-col h-full"
      >
        <div className="h-48 overflow-hidden relative">
          <div className="absolute top-3 left-3 z-10 bg-secondary-500 text-white text-xs font-medium py-1 px-2 rounded">
            {course.level || 'Beginner'}
          </div>
          <div className="absolute top-3 right-3 z-10 bg-dark-800/70 backdrop-blur-sm text-white text-xs font-medium py-1 px-2 rounded flex items-center gap-1">
            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
            {course.rating || '4.5'}
          </div>
          <img 
            src={course.image || 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'} 
            alt={course.title} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-dark-900/80 to-transparent" />
        </div>
        
        <div className="p-6 flex flex-col flex-grow">
          <h3 className="text-xl font-bold mb-2 group-hover:text-primary-500 transition-colors">
            {course.title}
          </h3>
          <p className="text-dark-500 dark:text-dark-300 text-sm mb-2 flex-grow">
            {course.description}
          </p>
          
          <div className="mb-3">
            <span className="text-2xl font-bold text-primary-500">
              {formatPrice(course.price)}
            </span>
            {course.originalPrice && (
              <span className="ml-2 text-sm text-gray-400 line-through">
                {formatPrice(course.originalPrice)}
              </span>
            )}
          </div>
          
          <div className="mt-4 flex justify-between items-center">
            <div className="bg-primary-500/10 dark:bg-primary-900/20 text-primary-500 text-xs py-1 px-2 rounded">
              {course.level || 'Beginner'}
            </div>
            <button 
              onClick={() => navigate(`/courses/${course.id}`)}
              className="text-primary-500 font-medium flex items-center gap-1 text-sm group-hover:text-primary-400 transition-colors"
            >
              Learn More
              <ArrowRight className="w-4 h-4 transform transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </motion.div>


    </>
  );
};

const CoursesSection: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.2 });
  const [selectedCategory, setSelectedCategory] = useState(courseCategories[0].id);
  const [visibleCourses, setVisibleCourses] = useState(8);

  const currentCategory = courseCategories.find(cat => cat.id === selectedCategory) || courseCategories[0];
  const displayedCourses = currentCategory?.courses?.slice(0, visibleCourses) || [];
  
  // Handle loading more courses
  const handleLoadMore = () => {
    setVisibleCourses(prev => prev + 8);
  };

  return (
    <section 
      id="courses"
      ref={sectionRef}
      className="py-20 md:py-24 relative"
    >
      <div className="container mx-auto px-4 relative">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6 }}
            className="section-title"
          >
            Cutting-Edge <span className="gradient-text">Courses</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="section-subtitle"
          >
            Explore our innovative curriculum designed to equip you with the skills of tomorrow.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-wrap justify-center gap-3 mb-8 overflow-x-auto pb-2"
          >
            {courseCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-primary-500 text-white shadow-md'
                    : 'bg-white dark:bg-dark-700 text-dark-700 dark:text-white hover:bg-gray-100 dark:hover:bg-dark-600'
                }`}
              >
                {category.name} ({category.courses.length})
              </button>
            ))}
          </motion.div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {displayedCourses.map((course, index) => {
            const courseData: CourseCardProps['course'] = {
              ...course,
              rating: typeof course.rating === 'number' ? course.rating : 4.5,
              students: course.students ? String(course.students) : '1000+',
              category: currentCategory.name,
              level: course.level || 'Beginner',
              duration: course.duration || '12 weeks',
              price: course.price,
              originalPrice: course.originalPrice,
              image: course.image,
              title: course.title,
              description: course.description,
              id: course.id
            };
            
            return (
<CourseCard 
                key={`${course.id}-${index}`} 
                course={courseData}
                index={index} 
              />
            );
          })}
        </div>
        
        {currentCategory.courses && currentCategory.courses.length > visibleCourses && (
          <div className="text-center mt-12">
            <button 
              onClick={handleLoadMore}
              className="px-8 py-3 bg-primary-500 text-white rounded-full font-medium hover:bg-primary-600 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Load More Courses
            </button>
          </div>
        )}
        
        <div className="text-center mt-12">
          <motion.a 
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            href="/courses" 
            className="btn btn-outline inline-flex items-center gap-2 group"
          >
            View All Courses
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </motion.a>
        </div>
      </div>
    </section>
  );
};

export default CoursesSection;