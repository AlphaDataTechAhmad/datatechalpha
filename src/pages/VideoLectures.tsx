import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCourse } from '@/contexts/CourseContext';
import { Play, Plus, AlertCircle, Clock, ChevronDown, ChevronRight, Video as VideoIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { VideoLecture, isAppwriteVideo } from '@/types/video.types';
import { databases, Query } from '../Services/appwrite';
import VideoUploader from '@/components/videos/VideoUploader';

// Extend the VideoLecture type to include subject and order
type VideoWithSubject = VideoLecture & {
  subject?: string;
  order?: number;
};

interface SubjectGroup {
  name: string;
  videos: VideoLecture[];
  isExpanded: boolean;
}

const VideoLectures: React.FC = () => {
  const { courseId = '' } = useParams<{ courseId: string }>();
  const { course } = useCourse();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showUploadForm, setShowUploadForm] = useState<boolean>(false);
  const [videos, setVideos] = useState<VideoWithSubject[]>([]);
  const [subjectGroups, setSubjectGroups] = useState<SubjectGroup[]>([]);

  const isTeacher = useMemo(() => user?.role === 'teacher', [user?.role]);

  // Removed unused getTeacherName function

  const extractYoutubeId = useCallback((url: string): string | null => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  }, []);

  const fetchVideos = useCallback(async (): Promise<void> => {
    console.log('Fetching videos for course:', courseId);
    if (!courseId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const localVideos: VideoWithSubject[] = (course?.videoLectures || []).map(video => ({
        id: video.id,
        title: video.title || 'Untitled Video',
        description: video.description || '',
        youtubeId: video.youtubeId,
        url: `https://www.youtube.com/watch?v=${video.youtubeId}`,
        status: 'approved',
        type: 'youtube',
        videoId: video.id,
        duration: video.duration,
        subject: (video as VideoWithSubject).subject || 'Uncategorized',
        order: (video as VideoWithSubject).order || 0
      }));

      console.log('Fetching videos from Appwrite...');
      const response = await databases.listDocuments(
        '68261b6a002ba6c3b584', // databaseId
        '685457d5000a277435ef', // collectionId
        [
          Query.equal('courseId', courseId)
        ]
      );
      console.log('Appwrite response:', response);

      const filteredVideos = user?.role === 'teacher' 
        ? response.documents 
        : response.documents.filter((doc: any) => doc.status === 'approved'); 

      const appwriteVideos: VideoWithSubject[] = filteredVideos.map(doc => ({
        $id: doc.$id,
        videoId: doc.videoId || doc.$id,
        title: doc.title || 'Untitled Video',
        description: doc.description || '',
        type: doc.type === 'upload' ? 'upload' : 'youtube',
        url: doc.url,
        status: 'approved',
        courseId: doc.courseId || courseId,
        uploadedBy: doc.uploadedBy || 'unknown',
        thumbnailUrl: doc.thumbnailUrl,
        fileId: doc.fileId,
        createdAt: doc.$createdAt || new Date().toISOString(),
        duration: doc.duration,
        subject: doc.subject || 'Uncategorized',  // Add subject from document
        order: doc.order ? parseInt(doc.order, 10) : 0  // Parse order if it exists
      }));

      const allVideos = [...localVideos, ...appwriteVideos];
      console.log('Fetched videos:', allVideos.length);
      setVideos(allVideos);
      
      if (allVideos.length === 0) {
        console.log('No videos found for this course');
      }
    } catch (err) {
      console.error('Error fetching videos:', err);
      setError('Failed to load videos. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [courseId, course?.videoLectures]);

  // Initialize component and fetch videos
  useEffect(() => {
    fetchVideos().catch(error => {
      console.error('Error fetching videos:', error);
      setError('Failed to load videos. Please try again.');
      setLoading(false);
    });
  }, [fetchVideos]);

  useEffect(() => {
    if (!videos.length) return;

    const groups = videos.reduce<Record<string, VideoWithSubject[]>>((acc, video) => {
      // Ensure we have a valid subject, default to 'Uncategorized' if missing
      const subject = (video as VideoWithSubject).subject || 'Uncategorized';
      if (!acc[subject]) {
        acc[subject] = [];
      }
      acc[subject].push(video);
      return acc;
    }, {});

    const sortedGroups = Object.entries(groups).map(([name, videoList]) => ({
      name,
      videos: videoList.sort((a, b) => {
        const orderA = 'order' in a ? a.order : 0;
        const orderB = 'order' in b ? b.order : 0;
        return (orderA || 0) - (orderB || 0);
      }),
      isExpanded: false // Set to false to keep dropdowns collapsed by default
    })).sort((a, b) => a.name.localeCompare(b.name));

    setSubjectGroups(sortedGroups);
  }, [videos]);

  // Toggle upload form visibility
  const toggleUploadForm = useCallback((): void => {
    if (!user) {
      setError('Please log in to upload videos');
      return;
    }
    setShowUploadForm(prev => !prev);
  }, [user]);

  // Handle successful video upload
  const handleUploadSuccess = useCallback((): void => {
    fetchVideos();
    setShowUploadForm(false);
  }, [fetchVideos]);

  const handleVideoClick = useCallback((video: VideoLecture): void => {
    try {
      if (!user) {
        setError('Please log in to view this video');
        return;
      }

      const isYoutube = !isAppwriteVideo(video) || video.type === 'youtube';
      const videoId = isYoutube 
        ? (isAppwriteVideo(video) ? extractYoutubeId(video.url) : video.youtubeId)
        : video.videoId;

      if (!videoId) {
        setError('Invalid video data');
        return;
      }

      navigate(`/courses/${courseId}/videos/player`, {
        state: {
          videoId,
          videoType: isYoutube ? 'youtube' : 'upload',
          videoData: video
        }
      });
    } catch (err) {
      console.error('Error handling video click:', err);
      setError('Failed to load video. Please try again.');
    }
  }, [user, courseId, navigate, extractYoutubeId]);

  const toggleSubject = useCallback((subjectName: string) => {
    setSubjectGroups(prev => 
      prev.map(group => 
        group.name === subjectName 
          ? { ...group, isExpanded: !group.isExpanded } 
          : group
      )
    );
  }, []);
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Loading videos...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Course Not Found</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">The requested course could not be found.</p>
        <button
          onClick={() => navigate('/courses')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Back to Courses
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Error loading videos</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={fetchVideos}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
          <VideoIcon className="h-8 w-8 mr-2 text-blue-600 dark:text-blue-400" />
          {course?.title || 'Course'} Videos
        </h1>
        {isTeacher && (
          <button
            onClick={toggleUploadForm}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            Upload Video
          </button>
        )}
      </div>

{error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <div className="flex items-center text-red-800 dark:text-red-200">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span className="font-medium">Error:</span> {error}
          </div>
        </div>
      )}
      
      {subjectGroups.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">No videos available yet. Check back later!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {subjectGroups.map((group) => (
            <div key={group.name} className="bg-gray-50 dark:bg-gray-800/50 rounded-xl overflow-hidden">
              <div 
                className="p-4 bg-gray-100 dark:bg-gray-700/50 flex items-center justify-between cursor-pointer"
                onClick={() => toggleSubject(group.name)}
              >
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  {group.isExpanded ? 
                    <ChevronDown className="h-5 w-5 mr-2" /> : 
                    <ChevronRight className="h-5 w-5 mr-2" />
                  }
                  {group.name} <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">({group.videos.length})</span>
                </h2>
              </div>
              
              <AnimatePresence>
                {group.isExpanded && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="p-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3"
                  >
                    {group.videos.map((video) => (
                      <div
                        key={video.videoId}
                        onClick={() => handleVideoClick(video)}
                        className="group relative overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow hover:shadow-lg transition-shadow duration-300 cursor-pointer border border-gray-200 dark:border-gray-700"
                      >
                        <div className="relative pt-[56.25%] bg-gray-100 dark:bg-gray-700">
                          {isAppwriteVideo(video) && video.status === 'pending' && (
                            <div className="absolute inset-0 bg-black/60 z-10 flex flex-col items-center justify-center p-4 text-center">
                              <Clock className="w-8 h-8 text-yellow-400 mb-2" />
                              <span className="text-white font-medium">Video Pending Review</span>
                              <span className="text-yellow-100 text-sm mt-1">This video is awaiting admin approval</span>
                            </div>
                          )}
                          {isAppwriteVideo(video) && video.thumbnailUrl ? (
                            <img 
                              src={video.thumbnailUrl} 
                              alt={video.title} 
                              className="absolute inset-0 w-full h-full object-cover"
                            />
                          ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
                              <VideoIcon className="h-12 w-12 text-gray-400 dark:text-gray-600" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/20 hover:bg-black/30 transition-colors flex items-center justify-center">
                            <div className="w-12 h-12 bg-white/80 rounded-full flex items-center justify-center">
                              <Play className="w-6 h-6 text-gray-800" />
                            </div>
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="font-medium text-gray-900 dark:text-white mb-1 line-clamp-1">
                            {video.title}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">
                            {video.description}
                          </p>
                          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                            <span>Instructor</span>
                            {isAppwriteVideo(video) && video.duration && (
                              <span className="flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {formatDuration(video.duration)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showUploadForm && isTeacher && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mt-8"
          >
            <VideoUploader
              courseId={courseId}
              onSuccess={handleUploadSuccess}
              onClose={() => setShowUploadForm(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Helper function to format duration in seconds to MM:SS
const formatDuration = (seconds: number | string): string => {
  const numSeconds = typeof seconds === 'string' ? parseInt(seconds, 10) : seconds;
  if (isNaN(numSeconds)) return '0:00';
  const mins = Math.floor(numSeconds / 60);
  const secs = Math.floor(numSeconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export default VideoLectures;
