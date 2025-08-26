import { useState, useEffect } from 'react';
import { databases } from '../appwrite/config';
import { Query } from 'appwrite';

export interface Internship {
  $id: string;
  title: string;
  company: string;
  description: string;
  requirements: string[];
  duration: string;
  location: string;
  isRemote: boolean;
  stipend: string;
  deadline: string;
  startDate: string;
  skills: string[];
  applicants?: number;
  status?: 'open' | 'closed' | 'upcoming';
  createdAt: string;
  updatedAt: string;
}

export const useInternships = () => {
  const [internships, setInternships] = useState<Internship[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInternships = async () => {
      try {
        setLoading(true);
        const response = await databases.listDocuments(
          'YOUR_DATABASE_ID', // Replace with your database ID
          'YOUR_COLLECTION_ID', // Replace with your collection ID
          [
            Query.orderDesc('$createdAt'),
            Query.limit(50)
          ]
        );
        setInternships(response.documents as unknown as Internship[]);
      } catch (err) {
        console.error('Error fetching internships:', err);
        setError('Failed to load internships. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchInternships();
  }, []);

  return { internships, loading, error };
};

export default useInternships;
