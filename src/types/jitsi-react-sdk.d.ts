declare module '@jitsi/react-sdk' {
  import { ComponentType } from 'react';

  export interface JitsiMeetingProps {
    roomName: string;
    getIFrameRef?: (node: HTMLIFrameElement | null) => void;
    onApiReady?: (externalApi: any) => void;
    configOverwrite?: Record<string, any>;
    interfaceConfigOverwrite?: Record<string, any>;
    userInfo?: {
      displayName?: string;
      email?: string;
    };
    // Add any other props you're using
    [key: string]: any;
  }

  const JitsiMeeting: ComponentType<JitsiMeetingProps>;
  
  export default JitsiMeeting;
}
