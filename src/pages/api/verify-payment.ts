import type { NextApiRequest, NextApiResponse } from 'next';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { savePaymentToAppwrite } from '@/lib/appwrite';

// Initialize Razorpay with environment variables
const razorpayKeyId = process.env.RAZORPAY_KEY_ID || '';
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || '';

const razorpay = new Razorpay({
  key_id: razorpayKeyId,
  key_secret: razorpayKeySecret,
});

// Log Razorpay configuration
console.log('Razorpay verify payment initialized with key_id:', 
  razorpayKeyId ? '***' + razorpayKeyId.slice(-4) : 'MISSING');
console.log('Environment:', process.env.NODE_ENV);

// Type for the request body
type VerifyPaymentRequest = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
  userId: string;
  courseId?: string;
  internshipId?: string;
  amount: number;
  currency: string;
  [key: string]: any;
};

// Type for the response
type VerifyPaymentResponse = {
  success: boolean;
  paymentId?: string;
  orderId?: string;
  status?: string;
  error?: string;
  details?: any;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<VerifyPaymentResponse>
) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature, 
      userId, 
      courseId, 
      internshipId, 
      amount, 
      currency 
    } = req.body as VerifyPaymentRequest;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required payment verification data',
      });
    }

    if (!courseId && !internshipId) {
      return res.status(400).json({
        success: false,
        error: 'Either courseId or internshipId must be provided',
      });
    }

    // Verify the payment signature
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(text)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      console.error('Invalid signature:', { generatedSignature, receivedSignature: razorpay_signature });
      return res.status(400).json({
        success: false,
        error: 'Invalid payment signature',
      });
    }

    // Get payment details from Razorpay
    const payment = await razorpay.payments.fetch(razorpay_payment_id);
    
    // Save payment to Appwrite
    await savePaymentToAppwrite({
      userId,
      ...(courseId && { courseId }),
      ...(internshipId && { internshipId }),
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      amount: amount || 0,
      currency: currency || 'INR',
      status: 'captured',
      receipt: `receipt_${razorpay_payment_id}`,
      metadata: {
        razorpay_signature,
        ...(req.body.metadata || {}),
      },
      type: courseId ? 'course' : 'internship',
    });

    // Return success response
    return res.status(200).json({
      success: true,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      status: payment.status,
    });

  } catch (error) {
    console.error('Payment verification error:', error);
    
    // Handle specific error cases
    if (error instanceof Error) {
      return res.status(500).json({
        success: false,
        error: 'Payment verification failed',
        details: error.message,
      });
    }

    // Fallback for unknown errors
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred during payment verification',
      details: 'Unknown error',
    });
  }
}
