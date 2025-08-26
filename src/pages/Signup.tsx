import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, Phone, Lock, Loader2, BookOpen, Users, CheckCircle, Key } from 'lucide-react';
import { AnimatedText } from '../components/ui/AnimatedText';
import { createAccountWithVerification } from '../Services/appwrite';
import { verifyTeacherID, claimTeacherID } from '../Services/teacherService';

const SignupPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
    role: 'student',
    teacherId: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<null | { valid: boolean; message: string }>(null);
  const [isTeacherIdVerified, setIsTeacherIdVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    // Reset verification status if teacher ID changes
    if (name === 'teacherId' && value !== formData.teacherId) {
      setIsTeacherIdVerified(false);
      setVerificationStatus(null);
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleTeacherIdVerification = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!formData.teacherId) {
      setVerificationStatus({ valid: false, message: 'Please enter a Teacher ID' });
      setIsTeacherIdVerified(false);
      return;
    }

    try {
      setIsVerifying(true);
      const result = await verifyTeacherID(formData.teacherId);
      setVerificationStatus(result);
      setIsTeacherIdVerified(result.valid);
      
      // Clear any previous error if verification is successful
      if (result.valid) {
        setError('');
      } else {
        setError(result.message);
      }
    } catch (error) {
      const errorMessage = 'Error verifying Teacher ID. Please try again.';
      setVerificationStatus({ valid: false, message: errorMessage });
      setIsTeacherIdVerified(false);
      setError(errorMessage);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (formData.password !== formData.confirmPassword) {
      return setError("Passwords don't match");
    }

    if (!formData.acceptTerms) {
      return setError("You must accept the terms and conditions");
    }

    // Additional validation for teacher signup
    if (formData.role === 'teacher') {
      if (!formData.teacherId) {
        return setError("Teacher ID is required");
      }
      
      if (!isTeacherIdVerified) {
        // Try to verify one more time in case the user didn't click verify
        try {
          const result = await verifyTeacherID(formData.teacherId);
          if (!result.valid) {
            return setError(result.message || "Invalid Teacher ID. Please verify your Teacher ID first.");
          }
          setIsTeacherIdVerified(true);
        } catch (error) {
          return setError("Error verifying Teacher ID. Please try again.");
        }
      }
    }

    try {
      setError('');
      setLoading(true);
      
      await createAccountWithVerification(
        formData.email, 
        formData.password, 
        formData.name,
        formData.phone,
        formData.role,
        formData.teacherId // Pass the teacher ID to the function
      );
      
      // If this is a teacher, update the teacher ID record to mark it as claimed
      if (formData.role === 'teacher' && formData.teacherId) {
        try {
          await claimTeacherID(formData.teacherId, ''); // We'll update the claimed_by field after email verification
        } catch (error) {
          console.error('Error claiming teacher ID:', error);
          // Don't fail the signup if claiming the ID fails - we can handle this later
        }
      }
      
      // Note: The teacher ID is already verified at this point and will be associated with the user's profile
      
      // Redirect to verification notice page
      navigate('/verify-notice', { 
        state: { email: formData.email } 
      });
      
    } catch (err: any) {
      let errorMessage = err.message || 'Failed to create account. Please try again.';
      
      if (err.message.includes('already exists')) {
        errorMessage = 'An account with this email already exists.';
      } else if (err.message.includes('invalid email')) {
        errorMessage = 'Please enter a valid email address.';
      } else if (err.message.includes('password')) {
        errorMessage = 'Password must be at least 8 characters.';
      }
      
      setError(errorMessage);
      console.error(err);
    } finally {
      setLoading(false);
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
          <h1 className="text-4xl font-bold mb-4">
            Get <span className="gradient-text">Started</span>
          </h1>
          <p className="text-xl text-dark-500 dark:text-dark-200">
            Create your account
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-100 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-medium text-dark-700 dark:text-dark-200">
              Full Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-dark-400" />
              </div>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                value={formData.name}
                onChange={handleInputChange}
                className="pl-10 w-full px-4 py-3 rounded-lg border border-dark-300 dark:border-dark-600 focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-dark-800"
                placeholder="Your Name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-dark-700 dark:text-dark-200">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-dark-400" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="pl-10 w-full px-4 py-3 rounded-lg border border-dark-300 dark:border-dark-600 focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-dark-800"
                placeholder="your@email.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="phone" className="block text-sm font-medium text-dark-700 dark:text-dark-200">
              Phone Number
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Phone className="h-5 w-5 text-dark-400" />
              </div>
              <input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                value={formData.phone}
                onChange={handleInputChange}
                className="pl-10 w-full px-4 py-3 rounded-lg border border-dark-300 dark:border-dark-600 focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-dark-800"
                placeholder="+91 -------"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-dark-700 dark:text-dark-200">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-dark-400" />
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleInputChange}
                className="pl-10 w-full px-4 py-3 rounded-lg border border-dark-300 dark:border-dark-600 focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-dark-800"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-dark-700 dark:text-dark-200">
              Confirm Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-dark-400" />
              </div>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="pl-10 w-full px-4 py-3 rounded-lg border border-dark-300 dark:border-dark-600 focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-dark-800"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-200">
                Register as
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className={`flex items-center justify-center p-3 border rounded-lg cursor-pointer ${
                  formData.role === 'student' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-300 dark:border-gray-600'
                }`}>
                  <input
                    type="radio"
                    name="role"
                    value="student"
                    checked={formData.role === 'student'}
                    onChange={handleInputChange}
                    className="sr-only"
                  />
                  <div className="flex flex-col items-center">
                    <BookOpen className="h-5 w-5 mb-1" />
                    <span>Student</span>
                  </div>
                </label>
                <label className={`flex items-center justify-center p-3 border rounded-lg cursor-pointer ${
                  formData.role === 'teacher' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-300 dark:border-gray-600'
                }`}>
                  <input
                    type="radio"
                    name="role"
                    value="teacher"
                    checked={formData.role === 'teacher'}
                    onChange={(e) => {
                      handleInputChange(e);
                      // Reset verification status when switching to teacher
                      if (e.target.checked) {
                        setVerificationStatus(null);
                        setIsTeacherIdVerified(false);
                      }
                    }}
                    className="sr-only"
                  />
                  <div className="flex flex-col items-center">
                    <Users className="h-5 w-5 mb-1" />
                    <span>Teacher</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Teacher ID Verification */}
            {formData.role === 'teacher' && (
              <div className="space-y-2">
                <label htmlFor="teacherId" className="block text-sm font-medium text-dark-700 dark:text-dark-200">
                  Teacher ID
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Key className="h-5 w-5 text-dark-400" />
                    </div>
                    <input
                      id="teacherId"
                      name="teacherId"
                      type="text"
                      value={formData.teacherId}
                      onChange={handleInputChange}
                      disabled={isVerifying || isTeacherIdVerified}
                      className={`pl-10 w-full px-4 py-3 rounded-lg border ${
                        verificationStatus?.valid === true
                          ? 'border-green-500 dark:border-green-600 bg-green-50 dark:bg-green-900/20'
                          : verificationStatus?.valid === false
                          ? 'border-red-500 dark:border-red-600 bg-red-50 dark:bg-red-900/20'
                          : 'border-dark-300 dark:border-dark-600 dark:bg-dark-800'
                      }`}
                      placeholder="Enter Teacher ID"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleTeacherIdVerification}
                    disabled={!formData.teacherId || isVerifying || isTeacherIdVerified}
                    className={`whitespace-nowrap px-4 py-3 rounded-lg flex items-center gap-2 ${
                      isTeacherIdVerified
                        ? 'bg-green-100 text-green-700 border border-green-300 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200'
                        : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border border-indigo-300 dark:bg-indigo-900/20 dark:border-indigo-800 dark:text-indigo-200 dark:hover:bg-indigo-800/30'
                    } ${
                      !formData.teacherId || isVerifying || isTeacherIdVerified
                        ? 'opacity-50 cursor-not-allowed'
                        : ''
                    }`}
                  >
                    {isVerifying ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : isTeacherIdVerified ? (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        Verified
                      </>
                    ) : (
                      'Verify'
                    )}
                  </button>
                </div>
                {verificationStatus && (
                  <p className={`text-sm mt-1 ${
                    verificationStatus.valid 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {verificationStatus.message}
                  </p>
                )}
              </div>
            )}

            <div className="flex items-center">
              <input
                id="acceptTerms"
                name="acceptTerms"
                type="checkbox"
                required
                checked={formData.acceptTerms}
                onChange={handleInputChange}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-dark-300 rounded dark:bg-dark-700"
              />
              <label htmlFor="acceptTerms" className="ml-2 block text-sm text-dark-700 dark:text-dark-200">
                I agree to the{' '}
                <Link to="/terms-and-conditions" className="text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 hover:underline">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/privacy-policy" className="text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 hover:underline">
                  Privacy Policy
                </Link>
              </label>
            </div>
          </div>

          <div className="w-full">
            <button
              type="submit"
              disabled={loading}
              className="w-full shadow__btn py-3 px-4 rounded-lg flex justify-center items-center"
              style={{
                background: 'rgb(0,140,255)',
                boxShadow: '0 0 25px rgb(0,140,255)',
                border: 'none',
                fontSize: '1rem',
                color: '#fff',
                letterSpacing: '1px',
                fontWeight: 700,
                textTransform: 'uppercase',
                transition: 'box-shadow 0.5s',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.boxShadow = '0 0 5px rgb(0,140,255), 0 0 25px rgb(0,140,255), 0 0 50px rgb(0,140,255), 0 0 100px rgb(0,140,255)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.boxShadow = '0 0 25px rgb(0,140,255)';
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Sign Up'
              )}
            </button>
          </div>
        </form>

        <div className="mt-8 text-center">
          <AnimatedText
            staticText="Already have an account? "
            animatedTexts={["Login here!", "Sign in now"]}
            linkTo="/login"
          />
        </div>
      </div>
    </motion.div>
  );
};

export default SignupPage;