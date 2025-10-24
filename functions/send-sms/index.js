const twilio = require('twilio');

// Twilio credentials
const TWILIO_ACCOUNT_SID = 'ACa398727d84f21a403632114eed1f5821';
const TWILIO_AUTH_TOKEN = '7fefa7445f78ff96d3d11146ada11e60';
const TWILIO_PHONE_NUMBER = '+12183181485';

// For production, use environment variables
// const {
//   TWILIO_ACCOUNT_SID,
//   TWILIO_AUTH_TOKEN,
//   TWILIO_PHONE_NUMBER
// } = process.env;

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Appwrite-Project, X-Appwrite-Key');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).send('OK');
  }

  try {
    // Parse the request body
    let payload;
    try {
      payload = JSON.parse(req.body);
    } catch (e) {
      return res.status(400).json({
        success: false,
        message: 'Invalid JSON payload'
      });
    }

    const { to, message } = payload;

    // Input validation
    if (!to || !message) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: to and message are required'
      });
    }

    // Initialize Twilio client
    const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

    // Send SMS
    const result = await client.messages.create({
      body: message,
      from: TWILIO_PHONE_NUMBER,
      to: to.startsWith('+') ? to : `+${to}` // Ensure country code is included
    });

    // Log success (optional)
    console.log(`SMS sent to ${to}. SID: ${result.sid}`);

    // Return success response
    return res.json({
      success: true,
      message: 'SMS sent successfully',
      sid: result.sid,
      to: to,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error sending SMS:', error);
    
    // More detailed error handling
    let errorMessage = 'Failed to send SMS';
    let statusCode = 500;

    if (error.code === 21211) {
      errorMessage = 'Invalid phone number format';
      statusCode = 400;
    } else if (error.code === 21614) {
      errorMessage = 'This phone number is not currently reachable';
      statusCode = 400;
    } else if (error.code === 21608) {
      errorMessage = 'This number is unverified. Please verify it in Twilio console first.';
      statusCode = 400;
    }

    return res.status(statusCode).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: error.code
    });
  }
};
