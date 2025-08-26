import React from 'react';
import { useRazorpayPayment } from '../hooks/useRazorpayPayment';

interface PaymentButtonProps {
  amount: number;
  courseName: string;
  courseId: string;
  user?: {
    id?: string;
    name?: string;
    email?: string;
    contact?: string;
  };
  className?: string;
  disabled?: boolean;
}

const PaymentButton: React.FC<PaymentButtonProps> = ({
  amount,
  courseName,
  courseId,
  user = {},
  className = '',
  disabled = false,
}) => {
  const { initializePayment, isProcessing, error } = useRazorpayPayment({
    amount,
    courseName,
    courseId,
    user,
    onSuccess: (response) => {
      console.log('Payment successful:', response);
      // You can add additional success handling here
    },
    onError: (error) => {
      console.error('Payment error:', error);
      // You can add additional error handling here
    },
  });

  return (
    <>
      <button
        onClick={initializePayment}
        disabled={disabled || isProcessing}
        className={`px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors ${className} ${
          (disabled || isProcessing) ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {isProcessing ? 'Processing...' : `Pay ₹${amount / 100}`}
      </button>
      {error && (
        <div className="mt-2 text-red-500 text-sm">
          {error}
        </div>
      )}
    </>
  );
};

export default PaymentButton;
