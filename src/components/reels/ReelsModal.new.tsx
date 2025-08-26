import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, VolumeX, Volume2 } from 'lucide-react';
import { Reel } from '../../Services/reelService';
import { getVideoUrl } from '../../Services/appwriteService';

interface ReelsModalProps {
  reels: Reel[];
  currentIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}

const ReelsModal: React.FC<ReelsModalProps> = ({ 
  reels, 
  currentIndex: initialIndex = 0, 
  onClose, 
  onNext, 
  onPrev 
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);

  const currentReel = reels?.[currentIndex];

  // Handle video URL generation
  useEffect(() => {
    if (!currentReel?.videoId) {
      setVideoUrl('');
      return;
    }

    try {
      const url = getVideoUrl(currentReel.videoId);
      console.log('Generated video URL:', url);
      setVideoUrl(url);
      setError(null);
      setIsLoading(true);
    } catch (err) {
      console.error('Error generating video URL:', err);
      setError('Failed to load video');
      setVideoUrl('');
    }
  }, [currentReel?.videoId]);

  // Handle play/pause state
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const playVideo = async () => {
      try {
        await video.play();
        setIsPlaying(true);
      } catch (err) {
        console.error('Error playing video:', err);
        setError('Failed to play video');
        setIsPlaying(false);
      }
    };

    if (isPlaying && video.paused) {
      playVideo();
    } else if (!isPlaying && !video.paused) {
      video.pause();
    }
  }, [isPlaying]);

  // Handle reel change
  const handleReelChange = useCallback((newIndex: number) => {
    setCurrentIndex(newIndex);
    setIsLoading(true);
    setError(null);
    setIsPlaying(true);
  }, []);

  const handleNext = useCallback(() => {
    const nextIndex = currentIndex < reels.length - 1 ? currentIndex + 1 : 0;
    handleReelChange(nextIndex);
    onNext();
  }, [currentIndex, reels.length, handleReelChange, onNext]);

  const handlePrev = useCallback(() => {
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : reels.length - 1;
    handleReelChange(prevIndex);
    onPrev();
  }, [currentIndex, reels.length, handleReelChange, onPrev]);

  const togglePlay = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
          e.preventDefault();
          togglePlay();
          break;
        case 'm':
        case 'M':
          toggleMute();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev, onClose, togglePlay, toggleMute]);

  // Event handlers
  const handleVideoError = useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    console.error('Video error:', {
      error: video.error,
      src: video.currentSrc,
      networkState: video.networkState,
      readyState: video.readyState
    });
    
    setError('Failed to load video. Please try again.');
    setIsLoading(false);
  }, []);

  const handleCanPlay = useCallback(() => {
    console.log('Video can play');
    setIsLoading(false);
    setError(null);
  }, []);

  const handleWaiting = useCallback(() => {
    console.log('Video waiting for data');
    setIsLoading(true);
  }, []);

  const handlePlaying = useCallback(() => {
    console.log('Video playing');
    setIsLoading(false);
    setError(null);
  }, []);

  const handleEnded = useCallback(() => {
    console.log('Video ended');
    setIsPlaying(false);
    if (currentIndex < reels.length - 1) {
      handleNext();
    }
  }, [currentIndex, reels.length, handleNext]);

  if (!currentReel) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
      {/* Close Button */}
      <button 
        onClick={onClose} 
        className="absolute top-4 right-4 text-white text-2xl z-10 hover:text-gray-300 transition-colors"
        aria-label="Close"
      >
        <X size={24} />
      </button>
      
      {/* Main Container */}
      <div className="relative w-full max-w-md h-[80vh] flex items-center justify-center">
        <div className="relative w-full h-full overflow-hidden rounded-2xl bg-black">
          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
            </div>
          )}
          
          {/* Error Message */}
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-red-400 p-4 z-10 text-center">
              <div className="text-4xl mb-2">⚠️</div>
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
          
          {/* Video Element */}
          <div className="relative w-full h-full">
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-contain"
              autoPlay
              loop
              muted={isMuted}
              playsInline
              onClick={togglePlay}
              onError={handleVideoError}
              onCanPlay={handleCanPlay}
              onWaiting={handleWaiting}
              onPlaying={handlePlaying}
              onEnded={handleEnded}
              onLoadedMetadata={() => console.log('Video metadata loaded')}
            >
              {videoUrl && (
                <source 
                  src={videoUrl}
                  type="video/mp4"
                />
              )}
              Your browser does not support the video tag.
            </video>
            
            {/* Play Button Overlay */}
            {!isPlaying && !isLoading && !error && (
              <div 
                className="absolute inset-0 flex items-center justify-center cursor-pointer"
                onClick={togglePlay}
              >
                <div className="w-16 h-16 bg-black/50 rounded-full flex items-center justify-center">
                  <span className="text-3xl">▶️</span>
                </div>
              </div>
            )}
          </div>
          
          {/* Video Controls */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent z-20">
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
            
            {/* Pagination Dots */}
            {reels.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-10">
                {reels.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => handleReelChange(index)}
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
        </div>
      </div>
    </div>
  );
};

export default ReelsModal;
