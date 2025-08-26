import { useEffect, useCallback } from 'react';
import { client } from '@/Services/appwrite';

type Callback = (payload: any) => void;

const useRealtimeUpdates = (channels: string | string[], callback: Callback) => {
  useEffect(() => {
    const channelArray = Array.isArray(channels) ? channels : [channels];
    
    // Subscribe to each channel
    const unsubscribes = channelArray.map(channel => 
      client.subscribe(channel, callback)
    );
    
    // Cleanup function to unsubscribe
    return () => {
      unsubscribes.forEach(unsubscribe => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      });
    };
  }, [channels, callback]);
};

export default useRealtimeUpdates;
