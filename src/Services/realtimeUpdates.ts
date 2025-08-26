import { QueryClient, QueryClientProvider, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { client } from './appwrite';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

export { queryClient, QueryClientProvider };

// Hook to subscribe to real-time updates for a collection
export function useRealtimeCollection<T>(
  databaseId: string,
  collectionId: string,
  queryKey: string[],
  queries: any[] = []
) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = `databases.${databaseId}.collections.${collectionId}.documents`;
    
    const unsubscribe = client.subscribe(channel, (response: any) => {
      // Invalidate and refetch the query when we receive an update
      queryClient.invalidateQueries({ queryKey });
    });

    return () => {
      unsubscribe();
    };
  }, [databaseId, collectionId, queryKey, queryClient]);

  // Return the query result
  return useQuery({
    queryKey,
    queryFn: async () => {
      const response = await client.database.listDocuments(databaseId, collectionId, queries);
      return response.documents as T[];
    },
  });
}

// Hook to subscribe to real-time updates for a specific document
export function useRealtimeDocument<T>(
  databaseId: string,
  collectionId: string,
  documentId: string,
  queryKey: string[]
) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = `databases.${databaseId}.collections.${collectionId}.documents.${documentId}`;
    
    const unsubscribe = client.subscribe(channel, (response: any) => {
      // Update the query cache with the new data
      queryClient.setQueryData(queryKey, response.payload);
    });

    return () => {
      unsubscribe();
    };
  }, [databaseId, collectionId, documentId, queryKey, queryClient]);

  // Return the query result
  return useQuery({
    queryKey,
    queryFn: async () => {
      const response = await client.database.getDocument(databaseId, collectionId, documentId);
      return response as T;
    },
  });
}
