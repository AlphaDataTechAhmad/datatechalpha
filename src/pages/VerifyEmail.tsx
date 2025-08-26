import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { account, databases } from '../Services/appwrite';
import { motion } from 'framer-motion';
import { Query } from 'appwrite';

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState('Verifying your email...');
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const userId = searchParams.get('userId');
    const secret = searchParams.get('secret');

    const verifyEmail = async () => {
      try {
        console.log('Starting email verification...');
        
        if (!userId || !secret) {
          const errorMsg = 'Missing verification parameters. Please use the link from your email.';
          console.error(errorMsg);
          throw new Error(errorMsg);
        }

        console.log('Verifying email for user:', userId);
        
        // Verify the email
        try {
          await account.updateVerification(userId, secret);
          console.log('Email verified successfully');
        } catch (verifyError) {
          console.error('Error during email verification:', verifyError);
          throw new Error('Failed to verify email. The link may be invalid or expired.');
        }
        
        // Update the profile to mark as verified
        try {
          console.log('Updating user profile to mark as verified...');
          const profile = await databases.listDocuments(
            '68261b6a002ba6c3b584', // DATABASE_ID
            '68261bb5000a54d8652b', // PROFILE_COLLECTION_ID
            [Query.equal('accountId', userId)]
          );
          
          if (profile.documents[0]) {
            await databases.updateDocument(
              '68261b6a002ba6c3b584',
              '68261bb5000a54d8652b',
              profile.documents[0].$id,
              { isVerified: true }
            );
            console.log('Profile updated successfully');
          } else {
            console.warn('No profile found for user:', userId);
          }
        } catch (profileError) {
          console.error('Error updating profile:', profileError);
          // Don't fail the verification if profile update fails
        }

        const successMsg = 'Email verified successfully! Redirecting to login...';
        console.log(successMsg);
        setMessage(successMsg);
        setIsSuccess(true);
        setTimeout(() => navigate('/login'), 3000);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Verification failed. The link may be invalid or expired.';
        console.error('Verification error:', error);
        setMessage(errorMsg);
        setIsSuccess(false);
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-900"
    >
      <div className={`p-8 rounded-xl shadow-sm border max-w-md w-full text-center ${
        isSuccess 
          ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800'
          : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800'
      }`}>
        <h2 className="text-2xl font-bold mb-4">
          {isSuccess ? 'Success!' : 'Verification Failed'}
        </h2>
        <p className="mb-6">{message}</p>
        {!isSuccess && (
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Go to Login
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default VerifyEmailPage;