import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { databases } from '../Services/appwrite';
import { Query } from 'appwrite';
import { useReactToPrint } from 'react-to-print';
import { Loader2, Download, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

const DATABASE_ID = '68261b6a002ba6c3b584';
const ENROLLMENTS_COLLECTION_ID = '684dc01f003312e04f0c';

const ReceiptPage: React.FC = () => {
  const { receiptId } = useParams<{ receiptId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [enrollment, setEnrollment] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const componentRef = useRef<HTMLDivElement>(null);

  const handleEmailReceipt = async () => {
    if (!user?.email) {
      toast.error('Please sign in to email receipt');
      return;
    }

    setIsSendingEmail(true);
    try {
      // Here you would typically call your backend API to send the email
      // For example: await api.sendReceiptEmail({ email: user.email, receiptId });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setEmailSent(true);
      toast.success('Receipt sent to your email!');
    } catch (err) {
      console.error('Failed to send email:', err);
      toast.error('Failed to send email. Please try again.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  useEffect(() => {
    const fetchEnrollment = async () => {
      if (!receiptId) {
        setError('Receipt ID is missing.');
        setIsLoading(false);
        return;
      }

      try {
        const response = await databases.listDocuments(
          DATABASE_ID,
          ENROLLMENTS_COLLECTION_ID,
          [Query.equal('receiptId', receiptId)]
        );

        if (response.documents.length > 0) {
          setEnrollment(response.documents[0]);
        } else {
          setError('Receipt not found.');
        }
      } catch (err) {
        console.error('Failed to fetch receipt:', err);
        setError('An error occurred while fetching the receipt.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEnrollment();
  }, [receiptId]);

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: `Receipt-${enrollment?.receiptId}`,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8 bg-white dark:bg-dark-800 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">Error</h2>
          <p className="text-dark-700 dark:text-dark-300">{error}</p>
        </div>
      </div>
    );
  }

  if (!enrollment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8 bg-white dark:bg-dark-800 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold text-gray-600 dark:text-gray-400 mb-4">Not Found</h2>
          <p className="text-dark-700 dark:text-dark-300">The requested receipt could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex flex-col items-center pt-24 pb-12 px-4">
      <div className="w-full max-w-4xl">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Course
        </Button>
        
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Payment Successful!</h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">Thank you for your purchase. Your enrollment has been confirmed.</p>
        </div>

        <div ref={componentRef} className="bg-white dark:bg-dark-800 rounded-xl shadow-lg overflow-hidden mb-8">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-dark-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Order Summary</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Receipt ID:</span>
                <span className="font-medium text-gray-900 dark:text-white">{enrollment.receiptId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Date:</span>
                <span className="text-gray-900 dark:text-white">{new Date(enrollment.enrollmentDate).toLocaleString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true
                })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Course:</span>
                <span className="font-medium text-gray-900 dark:text-white">{enrollment.courseName}</span>
              </div>
              {enrollment.originalPrice && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Original Price:</span>
                  <span className="text-gray-900 dark:text-white">₹{enrollment.originalPrice}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-semibold pt-4 border-t border-gray-200 dark:border-dark-700">
                <span className="text-gray-900 dark:text-white">Amount Paid:</span>
                <span className="text-primary-600 dark:text-primary-400">₹{enrollment.price}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-dark-800 rounded-xl shadow-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">What's Next?</h3>
          <ul className="space-y-3 text-gray-700 dark:text-gray-300">
            <li className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
              <span>You will receive a confirmation email with course access details</span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
              <span>Access your course materials from your dashboard</span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
              <span>Contact support if you have any questions</span>
            </li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            onClick={handlePrint}
            variant="outline"
            className="flex items-center gap-2 py-6 text-base"
          >
            <Download className="h-5 w-5" />
            Download Receipt
          </Button>
          <Button 
            onClick={handleEmailReceipt}
            disabled={isSendingEmail || emailSent}
            variant="default"
            className="flex items-center gap-2 py-6 text-base"
          >
            {isSendingEmail ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Sending...
              </>
            ) : emailSent ? (
              <>
                <CheckCircle className="h-5 w-5" />
                Email Sent!
              </>
            ) : (
              <>
                <Mail className="h-5 w-5" />
                Email Receipt
              </>
            )}
          </Button>
        </div>

        <div className="mt-8 text-center">
          <Button 
            variant="link" 
            onClick={() => { window.location.href = `/courses/${enrollment.courseId}?enrolled=true`; }}
            className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
          >
            Go to My Course
          </Button>
          <p className="mt-4 text-gray-500 dark:text-gray-400">
            Need help? <a href="/contact" className="text-primary-600 hover:underline dark:text-primary-400">Contact our support team</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReceiptPage;