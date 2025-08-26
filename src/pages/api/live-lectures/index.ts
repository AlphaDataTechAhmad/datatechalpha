import { NextApiRequest, NextApiResponse } from 'next';
import { Client, Databases, Query, ID, Permission, Role } from 'appwrite';

// Initialize Appwrite client
const client = new Client()
  .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
  .setProject(process.env.VITE_APPWRITE_PROJECT_ID || '68261b6a002ba6c3b584');

const databases = new Databases(client);

// Database and collection IDs - using direct IDs for reliability
const DATABASE_ID = '68261b6a002ba6c3b584'; // Your database ID
const LIVE_LECTURES_COLLECTION_ID = '684bc356000b2a6e138f'; // liveLectures collection
const LECTURE_CHAT_COLLECTION_ID = '684bf08100271eb46ff2'; // lectureChat collection
const LECTURE_PARTICIPANTS_COLLECTION_ID = '684befdc000faa15a86e'; // lectureParticipants collection

// Log configuration on startup
console.log('Appwrite Configuration:', {
  endpoint: process.env.VITE_APPWRITE_ENDPOINT,
  projectId: process.env.VITE_APPWRITE_PROJECT_ID,
  databaseId: DATABASE_ID,
  lecturesCollectionId: LIVE_LECTURES_COLLECTION_ID,
  chatCollectionId: LECTURE_CHAT_COLLECTION_ID,
  participantsCollectionId: LECTURE_PARTICIPANTS_COLLECTION_ID
});

// Helper function to handle errors
const handleError = (res: NextApiResponse, error: any, statusCode: number = 400) => {
  console.error('Error:', error);
  const errorResponse = {
    success: false,
    error: error.message || 'Something went wrong',
    ...(process.env.NODE_ENV === 'development' && {
      stack: error.stack,
      details: error.details
    })
  };
  
  // Ensure we always send a valid JSON response
  res.setHeader('Content-Type', 'application/json');
  res.status(statusCode).json(errorResponse);
};

