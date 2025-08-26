import React, { useRef, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import { Award, Lightbulb, Users, Clock } from 'lucide-react';
import { gsap } from 'gsap';

interface StatItemProps {
  icon: React.ReactNode;
  value: string;
  label: string;
}

const StatItem: React.FC<StatItemProps> = ({ icon, value, label }) => {
  return (
    <div className="glass-card p-6 flex flex-col items-center text-center">
      <div className="bg-primary-500/10 p-3 rounded-full mb-4">
        {icon}
      </div>
      <h3 className="text-3xl font-bold mb-1">{value}</h3>
      <p className="text-dark-500 dark:text-dark-300">{label}</p>
    </div>
  );
};

const AboutSection: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.3 });

  useEffect(() => {
    if (!sectionRef.current || !imageRef.current) return;

    // Parallax effect for image
    gsap.fromTo(
      imageRef.current,
      { y: '0' },
      {
        y: '20%',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      }
    );
  }, []);

  return (
    <section 
      id="about"
      ref={sectionRef} 
      className="py-20 md:py-24 relative"
    >
      <div className="container mx-auto px-4 relative">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="section-title"
          >
            About <span className="gradient-text">DATA-TECH</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
            className="section-subtitle"
          >
            We're on a mission to revolutionize tech education with immersive, cutting-edge learning experiences.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Image */}
          <div 
            ref={imageRef}
            className="h-full w-full overflow-hidden rounded-2xl shadow-xl order-2 lg:order-1"
          >
            <div className="relative w-full h-0 pb-[75%]">
              <img 
                src="https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" 
                alt="Collaborative learning at DATA-TECH" 
                className="absolute inset-0 w-full h-full object-cover rounded-2xl transform hover:scale-105 transition-transform duration-700 ease-in-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-dark-900/70 to-transparent rounded-2xl" />
              <div className="absolute bottom-6 left-6 right-6 text-white">
                <h3 className="text-2xl font-bold mb-2">Collaborative Learning</h3>
                <p className="text-white/80">Our approach focuses on real-world applications and team-based learning.</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-6 order-1 lg:order-2">
            <motion.h3 
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="text-3xl font-bold mb-4"
            >
              Transforming Education Through Technology
            </motion.h3>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
              className="text-dark-600 dark:text-dark-300"
            >
              DATA-TECH was founded in 2022 with a bold vision: to bridge the gap between traditional education and the rapidly evolving tech industry. We believe learning should be engaging, practical, and future-focused.
            </motion.p>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
              className="text-dark-600 dark:text-dark-300"
            >
              Our platform combines cutting-edge curriculum with interactive learning experiences, expert instructors, and a supportive community. We're building the future of education where technology and human potential converge.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 }}
              className="pt-4"
            >
              <a href="#courses" className="btn btn-primary">
                Explore Our Programs
              </a>
            </motion.div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
          >
            <StatItem 
              icon={<Users className="h-6 w-6 text-primary-500" />} 
              value="5,234+" 
              label="Active Students" 
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
          >
            <StatItem 
              icon={<Lightbulb className="h-6 w-6 text-primary-500" />} 
              value="50+" 
              label="Exclusive Courses" 
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 }}
          >
            <StatItem 
              icon={<Award className="h-6 w-6 text-primary-500" />} 
              value="95%" 
              label="Success Rate" 
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.4 }}
          >
            <StatItem 
              icon={<Clock className="h-6 w-6 text-primary-500" />} 
              value="24/7" 
              label="Learning Support" 
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;