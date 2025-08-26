import { client } from './appwrite';
import { RealtimeResponseEvent } from 'appwrite';

type Subscription = (payload: RealtimeResponseEvent<any>) => void;

type UnsubscribeFunction = () => void;

const subscriptions: Record<string, Subscription[]> = {};
const unsubscribeCallbacks: Record<string, UnsubscribeFunction> = {};

// Subscribe to real-time updates for a specific channel
export const subscribe = (channels: string | string[], callback: Subscription): UnsubscribeFunction => {
  const channelArray = Array.isArray(channels) ? channels : [channels];
  const unsubscribeFunctions: UnsubscribeFunction[] = [];
  
  channelArray.forEach(channel => {
    // Initialize channel subscriptions array if it doesn't exist
    if (!subscriptions[channel]) {
      subscriptions[channel] = [];
    }
    
    // Add callback to channel's subscribers
    subscriptions[channel].push(callback);
    
    // Subscribe to Appwrite's real-time updates if not already subscribed
    if (!unsubscribeCallbacks[channel]) {
      const unsubscribe = client.subscribe(channel, (response: RealtimeResponseEvent<any>) => {
        // Notify all subscribers for this channel
        subscriptions[channel]?.forEach(sub => sub(response));
      });
      unsubscribeCallbacks[channel] = unsubscribe;
    }
    
    // Create unsubscribe function for this specific callback
    const unsubscribe = () => {
      if (subscriptions[channel]) {
        subscriptions[channel] = subscriptions[channel].filter(sub => sub !== callback);
        
        // If no more subscribers, clean up the Appwrite subscription
        if (subscriptions[channel].length === 0) {
          const unsubscribeFn = unsubscribeCallbacks[channel];
          if (unsubscribeFn) {
            unsubscribeFn();
            delete unsubscribeCallbacks[channel];
          }
          delete subscriptions[channel];
        }
      }
    };
    
    unsubscribeFunctions.push(unsubscribe);
  });
  
  // Return a function to unsubscribe all channels
  return () => {
    unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
  };
};

// Helper function to get real-time channel for a specific document
export const getDocumentChannel = (databaseId: string, collectionId: string, documentId: string): string => {
  return `databases.${databaseId}.collections.${collectionId}.documents.${documentId}`;
};

// Helper function to get real-time channel for a collection
export const getCollectionChannel = (databaseId: string, collectionId: string): string => {
  return `databases.${databaseId}.collections.${collectionId}.documents`;
};
