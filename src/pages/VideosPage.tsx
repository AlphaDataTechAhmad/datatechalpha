import React, { useState, useEffect, Component } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Video, Play, Clock, ChevronDown, ChevronRight, AlertCircle } from 'lucide-react';
import { databases } from '@/Services/appwrite';
import { Query } from 'appwrite';

interface VideoItem {
  $id: string;
  title: string;
  description: string;
  url: string;
  subject: string;
  thumbnailUrl?: string;
  type: 'youtube' | 'upload';
  courseId: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  duration?: number;
  order?: number;
}

interface SubjectGroup {
  name: string;
  videos: VideoItem[];
  isExpanded: boolean;
}

// Error Boundary Component
class ErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error in VideosPage:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-red-600">
          <AlertCircle className="h-12 w-12 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
          <p className="text-center mb-4">We apologize for the inconvenience. Please try refreshing the page or come back later.</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const VideosPageContent: React.FC = () => {
  const { course } = useOutletContext<{ course: any }>();
  const [subjectGroups, setSubjectGroups] = useState<SubjectGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Log course data when it changes
  useEffect(() => {
    console.log('Course data in VideosPage:', course);
  }, [course]);

  useEffect(() => {
    if (!course?.$id) {
      console.log('Waiting for course data...');
      return;
    }
    
    console.log('useEffect triggered with course:', course);
    
    const fetchVideos = async () => {
      if (!course?.$id) {
        console.error('No course ID found in course object:', course);
        return;
      }
      
      console.log('Starting to fetch videos for course ID:', course.$id);
      
      try {
        // First, verify the database and collection IDs
        console.log('Database ID:', '68261b6a002ba6c3b584');
        console.log('Collection ID:', '685457d5000a277435ef');
        
        // Log the query parameters
        const queryParams = [
          Query.equal('courseId', course.$id),
          Query.equal('status', 'approved'),
          Query.orderAsc('order'),
          Query.orderDesc('$createdAt')
        ];
        
        console.log('Query parameters:', queryParams);
        
        // Make the API call
        const response = await databases.listDocuments(
          '68261b6a002ba6c3b584', // Database ID
          '685457d5000a277435ef', // Videos collection ID
          queryParams
        );
        
        console.log('Raw API response received. Documents found:', response.documents?.length || 0);
        
        if (!response.documents || response.documents.length === 0) {
          console.warn('No videos found for course ID:', course.$id);
          setSubjectGroups([]);
          return;
        }
        
        // Log all received documents
        console.log('All video documents:', JSON.stringify(response.documents, null, 2));
        
        // Debug: Log all video subjects with more details
        const videoDetails = response.documents.map((v: any) => ({
          id: v.$id,
          title: v.title,
          subject: v.subject,
          status: v.status,
          courseId: v.courseId,
          type: v.type,
          url: v.url
        }));
        
        console.log('Video details:', videoDetails);
        
        // Group videos by subject
        const videosBySubject: Record<string, VideoItem[]> = {};
        
        (response.documents as VideoItem[]).forEach((video, index) => {
          console.log(`Processing video ${index + 1}/${response.documents.length}:`, {
            id: video.$id,
            title: video.title,
            subject: video.subject,
            hasSubject: !!video.subject
          });
          
          // Ensure subject is a string and trim any whitespace
          const subject = (video.subject || 'Uncategorized').toString().trim();
          
          if (!videosBySubject[subject]) {
            console.log(`Creating new subject group: "${subject}"`);
            videosBySubject[subject] = [];
          }
          
          console.log(`Adding video "${video.title}" to subject "${subject}"`);
          videosBySubject[subject].push(video);
        });
        
        console.log('Videos grouped by subject:', JSON.stringify(videosBySubject, null, 2));
        
        // Convert to array of subject groups
        const groups = Object.entries(videosBySubject).map(([name, videos]) => {
          console.log(`Creating group "${name}" with ${videos.length} videos`);
          return {
            name,
            videos,
            isExpanded: true // Default to expanded
          };
        });
        
        console.log('Final subject groups to render:', groups);
        
        // Log group summary
        console.log('Group summary:', groups.map(g => ({
          subject: g.name,
          videoCount: g.videos.length,
          videoTitles: g.videos.map(v => v.title)
        })));
        
        setSubjectGroups(groups);
      } catch (error) {
        console.error('Error fetching videos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, [course?.$id]);
  
  const toggleSubject = (subjectName: string) => {
    setSubjectGroups(prev => 
      prev.map(group => 
        group.name === subjectName 
          ? { ...group, isExpanded: !group.isExpanded }
          : group
      )
    );
  };

  const getYoutubeThumbnail = (url: string) => {
    if (!url) return null;
    
    // Handle YouTube URL
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      let videoId = '';
      if (url.includes('youtube.com')) {
        videoId = url.split('v=')[1];
        const ampersandPosition = videoId.indexOf('&');
        if (ampersandPosition !== -1) {
          videoId = videoId.substring(0, ampersandPosition);
        }
      } else if (url.includes('youtu.be')) {
        videoId = url.split('youtu.be/')[1];
      }
      
      return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    }
    
    return null;
  };

  const handleVideoClick = (video: VideoItem) => {
    navigate(`/video/${video.$id}`, { state: { video } });
  };
  
  const formatDuration = (seconds: number): string => {
    if (!seconds) return '';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Debug info component
  const DebugInfo = () => (
    <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
      <div className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">Debug Information</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
        <div><span className="font-medium">Course ID:</span> {course?.$id || 'Not found'}</div>
        <div><span className="font-medium">Subject Groups:</span> {subjectGroups.length}</div>
        <div><span className="font-medium">Total Videos:</span> {subjectGroups.reduce((acc, g) => acc + g.videos.length, 0)}</div>
        <div><span className="font-medium">All Subjects:</span> {subjectGroups.map(g => g.name).join(', ') || 'None'}</div>
      </div>
      <button 
        onClick={() => {
          console.log('Current subjectGroups:', subjectGroups);
          console.log('Course:', course);
          console.log('Loading state:', loading);
        }}
        className="mt-2 text-xs bg-blue-100 dark:bg-blue-900/30 px-3 py-1 rounded hover:bg-blue-200 dark:hover:bg-blue-800/50 transition-colors"
      >
        Show Debug Info in Console
      </button>
    </div>
  );

  return (
    <div className="bg-white dark:bg-dark-800 rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Video className="h-6 w-6 text-primary-500 mr-2" />
          <h2 className="text-2xl font-bold dark:text-white">Video Lectures</h2>
        </div>
      </div>
      
      {/* Always show debug info in development */}
      {process.env.NODE_ENV === 'development' && <DebugInfo />}
      
      <div className="space-y-8">
        {subjectGroups.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">No videos available yet. Check back later!</p>
          </div>
        ) : (
          <div className="space-y-8">
            {subjectGroups.map((group) => (
              <div key={group.name} className="bg-gray-50 dark:bg-dark-700 rounded-xl overflow-hidden">
                <div 
                  className="p-4 bg-gray-100 dark:bg-dark-600 flex items-center justify-between cursor-pointer"
                  onClick={() => toggleSubject(group.name)}
                >
                  <h3 className="text-lg font-semibold dark:text-white flex items-center">
                    {group.isExpanded ? 
                      <ChevronDown className="h-5 w-5 mr-2" /> : 
                      <ChevronRight className="h-5 w-5 mr-2" />
                    }
                    {group.name}
                    <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                      ({group.videos.length} {group.videos.length === 1 ? 'video' : 'videos'})
                    </span>
                  </h3>
                </div>
                
                {group.isExpanded && (
                  <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {group.videos.map((video) => {
                        const thumbnail = video.type === 'youtube' 
                          ? getYoutubeThumbnail(video.url) 
                          : video.thumbnailUrl;
                        
                        return (
                          <div 
                            key={video.$id} 
                            className="bg-white dark:bg-dark-800 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleVideoClick(video);
                            }}
                          >
                            <div className="aspect-video relative">
                              {thumbnail ? (
                                <img 
                                  src={thumbnail} 
                                  alt={video.title}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = '/default-video-thumbnail.jpg';
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full bg-dark-200 dark:bg-dark-600 flex items-center justify-center">
                                  <div className="text-center p-4">
                                    <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mx-auto mb-2">
                                      <Video className="h-5 w-5 text-primary-500 dark:text-primary-400" />
                                    </div>
                                    <span className="text-dark-500 dark:text-dark-300">No thumbnail</span>
                                  </div>
                                </div>
                              )}
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                                <div className="bg-black bg-opacity-60 text-white rounded-full p-3">
                                  <Play className="h-6 w-6" />
                                </div>
                              </div>
                              {video.duration && (
                                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                                  {formatDuration(video.duration)}
                                </div>
                              )}
                            </div>
                            <div className="p-4">
                              <h4 className="font-medium dark:text-white line-clamp-2 mb-1">{video.title}</h4>
                              <p className="text-sm text-dark-500 dark:text-dark-400 flex items-center">
                                <Clock className="h-3 w-3 mr-1 flex-shrink-0" />
                                {video.createdAt ? new Date(video.createdAt).toLocaleDateString() : 'N/A'}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const VideosPage: React.FC = () => (
  <ErrorBoundary>
    <VideosPageContent />
  </ErrorBoundary>
);

export default VideosPage;