import { databases, storage, ID, Query, DATABASE_ID, STUDY_MATERIALS_COLLECTION_ID, STUDY_MATERIALS_BUCKET_ID } from '../lib/appwrite';

export interface StudyMaterial {
  id?: string;
  title: string;
  description?: string;
  fileUrl?: string;
  fileType: string;
  fileSize?: number;
  courseId: string;
  teacherId?: string;
  uploadDate: string;
  fileId: string;
  uploadedBy: string;
  tags?: string[];
  isPublic?: boolean;
  subject?: string;
  status: 'pending' | 'approved' | 'rejected';
  [key: string]: any;
}

// Upload a new study material
export const uploadStudyMaterial = async (file: File, metadata: Omit<StudyMaterial, 'id' | 'fileUrl' | 'fileId' | 'uploadDate'>) => {
  let fileUpload: any = null;
  
  try {
    console.log('Starting file upload with metadata:', metadata);
    
    // 1. First, upload the file to storage
    console.log('Uploading file to storage...');
    fileUpload = await storage.createFile(
      STUDY_MATERIALS_BUCKET_ID,
      ID.unique(),
      file
    );
    console.log('File uploaded successfully, fileId:', fileUpload.$id);

    // 2. Get file preview URL
    const fileUrl = storage.getFileView(
      STUDY_MATERIALS_BUCKET_ID,
      fileUpload.$id
    ).toString();
    console.log('File URL generated:', fileUrl);
    
    // 3. Generate a unique document ID
    const documentId = ID.unique();
    
    // 4. Map MIME types to allowed file types
    const getFileType = (mimeType: string, fileName: string): string => {
      const extension = fileName.split('.').pop()?.toLowerCase() || '';
      const typeMap: Record<string, string> = {
        'application/pdf': 'pdf',
        'application/msword': 'doc',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'doc',
        'application/vnd.ms-powerpoint': 'ppt',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
        'video/': 'video',
        'audio/': 'mp3',
        'text/': '.txt'
      };
      
      // Check for specific MIME types first
      for (const [type, value] of Object.entries(typeMap)) {
        if (mimeType.startsWith(type)) {
          return value;
        }
      }
      
      // Check file extension as fallback
      const extensionMap: Record<string, string> = {
        'pdf': 'pdf',
        'doc': 'doc',
        'docx': 'doc',
        'ppt': 'ppt',
        'pptx': 'pptx',
        'mp4': 'video',
        'mov': 'video',
        'avi': 'video',
        'mp3': 'mp3',
        'wav': 'mp3',
        'txt': '.txt'
      };
      
      return extensionMap[extension] || 'pdf'; // Default to 'pdf' if type is unknown
    };
    
    const allowedFileType = getFileType(file.type || '', file.name);
    
    // 5. Prepare document data with all required fields
    const documentData = {
      // Required fields
      id: documentId,
      title: metadata.title || file.name.split('.')[0],
      description: metadata.description || '',
      fileId: fileUpload.$id,
      fileUrl: fileUrl,
      fileType: allowedFileType,
      fileSize: file.size,
      courseId: metadata.courseId, // Ensure this is included
      uploadedBy: metadata.uploadedBy || 'system',
      uploadDate: new Date().toISOString(),
      status: 'pending',
      
      // Optional fields with defaults
      isPublic: metadata.isPublic !== undefined ? metadata.isPublic : true,
      tags: Array.isArray(metadata.tags) ? metadata.tags : [],
      subject: metadata.subject || '',
      
      // Include teacherId if provided
      ...(metadata.teacherId && { teacherId: metadata.teacherId })
    };
    
    // Validate required fields
    if (!documentData.courseId) {
      throw new Error('courseId is required for study material upload');
    }

    console.log('Creating document with data:', JSON.stringify(documentData, null, 2));

    // 5. Create document in database
    const document = await databases.createDocument(
      DATABASE_ID,
      STUDY_MATERIALS_COLLECTION_ID,
      documentId, // Use the same ID we generated
      documentData
    );
    
    console.log('Document created successfully with ID:', document.$id);
    return document;
    
  } catch (error) {
    console.error('Error in uploadStudyMaterial:', error);
    
    // Try to clean up the file if document creation failed and we have a fileUpload
    if (fileUpload && error instanceof Error) {
      console.warn('Document creation failed, attempting to clean up uploaded file...');
      try {
        await storage.deleteFile(STUDY_MATERIALS_BUCKET_ID, fileUpload.$id);
        console.log('Cleaned up orphaned file');
      } catch (cleanupError) {
        console.error('Error cleaning up file:', cleanupError);
      }
    }
    
    throw error;
  }
};

