import React, { useState, useEffect } from 'react';
import { databases, DATABASE_ID, EXAM_REGISTRATIONS_COLLECTION_ID } from '../../appwriteConfig';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

interface ExamRegistration {
  $id: string;
  full_name: string;
  email: string;
  phone: string;
  internship_id: string;
  status: 'pending' | 'scheduled' | 'completed';
  scheduled_at?: string;
  test_id?: string;
}

const ExamRegistrations: React.FC = () => {
  const [registrations, setRegistrations] = useState<ExamRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRegistration, setSelectedRegistration] = useState<ExamRegistration | null>(null);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [examTime, setExamTime] = useState('');
  const [examDate, setExamDate] = useState('');

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      const response = await databases.listDocuments(
        DATABASE_ID,
        EXAM_REGISTRATIONS_COLLECTION_ID
      );
      setRegistrations(response.documents as unknown as ExamRegistration[]);
    } catch (error) {
      console.error('Error fetching registrations:', error);
      toast.error('Failed to load exam registrations');
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleExam = (registration: ExamRegistration) => {
    setSelectedRegistration(registration);
    setScheduleDialogOpen(true);
  };

  const handleSendExamDetails = async () => {
    if (!selectedRegistration) return;
    
    const scheduledAt = new Date(`${examDate}T${examTime}`);
    
    try {
      // Update the registration with scheduled time
      await databases.updateDocument(
        DATABASE_ID,
        EXAM_REGISTRATIONS_COLLECTION_ID,
        selectedRegistration.$id,
        {
          status: 'scheduled',
          scheduled_at: scheduledAt.toISOString(),
        }
      );

      // TODO: Implement email sending logic here
      // await sendExamEmail(selectedRegistration.email, scheduledAt);
      
      toast.success(`Exam scheduled successfully for ${selectedRegistration.full_name}`);
      setScheduleDialogOpen(false);
      fetchRegistrations();
    } catch (error) {
      console.error('Error scheduling exam:', error);
      toast.error('Failed to schedule exam');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      pending: 'bg-yellow-100 text-yellow-800',
      scheduled: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClasses[status as keyof typeof statusClasses] || 'bg-gray-100'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Exam Registrations</h2>
      </div>

      {loading ? (
        <div>Loading registrations...</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scheduled At</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {registrations.map((registration) => (
                  <tr key={registration.$id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {registration.full_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {registration.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(registration.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {registration.scheduled_at 
                        ? format(new Date(registration.scheduled_at), 'MMM d, yyyy h:mm a') 
                        : 'Not scheduled'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {registration.status !== 'scheduled' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleScheduleExam(registration)}
                        >
                          Schedule Exam
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Schedule Exam Dialog */}
      <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Exam</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="examDate">Exam Date</Label>
              <Input
                id="examDate"
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="mt-1 block w-full"
              />
            </div>
            <div>
              <Label htmlFor="examTime">Exam Time</Label>
              <Input
                id="examTime"
                type="time"
                value={examTime}
                onChange={(e) => setExamTime(e.target.value)}
                className="mt-1 block w-full"
              />
            </div>
            <div className="bg-blue-50 p-3 rounded-md">
              <p className="text-sm text-blue-700">
                An email will be sent to {selectedRegistration?.email} with the exam details and scheduled time.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSendExamDetails}
              disabled={!examDate || !examTime}
            >
              Schedule & Send Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExamRegistrations;
