import React, { useState, FormEvent, ChangeEvent, useRef } from 'react';
import { ID } from 'appwrite';
import { storage, databases } from '@/Services/appwrite';
import { useAuth } from '@/contexts/AuthContext';
import { AlertCircle, Loader, Upload as UploadIcon, Youtube as YoutubeIcon, Image as ImageIcon, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

type VideoUploadData = {
  type: 'youtube' | 'upload';
  url: string;
  thumbnailUrl?: string;
  thumbnailId?: string;
  thumbnailMimeType?: string;
  fileId?: string;
  title: string;
  description: string;
  subject: string;
  courseId: string;
  uploadedBy: string;
  status: 'pending' | 'approved' | 'rejected';
};

type VideoUploaderProps = {
  courseId: string;
  onSuccess?: () => void;
  onClose: () => void;
};

const VideoUploader: React.FC<VideoUploaderProps> = ({ courseId, onSuccess, onClose }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [isPending, setIsPending] = useState(false);
  
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTabChange = (newValue: number) => {
    setActiveTab(newValue);
    setError('');
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const maxSize = 5 * 1024 * 1024 * 1024; // 5GB limit
      if (file.size > maxSize) {
        setError('Video file size should be less than 5GB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleThumbnailChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file for thumbnail');
        return;
      }
      const maxThumbnailSize = 500 * 1024 * 1024; // 500MB limit
      if (file.size > maxThumbnailSize) {
        setError('Thumbnail size should be less than 500MB');
        return;
      }
      setThumbnailFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerThumbnailInput = () => {
    thumbnailInputRef.current?.click();
  };

  const handleRemoveThumbnail = (e: React.MouseEvent) => {
    e.stopPropagation();
    setThumbnailFile(null);
    setThumbnailPreview(null);
    if (thumbnailInputRef.current) {
      thumbnailInputRef.current.value = '';
    }
  };

  const extractYoutubeId = (url: string) => {
    if (!url) return null;
    
    // Handle full URL formats
    if (url.includes('youtube.com/watch?v=')) {
      return url.split('v=')[1].split('&')[0];
    }
    if (url.includes('youtu.be/')) {
      return url.split('youtu.be/')[1].split('?')[0];
    }
    return url;
  };

  const handleYoutubeSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!youtubeUrl) {
      setError('Please enter a YouTube URL');
      return;
    }
    if (!title) {
      setError('Please enter a title for the video');
      return;
    }
    if (!subject) {
      setError('Please enter a subject for the video');
      return;
    }

    try {
      setIsUploading(true);
      setError('');
      
      const videoId = extractYoutubeId(youtubeUrl);
      if (!videoId) {
        setError('Invalid YouTube URL');
        return;
      }

      await saveVideo({
        type: 'youtube',
        url: `https://www.youtube.com/watch?v=${videoId}`,
        thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        title,
        description,
        subject,
        courseId,
        status: 'pending',
        uploadedBy: user?.$id || 'unknown'
      });
    } catch (err) {
      console.error('Error processing YouTube URL:', err);
      setError('Failed to process YouTube video. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileUpload = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      setError('Please select a video file');
      return;
    }
    
    if (!title) {
      setError('Please enter a title for the video');
      return;
    }
    
    if (!subject) {
      setError('Please enter a subject for the video');
      return;
    }

    try {
      setIsUploading(true);
      setError('');
      
      // Upload the video file to Appwrite storage
      // Generate a shorter, alphanumeric ID without special characters
      const fileId = `vid_${Math.random().toString(36).substring(2, 10)}`;
      
      const file = await storage.createFile(
        '6826481d00212029492a', // Video uploads bucket ID
        fileId,
        selectedFile
      );

      // Get the file URL
      const fileUrl = storage.getFileView('6826481d00212029492a', file.$id);
      
      await saveVideo({
        type: 'upload',
        url: fileUrl.toString(),
        fileId: fileId,
        title,
        description,
        subject,
        courseId,
        status: 'pending',
        uploadedBy: user?.$id || 'unknown'
      });

    } catch (err) {
      console.error('Error uploading file:', err);
      setError('Failed to upload video. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const saveVideo = async (data: VideoUploadData) => {
    try {
      setIsPending(true);
      setError('');
      
      const { type, url, thumbnailUrl, fileId, title, courseId, subject } = data;
      
      // Log the data being received
      console.log('saveVideo called with data:', { 
        title: data.title,
        subject: data.subject,
        courseId: data.courseId,
        hasSubject: 'subject' in data
      });
      
      // Upload thumbnail if provided
      let thumbnailUrlToSave = thumbnailUrl;
      let thumbnailId = '';
      let thumbnailMimeType = '';
      
      if (thumbnailFile) {
        try {
          const thumbnailFileId = `thumb_${Math.random().toString(36).substring(2, 10)}`;
          await storage.createFile(
            '6826481d00212029492a', // Same bucket as videos
            thumbnailFileId,
            thumbnailFile
          );
          thumbnailUrlToSave = storage.getFileView('6826481d00212029492a', thumbnailFileId).toString();
          thumbnailId = thumbnailFileId;
          thumbnailMimeType = thumbnailFile.type;
        } catch (err) {
          console.error('Error uploading thumbnail:', err);
          // Continue without thumbnail if upload fails
        }
      }
      
      // Generate a unique ID for the video document
      const videoId = ID.unique();
      
      // Prepare video data
      const videoData = {
        videoId,
        type,
        url,
        title,
        description,
        subject, // Include subject from destructured data
        courseId,
        status: 'pending',
        uploadedBy: user?.$id || 'unknown',
        createdAt: new Date().toISOString(),
        ...(thumbnailUrlToSave && { thumbnailUrl: thumbnailUrlToSave }),
        ...(thumbnailId && { thumbnailId }),
        ...(thumbnailMimeType && { thumbnailMimeType }),
        ...(fileId && { fileId })
      };
      
      console.log('Video data being saved:', JSON.stringify(videoData, null, 2));
      
      console.log('Video data being saved:', JSON.stringify(videoData, null, 2));
      
      console.log('Saving video data:', videoData);
      
      const result = await databases.createDocument(
        '68261b6a002ba6c3b584', // Database ID
        '685457d5000a277435ef', // Videos Collection ID
        videoId,
        videoData
      );
      
      console.log('Video saved successfully:', result);
      
      // Reset form
      setTitle('');
      setDescription('');
      setSubject('');
      setYoutubeUrl('');
      setSelectedFile(null);
      setThumbnailFile(null);
      setThumbnailPreview(null);
      setActiveTab(0);
      
      // Reset file inputs
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (thumbnailInputRef.current) thumbnailInputRef.current.value = '';
      
      // Show success message
      toast.success('Video submitted for review! It will be visible to students after admin approval.');
      
      // Notify parent component that upload was successful
      onSuccess?.();
      
      // Close the uploader
      onClose();
      
      return result;
    } catch (error) {
      console.error('Error saving video:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to upload video. Please try again.';
      
      setError(errorMessage);
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsUploading(false);
      setIsPending(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 relative">
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        aria-label="Close uploader"
      >
        <X className="h-5 w-5" />
      </button>
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
        <button
          type="button"
          onClick={() => handleTabChange(0)}
          className={`py-2 px-4 font-medium text-sm ${activeTab === 0 ? 'text-blue-600 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
        >
          <YoutubeIcon className="inline mr-2 h-5 w-5" />
          YouTube URL
        </button>
        <button
          type="button"
          onClick={() => handleTabChange(1)}
          className={`py-2 px-4 font-medium text-sm ${activeTab === 1 ? 'text-blue-600 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
        >
          <UploadIcon className="inline mr-2 h-5 w-5" />
          Upload Video
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="p-2">
        {isPending ? (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Video Submitted!</h3>
            <p className="text-gray-600 dark:text-gray-300">Your video is pending admin approval.</p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter video title"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Thumbnail (Optional)
                </label>
                <div className="flex items-center space-x-4">
                  <div 
                    onClick={triggerThumbnailInput}
                    className="w-32 h-24 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-colors"
                  >
                    {thumbnailPreview ? (
                      <div className="relative w-full h-full">
                        <img 
                          src={thumbnailPreview} 
                          alt="Thumbnail preview" 
                          className="w-full h-full object-cover rounded-md"
                        />
                        <button
                          type="button"
                          onClick={handleRemoveThumbnail}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <ImageIcon className="w-6 h-6 text-gray-400" />
                        <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">Click to upload</span>
                      </>
                    )}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {thumbnailFile ? 
                      <span className="text-green-600">Thumbnail selected</span> : 
                      'No thumbnail selected. Recommended size: 1280x720'}
                  </div>
                </div>
                <input
                  type="file"
                  ref={thumbnailInputRef}
                  onChange={handleThumbnailChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              <div className="mb-4">
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Subject <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter subject (e.g., Mathematics, Science)"
                  required
                />
              </div>

              <div className="mb-4">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter video description (optional)"
                />
              </div>

              {activeTab === 0 ? (
                <form onSubmit={handleYoutubeSubmit}>
                  <div className="mb-4">
                    <label htmlFor="youtubeUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      YouTube Video URL <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="url"
                      id="youtubeUrl"
                      value={youtubeUrl}
                      onChange={(e) => setYoutubeUrl(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isUploading}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUploading ? (
                      <>
                        <Loader className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                        Processing...
                      </>
                    ) : 'Submit YouTube Video'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleFileUpload}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Video File <span className="text-red-500">*</span>
                    </label>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md cursor-pointer hover:border-blue-500 transition-colors"
                    >
                      <div className="space-y-1 text-center">
                        <svg
                          className="mx-auto h-12 w-12 text-gray-400"
                          stroke="currentColor"
                          fill="none"
                          viewBox="0 0 48 48"
                          aria-hidden="true"
                        >
                          <path
                            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <div className="flex text-sm text-gray-600 dark:text-gray-300">
                          <span className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                            Upload a file
                          </span>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          MP4, WebM up to 5GB
                        </p>
                      </div>
                      <input
                        ref={fileInputRef}
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        accept="video/mp4,video/webm"
                        onChange={handleFileChange}
                      />
                    </div>
                    {selectedFile && (
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        Selected file: {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                      </p>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={isUploading || !selectedFile}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUploading ? (
                      <>
                        <Loader className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                        Uploading...
                      </>
                    ) : 'Upload Video'}
                  </button>
                </form>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default VideoUploader;
