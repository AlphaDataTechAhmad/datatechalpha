import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { databases } from '../appwrite/config';
import { ID } from 'appwrite';
import { toast } from 'react-toastify';
import { 
  Container, 
  TextField, 
  Button, 
  Typography, 
  Paper, 
  Box, 
  Grid,
  FormControlLabel,
  Switch,
  Divider
} from '@mui/material';

const CreateTeacherMeet: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requireAuth: false,
    muteOnEntry: true,
    videoOnEntry: false,
    enableChat: true,
    enableScreenSharing: true,
    enableRecording: false,
    enableWaitingRoom: false,
    enableBreakoutRooms: false
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('You must be logged in to create a meeting');
      return;
    }

    setLoading(true);
    
    try {
      // Generate a unique room ID
      const roomId = `teacher-meet-${Math.random().toString(36).substring(2, 10)}`;
      
      // In a real app, you would save this to your database
      // const meetingData = {
      //   teacherId: user.$id,
      //   title: formData.title,
      //   description: formData.description,
      //   roomId,
      //   settings: {
      //     requireAuth: formData.requireAuth,
      //     muteOnEntry: formData.muteOnEntry,
      //     videoOnEntry: formData.videoOnEntry,
      //     enableChat: formData.enableChat,
      //     enableScreenSharing: formData.enableScreenSharing,
      //     enableRecording: formData.enableRecording,
      //     enableWaitingRoom: formData.enableWaitingRoom,
      //     enableBreakoutRooms: formData.enableBreakoutRooms
      //   },
      //   status: 'waiting',
      //   createdAt: new Date().toISOString(),
      //   updatedAt: new Date().toISOString()
      // };
      
      // await databases.createDocument(
      //   'YOUR_DATABASE_ID',
      //   'meeting_rooms',
      //   ID.unique(),
      //   meetingData
      // );
      
      // For demo, we'll just navigate to the meeting page
      navigate(`/meet/${roomId}`);
      
      toast.success('Meeting created successfully!');
    } catch (error) {
      console.error('Error creating meeting:', error);
      toast.error('Failed to create meeting');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Create New Classroom
        </Typography>
        
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                id="title"
                name="title"
                label="Classroom Title"
                value={formData.title}
                onChange={handleChange}
                variant="outlined"
                margin="normal"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                id="description"
                name="description"
                label="Description (Optional)"
                value={formData.description}
                onChange={handleChange}
                variant="outlined"
                margin="normal"
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Meeting Settings
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.muteOnEntry}
                        onChange={handleChange}
                        name="muteOnEntry"
                        color="primary"
                      />
                    }
                    label="Mute participants on entry"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.videoOnEntry}
                        onChange={handleChange}
                        name="videoOnEntry"
                        color="primary"
                      />
                    }
                    label="Enable video on entry"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.enableChat}
                        onChange={handleChange}
                        name="enableChat"
                        color="primary"
                      />
                    }
                    label="Enable chat"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.enableScreenSharing}
                        onChange={handleChange}
                        name="enableScreenSharing"
                        color="primary"
                      />
                    }
                    label="Enable screen sharing"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.enableRecording}
                        onChange={handleChange}
                        name="enableRecording"
                        color="primary"
                      />
                    }
                    label="Enable recording"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.enableWaitingRoom}
                        onChange={handleChange}
                        name="enableWaitingRoom"
                        color="primary"
                        disabled // Disabled as we're forcing it off
                      />
                    }
                    label="Enable waiting room (Disabled for now)"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.enableBreakoutRooms}
                        onChange={handleChange}
                        name="enableBreakoutRooms"
                        color="primary"
                      />
                    }
                    label="Enable breakout rooms"
                  />
                </Grid>
              </Grid>
            </Grid>
            
            <Grid item xs={12} sx={{ mt: 2 }}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                disabled={loading || !formData.title}
                fullWidth
              >
                {loading ? 'Creating...' : 'Create Classroom'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
};

export default CreateTeacherMeet;
