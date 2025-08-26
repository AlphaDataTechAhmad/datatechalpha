import { useState, useCallback, useEffect, useRef } from 'react';
import { loadScript } from '../utils/loadScript';
import { createOrder, verifyPayment } from '../Services/razorpayService';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface UseRazorpayPaymentProps {
  amount: number;
  courseName: string;
  courseId: string;
  user?: {
    id?: string;
    name?: string;
    email?: string;
    contact?: string;
  };
  onSuccess?: (response: any) => void;
  onError?: (error: string) => void;
  onClose?: () => void;
}

const RAZORPAY_SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js';

// Function to test Razorpay key
export const testRazorpayKey = (): {success: boolean; message: string; keyType?: string} => {
  try {
    console.log('Checking Razorpay key from environment variables...');
    
    // Get the key from environment variables (Vite exposes these)
    const razorpayKey = import.meta.env.VITE_PUBLIC_RAZORPAY_KEY_ID;
    
    if (!razorpayKey) {
      throw new Error('Razorpay key not found in environment variables');
    }
    
    const keyType = razorpayKey.startsWith('rzp_live_') ? 'Live' : 
                  razorpayKey.startsWith('rzp_test_') ? 'Test' : 'Unknown';
    
    console.log('Razorpay key found:', {
      keyType,
      keyLast4: razorpayKey.slice(-4),
      fullKey: razorpayKey
    });
    
    return {
      success: true,
      message: `Razorpay ${keyType} key found (ending with ${razorpayKey.slice(-4)})`,
      keyType
    };
  } catch (error) {
    console.error('Error testing Razorpay key:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to verify Razorpay key'
    };
  }
};

export const useRazorpayPayment = ({
  amount,
  courseName,
  courseId,
  user = {},
  onSuccess,
  onError,
  onClose,
}: UseRazorpayPaymentProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const razorpayRef = useRef<any>(null);

  // Load Razorpay script on component mount
  useEffect(() => {
    let isMounted = true;
    
    const loadRazorpay = async () => {
      try {
        if (!window.Razorpay) {
          await loadScript(RAZORPAY_SCRIPT_URL, { 'data-payment_button_id': 'rzp-button' });
        }
        if (isMounted) {
          setScriptLoaded(true);
        }
      } catch (err) {
        console.error('Failed to load Razorpay script:', err);
        if (isMounted) {
          setError('Failed to load payment service. Please try again later.');
          onError?.('Failed to load payment service');
        }
      }
    };

    loadRazorpay();

    return () => {
      isMounted = false;
    };
  }, [onError]);

  const handlePaymentSuccess = useCallback(async (response: any) => {
    try {
      setIsProcessing(true);
      setError(null);
      
      // Verify payment on the backend
      const verification = await verifyPayment(
        response.razorpay_payment_id,
        response.razorpay_order_id,
        response.razorpay_signature
      );

      if (!verification.success) {
        throw new Error(verification.error || 'Payment verification failed');
      }

      onSuccess?.(response);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment verification failed';
      console.error('Payment verification error:', err);
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  }, [onSuccess, onError]);

  const initializePayment = useCallback(async () => {
    if (!scriptLoaded) {
      setError('Payment service is still initializing. Please try again in a moment.');
      onError?.('Payment service not ready');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);

      // Create order on backend
      const orderResponse = await createOrder(
        amount,
        'INR',
        `order_${courseId}_${Date.now()}`,
        courseId,
        user?.id
      );

      if (!orderResponse.success || !orderResponse.order) {
        throw new Error(orderResponse.error || 'Failed to create order');
      }

      const order = orderResponse.order;

      // Debug: Log the Razorpay key and environment variables
      console.log('=== RAZORPAY DEBUG INFO ===');
      
      // Get the key from environment variables
      const razorpayKey = import.meta.env.VITE_PUBLIC_RAZORPAY_KEY_ID || 'rzp_live_hkFTDsyh8xvt23';
      
      console.log('Using Razorpay Key:', {
        key: razorpayKey,
        keyType: razorpayKey.startsWith('rzp_live_') ? 'Live' : 
                razorpayKey.startsWith('rzp_test_') ? 'Test' : 'Unknown',
        keyLast4: razorpayKey.slice(-4)
      });
      
      if (!razorpayKey) {
        throw new Error('Razorpay key is not defined. Please check your environment variables.');
      }

      // Initialize Razorpay checkout
      const options = {
        key: razorpayKey,
        amount: order.amount.toString(),
        currency: order.currency,
        name: 'Data-Techi Academy',
        description: `Payment for ${courseName}`,
        order_id: order.id,
        handler: handlePaymentSuccess,
        // Force live mode
        integration: {
          target: '_self',
          method: {
            netbanking: true,
            card: true,
            wallet: true,
            upi: true,
            paylater: true
          },
          // Force live mode
          env: 'production',
          display: {
            // Force refresh to avoid cached version
            method: 'popup',
            popup: true
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.contact || '',
        },
        notes: {
          courseId,
          courseName,
          userId: user?.id || 'guest',
          timestamp: new Date().toISOString()
        },
        theme: {
          color: '#3399cc',
          hide_topbar: false
        },
        modal: {
          escape: false,
          // Handle backdrop click
          backdropclose: false,
          // Handle modal close
          ondismiss: () => {
            console.log('Razorpay modal dismissed');
            onClose?.();
          },
        },
        retry: {
          enabled: true,
          max_count: 3,
        },
      };

      // Clear any existing Razorpay instance
      if (razorpayRef.current) {
        razorpayRef.current.close();
      }

      // Create new Razorpay instance
      razorpayRef.current = new window.Razorpay(options);
      
      // Set up error handler
      razorpayRef.current.on('payment.failed', (response: any) => {
        const errorMessage = response.error?.description || 'Payment failed. Please try again.';
        setError(errorMessage);
        onError?.(errorMessage);
      });

      // Open payment modal
      razorpayRef.current.open();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize payment';
      console.error('Payment initialization error:', err);
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  }, [amount, courseId, courseName, handlePaymentSuccess, onClose, onError, user, scriptLoaded]);

  // Clean up Razorpay instance on unmount
  useEffect(() => {
    return () => {
      if (razorpayRef.current) {
        razorpayRef.current.close();
        razorpayRef.current = null;
      }
    };
  }, []);

  return {
    isProcessing,
    error,
    initializePayment,
    isScriptLoaded: scriptLoaded,
  };
};

export default useRazorpayPayment;
