import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, CheckCircle, Loader2 } from 'lucide-react';
import useRazorpayPayment from '../../hooks/useRazorpayPayment';

// Get Razorpay key from environment variables
const RAZORPAY_KEY = import.meta.env.VITE_PUBLIC_RAZORPAY_KEY_ID;

if (!RAZORPAY_KEY) {
  console.error('Razorpay key is not defined. Please check your environment variables.');
  console.log('Current env:', import.meta.env);
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface PaymentProps {
  amount: number;
  currency?: string;
  courseName: string;
  courseId: string;
  onSuccess: (response: any) => void;
  onClose: () => void;
  user?: {
    id?: string;
    name?: string;
    email?: string;
    phone?: string;
  };
}

const RazorpayPayment: React.FC<PaymentProps> = ({
  amount,
  courseName,
  courseId,
  onSuccess,
  onClose,
  user = {}
}) => {
  const navigate = useNavigate();
  
  const { isProcessing, error, initializePayment } = useRazorpayPayment({
    amount,
    courseName,
    courseId,
    user: {
      id: user?.id,
      name: user?.name || 'Student',
      email: user?.email || 'student@example.com',
      contact: user?.phone?.replace(/\D/g, '').substring(0, 10) || '9999999999'
    },
    onSuccess: (response) => {
      onSuccess(response);
      navigate(`/course/${courseId}`);
    },
    onError: (errorMsg) => {
      console.error('Payment error:', errorMsg);
    },
    onClose: () => {
      onClose();
    }
  });

  useEffect(() => {
    // Initialize payment when component mounts
    initializePayment();
  }, [initializePayment]);

  // Payment success state
  if (!isProcessing && !error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-green-600">Payment Successful!</h2>
            <button 
              onClick={onClose} 
              className="text-gray-500 hover:text-gray-700 transition-colors"
              aria-label="Close payment"
            >
              <X size={20} />
            </button>
          </div>
          <div className="flex flex-col items-center justify-center py-4">
            <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Thank you for your purchase!</h3>
            <p className="text-gray-600 text-center mb-6">
              You have successfully enrolled in <span className="font-semibold">{courseName}</span>.
            </p>
            <button
              onClick={() => navigate(`/course/${courseId}`)}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Go to Course
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Loading state (initial)
  if (isProcessing && !error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Processing Payment</h2>
            <button 
              onClick={onClose} 
              className="text-gray-500 hover:text-gray-700 transition-colors"
              aria-label="Close payment"
            >
              <X size={20} />
            </button>
          </div>
          <div className="flex flex-col items-center justify-center py-4">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin mb-4" />
            <p className="text-gray-600 text-center">
              Please wait while we process your payment...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-red-600">Payment Error</h2>
            <button 
              onClick={onClose} 
              className="text-gray-500 hover:text-gray-700 transition-colors"
              aria-label="Close payment"
            >
              <X size={20} />
            </button>
          </div>
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={initializePayment}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default RazorpayPayment;
