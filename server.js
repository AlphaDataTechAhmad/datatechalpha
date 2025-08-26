import express from 'express';
import { createServer as createViteServer } from 'vite';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createProxyMiddleware } from 'http-proxy-middleware';
import Razorpay from 'razorpay';
import cors from 'cors';
import bodyParser from 'body-parser';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.VITE_PUBLIC_RAZORPAY_KEY_ID,
  key_secret: process.env.VITE_RAZORPAY_KEY_SECRET,
});

async function createServer() {
  const app = express();
  
  // Create Vite server in middleware mode
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });

  // Middleware
  app.use(cors());
  app.use(bodyParser.json());
  app.use(express.json());
  
  // Razorpay API endpoint
  app.post('/api/create-razorpay-order', async (req, res) => {
    try {
      console.log('Received Razorpay order request:', req.body);
      const { amount, currency = 'INR', receipt = `rcpt_${Date.now()}`, notes } = req.body;
      
      if (!amount) {
        return res.status(400).json({ 
          success: false, 
          error: 'Amount is required',
          code: 'MISSING_AMOUNT'
        });
      }
      
      const options = {
        amount: Math.round(amount), // Amount should be in paise (1 INR = 100 paise)
        currency,
        receipt,
        payment_capture: 1,
        notes: notes || {}
      };
      
      console.log('Creating Razorpay order with options:', options);
      const order = await razorpay.orders.create(options);
      console.log('Order created successfully:', order.id);
      
      res.json({ 
        success: true, 
        order 
      });
    } catch (error) {
      console.error('Error creating Razorpay order:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message || 'Failed to create order',
        code: error.code || 'RAZORPAY_ERROR',
        details: error.error || null
      });
    }
  });

  // Payment verification endpoint
  app.post('/api/verify-payment', async (req, res) => {
    try {
      const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
      
      // Create the expected signature
      const crypto = require('crypto');
      const text = `${razorpay_order_id}|${razorpay_payment_id}`;
      const signature = crypto
        .createHmac('sha256', process.env.VITE_RAZORPAY_KEY_SECRET)
        .update(text)
        .digest('hex');
      
      const isSignatureValid = signature === razorpay_signature;
      
      if (isSignatureValid) {
        // Save payment details to your database here
        res.json({ success: true, paymentId: razorpay_payment_id });
      } else {
        res.status(400).json({ success: false, error: 'Invalid signature' });
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message || 'Payment verification failed' 
      });
    }
  });

  // Use vite's connect instance as middleware
  app.use(vite.middlewares);

  // Serve static files from dist in production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(join(__dirname, 'dist')));
  }

  // Handle all routes
  app.get('*', async (req, res) => {
    try {
      const url = req.originalUrl;
      let template = '';
      
      if (process.env.NODE_ENV === 'development') {
        template = await vite.transformIndexHtml(url, `
          <!DOCTYPE html>
          <html lang="en">
            <head>
              <meta charset="UTF-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1.0" />
              <title>Your App</title>
            </head>
            <body>
              <div id="root"></div>
              <script type="module" src="/src/main.tsx"></script>
            </body>
          </html>
        `);
      } else {
        // In production, serve the built index.html
        template = `
          <!DOCTYPE html>
          <html lang="en">
            <head>
              <meta charset="UTF-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1.0" />
              <title>Your App</title>
            </head>
            <body>
              <div id="root"></div>
              <script type="module" src="/assets/index.js"></script>
            </body>
          </html>
        `;
      }
      res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      console.error(e);
      res.status(500).end(e.message);
    }
  });

  const PORT = process.env.PORT || 5173;
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

createServer().catch(console.error);
