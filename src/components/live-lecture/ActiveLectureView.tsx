import React, { useState, useRef, useEffect, FormEvent } from 'react';
import type { LiveLecture, ChatMessage, User } from '../../types/liveLecture.types';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Copy, Check, Video } from 'lucide-react';
import { toast } from 'sonner';
import { JitsiMeeting } from '@jitsi/react-sdk';
import type { IJitsiMeetExternalApi } from '@jitsi/react-sdk/dist/types';

type JitsiApi = IJitsiMeetExternalApi & {
  dispose: () => void;
};

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

interface ActiveLectureViewProps {
  lecture: LiveLecture & {
    $id: string;
    title?: string;
    status: 'scheduled' | 'live' | 'ended';
    meetingUrl?: string;
  };
  currentUser: User & {
    name?: string;
    email?: string;
  };
  showChat: boolean;
  chatMessages: ChatMessage[];
  onEndLecture?: (lectureId: string) => void;
  onClose: () => void;
  onToggleChat: () => void;
  onSendMessage?: (content: string) => void;
  className?: string;
}

export const ActiveLectureView: React.FC<ActiveLectureViewProps> = ({
  lecture,
  currentUser,
  showChat,
  chatMessages,
  onEndLecture,
  onClose,
  onToggleChat,
  onSendMessage,
  className,
}) => {
  const [message, setMessage] = useState('');
  const [isLinkCopied, setIsLinkCopied] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isMeetingStarted, setIsMeetingStarted] = useState(false);
  const [chatMessagesState, setChatMessagesState] = useState<ChatMessage[]>([]);
  const [jitsiApi, setJitsiApi] = useState<JitsiApi | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const copyMeetingLink = async (): Promise<void> => {
    if (!lecture.$id || !lecture.title) return;
    
    const roomName = `${lecture.$id}-${lecture.title.replace(/\s+/g, '-').toLowerCase()}`;
    const meetingUrl = `${window.location.origin}/live-lecture/${lecture.$id}`;
    
    try {
      await navigator.clipboard.writeText(meetingUrl);
      setIsLinkCopied(true);
      toast.success('Meeting link copied to clipboard');
      
      setTimeout(() => {
        setIsLinkCopied(false);
      }, 3000);
    } catch (error) {
      console.error('Failed to copy meeting link:', error);
      toast.error('Failed to copy meeting link');
    }
  };

  const handleJitsiIFrameRef = (parentNode: HTMLDivElement | null): void => {
    if (parentNode) {
      const iframe = parentNode.querySelector('iframe');
      if (iframe) {
        iframe.style.border = 'none';
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.minHeight = '500px';
      }
    }
  };

  const handleReadyToClose = (): void => {
    try {
      if (jitsiApi) {
        jitsiApi.dispose();
        setJitsiApi(null);
      }
    } catch (error) {
      console.error('Error disposing Jitsi API:', error);
    } finally {
      setIsMeetingStarted(false);
      setIsJoining(false);
    }
  };

  const handleJoinMeeting = (): void => {
    setIsJoining(true);
  };

  const handleSendMessage = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (message.trim() && onSendMessage) {
      onSendMessage(message);
      setMessage('');
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    }
  };

  const handleApiReady = (api: IJitsiMeetExternalApi): void => {
    const jitsiApiExtended = {
      ...api,
      dispose: () => {
        api.removeAllListeners();
        console.log('Jitsi meeting disposed');
      }
    } as JitsiApi;

    setJitsiApi(jitsiApiExtended);
    
    // Set moderator role if user is the teacher
    if (currentUser.$id === lecture.teacherId) {
      // Set moderator password immediately
      jitsiApiExtended.executeCommand('password', 'moderator');
      
      // Set display name with (Host) suffix
      jitsiApiExtended.executeCommand('displayName', `${currentUser.name || 'Host'} (Host)`);
      
      // Grant moderator role to self
      jitsiApiExtended.executeCommand('setVideoQuality', 720);
      
      // Set up moderator controls
      jitsiApiExtended.on('participantRoleChanged', (participant: any) => {
        console.log('Participant role changed:', participant);
        if (participant.role === 'moderator') {
          jitsiApiExtended.executeCommand('grantModerator', participant.id);
        }
      });
      
      // Auto-admit from lobby if enabled
      jitsiApiExtended.on('lobby.userJoined', (data: any) => {
        console.log('User joined lobby:', data);
        jitsiApiExtended.executeCommand('admitLobby', data.id);
      });
      
      // Mute all participants by default when joining
      jitsiApiExtended.on('participantJoined', (participant: any) => {
        if (participant.id !== jitsiApiExtended.getMyUserId()) {
          jitsiApiExtended.executeCommand('muteParticipant', participant.id, 'audio');
          jitsiApiExtended.executeCommand('muteParticipant', participant.id, 'video');
        }
      });
    }
    
    // Handle video conference events
    jitsiApiExtended.on('videoConferenceJoined', () => {
      console.log('Video conference joined');
      
      if (currentUser.$id === lecture.teacherId) {
        // Set moderator password again to ensure it's applied
        jitsiApiExtended.executeCommand('password', 'moderator');
        
        // Mute all participants except self
        const participants = jitsiApiExtended.getParticipantsInfo();
        participants.forEach((participant: any) => {
          if (participant.participantId !== jitsiApiExtended.getMyUserId()) {
            jitsiApiExtended.executeCommand('muteParticipant', participant.participantId, 'audio');
            jitsiApiExtended.executeCommand('muteParticipant', participant.participantId, 'video');
          }
        });
        
        // Unmute self
        jitsiApiExtended.executeCommand('toggleAudio');
        jitsiApiExtended.executeCommand('toggleVideo');
      }
    });
    
    // Set up other event listeners
    jitsiApiExtended.on('authStatusChanged', (authStatus: string) => {
      console.log('Auth status changed:', authStatus);
    });

    jitsiApiExtended.on('lobby.userLeft', (data: any) => {
      console.log('User left lobby:', data);
    });

    jitsiApiExtended.on('authFailed', (error: any) => {
      console.error('Authentication failed:', error);
      toast.error('Authentication failed. Please check your credentials.');
    });

    jitsiApiExtended.on('error.membersOnly', () => {
      toast.error('This is a members-only meeting. Please wait for the host to let you in.');
    });

    // Set up error handling
    jitsiApiExtended.addEventListeners({
      error: (error: Error) => {
        console.error('Jitsi meeting error:', error);
        toast.error('Failed to start the meeting. Please try again.');
        setIsJoining(false);
        setIsMeetingStarted(false);
      },
      readyToClose: handleReadyToClose,
    });
    
    setIsMeetingStarted(true);
  };

  useEffect(() => {
    setChatMessagesState(chatMessages);
  }, [chatMessages]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessagesState]);

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-lg shadow-md overflow-hidden ${className || ''}`}>
      <div className="p-4 border-b dark:border-gray-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">{lecture.title}</h3>
          {lecture.description && (
            <p className="text-sm text-gray-600 dark:text-gray-300 truncate">{lecture.description}</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleChat}
            className="flex-1 md:flex-none"
          >
            {showChat ? 'Hide Chat' : 'Show Chat'}
          </Button>
          {currentUser.$id === lecture.teacherId && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onEndLecture?.(lecture.$id)}
              className="flex-1 md:flex-none"
            >
              End Lecture
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="flex-1 md:flex-none"
          >
            Close
          </Button>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row h-[calc(100vh-200px)]">
        {/* Jitsi Meet Section */}
        <div className={`${showChat ? 'md:w-2/3' : 'w-full'} p-6 flex flex-col bg-gray-50 dark:bg-gray-800`}>
          <div className="bg-white dark:bg-gray-700 rounded-lg shadow-md overflow-hidden flex-1">
            {isMeetingStarted ? (
              <div className="h-full w-full">
                <JitsiMeeting
                  roomName={`${lecture.$id}-${lecture.title?.replace(/\s+/g, '-').toLowerCase()}`}
                  configOverwrite={{
                    startWithAudioMuted: currentUser.$id !== lecture.teacherId,
                    startWithVideoMuted: currentUser.$id !== lecture.teacherId,
                    prejoinPageEnabled: true,
                    enableWelcomePage: false,
                    enableLobby: false,
                    enableNoAudioDetection: true,
                    enableNoisyMicDetection: true,
                    disableModeratorIndicator: false,
                    startScreenSharing: currentUser.$id === lecture.teacherId,
                    enableEmailInStats: false,
                    disableRemoteMute: currentUser.$id === lecture.teacherId,
                    resolution: 720,
                    constraints: {
                      video: {
                        height: {
                          ideal: 720,
                          max: 720,
                          min: 240
                        }
                      }
                    },
                    disableSimulcast: false,
                    enableLayerSuspension: true,
                    testing: {
                      enableLobby: false,
                      disableLobbyButton: false,
                      disableLobbyMode: false,
                      enableLobbyPassword: false,
                      enableLobbyNotifications: true,
                      enableLobbyPrejoin: true
                    },
                    enableMembersOnly: false,
                    hideLobbyButton: true,
                    hideLobbyScreen: true,
                    prejoinConfig: {
                      enabled: true,
                      hideDisplayName: false
                    },
                    toolbarButtons: currentUser.$id === lecture.teacherId ? [
                      'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
                      'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
                      'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
                      'videoquality', 'filmstrip', 'invite', 'feedback', 'stats', 'shortcuts',
                      'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone',
                      'mute-video-everyone', 'security', 'select-background', 'shareaudio',
                      'noisesuppression', 'whiteboard', 'sip'
                    ] : [
                      'microphone', 'camera', 'hangup', 'chat', 'raisehand',
                      'tileview', 'settings', 'fullscreen', 'select-background'
                    ]
                  }}
                  interfaceConfigOverwrite={{
                    DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
                    SHOW_CHROME_EXTENSION_BANNER: false,
                    SHOW_JITSI_WATERMARK: false,
                    SHOW_WATERMARK_FOR_GUESTS: false,
                    SHOW_BRAND_WATERMARK: false,
                    SHOW_POWERED_BY: false,
                    MOBILE_APP_PROMO: false,
                    HIDE_INVITE_MORE_HEADER: true,
                    DISABLE_VIDEO_BACKGROUND: true,
                    HIDE_LOBBY_ACTIONS: true,
                    HIDE_LOBBY_LEAVE_BUTTON: true,
                    TOOLBAR_BUTTONS: currentUser.$id === lecture.teacherId ? [
                      'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
                      'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
                      'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
                      'videoquality', 'filmstrip', 'invite', 'feedback', 'stats', 'shortcuts',
                      'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone',
                      'mute-video-everyone', 'security', 'select-background', 'shareaudio',
                      'noisesuppression', 'whiteboard', 'sip'
                    ] : [
                      'microphone', 'camera', 'hangup', 'chat', 'raisehand',
                      'tileview', 'settings', 'fullscreen', 'select-background'
                    ],
                    SETTINGS_SECTIONS: [
                      'devices', 'language', 'moderator', 'profile', 'calendar', 'sounds'
                    ]
                  }}
                  onApiReady={handleApiReady}
                  getIFrameRef={handleJitsiIFrameRef}
                  userInfo={{
                    displayName: currentUser.$id === lecture.teacherId 
                      ? `${currentUser.name} (Host)` 
                      : currentUser.name || 'Participant',
                    email: currentUser.email || '',
                    moderator: currentUser.$id === lecture.teacherId ? 'true' : 'false'
                  }}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="mx-auto w-24 h-24 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-6">
                  <Video className="w-12 h-12 text-blue-600 dark:text-blue-300" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3 text-center">
                  {lecture.status === 'live' ? 'Lecture in Progress' : 'Ready to start the lecture?'}
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-md mx-auto text-base md:text-lg text-center">
                  {lecture.status === 'live' 
                    ? 'Join the video conference to participate in the lecture.'
                    : 'Start a video conference for your lecture. Students will be able to join once you start the session.'}
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    onClick={() => {
                      setIsMeetingStarted(true);
                      handleJoinMeeting();
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg"
                    size="lg"
                    disabled={isJoining}
                  >
                    <Video className="mr-2 h-5 w-5" />
                    {isJoining ? 'Joining...' : lecture.status === 'live' ? 'Join Meeting' : 'Start Video Meeting'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => copyMeetingLink()}
                    className="px-8 py-6 text-lg"
                    disabled={isJoining}
                  >
                    {isLinkCopied ? (
                      <>
                        <Check className="w-5 h-5 mr-2 text-green-500" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-5 h-5 mr-2" />
                        Copy Invite Link
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
        {/* Chat Section */}
        {showChat && (
          <div className="w-full md:w-1/3 border-l dark:border-gray-800 flex flex-col h-[500px] md:h-auto">
            <div className="p-3 border-b font-medium flex justify-between items-center">
              <span>Chat</span>
              <button 
                onClick={onToggleChat}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                aria-label="Hide chat"
                type="button"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <div 
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-4"
            >
              {chatMessages.map((msg, index) => (
                <div 
                  key={`${msg.senderId}-${msg.timestamp}-${index}`} 
                  className={`flex ${msg.senderId === currentUser?.$id ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      msg.senderId === currentUser?.$id 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                    }`}
                  >
                    <div className="font-medium text-sm">
                      {msg.senderId === currentUser?.$id ? 'You' : msg.senderName}
                    </div>
                    <div className="text-sm">{msg.content}</div>
                    <div className="text-xs opacity-75 mt-1">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 border-t dark:border-gray-700">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <Input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1"
                />
                <Button type="submit" size="sm">
                  Send
                </Button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};