import React, { useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';

// Testimonial data
const testimonials = [
  {
    id: 1,
    name: "Rohan Kumar",
    role: "",
    image: "https://i.postimg.cc/bdfPPHk6/rahul.png",
    text: "DATA-TECH's Advanced Data Science course completely transformed my career. The hands-on projects and real-world applications gave me the skills I needed to land my dream job at Tesla. The instructors were phenomenal and always available for support.",
  },
  {
    id: 2,
    name: "Anshul Trivedi",
    role: "",
    image: "https://i.postimg.cc/wBVXqK6q/ret.jpg",
    text: "As someone transitioning from a different field, I was worried about keeping up. DATA-TECH's structured curriculum and supportive community made learning complex AI concepts accessible. The interactive 3D visualizations helped me understand neural networks intuitively.",
  },
];

const TestimonialsSection: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.2 });

  const nextTestimonial = () => {
    setActiveIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setActiveIndex((prevIndex) => (prevIndex - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <section 
      id="testimonials"
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
            Student <span className="gradient-text">Success Stories</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="section-subtitle"
          >
            Hear from our graduates who transformed their careers with DATA-TECH.
          </motion.p>
        </div>
        
        <div className="max-w-4xl mx-auto relative">
          <div className="absolute -top-10 -left-10 text-primary-500/20 dark:text-primary-500/10">
            <Quote className="w-24 h-24" />
          </div>
          
          <motion.div 
            key={activeIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.5 }}
            className="glass-card p-8 md:p-12"
          >
            <p className="text-lg md:text-xl font-medium mb-8 relative z-10">
              "{testimonials[activeIndex].text}"
            </p>
            
            <div className="flex items-center">
              <div className="w-16 h-16 rounded-full overflow-hidden mr-4">
                <img 
                  src={testimonials[activeIndex].image} 
                  alt={testimonials[activeIndex].name} 
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h4 className="font-bold text-lg">{testimonials[activeIndex].name}</h4>
                <p className="text-primary-500 dark:text-primary-400">{testimonials[activeIndex].role}</p>
              </div>
            </div>
          </motion.div>
          
          <div className="flex justify-center mt-8 space-x-4">
            <button 
              onClick={prevTestimonial}
              className="p-3 rounded-full bg-dark-100 dark:bg-dark-700 text-dark-700 dark:text-white hover:bg-primary-500 hover:text-white transition-colors"
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center space-x-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveIndex(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === activeIndex 
                      ? 'bg-primary-500' 
                      : 'bg-dark-300 dark:bg-dark-600 hover:bg-primary-400'
                  }`}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>
            <button 
              onClick={nextTestimonial}
              className="p-3 rounded-full bg-dark-100 dark:bg-dark-700 text-dark-700 dark:text-white hover:bg-primary-500 hover:text-white transition-colors"
              aria-label="Next testimonial"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;