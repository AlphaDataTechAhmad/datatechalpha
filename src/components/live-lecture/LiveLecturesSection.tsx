import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ID, Query } from 'appwrite';
import { databases, DATABASE_ID, LIVE_LECTURES_COLLECTION_ID } from '../../lib/appwrite';
import { LiveLecture, NewLectureData, ChatMessage, User } from '../../types/liveLecture.types';

// Import UI components
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';

// Import sub-components
import { CreateLectureModal } from './CreateLectureModal';
import { LectureList } from './LectureList';
import { ActiveLectureView } from './ActiveLectureView';

// JitsiMeet types
declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

interface LiveLecturesSectionProps {
  currentUser: User;
}

export const LiveLecturesSection: React.FC<LiveLecturesSectionProps> = ({ currentUser }) => {
  const { courseId } = useParams<{ courseId: string }>();
  
  // State
  const [lectures, setLectures] = useState<LiveLecture[]>([]);
  const [activeLecture, setActiveLecture] = useState<LiveLecture | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingLecture, setIsCreatingLecture] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isJitsiLoading, setIsJitsiLoading] = useState(false);

  // Fetch lectures from Appwrite
  const fetchLectures = useCallback(async () => {
    if (!courseId) return;
    
    try {
      setIsLoading(true);
      const response = await databases.listDocuments(
        DATABASE_ID,
        LIVE_LECTURES_COLLECTION_ID,
        [
          Query.equal('courseId', courseId),
          Query.orderDesc('scheduledTime')
        ]
      );
      setLectures(response.documents as unknown as LiveLecture[]);
    } catch (error) {
      console.error('Error fetching lectures:', error);
      toast.error('Failed to load lectures');
    } finally {
      setIsLoading(false);
    }
  }, [courseId]);

  // Effect to fetch lectures on component mount
  useEffect(() => {
    fetchLectures();
  }, [fetchLectures]);

  // Handle creating a new lecture
  const handleCreateLecture = async (data: NewLectureData) => {
    if (!courseId) return;

    try {
      const roomName = `lecture-${Date.now()}`.toLowerCase().replace(/[^a-z0-9-]/g, '');
      
      const lectureData = {
        ...data,
        courseId,
        isActive: true,
        roomName,
        status: 'scheduled' as const,
        teacherId: currentUser.$id,
        teacherName: currentUser.name || 'Teacher',
        $permissions: [`user:${currentUser.$id}`, 'role:member'],
      };

      await databases.createDocument(
        DATABASE_ID,
        LIVE_LECTURES_COLLECTION_ID,
        ID.unique(),
        lectureData
      );

      toast.success('Lecture scheduled successfully');
      setIsCreatingLecture(false);
      fetchLectures();
    } catch (error) {
      console.error('Error creating lecture:', error);
      toast.error('Failed to schedule lecture');
    }
  };

  // Update lecture status
  const updateLectureStatus = async (lectureId: string, status: 'scheduled' | 'live' | 'ended') => {
    try {
      const data: Partial<LiveLecture> = { status };
      
      if (status === 'ended') {
        data.endedAt = new Date().toISOString();
        data.isActive = false;
      } else if (status === 'live') {
        data.isActive = true;
      }

      await databases.updateDocument(
        DATABASE_ID,
        LIVE_LECTURES_COLLECTION_ID,
        lectureId,
        data
      );

      // Update local state
      setLectures(prev => prev.map(lecture => 
        lecture.$id === lectureId ? { ...lecture, ...data } : lecture
      ));

      if (activeLecture?.$id === lectureId) {
        setActiveLecture(prev => prev ? { ...prev, ...data } : null);
      }
    } catch (error) {
      console.error('Error updating lecture status:', error);
      toast.error('Failed to update lecture status');
    }
  };

  // Handle joining a lecture
  const handleJoinLecture = (lecture: LiveLecture) => {
    if (lecture.status === 'ended') {
      toast.error('This lecture has already ended');
      return;
    }
    setActiveLecture(lecture);
    setShowChat(true);
  };

  // Handle ending a lecture
  const handleEndLecture = async (lectureId: string) => {
    if (!confirm('Are you sure you want to end this lecture? This action cannot be undone.')) {
      return;
    }
    
    try {
      await updateLectureStatus(lectureId, 'ended');
      setActiveLecture(null);
      setShowChat(false);
      toast.success('Lecture ended successfully');
    } catch (error) {
      console.error('Error ending lecture:', error);
      toast.error('Failed to end lecture');
    }
  };

  // Handle sending a chat message
  const handleSendMessage = (content: string) => {
    if (!content.trim() || !activeLecture) return;
    
    const message: ChatMessage = {
      id: Date.now().toString(),
      userId: currentUser.$id,
      userName: currentUser.name || 'User',
      userAvatar: currentUser.avatar || '',
      content,
      timestamp: new Date().toISOString(),
    };
    
    setChatMessages(prev => [...prev, message]);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Live Lectures</h2>
        <Button onClick={() => setIsCreatingLecture(true)}>
          Schedule New Lecture
        </Button>
      </div>

      {/* Create Lecture Modal */}
      <CreateLectureModal
        isOpen={isCreatingLecture}
        onClose={() => setIsCreatingLecture(false)}
        onSubmit={handleCreateLecture}
      />

      {/* Active Lecture View */}
      {activeLecture ? (
        <ActiveLectureView
          lecture={activeLecture}
          currentUser={currentUser}
          showChat={showChat}
          chatMessages={chatMessages}
          isJitsiLoading={isJitsiLoading}
          onEndLecture={handleEndLecture}
          onClose={() => {
            setActiveLecture(null);
            setShowChat(false);
          }}
          onToggleChat={() => setShowChat(!showChat)}
          onSendMessage={handleSendMessage}
        />
      ) : (
        <LectureList 
          lectures={lectures} 
          currentUser={currentUser} 
          onJoinLecture={handleJoinLecture} 
        />
      )}
    </div>
  );
};
