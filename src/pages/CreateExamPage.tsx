import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTestConductorAuth } from '../contexts/TestConductorAuthContext';
import { databases, DATABASE_ID, EXAMS_COLLECTION } from '../appwriteConfig';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';

const CreateExamPage: React.FC = () => {
  const { user } = useTestConductorAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration: 60, // in minutes
    startDate: '',
    endDate: '',
    passingScore: 60, // percentage
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'duration' || name === 'passingScore' ? Number(value) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to create an exam',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const examData = {
        title: formData.title,
        description: formData.description,
        duration: formData.duration,
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
        passingScore: formData.passingScore,
        status: 'draft',
        createdBy: user.$id,
        totalQuestions: 0, // Will be updated when questions are added
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Create the exam in the database
      const response = await databases.createDocument(
        DATABASE_ID,
        EXAMS_COLLECTION,
        'unique()',
        examData
      );

      toast({
        title: 'Success',
        description: 'Exam created successfully!',
      });

      // Redirect to the exam edit page
      navigate(`/test-dashboard/${response.$id}`);
      
    } catch (error) {
      console.error('Error creating exam:', error);
      toast({
        title: 'Error',
        description: 'Failed to create exam. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Create New Exam</CardTitle>
            <CardDescription>
              Fill in the details below to create a new exam.
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Exam Title</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Enter exam title"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Enter exam description"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    name="duration"
                    type="number"
                    min="1"
                    value={formData.duration}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="passingScore">Passing Score (%)</Label>
                  <Input
                    id="passingScore"
                    name="passingScore"
                    type="number"
                    min="1"
                    max="100"
                    value={formData.passingScore}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date (Optional)</Label>
                  <Input
                    id="startDate"
                    name="startDate"
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date (Optional)</Label>
                  <Input
                    id="endDate"
                    name="endDate"
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={handleChange}
                    min={formData.startDate || undefined}
                  />
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/test-dashboard')}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Exam'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default CreateExamPage;
