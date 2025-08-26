import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { databases, client } from '../../appwriteConfig';
import { ID, Functions } from 'appwrite';
import { Button } from '../ui/button';
import { generateTestLink } from '@/utils/internshipTestUtils';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { toast } from 'react-hot-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';

interface ExamSchedulingFormProps {
  internshipId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

const ExamSchedulingForm: React.FC<ExamSchedulingFormProps> = ({
  internshipId,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    full_name: user?.name || '',
    email: user?.email || '',
    phone: '',
    internshipId: internshipId
  });
  const [testLink, setTestLink] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const sendTestInvitation = async (email: string, fullName: string, testLink: string) => {
    try {
      const functions = new Functions(client);
      const response = await functions.createExecution(
        '689b8dcb00074914a73d', // Appwrite Function ID for sending emails
        JSON.stringify({
          email,
          subject: 'Your Internship Test Link',
          message: `
            <p>Hello ${fullName},</p>
            <p>Thank you for applying to the internship program. Here is your test link:</p>
            <p><a href="${window.location.origin}${testLink}" target="_blank" style="font-size: 14px; font-family: Inter, sans-serif; color: #ffffff; text-decoration: none; background-color: #2D2D31; border-radius: 8px; padding: 9px 14px; border: 1px solid #414146; display: inline-block; text-align:center; box-sizing: border-box;">Start Your Test</a></p>
            <p>Your test will be available 24 hours after application and will expire after 48 hours.</p>
            <p style="margin-bottom: 32px">
                Thanks,<br/>
                DataTech Alpha Team
            </p>
          `,
          sender: 'hr@datatechalpha.com',
          senderName: 'DATA TECH ALPHA'
        })
      );
      return response;
    } catch (error) {
      console.error('Error sending test invitation:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setIsSubmitting(true);

    try {
      if (!user?.$id) {
        throw new Error('User must be logged in to schedule an exam');
      }

      // Generate the test link using the utility function
      const newTestLink = await generateTestLink(
        formData.internshipId,
        user.$id,  // Use user.$id (profile document ID) instead of accountId
        {
          full_name: formData.full_name || '',
          email: user.email || formData.email || '',
          phone: formData.phone || ''
        }
      );
      
      setTestLink(newTestLink);
      const testId = newTestLink.split('/').pop() || '';
      const now = new Date();

      // Then create the application document with all required fields
      const applicationData = {
        userId: user.$id,  // Use user.$id (profile document ID) instead of accountId
        internship_id: formData.internshipId,
        full_name: formData.full_name || '',
        email: user?.email || formData.email || '',
        phone: formData.phone || '',
        payment_id: 'pending_' + Date.now(),
        payment_status: 'pending',
        amount: '0',
        applied_at: now.toISOString(),
        testLink: newTestLink
      };
      
      console.log('Creating application with data:', applicationData);
      
      const application = await databases.createDocument(
        '68261b6a002ba6c3b584', // Database ID
        '6884a2ca0003ae2e2fba', // internship_applications collection ID
        ID.unique(),
        applicationData
      );

      // Send test invitation email
      try {
        await sendTestInvitation(
          user?.email || formData.email || '',
          formData.full_name,
          newTestLink
        );
        console.log('Test invitation email sent successfully');
      } catch (emailError) {
        console.error('Failed to send test invitation email:', emailError);
        // Don't fail the submission if email fails
        toast.error('Application submitted, but failed to send test link email. Please contact support.');
      }

      setShowSuccess(true);
      setFormData(prev => ({
        ...prev,
        test_link: testLink
      }));
      
      onSuccess?.();
    } catch (error) {
      console.error('Error scheduling exam:', error);
      toast.error('Failed to schedule exam. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-white">Schedule Your Exam</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="full_name" className="text-gray-700 dark:text-gray-300">Full Name</Label>
          <Input
            id="full_name"
            name="full_name"
            type="text"
            value={formData.full_name}
            onChange={handleChange}
            required
            className="w-full text-gray-900 dark:text-white bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full text-gray-900 dark:text-white bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone" className="text-gray-700 dark:text-gray-300">Phone Number</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleChange}
            required
            className="w-full text-gray-900 dark:text-white bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
          />
        </div>

<div className="flex justify-end gap-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Scheduling...' : 'Schedule Exam'}
          </Button>
        </div>
      </form>

      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-green-600">Registration Successful!</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium">You're all set!</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  Your exam has been successfully scheduled. Here's your test link:
                </p>
                
                <div className="mt-3 p-3 bg-blue-50 rounded-md border border-blue-100">
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Your Test Link:</p>
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={testLink ? window.location.origin + testLink : 'Generating link...'}
                      className="flex-1 text-sm px-2 py-1.5 border rounded bg-white text-gray-700 truncate"
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                      disabled={!testLink}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (testLink) {
                          navigator.clipboard.writeText(window.location.origin + testLink);
                          setIsCopied(true);
                          setTimeout(() => setIsCopied(false), 2000); // Reset after 2 seconds
                        }
                      }}
                      disabled={!testLink}
                      className={`shrink-0 ${isCopied ? 'bg-green-50 text-green-600 border-green-200' : ''}`}
                    >
                      {isCopied ? 'Copied!' : 'Copy'}
                    </Button>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-blue-50 rounded-md">
                  <p className="font-medium text-blue-700">Important:</p>
                  <ul className="list-disc pl-5 mt-1 space-y-1 text-sm text-blue-700">
                    <li>This test link has also been sent to your email: <span className="font-medium">{formData.email}</span></li>
                    <li>The test will be available 24 hours from now and will expire after 2 days</li>
                    <li>Make sure to check your spam folder if you don't see our email</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              onClick={() => {
                setShowSuccess(false);
                onClose();
              }}
              className="w-full text-gray-900 dark:text-white bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
            >
              Return to Dashboard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExamSchedulingForm;
