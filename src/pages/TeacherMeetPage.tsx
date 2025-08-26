import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { databases } from '../appwrite/config';
import { ID } from 'appwrite';
import { toast } from 'react-toastify';
import TeacherMeet from './TeacherMeet';
import { Button, Container, Typography, Box, CircularProgress } from '@mui/material';

interface RoomData {
  teacherId: string;
  title: string;
  description?: string;
  status: 'waiting' | 'live' | 'ended';
  createdAt: string;
  updatedAt: string;
}

const TeacherMeetPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meetingEnded, setMeetingEnded] = useState(false);
  const isTeacher = user?.$id === roomData?.teacherId;

  // Fetch room data
  useEffect(() => {
    const fetchRoomData = async () => {
      if (!roomId) return;
      
      try {
        // In a real app, you would fetch this from your database
        // const response = await databases.getDocument(
        //   'YOUR_DATABASE_ID',
        //   'meeting_rooms',
        //   roomId
        // );
        // setRoomData(response as unknown as RoomData);
        
        // For demo purposes, we'll use mock data
        setRoomData({
          teacherId: user?.$id || 'demo-teacher-id',
          title: 'Classroom Session',
          status: 'live',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching room data:', err);
        setError('Failed to load meeting room. It may have been ended or doesn\'t exist.');
        setLoading(false);
      }
    };

    fetchRoomData();
  }, [roomId, user?.$id]);

  const handleEndMeeting = async () => {
    if (!roomId) return;
    
    try {
      // In a real app, you would update the room status in your database
      // await databases.updateDocument(
      //   'YOUR_DATABASE_ID',
      //   'meeting_rooms',
      //   roomId,
      //   { status: 'ended' }
      // );
      
      setMeetingEnded(true);
      toast.success('Meeting ended successfully');
      setTimeout(() => {
        navigate('/dashboard'); // Redirect to dashboard after ending meeting
      }, 2000);
    } catch (err) {
      console.error('Error ending meeting:', err);
      toast.error('Failed to end meeting');
    }
  };

  const handleMeetingLeft = () => {
    if (isTeacher) {
      // Only end meeting if teacher leaves
      handleEndMeeting();
    } else {
      // For students, just navigate away
      navigate('/dashboard');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Typography variant="h5" color="error" gutterBottom>
          Error
        </Typography>
        <Typography paragraph>{error}</Typography>
        <Button variant="contained" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </Button>
      </Container>
    );
  }

  if (meetingEnded) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom>
          Meeting Ended
        </Typography>
        <Typography paragraph>
          The host has ended the meeting. You will be redirected shortly.
        </Typography>
      </Container>
    );
  }

  if (!roomData) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          Meeting Not Found
        </Typography>
        <Typography paragraph>The requested meeting could not be found.</Typography>
        <Button variant="contained" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </Button>
      </Container>
    );
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ 
        bgcolor: 'primary.main', 
        color: 'white', 
        p: 2,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Typography variant="h6">
          {roomData.title} {isTeacher ? '(Host)' : ''}
        </Typography>
        <Button 
          variant="contained" 
          color="error"
          onClick={handleEndMeeting}
          disabled={!isTeacher}
        >
          {isTeacher ? 'End Meeting' : 'Leave Meeting'}
        </Button>
      </Box>

      {/* Jitsi Container */}
      <div style={{ flex: 1, position: 'relative' }}>
        <TeacherMeet 
          isTeacher={isTeacher}
          roomName={roomId || 'default-room'}
          onMeetingEnd={handleMeetingLeft}
        />
      </div>
    </div>
  );
};

export default TeacherMeetPage;
