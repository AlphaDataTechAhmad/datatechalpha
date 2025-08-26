// Razorpay Service for handling payment operations with enhanced error handling and retry logic

interface RazorpayOrder {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  offer_id: string | null;
  status: string;
  attempts: number;
  notes: Record<string, string>;
  created_at: number;
  created_at_iso?: string;
}

interface CreateOrderResponse {
  success: boolean;
  order?: RazorpayOrder;
  error?: string;
  code?: string;
  description?: string;
}

interface VerifyPaymentResponse {
  success: boolean;
  error?: string;
  code?: string;
  description?: string;
  paymentId?: string;
  orderId?: string;
  timestamp?: number;
  amount?: number;
  currency?: string;
  status?: string;
}

interface PaymentDetailsResponse {
  success: boolean;
  paymentId?: string;
  orderId?: string;
  timestamp?: number;
  amount?: number;
  currency?: string;
  status?: string;
  error?: string;
  code?: string;
  description?: string;
}

// Configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

declare global {
  interface Window {
    Razorpay: any;
  }
}

/**
 * Load Razorpay script
 */
export const loadRazorpay = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window.Razorpay !== 'undefined') {
      return resolve(true);
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

/**
 * Initialize Razorpay
 */
export const initRazorpay = async (): Promise<typeof window.Razorpay> => {
  try {
    const loaded = await loadRazorpay();
    if (!loaded) {
      throw new Error('Failed to load Razorpay script');
    }

    if (!window.Razorpay) {
      throw new Error('Razorpay not available on window object');
    }

    return window.Razorpay;
  } catch (error) {
    console.error('Error initializing Razorpay:', error);
    throw error;
  }
};

/**
 * Initialize and open Razorpay checkout
 * @param options - Razorpay options
 */
export const openRazorpayCheckout = async (options: {
  key: string;
  amount: number;
  currency?: string;
  name: string;
  description: string;
  order_id?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
  };
  handler?: (response: any) => void;
  modal?: {
    ondismiss?: () => void;
  };
}): Promise<boolean> => {
  try {
    const Razorpay = await initRazorpay();
    
    return new Promise((resolve) => {
      const rzp = new Razorpay({
        ...options,
        currency: options.currency || 'INR',
        handler: (response: any) => {
          if (options.handler) {
            options.handler(response);
          }
          resolve(true);
        },
        modal: {
          ...options.modal,
          ondismiss: () => {
            if (options.modal?.ondismiss) {
              options.modal.ondismiss();
            }
            resolve(false);
          },
        },
      });

      rzp.open();
    });
  } catch (error) {
    console.error('Error in openRazorpayCheckout:', error);
    throw error;
  }
};

/**
 * Create a Razorpay order
 */
export const createOrder = async (
  amount: number,
  currency: string = 'INR',
  receipt?: string,
  courseId?: string,
  userId?: string
): Promise<CreateOrderResponse> => {
  try {
    // Use the Vite environment variable for the API URL
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const apiUrl = `${baseUrl}/create-razorpay-order`;
    
    console.log('Making request to:', apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Number(amount),
        currency: currency || 'INR',
        receipt: receipt || `rcpt_${Date.now()}`,
        courseId,
        userId,
      }),
    });

    // Check if the response is valid JSON
    const responseText = await response.text();
    let data: any;
    
    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch (parseError) {
      console.error('Failed to parse API response:', responseText);
      throw new Error('Invalid response from payment server');
    }

    // Handle non-200 responses
    if (!response.ok) {
      const errorMessage = data?.error || 'Failed to create order';
      const errorCode = data?.code || 'ORDER_CREATION_FAILED';
      const errorDescription = data?.description || 'An unknown error occurred';
      
      console.error(`Order creation failed (${errorCode}): ${errorMessage}`, {
        status: response.status,
        error: errorMessage,
        description: errorDescription,
      });
      
      return {
        success: false,
        error: errorMessage,
        code: errorCode,
        description: errorDescription,
      };
    }

    // Validate response data
    if (!data || typeof data !== 'object' || !data.id) {
      console.error('Invalid order data received:', data);
      throw new Error('Invalid order data received from server');
    }

    // Map the response to our order type
    const order: RazorpayOrder = {
      id: data.id,
      entity: 'order',
      amount: Number(data.amount) || 0,
      amount_paid: 0,
      amount_due: Number(data.amount) || 0,
      currency: data.currency || 'INR',
      receipt: data.receipt || `rcpt_${Date.now()}`,
      offer_id: null,
      status: 'created',
      attempts: 0,
      notes: {},
      created_at: Math.floor(Date.now() / 1000),
      created_at_iso: new Date().toISOString(),
    };

    return {
      success: true,
      order,
    };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in createOrder:', errorMessage, error);
    
    return {
      success: false,
      error: 'Failed to create order',
      code: 'ORDER_CREATION_ERROR',
      description: errorMessage,
    };
  }
};

