import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { databases, DATABASE_ID, LIVE_LECTURES_COLLECTION_ID } from '../lib/appwrite';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import { JitsiMeeting } from '@jitsi/react-sdk';

interface ILiveLecture {
  // Required fields
  title: string;
  courseId: string;
  teacherId: string;
  teacherName: string;
  startTime: string;
  status: 'scheduled' | 'live' | 'ended' | 'cancelled';
  duration: number;
  maxParticipants: number;
  
  // Optional fields
  id?: string; // Made optional since we're using $id from Appwrite
  $id?: string; // Appwrite document ID
  description?: string;
  endTime?: string;
  roomName?: string; // For Jitsi meeting
  participants?: string[]; // Array of user IDs
  recordingUrl?: string;
  meetingUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

const LiveLecturePage: React.FC = () => {
  const { courseId, lectureId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [lecture, setLecture] = useState<ILiveLecture | null>(null);
  const [loading, setLoading] = useState(true);
  // Generate a consistent room name that matches the format used in LiveLecturesSection
  const roomName = lecture?.roomName || `lecture-${lectureId || ''}`;

  useEffect(() => {
    if (!lectureId) {
      navigate(user?.role === 'teacher' ? `/courses/${courseId}/teacher` : `/courses/${courseId}`);
      return;
    }

    const fetchLecture = async () => {
      try {
        const response = await databases.getDocument(
          DATABASE_ID,
          LIVE_LECTURES_COLLECTION_ID,
          lectureId
        );
        setLecture(response);
        
        // Only update status if teacher is joining
        if (user?.role === 'teacher' && response.status === 'scheduled') {
          await databases.updateDocument(
            DATABASE_ID,
            LIVE_LECTURES_COLLECTION_ID,
            lectureId,
            { status: 'live' }
          );
        }
      } catch (error) {
        console.error('Error fetching lecture:', error);
        navigate(user?.role === 'teacher' ? `/courses/${courseId}/teacher` : `/courses/${courseId}`);
      } finally {
        setLoading(false);
      }
    };

    fetchLecture();
  }, [lectureId, courseId, navigate, user?.role]);

  // Handle sending chat messages
  // Chat functionality can be implemented here if needed

  const handleEndLecture = async () => {
    if (!lectureId) return;
    
    try {
      await databases.updateDocument(
        '68261b6a002ba6c3b584',
        'liveLectures',
        lectureId,
        { status: 'ended' }
      );
      navigate(`/courses/${courseId}`);
      toast.success('Lecture has been ended');
    } catch (error) {
      console.error('Error ending lecture:', error);
      toast.error('Failed to end lecture');
    }
  };

  // Meeting status is automatically updated when the teacher starts the lecture
  // through the JitsiMeeting component's onApiReady handler

  // Jitsi API ready handler
  const handleApiReady = (api: any) => {
    console.log('Jitsi API ready', api);
  };

  if (loading || !lecture) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">Loading lecture details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <button
            onClick={() => navigate(`/courses/${courseId}`)}
            className="flex items-center text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            <span>Back to Course</span>
          </button>
          
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              <span>{new Date(lecture.startTime).toLocaleDateString()}</span>
              <Clock className="h-4 w-4 ml-3 mr-1" />
              <span>{new Date(lecture.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-dark-800 rounded-xl shadow-md overflow-hidden p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">{lecture.title}</h2>
              {user?.role === 'teacher' && (
                <Button
                  variant="destructive"
                  onClick={handleEndLecture}
                  disabled={lecture.status !== 'live'}
                >
                  End Lecture
                </Button>
              )}
            </div>
            
            {lecture.description && (
              <p className="text-gray-600 dark:text-gray-300">{lecture.description}</p>
            )}
            
            <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                <span>{new Date(lecture.startTime).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                <span>{new Date(lecture.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              </div>
              <div className="flex items-center">
                <span>•</span>
                <span className="ml-2">{lecture.duration} minutes</span>
              </div>
            </div>
            
            {lecture.status === 'live' && (
              <div className="mt-6">
                <div className="w-full h-[600px] bg-gray-100 rounded-lg overflow-hidden">
                  <JitsiMeeting
                    roomName={roomName}
                    getIFrameRef={(node) => {
                      if (node) node.style.height = '100%';
                      return node;
                    }}
                    onApiReady={handleApiReady}
                    configOverwrite={{
                      startWithAudioMuted: true,
                      startWithVideoMuted: true,
                      disableModeratorIndicator: true,
                      startScreenSharing: false,
                      enableEmailInStats: false,
                      enableWelcomePage: false,
                      prejoinPageEnabled: false,
                      disableInviteFunctions: true,
                      toolbarButtons: [
                        'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
                        'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
                        'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
                        'videoquality', 'filmstrip', 'shortcuts', 'tileview', 'select-background',
                        'mute-everyone', 'security', 'toggle-camera'
                      ]
                    }}
                    interfaceConfigOverwrite={{
                      DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
                      SHOW_CHROME_EXTENSION_BANNER: false,
                      MOBILE_APP_PROMO: false,
                      HIDE_INVITE_MORE_HEADER: true,
                      DISABLE_VIDEO_BACKGROUND: true,
                      DISABLE_PRESENCE_STATUS: true,
                      DISABLE_RINGING: true,
                      SHOW_JITSI_WATERMARK: false,
                      SHOW_WATERMARK_FOR_GUESTS: false,
                      TOOLBAR_BUTTONS: [
                        'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
                        'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
                        'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
                        'videoquality', 'filmstrip', 'shortcuts', 'tileview', 'select-background',
                        'mute-everyone', 'security', 'toggle-camera'
                      ]
                    }}
                  />
                </div>
              </div>
            )}
            
            {lecture.status === 'scheduled' && (
              <p className="text-yellow-600 dark:text-yellow-400">
                This lecture has not started yet. Please check back at the scheduled time.
              </p>
            )}
            
            {lecture.status === 'ended' && (
              <p className="text-red-600 dark:text-red-400">
                This lecture has ended.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveLecturePage;