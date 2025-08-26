import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCourse } from '../contexts/CourseContext';
import { ChevronLeft, AlertCircle, Loader, Video as VideoIcon } from 'lucide-react';
import { VideoLecture, isAppwriteVideo } from '../types/video.types';

const VideoPlayerPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { course } = useCourse();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [playerReady, setPlayerReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get video data from location state
  const { videoId, videoType, videoData } = location.state || {};
  const [currentVideo, setCurrentVideo] = useState<VideoLecture | null>(null);
  const [isYoutubeVideo, setIsYoutubeVideo] = useState(false);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);

  const extractYoutubeId = useCallback((urlOrId: string): string | null => {
    if (!urlOrId) return null;

    if (urlOrId.includes('youtube.com/watch?v=')) {
      return urlOrId.split('v=')[1].split('&')[0];
    }
    if (urlOrId.includes('youtu.be/')) {
      return urlOrId.split('youtu.be/')[1].split('?')[0];
    }
    return urlOrId;
  }, []);

  // Handle back to videos
  const handleBack = useCallback(() => {
    navigate(`/courses/${courseId}/videos`);
  }, [courseId, navigate]);

  // Initialize video data
  useEffect(() => {
    const initializeVideo = async () => {
      if (!videoData && (!videoId || !videoType)) {
        setError('Missing video data');
        return;
      }

      // If we have video data from state, use it
      if (videoData) {
        // Check if video is pending and user is not an admin/teacher
        if (videoData.status === 'pending' && user?.role !== 'teacher') {
          setError('This video is pending approval and cannot be viewed yet.');
          return;
        }
        
        setCurrentVideo(videoData);
        const isYoutube = videoType === 'youtube' || (isAppwriteVideo(videoData) && videoData.type === 'youtube');
        setIsYoutubeVideo(isYoutube);
        
        if (isYoutube) {
          const ytId = isAppwriteVideo(videoData) 
            ? extractYoutubeId(videoData.url) 
            : (videoData as any).youtubeId;
          setActiveVideoId(ytId);
        } else if (isAppwriteVideo(videoData)) {
          setActiveVideoId(videoData.videoId);
        } else {
          setError('Invalid video data format');
        }
        return;
      }

      // Otherwise try to find the video in the course
      if (course?.videoLectures) {
        const video = course.videoLectures.find(v => {
          if (isAppwriteVideo(v)) {
            return v.videoId === videoId || extractYoutubeId(v.url || '') === videoId;
          } else {
            return extractYoutubeId((v as any).youtubeId || '') === videoId;
          }
        });

        if (video) {
          // Check if video is pending and user is not an admin/teacher
          if (isAppwriteVideo(video) && video.status === 'pending' && user?.role !== 'teacher') {
            setError('This video is pending approval and cannot be viewed yet.');
            return;
          }
          
          setCurrentVideo(video);
          const isYoutube = videoType === 'youtube' || (isAppwriteVideo(video) && video.type === 'youtube');
          setIsYoutubeVideo(isYoutube);
          
          if (isYoutube) {
            const ytId = isAppwriteVideo(video) 
              ? extractYoutubeId(video.url || '') 
              : (video as any).youtubeId;
            setActiveVideoId(ytId);
          } else if (isAppwriteVideo(video)) {
            setActiveVideoId(video.videoId);
          } else {
            setError('Invalid video format');
          }
        } else {
          setError('Video not found in course');
        }
      }
    };

    initializeVideo();
  }, [videoData, videoId, videoType, course, extractYoutubeId, user]);

  // Set player ready after a short delay
  useEffect(() => {
    if (!activeVideoId) return;
    
    const timer = setTimeout(() => {
      setPlayerReady(true);
    }, 500);

    return () => clearTimeout(timer);
  }, [activeVideoId]);

  if (error) {
    return (
      <div className="min-h-screen pt-24 pb-16 bg-gray-50 dark:bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Error Loading Video</h2>
          <p className="text-dark-500 dark:text-dark-400 mb-4">
            {error}
          </p>
          <button
            onClick={handleBack}
            className="btn-primary px-4 py-2 mt-4"
          >
            Back to Videos
          </button>
        </div>
      </div>
    );
  }

  if (!activeVideoId || !currentVideo) {
    return (
      <div className="min-h-screen pt-24 pb-16 bg-gray-50 dark:bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-12 w-12 text-primary-500 animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Loading Video</h2>
          <p className="text-dark-500 dark:text-dark-400 mb-4">
            Please wait while we load your video...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 bg-gray-50 dark:bg-dark-900">
      <div className="container mx-auto px-4">
        <button
          onClick={() => navigate(`/courses/${courseId}/videos`)}
          className="flex items-center text-primary-600 dark:text-primary-400 mb-6 hover:underline"
        >
          <ChevronLeft className="h-5 w-5 mr-1" />
          Back to Videos
        </button>

        <div className="bg-white dark:bg-dark-800 rounded-xl shadow-md p-6">
          <h2 className="text-2xl font-bold mb-4">
            {currentVideo.title}
          </h2>
          <p className="text-dark-500 dark:text-dark-400 mb-6">
            {isAppwriteVideo(currentVideo) 
              ? currentVideo.description || currentVideo.escription || 'No description available'
              : currentVideo.description || 'No description available'}
          </p>

          <div className="aspect-w-16 aspect-h-9 rounded-lg overflow-hidden bg-black">
            {!playerReady ? (
              <div className="w-full h-[70vh] flex items-center justify-center bg-gray-900">
                <Loader className="h-12 w-12 text-primary-500 animate-spin" />
              </div>
            ) : isYoutubeVideo ? (
              <iframe
                className="w-full h-[70vh]"
                src={`https://www.youtube.com/embed/${activeVideoId}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1`}
                title={currentVideo.title || "YouTube Video"}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                loading="eager"
              />
            ) : (
              <div className="w-full h-[70vh] flex items-center justify-center bg-gray-900">
                <video
                  className="w-full h-full"
                  controls
                  autoPlay
                  controlsList="nodownload"
                  src={isAppwriteVideo(currentVideo) ? currentVideo.url : ''}
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            )}
            {!isYoutubeVideo && !isAppwriteVideo(currentVideo) && (
              <div className="w-full h-[70vh] flex flex-col items-center justify-center bg-gray-900 text-white p-8 text-center">
                <VideoIcon className="h-16 w-16 text-gray-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Video Player</h3>
                <p className="text-gray-400 mb-6">This video format is not supported for direct playback.</p>
                <a
                  href={currentVideo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary px-4 py-2"
                  download
                >
                  Download Video
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayerPage;