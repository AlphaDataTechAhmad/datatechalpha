import { useState, useCallback } from 'react';
import { loadScript } from '../utils/loadScript';
import { createOrder } from '../lib/razorpay';

declare global {
  interface Window {
    Razorpay: any;
  }
}

const RAZORPAY_SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js';

interface UseRazorpayProps {
  amount: number;
  currency?: string;
  description: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  onSuccess?: (response: any) => void;
  onError?: (error: string) => void;
  onClose?: () => void;
}

export const useRazorpay = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRazorpayScript = useCallback(async () => {
    if (window.Razorpay) return true;
    
    try {
      await loadScript(RAZORPAY_SCRIPT_URL, { 'data-payment_button_id': 'rzp-button' });
      return true;
    } catch (err) {
      console.error('Failed to load Razorpay script:', err);
      setError('Failed to load payment service. Please try again later.');
      return false;
    }
  }, []);

  const initPayment = useCallback(async ({
    amount,
    currency = 'INR',
    description,
    prefill = {},
    notes = {},
    onSuccess,
    onError,
    onClose
  }: UseRazorpayProps) => {
    setLoading(true);
    setError(null);

    try {
      // Load Razorpay script if not already loaded
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Payment service is not available');
      }

      // Create order on your server
      const orderResponse = await createOrder({
        amount,
        currency,
        notes: {
          ...notes,
          description
        }
      });

      if (!orderResponse.success) {
        throw new Error(orderResponse.error || 'Failed to create order');
      }

      const { order } = orderResponse;

      // Initialize Razorpay checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'Your Company Name',
        description,
        order_id: order.id,
        handler: function (response: any) {
          if (onSuccess) {
            onSuccess({
              ...response,
              order: order
            });
          }
        },
        prefill: {
          name: prefill.name || '',
          email: prefill.email || '',
          contact: prefill.contact || ''
        },
        notes,
        theme: {
          color: '#6366F1',
        },
        modal: {
          ondismiss: () => {
            if (onClose) onClose();
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment initialization failed';
      console.error('Payment error:', errorMessage);
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }, [loadRazorpayScript]);

  return {
    initPayment,
    loading,
    error,
    clearError: () => setError(null)
  };
};

export default useRazorpay;
