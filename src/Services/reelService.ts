import {
  createReelDocument,
  uploadVideo,
  uploadThumbnail,
  getFilePreview,
  ReelDocument,
  getActiveReels,
  getAllReels,
  updateReelDocument,
  deleteReelDocument,
  getVideoUrl,
  thumbnailBucketId
} from './appwriteService';

export interface Reel extends Omit<ReelDocument, '$id' | '$createdAt' | '$updatedAt'> {
  _id?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Get reels (admin view)
export const getReels = async (isAdmin: boolean = false): Promise<Reel[]> => {
  try {
    const response = isAdmin ? await getAllReels() : await getActiveReels();
    return response.documents.map((doc: ReelDocument) => ({
      _id: doc.$id,
      videoId: doc.videoId,
      title: doc.title,
      description: doc.description,
      videoUrl: doc.videoUrl,
      thumbnailUrl: doc.thumbnailUrl,
      isActive: doc.isActive,
      createdAt: doc.$createdAt,
      updatedAt: doc.$updatedAt
    }));
  } catch (error) {
    console.error('Error fetching reels:', error);
    throw error;
  }
};

// Create new reel
export const createReel = async (formData: FormData): Promise<Reel> => {
  try {
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const videoFile = formData.get('video') as File;
    const thumbnailFile = formData.get('thumbnail') as File | null;
    const isActive = formData.get('isActive') === 'true';

    console.log('Starting reel upload process...');
    
    // 1. Upload video file
    console.log('Uploading video file...');
    const videoUpload = await uploadVideo(videoFile);
    console.log('Video uploaded successfully:', videoUpload.$id);
    
    // 2. Upload thumbnail if provided
    let thumbnailUrl = '';
    if (thumbnailFile) {
      try {
        console.log('Uploading thumbnail...');
        const thumbnailUpload = await uploadThumbnail(thumbnailFile);
        thumbnailUrl = getFilePreview(thumbnailBucketId, thumbnailUpload.$id);
        console.log('Thumbnail uploaded successfully:', thumbnailUpload.$id);
      } catch (error) {
        console.error('Error uploading thumbnail:', error);
        // Continue without thumbnail if upload fails
      }
    }
    
    // 3. Create document in database
    console.log('Creating reel document...');
    const videoUrl = getVideoUrl(videoUpload.$id);
    
    const reelData = {
      title: title.trim(),
      description: description.trim(),
      videoId: videoUpload.$id, // Use the actual file ID from the upload
      videoUrl,
      thumbnailUrl,
      isActive
    };
    
    console.log('Creating reel with data:', JSON.stringify(reelData, null, 2));
    
    const reel = await createReelDocument(reelData);
    
    console.log('Reel created successfully:', reel.$id);
    
    return {
      _id: reel.$id,
      videoId: reel.videoId,
      title: reel.title,
      description: reel.description,
      videoUrl: reel.videoUrl,
      thumbnailUrl: reel.thumbnailUrl,
      isActive: reel.isActive,
      createdAt: reel.$createdAt,
      updatedAt: reel.$updatedAt
    };
  } catch (error) {
    console.error('Error creating reel:', error);
    throw error;
  }
};

// Toggle reel status
export const toggleReelStatus = async (id: string, isActive: boolean): Promise<Reel> => {
  try {
    console.log(`Updating reel ${id} status to:`, isActive);
    const reel = await updateReelDocument(id, { isActive });
    console.log('Updated reel:', reel);
    return {
      _id: reel.$id,
      videoId: reel.videoId,
      title: reel.title,
      description: reel.description,
      videoUrl: reel.videoUrl,
      thumbnailUrl: reel.thumbnailUrl,
      isActive: reel.isActive,
      createdAt: reel.$createdAt,
      updatedAt: reel.$updatedAt
    };
  } catch (error) {
    console.error('Error toggling reel status:', error);
    throw new Error(`Failed to update reel status: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Delete reel
export const deleteReel = async (id: string): Promise<void> => {
  try {
    console.log(`Deleting reel with ID: ${id}`);
    
    // First, get the reel to delete associated files
    const reels = await getReels(true); // true for admin view
    const reelToDelete = reels.find(reel => reel._id === id);
    
    if (!reelToDelete) {
      throw new Error('Reel not found');
    }
    
    // Delete the reel document
    console.log(`Deleting reel document: ${id}`);
    await deleteReelDocument(id);
    
    console.log('Successfully deleted reel document');
  } catch (error) {
    console.error('Error deleting reel:', error);
    throw new Error(`Failed to delete reel: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
