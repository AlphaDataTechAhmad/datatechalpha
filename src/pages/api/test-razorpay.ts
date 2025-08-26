import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // This will show if the server has access to the key
    const razorpayKey = process.env.RAZORPAY_KEY_ID || process.env.VITE_PUBLIC_RAZORPAY_KEY_ID;
    
    if (!razorpayKey) {
      return res.status(500).json({ 
        error: 'Razorpay key not found in environment variables',
        env: process.env.NODE_ENV,
        keys: {
          RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID ? '***' + process.env.RAZORPAY_KEY_ID.slice(-4) : 'Not found',
          VITE_PUBLIC_RAZORPAY_KEY_ID: process.env.VITE_PUBLIC_RAZORPAY_KEY_ID ? '***' + process.env.VITE_PUBLIC_RAZORPAY_KEY_ID.slice(-4) : 'Not found'
        }
      });
    }

    return res.status(200).json({
      success: true,
      keyExists: true,
      keyPrefix: razorpayKey.startsWith('rzp_live_') ? 'Live' : 
                razorpayKey.startsWith('rzp_test_') ? 'Test' : 'Unknown',
      keyLast4: razorpayKey.slice(-4)
    });
  } catch (error) {
    console.error('Error checking Razorpay key:', error);
    return res.status(500).json({ 
      error: 'Error checking Razorpay key',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
