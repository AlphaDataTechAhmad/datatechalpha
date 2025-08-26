import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, Clock, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';

import { databases, ID, Query } from '../lib/appwrite';
import { DATABASE_ID, LIVE_LECTURES_COLLECTION_ID } from '../lib/appwrite';

// Types
// User interface is now imported from AuthContext

type LectureStatus = 'scheduled' | 'live' | 'ended';

interface ILiveLecture {
  id: string;
  $id?: string; // For Appwrite compatibility
  title: string;
  description: string;
  courseId: string;
  teacherId: string;
  teacherName: string;
  startTime: string;
  duration?: number; // Made optional with a default value of 60 minutes
  status: LectureStatus;
  roomName?: string;
  maxParticipants: number;
  createdAt?: string;
  updatedAt?: string;
}

interface CreateLectureFormData {
  title: string;
  description: string;
  startTime: string;
  duration: number;
}

// Helper function to generate a Jitsi room name
const generateJitsiRoomName = (title: string = ''): string => {
  const randomId = Math.random().toString(36).substring(2, 10);
  const slug = title
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '');
  return `${slug}-${randomId}`;
};

const LiveLecturesSection: React.FC = () => {
  const navigate = useNavigate();

  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuth();
  // Remove unused navigate since we're not navigating programmatically
  const isTeacher = user?.role === 'teacher';


  // State for lectures and UI
  const [lectures, setLectures] = useState<ILiveLecture[]>([]);
  const [pastLectures, setPastLectures] = useState<ILiveLecture[]>([]);
  const [_isLoading, setIsLoading] = useState(true);
  const [activeLecture, setActiveLecture] = useState<ILiveLecture | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  
  const [newLecture, setNewLecture] = useState<CreateLectureFormData>({
    title: '',
    description: '',
    startTime: new Date().toISOString().slice(0, 16),
    duration: 60,
  });

  // Format date and time for display
  const formatDateTime = useCallback((dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date');
      }
      return {
        date: date.toLocaleDateString(),
        time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
    } catch (error) {
      console.error('Error formatting date:', error);
      return { date: 'Invalid date', time: '' };
    }
  }, []);

  // Fetch lectures for the current course from Appwrite
  const fetchLectures = useCallback(async () => {
    if (!courseId) {
      console.log('No courseId provided, skipping fetch');
      return;
    }
    
    console.log('Fetching lectures for course:', courseId);
    setIsLoading(true);
    
    try {
      // Fetch lectures for the current course from Appwrite
      const response = await databases.listDocuments(
        DATABASE_ID,
        LIVE_LECTURES_COLLECTION_ID,
        [
          Query.equal('courseId', courseId),
          Query.orderDesc('startTime')
        ]
      );
      
      console.log('Fetched lectures from Appwrite:', response);
      
      if (!response || !response.documents) {
        console.error('Invalid response from Appwrite:', response);
        throw new Error('Invalid response from server');
      }
      
      // Convert Appwrite documents to our lecture format
      const fetchedLectures = response.documents.map((doc: any) => ({
        id: doc.$id,
        title: doc.title,
        description: doc.description,
        courseId: doc.courseId,
        teacherId: doc.teacherId,
        teacherName: doc.teacherName,
        startTime: doc.startTime,
        duration: doc.duration,
        status: doc.status || 'scheduled',
        meetingUrl: doc.meetingUrl || '',
        maxParticipants: doc.maxParticipants || 100,
        createdAt: doc.$createdAt,
        updatedAt: doc.$updatedAt
      }));
      
      console.log('Processed lectures:', fetchedLectures);
      
      // Separate past and upcoming lectures
      const now = new Date();
      const { upcoming, past } = fetchedLectures.reduce<{ upcoming: ILiveLecture[], past: ILiveLecture[] }>(
        (acc, lecture) => {
          const lectureEndTime = new Date(lecture.startTime);
          lectureEndTime.setMinutes(lectureEndTime.getMinutes() + (lecture.duration || 60));
          
          if (lectureEndTime < now || lecture.status === 'ended') {
            acc.past.push(lecture);
          } else {
            acc.upcoming.push(lecture);
          }
          return acc;
        },
        { upcoming: [], past: [] }
      );
      
      setLectures(upcoming);
      setPastLectures(past);
    } catch (error) {
      console.error('Error fetching lectures from Appwrite:', error);
      toast.error('Failed to load lectures');
    } finally {
      setIsLoading(false);
    }
  }, [courseId]);
  
  // Set up real-time subscription for live lectures
  useEffect(() => {
    if (!courseId) {
      console.log('No courseId, skipping real-time setup');
      return;
    }
    
    console.log('Setting up real-time subscription for course:', courseId);
    
    let unsubscribe: (() => void) | null = null;
    let refreshInterval: NodeJS.Timeout | null = null;
    
    const setupRealtime = async () => {
      try {
        // First, fetch the current lectures
        console.log('Fetching initial lectures...');
        await fetchLectures();
        
        // Only set up real-time if we're authenticated
        if (!user) {
          console.log('User not authenticated, skipping real-time setup');
          return;
        }
        
        // Set up the real-time subscription
        const channel = `databases.${DATABASE_ID}.collections.${LIVE_LECTURES_COLLECTION_ID}.documents`;
        console.log('Subscribing to channel:', channel);
        
        try {
          unsubscribe = databases.client.subscribe(channel, (response: any) => {
            console.log('Real-time update received:', response);
            
            try {
              // Check if this is a relevant event
              const isRelevantEvent = response.events?.some((event: string) => 
                event.includes('create') || 
                event.includes('update') || 
                event.includes('delete')
              );
              
              if (isRelevantEvent) {
                console.log('Relevant event detected, refreshing lectures...');
                fetchLectures().catch(err => 
                  console.error('Error refreshing lectures:', err)
                );
              }
            } catch (error) {
              console.error('Error processing real-time update:', error);
            }
          });
          
          console.log('Real-time subscription established');
          
          // Set up a periodic refresh as a fallback (every 60 seconds)
          refreshInterval = setInterval(() => {
            console.log('Periodic refresh of lectures...');
            fetchLectures().catch(err => 
              console.error('Error during periodic refresh:', err)
            );
          }, 60000);
          
        } catch (error) {
          console.error('Error setting up real-time subscription:', error);
          // Fallback to just polling if real-time fails
          refreshInterval = setInterval(() => {
            console.log('Fallback refresh of lectures...');
            fetchLectures().catch(console.error);
          }, 30000);
        }
      } catch (error) {
        console.error('Error in setupRealtime:', error);
      }
    };
    
    setupRealtime();
    
    return () => {
      console.log('Cleaning up real-time subscription and interval');
      if (unsubscribe) {
        try {
          unsubscribe();
        } catch (error) {
          console.error('Error unsubscribing:', error);
        }
      }
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [courseId, fetchLectures, user]);

  // Handle input changes in the new lecture form
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewLecture(prev => ({
      ...prev,
      [name]: name === 'duration' ? parseInt(value, 10) || 0 : value
    }));
  };

  // Create a new live lecture
  const handleCreateLecture = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !courseId) {
      toast.error('User not authenticated or course ID missing');
      return;
    }
    
    try {
      setIsProcessing('creating');
      
      // Verify user is authenticated
      if (!user?.$id) {
        throw new Error('User not authenticated');
      }

      // Create the lecture in Appwrite
      const lectureId = ID.unique();
      // Generate a Jitsi room name based on lecture title and ID
      const roomName = generateJitsiRoomName(newLecture.title);
      
      // Create the document with only fields that exist in the database schema
      const currentTime = new Date().toISOString();
      const initialLectureData = {
        title: newLecture.title,
        description: newLecture.description || '',
        courseId: courseId || '',
        teacherId: user?.$id || '',
        teacherName: user?.name || 'Unknown Teacher',
        startTime: newLecture.startTime,
        status: 'scheduled',
        maxParticipants: 100,
        createdAt: currentTime,
        updatedAt: currentTime // Added required field
      };
      
      console.log('Creating initial lecture document with data:', initialLectureData);
      
      // Create the document with required fields first
      const result = await databases.createDocument(
        DATABASE_ID,
        LIVE_LECTURES_COLLECTION_ID,
        'unique()', // Let Appwrite generate the ID
        initialLectureData
      );
      
      console.log('Document created successfully with ID:', result.$id);
      
      // Update with additional fields that might not be in the schema
      try {
        // First update with just the data (no permissions change)
        await databases.updateDocument(
          DATABASE_ID,
          LIVE_LECTURES_COLLECTION_ID,
          result.$id,
          {
            roomName: `lecture-${result.$id}`,
            duration: newLecture.duration || 60
          }
        );
        
        // Then update permissions separately if needed
        try {
          await databases.updateDocument(
            DATABASE_ID,
            LIVE_LECTURES_COLLECTION_ID,
            result.$id,
            {},
            [
              'read(any)',
              `write(user:${user?.$id})`,
              `update(user:${user?.$id})`,
              `delete(user:${user?.$id})`
            ]
          );
          console.log('Document permissions updated successfully');
        } catch (permError) {
          console.warn('Could not update document permissions:', permError);
          // Continue even if permission update fails
        }
        
        console.log('Document updated with additional fields');
      } catch (updateError) {
        console.warn('Could not update document with additional fields:', updateError);
        // Don't throw here - we still want to proceed even if the update fails
      }
      
      console.log('Document created successfully with ID:', result.$id);
      
      // Update with roomName after creation if needed
      if (result.$id) {
        try {
          await databases.updateDocument(
            DATABASE_ID,
            LIVE_LECTURES_COLLECTION_ID,
            result.$id,
            {
              roomName: `lecture-${result.$id}`
            }
          );
          console.log('Document updated with roomName');
        } catch (updateError) {
          console.warn('Could not update document with roomName:', updateError);
        }
      }
      
      // If we get here, the document was created successfully
      console.log('Document created successfully:', result);
      
      console.log('Document created successfully with ID:', result.$id);
      
      // If we have a roomName, update the document to include it
      if (roomName && result?.$id) {
        try {
          console.log('Updating document with roomName:', roomName);
          await databases.updateDocument(
            DATABASE_ID,
            LIVE_LECTURES_COLLECTION_ID,
            result.$id, // Use the document ID from the create operation
            { roomName }
          );
          console.log('Document updated with roomName successfully');
        } catch (updateError) {
          console.warn('Could not update document with roomName, continuing without it:', updateError);
          // If schema doesn't have roomName field, we'll need to add it to the collection schema
          console.warn('Make sure the collection schema includes a roomName field of type string');
        }
      }
      
      console.log('Permissions updated successfully');
      
      console.log('Document created with ID:', result.$id);
      
      console.log('Lecture created successfully:', result);
      
      // Reset form
      setNewLecture({
        title: '',
        description: '',
        startTime: new Date().toISOString().slice(0, 16),
        duration: 60,
      });
      
      setShowForm(false);
      toast.success('Live lecture scheduled successfully!');
      
      // Manually refresh the lectures list
      await fetchLectures();
    } catch (error: any) {
      console.error('Error creating lecture:', error);
      const errorMessage = error.message || 'Failed to schedule live lecture';
      toast.error(errorMessage);
      
      // Log additional error details if available
      if (error.response) {
        console.error('Error response:', error.response);
      }
    } finally {
      setIsProcessing(null);
    }
  };

  // Join or start a Jitsi meeting for the specified lecture
  const joinJitsiMeeting = async (lecture: ILiveLecture): Promise<void> => {
    const lectureId = lecture.$id || lecture.id;
    if (!lectureId) {
      console.error('joinJitsiMeeting called with no lectureId');
      toast.error('No lecture ID available');
      return;
    }

    try {
      // If user is teacher and lecture is not live, start it first
      if (user?.$id === lecture.teacherId && lecture.status !== 'live') {
        await handleStartLecture(lecture);
        // Update the lecture object with the new status and room name
        lecture = { ...lecture, status: 'live', roomName: lecture.roomName || `lecture-${lectureId}` };
        
        // Add a small delay to ensure the lecture is properly started
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Only proceed if lecture is live or user is the teacher
      if (lecture.status === 'live' || user?.$id === lecture.teacherId) {
        const roomName = lecture.roomName || `lecture-${lectureId}`;
        const domain = 'meet.jit.si';
        const isTeacher = user?.$id === lecture.teacherId;
        const displayName = user?.name || (isTeacher ? 'Teacher' : 'Student');
        const email = user?.email || '';
        
        // Jitsi configuration - Completely disable all lobby and waiting room functionality
        const config = {
          // Core meeting settings
          startWithAudioMuted: !isTeacher,
          startWithVideoMuted: !isTeacher,
          
          // Disable all lobby and waiting room features
          enableLobby: false,
          enableLobbyChat: false,
          enableNoisyMicDetection: false,
          enableNoAudioDetection: false,
          enableForcedReload: false,
          
          // Disable authentication and pre-join screens
          enableWelcomePage: false,
          prejoinPageEnabled: false,
          disablePrejoinDisplayName: true,
          requireDisplayName: false,
          
          // Disable members-only mode
          enableMembersOnly: false,
          
          // Other settings
          disableInviteFunctions: true,
          enableClosePage: false,
          defaultLanguage: 'en',
          disableDeepLinking: true,
          
          // Set moderator flags for teacher
          ...(isTeacher ? {
            // Force moderator role with all permissions
            userRoles: ['moderator'],
            startWithAudioMuted: false,
            startWithVideoMuted: false,
            
            // Disable all lobby and waiting room features
            enableLobby: false,
            enableNoisyMicDetection: false,
            
            // Force disable members-only mode
            enableMembersOnly: false,
            
            // Override any lobby-related settings
            testing: {
              // Force disable lobby
              enableLobby: false,
              // Disable lobby button
              disableLobbyButton: true,
              // Disable lobby mode
              disableLobbyMode: true,
              // Disable lobby password
              enableLobbyPassword: false,
              // Disable lobby notifications
              enableLobbyNotifications: false,
              // Disable lobby pre-join screen
              enableLobbyPrejoin: false
            },
            
            // Enable all moderator features
            features: {
              // Core features
              'screen-sharing': true,
              'recording': true,
              'moderation': true,
              
              // Disable all lobby and waiting room features
              'lobby': false,
              'welcome-page': false,
              'prejoin-page': false,
              'members-only': false,
              'security-options': false,
              'lobby-button': false,
              'lobby-mode': false,
              'lobby-password': false,
              'lobby-notifications': false,
              'lobby-prejoin': false,
              'lobby-welcome': false
            }
          } : {})
        };
        
        // Interface configuration
        const interfaceConfig = {
          APP_NAME: 'EduConnect Live',
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          DEFAULT_BACKGROUND: '#f0f0f0',
          INITIAL_TOOLBAR_TIMEOUT: 20000,
        };

        // Build userInfo object with moderator settings
        const userInfo = {
          displayName: user?.name || (isTeacher ? 'Teacher' : 'Student'),
          email: user?.email || '',
          ...(isTeacher ? {
            userRole: 'moderator',
            isModerator: true,
            moderator: 'true',
            features: {
              'screen-sharing': true,
              'recording': true,
              'moderation': true
            }
          } : {
            userRole: 'participant'
          })
        };

        // Create URL with config and interfaceConfig as URL parameters
        const params = new URLSearchParams();
        params.append('config', JSON.stringify(config)); // Use config instead of jitsiConfig
        params.append('interfaceConfig', JSON.stringify(interfaceConfig));
        params.append('userInfo', JSON.stringify(userInfo));

        // Build the final URL with hash parameters
        const jitsiUrl = `https://${domain}/${encodeURIComponent(roomName)}#${params.toString()}`;
        
        // Log the URL for debugging
        console.log('Jitsi Meeting URL:', jitsiUrl);
        
        // Open in a new window
        const width = 1200;
        const height = 700;
        const left = (window.screen.width - width) / 2;
        const top = (window.screen.height - height) / 2;
        
        const newWindow = window.open(
          jitsiUrl,
          'JitsiMeet',
          `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=no,toolbar=no,menubar=no,location=no,status=no`
        );
        
        // Focus the window if it was opened successfully
        if (newWindow) {
          newWindow.focus();
        }
      }
    } catch (error) {
      console.error('Error joining Jitsi meeting:', error);
      toast.error('Failed to join the meeting. Please try again.');
    }
  };

  // State for the confirmation dialog
  const [lectureToStart, setLectureToStart] = useState<ILiveLecture | null>(null);
  const [showStartConfirmation, setShowStartConfirmation] = useState(false);

  // Show confirmation dialog before starting lecture
  const handleStartClick = (lecture: ILiveLecture) => {
    setLectureToStart(lecture);
    setShowStartConfirmation(true);
  };

  // Cancel starting the lecture
  const handleCancelStart = () => {
    setShowStartConfirmation(false);
    setLectureToStart(null);
  };

  // Start a live lecture (for teacher view)
  const handleStartLecture = async (lecture: ILiveLecture) => {
    try {
      // Get the lecture ID with a fallback to an empty string
      const lectureId = (lecture.$id || lecture.id || '').toString();
      
      if (!lectureId) {
        throw new Error('No lecture ID found');
      }
      
      // Set processing state with the validated ID
      setIsProcessing(`starting-${lectureId}`);
      
      // Generate a consistent room name that will be used for the Jitsi meeting
      const roomName = `lecture-${lectureId}`;
      
      console.log('Starting lecture with Jitsi:', { roomName, lectureId });
      
      // First update the status in the database
      try {
        await databases.updateDocument(
          DATABASE_ID,
          LIVE_LECTURES_COLLECTION_ID,
          lectureId,
          {
            status: 'live',
            updatedAt: new Date().toISOString(),
            roomName // Also store the roomName in the database
          }
        );
      } catch (error) {
        console.error('Error updating lecture status:', error);
        throw error;
      }
      
      // Update local state with the new values
      const newLecture = {
        ...lecture,
        roomName,
        status: 'live',
        updatedAt: new Date().toISOString()
      } as ILiveLecture;
      
      setLectures(prev => 
        prev.map(l => (l.$id === lectureId || l.id === lectureId) ? newLecture : l)
      );
      
      setActiveLecture(newLecture);
      toast.success('Lecture started successfully!');
      
      // Close the confirmation dialog
      setShowStartConfirmation(false);
      setLectureToStart(null);
      
      // Force refresh the lectures list to ensure consistency
      await fetchLectures();
      
    } catch (error) {
      console.error('Error starting lecture:', error);
      toast.error('Failed to start lecture: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsProcessing(null);
    }
  };

  const handleEndLecture = async (lectureId: string) => {
    if (!lectureId) {
      console.error('Cannot end lecture: No lecture ID provided');
      toast.error('Error: Missing lecture ID');
      return;
    }
    
    if (window.confirm('Are you sure you want to end this lecture? This cannot be undone.')) {
      setIsProcessing(`ending-${lectureId}`);
      try {
        await databases.updateDocument(
          DATABASE_ID,
          LIVE_LECTURES_COLLECTION_ID,
          lectureId,
          { status: 'ended' }
        );

        // Refresh the lectures list
        await fetchLectures();
        setActiveLecture(null);

        toast.success('Lecture has been ended successfully');
      } catch (error) {
        console.error('Error ending lecture:', error);
        toast.error('Failed to end lecture. Please try again.');
      } finally {
        setIsProcessing(null);
      }
    }
  };

  // Delete a lecture
  const handleDeleteLecture = async (lectureId: string) => {
    if (!lectureId) {
      console.error('Cannot delete lecture: No lecture ID provided');
      toast.error('Error: Missing lecture ID');
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this lecture? This action cannot be undone.')) {
      setIsProcessing(`deleting-${lectureId}`);
      try {
        await databases.deleteDocument(
          DATABASE_ID,
          LIVE_LECTURES_COLLECTION_ID,
          lectureId
        );

        // Refresh the lectures list
        await fetchLectures();
        
        // Clear active lecture if it's the one being deleted
        if (activeLecture?.id === lectureId || activeLecture?.$id === lectureId) {
          setActiveLecture(null);
        }

        toast.success('Lecture has been deleted successfully');
      } catch (error) {
        console.error('Error deleting lecture:', error);
        toast.error('Failed to delete lecture. Please try again.');
      } finally {
        setIsProcessing(null);
      }
    }
  };

  const renderLectureDetails = (lecture: ILiveLecture) => {
    // Type guard to ensure required properties exist
    if (!lecture || !lecture.startTime) {
      console.error('Invalid lecture data:', lecture);
      return null;
    }
    
    // Provide a default start time if not available
    const defaultStartTime = new Date().toISOString();
    const { date, time } = formatDateTime(lecture.startTime || defaultStartTime);
    const isActive = lecture.status === 'live';
    const isUpcoming = lecture.status === 'scheduled';
    const isTeacher = user?.role === 'teacher';

    return (
      <div
        key={lecture.$id}
        className={`p-4 border rounded-lg ${
          isActive
            ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
            : isUpcoming
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-800'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1">
            <h3 className="font-medium text-lg">{lecture.title}</h3>
            {lecture.description && (
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{lecture.description}</p>
            )}
            <div className="flex items-center mt-2 text-sm text-gray-500 dark:text-gray-400">
              <Calendar className="h-4 w-4 mr-1" />
              <span>{date} at {time}</span>
              <Clock className="h-4 w-4 ml-3 mr-1" />
              <span>{(lecture.duration ?? 60)} minutes</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            {isActive ? (
              <>
                <Button 
                  className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
                  onClick={(e) => {
                    e.preventDefault();
                    joinJitsiMeeting(lecture);
                  }}
                >
                  <ExternalLink className="h-4 w-4" />
                  Join Meeting
                </Button>
                {isTeacher && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      const lectureId = lecture.$id || lecture.id;
                      if (lectureId) {
                        handleEndLecture(lectureId);
                      } else {
                        console.error('No valid lecture ID found for ending lecture');
                        toast.error('Error: Could not end lecture - missing lecture ID');
                      }
                    }}
                    disabled={isProcessing === `ending-${lecture.$id || lecture.id}`}
                  >
                    {isProcessing === `ending-${lecture.$id || lecture.id}` ? 'Ending...' : 'End'}
                  </Button>
                )}
              </>
            ) : isUpcoming ? (
              isTeacher ? (
                <Button
                  onClick={() => handleStartLecture(lecture)}
                  disabled={isProcessing === `starting-${lecture.$id}`}
                >
                  {isProcessing === `starting-${lecture.$id}` ? 'Starting...' : 'Start Now'}
                </Button>
              ) : (
                <Button variant="outline" disabled>
                  Starts {date} at {time}
                </Button>
              )
            ) : (
              <Button variant="outline" disabled>
                Lecture Ended
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderLecturesList = () => {
    if (lectures.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">
            {isTeacher
              ? 'No live lectures scheduled. Create one to get started.'
              : 'No live lectures scheduled yet.'}
          </p>
          {isTeacher && (
            <Button onClick={() => setShowForm(true)} className="mt-4">
              Schedule Lecture
            </Button>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {isTeacher && (
          <div className="flex justify-end">
            <Button onClick={() => setShowForm(true)}>Schedule New Lecture</Button>
          </div>
        )}

        <div className="space-y-4">
          {lectures.map(lecture => (
            <React.Fragment key={lecture.$id || lecture.id}>
              {renderLectureDetails(lecture)}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };

  const copyMeetingLink = (lectureId: string, title: string = '') => {
    if (!lectureId) {
      toast.error('No lecture ID available');
      return;
    }
    
    // Generate room name for URL consistency (not used directly but ensures consistent naming)
    generateJitsiRoomName(title);
    const meetingUrl = `${window.location.origin}/courses/${courseId}/live-lecture/${lectureId}`;
    
    navigator.clipboard.writeText(meetingUrl)
      .then(() => {
        toast.success('Jitsi meeting link copied to clipboard');
      })
      .catch((error) => {
        console.error('Failed to copy meeting link:', error);
        toast.error('Failed to copy meeting link');
      });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Live Lectures</h2>
        {isTeacher && (
          <Button
            onClick={() => setShowForm(!showForm)}
            disabled={isProcessing === 'creating'}
          >
            {showForm ? 'Cancel' : 'Schedule New Lecture'}
          </Button>
        )}
      </div>

      {/* New Lecture Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Schedule New Live Lecture</CardTitle>
            <p className="text-sm text-muted-foreground">
              Fill in the details to schedule a new live session
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateLecture} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="title" className="block text-sm font-medium">
                  Title <span className="text-red-500">*</span>
                </label>
                <Input
                  id="title"
                  name="title"
                  value={newLecture.title}
                  onChange={handleInputChange}
                  placeholder="Enter lecture title"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="description" className="block text-sm font-medium">
                  Description
                </label>
                <Textarea
                  id="description"
                  name="description"
                  value={newLecture.description}
                  onChange={handleInputChange}
                  placeholder="Enter lecture description"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="startTime" className="block text-sm font-medium">
                    Date & Time <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="startTime"
                    name="startTime"
                    type="datetime-local"
                    value={newLecture.startTime}
                    onChange={handleInputChange}
                    min={new Date().toISOString().slice(0, 16)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="duration" className="block text-sm font-medium">
                    Duration (minutes) <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="duration"
                    name="duration"
                    type="number"
                    min="15"
                    step="15"
                    value={newLecture.duration}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                  disabled={isProcessing === 'creating'}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isProcessing === 'creating'}>
                  {isProcessing === 'creating' ? 'Scheduling...' : 'Schedule Lecture'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Active Lecture */}
      {activeLecture ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">
              {isTeacher ? 'Your Live Session' : 'Live Now'}
            </h3>
            <Button variant="outline" size="sm" onClick={() => setActiveLecture(null)}>
              Close
            </Button>
          </div>

          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 text-center">
            <h4 className="text-lg font-medium mb-4">Jitsi Meeting Session</h4>
            <p className="text-sm text-gray-500 mb-4">
              Click the button below to join the Jitsi meeting
            </p>
            <Button 
              onClick={() => joinJitsiMeeting(activeLecture)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Join Meeting
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">{activeLecture.title}</h4>
              <p className="text-sm text-gray-500">
                {formatDateTime(activeLecture.startTime).date} •{' '}
                {formatDateTime(activeLecture.startTime).time}
              </p>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyMeetingLink(activeLecture.id || '', activeLecture.title)}
              >
                Copy Meeting Link
              </Button>
              {isTeacher && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleEndLecture(activeLecture.$id)}
                  disabled={isProcessing === `ending-${activeLecture.$id}`}
                >
                  {isProcessing === `ending-${activeLecture.$id}` ? 'Ending...' : 'End Session'}
                </Button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <>
          {renderLecturesList()}
          <div className="mt-8">
            <h3 className="text-xl font-semibold mb-4">Past Lectures</h3>
            {pastLectures.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {pastLectures.map((lecture) => (
                  <Card key={lecture.id} className="opacity-80 hover:opacity-100 transition-opacity">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{lecture.title}</CardTitle>
                      <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                        {lecture.description}
                      </p>
                    </CardHeader>
                    <CardContent className="pb-4">
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center">
                          <span className="w-24 text-gray-500 dark:text-gray-400">Instructor</span>
                          <span>{lecture.teacherName}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="w-24 text-gray-500 dark:text-gray-400">Held on</span>
                          <span>
                            {formatDateTime(lecture.startTime).date} • {formatDateTime(lecture.startTime).time}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <span className="w-24 text-gray-500 dark:text-gray-400">Status</span>
                          <span className="capitalize">{lecture.status}</span>
                        </div>
                      </div>
                    </CardContent>
                    {isTeacher && (
                      <div className="p-6 pt-0 flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          onClick={() => handleDeleteLecture(lecture.id)}
                          disabled={isProcessing === `deleting-${lecture.id}`}
                        >
                          {isProcessing === `deleting-${lecture.id}` ? 'Deleting...' : 'Delete'}
                        </Button>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">
                {isTeacher ? 'No past lectures found.' : 'No previous lectures available.'}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default LiveLecturesSection;
