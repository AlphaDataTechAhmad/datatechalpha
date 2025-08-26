import type { NextApiRequest, NextApiResponse } from 'next';
import { handleRazorpayWebhook, verifyWebhookSignature } from '@/utils/razorpayWebhook';
import { PaymentDocument } from '@/types/appwrite';

// Disable body parser, we'll handle the raw body
export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper to get raw body from request
const getRawBody = (req: any): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    // Get the raw request body
    const rawBody = await getRawBody(req);
    const signature = req.headers['x-razorpay-signature'] as string;
    
    // Verify webhook signature
    const isValidSignature = verifyWebhookSignature(
      rawBody.toString(),
      signature,
      process.env.RAZORPAY_WEBHOOK_SECRET || ''
    );

    if (!isValidSignature) {
      console.error('Invalid webhook signature');
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid signature' 
      });
    }

    // Parse the webhook payload
    const payload = JSON.parse(rawBody.toString()) as {
      event: string;
      payload: any;
      created_at: number;
    };

    console.log(`Received ${payload.event} webhook`);
    
    // Handle the webhook event
    const result = await handleRazorpayWebhook({
      event: payload.event,
      payload: payload.payload
    });

    if (!result.success) {
      throw new Error('Failed to process webhook');
    }

    // Return success response
    return res.status(200).json({ 
      success: true, 
      message: 'Webhook processed successfully' 
    });

  } catch (error) {
    console.error('Webhook error:', error);
    
    // Handle specific error cases
    if (error instanceof SyntaxError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid JSON payload'
      });
    }

    // Generic error response
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
