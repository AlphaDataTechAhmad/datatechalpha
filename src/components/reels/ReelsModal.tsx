import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, VolumeX, Volume2, Play, Pause, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getVideoUrl } from '../../Services/appwriteService';

interface Reel {
  _id: string;
  videoId: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ReelsModalProps {
  reels: Reel[];
  currentIndex: number;
  onClose: () => void;
  // onNext and onPrev are handled internally
}

const ReelsModal: React.FC<ReelsModalProps> = ({ reels, currentIndex: initialIndex, onClose }) => { // Removed unused props
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);

  const currentReel = reels?.[currentIndex];

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => {
      const nextIndex = prev < reels.length - 1 ? prev + 1 : 0;
      return nextIndex;
    });
    // Don't autoplay when changing reels
    setIsPlaying(false);
  }, [reels.length]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => {
      const prevIndex = prev > 0 ? prev - 1 : reels.length - 1;
      return prevIndex;
    });
    // Don't autoplay when changing reels
    setIsPlaying(false);
  }, [reels.length]);

  const togglePlay = async () => {
    if (!videoRef.current) return;
    
    try {
      if (isPlaying) {
        await videoRef.current.pause();
        setIsPlaying(false);
      } else {
        // Reset error state when attempting to play
        setError(null);
        
        try {
          await videoRef.current.play();
          setIsPlaying(true);
        } catch (playError) {
          console.error('Error playing video:', playError);
          setError('Failed to play video. Please try again.');
          setIsPlaying(false);
        }
      }
    } catch (error) {
      console.error('Error toggling play/pause:', error);
      setError('An error occurred while controlling playback.');
    }
  };

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    switch (e.key) {
      case 'Escape':
        onClose();
        break;
      case 'ArrowLeft':
        handlePrev();
        break;
      case 'ArrowRight':
        handleNext();
        break;
      case ' ':
        e.preventDefault(); // Prevent page scroll
        togglePlay();
        break;
      case 'm':
      case 'M':
        toggleMute();
        break;
      default:
        break;
    }
  }, [handleNext, handlePrev, onClose, toggleMute, togglePlay]);

  // Sync video play/pause state
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Only play/pause when explicitly toggled by the user
    if (isPlaying) {
      video.play().catch(e => {
        console.error('Error playing video:', e);
        setIsPlaying(false);
      });
    } else {
      video.pause();
    }
  }, [isPlaying]);

  // Handle keyboard events
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // Handle reel change and update video URL
  useEffect(() => {
    if (reels.length === 0) return;
    
    const currentReel = reels[currentIndex];
    if (!currentReel?.videoId) return;
    
    let isMounted = true;
    
    const loadVideo = async () => {
      try {
        // Get the authenticated video URL
        const url = getVideoUrl(currentReel.videoId);
        console.log('Generated video URL:', url);
        
        // The video element will include cookies automatically with credentials: 'include'
        setVideoUrl(url);
        setError(null);
        
        if (!isMounted) return;
        
        // Setup the video element without autoplay
        if (videoRef.current) {
          // Reset the video element
          videoRef.current.pause();
          videoRef.current.load();
          
          // Set up the video source with proper MIME type and credentials
          const sourceElement = videoRef.current.querySelector('source');
          if (sourceElement) {
            sourceElement.src = url;
            sourceElement.type = 'video/mp4';
          }
          
          // Don't try to autoplay, just load the video
          setIsPlaying(false);
        }
      } catch (err) {
        console.error('Error loading video:', err);
        if (isMounted) {
          setError('Failed to load video. Please check your connection and try again.');
        }
      }
    };
    
    loadVideo();
    
    return () => {
      isMounted = false;
    };
  }, [currentIndex, reels]);

  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const video = e.currentTarget as HTMLVideoElement;
    const error = video.error;
    
    // Skip if this is a network error we're already handling
    if (video.networkState === 2) { // NETWORK_NO_SOURCE
      return;
    }
    
    let errorMessage = 'Failed to load video. ';
    
    if (error) {
      // Log the error details for debugging
      // Handle different error codes with proper TypeScript types
      switch(error.code) {
        case 1: // MEDIA_ERR_ABORTED
          errorMessage = 'Video playback was aborted.';
          break;
        case 2: { // MEDIA_ERR_NETWORK
          errorMessage = 'Network error while loading the video. Please check your connection.';
          // If we get a network error, try to reload the video
          if (video.networkState === 3) { // NETWORK_EMPTY
            video.load();
          }
          break;
        }
        case 3: // MEDIA_ERR_DECODE
          errorMessage = 'Error decoding the video. The format might not be supported.';
          break;
        case 4: // MEDIA_ERR_SRC_NOT_SUPPORTED
          errorMessage = 'The video format is not supported by your browser.';
          break;
        default:
          errorMessage = `An error occurred (${error.code}: ${error.message || 'Unknown error'}).`;
      }
      
      // Log detailed error information for debugging
      const errorDetails = {
        code: error.code,
        message: error.message,
        errorName: 'MediaError',
        errorType: getErrorType(error.code),
        videoUrl: reels[currentIndex]?.videoUrl,
        currentSrc: video.currentSrc,
        networkState: getNetworkState(video.networkState),
        readyState: video.readyState
      };
      
      console.error('Video playback error:', errorDetails);
    } else {
      // Handle case where error object is not available
      const errorDetails = {
        eventType: e.type,
        networkState: getNetworkState(video.networkState),
        readyState: video.readyState,
        currentSrc: video.currentSrc,
        videoUrl: reels[currentIndex]?.videoUrl
      };
      
      console.error('Unknown video error:', errorDetails);
      errorMessage = 'An unknown error occurred while playing the video.';
    }
    
    setError(errorMessage);
    setIsPlaying(false);
    
    // Helper function to get network state as string
    function getNetworkState(state: number): string {
      const states = [
        'NETWORK_EMPTY',      // 0
        'NETWORK_IDLE',       // 1
        'NETWORK_LOADING',    // 2
        'NETWORK_NO_SOURCE'   // 3
      ];
      return states[state] || `UNKNOWN (${state})`;
    }
    
    // Helper function to get error type from code
    function getErrorType(code: number): string {
      const types = [
        'MEDIA_ERR_ABORTED',      // 1
        'MEDIA_ERR_NETWORK',      // 2
        'MEDIA_ERR_DECODE',       // 3
        'MEDIA_ERR_SRC_NOT_SUPPORTED' // 4
      ];
      return types[code - 1] || `UNKNOWN (${code})`;
    }
  };

  const handleCanPlay = () => {
    console.log('Video can play through');
    setIsLoading(false);
    setError(null);
  };

  const handleWaiting = () => {
    console.log('Video waiting for data');
    setIsLoading(true);
  };

  const handlePlaying = () => {
    console.log('Video playing');
    setIsLoading(false);
    setError(null);
  };

  const handleEnded = () => {
    console.log('Video ended');
    setIsPlaying(false);
    // Auto-play next video if available
    if (currentIndex < reels.length - 1) {
      handleNext();
    }
  };

  if (!currentReel) return null;

  // Glow effect colors
  const glowColors = [
    'rgba(59, 130, 246, 0.7)',  // blue-500
    'rgba(99, 102, 241, 0.7)',  // indigo-500
    'rgba(167, 139, 250, 0.7)', // violet-400
    'rgba(236, 72, 153, 0.7)',  // pink-500
  ];

  // Get a random glow color
  const [glowColor, setGlowColor] = useState(glowColors[0]);

  // Change glow color when reel changes
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * glowColors.length);
    setGlowColor(glowColors[randomIndex]);
  }, [currentIndex]);

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <motion.div 
        className="relative w-full max-w-md h-[90vh] rounded-2xl overflow-hidden"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ 
          scale: 1, 
          opacity: 1,
          boxShadow: `0 0 30px 5px ${glowColor}`,
        }}
        transition={{ 
          duration: 0.3,
          boxShadow: { duration: 2, repeat: Infinity, repeatType: 'reverse' }
        }}
      >
        {/* Animated border glow */}
        <motion.div 
          className="absolute inset-0 rounded-2xl z-0"
          style={{
            background: `linear-gradient(45deg, ${glowColor}, transparent)`,
            opacity: 0.7,
          }}
          animate={{
            background: [
              `linear-gradient(45deg, ${glowColor}, transparent)`,
              `linear-gradient(135deg, ${glowColor}, transparent)`,
              `linear-gradient(225deg, ${glowColor}, transparent)`,
              `linear-gradient(315deg, ${glowColor}, transparent)`,
              `linear-gradient(45deg, ${glowColor}, transparent)`,
            ],
          }}
          transition={{
            duration: 8,
            ease: 'linear',
            repeat: Infinity,
          }}
        />
        
        <div className="relative w-full h-full bg-black z-10">
          {/* Close button */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
            </div>
          )}
          
          {/* Error Message */}
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-red-400 p-4 z-10 text-center">
              <p className="text-lg font-medium mb-2">Playback Error</p>
              <p className="text-sm mb-4">{error}</p>
              <button 
                onClick={() => {
                  setError(null);
                  if (videoRef.current) {
                    videoRef.current.load();
                  }
                }}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Retry
              </button>
            </div>
          )}
          
          {/* Video Player */}
          <motion.div 
            className="relative w-full h-full overflow-hidden"
            initial={{ scale: 0.98 }}
            animate={{ 
              scale: 1,
              transition: { 
                duration: 5,
                repeat: Infinity, 
                repeatType: 'reverse',
                ease: 'easeInOut'
              } 
            }}
          >
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-contain"
              autoPlay={false}
              loop
              muted={isMuted}
              playsInline
              onClick={togglePlay}
              poster={currentReel.thumbnailUrl || undefined}
              crossOrigin="use-credentials"
              onError={handleVideoError}
              onCanPlay={handleCanPlay}
              onWaiting={handleWaiting}
              onPlaying={handlePlaying}
              onEnded={handleEnded}
              onLoadedMetadata={(e) => {
                console.log('Video metadata loaded:', {
                  duration: e.currentTarget.duration,
                  videoWidth: e.currentTarget.videoWidth,
                  videoHeight: e.currentTarget.videoHeight
                });
              }}
            >
              {videoUrl && (
                <source 
                  src={videoUrl}
                  type="video/mp4"
                  onError={(e) => {
                    console.error('Error loading video source:', e);
                    setError('Failed to load video source');
                  }}
                />
              )}
              Your browser does not support the video tag.
            </video>
            
            {/* Play Button Overlay */}
            {!isPlaying && !isLoading && !error && (
              <div 
                className="absolute inset-0 flex items-center justify-center cursor-pointer z-10"
                onClick={togglePlay}
              >
                <motion.div 
                  className="w-16 h-16 bg-black/70 rounded-full flex items-center justify-center backdrop-blur-sm"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Play className="text-white w-8 h-8" />
                </motion.div>
              </div>
            )}
          </motion.div>
          
          {/* Video Controls Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent z-10">
            <div className="flex items-center justify-between">
              <button 
                onClick={togglePlay} 
                className="text-white text-2xl hover:text-gray-300 transition-colors"
                aria-label={isPlaying ? 'Pause' : 'Play'}
                disabled={!!error}
              >
                {isPlaying ? '⏸' : '▶️'}
              </button>
              
              <button 
                onClick={toggleMute} 
                className="text-white text-xl hover:text-gray-300 transition-colors"
                aria-label={isMuted ? 'Unmute' : 'Mute'}
                disabled={!!error}
              >
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
            </div>
            
            {reels.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-10">
                {reels.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      index === currentIndex ? 'w-6 bg-white' : 'w-3 bg-white/50'
                    }`}
                    aria-label={`Go to reel ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          {reels.length > 1 && (
            <>
              <button
                onClick={handlePrev}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full z-10 focus:outline-none"
                aria-label="Previous reel"
              >
                <ChevronLeft size={32} />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full z-10 focus:outline-none"
                aria-label="Next reel"
              >
                <ChevronRight size={32} />
              </button>
            </>
          )}
          
          {/* Animated pagination dots */}
          <AnimatePresence>
            <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2 z-10">
              {reels.map((_, index) => (
                <motion.button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`h-1.5 rounded-full transition-all ${
                    index === currentIndex ? 'bg-white' : 'bg-white/50'
                  }`}
                  initial={{ width: index === currentIndex ? 24 : 12 }}
                  animate={{ 
                    width: index === currentIndex ? 24 : 12,
                    backgroundColor: index === currentIndex ? glowColor : 'rgba(255, 255, 255, 0.5)'
                  }}
                  whileHover={{ scale: 1.2 }}
                  transition={{ duration: 0.2 }}
                  aria-label={`Go to reel ${index + 1}`}
                />
              ))}
            </div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default ReelsModal;
