import { Client, Databases, Storage, ID, Query, Models } from 'appwrite';

// Reel document interface
export interface ReelDocument extends Models.Document {
  videoId: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl?: string;
  isActive: boolean;
}

const client = new Client()
    .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
    .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

const databases = new Databases(client);
const storage = new Storage(client);

const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const collectionId = import.meta.env.VITE_APPWRITE_REELS_COLLECTION_ID;
export const videoBucketId = import.meta.env.VITE_APPWRITE_REELS_VIDEO_BUCKET_ID;
export const thumbnailBucketId = import.meta.env.VITE_APPWRITE_REELS_THUMBNAIL_BUCKET_ID;

// Reel interface
export interface ReelDocument {
  _id: string;
  videoId: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl?: string;
  isActive: boolean;
  $createdAt: string;
  $updatedAt: string;
  $collectionId: string;
  $databaseId: string;
  $permissions: string[];
}

// Get all active reels (for students/teachers)
export const getActiveReels = async (): Promise<{ documents: ReelDocument[] }> => {
  const response = await databases.listDocuments<ReelDocument>(
    databaseId,
    collectionId,
    [
      Query.equal('isActive', true),
      Query.orderDesc('$createdAt')
    ]
  );
  return { documents: response.documents as unknown as ReelDocument[] };
};

// Get all reels (admin only)
export const getAllReels = async (): Promise<{ documents: ReelDocument[] }> => {
  const response = await databases.listDocuments<ReelDocument>(
    databaseId,
    collectionId,
    [
      Query.orderDesc('$createdAt')
    ]
  );
  return { documents: response.documents as unknown as ReelDocument[] };
};

// Upload video file
export const uploadVideo = async (file: File): Promise<{ $id: string }> => {
  return storage.createFile(
    videoBucketId,
    ID.unique(),
    file
  );
};

// Upload thumbnail
export const uploadThumbnail = async (file: File): Promise<{ $id: string }> => {
  return storage.createFile(
    thumbnailBucketId,
    ID.unique(),
    file
  );
};

// Create new reel
export const createReelDocument = async (reelData: {
  title: string;
  description: string;
  videoId: string;
  videoUrl: string;
  thumbnailUrl?: string;
  isActive?: boolean;
}) => {
  try {
    console.log('Creating document in Appwrite with data:', {
      databaseId,
      collectionId,
      data: {
        title: reelData.title,
        description: reelData.description,
        videoId: reelData.videoId,
        videoUrl: reelData.videoUrl,
        thumbnailUrl: reelData.thumbnailUrl || '',
        isActive: reelData.isActive ?? true
      }
    });

    const document = await databases.createDocument<ReelDocument>(
      databaseId,
      collectionId,
      ID.unique(),
      {
        title: reelData.title,
        description: reelData.description,
        videoId: reelData.videoId,
        videoUrl: reelData.videoUrl,
        thumbnailUrl: reelData.thumbnailUrl || '',
        isActive: reelData.isActive ?? true
      }
    );

    console.log('Document created successfully:', document);
    return document;
  } catch (error) {
    console.error('Error creating document in Appwrite:', {
      error,
      reelData: {
        ...reelData,
        // Don't log potentially sensitive data in production
        videoUrl: reelData.videoUrl ? '*** URL PRESENT ***' : '*** MISSING URL ***'
      }
    });
    throw error;
  }
};

// Update reel
export const updateReelDocument = async (
  reelId: string,
  data: Partial<{
    title: string;
    description: string;
    isActive: boolean;
  }>
): Promise<ReelDocument> => {
  return databases.updateDocument<ReelDocument>(
    databaseId,
    collectionId,
    reelId,
    data
  );
};

// Delete reel
export const deleteReelDocument = async (reelId: string) => {
  return databases.deleteDocument(
    databaseId,
    collectionId,
    reelId
  );
};

// Get file preview URL
export const getFilePreview = (bucketId: string, fileId: string, width: number = 400): string => {
  // For video files, we want to use the view URL instead of preview
  if (bucketId === import.meta.env.VITE_APPWRITE_REELS_VIDEO_BUCKET_ID) {
    return getVideoUrl(fileId);
  }
  // For thumbnails and other files, use the preview URL
  return storage.getFilePreview(bucketId, fileId, width).toString();
};

// Delete file
export const deleteFile = (bucketId: string, fileId: string) => {
  return storage.deleteFile(bucketId, fileId);
};

// Get video URL
export const getVideoUrl = (fileId: string): string => {
  return `${import.meta.env.VITE_APPWRITE_ENDPOINT}/storage/buckets/${import.meta.env.VITE_APPWRITE_REELS_VIDEO_BUCKET_ID}/files/${fileId}/view?project=${import.meta.env.VITE_APPWRITE_PROJECT_ID}`;
};
