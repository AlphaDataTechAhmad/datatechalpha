import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, CircularProgress, Button } from '@mui/material';
import { ChevronLeft } from '@mui/icons-material';
import YouTube from 'react-youtube';

interface VideoLecture {
  id: string;
  title: string;
  type: 'upload' | 'youtube';
  url?: string;
  youtubeId?: string;
  fileId?: string;
  videoId?: string;
  [key: string]: any;
}

interface CourseType {
  videoLectures: VideoLecture[];
  [key: string]: any;
}

const VideoPlayerPage: React.FC<{ course: CourseType }> = ({ course }) => {
  const { videoId, videoType } = useParams<{ videoId: string; videoType: string }>();
  const navigate = useNavigate();
  
  const [currentVideo, setCurrentVideo] = useState<VideoLecture | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playerReady, setPlayerReady] = useState(false);
  const [playerError, setPlayerError] = useState(false);

  // Extract YouTube ID from URL if needed
  const extractYoutubeId = (url: string): string | null => {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return match ? match[1] : null;
  };

  // Find and set the video to play
  useEffect(() => {
    const findAndSetVideo = async () => {
      try {
        if (!videoId || !videoType) {
          setError('Invalid video URL');
          setLoading(false);
          return;
        }

        setLoading(true);
        setError(null);
        setPlayerError(false);

        if (!course?.videoLectures?.length) {
          setError('No videos available for this course');
          setLoading(false);
          return;
        }

        // Find the video by any ID field
        const foundVideo = course.videoLectures.find(video => {
          // Check all possible ID fields
          return (
            video.id === videoId ||
            video.videoId === videoId ||
            video.fileId === videoId ||
            (video.url && video.url.includes(videoId)) ||
            (video.youtubeId && video.youtubeId.includes(videoId))
          );
        });

        if (foundVideo) {
          console.log('Playing video:', {
            id: foundVideo.id,
            type: foundVideo.type,
            title: foundVideo.title,
            url: foundVideo.url || `https://www.youtube.com/watch?v=${foundVideo.youtubeId}`
          });
          setCurrentVideo(foundVideo);
        } else {
          setError('Video not found. Please try another video.');
          console.error('Video not found. Available videos:', course.videoLectures);
        }
      } catch (error) {
        console.error('Error finding video:', error);
        setError('Failed to load video. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    findAndSetVideo();
  }, [videoId, videoType, course]);

  const handleBackClick = () => {
    navigate(-1); // Go back to previous page
  };

  const handlePlayerReady = () => {
    setPlayerReady(true);
  };

  const handlePlayerError = () => {
    setPlayerError(true);
    setError('Failed to load video player. Please try again.');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
        <Typography variant="body1" ml={2}>
          Loading video...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Button 
          startIcon={<ChevronLeft />} 
          onClick={handleBackClick}
          sx={{ mb: 2 }}
        >
          Back to Course
        </Button>
        <Typography variant="h6" color="error">
          {error}
        </Typography>
      </Box>
    );
  }


  if (!currentVideo) {
    return (
      <Box p={3}>
        <Button 
          startIcon={<ChevronLeft />} 
          onClick={handleBackClick}
          sx={{ mb: 2 }}
        >
          Back to Course
        </Button>
        <Typography variant="h6">
          Video not found
        </Typography>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Button 
        startIcon={<ChevronLeft />} 
        onClick={handleBackClick}
        sx={{ mb: 2 }}
      >
        Back to Course
      </Button>

      <Typography variant="h4" gutterBottom>
        {currentVideo.title}
      </Typography>

      <Box 
        sx={{
          position: 'relative',
          paddingBottom: '56.25%', // 16:9 aspect ratio
          height: 0,
          overflow: 'hidden',
          maxWidth: '100%',
          bgcolor: '#000',
          borderRadius: 1,
          mb: 3
        }}
      >
        {currentVideo.type === 'youtube' ? (
          <YouTube
            videoId={extractYoutubeId(currentVideo.url || currentVideo.youtubeId || '') || ''}
            onReady={handlePlayerReady}
            onError={handlePlayerError}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%'
            }}
            opts={{
              width: '100%',
              height: '100%',
              playerVars: {
                autoplay: 1,
                rel: 0,
                modestbranding: 1
              },
            }}
          />
        ) : (
          <video
            src={currentVideo.url}
            controls
            autoPlay
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'contain'
            }}
          />
        )}
      </Box>
    </Box>
  );
};

export default VideoPlayerPage;