// Get all study materials for a course
export const getCourseStudyMaterials = async (courseId: string) => {
  try {
    console.log('Fetching study materials for course:', courseId);
    
    // Get current user ID if available
    const currentUserId = localStorage.getItem('userId') || '';
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    console.log('Current user ID:', currentUserId, 'Is admin:', isAdmin);

    // Build the query
    const queries = [
      Query.equal('courseId', courseId)
    ];

    // For non-admin users, only show approved materials or materials uploaded by them
    if (!isAdmin) {
      queries.push(
        Query.or([
          Query.and([
            Query.equal('isPublic', true),
            Query.equal('status', 'approved')
          ]),
          Query.equal('uploadedBy', currentUserId)
        ])
      );
    }

    console.log('Executing query with:', queries);
    
    const response = await databases.listDocuments(
      DATABASE_ID,
      STUDY_MATERIALS_COLLECTION_ID,
      queries
    );

    console.log('Received', response.documents.length, 'study materials');
    
    // Filter out pending/rejected materials for non-admin users
    const filteredMaterials = isAdmin 
      ? response.documents 
      : response.documents.filter((doc: any) => 
          doc.status === 'approved' || doc.uploadedBy === currentUserId
        );
        
    return filteredMaterials;
  } catch (error) {
    console.error('Error fetching study materials:', error);
    // Return empty array instead of throwing to prevent UI crashes
    return [];
  }
};

// Get study material by ID
export const getStudyMaterialById = async (id: string) => {
  try {
    console.log('Fetching study material with ID:', id);
    
    const document = await databases.getDocument(
      DATABASE_ID,
      STUDY_MATERIALS_COLLECTION_ID,
      id
    );
    
    console.log('Retrieved study material:', document);
    
    // Check if the document is public or the user is the owner
    const currentUserId = localStorage.getItem('userId') || '';
    if (!document.isPublic && document.uploadedBy !== currentUserId) {
      console.warn('User not authorized to access this study material');
      throw new Error('You do not have permission to view this study material');
    }
    
    return document;
  } catch (error) {
    console.error('Error fetching study material:', error);
    // Return null instead of throwing to prevent UI crashes
    return null;
  }
};

// Delete a study material
export const deleteStudyMaterial = async (id: string, fileId: string) => {
  try {
    console.log('Deleting study material with ID:', id, 'File ID:', fileId);
    
    // 1. Get the document first to check permissions
    const document = await getStudyMaterialById(id);
    if (!document) {
      throw new Error('Study material not found');
    }
    
    // 2. Check if the current user is the owner
    const currentUserId = localStorage.getItem('userId') || '';
    if (document.uploadedBy !== currentUserId) {
      console.warn('User not authorized to delete this study material');
      throw new Error('You do not have permission to delete this study material');
    }
    
    // 3. Delete file from storage
    console.log('Deleting file from storage...');
    await storage.deleteFile(STUDY_MATERIALS_BUCKET_ID, fileId);
    
    // 4. Delete document from database
    console.log('Deleting document from database...');
    await databases.deleteDocument(
      DATABASE_ID,
      STUDY_MATERIALS_COLLECTION_ID,
      id
    );
    
    console.log('Successfully deleted study material');
    return { success: true };
  } catch (error) {
    console.error('Error deleting study material:', error);
    // Return error object instead of throwing to prevent UI crashes
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete study material' 
    };
  }
};
