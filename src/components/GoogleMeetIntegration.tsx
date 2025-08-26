// In GoogleMeetIntegration.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Loader2, AlertCircle, Video, Link as LinkIcon, Copy, Check } from 'lucide-react';
import { databases } from '../Services/appwrite';
import { ID } from 'appwrite';
import { toast } from 'sonner';

interface GoogleMeetIntegrationProps {
  lecture: {
    $id: string;
    title: string;
    courseId: string;
    meetingLink?: string;
    status: 'scheduled' | 'live' | 'ended';
  };
  /**
   * The role of the current user.
   * 'teacher' if the user is the teacher of the lecture, 'student' if the user is a student.
   */
  userRole: 'teacher' | 'student';
}

export default function GoogleMeetIntegration({ lecture, userRole }: GoogleMeetIntegrationProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meetingLink, setMeetingLink] = useState(lecture.meetingLink || '');
  const [isCopied, setIsCopied] = useState(false);
  const navigate = useNavigate();
  // Using sonner toast

  // Generate a unique meeting ID based on lecture ID and timestamp
  const generateMeetingId = () => {
    const baseId = lecture.$id.replace(/[^a-z0-9]/gi, '').toLowerCase();
    const timestamp = Date.now().toString(36);
    return `${baseId}-${timestamp}`.substring(0, 30);
  };

  // Create a new Google Meet link
  const createMeetingLink = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // In a real implementation, you would call your backend API here
      // For now, we'll generate a Google Meet URL with a unique ID
      const meetingId = generateMeetingId();
      const newMeetingLink = `https://meet.google.com/new?authuser=0&hs=197&tf=0&nv=true&meetingId=${meetingId}`;
      
      // Save the meeting link to the database
      await databases.updateDocument(
        'your_database_id',
        'live_lectures',
        lecture.$id,
        {
          meetingLink: newMeetingLink,
          status: 'live',
          startedAt: new Date().toISOString()
        }
      );
      
      setMeetingLink(newMeetingLink);
      toast({
        title: "Meeting started!",
        description: "Your Google Meet session is ready.",
      });
    } catch (err) {
      console.error('Error creating meeting:', err);
      setError('Failed to create meeting. Please try again.');
      toast({
        title: "Error",
        description: "Failed to create meeting. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!meetingLink) return;
    
    navigator.clipboard.writeText(meetingLink);
    setIsCopied(true);
    toast({
      title: "Link copied!",
      description: "Meeting link copied to clipboard.",
    });
    
    setTimeout(() => setIsCopied(false), 2000);
  };

  const joinMeeting = () => {
    if (!meetingLink) return;
    window.open(meetingLink, '_blank', 'noopener,noreferrer');
  };

  // If meeting link exists but status is not live, update status
  useEffect(() => {
    const updateStatusIfNeeded = async () => {
      if (meetingLink && lecture.status !== 'live') {
        try {
          await databases.updateDocument(
            'your_database_id',
            'live_lectures',
            lecture.$id,
            { status: 'live' }
          );
        } catch (err) {
          console.error('Error updating status:', err);
        }
      }
    };

    updateStatusIfNeeded();
  }, [meetingLink, lecture.$id, lecture.status]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border rounded-lg bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Setting up your meeting...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border rounded-lg bg-red-50">
        <div className="flex items-center gap-2 text-red-600 mb-2">
          <AlertCircle className="w-5 h-5" />
          <h3 className="font-medium">Error</h3>
        </div>
        <p className="text-sm text-red-600 mb-4">{error}</p>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => window.location.reload()}
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {meetingLink ? (
        <div className="space-y-4">
          <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-900/20">
            <h3 className="font-medium mb-2 flex items-center gap-2">
              <Video className="w-5 h-5" />
              {lecture.title} - Google Meet
            </h3>
            <div className="flex items-center gap-2 mb-4">
              <LinkIcon className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-mono bg-muted px-2 py-1 rounded truncate">
                {meetingLink}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={copyToClipboard}
                title="Copy meeting link"
              >
                {isCopied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <div className="flex gap-3">
              <Button onClick={joinMeeting} className="gap-2">
                <Video className="w-4 h-4" />
                {userRole === 'teacher' ? 'Start Meeting' : 'Join Meeting'}
              </Button>
              {userRole === 'teacher' && (
                <Button 
                  variant="outline" 
                  onClick={async () => {
                    try {
                      await databases.updateDocument(
                        'your_database_id',
                        'live_lectures',
                        lecture.$id,
                        { status: 'ended', endedAt: new Date().toISOString() }
                      );
                      toast({
                        title: "Meeting ended",
                        description: "The live lecture has been marked as ended.",
                      });
                      navigate(`/course/${lecture.courseId}/live-lectures`);
                    } catch (err) {
                      console.error('Error ending meeting:', err);
                      toast({
                        title: "Error",
                        description: "Failed to end meeting. Please try again.",
                        variant: "destructive",
                      });
                    }
                  }}
                >
                  End Meeting
                </Button>
              )}
            </div>
          </div>
        </div>
      ) : userRole === 'teacher' ? (
        <div className="p-6 border rounded-lg bg-muted/50 text-center">
          <Video className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">Start a Live Lecture</h3>
          <p className="text-muted-foreground mb-6">
            Create a new session for your students to join.
          </p>
          <Button 
            onClick={createMeetingLink}
            className="gap-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Video className="w-4 h-4" />
            )}
            Create Meeting
          </Button>
        </div>
      ) : (
        <div className="p-6 border rounded-lg bg-muted/50 text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
          <h3 className="text-lg font-medium mb-2">Meeting Not Started</h3>
          <p className="text-muted-foreground">
            The teacher has not started the meeting yet. Please check back later.
          </p>
        </div>
      )}
    </div>
  );
}