/**
 * Verify Razorpay payment
 */
export const verifyPayment = async (
  razorpayPaymentId: string,
  razorpayOrderId: string,
  razorpaySignature: string
): Promise<VerifyPaymentResponse> => {
  try {
    const response = await fetch('/api/verify-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        razorpay_payment_id: razorpayPaymentId,
        razorpay_order_id: razorpayOrderId,
        razorpay_signature: razorpaySignature,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Payment verification failed',
        code: data.code,
        description: data.description,
      };
    }

    return {
      success: true,
      paymentId: data.paymentId,
      orderId: data.orderId,
      status: data.status,
      amount: data.amount,
      currency: data.currency,
    };
  } catch (error) {
    console.error('Error verifying payment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Payment verification failed',
      code: 'VERIFICATION_FAILED',
      description: 'An error occurred while verifying the payment. Please try again or contact support.'
    };
  }
};

/**
 * Get payment details
 */
export const getPaymentDetails = async (
  paymentId: string
): Promise<PaymentDetailsResponse> => {
  try {
    const response = await fetch(`/api/payments/${paymentId}`);
    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to fetch payment details',
        code: data.code,
        description: data.description,
      };
    }

    return {
      success: true,
      paymentId: data.paymentId,
      orderId: data.orderId,
      amount: data.amount,
      currency: data.currency,
      status: data.status,
      timestamp: data.timestamp,
    };
  } catch (error) {
    console.error('Error fetching payment details:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch payment details',
      code: 'FETCH_PAYMENT_DETAILS_FAILED',
      description: 'An error occurred while fetching payment details. Please try again.'
    };
  }
};

/**
 * Fetches payment details from Razorpay with retry logic
 * @param paymentId - The payment ID from Razorpay
 * @param attempt - Current attempt number (for internal use)
 */
export const fetchPaymentDetails = async (
  paymentId: string,
  attempt: number = 1
): Promise<VerifyPaymentResponse> => {
  try {
    if (!paymentId) {
      throw new Error('Payment ID is required');
    }

    try {
      // Simulate API call with potential failure for demo
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          if (Math.random() < 0.1 && attempt < MAX_RETRIES) {
            reject(new Error('Payment service unavailable'));
          } else {
            resolve(true);
          }
        }, 500);
      });

      // Mock successful response
      return {
        success: true,
        paymentId,
        status: 'captured',
        amount: 1000, // Mock amount
        currency: 'INR',
        orderId: `order_${Date.now()}`,
        timestamp: Math.floor(Date.now() / 1000),
        code: 'PAYMENT_FETCHED',
        description: 'Payment details retrieved successfully'
      };
    } catch (apiError) {
      console.error('API Error in fetchPaymentDetails:', apiError);
      
      if (attempt < MAX_RETRIES) {
        console.log(`Retrying fetch payment details (attempt ${attempt + 1}/${MAX_RETRIES})...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt));
        return fetchPaymentDetails(paymentId, attempt + 1);
      }
      
      throw new Error(`Failed to fetch payment details after ${MAX_RETRIES} attempts`);
    }
  } catch (error) {
    console.error('Error in fetchPaymentDetails:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch payment details',
      code: 'FETCH_DETAILS_FAILED',
      description: 'Unable to retrieve payment details. Please try again later.'
    };
  }
};
