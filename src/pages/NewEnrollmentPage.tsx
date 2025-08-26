import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { databases, DATABASE_ID, ENROLLMENTS_COLLECTION_ID } from '../appwriteConfig';
import { ID, Query } from 'appwrite';
import { updateTeacherRewards } from '../utils/teacherRewards';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { CheckCircle, XCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { openRazorpayCheckout } from '../Services/razorpayService';

// EnrollmentData type is now defined inline where needed

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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coursePrice, setCoursePrice] = useState(0);
  const [discountedPrice, setDiscountedPrice] = useState<number | null>(null);
  
  const decodedCourseName = encodedCourseName ? decodeURIComponent(encodedCourseName) : 'Course';

  // Generate a unique receipt ID
  const generateReceiptId = () => {
    return `RCPT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  };

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
    setReferralCheckMessage('Verifying referral code...');
    
    try {
      // Check if the referral code exists in the teachers collection
      const response = await databases.listDocuments(
        DATABASE_ID,
        '682c054e0029e175bc85', // Teachers collection ID
        [
          Query.equal('referralCode', trimmedCode),
          Query.limit(1)
        ]
      );
      
      const isValid = response.documents.length > 0;
      setIsReferralValid(isValid);
      
      if (isValid) {
        const discountAmount = 500; // Fixed discount of 500
        setDiscountedPrice(coursePrice - discountAmount);
        setReferralCheckMessage(`✅ Valid referral code! ₹${discountAmount} discount applied.`);
      } else {
        setDiscountedPrice(null);
        setReferralCheckMessage('❌ Invalid referral code');
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
        price: finalAmount,
        originalPrice: coursePrice,
        discountApplied: discountedPrice ? coursePrice - finalAmount : 0,
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
            
            // Update teacher's rewards if referral code was used
            if (isReferralValid && referralCode) {
              try {
                console.log('Updating teacher rewards for referral code:', referralCode);
                await updateTeacherRewards(referralCode);
                console.log('Successfully updated teacher rewards');
              } catch (error) {
                console.error('Failed to update teacher rewards:', error);
                // Don't fail the enrollment if reward update fails
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

  // Set course price (in a real app, fetch this from your API)
  useEffect(() => {
    // Example price based on course ID
    if (courseId) {
      const price = 2000; // Default price
      setCoursePrice(price);
    }
  }, [courseId]);

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
                    placeholder="+91 9876543218"
                    required
                    className={theme === 'dark' ? 'bg-gray-700 border-gray-600' : ''}
                  />
                </div>
                
                <div className="space-y-4">
                  <div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between mb-1">
                      <Label htmlFor="referral" className="text-sm font-medium">Referral Code (Optional)</Label>
                      {isCheckingReferral ? (
                        <span className="text-xs text-blue-500 flex items-center">
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" /> Verifying...
                        </span>
                      ) : isReferralValid ? (
                        <span className="text-xs text-green-500 flex items-center">
                          <CheckCircle className="h-3 w-3 mr-1" /> Valid code
                        </span>
                      ) : referralCode ? (
                        <span className="text-xs text-red-500 flex items-center">
                          <XCircle className="h-3 w-3 mr-1" /> Invalid code
                        </span>
                      ) : null}
                    </div>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          id="referral"
                          value={referralCode}
                          onChange={(e) => setReferralCode(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && checkReferralCode(referralCode)}
                          placeholder="Enter teacher's referral code"
                          className={`w-full pr-24 ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : ''}`}
                        />
                        <Button 
                          type="button"
                          onClick={() => checkReferralCode(referralCode)}
                          disabled={!referralCode.trim() || isCheckingReferral}
                          variant={isReferralValid ? "default" : "outline"}
                          size="sm"
                          className={`absolute right-1 top-1/2 -translate-y-1/2 h-8 px-3 text-xs ${isReferralValid ? 'bg-green-600 hover:bg-green-700' : ''}`}
                        >
                          {isReferralValid ? '✓ Verified' : 'Verify'}
                        </Button>
                      </div>
                    </div>
                    {referralCode && !isReferralValid && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Enter a valid teacher's referral code to apply discount
                      </p>
                    )}
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
