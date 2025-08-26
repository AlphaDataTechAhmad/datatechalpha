import { useEffect, useState } from 'react';
import { listCollections } from '@/utils/listCollections';
import { Collection } from '@/utils/listCollections';

export const ListCollections = () => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const cols = await listCollections();
        setCollections(cols);
      } catch (err) {
        console.error(err);
        setError('Failed to load collections');
      } finally {
        setLoading(false);
      }
    };

    fetchCollections();
  }, []);

  if (loading) return <div>Loading collections...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Available Collections</h2>
      <div className="space-y-2">
        {collections.length > 0 ? (
          collections.map((collection) => (
            <div key={collection.$id} className="p-3 border rounded bg-gray-50 dark:bg-gray-800">
              <p className="font-mono">ID: {collection.$id}</p>
              <p>Name: {collection.name}</p>
              <p className="text-sm text-gray-500">
                Created: {new Date(collection.$createdAt).toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">
                Permissions: {JSON.stringify(collection.$permissions || [])}
              </p>
            </div>
          ))
        ) : (
          <p className="text-gray-500">No collections found</p>
        )}
      </div>
    </div>
  );
};
