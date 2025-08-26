import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { useChat } from '@/contexts/ChatContext';

interface RejectVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReject: (reason: string) => Promise<void>;
  video: {
    id: string;
    videoId: string;
    title: string;
    thumbnailUrl?: string;
    uploadedBy: string;
  };
}

const RejectVideoModal: React.FC<RejectVideoModalProps> = ({
  isOpen,
  onClose,
  onReject,
  video,
}) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const { sendRejection } = useChat();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reason.trim()) {
      setError('Please provide a reason for rejection');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError('');
      
      // Send rejection message
      await sendRejection(video.uploadedBy, {
        id: video.id,
        videoId: video.videoId,
        title: video.title,
        thumbnailUrl: video.thumbnailUrl,
      }, reason);
      
      // Call the onReject handler to update the video status
      if (onReject) {
        await onReject(reason);
      }
      
      // Close the modal
      onClose();
    } catch (err) {
      console.error('Error rejecting video:', err);
      setError('Failed to reject video. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Reject Video
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            disabled={isSubmitting}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Body */}
        <div className="p-4">
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Are you sure you want to reject the video "{video.title}"?
          </p>
          
          {video.thumbnailUrl && (
            <div className="mb-4">
              <img
                src={video.thumbnailUrl}
                alt={video.title}
                className="h-32 w-full object-cover rounded-md"
              />
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label
                htmlFor="reason"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Reason for rejection (required)
              </label>
              <textarea
                id="reason"
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Please provide a reason for rejecting this video..."
                disabled={isSubmitting}
                required
              />
            </div>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !reason.trim()}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
              >
                {isSubmitting ? 'Rejecting...' : 'Reject Video'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RejectVideoModal;
