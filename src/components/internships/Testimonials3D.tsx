import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";

export interface Testimonial {
  id: string;
  name: string;
  company: string;
  package: string;
  year: string;
  district: string;
  state: string;
  rating: number;
  comment: string;
  avatar: string;
}

interface Testimonials3DProps {
  testimonials: Testimonial[];
}

// Modern Testimonial Card (Integrated)
const ModernTestimonialCard: React.FC<Testimonial> = ({
  name,
  company,
  package: pkg,
  year,
  district,
  state,
  rating,
  comment,
  avatar,
}) => {
  return (
    <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 text-white rounded-2xl p-6 w-full max-w-[340px] sm:max-w-[360px] shadow-2xl transition-all duration-300 hover:shadow-[0_10px_30px_rgba(59,130,246,0.3)] hover:-translate-y-1 overflow-hidden group">
      {/* Decorative elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 to-purple-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
      
      {/* Card content */}
      <div className="relative z-10 h-full flex flex-col">
        {/* Header with avatar and name */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur opacity-75 group-hover:opacity-100 transition-opacity duration-300"></div>
            <img
              src={avatar}
              alt={name}
              className="relative w-14 h-14 rounded-full object-cover border-2 border-gray-700 group-hover:border-blue-500 transition-all duration-300"
            />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors duration-300">{name}</h3>
            <p className="text-sm text-blue-400/80 font-medium">{company}</p>
          </div>
        </div>

        {/* Rating */}
        <div className="flex items-center mb-6">
          <div className="flex space-x-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-5 h-5 transition-all duration-200 ${
                  i < rating 
                    ? "text-yellow-400 fill-yellow-400 group-hover:scale-110" 
                    : "text-gray-600 group-hover:text-gray-500"
                }`}
                style={{ transitionDelay: `${i * 50}ms` }}
              />
            ))}
          </div>
          <span className="ml-2 text-sm font-medium text-gray-400">{rating}/5</span>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-gray-700/30 backdrop-blur-sm rounded-xl p-3 border border-gray-700/50 group-hover:border-blue-500/30 transition-all duration-300">
            <p className="text-xs font-medium text-gray-400 mb-1">Package</p>
            <p className="font-semibold text-white">{pkg}</p>
          </div>
          <div className="bg-gray-700/30 backdrop-blur-sm rounded-xl p-3 border border-gray-700/50 group-hover:border-blue-500/30 transition-all duration-300">
            <p className="text-xs font-medium text-gray-400 mb-1">Year</p>
            <p className="font-semibold text-white">{year}</p>
          </div>
          <div className="col-span-2 bg-gray-700/30 backdrop-blur-sm rounded-xl p-3 border border-gray-700/50 group-hover:border-blue-500/30 transition-all duration-300">
            <p className="text-xs font-medium text-gray-400 mb-1">Location</p>
            <p className="font-semibold text-white capitalize">{district}, {state}</p>
          </div>
        </div>

        {/* Comment */}
        {comment && (
          <div className="mt-auto pt-4 border-t border-gray-700/50">
            <p className="text-sm text-gray-300 italic leading-relaxed">
              "{comment}"
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const Testimonials3D: React.FC<Testimonials3DProps> = ({ testimonials }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const isInView = useInView(ref, { once: true, amount: 0.1 });
  const [isMobile, setIsMobile] = useState(false);

  // Auto avatar generator if missing
  const enhancedTestimonials = useMemo(() => {
    return testimonials.map((t, i) => ({
      ...t,
      id: t.id || `testimonial-${i}`,
      avatar:
        t.avatar ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(
          t.name
        )}&background=4f46e5&color=fff`,
    }));
  }, [testimonials]);

  // Responsive check
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Auto-scroll with proper handling for two cards
  useEffect(() => {
    if (isInView && !isPaused) {
      const interval = setInterval(() => {
        setCurrentIndex(prev => {
          // Move by 2 for desktop (showing 2 cards), by 1 for mobile
          const step = isMobile ? 1 : 2;
          return (prev + step) % enhancedTestimonials.length;
        });
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isInView, isPaused, enhancedTestimonials.length, isMobile]);

  const goToPrev = useCallback(() => {
    setCurrentIndex(prev => {
      // Move back by 2 for desktop (showing 2 cards), by 1 for mobile
      const step = isMobile ? 1 : 2;
      return prev - step < 0 ? enhancedTestimonials.length - step : prev - step;
    });
  }, [enhancedTestimonials.length, isMobile]);

  const goToNext = useCallback(() => {
    setCurrentIndex(prev => {
      // Move forward by 2 for desktop (showing 2 cards), by 1 for mobile
      const step = isMobile ? 1 : 2;
      return (prev + step) % enhancedTestimonials.length;
    });
  }, [enhancedTestimonials.length, isMobile]);

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  return (
    <div className="relative overflow-hidden">
      <section
        ref={ref}
        className="relative pt-11 pb-8 px-10 mx-4 rounded-3xl overflow-hidden bg-gradient-to-b from-blue-50 to-gray-50 dark:from-gray-900 dark:to-gray-800"
      >
      {/* Heading */}
      <motion.h2
        className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 20 }}
        transition={{ duration: 0.6 }}
      >
        What Our{" "}
        <span className="text-blue-600 dark:text-blue-400">Students</span> Say
      </motion.h2>

      {/* Carousel */}
      <div
        className="relative w-full overflow-hidden"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setTimeout(() => setIsPaused(false), 2000)}
      >
        {/* Navigation Arrows */}
        <button
          onClick={goToPrev}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-white dark:bg-gray-800 p-2 rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 focus:ring-2 focus:ring-blue-500"
        >
          <ChevronLeft className="w-6 h-6 text-gray-700 dark:text-gray-200" />
        </button>
        <button
          onClick={goToNext}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-white dark:bg-gray-800 p-2 rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 focus:ring-2 focus:ring-blue-500"
        >
          <ChevronRight className="w-6 h-6 text-gray-700 dark:text-gray-200" />
        </button>

        {/* Cards */}
        <div className="w-full max-w-4xl mx-auto px-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ 
                opacity: 1, 
                y: 0,
                transition: { 
                  duration: 0.5,
                  staggerChildren: 0.1
                } 
              }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-wrap justify-center gap-4 md:gap-6 w-full"
            >
              {isMobile ? (
                <motion.div
                  key={`mobile-${currentIndex}`}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.3 }}
                >
                  <ModernTestimonialCard {...enhancedTestimonials[currentIndex]} />
                </motion.div>
              ) : (
                [
                  currentIndex,
                  (currentIndex + 1) % enhancedTestimonials.length
                ].map((index, i) => (
                  <motion.div
                    key={`desktop-${index}-${i}`}
                    initial={{ opacity: 0, x: i === 0 ? -50 : 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: i === 0 ? -50 : 50 }}
                    transition={{ 
                      duration: 0.3,
                      delay: i * 0.1
                    }}
                    className="w-full max-w-[360px]"
                  >
                    <ModernTestimonialCard {...enhancedTestimonials[index]} />
                  </motion.div>
                ))
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Dots */}
        <div className="flex justify-center mt-8 space-x-2">
          {Array.from({ 
            length: Math.ceil(enhancedTestimonials.length / (isMobile ? 1 : 2)) 
          }).map((_, index) => {
            const isActive = isMobile 
              ? index === currentIndex 
              : (currentIndex <= index * 2 && currentIndex + 1 >= index * 2);
              
            return (
              <motion.button
                key={index}
                onClick={() => goToSlide(index * (isMobile ? 1 : 2))}
                className={`h-3 rounded-full transition-all duration-300 ${
                  isActive
                    ? "bg-blue-600 dark:bg-blue-500"
                    : "bg-gray-300 dark:bg-gray-600"
                }`}
                animate={{
                  width: isActive ? 30 : 12,
                  opacity: isActive ? 1 : 0.6,
                }}
                whileHover={{ scale: 1.1 }}
              />
            );
          })}
        </div>
      </div>
    </section>
    </div>
  );
};

export default Testimonials3D;
