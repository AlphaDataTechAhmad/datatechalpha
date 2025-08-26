import { useParams, useNavigate, Link } from 'react-router-dom';
import { useCallback, useEffect, useState } from 'react';
import { databases } from '../appwriteConfig';
import { toast } from 'sonner';
import { DATABASE_ID, INTERNSHIP_APPLICATIONS_COLLECTION_ID, INTERNSHIPS_COLLECTION_ID } from '../appwriteConfig';
import { Internship } from '../types/internship';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Calendar, Clock, MapPin, ExternalLink, CheckCircle, BookOpen } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Query } from 'appwrite';
import { Models } from 'appwrite';
import ExamSchedulingForm from '../components/internships/ExamSchedulingForm';
import ApplicationForm from '../components/internships/ApplicationForm';

type TabType = 'overview' | 'projects' | 'videos' | 'sessions' | 'apply';

interface Project {
  id: string;
  title: string;
  description: string;
  sourceCodeUrl?: string;
}

interface Video {
  id: string;
  title: string;
  description: string;
  url: string;
  thumbnail?: string;
  duration: string;
}

interface LiveSession {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  jitsiRoom: string;
}

interface TestResultDocument extends Models.Document {
  userId: string;
  internship_id: string;
  full_name: string;
  email: string;
  status: string;
  passed: boolean | string;
  score: number;
  percentage: number;
  completed_at: string;
  is_used: boolean;
  test_date?: string;
  exam_date?: string;
  test_scheduled?: boolean;
  exam_scheduled?: boolean;
  test_result?: string;
  test_status?: string;
  test_attempt_id: string;
  start_date?: string;
  expiry_date?: string;
}

// Function to format description into sections with bullet points
const formatDescription = (description: string) => {
  const sections = description.split('\n\n').filter(section => section.trim() !== '');
  
  return sections.map(section => {
    const titleMatch = section.match(/^(.+):/);
    let title = '';
    let content = section;
    
    if (titleMatch) {
      title = titleMatch[1].trim();
      content = section.substring(titleMatch[0].length).trim();
    }
    
    const points = content
      .split('•')
      .map(point => point.trim())
      .filter(point => point !== '');
    
    return {
      title,
      points: points.length > 0 ? points : [content]
    };
  });
};

const InternshipDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [internship, setInternship] = useState<Internship | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [hasApplied, setHasApplied] = useState(false);
  const [hasPassedTest, setHasPassedTest] = useState(false);
  const [hasScheduledExam, setHasScheduledExam] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [showExamSchedulingForm, setShowExamSchedulingForm] = useState(false);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [application, setApplication] = useState<Models.Document | null>(null);
  const [isRazorpayLoaded, setIsRazorpayLoaded] = useState(false);
  const { user } = useAuth() || {};
  const navigate = useNavigate();

  // Load Razorpay script on component mount
  useEffect(() => {
    const loadRazorpay = () => {
      return new Promise((resolve) => {
        if (window.Razorpay) {
          setIsRazorpayLoaded(true);
          resolve(true);
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.onload = () => {
          setIsRazorpayLoaded(true);
          resolve(true);
        };
        script.onerror = () => {
          console.error('Failed to load Razorpay script');
          resolve(false);
        };
        document.body.appendChild(script);
      });
    };

    loadRazorpay();

    return () => {
      // Cleanup if needed
    };
  }, []);

  // Mock functions for unimplemented APIs
  const generateTestLink = async (internshipId: string, userId: string) => {
    // In a real app, this would call your backend to generate a test link
    await new Promise(resolve => setTimeout(resolve, 1000));
    return `https://example.com/test/${internshipId}?user=${userId}`;
  };

  const sendTestLinkEmail = async (email: string, testLink: string) => {
    // In a real app, this would send an email with the test link
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log(`Test link sent to ${email}: ${testLink}`);
  };

  const checkApplicationStatus = useCallback(async () => {
    if (!user || !id) return null;

    try {
      console.log('Checking application status for user:', user.$id, 'and internship:', id);
      
      // First, check test results for this specific internship
      console.log('Searching for test results with:', { 
        userId: user.$id, 
        email: user.email, 
        internshipId: id 
      });
      
      let foundTestResults = { documents: [] as TestResultDocument[] };
      let hasPassedTestLocal = false;
      
      try {
        // Try to find by user ID and internship ID (most reliable)
        const userIdResults = await databases.listDocuments<TestResultDocument>(
          DATABASE_ID,
          '689923bc000f2d15a263',
          [
            Query.equal('userId', user.$id),
            Query.equal('internship_id', id)
          ]
        );
        
        console.log(`Found ${userIdResults.documents.length} test results for user ID ${user.$id} and internship ${id}`);
        foundTestResults = userIdResults;
        
        // If no results and user has email, try by email and internship ID
        if (foundTestResults.documents.length === 0 && user.email) {
          const emailResults = await databases.listDocuments<TestResultDocument>(
            DATABASE_ID,
            '689923bc000f2d15a263',
            [
              Query.equal('email', user.email),
              Query.equal('internship_id', id)
            ]
          );
          
          console.log(`Found ${emailResults.documents.length} test results for email ${user.email} and internship ${id}`);
          foundTestResults = emailResults;
        }
        
        // Log the test results we found
        if (foundTestResults.documents.length > 0) {
          console.log('Test results found:', JSON.stringify(foundTestResults.documents.map(doc => ({
            id: doc.$id,
            userId: doc.userId,
            internshipId: doc.internship_id,
            status: doc.status,
            passed: doc.passed,
            score: doc.score,
            percentage: doc.percentage,
            completedAt: doc.completed_at,
            isUsed: doc.is_used
          })), null, 2));
        }
        
        // Now process the test results to determine if the test was passed
        if (foundTestResults.documents.length > 0) {
          hasPassedTestLocal = foundTestResults.documents.some((doc: TestResultDocument) => {
            // Check if test is completed (either by status or completed_at)
            const isCompleted = doc.status === 'completed' || 
                              doc.completed_at || 
                              doc.status === 'passed' ||
                              doc.status === 'comp';
            
            if (!isCompleted) {
              console.log(`Test ${doc.$id} is not completed`);
              return false;
            }
            
            // Check if test is passed (handles both boolean and string values)
            const isPassed = doc.passed === true || 
                            doc.passed === 'true' || 
                            doc.status === 'passed';
            
            // Check score criteria (50% or higher)
            const score = typeof doc.score === 'number' ? doc.score : parseFloat(doc.score || '0');
            const percentage = typeof doc.percentage === 'number' 
              ? doc.percentage 
              : parseFloat(doc.percentage || '0');
            
            const hasPassingScore = score >= 50 || percentage >= 50;
            const isPassing = isPassed || hasPassingScore;
            
            if (isPassing) {
              console.log(`Test ${doc.$id} is marked as passed`, { 
                isPassed, 
                hasPassingScore,
                score,
                percentage,
                status: doc.status
              });
              return true;
            } else {
              console.log(`Test ${doc.$id} does not meet passing criteria`, { 
                isPassed, 
                hasPassingScore,
                score,
                percentage,
                status: doc.status
              });
              return false;
            }
          });
          
          console.log('Has passed test for this internship:', hasPassedTestLocal);
        } else {
          console.log('No test results found for this internship');
        }
        
      } catch (error) {
        console.error('Error querying test results:', error);
        hasPassedTestLocal = false;
      }

      console.log('Raw database response:', JSON.stringify(foundTestResults, null, 2));
      
      // Cast the documents to the TestResultDocument type
      const typedDocs = foundTestResults.documents as unknown as TestResultDocument[];
      
      if (typedDocs.length > 0) {
        console.log('Test results with fields:', JSON.stringify(typedDocs.map(doc => ({
          id: doc.$id,
          userId: doc.userId,
          internshipId: doc.internship_id,
          fullName: doc.full_name,
          email: doc.email,
          status: doc.status,
          passed: doc.passed,
          score: doc.score,
          percentage: doc.percentage,
          completedAt: doc.completed_at,
          isUsed: doc.is_used,
          createdAt: doc.$createdAt
        })), null, 2));
      } else {
        console.log('No test results found to display');
      }
      
      // Now check application status separately
      let hasApplicationLocal = false;
      let isEnrolledLocal = false;
      let paymentSuccessLocal = false;
      let hasScheduledExamLocal = false;
      let applicationLocal = null;

      try {
        const applications = await databases.listDocuments(
          DATABASE_ID,
          INTERNSHIP_APPLICATIONS_COLLECTION_ID,
          [
            Query.equal('userId', user.$id),
            Query.equal('internship_id', id),
            Query.orderDesc('$createdAt') // Get the most recent application first
          ]
        );
        
        console.log('Application status:', JSON.stringify(applications, null, 2));
        hasApplicationLocal = applications.documents.length > 0;
        
        if (hasApplicationLocal) {
          // Get the most recent application (first one since we ordered by createdAt desc)
          applicationLocal = applications.documents[0];
          
          // Check if exam is scheduled - check for all possible field names
          let hasScheduled = false;
          
          // First, check if there are any test results with is_used = false
          try {
            const testResults = await databases.listDocuments(
              DATABASE_ID,
              '689923bc000f2d15a263', // internship_test_links collection ID
              [
                Query.equal('userId', user.$id),
                Query.equal('internship_id', id),
                Query.equal('is_used', false),
                Query.orderDesc('$createdAt')
              ]
            );
            
            console.log('Raw test results:', JSON.stringify(testResults, null, 2));
            
            if (testResults.documents.length > 0) {
              console.log('Found test results with is_used = false, considering exam as scheduled');
              hasScheduled = true;
            }
          } catch (error) {
            console.error('Error checking test results for scheduling:', error);
          }
          
          // If no test results found, fall back to the old method
          if (!hasScheduled) {
            const app = applicationLocal;
            const hasExamScheduled = 
              app.examScheduled === true || 
              app.testScheduled === true || 
              app.test_scheduled === true || 
              app.exam_scheduled === true ||
              (typeof app.examScheduled === 'string' && app.examScheduled.toLowerCase() === 'true') ||
              (typeof app.testScheduled === 'string' && app.testScheduled.toLowerCase() === 'true') ||
              (typeof app.test_scheduled === 'string' && app.test_scheduled.toLowerCase() === 'true') ||
              (typeof app.exam_scheduled === 'string' && app.exam_scheduled.toLowerCase() === 'true') ||
              app.test_date || 
              app.exam_date;
              
            console.log('Exam scheduled check for latest app:', {
              appId: app.$id,
              examScheduled: app.examScheduled,
              testScheduled: app.testScheduled,
              test_date: app.test_date,
              exam_date: app.exam_date,
              test_scheduled: app.test_scheduled,
              exam_scheduled: app.exam_scheduled,
              hasExamScheduled
            });
            
            hasScheduled = hasExamScheduled;
            
            // If not found in the latest app, check older applications
            if (!hasScheduled && applications.documents.length > 1) {
              for (let i = 1; i < applications.documents.length; i++) {
                const olderApp = applications.documents[i];
                const olderAppHasScheduled = 
                  olderApp.examScheduled === true || 
                  olderApp.testScheduled === true || 
                  olderApp.test_scheduled === true || 
                  olderApp.exam_scheduled === true ||
                  (typeof olderApp.examScheduled === 'string' && olderApp.examScheduled.toLowerCase() === 'true') ||
                  (typeof olderApp.testScheduled === 'string' && olderApp.testScheduled.toLowerCase() === 'true') ||
                  (typeof olderApp.test_scheduled === 'string' && olderApp.test_scheduled.toLowerCase() === 'true') ||
                  (typeof olderApp.exam_scheduled === 'string' && olderApp.exam_scheduled.toLowerCase() === 'true') ||
                  olderApp.test_date || 
                  olderApp.exam_date;
                  
                if (olderAppHasScheduled) {
                  hasScheduled = true;
                  console.log('Found scheduled exam in older application:', olderApp.$id);
                  break;
                }
              }
            }
          }
          
          console.log('Has scheduled exam:', hasScheduled);
          hasScheduledExamLocal = hasScheduled;
          
          // Check if any application has a completed payment
          const hasCompletedPayment = applications.documents.some(app => app.payment_status === 'completed');
          
          if (hasCompletedPayment) {
            console.log('User has a completed payment for this internship');
            isEnrolledLocal = true;
            paymentSuccessLocal = true;
            // If the latest app doesn't have the payment, find the one that does
            if (applicationLocal.payment_status !== 'completed') {
              const paidApp = applications.documents.find(app => app.payment_status === 'completed');
              if (paidApp) applicationLocal = paidApp;
            }
          } else {
            console.log('Latest payment status:', applicationLocal.payment_status);
            isEnrolledLocal = false;
            paymentSuccessLocal = false;
          }
        } else {
          console.log('No application found for this internship');
          isEnrolledLocal = false;
          paymentSuccessLocal = false;
          hasScheduledExamLocal = false;
        }
      } catch (error) {
        console.error('Error checking application status:', error);
        // Don't reset test results on application error
        isEnrolledLocal = false;
        paymentSuccessLocal = false;
        hasScheduledExamLocal = false;
      }
      
      // Update all states at once to prevent flickering
      setHasApplied(hasApplicationLocal);
      setHasPassedTest(hasPassedTestLocal);
      setHasScheduledExam(hasScheduledExamLocal);
      setIsEnrolled(isEnrolledLocal);
      setPaymentSuccess(paymentSuccessLocal);
      setApplication(applicationLocal);
      
      return { testResults: foundTestResults, application: applicationLocal };
    } catch (error) {
      console.error('Error checking application status:', error);
      throw error; // Re-throw the error to be caught by the caller
    }
  }, [user, id, databases]);

  const handlePayment = useCallback(async () => {
    if (!user) {
      navigate('/login', { state: { from: `/internships/${id}` } });
      return;
    }

    if (!internship) {
      toast.error('Internship details not available');
      return;
    }

    // Ensure price is defined and a valid number
    const price = parseFloat(String(internship.price || '0'));
    if (isNaN(price) || price <= 0) {
      toast.error('Invalid internship price');
      return;
    }

    // Check for Razorpay key
    const razorpayKey = import.meta.env.VITE_PUBLIC_RAZORPAY_KEY_ID;
    if (!razorpayKey) {
      console.error('Razorpay key is not configured');
      toast.error('Payment system configuration error. Please contact support.');
      return;
    }

    // Ensure Razorpay is loaded
    if (!window.Razorpay) {
      toast.error('Payment system is still initializing. Please try again in a moment.');
      // Try to reload the script
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => {
        setIsRazorpayLoaded(true);
        toast.success('Payment system ready. Please try your payment again.');
      };
      script.onerror = () => {
        toast.error('Failed to load payment system. Please refresh the page.');
      };
      document.body.appendChild(script);
      return;
    }

    setIsProcessingPayment(true);

    try {
      // First, check if the user has already applied
      const { documents: existingApps } = await databases.listDocuments(
        DATABASE_ID,
        INTERNSHIP_APPLICATIONS_COLLECTION_ID,
        [
          Query.equal('userId', user.$id),
          Query.equal('internship_id', id || '')
        ]
      );

      let appToUpdate = existingApps[0];
      
      // If no existing application, create one with a temporary payment ID
      if (!appToUpdate) {
        const tempPaymentId = `temp_${Date.now()}`;
        const newApp = await databases.createDocument(
          DATABASE_ID,
          INTERNSHIP_APPLICATIONS_COLLECTION_ID,
          'unique()',
          {
            userId: user.$id,
            email: user.email,
            full_name: user.name || 'User',
            phone: user.phone || '',  // Adding required phone field with empty string as fallback
            testLink: '',  // Adding required testLink field with empty string as fallback
            internship_id: id,
            applied_at: new Date().toISOString(),
            payment_id: tempPaymentId,
            payment_status: 'pending',
            amount: price.toString()
          }
        );
        appToUpdate = newApp;
        setApplication(newApp);
      }

      // Initialize Razorpay options
      const options = {
        key: razorpayKey,
        amount: Math.round(price * 100), // Convert to paise
        currency: internship.currency || 'INR',
        name: 'Internship Enrollment',
        description: `Payment for ${internship.title}`,
        order_id: undefined as string | undefined,
        handler: async function (response: any) {
          try {
            // Update the application with payment success
            // Only include fields that are known to exist in the schema
            const updateData: Record<string, any> = {
              payment_id: response.razorpay_payment_id || response.razorpay_order_id,
              razorpay_order_id: response.razorpay_order_id,
              payment_status: 'completed',
              amount: price.toString()
            };
            
            // Only include fields that exist in the original document
            const allowedFields = Object.keys(appToUpdate);
            const fieldsToAdd = {
              razorpay_signature: response.razorpay_signature,
              enrolled_at: new Date().toISOString(),
              status: 'enrolled'
            };
            
            // Only add fields that exist in the schema
            Object.entries(fieldsToAdd).forEach(([key, value]) => {
              if (allowedFields.includes(key)) {
                updateData[key] = value;
              }
            });
            
            const updatedApp = await databases.updateDocument(
              DATABASE_ID,
              INTERNSHIP_APPLICATIONS_COLLECTION_ID,
              appToUpdate.$id,
              updateData
            );
            
            // Update local state
            setApplication(updatedApp);
            setPaymentSuccess(true);
            setIsEnrolled(true);
            
            // Show success message
            toast.success('Payment successful! You are now enrolled in the internship.');
            
            // Refresh application status to ensure consistency
            await checkApplicationStatus();
            
          } catch (error) {
            console.error('Error updating payment status:', error);
            toast.error('Payment successful but failed to update enrollment status. Please contact support.');
          } finally {
            setIsProcessingPayment(false);
          }
        },
        prefill: {
          name: user.name || '',
          email: user.email || '',
          contact: user.phone || ''
        },
        theme: {
          color: '#4F46E5'
        },
        modal: {
          ondismiss: function() {
            toast.info('Payment window closed');
            setIsProcessingPayment(false);
          }
        }
      };

      try {
        const rzp = new window.Razorpay(options);
        
        // Handle payment failure
        rzp.on('payment.failed', async function (response: any) {
          try {
            // Only include fields that are known to exist in the schema
            const updateData: Record<string, any> = {
              payment_status: 'failed',
              amount: price.toString()
            };
            
            // Only include fields that exist in the original document
            const allowedFields = Object.keys(appToUpdate);
            const fieldsToAdd = {
              payment_error: response.error?.description || 'Payment failed',
              status: 'payment_failed'
            };
            
            // Only add fields that exist in the schema
            Object.entries(fieldsToAdd).forEach(([key, value]) => {
              if (allowedFields.includes(key)) {
                updateData[key] = value;
              }
            });
            
            const updatedApp = await databases.updateDocument(
              DATABASE_ID,
              INTERNSHIP_APPLICATIONS_COLLECTION_ID,
              appToUpdate.$id,
              updateData
            );
            setApplication(updatedApp);
            toast.error('Payment failed. Please try again.');
          } catch (error) {
            console.error('Error updating failed payment status:', error);
          } finally {
            setIsProcessingPayment(false);
          }
        });
        
        rzp.open();
      } catch (error) {
        console.error('Error initializing Razorpay:', error);
        toast.error('Failed to initialize payment. Please refresh the page and try again.');
        setIsProcessingPayment(false);
      }
      
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error instanceof Error ? error.message : 'Payment failed. Please try again.');
      setIsProcessingPayment(false);
    }
  }, [user, id, application, databases, internship, checkApplicationStatus]);

  const handleApply = () => {
    if (!user) {
      navigate('/login', { state: { from: `/internships/${id}` } });
      return;
    }
    setShowExamSchedulingForm(true);
  };

  const handleApplicationSubmit = async (applicationData: any) => {
    try {
      // Check if already applied
      const response = await databases.listDocuments(
        DATABASE_ID,
        INTERNSHIP_APPLICATIONS_COLLECTION_ID,
        [
          Query.equal('userId', user?.$id || ''),
          Query.equal('internship_id', id || '')
        ]
      );

      if (response.documents.length > 0) {
        toast.error('You have already applied to this internship');
        return;
      }

      // Generate test link
      let testLink = '';
      try {
        testLink = await generateTestLink(
          id || '',
          user?.$id || '',
          {
            full_name: applicationData.full_name || user?.name || 'User',
            email: applicationData.email || user?.email || '',
            phone: applicationData.phone || ''
          }
        );
      } catch (error) {
        console.error('Error generating test link:', error);
        toast.error('Failed to generate test link. Please try again.');
        return;
      }

      // Create application with all required fields
      const newApplication = await databases.createDocument(
        DATABASE_ID,
        INTERNSHIP_APPLICATIONS_COLLECTION_ID,
        'unique()',
        {
          userId: user?.$id,
          email: applicationData.email || user?.email,
          phone: applicationData.phone,
          full_name: applicationData.full_name || user?.name || 'User',
          internship_id: id,
          applied_at: new Date().toISOString(),
          testLink: testLink,
          payment_id: 'pending_' + Date.now(),
          payment_status: 'pending',
          amount: '0',
          testResult: 'pending'
        }
      );

      setApplication(newApplication);
      setShowApplicationForm(false);
      
      // Send email with test link
      if (user?.email) {
        await sendTestLinkEmail(user.email, testLink);
      }

      toast.success('Application submitted! Check your email for the test link.');
      setHasApplied(true);
      
      // Refresh application status
      await checkApplicationStatus();
      
    } catch (error) {
      console.error('Error submitting application:', error);
      toast.error('Failed to submit application');
    }
  };

  // Check application status when user changes or when checkApplicationStatus changes
  useEffect(() => {
    if (user && id) {
      checkApplicationStatus().finally(() => {
        setIsCheckingStatus(false);
      });
    } else {
      setIsCheckingStatus(false);
    }
  }, [user, id, checkApplicationStatus]);

  useEffect(() => {
    const fetchInternship = async () => {
      if (!id) return;
      
      console.log('Fetching internship with ID:', id);
      
      // Validate the ID format
      const isValidId = /^[a-zA-Z0-9_]{1,36}$/.test(id);
      if (!isValidId) {
        console.error('Invalid document ID format:', id);
        setError('Invalid internship ID format');
        setIsLoading(false);
        return;
      }
      
      try {
        // First try to get the internship by ID
        try {
          console.log('Calling databases.getDocument with:', {
            databaseId: DATABASE_ID,
            collectionId: INTERNSHIPS_COLLECTION_ID,
            documentId: id
          });
          
          const response = await databases.getDocument(
            DATABASE_ID,
            INTERNSHIPS_COLLECTION_ID,
            id
          ) as unknown as Internship;
          
          console.log('Received response:', response);
          
          // Transform the response to match our Internship type
          const data: Internship = {
            ...response,
            id: response.$id,
            title: response.title,
            slug: response.slug || '',
            description: response.description || '',
            duration: response.duration || 'Not specified',
            level: response.level || 'Beginner',
            image: response.image || '',
            price: typeof response.price === 'number' ? response.price : 0,
            currency: response.currency || '₹',
            projects: [],
            videos: [],
            liveSessions: []
          };
          
          setInternship(data);
        } catch (err) {
          console.error('Error fetching internship:', err);
          setError('Failed to load internship details');
          setIsCheckingStatus(false);
        }
      } catch (err) {
        console.error('Error:', err);
        setError('An unexpected error occurred');
        setIsCheckingStatus(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInternship();
  }, [id, user, checkApplicationStatus]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-8">
            <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-4">
                <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
              <div className="space-y-4">
                <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !internship) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
            {error || 'Internship not found'}
          </h2>
          <Link 
            to="/internships" 
            className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Internships
          </Link>
        </div>
      </div>
    );
  }

  const fallbackImage = 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80';
  const bannerImage = imageError || !internship.image ? fallbackImage : internship.image;

  const renderApplyButton = () => {
    if (isEnrolled || application?.status === 'enrolled') {
      return (
        <div className="w-full text-center">
          <div className="bg-green-600 text-white py-3 px-6 rounded-md font-medium">
            Enrolled - Course Starting Soon
          </div>
          {application?.enrolled_at && (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Enrolled on: {new Date(application.enrolled_at).toLocaleDateString()}
            </p>
          )}
        </div>
      );
    }

    return (
      <button
        onClick={handlePayment}
        disabled={isProcessingPayment}
        className={`w-full bg-blue-600 text-white py-3 px-6 rounded-md font-medium hover:bg-blue-700 transition-colors ${
          isProcessingPayment ? 'opacity-75 cursor-not-allowed' : ''
        }`}
      >
        {isProcessingPayment ? 'Processing...' : 'Enroll Now'}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Banner */}
      <div className="relative h-64 w-full overflow-hidden bg-gray-200 dark:bg-gray-800">
        <img 
          src={bannerImage}
          alt={internship.title}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-6">
          <div className="text-white">
            <h1 className="text-3xl font-bold">{internship.title}</h1>
            <div className="flex flex-wrap gap-4 mt-2 text-sm">
              <span className="inline-flex items-center">
                <MapPin className="w-4 h-4 mr-1" />
                Remote
              </span>
              <span className="inline-flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                {internship.duration}
              </span>
              <span className="inline-flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                Starts: {new Date().toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-1/4 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
              <h3 className="font-semibold text-lg mb-4">Quick Info</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Duration</p>
                  <p className="font-medium">{internship.duration}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Level</p>
                  <p className="font-medium capitalize">{internship.level.toLowerCase()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Location</p>
                  <p className="font-medium">Remote</p>
                </div>
                {isCheckingStatus ? (
                  <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse h-12"></div>
                ) : paymentSuccess || isEnrolled ? (
                  <div className="mt-4 space-y-4">
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="text-green-800 dark:text-green-200 font-semibold text-lg mb-1">Payment Successful! 🎉</h4>
                          <p className="text-green-700 dark:text-green-300 text-sm">
                            Congratulations! You're now enrolled in this internship Training. We'll contact you soon with further details.
                          </p>
                          {internship?.description && (
                            <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/10 rounded border border-green-100 dark:border-green-800/50">
                              <h5 className="font-medium text-green-800 dark:text-green-200 mb-2">What's Next:</h5>
                              <p className="text-green-700 dark:text-green-300 text-sm">
                                {internship.description.split('. ')[0]}
                              </p>
                              <p className="mt-2 text-green-600 dark:text-green-400 text-sm">
                                Check your email for the enrollment confirmation and next steps.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : isEnrolled ? (
                  <div className="mt-4 space-y-3">
                    <div className="p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg flex items-center justify-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                      <span className="text-green-700 dark:text-green-300 font-medium">Enrolled</span>
                    </div>
                  </div>
                ) : hasPassedTest ? (
                  <div className="mt-4 space-y-3">
                    <div className="p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg flex items-center justify-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                      <span className="text-green-700 dark:text-green-300 font-medium">Test Passed</span>
                    </div>
                    <button 
                      onClick={handlePayment}
                      disabled={isProcessingPayment}
                      className={`w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                        isProcessingPayment ? 'opacity-70 cursor-not-allowed' : ''
                      }`}
                    >
                      {isProcessingPayment ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Enroll Now - {internship.currency || '₹'} {internship.price || '0'}
                        </>
                      )}
                    </button>
                  </div>
                ) : hasScheduledExam || application?.examScheduled ? (
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg flex items-center justify-center gap-2">
                    <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <span className="text-blue-700 dark:text-blue-300 font-medium">Exam Scheduled</span>
                  </div>
                ) : hasApplied ? (
                  <button 
                    onClick={() => setShowExamSchedulingForm(true)}
                    className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <BookOpen className="w-4 h-4" />
                    Schedule Exam
                  </button>
                ) : (
                  <button 
                    onClick={handleApply}
                    className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    Apply Now
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:w-3/4">
            <AnimatePresence mode="wait">
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8"
              >
                <div>
                  <h2 className="text-2xl font-bold mb-4">About This Internship</h2>
                  <div className="prose dark:prose-invert max-w-none">
                    {internship.description ? (
                      <div className="space-y-4">
                        {formatDescription(internship.description).map((section, index) => (
                          <div key={index} className="mb-6">
                            {section.title && (
                              <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                                {section.title}
                              </h3>
                            )}
                            <ul className="space-y-2 list-disc pl-6 text-gray-700 dark:text-gray-300">
                              {section.points.map((point, pointIndex) => (
                                <li key={pointIndex} className="leading-relaxed">
                                  {point}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400">No description available.</p>
                    )}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
      
      {/* Exam Scheduling Form Modal */}
      <AnimatePresence>
        {showExamSchedulingForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowExamSchedulingForm(false);
              }
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 500 }}
              className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden relative max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setShowExamSchedulingForm(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200 z-10"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <ExamSchedulingForm
                internshipId={internship?.id || ''}
                onClose={() => setShowExamSchedulingForm(false)}
                onSuccess={() => {
                  setHasScheduledExam(true);
                  toast.success('Exam scheduled successfully!');
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Application Form Modal for Payment */}
      <AnimatePresence>
        {showApplicationForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowApplicationForm(false);
              }
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 500 }}
              className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden relative max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setShowApplicationForm(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200 z-10"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <ApplicationForm
                internshipId={internship?.id || ''}
                price={internship?.price || 0}
                onClose={() => setShowApplicationForm(false)}
                onSuccess={() => {
                  setShowApplicationForm(false);
                  setIsEnrolled(true);
                  toast.success('Payment successful! You are now enrolled in the internship.');
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>


    </div>
  );
};

export default InternshipDetail;