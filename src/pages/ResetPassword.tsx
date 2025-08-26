import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { resetPassword } from '../Services/appwrite';

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    type: 'success' | 'error';
  } | null>(null);
  const [isValidLink, setIsValidLink] = useState<boolean | null>(null);

  const userId = searchParams.get('userId');
  const secret = searchParams.get('secret');

  useEffect(() => {
    // Check if we have the required parameters
    if (!userId || !secret) {
      setMessage({
        text: 'Invalid or expired reset link. Please request a new one.',
        type: 'error',
      });
      setIsValidLink(false);
    } else {
      setIsValidLink(true);
    }
  }, [userId, secret]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password || !confirmPassword) {
      setMessage({ text: 'Please fill in all fields', type: 'error' });
      return;
    }

    if (password !== confirmPassword) {
      setMessage({ text: 'Passwords do not match', type: 'error' });
      return;
    }

    if (!userId || !secret) {
      setMessage({
        text: 'Invalid reset link',
        type: 'error',
      });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      await resetPassword(userId, secret, password, confirmPassword);
      setMessage({
        text: 'Your password has been reset successfully!',
        type: 'success',
      });
      
      // Redirect to login after a short delay
      setTimeout(() => {
        navigate('/login', {
          state: { message: 'Password reset successful. Please log in with your new password.' }
        });
      }, 3000);
      
    } catch (error: any) {
      console.error('Password reset error:', error);
      setMessage({
        text: error.message || 'Failed to reset password. The link may have expired.',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isValidLink === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Verifying your link...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-900 py-12 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
            {isValidLink ? 'Create New Password' : 'Invalid Link'}
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {isValidLink 
              ? 'Please enter your new password below.'
              : 'The password reset link is invalid or has expired.'}
          </p>
        </div>

        <div className="mt-8 bg-white dark:bg-dark-800 py-8 px-4 shadow rounded-lg sm:px-10">
          {message && (
            <div className={`mb-6 p-4 rounded-md flex items-start ${
              message.type === 'success' 
                ? 'bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200' 
                : 'bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          {isValidLink ? (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  New Password
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 block w-full rounded-md border border-gray-300 dark:border-dark-600 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-dark-700 dark:text-white"
                    placeholder="••••••••"
                    minLength={8}
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Must be at least 8 characters
                </p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Confirm New Password
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 block w-full rounded-md border border-gray-300 dark:border-dark-600 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-dark-700 dark:text-white"
                    placeholder="••••••••"
                    minLength={8}
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isSubmitting || message?.type === 'success'}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Please request a new password reset link from the login page.
              </p>
              <Link
                to="/login"
                className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to login
              </Link>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ResetPassword;
