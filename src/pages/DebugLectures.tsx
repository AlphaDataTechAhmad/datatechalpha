import React, { useEffect, useState } from 'react';
import { databases } from '../Services/appwrite';
import { toast } from 'sonner';

interface Lecture {
  $id: string;
  title: string;
  meetingUrl: string;
  status: string;
  $createdAt: string;
  $updatedAt: string;
}

const DebugLectures: React.FC = () => {
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLectures = async () => {
      try {
        setLoading(true);
        // Use environment variables with fallbacks
        const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID || '68261b6a002ba6c3b584';
        const LECTURES_COLLECTION_ID = import.meta.env.VITE_APPWRITE_LIVE_LECTURES_COLLECTION_ID || 'liveLectures';
        
        const response = await databases.listDocuments(DATABASE_ID, LECTURES_COLLECTION_ID);
        setLectures(response.documents as unknown as Lecture[]);
      } catch (error) {
        console.error('Error fetching lectures:', error);
        toast.error('Failed to load lectures');
      } finally {
        setLoading(false);
      }
    };

    fetchLectures();
  }, []);

  const updateToGoogleMeet = async (lectureId: string) => {
    try {
      const meetId = `${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 6)}`;
      const newUrl = `https://meet.google.com/${meetId}`;
      
      await databases.updateDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID || '68261b6a002ba6c3b584',
        import.meta.env.VITE_APPWRITE_LIVE_LECTURES_COLLECTION_ID || 'liveLectures',
        lectureId,
        { meetingUrl: newUrl }
      );
      
      toast.success('Updated to Google Meet URL');
      
      // Update the local state
      setLectures(prev => prev.map(lecture => 
        lecture.$id === lectureId ? { ...lecture, meetingUrl: newUrl } : lecture
      ));
    } catch (error) {
      console.error('Error updating lecture:', error);
      toast.error('Failed to update lecture');
    }
  };

  if (loading) {
    return <div className="p-4">Loading lectures...</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Debug Lectures</h1>
      <div className="space-y-4">
        {lectures.map((lecture) => (
          <div key={lecture.$id} className="p-4 border rounded-lg">
            <h2 className="text-lg font-semibold">{lecture.title}</h2>
            <div className="mt-2">
              <p><span className="font-medium">Status:</span> {lecture.status}</p>
              <p><span className="font-medium">URL:</span> 
                <a 
                  href={lecture.meetingUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {lecture.meetingUrl}
                </a>
                {lecture.meetingUrl?.includes('meet.jit.si') && (
                  <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                    Jitsi URL
                  </span>
                )}
              </p>
              <p><span className="font-medium">Created:</span> {new Date(lecture.$createdAt).toLocaleString()}</p>
              <p><span className="font-medium">Updated:</span> {new Date(lecture.$updatedAt).toLocaleString()}</p>
              
              {lecture.meetingUrl?.includes('meet.jit.si') && (
                <button
                  onClick={() => updateToGoogleMeet(lecture.$id)}
                  className="mt-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                >
                  Convert to Google Meet
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DebugLectures;
