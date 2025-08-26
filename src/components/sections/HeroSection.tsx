import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import GradientButton from '../ui/GradientButton';
import AnimatedButton from '../ui/AnimatedButton';
import { gsap } from 'gsap';
import SplitText from './SplitText';
import DataTechText from '../three/DataTechText';
import CountUp from '../ui/CountUp';

const HeroSection: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current || !textRef.current) return;

    // Parallax effect
    gsap.to(textRef.current, {
      y: '30%',
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top top',
        end: 'bottom top',
        scrub: true,
      },
    });
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  return (
    <section 
      id="hero-section"
      ref={sectionRef}
      className="relative min-h-[90vh] flex items-center pt-24 pb-16"
    >
      {/* Animated gradient overlay */}
      <motion.div 
        className="absolute inset-0 -z-10 opacity-30 dark:opacity-20"
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
      
      {/* Animated Blobs */}
      <motion.div 
        className="absolute -top-48 -right-48 w-96 h-96 rounded-full bg-blue-200/40 dark:bg-blue-400/20 blur-3xl"
        animate={{
          x: [0, 30, 0],
          y: [0, -30, 0],
          scale: [1, 1.1, 1]
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      />
      
      <motion.div 
        className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-indigo-200/40 dark:bg-purple-400/20 blur-3xl"
        animate={{
          x: [0, -20, 0],
          y: [0, 20, 0],
          scale: [1, 0.95, 1.05]
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 2
        }}
      />

      {/* Content Container */}
      <div className="container mx-auto px-4 relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Text Content */}
          <motion.div
            ref={textRef}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6 mt-16"
          >
            <div className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
              <div className="text-indigo-600 dark:text-yellow-300">
                <SplitText
                  text="Learn Future,"
                  className="inline-block"
                  delay={0.1}
                  duration={0.8}
                  ease="power3.out"
                  splitType="chars"
                  from={{ opacity: 0, y: 40 }}
                  to={{ opacity: 1, y: 0 }}
                  threshold={0.1}
                  rootMargin="-100px"
                  stagger={0.03}
                />
              </div>
              <div className="text-gray-900 dark:text-white">
                <SplitText
                  text="Live Future"
                  className="inline-block"
                  delay={0.3}
                  duration={0.8}
                  ease="power3.out"
                  splitType="chars"
                  from={{ opacity: 0, y: 40 }}
                  to={{ opacity: 1, y: 0 }}
                  threshold={0.1}
                  rootMargin="-100px"
                  stagger={0.03}
                />
              </div>
            </div>

            <motion.p 
              variants={itemVariants}
              className="text-lg md:text-xl text-gray-600 dark:text-white/90 max-w-lg"
            >
              Cutting-edge courses in data science, AI, and technology. Start your journey to mastering the skills of tomorrow, today.
            </motion.p>

            <motion.div 
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-4"
            >
              <GradientButton 
                href="#courses"
                icon={<ArrowRight className="h-5 w-5" />}
              >
                Explore Courses
              </GradientButton>
              <AnimatedButton 
                href="#about"
                color="#4f46e5"
                className="bg-white/80 dark:bg-white/10 hover:bg-white/90 dark:hover:bg-white/20 text-indigo-600 dark:text-white border border-indigo-100 dark:border-white/10"
              >
                Learn More
              </AnimatedButton>
            </motion.div>


          </motion.div>

          {/* 3D Text */}
          <div className="h-[450px] w-full hidden lg:block">
            <DataTechText className="w-full h-full" />
          </div>
        </div>
      </div>

      {/* Scroll Down Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
        <span className="text-sm text-dark-500 dark:text-dark-300 mb-2">Scroll Down</span>
        <motion.div 
          animate={{ y: [0, 10, 0] }} 
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="h-10 w-6 rounded-full border-2 border-dark-500 dark:border-dark-300 flex justify-center pt-1"
        >
          <motion.div 
            animate={{ height: [0, 5, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="w-1 bg-dark-500 dark:bg-dark-300 rounded-full"
          />
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;