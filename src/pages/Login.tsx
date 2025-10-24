import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Loader2 } from 'lucide-react';
import { AnimatedText } from '../components/ui/AnimatedText';
import { useAuth } from '../contexts/AuthContext';
import { sendVerificationEmail as sendVerification } from '../Services/appwrite';

const LoginPage: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResendVerification, setShowResendVerification] = useState(false);
  const [resendStatus, setResendStatus] = useState<{success?: boolean; message: string} | null>(null);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();

  // Check for deactivation message in location state
  useEffect(() => {
    if (location.state?.error) {
      setError(location.state.error);
      // Clear the location state to prevent showing the message again on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);
  
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const fromPath = location.state?.from?.startsWith('/') ? location.state.from : '/';
      // Only navigate if we're not showing a deactivation message
      if (!location.state?.error) {
        navigate(fromPath, { replace: true });
      }
    }
  }, [isAuthenticated, navigate, location.state]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    try {
      setError('');
      setResendStatus(null);
      setIsSubmitting(true);
      
      console.log('Attempting to login with:', { email: formData.email });
      
      // Use the login function from AuthContext
      const result = await login(formData.email, formData.password);
      console.log('Login result:', result);
      
      if (!result.isAuthenticated || !result.user) {
        const errorMsg = result.error || 'Login failed. Please check your credentials.';
        console.error('Login failed:', errorMsg);
        throw new Error(errorMsg);
      }
      
      console.log('Login successful, user:', result.user);
      
    } catch (err: any) {
      console.error('Login error details:', {
        name: err.name,
        message: err.message,
        stack: err.stack,
        code: err.code,
        response: err.response?.data || 'No response data'
      });
      
      let errorMessage = "Login failed. Please try again.";
      const errorMsg = err.message || '';
      
      // Check for specific error messages
      if (errorMsg.includes('ACCOUNT_DEACTIVATED:')) {
        // Extract everything after the prefix for a clean message
        errorMessage = errorMsg.split('ACCOUNT_DEACTIVATED:')[1].trim();
      } else if (errorMsg.toLowerCase().includes('deactivated')) {
        errorMessage = "YOUR PROFILE IS DEACTIVATED BY THE ADMIN. PLEASE CONTACT YOUR ADMIN.";
      } else if (errorMsg.toLowerCase().includes('invalid') || 
                errorMsg.toLowerCase().includes('credentials') ||
                errorMsg.toLowerCase().includes('user') || 
                errorMsg.toLowerCase().includes('password')) {
        errorMessage = "Invalid email or password.";
      } else if (errorMsg.toLowerCase().includes('emailverification') || 
                errorMsg.toLowerCase().includes('verify') ||
                errorMsg.toLowerCase().includes('not confirmed')) {
        errorMessage = "Please verify your email before logging in.";
        setShowResendVerification(true);
      } else if (errorMsg.toLowerCase().includes('rate limit') || 
                errorMsg.toLowerCase().includes('too many')) {
        errorMessage = "Too many attempts. Please wait before trying again.";
      } else if (errorMsg.toLowerCase().includes('network') || 
                errorMsg.toLowerCase().includes('offline')) {
        errorMessage = "Network error. Please check your internet connection.";
      }
      
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="relative min-h-screen pt-24 pb-16 overflow-hidden"
    >
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
      <div className="container relative z-10 mx-auto px-4 max-w-md">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">
            Welcome <span className="text-primary-600 dark:text-primary-400">Back</span>
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Sign in to access your dashboard
          </p>
        </div>

        {(error || resendStatus) && (
          <div className={`mb-6 p-4 rounded-lg border ${
            resendStatus?.success 
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800'
              : error?.toLowerCase().includes('deactivated')
                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800'
                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800'
          }`}>
            <div className="flex items-start">
              {error?.toLowerCase().includes('deactivated') && (
                <svg className="h-5 w-5 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              )}
              <div>
                <p className="font-medium">
                  {resendStatus?.message || error}
                </p>
                {error?.toLowerCase().includes('deactivated') && (
                  <p className="mt-1 text-sm">
                    Please contact the administrator at <span className="font-semibold">admin@datatechi.com</span> for assistance.
                  </p>
                )}
              </div>
            </div>
            
            {showResendVerification && !resendStatus && (
              <div className="mt-2 text-center">
                <button 
                  onClick={async () => {
                    try {
                      setResendStatus({ message: 'Sending verification email...' });
                      const success = await sendVerification(formData.email);
                      if (success) {
                        setResendStatus({
                          success: true,
                          message: 'Verification email sent. Please check your inbox.'
                        });
                      } else {
                        throw new Error('Failed to send verification email');
                      }
                    } catch (err) {
                      console.error('Resend verification error:', err);
                      setResendStatus({
                        success: false,
                        message: 'Failed to send verification email. Please try again later.'
                      });
                    }
                  }}
                  className="text-sm font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 disabled:opacity-50"
                  disabled={!!resendStatus}
                >
                  Resend verification email
                </button>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-dark-800 p-8 rounded-xl shadow-sm border border-gray-200 dark:border-dark-700">
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="pl-10 w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-dark-600 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-dark-700 dark:text-white"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="pl-10 w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-dark-600 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-dark-700 dark:text-white"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="rememberMe"
                  name="rememberMe"
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded dark:bg-dark-700 dark:border-dark-600"
                />
                <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Remember me
                </label>
              </div>

              <Link 
                to="/forgot-password" 
                className="text-sm text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          <div className="w-full">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full shadow__btn py-3 px-4 rounded-lg flex justify-center items-center"
              style={{
                background: 'rgb(0,140,255)',
                boxShadow: '0 0 25px rgb(0,140,255)',
                border: 'none',
                fontSize: '0.875rem',
                color: '#fff',
                letterSpacing: '1px',
                fontWeight: 500,
                textTransform: 'uppercase',
                transition: 'box-shadow 0.5s',
                opacity: isSubmitting ? 0.7 : 1,
                cursor: isSubmitting ? 'not-allowed' : 'pointer'
              }}
              onMouseOver={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.boxShadow = '0 0 5px rgb(0,140,255), 0 0 25px rgb(0,140,255), 0 0 50px rgb(0,140,255), 0 0 100px rgb(0,140,255)';
                }
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.boxShadow = '0 0 25px rgb(0,140,255)';
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                  Signing in...
                </>
              ) : (
                'SIGN IN'
              )}
            </button>
          </div>
        </form>

        <div className="mt-8 text-center">
          <AnimatedText
            staticText="Don't have an account? "
            animatedTexts={["Join now!", "Sign up here"]}
            linkTo="/signup"
          />
        </div>
      </div>
    </motion.div>
  );
};

export default LoginPage;