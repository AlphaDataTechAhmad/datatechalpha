import Razorpay from 'razorpay';
import { savePaymentToAppwrite } from './appwrite';

// Initialize Razorpay instance
export const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || ''
});

// Interface for order creation parameters
interface CreateOrderParams {
  amount: number;
  currency?: string;
  receipt?: string;
  notes?: Record<string, string>;
  payment_capture?: number;
}

// Create a new order
export const createOrder = async (params: CreateOrderParams) => {
  try {
    const order = await razorpay.orders.create({
      amount: params.amount * 100, // Convert to paise
      currency: params.currency || 'INR',
      receipt: params.receipt || `rcpt_${Date.now()}`,
      payment_capture: params.payment_capture || 1,
      notes: params.notes || {}
    });
    return { success: true, order };
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create order' 
    };
  }
};

// Verify payment signature
export const verifyPayment = (params: {
  order_id: string;
  payment_id: string;
  signature: string;
}) => {
  const { order_id, payment_id, signature } = params;
  const text = order_id + '|' + payment_id;
  const crypto = require('crypto');
  const generated_signature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
    .update(text)
    .digest('hex');
  
  return generated_signature === signature;
};

// Save payment to Appwrite
export const savePayment = async (paymentData: {
  userId: string;
  courseId: string;
  paymentId: string;
  orderId: string;
  amount: number;
  currency: string;
  status: string;
  metadata?: Record<string, any>;
}) => {
  try {
    await savePaymentToAppwrite(paymentData);
    return { success: true };
  } catch (error) {
    console.error('Error saving payment to Appwrite:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to save payment' 
    };
  }
};
