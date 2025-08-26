const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

app.get('/api/test-razorpay', (req, res) => {
  try {
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
      keyType: razorpayKey.startsWith('rzp_live_') ? 'Live' : 
              razorpayKey.startsWith('rzp_test_') ? 'Test' : 'Unknown',
      keyLast4: razorpayKey.slice(-4)
    });
  } catch (error) {
    console.error('Error checking Razorpay key:', error);
    return res.status(500).json({ 
      error: 'Error checking Razorpay key',
      details: error.message || 'Unknown error'
    });
  }
});

app.listen(PORT, () => {
  console.log(`Test server running on http://localhost:${PORT}`);
});
