import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';

// Type declarations for Jitsi Meet External API
declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

// Simplified interface for the Jitsi Meet API methods we'll use
interface JitsiMeetAPI {
  executeCommand: (command: string, ...args: any[]) => void;
  addEventListener: (event: string, listener: (...args: any[]) => void) => void;
  removeEventListener: (event: string, listener: (...args: any[]) => void) => void;
  dispose: () => void;
  isAudioMuted: () => boolean;
  isVideoMuted: () => boolean;
  getDisplayName: () => string;
  getParticipantsInfo: () => any[];
}

// Interface for component props
interface TeacherMeetProps {
  isTeacher: boolean;
  roomName: string;
  onMeetingEnd: () => void;
}

const TeacherMeet: React.FC<TeacherMeetProps> = ({ isTeacher, roomName, onMeetingEnd }) => {
  const { user } = useAuth();
  const jitsiContainerId = `jitsi-container-${Date.now()}`;
  const jitsiRef = useRef<JitsiMeetAPI | null>(null);
  const isMountedRef = useRef(true);
  const domain = 'meet.jit.si';

  // Generate a random room name if not provided
  const generateRoomName = useCallback((): string => {
    return `teacher-meet-${Math.random().toString(36).substring(2, 15)}`;
  }, []);

  // Clean the room name to remove any lobby or special suffixes
  const cleanRoomName = useCallback((name: string): string => {
    // Remove everything after @ to prevent lobby mode
    const cleanName = name.split('@')[0];
    // Remove any non-alphanumeric characters except hyphens
    return cleanName.replace(/[^a-zA-Z0-9-]/g, '');
  }, []);

  // Memoize the room name to prevent unnecessary regenerations
  const roomNameToUse = useMemo(() => {
    const name = roomName || generateRoomName();
    const cleaned = cleanRoomName(name);
    console.log('Using room name:', { original: name, cleaned });
    return cleaned;
  }, [roomName, generateRoomName, cleanRoomName]);

  // Load Jitsi script dynamically
  const loadJitsiScript = useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (window.JitsiMeetExternalAPI) {
        return resolve();
      }
      
      const script = document.createElement('script');
      script.src = 'https://meet.jit.si/external_api.js';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Jitsi script'));
      document.body.appendChild(script);
    });
  }, []);

  // Initialize Jitsi when component mounts
  useEffect(() => {
    if (!user) return;

    isMountedRef.current = true;
    const container = document.getElementById(jitsiContainerId);
    
    if (!container) {
      console.error('Failed to find Jitsi container');
      return;
    }

    // Initialize and start the Jitsi meeting
    const startMeeting = async (): Promise<void> => {
      try {
        await loadJitsiScript();
        if (!isMountedRef.current) return;

        const displayName = user?.name || (isTeacher ? 'Teacher' : 'Student');
        const email = user?.email || '';

        // Basic user info
        const userInfo = {
          displayName,
          email
        };

        // Clean room name to remove any lobby suffix
        const cleanRoomName = roomNameToUse.replace(/@.*$/, '');
        
        // Create a div element for Jitsi to mount into
        const jitsiContainer = document.createElement('div');
        jitsiContainer.style.width = '100%';
        jitsiContainer.style.height = '100%';
        
        // Clear the container and append our new div
        if (container) {
          container.innerHTML = '';
          container.appendChild(jitsiContainer);
        }
        
        // Create simplified options for Jitsi Meet
        const options = {
          roomName: cleanRoomName,
          width: '100%',
          height: '100%',
          parentNode: jitsiContainer as HTMLElement,
          userInfo: userInfo,
          configOverwrite: {
            // Disable all lobby and waiting room features
            enableLobbyChat: false,
            enableClosePage: false,
            disableInviteFunctions: true,
            enableWelcomePage: false,
            prejoinPageEnabled: false,
            requireDisplayName: true,
            
            // Audio/Video settings
            startWithAudioMuted: !isTeacher,
            startWithVideoMuted: !isTeacher,
            enableNoAudioDetection: false,
            enableNoisyMicDetection: false,
            
            // Disable all lobby and waiting room features
            enableLobby: false,
            enableWaitingRoom: false,
            enableMembersOnly: false,
            
            // Disable pre-join page and related features
            prejoinConfig: {
              enabled: false
            },
            
            // Disable all moderation and waiting room features
            enableUserRolesBasedOnToken: false,
            enableUserRolesInNotifications: false,
            disableModeratorIndicator: true,
            disableRemoteMute: true,
            disableInviteFunctions: true,
            
            // Disable all lobby and waiting room related features
            testing: {
              // Force disable lobby
              disableLobby: true,
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
            
            // Disable all features that might trigger a waiting state
            features: {
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
              'lobby-welcome': false,
              // Keep other features enabled
              'screen-sharing': true,
              'recording': true,
              'moderation': true
            },
            
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
              
              // Enable all moderator features
              features: {
                'screen-sharing': true,
                'recording': true,
                'moderation': true
              },
              
              // Teacher specific settings
              startWithAudioMuted: false,
              startWithVideoMuted: false,
              toolbarButtons: [
                'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
                'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
                'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
                'videoquality', 'filmstrip', 'shortcuts', 'tileview', 'select-background',
                'mute-everyone', 'security', 'toggle-camera'
              ]
            } : {})
          }
        };

        console.log('Initializing Jitsi with options:', options);
        jitsiRef.current = new window.JitsiMeetExternalAPI(domain, options);
        
        // Handle Jitsi events
        if (jitsiRef.current) {
          // Handle conference join
          jitsiRef.current.addEventListener('videoConferenceJoined', () => {
            console.log('Participant joined the conference');
            
            // Basic room setup for all participants
            try {
              jitsiRef.current?.executeCommand('setTileView', false);
              jitsiRef.current?.executeCommand('subject', `${cleanRoomName}`);
              console.log('Joined the meeting room');
            } catch (error) {
              console.error('Error during room setup:', error);
            }
          });
          
          // Handle conference join failure
          jitsiRef.current.addEventListener('conferenceFailed', (error: any) => {
            console.error('Conference failed:', error);
            if (error?.error === 'conference.connectionError.membersOnly' || 
                error?.error === 'conference.connectionError.lobby') {
              console.log('Members-only or lobby error detected, attempting to rejoin...');
              // Clean up and reinitialize
              if (jitsiRef.current) {
                jitsiRef.current.dispose();
                jitsiRef.current = null;
              }
              // Force a fresh start with a clean state
              setTimeout(() => {
                const container = document.getElementById(jitsiContainerId);
                if (container) {
                  // Clear any existing content
                  container.innerHTML = '';
                  // Create a new container with a unique ID
                  const newContainerId = `jitsi-container-${Date.now()}`;
                  container.id = newContainerId;
                  // Restart the meeting
                  startMeeting();
                }
              }, 1500);
            }
          });

          // Handle participant role changes (simplified)
          jitsiRef.current.addEventListener('participantRoleChanged', (event: any) => {
            console.log('Participant role changed:', event);
          });

          // Handle conference left
          jitsiRef.current.addEventListener('videoConferenceLeft', () => {
            console.log('Left conference');
            onMeetingEnd();
          });

          // Handle errors
          jitsiRef.current.addEventListener('error', (error: any) => {
            console.error('Jitsi error:', error);
          });
        }
      } catch (error) {
        console.error('Error initializing Jitsi:', error);
        // Try to clean up if possible
        if (jitsiRef.current) {
          jitsiRef.current.dispose();
          jitsiRef.current = null;
        }
        // Show error to user
        alert('Failed to start the meeting. Please try again.');
      }
    };

    // Start the meeting
    startMeeting();

    // Cleanup on unmount
    return () => {
      isMountedRef.current = false;
      if (jitsiRef.current) {
        jitsiRef.current.dispose();
        jitsiRef.current = null;
      }
    };
  }, [user, isTeacher, onMeetingEnd, jitsiContainerId, loadJitsiScript, roomNameToUse]);

  return (
    <div
      id={jitsiContainerId}
      style={{
        width: '100%',
        height: 'calc(100vh - 64px)',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px',
        border: '1px solid #ddd'
      }}
    />
  );
};

export default TeacherMeet;
