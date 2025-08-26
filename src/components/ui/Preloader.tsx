import React from 'react';
import { motion } from 'framer-motion';
import Logo from './Logo';

const Preloader: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-dark-900 flex flex-col items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <Logo className="h-16 w-auto" />
      </motion.div>
      
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: 300 }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
        className="h-1 bg-gradient-to-r from-primary-500 via-secondary-500 to-accent-500 rounded-full"
      />
      
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="mt-6 text-white font-medium"
      >
        Initializing Future Learning...
      </motion.p>
    </div>
  );
};

export default Preloader;