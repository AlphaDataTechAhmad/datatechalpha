// src/components/JitsiMeeting.tsx
import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

interface JitsiMeetingProps {
  roomName: string;
  displayName: string;
  email: string;
  isTeacher: boolean;
  onApiReady?: (api: any) => void;
  onMeetingLeft?: () => void;
  onParticipantJoined?: (participant: any) => void;
  onParticipantLeft?: (participant: any) => void;
}

export const JitsiMeeting = ({
  roomName,
  displayName,
  email,
  isTeacher,
  onApiReady,
  onMeetingLeft,
  onParticipantJoined,
  onParticipantLeft,
}: JitsiMeetingProps) => {
  const apiRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.JitsiMeetExternalAPI) {
      console.error('Jitsi Meet API not loaded');
      return;
    }

    if (!containerRef.current) return;

    const domain = 'meet.jit.si';
    const options = {
      roomName,
      width: '100%',
      height: '100%',
      parentNode: containerRef.current,
      userInfo: {
        displayName,
        email,
      },
      configOverwrite: {
        startWithAudioMuted: !isTeacher,
        startWithVideoMuted: !isTeacher,
        enableWelcomePage: false,
        prejoinPageEnabled: false,
        enableLobbyChat: false,
        enableNoisyMicDetection: false,
        disableRemoteMute: true,
        enableDisplayNameInStats: true,
        enableClosePage: false,
        enableNoAudioDetection: false,
        enableNoisyMicDetection: false,
        prejoinPageEnabled: false,
        requireDisplayName: false,
        startWithAudioMuted: false,
        startWithVideoMuted: false,
        enableWelcomePage: false,
        disableModeratorIndicator: false,
        startAudioOnly: false,
        startAudioMuted: 0,
        startWithAudioMuted: false,
        startWithVideoMuted: false,
        disableProfile: true,
        disableInviteFunctions: true,
        disableRemoteMute: true,
        enableLipSync: false,
        enableNoAudioDetection: false,
        enableNoisyMicDetection: false,
        enableTalkWhileMuted: true,
        enableTcc: false,
        enableUserRolesBasedOnToken: false,
        enableUserRolesInNotifications: false,
        enableLayerSuspension: false,
        startSilent: false,
        testing: {
          disableE2EE: true
        },
        testingCapScreenshareBitrate: 1,
        videoQuality: {
          preferredCodec: 'VP8',
          maxBitratesVideo: {
            low: 200000,
            standard: 500000,
            high: 1500000
          }
        },
        disableDeepLinking: true,
        disableLocalVideoFlip: false,
        disableRtx: false,
        disableRtpStats: false,
        enableIceRestart: false,
        enableRemb: false,
        enableStereoscopic: false,
        enableTcc: false,
        enableUnifiedOnChrome: true,
        forceJVB121Ratio: -1,
        hiddenDomain: 'recorder.meet.jit.si',
        ignoreStartMuted: false,
        p2p: {
          enabled: true,
          stunServers: [
            { urls: 'stun:meet-jit-si-turnrelay.jitsi.net:443' }
          ],
          preferH264: true,
          disableH264: false,
          preferredCodec: 'VP8',
          disableSimulcast: false,
          disabledCodec: 'h264',
          preferredCodecMediaType: 'video',
          disabledCodecMediaType: 'video',
          disableRtx: false
        },
        resolution: 720,
        startBitrate: '800',
        toolbarButtons: [
          'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
          'fodeviceselection', 'hangup', 'profile', 'chat',
          'videoquality', 'filmstrip', 'settings', 'raisehand',
          'tileview', 'help'
        ],
        ...(isTeacher && {
          toolbarButtons: [
            'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
            'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
            'videoquality', 'filmstrip', 'settings', 'raisehand',
            'tileview', 'help', 'security'
          ]
        })
      },
      interfaceConfigOverwrite: {
        APP_NAME: 'EduConnect Live',
        SHOW_JITSI_WATERMARK: false,
        SHOW_WATERMARK_FOR_GUESTS: false,
        DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
        HIDE_LOBBY_BUTTON: true,
        HIDE_WAITING_ROOM_BUTTON: true,
        DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
        DISABLE_PRESENCE_STATUS: true,
        DISABLE_VIDEO_BACKGROUND: true,
        DISABLE_DOMINANT_SPEAKER_INDICATOR: false,
        DISABLE_FOCUS_INDICATOR: false,
        DISABLE_PRESENCE_STATUS: true,
        DISABLE_RINGING: true,
        DISABLE_TRANSCRIPTION_SUBTITLES: true,
        ENABLE_DIAL_OUT: false,
        ENABLE_FEEDBACK_ANIMATION: false,
        FILM_STRIP_MAX_HEIGHT: 120,
        GENERATE_ROOMNAMES_ON_WELCOME_PAGE: false,
        HIDE_INVITE_MORE_HEADER: true,
        INITIAL_TOOLBAR_TIMEOUT: 20000,
        JITSI_WATERMARK_LINK: '',
        LANG_DETECTION: false,
        LOCAL_THUMBNAIL_RATIO: 1,
        MAXIMUM_ZOOMING_COEFFICIENT: 1.3,
        MOBILE_APP_PROMO: false,
        NATIVE_APP_NAME: 'EduConnect',
        OPTIMISTIC_CLEANUP: true,
        RECENT_LIST_ENABLED: false,
        REMOTE_THUMBNAIL_RATIO: 1,
        SETTINGS_SECTIONS: [
          'devices',
          'language',
          'moderator',
          'profile',
          'calendar'
        ],
        SHOW_BRAND_WATERMARK: false,
        SHOW_CHROME_EXTENSION_BANNER: false,
        SHOW_DEEP_LINKING_IMAGE: false,
        SHOW_JITSI_WATERMARK: false,
        SHOW_POWERED_BY: false,
        SHOW_PROMOTIONAL_CLOSE_PAGE: false,
        SHOW_PROMOTIONAL_CLOSE_PAGE_REDIRECT_URL: '',
        SUPPORT_URL: '',
        TOOLBAR_ALWAYS_VISIBLE: true,
        TOOLBAR_BUTTONS: [
          'microphone',
          'camera',
          'closedcaptions',
          'desktop',
          'fullscreen',
          'fodeviceselection',
          'hangup',
          'profile',
          'chat',
          'recording',
          'livestreaming',
          'etherpad',
          'sharedvideo',
          'shareaudio',
          'tileview',
          'videoquality',
          'filmstrip',
          'invite',
          'feedback',
          'stats',
          'shortcuts',
          'tileview',
          'select-background',
          'download',
          'help',
          'mute-everyone',
          'mute-video-everyone',
          'security',
          'toggle-camera',
          'videoquality',
          'whiteboard'
        ],
        TOOLBAR_TIMEOUT: 4000,
        VERTICAL_FILMSTRIP: false,
        VIDEO_LAYOUT_FIT: 'both',
        VIDEO_QUALITY_LABEL_DISABLED: false,
        DISABLE_VIDEO_QUALITY_LABEL: false,
        LOCAL_THUMBNAIL_RATIO: 16 / 9,
        REMOTE_THUMBNAIL_RATIO: 1,
        VIDEO_QUALITY_LABEL_DISABLED: false,
        DISABLE_VIDEO_QUALITY_LABEL: false,
      },
    };

    try {
      const api = new window.JitsiMeetExternalAPI(domain, options);
      apiRef.current = api;

      api.addEventListeners({
        videoConferenceJoined: () => {
          console.log('Joined meeting as', displayName);
          if (isTeacher) {
            api.executeCommand('displayName', 'Teacher');
          }
          onApiReady?.(api);
        },
        videoConferenceLeft: () => {
          console.log('Left the meeting');
          onMeetingLeft?.();
        },
        participantJoined: (event: any) => {
          console.log('Participant joined:', event.displayName);
          onParticipantJoined?.(event);
        },
        participantLeft: (event: any) => {
          console.log('Participant left:', event.displayName);
          onParticipantLeft?.(event);
        },
      });

      return () => {
        try {
          api?.dispose();
        } catch (error) {
          console.error('Error disposing Jitsi API:', error);
        }
      };
    } catch (error) {
      console.error('Failed to load Jitsi API', error);
    }
  }, [roomName, displayName, email, isTeacher, onApiReady, onMeetingLeft, onParticipantJoined, onParticipantLeft]);

  return (
    <div 
      ref={containerRef} 
      style={{ 
        width: '100%', 
        height: '100%',
        minHeight: '600px',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px',
        overflow: 'hidden'
      }} 
    />
  );
};