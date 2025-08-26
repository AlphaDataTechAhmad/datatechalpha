import type { NextApiRequest, NextApiResponse } from 'next';
import Razorpay from 'razorpay';
import { savePaymentToAppwrite, type SavePaymentParams } from '../../lib/appwrite';

// Load environment variables
const isProduction = process.env.NODE_ENV === 'production';
const razorpayKeyId = process.env.RAZORPAY_KEY_ID || '';
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || '';

// Log key information (without exposing full keys)
console.log('Initializing Razorpay in', isProduction ? 'PRODUCTION' : 'development', 'mode');
console.log('Using Razorpay Key ID:', razorpayKeyId ? 'rzp_...' + razorpayKeyId.slice(-4) : 'not found');
console.log('Key type:', razorpayKeyId.startsWith('rzp_live_') ? 'LIVE' : 
  razorpayKeyId.startsWith('rzp_test_') ? 'TEST' : 'UNKNOWN');

// Validate keys
if (!razorpayKeyId || !razorpayKeySecret) {
  const error = new Error('Payment service configuration error: Missing Razorpay credentials');
  console.error('Missing Razorpay credentials');
  throw error;
}

// Ensure we're using live keys in production
if (isProduction && !razorpayKeyId.startsWith('rzp_live_')) {
  const error = new Error('FATAL: Production environment requires live Razorpay keys');
  console.error(error.message);
  throw error;
}

// Initialize Razorpay
let razorpay: Razorpay;
try {
  razorpay = new Razorpay({
    key_id: razorpayKeyId,
    key_secret: razorpayKeySecret,
  }) as Razorpay;
  console.log('Razorpay instance created successfully');
} catch (error: unknown) {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  console.error('Failed to create Razorpay instance:', error);
  throw new Error(`Failed to initialize payment service: ${errorMessage}`);
}

// Test Razorpay client by making a test API call
async function testRazorpayConnection() {
  try {
    console.log('Testing Razorpay connection...');
    // This is a lightweight API call to verify the connection
    const { count } = await razorpay.payments.all({ count: 1 });
    console.log(`Razorpay connection test successful. Found ${count} payments.`);
    return true;
  } catch (error: any) {
    console.error('Razorpay connection test failed:', {
      message: error.message,
      statusCode: error.statusCode,
      error: error.error,
      stack: error.stack
    });
    return false;
  }
}

let isRazorpayConnected = false;

// Test the connection when the module loads
(async () => {
  isRazorpayConnected = await testRazorpayConnection();
  if (!isRazorpayConnected) {
    console.error('FATAL: Could not establish connection with Razorpay');
  } else {
    console.log('Razorpay client initialized and verified successfully');
  }
})();

// Helper function to send consistent JSON responses
const sendJsonResponse = <T>(
  res: NextApiResponse,
  status: number,
  data: T & { success?: boolean }
) => {
  return res.status(status).json({
    success: status >= 200 && status < 300,
    ...data,
  } as T & { success: boolean });
};

// Types
interface RazorpayOrder {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: 'created' | 'attempted' | 'paid' | 'failed';
  attempts: number;
  notes: Record<string, any>;
  created_at: number;
  offer_id: string | null;
}

