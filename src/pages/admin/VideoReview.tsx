import React, { useState, useEffect } from 'react';
import { databases, Query } from '@/Services/appwrite';
import { Video, Play, Check, X, Clock, MessageSquare, History, CheckCircle2, XCircle, ChevronDown } from 'lucide-react';
import ReactPlayer from 'react-player';
import RejectVideoModal from '@/components/videos/RejectVideoModal';
import { toast } from 'react-hot-toast';
import { useChat } from '@/contexts/ChatContext';
import { useAuth } from '@/contexts/AuthContext';

interface VideoBase {
  $id: string;
  title: string;
  description: string;
  subject?: string;
  url: string;
  thumbnailUrl?: string;
  type: 'youtube' | 'upload';
  courseId: string;
  courseName: string;
  uploadedBy: string;
  uploadedAt: string;
  updatedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  approvedBy?: string;
  rejectedBy?: string;
}

interface PendingVideo extends VideoBase {
  status: 'pending';
}

interface ReviewedVideo extends VideoBase {
  status: 'approved' | 'rejected';
  reviewedAt: string;
  rejectionReason?: string;
  approvedBy?: string;
  rejectedBy?: string;
}

const VideoReviewPage: React.FC = () => {
  const [pendingVideos, setPendingVideos] = useState<PendingVideo[]>([]);
  const [reviewedVideos, setReviewedVideos] = useState<ReviewedVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedVideo, setSelectedVideo] = useState<PendingVideo | null>(null);
  const [isReviewing, setIsReviewing] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [teacherNames, setTeacherNames] = useState<Record<string, string>>({});
  const [courseNames, setCourseNames] = useState<Record<string, string>>({});
  const [expandedCourses, setExpandedCourses] = useState<Record<string, boolean>>({});
  const { sendApproval } = useChat();
  const { user: currentUser } = useAuth();

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchTeacherNames = async (userIds: string[]) => {
    if (userIds.length === 0) return {};
    
    try {
      const uniqueUserIds = [...new Set(userIds)];
      const names: Record<string, string> = {};
      
      for (const userId of uniqueUserIds) {
        if (!userId) continue;
        
        try {
          const profiles = await databases.listDocuments(
            '68261b6a002ba6c3b584',
            '68261bb5000a54d8652b', // profiles collection
            [Query.equal('$id', userId)]
          );
          
          if (profiles.documents.length > 0) {
            names[userId] = profiles.documents[0].name || 'Unknown Teacher';
          } else {
            // Fallback to email if name not found
            const user = await databases.getDocument(
              '68261b6a002ba6c3b584',
              'users',
              userId
            );
            names[userId] = user?.email?.split('@')[0] || 'Unknown Teacher';
          }
        } catch (error) {
          console.error(`Error fetching profile for user ${userId}:`, error);
          names[userId] = 'Unknown Teacher';
        }
      }
      
      return names;
    } catch (error) {
      console.error('Error fetching teacher names:', error);
      return {};
    }
  };

  const fetchCourseNames = async (courseIds: string[]) => {
    console.log('Fetching course names for IDs:', courseIds);
    if (courseIds.length === 0) return {};
    
    try {
      // Filter out any invalid or empty course IDs
      const validCourseIds = courseIds.filter(id => id && typeof id === 'string');
      const uniqueCourseIds = [...new Set(validCourseIds)];
      const names: Record<string, string> = {};
      
      // First, try to get courses using listDocuments with the IDs
      const coursesResponse = await databases.listDocuments(
        '68261b6a002ba6c3b584',
        '682644ed002b437582d3', // courses collection ID from courseService.ts
        [
          Query.equal('$id', uniqueCourseIds)
        ]
      );
      
      // Create a map of course IDs to names
      coursesResponse.documents.forEach(course => {
        if (course && course.$id) {
          // Use course.title if available, otherwise fall back to name or ID
          names[course.$id] = course.title || course.name || `Course ${course.$id.substring(0, 6)}...`;
        }
      });
      
      // For any courses not found in the batch query, try to fetch them individually
      for (const courseId of uniqueCourseIds) {
        if (!courseId || names[courseId]) continue;
        
        try {
          console.log('Fetching individual course with ID:', courseId);
          const course = await databases.getDocument(
            '68261b6a002ba6c3b584',
            '682644ed002b437582d3', // courses collection ID from courseService.ts
            courseId
          );
          
          console.log('Course data for', courseId, ':', course);
          if (course) {
            // Use course.title if available, otherwise fall back to name or ID
            names[courseId] = course.title || course.name || `Course ${courseId.substring(0, 6)}...`;
          }
        } catch (error) {
          console.error(`Error fetching course ${courseId}:`, error);
          names[courseId] = 'Unknown Course';
        }
      }
      
      return names;
    } catch (error) {
      console.error('Error fetching course names:', error);
      return {};
    }
  };

  const fetchVideos = async () => {
    try {
      setLoading(true);
      console.log('Fetching videos...');
      
      // Fetch pending videos with subject field - using only known fields
      const pendingResponse = await databases.listDocuments(
        '68261b6a002ba6c3b584',
        '685457d5000a277435ef',
        [
          Query.equal('status', 'pending'),
          Query.orderDesc('$createdAt'),
          Query.select(['$id', 'title', 'description', 'subject', 'url', 'thumbnailUrl', 'type', 'courseId', 'uploadedBy', 'status', '$createdAt'])
        ]
      );
      
      // Fetch reviewed videos with subject field - using only known fields
      const reviewedResponse = await databases.listDocuments(
        '68261b6a002ba6c3b584',
        '685457d5000a277435ef',
        [
          Query.or([
            Query.equal('status', 'approved'),
            Query.equal('status', 'rejected')
          ]),
          Query.orderDesc('$createdAt'), // Using $createdAt instead of $updatedAt
          Query.limit(50),
          Query.select(['$id', 'title', 'description', 'subject', 'url', 'thumbnailUrl', 'type', 'courseId', 'uploadedBy', 'status', '$createdAt', 'rejectionReason', 'approvedBy', 'rejectedBy'])
        ]
      );
      
      const pendingVideos = pendingResponse.documents as unknown as PendingVideo[];
      const reviewedVideos = reviewedResponse.documents as unknown as ReviewedVideo[];
      
      // Debug: Log the first video from each response to check its structure
      if (pendingVideos.length > 0) {
        console.log('First pending video data:', JSON.parse(JSON.stringify(pendingVideos[0])));
      }
      if (reviewedVideos.length > 0) {
        console.log('First reviewed video data:', JSON.parse(JSON.stringify(reviewedVideos[0])));
      }
      
      console.log('Fetched pending videos:', pendingVideos.map(v => ({ 
        id: v.$id, 
        title: v.title, 
        subject: v.subject,
        hasSubject: 'subject' in v
      })));
      console.log('Fetched reviewed videos:', reviewedVideos.map(v => ({ 
        id: v.$id, 
        title: v.title, 
        subject: v.subject,
        hasSubject: 'subject' in v
      })));
      
      const allVideos = [...pendingVideos, ...reviewedVideos];
      
      // Get unique teacher IDs and course IDs
      const teacherIds = allVideos
        .map(video => video.uploadedBy)
        .filter((id): id is string => !!id);
      
      const courseIds = allVideos
        .map(video => video.courseId)
        .filter((id): id is string => !!id);
      
      // Fetch teacher names and course names in parallel
      const [teacherNamesResult, courseNamesResult] = await Promise.all([
        fetchTeacherNames(teacherIds),
        fetchCourseNames(courseIds)
      ]);
      
      setTeacherNames(prev => ({ ...prev, ...teacherNamesResult }));
      setCourseNames(prev => ({ ...prev, ...courseNamesResult }));
      
      setPendingVideos(pendingResponse.documents as unknown as PendingVideo[]);
      setReviewedVideos(reviewedResponse.documents as unknown as ReviewedVideo[]);
    } catch (err) {
      console.error('Error fetching videos:', err);
      setError('Failed to load videos');
    } finally {
      setLoading(false);
    }
  };
  
  const updateVideoStatus = async (videoId: string, status: 'approved' | 'rejected', reason?: string) => {
    const userEmail = currentUser?.email;
    
    if (!userEmail) {
      console.error('No authenticated user found');
      toast.error('You must be logged in to perform this action');
      return;
    }
    
    let reviewerName = userEmail.split('@')[0] || 'Admin';
    
    try {
      const profilesResponse = await databases.listDocuments(
        '68261b6a002ba6c3b584',
        '68261bb5000a54d8652b',
        [Query.equal('email', userEmail)]
      );
      
      if (profilesResponse.documents.length > 0) {
        const profile = profilesResponse.documents[0];
        reviewerName = profile.name || reviewerName;
      }
      
      const videoDoc = await databases.getDocument(
        '68261b6a002ba6c3b584',
        '685457d5000a277435ef',
        videoId
      ) as unknown as VideoBase;
      
      const displayName = reviewerName.trim() || 'Admin';
      const reviewInfo = status === 'approved' 
        ? `[APPROVED] Approved by ${displayName} on ${new Date().toLocaleString()}`
        : `[REJECTED] Rejected by ${displayName} on ${new Date().toLocaleString()}: ${reason || 'No reason provided'}`;
      
      const updateData: any = {
        status,
        description: `${videoDoc.description || ''}\n\n${reviewInfo}`,
      };
      
      if (status === 'approved') {
        updateData.approvedBy = reviewerName;
        updateData.rejectedBy = null;
        updateData.rejectionReason = null;
      } else {
        updateData.rejectedBy = reviewerName;
        updateData.rejectionReason = reason || 'No reason provided';
        updateData.approvedBy = null;
      }

      const updatedVideo = { ...videoDoc, ...updateData } as ReviewedVideo;
      
      setPendingVideos(prev => prev.filter(v => v.$id !== videoId));
      setReviewedVideos(prev => [updatedVideo, ...prev]);
      
      await databases.updateDocument(
        '68261b6a002ba6c3b584',
        '685457d5000a277435ef',
        videoId,
        updateData
      );
      
      if (status === 'approved' && videoDoc.uploadedBy && videoDoc.title) {
        try {
          await sendApproval(videoDoc.uploadedBy, {
            id: videoDoc.$id,
            videoId: videoDoc.$id,
            title: videoDoc.title,
            thumbnailUrl: videoDoc.thumbnailUrl
          });
        } catch (error) {
          console.error('Error sending approval notification:', error);
        }
      }
      
      toast.success(`Video ${status} successfully`);
      setSelectedVideo(null);
      setIsReviewing(false);
      setShowRejectModal(false);
      
    } catch (error) {
      console.error('Error updating video status:', error);
      toast.error(`Failed to ${status} video`);
    }
  };

  const renderLoading = () => (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  const getDisplayDate = (video: PendingVideo | ReviewedVideo): string => {
    // Check all possible date fields in order of preference
    const dateValue = 
      (video as any).$updatedAt ||  // Appwrite system field
      (video as any).$createdAt ||  // Appwrite system field
      video.updatedAt ||           // Custom updatedAt
      video.uploadedAt;            // Custom uploadedAt
      
    if (!dateValue) return 'Date not available';
    
    try {
      return new Date(dateValue).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      console.error('Error formatting date:', dateValue, e);
      return 'Date not available';
    }
  };

  const renderVideoCard = (video: PendingVideo | ReviewedVideo, isHistory: boolean = false): JSX.Element => {
    console.log('Rendering video card:', {
      id: video.$id,
      title: video.title,
      subject: video.subject,
      hasSubject: 'subject' in video
    });

    const statusColors = {
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800'
    };

    const statusIcons = {
      approved: <CheckCircle2 className="h-4 w-4 mr-1" />,
      rejected: <XCircle className="h-4 w-4 mr-1" />,
      pending: <Clock className="h-4 w-4 mr-1" />
    };

    return (
      <div 
        key={video.$id}
        className={`border rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 ${isHistory ? 'opacity-90 hover:opacity-100' : ''} bg-white`}
        onClick={() => {
          // Allow video playback for both pending and history tabs
          setSelectedVideo(video as PendingVideo);
          setIsReviewing(true);
        }}
      >
        <div className="relative pt-[56.25%] bg-gray-100 group">
          {video.thumbnailUrl ? (
            <>
              <img
                src={video.thumbnailUrl}
                alt={video.title}
                className="absolute inset-0 w-full h-full object-cover group-hover:opacity-90 transition-opacity duration-300"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                <div className="bg-black bg-opacity-60 text-white rounded-full p-3 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                  <Play className="h-6 w-6" />
                </div>
              </div>
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400">
              <Video className="h-12 w-12" />
            </div>
          )}
            
          <div className={`absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-medium flex items-center ${statusColors[video.status]}`}>
            {statusIcons[video.status]}
            {video.status.charAt(0).toUpperCase() + video.status.slice(1)}
          </div>
        </div>

        <div className="p-4">
          <h3 className="font-semibold text-gray-900 line-clamp-2 text-lg mb-1">{video.title}</h3>
            
          <div className="flex items-start text-sm text-gray-600 mb-2">
            <span className="font-medium mr-2">Course:</span>
            <div>
              <div className="text-gray-700 font-medium">
                {courseNames[video.courseId] || `Course ${video.courseId?.substring(0, 8)}...`}
              </div>
              {video.courseId && (
                <div className="text-xs text-gray-500 mt-1">
                  ID: {video.courseId}
                </div>
              )}
            </div>
          </div>
            
          <div className="flex items-center text-sm text-gray-600 mb-3">
            <span className="font-medium">Teacher:</span>
            <span className="ml-1 text-gray-700">
              {teacherNames[video.uploadedBy] || video.uploadedBy || 'Unknown'}
            </span>
          </div>

          <div className="flex items-start text-sm text-gray-600 mb-3">
            <span className="font-medium mr-2">Subject:</span>
            <span className="text-gray-700">
              {(video as any).subject || 'No subject provided'}
            </span>
          </div>

          {isHistory && video.status === 'rejected' && video.rejectionReason && (
            <div className="mt-2 p-2 bg-red-50 rounded-md border border-red-100">
              <p className="text-xs text-red-600 line-clamp-2">
                <span className="font-medium">Rejection Reason:</span> {video.rejectionReason}
              </p>
            </div>
          )}

          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              {isHistory ? (
                <>
                  <span className="block mb-1">
                    {video.status === 'approved' 
                      ? `✅ Approved by ${(video as ReviewedVideo).approvedBy || 'Admin'}`
                      : `❌ Rejected by ${(video as ReviewedVideo).rejectedBy || 'Admin'}`}
                  </span>
                  <span className="text-xs text-gray-400">
                    {getDisplayDate(video)}
                  </span>
                </>
              ) : (
                <span className="text-sm text-gray-500">
                📅 {getDisplayDate(video)}
              </span>
              )}
            </p>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return renderLoading();
  }

  if (error) {
    return (
      <div className="p-6 text-red-600">
        Error: {error}
      </div>
    );
  }

  if (isReviewing && selectedVideo) {
    return (
      <div className="p-6">
        <button 
          onClick={() => {
            setSelectedVideo(null);
            setIsReviewing(false);
          }}
          className="mb-4 flex items-center text-blue-600 hover:text-blue-800"
        >
          <X className="mr-1" /> Back to list
        </button>
        
        <h2 className="text-2xl font-bold mb-4">{selectedVideo.title}</h2>
        <div className="text-gray-600 mb-4 whitespace-pre-line">
          {selectedVideo.description?.split('\n').map((line, i) => (
            <p key={i} className={line.includes('[APPROVED]') ? 'text-green-600 font-medium' : 
                                 line.includes('[REJECTED]') ? 'text-red-600 font-medium' : ''}>
              {line}
            </p>
          ))}
        </div>
        
        <div className="mb-6 bg-black rounded-lg overflow-hidden">
          {selectedVideo.type === 'youtube' ? (
            <ReactPlayer
              url={selectedVideo.url}
              controls
              width="100%"
              height="500px"
            />
          ) : (
            <video
              src={selectedVideo.url}
              controls
              className="w-full h-auto max-h-[500px]"
            />
          )}
        </div>
        
        <div className="flex space-x-4">
          <button
            onClick={() => updateVideoStatus(selectedVideo.$id, 'approved')}
            className="px-4 py-2 bg-green-600 text-white rounded-md flex items-center hover:bg-green-700 transition-colors"
          >
            <Check className="mr-2" /> Approve
          </button>
          <button
            onClick={() => setShowRejectModal(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-md flex items-center hover:bg-red-700 transition-colors"
          >
            <X className="mr-2" /> Reject
          </button>
          <button
            onClick={() => {
              alert('Opening chat with teacher');
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center hover:bg-blue-700 transition-colors"
          >
            <MessageSquare className="mr-2" /> Message Teacher
          </button>
        </div>
        
        {selectedVideo && (
          <RejectVideoModal
            isOpen={showRejectModal}
            onClose={() => setShowRejectModal(false)}
            video={{
              id: selectedVideo.$id,
              videoId: selectedVideo.$id,
              title: selectedVideo.title,
              thumbnailUrl: selectedVideo.thumbnailUrl,
              uploadedBy: selectedVideo.uploadedBy
            }}
            onReject={async (reason: string) => {
              await updateVideoStatus(selectedVideo.$id, 'rejected', reason);
              setShowRejectModal(false);
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Video Review</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 rounded-md ${activeTab === 'pending' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            Pending Review
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-md ${activeTab === 'history' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            Review History
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeTab === 'pending' ? (
          pendingVideos.length > 0 ? (
            pendingVideos.map((video) => renderVideoCard(video))
          ) : (
            <div className="col-span-full text-center py-10 text-gray-500">
              <Video className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>No pending videos to review</p>
            </div>
          )
        ) : reviewedVideos.length > 0 ? (
          // Group videos by course name
          (() => {
            // Create a map of course names to their videos
            const videosByCourse = reviewedVideos.reduce((acc, video) => {
              const courseName = courseNames[video.courseId] || 'Uncategorized';
              if (!acc[courseName]) {
                acc[courseName] = [];
              }
              acc[courseName].push(video);
              return acc;
            }, {} as Record<string, (PendingVideo | ReviewedVideo)[]>);

            // Sort courses alphabetically
            const sortedCourses = Object.keys(videosByCourse).sort();

            // Initialize expanded state for courses if not already set
            if (Object.keys(expandedCourses).length === 0 && sortedCourses.length > 0) {
              const initialExpandedState = sortedCourses.reduce((acc, course) => {
                acc[course] = false; // Collapse all courses by default
                return acc;
              }, {} as Record<string, boolean>);
              setExpandedCourses(initialExpandedState);
              return <div className="col-span-full">Loading course sections...</div>;
            }

            const toggleCourse = (courseName: string) => {
              setExpandedCourses(prev => ({
                ...prev,
                [courseName]: !prev[courseName]
              }));
            };

            return (
              <div className="col-span-full space-y-3">
                {sortedCourses.map((courseName) => (
                  <div key={courseName} className="border rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleCourse(courseName)}
                      className="w-full bg-gray-50 px-6 py-3 border-b flex justify-between items-center hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center">
                        <ChevronDown 
                          className={`h-5 w-5 mr-2 text-gray-500 transition-transform duration-200 ${expandedCourses[courseName] ? 'transform rotate-180' : ''}`}
                        />
                        <h3 className="text-lg font-semibold text-gray-800 text-left">
                          {courseName}
                        </h3>
                      </div>
                      <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        {videosByCourse[courseName].length} {videosByCourse[courseName].length === 1 ? 'video' : 'videos'}
                      </span>
                    </button>
                    <div 
                      className={`transition-all duration-300 overflow-hidden ${expandedCourses[courseName] ? 'max-h-[2000px]' : 'max-h-0'}`}
                    >
                      <div className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {videosByCourse[courseName].map((video) => renderVideoCard(video, true))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()
        ) : (
          <div className="col-span-full text-center py-10 text-gray-500">
            <History className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>No video review history yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoReviewPage;