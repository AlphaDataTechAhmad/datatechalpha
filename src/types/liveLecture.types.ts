export interface User {
  $id: string;
  name?: string;
  email?: string;
  avatar?: string;
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  timestamp: string;
}

export interface Participant {
  id: string;
  name: string;
  role: 'moderator' | 'participant';
  avatar?: string;
  isAudioMuted?: boolean;
  isVideoMuted?: boolean;
  isModerator?: boolean;
}

export interface LiveLecture {
  $id: string;
  courseId: string;
  title: string;
  description: string;
  scheduledTime: string;
  duration: number;
  isActive: boolean;
  roomName: string;
  status: 'scheduled' | 'live' | 'ended';
  teacherId: string;
  teacherName: string;
  meetingUrl?: string;
  endedAt?: string;
  $createdAt: string;
  $updatedAt: string;
  $permissions?: string[];
  $collectionId?: string;
  $databaseId?: string;
  participants?: Participant[];
  recordingUrl?: string;
  isModerator?: boolean;
}

export interface NewLectureData {
  title: string;
  description: string;
  scheduledTime: string; // ISO string format
  duration: number; // in minutes
}

export interface JitsiConfig {
  roomName: string;
  width?: string;
  height?: string;
  parentNode?: HTMLElement | null;
  jwt?: string;
  configOverwrite: {
    startWithAudioMuted: boolean;
    startWithVideoMuted: boolean;
    disableDeepLinking?: boolean;
    prejoinPageEnabled: boolean;
    enableWelcomePage?: boolean;
    enableLobby?: boolean;
    enableNoAudioDetection?: boolean;
    enableNoisyMicDetection?: boolean;
    disableModeratorIndicator?: boolean;
    startScreenSharing?: boolean;
    enableEmailInStats?: boolean;
    disableRemoteMute?: boolean;
    resolution?: number;
    constraints?: {
      video: {
        height: {
          ideal: number;
          max: number;
          min: number;
        };
      };
    };
    disableSimulcast?: boolean;
    enableLayerSuspension?: boolean;
    testing?: {
      enableLobby: boolean;
      disableLobbyButton: boolean;
      disableLobbyMode: boolean;
      enableLobbyPassword: boolean;
      enableLobbyNotifications: boolean;
      enableLobbyPrejoin: boolean;
    };
    enableMembersOnly?: boolean;
    hideLobbyButton?: boolean;
    hideLobbyScreen?: boolean;
    prejoinConfig?: {
      enabled: boolean;
      hideDisplayName: boolean;
    };
    toolbarButtons?: string[];
  };
  interfaceConfigOverwrite: {
    DISABLE_JOIN_LEAVE_NOTIFICATIONS: boolean;
    SHOW_CHROME_EXTENSION_BANNER: boolean;
    SHOW_JITSI_WATERMARK: boolean;
    SHOW_WATERMARK_FOR_GUESTS: boolean;
    SHOW_BRAND_WATERMARK: boolean;
    SHOW_POWERED_BY: boolean;
    MOBILE_APP_PROMO: boolean;
    HIDE_INVITE_MORE_HEADER: boolean;
    DISABLE_VIDEO_BACKGROUND: boolean;
    HIDE_LOBBY_ACTIONS: boolean;
    HIDE_LOBBY_LEAVE_BUTTON: boolean;
    TOOLBAR_BUTTONS?: string[];
    SETTINGS_SECTIONS?: string[];
  };
  userInfo: {
    displayName: string;
    email: string;
    moderator?: string | boolean;
  };
  onApiReady?: (api: any) => void;
  onReadyToClose?: () => void;
  onParticipantRoleChanged?: (participant: any) => void;
  onLobbyUserJoined?: (data: any) => void;
  onVideoConferenceJoined?: () => void;
  onParticipantJoined?: (participant: any) => void;
  onParticipantLeft?: (participant: any) => void;
  onVideoConferenceLeft?: () => void;
  onMuteStatusChanged?: (data: { muted: boolean }) => void;
  onVideoStatusChanged?: (data: { video: boolean }) => void;
  onError?: (error: Error) => void;
}
