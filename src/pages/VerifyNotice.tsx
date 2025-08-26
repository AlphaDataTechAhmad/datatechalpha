import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Check } from 'lucide-react';
import { sendVerificationEmail } from '../Services/appwrite';

const VerifyNoticePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || 'your email';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-900"
    >
      <div className="bg-white dark:bg-dark-800 p-8 rounded-xl shadow-sm border border-gray-200 dark:border-dark-700 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
            <Mail className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Verify Your Email
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            We've sent a verification link to <span className="font-medium">{email}</span>
          </p>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <Check className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Didn't receive the email? Check your spam folder or{' '}
                <button 
                  onClick={async () => {
                    try {
                      await sendVerificationEmail();
                      alert('Verification email resent!');
                    } catch (error) {
                      alert('Failed to resend verification email. Please try again later.');
                    }
                  }}
                  className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 underline"
                >
                  click here to resend
                </button>
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => navigate('/login')}
          className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          Return to Login
        </button>
      </div>
    </motion.div>
  );
};

export default VerifyNoticePage;