interface CreateOrderRequest {
  amount: number | string;
  currency?: string;
  receipt?: string;
  courseId?: string;
  userId?: string;
  notes?: Record<string, any>;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  description?: string;
  message?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse<RazorpayOrder>>) {
  // Log incoming request
  console.log('=== NEW REQUEST ===');
  console.log('Method:', req.method);
  console.log('Headers:', {
    'content-type': req.headers['content-type'],
    'user-agent': req.headers['user-agent']
  });
  console.log('URL:', req.url);
  console.log('=== REQUEST BODY (sanitized) ===');
  
  let requestBody: any;
  try {
    requestBody = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    console.log(JSON.stringify({
      ...requestBody,
      // Sanitize any sensitive data
      card: requestBody.card ? '***REDACTED***' : undefined
    }, null, 2));
  } catch (e) {
    console.log('Could not parse request body:', req.body);
  }
  
  console.log('==============================');
  
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', process.env.NODE_ENV === 'development' 
    ? 'http://localhost:5173' 
    : 'https://your-production-domain.com');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    console.warn('Method not allowed:', req.method);
    return sendJsonResponse(res, 405, {
      error: 'Method not allowed',
      code: 'METHOD_NOT_ALLOWED',
      description: 'Only POST requests are supported for this endpoint'
    });
  }

  // Validate content type
  const contentType = req.headers['content-type'];
  if (!contentType || !contentType.includes('application/json')) {
    console.warn('Invalid content type:', contentType);
    return sendJsonResponse(res, 400, {
      error: 'Invalid content type',
      code: 'INVALID_CONTENT_TYPE',
      description: 'Content type must be application/json'
    });
  }

  try {
    // Parse and validate request body
    let requestBody: CreateOrderRequest;
    try {
      requestBody = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      
      if (!requestBody) {
        throw new Error('Request body is empty');
      }

      // Log the request body (without sensitive data)
      const logBody = { ...requestBody };
      if (logBody.notes?.card) delete logBody.notes.card;
      console.log('Parsed request body:', JSON.stringify(logBody, null, 2));
    } catch (error) {
      console.error('Error parsing request body:', error);
      return sendJsonResponse(res, 400, {
        error: 'Invalid request body',
        code: 'INVALID_REQUEST_BODY',
        description: 'The request body could not be parsed as JSON or is malformed'
      });
    }

    // Extract and validate required fields
    const { amount: reqAmount, currency: reqCurrency } = requestBody;
    
    // Validate amount
    if (reqAmount === undefined || reqAmount === null) {
      return sendJsonResponse(res, 400, {
        error: 'Amount is required',
        code: 'MISSING_AMOUNT',
        description: 'Please provide a valid amount for the order'
      });
    }

    // Convert amount to number (in case it's a string)
    const amount = Number(reqAmount);
    if (isNaN(amount) || amount <= 0) {
      return sendJsonResponse(res, 400, {
        error: 'Invalid amount',
        code: 'INVALID_AMOUNT',
        description: 'Please provide a valid positive number for the amount'
      });
    }

    // Validate currency (default to INR if not provided)
    const currency = (reqCurrency || 'INR').toUpperCase();
    if (currency !== 'INR') {
      return sendJsonResponse(res, 400, {
        error: 'Only INR currency is supported',
        code: 'UNSUPPORTED_CURRENCY',
        description: 'Currently, we only support INR as the payment currency'
      });
    }

    // Generate a receipt if not provided
    const receipt = requestBody.receipt || `rcpt_${Date.now()}`;
    const { courseId, userId, notes } = requestBody;
    
    // Log the validated request data
    console.log('Validated request data:', {
      amount,
      currency,
      receipt,
      courseId: courseId || 'not provided',
      userId: userId ? `${userId.substring(0, 3)}...` : 'not provided',
      hasNotes: Boolean(notes && Object.keys(notes).length > 0)
    });

    // Create Razorpay order options
    const orderOptions: any = {
      amount: Math.round(amount * 100), // Convert to paise
      currency: currency.toUpperCase(),
      receipt: receipt,
      payment_capture: 1, // Auto-capture payment
      notes: {
        courseId,
        userId,
        created_at: new Date().toISOString(),
        source: 'web',
      },
    };

    // Create the Razorpay order
    let order: any;
    
    // Log the exact options being sent to Razorpay
    const finalOrderOptions = {
      ...orderOptions,
      // Sanitize any sensitive data in notes
      notes: orderOptions.notes ? {
        ...orderOptions.notes,
        card: orderOptions.notes.card ? '***REDACTED***' : undefined
      } : undefined
    };
    
    console.log('Creating Razorpay order with final options:', JSON.stringify(finalOrderOptions, null, 2));
    
    try {
      console.log('Creating Razorpay order with options:', JSON.stringify(orderOptions, null, 2));
      console.log('Razorpay instance initialized with key_id:', 
        process.env.RAZORPAY_KEY_ID ? '***REDACTED***' : 'MISSING');
      
      // Log the Razorpay client configuration
      console.log('Razorpay client configuration:', {
        hasKeyId: !!process.env.RAZORPAY_KEY_ID,
        hasKeySecret: !!process.env.RAZORPAY_KEY_SECRET,
        nodeEnv: process.env.NODE_ENV,
        isProduction: process.env.NODE_ENV === 'production'
      });
      
      const orderResponse = await razorpay.orders.create(orderOptions);
      order = orderResponse;
      console.log('Razorpay order created successfully:', order.id);
      console.log('Order details:', JSON.stringify(order, null, 2));
    } catch (error: any) {
      console.error('Failed to create Razorpay order:', {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        error: error.error,
        stack: error.stack
      });
      return sendJsonResponse(res, 500, {
        error: 'Failed to create payment order',
        code: 'RAZORPAY_ORDER_CREATION_FAILED',
        description: error.error?.description || error.message || 'Could not create order with payment gateway'
      });
    }
    
    // Save initial payment record to Appwrite
    if (userId && courseId) {
      try {
        const paymentData: SavePaymentParams = {
          userId: String(userId),
          courseId: String(courseId),
          paymentId: 'pending', // Will be updated after payment
          orderId: order.id,
          amount: amount,
          currency: currency,
          status: 'created',
          receipt: receipt,
          metadata: {
            amount_paid: 0,
            amount_due: amount,
            attempts: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            courseId: String(courseId),
            userId: String(userId),
            orderId: order.id,
            status: 'created',
            amount: amount,
            currency: currency,
            payment_method: 'razorpay',
            source: 'web',
            notes: order.notes || {},
            razorpay_order_id: order.id,
            receipt: receipt
          }
        };
        
        await savePaymentToAppwrite(paymentData);
        console.log('Payment record saved to Appwrite for order:', order.id);
      } catch (dbError) {
        console.error('Error saving to Appwrite:', dbError);
        // Continue even if Appwrite save fails, but log the error
        // We don't want to fail the entire operation just because of Appwrite
      }
    }

    // Prepare response data
    const responseData: RazorpayOrder = {
      id: order.id,
      entity: 'order',
      amount: order.amount ? (typeof order.amount === 'string' ? parseInt(order.amount, 10) : order.amount) : 0,
      amount_paid: 0,
      amount_due: order.amount ? (typeof order.amount === 'string' ? parseInt(order.amount, 10) : order.amount) : 0,
      currency: order.currency || 'INR',
      receipt: order.receipt || `rcpt_${Date.now()}`,
      status: (order.status as RazorpayOrder['status']) || 'created',
      attempts: 0,
      notes: order.notes || {},
      created_at: order.created_at || Math.floor(Date.now() / 1000),
      offer_id: null
    };

    // Send success response
    return res.status(200).json({
      success: true,
      data: responseData,
      message: 'Order created successfully'
    });

  } catch (error) {
    console.error('Unexpected error in create-razorpay-order:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Payment service error',
      code: 'PAYMENT_SERVICE_ERROR',
      description: 'An unexpected error occurred while processing your payment',
    });
  }
}
