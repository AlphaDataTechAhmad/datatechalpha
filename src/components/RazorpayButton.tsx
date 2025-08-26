import React from 'react';
import useRazorpay from '../hooks/useRazorpay';
import { Button } from './ui/button';
import { Loader2 } from 'lucide-react';

interface RazorpayButtonProps {
  amount: number;
  currency?: string;
  description: string;
  onSuccess?: (response: any) => void;
  onError?: (error: string) => void;
  onClose?: () => void;
  className?: string;
  children?: React.ReactNode;
  disabled?: boolean;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
}

const RazorpayButton: React.FC<RazorpayButtonProps> = ({
  amount,
  currency = 'INR',
  description,
  onSuccess,
  onError,
  onClose,
  className = '',
  children,
  disabled = false,
  prefill = {},
  notes = {}
}) => {
  const { initPayment, loading, error, clearError } = useRazorpay();

  const handleClick = async () => {
    clearError();
    
    await initPayment({
      amount,
      currency,
      description,
      prefill,
      notes,
      onSuccess: (response) => {
        console.log('Payment successful:', response);
        if (onSuccess) onSuccess(response);
      },
      onError: (error) => {
        console.error('Payment error:', error);
        if (onError) onError(error);
      },
      onClose: () => {
        console.log('Payment window closed');
        if (onClose) onClose();
      }
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <Button
        onClick={handleClick}
        disabled={disabled || loading}
        className={`relative ${className}`}
        id="rzp-button"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          children || `Pay ${new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(amount)}`
        )}
      </Button>
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
};

export default RazorpayButton;