// Health check endpoint
const handleHealthCheck = (req: NextApiRequest, res: NextApiResponse) => {
  console.log('Health check requested');
  return res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    appwrite: {
      endpoint: process.env.VITE_APPWRITE_ENDPOINT ? 'configured' : 'missing',
      projectId: process.env.VITE_APPWRITE_PROJECT_ID ? 'configured' : 'missing',
      databaseId: process.env.VITE_APPWRITE_DATABASE_ID ? 'configured' : 'missing',
      collectionId: process.env.VITE_APPWRITE_LIVE_LECTURES_COLLECTION_ID ? 'configured' : 'missing'
    }
  });
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Handle health check endpoint
  if (req.url === '/api/live-lectures/health') {
    return handleHealthCheck(req, res);
  }

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');

  // Log incoming request
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`, {
    query: req.query,
    body: req.body,
    headers: req.headers
  });

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    // Log the incoming request method and URL
    console.log(`=== ${req.method} ${req.url} ===`);
    console.log('Request headers:', JSON.stringify(req.headers, null, 2));
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    // Ensure we have a valid content type for POST requests
    const contentType = req.headers['content-type'];
    if (req.method === 'POST' && (!contentType || !contentType.includes('application/json'))) {
      return res.status(415).json({
        success: false,
        error: 'Content-Type must be application/json'
      });
    }

    // Parse JSON body if it's a POST request
    if (req.method === 'POST' && req.body) {
      try {
        if (typeof req.body === 'string') {
          req.body = JSON.parse(req.body);
        }
      } catch (parseError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid JSON in request body'
        });
      }
    }

    try {
      switch (req.method) {
        case 'GET':
          await handleGet(req, res);
          break;
        case 'POST':
          await handlePost(req, res);
          break;
        default:
          res.setHeader('Allow', ['GET', 'POST']);
          res.status(405).json({
            success: false,
            error: `Method ${req.method} Not Allowed`
          });
      }
    } catch (error) {
      handleError(res, error, 500);
    }
  } catch (error) {
    console.error('Unhandled error in API route:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      ...(process.env.NODE_ENV === 'development' && {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      })
    });
  }
}

// GET /api/live-lectures?courseId=:courseId
async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { courseId } = req.query;
    
    console.log('Fetching lectures with query:', { courseId });
    
    if (!courseId) {
      return res.status(400).json({ 
        success: false, 
        error: 'courseId is required' 
      });
    }

    try {
      console.log('Querying Appwrite database...', {
        databaseId: DATABASE_ID,
        collectionId: LIVE_LECTURES_COLLECTION_ID,
        query: [
          `equal('courseId', '${courseId}')`,
          'orderDesc("startTime")'
        ]
      });
      
      const response = await databases.listDocuments(
        DATABASE_ID,
        LIVE_LECTURES_COLLECTION_ID,
        [
          Query.equal('courseId', courseId as string),
          Query.orderDesc('startTime')
        ]
      );
      
      console.log('Successfully fetched documents:', {
        total: response.total,
        documents: response.documents.map(doc => ({
          id: doc.$id,
          title: doc.title,
          startTime: doc.startTime,
          status: doc.status
        }))
      });
      
      return res.status(200).json({
        success: true,
        data: response.documents
      });
    } catch (dbError: any) {
      console.error('Database query error:', {
        message: dbError.message,
        code: dbError.code,
        type: dbError.type,
        response: dbError.response,
        stack: dbError.stack
      });
      
      throw new Error(`Failed to fetch lectures: ${dbError.message}`);
    }
  } catch (error: any) {
    console.error('Error in handleGet:', {
      message: error.message,
      stack: error.stack,
      query: req.query
    });
    
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch lectures',
      ...(process.env.NODE_ENV === 'development' && {
        message: error.message,
        stack: error.stack
      })
    });
  }
}

// POST /api/live-lectures
async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  console.log('=== STARTING NEW LECTURE CREATION ===');
  
  try {
    console.log('Request method:', req.method);
    console.log('Request headers:', req.headers);
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const { 
      courseId, 
      title, 
      description, 
      startTime, 
      duration = 60, // Default to 60 minutes if not provided
      teacherId, 
      teacherName,
      maxParticipants = 100
    } = req.body;

    // Log received data
    console.log('Parsed request data:', {
      courseId,
      title,
      description,
      startTime,
      duration,
      teacherId,
      teacherName,
      maxParticipants
    });

    // Validate required fields
    const requiredFields = {
      courseId: 'Course ID',
      title: 'Title',
      startTime: 'Start Time',
      teacherId: 'Teacher ID',
      teacherName: 'Teacher Name'
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([field]) => !req.body[field])
      .map(([_, name]) => name);

    if (missingFields.length > 0) {
      const errorMsg = `Missing required fields: ${missingFields.join(', ')}`;
      console.error('Validation error:', errorMsg);
      return res.status(400).json({
        success: false,
        error: errorMsg,
        missingFields
      });
    }

    try {
      console.log('Preparing to create document in Appwrite...');
      
      // Calculate end time from start time and duration
      const startDate = new Date(startTime);
      const endDate = new Date(startDate.getTime() + (duration * 60 * 1000));
      
      // Prepare document data
      const documentData = {
        title,
        description: description || '',
        courseId,
        teacherId,
        teacherName: teacherName.trim(),
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
        duration: parseInt(duration, 10),
        maxParticipants: parseInt(maxParticipants, 10) || 100,
        status: 'scheduled',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      console.log('Document data prepared:', JSON.stringify(documentData, null, 2));
      
      // Set permissions - allow public read, teacher can update/delete
      const permissions = [
        Permission.read(Role.any()), // Public read
        Permission.update(Role.user(teacherId)),
        Permission.delete(Role.user(teacherId))
      ];
      
      console.log('Using permissions:', JSON.stringify(permissions, null, 2));
      
      console.log('Creating document in collection:', LIVE_LECTURES_COLLECTION_ID);
      console.log('In database:', DATABASE_ID);
      
      // Create the document in Appwrite
      const document = await databases.createDocument(
        DATABASE_ID,
        LIVE_LECTURES_COLLECTION_ID,
        ID.unique(),
        documentData,
        permissions
      );
      
      console.log('Document created successfully:', {
        id: document.$id,
        title: document.title,
        status: document.status,
        startTime: document.startTime,
        endTime: document.endTime
      });
      
      return res.status(201).json({
        success: true,
        data: document
      });
      
    } catch (dbError: any) {
      console.error('=== DATABASE ERROR ===');
      console.error('Error message:', dbError.message);
      console.error('Error code:', dbError.code);
      console.error('Error type:', dbError.type);
      
      if (dbError.response) {
        console.error('Error response status:', dbError.response.status);
        console.error('Error response data:', dbError.response.data);
      }
      
      console.error('Full error object:', JSON.stringify(dbError, Object.getOwnPropertyNames(dbError), 2));
      
      return res.status(500).json({
        success: false,
        error: 'Failed to create lecture in database',
        ...(process.env.NODE_ENV === 'development' && {
          message: dbError.message,
          code: dbError.code,
          type: dbError.type
        })
      });
    }
  } catch (error: any) {
    console.error('=== UNHANDLED ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred',
      ...(process.env.NODE_ENV === 'development' && {
        message: error.message,
        stack: error.stack
      })
    });
  } finally {
    console.log('=== LECTURE CREATION PROCESS COMPLETED ===\n');
  }
  }