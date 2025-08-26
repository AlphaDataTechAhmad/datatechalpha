import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import HeroSection from '../components/sections/HeroSection';
import AboutSection from '../components/sections/AboutSection';
import CoursesSection from '../components/sections/CoursesSection';
import TestimonialsSection from '../components/sections/TestimonialsSection';
import ContactSection from '../components/sections/ContactSection';

// Dynamically import BannerSlider with SSR disabled to avoid window is not defined error
const BannerSlider = dynamic(() => import('../components/sections/BannerSlider'), { ssr: false });
const HomePage: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  return (
    <div className="relative min-h-screen">
      {/* Background with gradient and grid pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-dark-900 dark:to-dark-800 z-0" />
      
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 -z-10 opacity-30 dark:opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#4b5563_1px,transparent_1px)] [background-size:16px_16px]"></div>
      </div>
      
      {/* Animated gradient overlay */}
      <motion.div 
        className="absolute inset-0 -z-10 opacity-50 dark:opacity-30"
        initial={{ 
          background: 'linear-gradient(45deg, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.1))'
        }}
        animate={{
          background: [
            'linear-gradient(45deg, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.1))',
            'linear-gradient(135deg, rgba(168, 85, 247, 0.1), rgba(236, 72, 153, 0.1))',
            'linear-gradient(225deg, rgba(236, 72, 153, 0.1), rgba(245, 158, 11, 0.1))',
            'linear-gradient(315deg, rgba(245, 158, 11, 0.1), rgba(99, 102, 241, 0.1))'
          ]
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'linear'
        }}
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-0 pt-16 relative z-10"
      >
      <div className="w-full">
        <BannerSlider />
      </div>
      <HeroSection />
      <AboutSection />
      <CoursesSection />
      <TestimonialsSection />
      <ContactSection />
      </motion.div>
    </div>
  );
};

export default HomePage;