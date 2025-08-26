import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Client, Databases, ID, Query } from 'appwrite';
import morgan from 'morgan';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// CORS configuration
const corsOptions = {
  origin: 'http://localhost:5173', // Your frontend URL
  credentials: true, // Allow credentials (cookies, authorization headers, etc.)
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200 // Some legacy browsers (IE11, various SmartTVs) choke on 204
};

// Middleware
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Enable preflight for all routes
app.use(express.json());
app.use(morgan('dev')); // HTTP request logger

// Log environment variables on startup
console.log('Environment Variables:');
console.log('APPWRITE_ENDPOINT:', process.env.VITE_APPWRITE_ENDPOINT);
console.log('APPWRITE_PROJECT_ID:', process.env.VITE_APPWRITE_PROJECT_ID ? '***' : 'Not set');
console.log('APPWRITE_DATABASE_ID:', process.env.VITE_APPWRITE_DATABASE_ID || 'Not set');
console.log('LIVE_LECTURES_COLLECTION_ID:', process.env.VITE_APPWRITE_LIVE_LECTURES_COLLECTION_ID || 'Not set');

// Initialize Appwrite client
const client = new Client()
  .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT)
  .setProject(process.env.VITE_APPWRITE_PROJECT_ID);

const databases = new Databases(client);

// Test Appwrite connection
async function testAppwriteConnection() {
  try {
    console.log('Testing Appwrite connection...');
    const response = await databases.listDocuments(
      process.env.VITE_APPWRITE_DATABASE_ID,
      process.env.VITE_APPWRITE_LIVE_LECTURES_COLLECTION_ID,
      [Query.limit(1)]
    );
    console.log('Appwrite connection successful!');
    return true;
  } catch (error) {
    console.error('Appwrite connection error:', error.message);
    return false;
  }
}

// Test the connection on startup
testAppwriteConnection().then(success => {
  if (!success) {
    console.warn('Warning: Could not establish initial connection to Appwrite. Some features may not work correctly.');
  }
});

// Routes
app.get('/api/health', (req, res) => {
  console.log('Health check endpoint called');
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    appwrite: {
      endpoint: process.env.VITE_APPWRITE_ENDPOINT ? 'Configured' : 'Not configured',
      projectId: process.env.VITE_APPWRITE_PROJECT_ID ? 'Configured' : 'Not configured',
      databaseId: process.env.VITE_APPWRITE_DATABASE_ID || 'Not configured',
      liveLecturesCollection: process.env.VITE_APPWRITE_LIVE_LECTURES_COLLECTION_ID || 'Not configured'
    }
  });
});

// Live Lectures API
app.get('/api/live-lectures', async (req, res) => {
  try {
    const { courseId } = req.query;
    
    if (!courseId) {
      return res.status(400).json({ error: 'courseId is required' });
    }

    const response = await databases.listDocuments(
      process.env.VITE_APPWRITE_DATABASE_ID,
      process.env.VITE_APPWRITE_LIVE_LECTURES_COLLECTION_ID,
      [
        Query.equal('courseId', courseId),
        Query.orderDesc('scheduledTime')
      ]
    );

    res.json(response.documents);
  } catch (error) {
    console.error('Error fetching live lectures:', error);
    res.status(500).json({ error: 'Failed to fetch live lectures' });
  }
});

app.post('/api/live-lectures', async (req, res) => {
  try {
    console.log('Received request to create live lecture:', JSON.stringify(req.body, null, 2));
    
    const lectureData = req.body;
    
    // Validate required fields
    const requiredFields = ['courseId', 'teacherId', 'title', 'scheduledTime'];
    const missingFields = requiredFields.filter(field => !lectureData[field]);
    
    if (missingFields.length > 0) {
      const errorMsg = `Missing required fields: ${missingFields.join(', ')}`;
      console.error('Validation error:', errorMsg);
      return res.status(400).json({ 
        error: 'Missing required fields',
        missingFields,
        receivedData: lectureData 
      });
    }

    console.log('Attempting to create document in Appwrite...');
    console.log('Database ID:', process.env.VITE_APPWRITE_DATABASE_ID);
    console.log('Collection ID:', process.env.VITE_APPWRITE_LIVE_LECTURES_COLLECTION_ID);
    
    // Handle both startTime and scheduledTime for backward compatibility
    const scheduledTime = lectureData.scheduledTime || lectureData.startTime;
    if (!scheduledTime) {
      throw new Error('Either scheduledTime or startTime is required');
    }

    const documentData = {
      ...lectureData,
      scheduledTime, // Ensure we always use scheduledTime
      status: 'scheduled',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Remove startTime to avoid duplicate fields
    if (documentData.startTime) {
      delete documentData.startTime;
    }
    
    console.log('Document data to be created:', JSON.stringify(documentData, null, 2));
    
    const response = await databases.createDocument(
      process.env.VITE_APPWRITE_DATABASE_ID,
      process.env.VITE_APPWRITE_LIVE_LECTURES_COLLECTION_ID,
      ID.unique(),
      documentData
    );

    console.log('Successfully created document:', response.$id);
    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating live lecture:', {
      message: error.message,
      code: error.code,
      type: error.type,
      response: error.response,
      stack: error.stack
    });
    res.status(500).json({ 
      error: 'Failed to create live lecture',
      details: error.message,
      code: error.code || 'UNKNOWN_ERROR'
    });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
