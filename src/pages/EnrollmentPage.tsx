import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Query } from 'appwrite';
import { useAuth } from '../contexts/AuthContext';
import { databases, DATABASE_ID, ENROLLMENTS_COLLECTION_ID } from '../appwriteConfig';
import { sqlCourses, pythonCourses, sscCourses, bankingCourses, aptitudeCourses, dsaCourses, aiCourses, webDevelopmentCourses } from './courseData';
import { updateTeacherRewards } from '../utils/teacherRewards';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { CheckCircle, XCircle, ArrowLeft, Loader2, Check } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { openRazorpayCheckout } from '../Services/razorpayService';

interface Course {
  id: string;
  courseId?: string;
  title: string;
  description: string;
  duration: string;
  students: string;
  successRate: string;
  level: string;
  image: string;
  price?: number;
  category?: string;
  originalPrice?: number;
  syllabus: string[];
  features: string[];
  rating?: React.ReactNode;
  overview?: string;
  teacherId?: string;
  thumbnail?: string;
  testIds?: string[];
}

const EnrollmentPage: React.FC = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { courseId, courseName: encodedCourseName } = useParams<{ courseId: string; courseName: string }>();
  
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [isReferralValid, setIsReferralValid] = useState(false);
  const [isCheckingReferral, setIsCheckingReferral] = useState(false);
  const [referralCheckMessage, setReferralCheckMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [course, setCourse] = useState<Course | null>(null);
  const [coursePrice, setCoursePrice] = useState<number>(0);
  const [discountedPrice, setDiscountedPrice] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const decodedCourseName = encodedCourseName ? decodeURIComponent(encodedCourseName) : 'Course';

  // Get course details from database
  useEffect(() => {
    const fetchCourse = async () => {
      if (!courseId) {
        console.log('No courseId provided');
        return;
      }

      try {
        console.log('Fetching course from database with ID:', courseId);
        // First try to fetch from database
        const response = await databases.listDocuments(
          DATABASE_ID,
          '682644ed002b437582d3', // Courses collection
          [
            Query.equal('courseId', courseId),
            Query.limit(1)
          ]
        );

        console.log('Database response:', {
          total: response.total,
          documents: response.documents.length,
          firstDoc: response.documents[0] || 'No documents'
        });

        if (response.documents.length > 0) {
          const dbCourse = response.documents[0];
          console.log('Found course in database:', dbCourse);
          setCourse(dbCourse as unknown as Course);
          const price = Number(dbCourse.price) || 0;
          console.log('Setting course price to:', price);
          setCoursePrice(price);
          return;
        }

        // Fallback to local data if not found in database
        console.log('Course not found in database, falling back to local data');
        
        // Combine all course arrays
        const allCourses = [
          ...sqlCourses,
          ...pythonCourses,
          ...sscCourses,
          ...bankingCourses,
          ...aptitudeCourses,
          ...aiCourses,
          ...dsaCourses,
          ...webDevelopmentCourses
        ];
        
        // Search for course by id or courseId (case insensitive)
        const foundCourse = allCourses.find(c => 
          (c.id && c.id.toLowerCase() === courseId.toLowerCase()) || 
          (c.courseId && c.courseId.toLowerCase() === courseId.toLowerCase())
        );

        if (foundCourse) {
          console.log('Found course in local data:', foundCourse);
          setCourse(foundCourse);
          setCoursePrice(Number(foundCourse.price) || 0);
        } else {
          console.warn(`Course with ID '${courseId}' not found in any course array`);
          setCoursePrice(1999); // Default price
        }
      } catch (error) {
        console.error('Error fetching course:', {
          message: error.message,
          code: error.code,
          type: error.type,
          response: error.response
        });
        setCoursePrice(1999); // Default price on error
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCourse();
  }, [courseId]);

  // Generate a unique receipt ID
  const generateReceiptId = () => {
    return `RCPT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  };

  // Update the price when coursePrice changes
  useEffect(() => {
    if (isReferralValid && coursePrice > 0) {
      // Apply 40% discount and round to nearest integer
      const discountAmount = Math.round(coursePrice * 0.05);
      setDiscountedPrice(Math.max(0, coursePrice - discountAmount));
    } else {
      setDiscountedPrice(null);
    }
  }, [coursePrice, isReferralValid]);

  // Check if referral code is valid
  const checkReferralCode = async (code: string) => {
    const trimmedCode = code.trim();
    if (!trimmedCode) {
      setIsReferralValid(false);
      setDiscountedPrice(null);
      setReferralCheckMessage('');
      return;
    }
    
    setIsCheckingReferral(true);
    setReferralCheckMessage('Verifying teacher ID...');
    
    try {
      // Search for teacher by teacher_id field
      const response = await databases.listDocuments(
        DATABASE_ID,
        '682c054e0029e175bc85', // Teachers collection ID
        [
          Query.equal('teacher_id', trimmedCode),
          Query.limit(1)
        ]
      );
      
      // Check if we found a matching teacher
      const isValid = response.documents.length > 0;
      const teacher = response.documents[0];
      
      console.log('Teacher lookup result:', { isValid, teacher });
      setIsReferralValid(isValid);
      
      if (isValid) {
        const discountAmount = coursePrice * 0.4; // 40% discount
        // The price update is now handled by the useEffect above
        setReferralCheckMessage(`✅ Valid Referral ID! 5% (₹${discountAmount.toFixed(2)}) discount applied.`);
      } else {
        setDiscountedPrice(null);
        setReferralCheckMessage('❌ Invalid referral ID');
      }
    } catch (err) {
      console.error('Error checking referral code:', err);
      setIsReferralValid(false);
      setDiscountedPrice(null);
      setReferralCheckMessage('Error verifying code. Please try again.');
    } finally {
      setIsCheckingReferral(false);
    }
  };

  // Update teacher rewards with detailed logging and error handling
  const updateTeacherRewards = async (teacherId: string) => {
    if (!teacherId) {
      console.error('No teacher ID provided');
      return null;
    }

    try {
      console.log('1. Looking up teacher with ID:', teacherId);
      
      // 1. Find the teacher document
      const response = await databases.listDocuments(
        DATABASE_ID,
        '682c054e0029e175bc85', // Teachers collection ID
        [Query.equal('teacher_id', teacherId)]
      );
      
      console.log('Teacher query response:', response);
      
      if (!response.documents || response.documents.length === 0) {
        console.error('❌ Teacher not found with ID:', teacherId);
        return null;
      }
      
      const teacherDoc = response.documents[0];
      console.log('2. Found teacher document:', JSON.stringify(teacherDoc, null, 2));
      
      // 2. Parse current points (handle both string and number)
      const currentPoints = typeof teacherDoc.points === 'number' 
        ? teacherDoc.points 
        : parseInt(teacherDoc.points || '0', 10);
      
      console.log('3. Current points:', currentPoints);
      
      // 3. Parse existing referrals or initialize empty array
      let existingReferrals = [];
      if (teacherDoc.referrals) {
        try {
          // Handle both string and array formats
          if (typeof teacherDoc.referrals === 'string') {
            // Try to parse the string as JSON
            const parsed = JSON.parse(teacherDoc.referrals);
            existingReferrals = Array.isArray(parsed) ? parsed : [];
          } else if (Array.isArray(teacherDoc.referrals)) {
            // Already an array
            existingReferrals = teacherDoc.referrals;
          }
          console.log('4. Parsed referrals:', existingReferrals);
        } catch (e) {
          console.error('❌ Error parsing referrals:', e);
          existingReferrals = [];
        }
      }
      
      // 4. Create new referral object with compact format
      const simplifiedReferral = {
        s: user?.$id?.substring(0, 8) || 'unknown', // First 8 chars of student ID
        n: fullName.substring(0, 15), // First 15 chars of name
        c: decodedCourseName.substring(0, 15), // First 15 chars of course
        d: new Date().toISOString().split('T')[0].replace(/-/g, ''), // Compact date (YYYYMMDD)
        p: 10 // Points
      };
      
      // 5. Add the new referral to existing ones and limit to last 10 referrals
      const updatedReferrals = [...existingReferrals, simplifiedReferral].slice(-10);
      
      // 6. Convert referrals to JSON string
      let referralsString = JSON.stringify(updatedReferrals);
      
      // 7. Ensure the string doesn't exceed 500 characters
      if (referralsString.length > 500) {
        console.warn('Referrals data exceeds 500 characters, truncating...');
        // Remove oldest referrals until we're under the limit
        let tempReferrals = [...updatedReferrals];
        while (referralsString.length > 500 && tempReferrals.length > 1) {
          tempReferrals.shift(); // Remove oldest referral
          referralsString = JSON.stringify(tempReferrals);
        }
      }
      
      // 8. Prepare update data
      const updateData = {
        points: currentPoints + 10,
        updatedAt: new Date().toISOString(),
        referrals: referralsString // Store as string
      };
      
      console.log('5. Referrals string length:', referralsString.length);
      console.log('6. Update data:', JSON.stringify(updateData, null, 2));
      
      // 9. Update teacher document
      console.log('7. Attempting to update teacher document...');
      const result = await databases.updateDocument(
        DATABASE_ID,
        '682c054e0029e175bc85', // Teachers collection ID
        teacherDoc.$id,
        updateData
      );
      
      console.log('✅ Successfully updated teacher document:', result);
      return result;
      
    } catch (error) {
      console.error('❌ Failed to update teacher rewards:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      throw error;
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (!fullName || !phoneNumber) {
      setError('Please fill in all required fields');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const receiptId = generateReceiptId();
      const finalAmount = discountedPrice || coursePrice;
      
      // Create enrollment data
      const enrollmentData = {
        userId: user.$id,
        courseId: courseId || '',
        courseName: decodedCourseName,
        enrollmentDate: new Date().toISOString(),
        receiptId,
        status: 'enrolled' as const,
        price: Math.round(finalAmount), // Ensure price is an integer
        originalPrice: Math.round(coursePrice), // Ensure original price is an integer
        discountApplied: discountedPrice ? Math.round(coursePrice - finalAmount) : 0, // Ensure discount is an integer
        referralCode: isReferralValid ? referralCode : '',
        teacherId: isReferralValid ? referralCode : ''
      };

      // Open Razorpay checkout
      await openRazorpayCheckout({
        key: import.meta.env.VITE_PUBLIC_RAZORPAY_KEY_ID,
        amount: finalAmount * 100, // Razorpay expects amount in paise
        currency: 'INR',
        name: 'Your Company Name',
        description: `Payment for ${decodedCourseName}`,
        prefill: {
          name: fullName,
          email: email || user.email || '',
          contact: phoneNumber
        },
        notes: {
          courseId: courseId || '',
          userId: user.$id,
          receiptId,
          finalAmount: finalAmount.toString(),
          referralCode: isReferralValid ? referralCode : 'none'
        },
        handler: async (_response: { razorpay_payment_id: string }) => {
          try {
            // Save enrollment to database
            await databases.createDocument(
              DATABASE_ID,
              ENROLLMENTS_COLLECTION_ID,
              ID.unique(),
              enrollmentData
            );
            
            // Update teacher rewards if referral code was used
            if (isReferralValid && referralCode) {
              try {
                console.log('Updating teacher rewards for referral code:', referralCode);
                await updateTeacherRewards(referralCode);
                console.log('✅ Successfully updated teacher rewards');
              } catch (error) {
                console.error('❌ Failed to update teacher rewards:', error);
                // Don't fail the enrollment if rewards update fails
                // We can add retry logic here if needed
                console.log('Continuing with enrollment despite rewards update failure');
              }
            }
            
            // Navigate to receipt page with the final amount and referral info
            navigate(`/receipt/${receiptId}?amount=${finalAmount}${isReferralValid ? `&referral=${referralCode}` : ''}`);
          } catch (error) {
            console.error('Error saving enrollment:', error);
            setError('Failed to save enrollment. Please contact support.');
          }
        },
        modal: {
          ondismiss: () => {
            setError('Payment was cancelled. Please try again.');
            setIsLoading(false);
          }
        }
      });
    } catch (error) {
      console.error('Payment error:', error);
      setError('An error occurred during payment. Please try again.');
      setIsLoading(false);
    }
  };


  return (
    <div className={`min-h-screen py-12 px-4 sm:px-6 lg:px-8 ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50'}`}>
      <div className="max-w-3xl mx-auto">
        <Button 
          variant="ghost" 
          onClick={() => window.history.back()} 
          className="mb-6 flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to course
        </Button>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : ''}`}>
            <CardHeader>
              <CardTitle>Enroll in {decodedCourseName}</CardTitle>
              <CardDescription>
                Complete the form below to enroll in this course
              </CardDescription>
            </CardHeader>
            
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-6">
                {error && (
                  <div className="p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md">
                    {error}
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="John Doe"
                      required
                      className={theme === 'dark' ? 'bg-gray-700 border-gray-600' : ''}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email || user?.email || ''}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className={theme === 'dark' ? 'bg-gray-700 border-gray-600' : ''}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+91 9876543210"
                      required
                      className={theme === 'dark' ? 'bg-gray-700 border-gray-600' : ''}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="referral" className="text-sm font-medium">
                        Referral Code (Optional)
                      </Label>
                      {referralCheckMessage && (
                        <span className={`text-xs ${
                          isReferralValid ? 'text-green-600 dark:text-green-400' : 
                          referralCheckMessage.startsWith('❌') ? 'text-red-600 dark:text-red-400' :
                          'text-blue-500 dark:text-blue-400'
                        }`}>
                          {referralCheckMessage}
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <Input
                        id="referral"
                        value={referralCode}
                        onChange={(e) => {
                          const value = e.target.value;
                          setReferralCode(value);
                          if (isReferralValid || referralCheckMessage) {
                            setIsReferralValid(false);
                            setReferralCheckMessage('');
                          }
                        }}
                        onKeyDown={(e) => e.key === 'Enter' && checkReferralCode(referralCode)}
                        placeholder="Enter teacher's referral code"
                        className={`w-full pr-24 ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : ''} ${
                          isReferralValid ? 'border-green-500 dark:border-green-500' : ''
                        }`}
                        disabled={isCheckingReferral}
                      />
                      <Button 
                        type="button"
                        onClick={() => checkReferralCode(referralCode)}
                        disabled={isCheckingReferral || !referralCode.trim()}
                        variant={isReferralValid ? "default" : "outline"}
                        size="sm"
                        className={`absolute right-1 top-1/2 -translate-y-1/2 h-8 px-3 text-xs ${
                          isReferralValid ? 'bg-green-600 hover:bg-green-700' : ''
                        }`}
                      >
                        {isCheckingReferral ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : isReferralValid ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          'Verify'
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      
                    </p>
                  </div>
                </div>
                
                <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
                  <h3 className="font-medium mb-2">Order Summary</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Course Fee:</span>
                      <span>₹{coursePrice.toLocaleString()}</span>
                    </div>
                    {discountedPrice && (
                      <div className="flex justify-between text-green-500">
                        <span>Discount Applied:</span>
                        <span>-₹{(coursePrice - discountedPrice).toLocaleString()}</span>
                      </div>
                    )}
                    <div className="border-t border-gray-300 dark:border-gray-600 my-2"></div>
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total Amount:</span>
                      <span>₹{(discountedPrice || coursePrice).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="flex justify-end gap-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => window.history.back()}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Proceed to Payment'
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default EnrollmentPage;
