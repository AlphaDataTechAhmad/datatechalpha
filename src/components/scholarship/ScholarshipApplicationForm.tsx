import React, { useState, useEffect } from 'react';
import { account } from '../../Services/appwrite';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  CircularProgress,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  Paper,
  Divider,
  FormControlLabel,
  Radio,
  RadioGroup,
  Checkbox,
  FormGroup,
  FormLabel,
} from '@mui/material';
import { CheckCircle } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { ID, Query } from 'appwrite';
import { databases } from '../../appwriteConfig';
import { DATABASE_ID, SCHOLARSHIP_APPLICATIONS_COLLECTION_ID } from '../../appwriteConfig';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface ScholarshipApplicationFormProps {
  open: boolean;
  onClose: () => void;
  scholarshipId: string;
  scholarshipTitle: string;
  price?: number;
  currency?: string;
}

const states = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
];

const DEFAULT_PRICE = 11000; // Default application fee in INR

const ScholarshipApplicationForm: React.FC<ScholarshipApplicationFormProps> = ({
  open,
  onClose,
  scholarshipId,
  scholarshipTitle,
  price = DEFAULT_PRICE,
  currency = 'INR',
}) => {
  // Account is already imported from appwrite service
  const [formData, setFormData] = useState({
    // Personal Information
    name: '',
    fatherName: '',
    DOB: '',
    gender: '',
    category: 'General',
    otherCategory: '',
    Nationality: 'Indian',
    
    // Contact Details
    Address: '',
    state: '',
    district: '',
    pin: '',
    phone: '',
    email: '',
    
    // Educational Details
    class: '',
    nameschoolcollege: '',
    boarduniversity: '',
    percentage: '',
    
    // Exam Details
    deviceused: 'Smartphone',
    internet: 'Yes',
    language: 'English',
    otherLanguage: '',
    
    // Referral
    referal: '',
    
    // Scholarship Details
    scholarshipId: scholarshipId,
    scholarshipTitle: scholarshipTitle,
    status: 'pending',
    amount: price.toString(),
    currency: currency,
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [applicationId, setApplicationId] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  
  // Form steps
  const steps = ['Personal Information', 'Contact Details', 'Educational Details', 'Exam Details', 'Review & Payment'];
  
  // Load Razorpay script on component mount
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<{ name?: string; value: unknown }> | SelectChangeEvent<string>) => {
    const { name, value } = e.target as { name: string; value: string };
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for the field being edited
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Validate referral code if provided
    if (step === 1 && formData.referal) {
      if (!/^\d{10}$/.test(formData.referal)) {
        newErrors.referal = 'Referral code must be a 10-digit mobile number';
      } else if (formData.referal === formData.phone) {
        newErrors.referal = 'You cannot refer yourself';
      }
    }
    
    if (step === 0) { // Personal Information
      if (!formData.name.trim()) newErrors.name = 'Full name is required';
      if (!formData.fatherName.trim()) newErrors.fatherName = 'Father\'s/Mother\'s name is required';
      if (!formData.DOB) newErrors.DOB = 'Date of birth is required';
      if (!formData.gender) newErrors.gender = 'Please select gender';
      if (!formData.category) newErrors.category = 'Please select category';
      if (formData.category === 'Other' && !formData.otherCategory.trim()) newErrors.otherCategory = 'Please specify category';
      if (!formData.Nationality.trim()) newErrors.Nationality = 'Nationality is required';
    } 
    else if (step === 1) { // Contact Details
      if (!formData.Address.trim()) newErrors.Address = 'Address is required';
      if (!formData.state) newErrors.state = 'State is required';
      if (!formData.district.trim()) newErrors.district = 'District is required';
      if (!formData.pin.trim()) newErrors.pin = 'PIN code is required';
      if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
      if (!formData.email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Email is invalid';
      }
    }
    else if (step === 2) { // Educational Details
      if (!formData.class.trim()) newErrors.class = 'Class/Year is required';
      if (!formData.nameschoolcollege.trim()) newErrors.nameschoolcollege = 'School/College name is required';
      if (!formData.boarduniversity.trim()) newErrors.boarduniversity = 'Board/University is required';
      if (!formData.percentage.trim()) newErrors.percentage = 'Percentage is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Render form steps
  const renderStepContent = (step: number) => {
    switch (step) {
      case 0: // Personal Information
        return (
          <Box component="form" noValidate sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>Personal Information</Typography>
            <TextField
              margin="normal"
              required
              fullWidth
              id="name"
              label="Full Name (in BLOCK letters)"
              name="name"
              value={formData.name}
              onChange={handleChange}
              error={!!errors.name}
              helperText={errors.name}
              inputProps={{ style: { textTransform: 'uppercase' } }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="fatherName"
              label="Father's / Mother's Name"
              name="fatherName"
              value={formData.fatherName}
              onChange={handleChange}
              error={!!errors.fatherName}
              helperText={errors.fatherName}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="DOB"
              label="Date of Birth"
              name="DOB"
              type="date"
              value={formData.DOB}
              onChange={handleChange}
              error={!!errors.DOB}
              helperText={errors.DOB || " "}
              InputLabelProps={{
                shrink: true,
              }}
            />
            <FormControl component="fieldset" fullWidth margin="normal" error={!!errors.gender}>
              <FormLabel component="legend">Gender *</FormLabel>
              <RadioGroup
                row
                aria-label="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
              >
                <FormControlLabel value="Male" control={<Radio />} label="Male" />
                <FormControlLabel value="Female" control={<Radio />} label="Female" />
                <FormControlLabel value="Other" control={<Radio />} label="Other" />
              </RadioGroup>
              {errors.gender && <Typography color="error" variant="caption">{errors.gender}</Typography>}
            </FormControl>
            <FormControl fullWidth margin="normal" error={!!errors.category}>
              <InputLabel id="category-label">Category *</InputLabel>
              <Select
                labelId="category-label"
                id="category"
                name="category"
                value={formData.category}
                label="Category *"
                onChange={handleChange}
              >
                <MenuItem value="General">General</MenuItem>
                <MenuItem value="OBC">OBC</MenuItem>
                <MenuItem value="SC">SC</MenuItem>
                <MenuItem value="ST">ST</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </Select>
              {errors.category && <Typography color="error" variant="caption">{errors.category}</Typography>}
            </FormControl>
            {formData.category === 'Other' && (
              <TextField
                margin="normal"
                required
                fullWidth
                id="otherCategory"
                label="Please specify category"
                name="otherCategory"
                value={formData.otherCategory}
                onChange={handleChange}
                error={!!errors.otherCategory}
                helperText={errors.otherCategory}
              />
            )}
            <TextField
              margin="normal"
              required
              fullWidth
              id="Nationality"
              label="Nationality"
              name="Nationality"
              value={formData.Nationality}
              onChange={handleChange}
              error={!!errors.Nationality}
              helperText={errors.Nationality}
            />
          </Box>
        );
      case 1: // Contact Details
        return (
          <Box component="form" noValidate sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>Contact Details</Typography>
            <TextField
              margin="normal"
              required
              fullWidth
              id="Address"
              label="Residential Address"
              name="Address"
              multiline
              rows={3}
              value={formData.Address}
              onChange={handleChange}
              error={!!errors.Address}
              helperText={errors.Address}
            />
            <FormControl fullWidth margin="normal" error={!!errors.state}>
              <InputLabel id="state-label">State *</InputLabel>
              <Select
                labelId="state-label"
                id="state"
                name="state"
                value={formData.state || ''}
                label="State *"
                onChange={handleChange}
                displayEmpty
                inputProps={{ 'aria-label': 'Without label' }}
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 200,
                    },
                  },
                }}
              >
                <MenuItem value="">
                  <em>Select a state</em>
                </MenuItem>
                {states.map((state) => (
                  <MenuItem key={state} value={state}>
                    {state}
                  </MenuItem>
                ))}
              </Select>
              {errors.state && (
                <Typography color="error" variant="caption">
                  {errors.state}
                </Typography>
              )}
            </FormControl>
            <TextField
              margin="normal"
              required
              fullWidth
              id="district"
              label="District"
              name="district"
              value={formData.district}
              onChange={handleChange}
              error={!!errors.district}
              helperText={errors.district}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="pin"
              label="PIN Code"
              name="pin"
              value={formData.pin}
              onChange={handleChange}
              error={!!errors.pin}
              helperText={errors.pin}
              inputProps={{ maxLength: 6, pattern: '\\d{6}' }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="phone"
              label="Mobile Number"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              error={!!errors.phone}
              helperText={errors.phone}
              inputProps={{ maxLength: 10, pattern: '\\d{10}' }}
            />
            <TextField
              margin="normal"
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              value={formData.email}
              onChange={handleChange}
              error={!!errors.email}
              helperText={errors.email}
            />
            <TextField
              margin="normal"
              fullWidth
              id="referal"
              label="Referral Code (Optional)"
              name="referal"
              placeholder="Referrer's mobile number"
              value={formData.referal}
              onChange={handleChange}
              error={!!errors.referal}
              helperText={errors.referal || "Enter referrer's 10-digit mobile number to earn referral points"}
              inputProps={{ maxLength: 10, pattern: '\\d{10}' }}
            />
          </Box>
        );
      case 2: // Educational Details
        return (
          <Box component="form" noValidate sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>Educational Details</Typography>
            <TextField
              margin="normal"
              required
              fullWidth
              id="class"
              label="Current Class / Year"
              name="class"
              value={formData.class}
              onChange={handleChange}
              error={!!errors.class}
              helperText={errors.class}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="nameschoolcollege"
              label="Name of School / College"
              name="nameschoolcollege"
              value={formData.nameschoolcollege}
              onChange={handleChange}
              error={!!errors.nameschoolcollege}
              helperText={errors.nameschoolcollege}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="boarduniversity"
              label="Board / University"
              name="boarduniversity"
              value={formData.boarduniversity}
              onChange={handleChange}
              error={!!errors.boarduniversity}
              helperText={errors.boarduniversity}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="percentage"
              label="Previous Class Percentage / Grade"
              name="percentage"
              value={formData.percentage}
              onChange={handleChange}
              error={!!errors.percentage}
              helperText={errors.percentage || "e.g., 85% or A+"}
            />
          </Box>
        );
      case 3: // Exam Details
        return (
          <Box component="form" noValidate sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>Exam Details</Typography>
            <FormControl component="fieldset" fullWidth margin="normal">
              <FormLabel component="legend">Device to be Used *</FormLabel>
              <RadioGroup
                row
                aria-label="deviceused"
                name="deviceused"
                value={formData.deviceused}
                onChange={handleChange}
              >
                <FormControlLabel value="Laptop" control={<Radio />} label="Laptop" />
                <FormControlLabel value="Desktop" control={<Radio />} label="Desktop" />
                <FormControlLabel value="Tablet" control={<Radio />} label="Tablet" />
                <FormControlLabel value="Smartphone" control={<Radio />} label="Smartphone" />
              </RadioGroup>
            </FormControl>
            <FormControl component="fieldset" fullWidth margin="normal">
              <FormLabel component="legend">Internet Availability *</FormLabel>
              <RadioGroup
                row
                aria-label="internet"
                name="internet"
                value={formData.internet}
                onChange={handleChange}
              >
                <FormControlLabel value="Yes" control={<Radio />} label="Yes" />
                <FormControlLabel value="No" control={<Radio />} label="No" />
              </RadioGroup>
            </FormControl>
            <FormControl component="fieldset" fullWidth margin="normal">
              <FormLabel component="legend">Preferred Exam Language *</FormLabel>
              <RadioGroup
                row
                aria-label="language"
                name="language"
                value={formData.language}
                onChange={handleChange}
              >
                <FormControlLabel value="English" control={<Radio />} label="English" />
                <FormControlLabel value="Hindi" control={<Radio />} label="Hindi" />
                <FormControlLabel value="Other" control={<Radio />} label="Other" />
              </RadioGroup>
            </FormControl>
            {formData.language === 'Other' && (
              <TextField
                margin="normal"
                required
                fullWidth
                id="otherLanguage"
                label="Please specify language"
                name="otherLanguage"
                value={formData.otherLanguage}
                onChange={handleChange}
              />
            )}
            <Box sx={{ mt: 3, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>Declaration:</Typography>
              <Typography variant="body2" paragraph>
                I hereby declare that all the information provided above is true and correct to the best of my knowledge. I understand that:
              </Typography>
              <ul>
                <li>The exam will be conducted online from home.</li>
                <li>I am responsible for arranging my own device and internet connection.</li>
                <li>Any malpractice or violation of exam rules will lead to immediate disqualification.</li>
              </ul>
              <FormControlLabel
                control={<Checkbox required name="declaration" color="primary" />}
                label="I agree to the above terms and conditions *"
              />
            </Box>
          </Box>
        );
      case 4: // Review & Payment
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>Review Your Application</Typography>
            <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>Personal Information</Typography>
              <Typography>Name: {formData.name}</Typography>
              <Typography>Father's/Mother's Name: {formData.fatherName}</Typography>
              <Typography>Date of Birth: {formData.DOB}</Typography>
              <Typography>Gender: {formData.gender}</Typography>
              <Typography>Category: {formData.category} {formData.otherCategory && `(${formData.otherCategory})`}</Typography>
              <Typography>Nationality: {formData.Nationality}</Typography>
              
              <Typography variant="subtitle1" sx={{ mt: 2 }} gutterBottom>Contact Details</Typography>
              <Typography>Address: {formData.Address}</Typography>
              <Typography>State: {formData.state}</Typography>
              <Typography>District: {formData.district}</Typography>
              <Typography>PIN Code: {formData.pin}</Typography>
              <Typography>Mobile: {formData.phone}</Typography>
              <Typography>Email: {formData.email}</Typography>
              
              {formData.referal && (
                <>
                  <Typography variant="subtitle1" sx={{ mt: 2 }} gutterBottom>Referral</Typography>
                  <Typography>Referred by: {formData.referal}</Typography>
                </>
              )}
              
              <Typography variant="subtitle1" sx={{ mt: 2 }} gutterBottom>Educational Details</Typography>
              <Typography>Class/Year: {formData.class}</Typography>
              <Typography>School/College: {formData.nameschoolcollege}</Typography>
              <Typography>Board/University: {formData.boarduniversity}</Typography>
              <Typography>Percentage/Grade: {formData.percentage}</Typography>
              
              <Typography variant="subtitle1" sx={{ mt: 2 }} gutterBottom>Exam Details</Typography>
              <Typography>Device: {formData.deviceused}</Typography>
              <Typography>Internet Available: {formData.internet}</Typography>
              <Typography>Preferred Language: {formData.language} {formData.otherLanguage && `(${formData.otherLanguage})`}</Typography>
              
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" align="right">
                Application Fee: {currency} 110.00
              </Typography>
            </Paper>
            
            <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="body2" color="text.secondary" paragraph>
                By clicking 'Proceed to Payment', you agree to our terms and conditions. The application fee is non-refundable.
              </Typography>
            </Box>
          </Box>
        );
      default:
        return 'Unknown step';
    }
  };

  const validateForm = () => {
    // Validate all steps before submission
    for (let i = 0; i < steps.length - 1; i++) {
      if (!validateStep(i)) {
        setActiveStep(i);
        return false;
      }
    }
    return true;
  };

  // Function to check and update referral points
  const updateReferralPoints = async (referralPhone: string) => {
    try {
      // Find the referring student by phone number
      const response = await databases.listDocuments(
        DATABASE_ID,
        SCHOLARSHIP_APPLICATIONS_COLLECTION_ID,
        [
          Query.equal('phone', referralPhone)
        ]
      );

      if (response.documents.length > 0) {
        const referringStudent = response.documents[0];
        const currentPoints = parseInt(referringStudent.referralPoints || '0');
        
        // Update the referring student's points
        await databases.updateDocument(
          DATABASE_ID,
          SCHOLARSHIP_APPLICATIONS_COLLECTION_ID,
          referringStudent.$id,
          {
            referralPoints: (currentPoints + 1).toString()
          }
        );
        
        console.log(`Updated referral points for ${referringStudent.name} (${referringStudent.phone}) to ${currentPoints + 1}`);
      }
    } catch (error) {
      console.error('Error updating referral points:', error);
      // Don't fail the application if referral update fails
    }
  };

  const saveApplication = async (paymentId: string, applicationData: any) => {
    try {
      const docId = ID.unique();
      
      // Prepare the full application data with payment ID
      // Remove any fields that aren't in the schema
      const { otherCategory, otherLanguage, applicationDate, ...restApplicationData } = applicationData;
      // Ensure amount is a valid string
      const amount = applicationData.amount ? String(applicationData.amount) : '0';
      
      const fullApplicationData: any = {
        ...restApplicationData,
        paymentId,
        appliedAt: new Date().toISOString(),
        status: 'pending',
        payment: false, // This is the boolean field for payment status
        amount, // This is now a valid string
        referralPoints: '0', // Initialize referral points
        
        // Required fields with defaults
        name: applicationData.name || '',
        phone: applicationData.phone || '',
        email: applicationData.email || '',
        scholarshipId: applicationData.scholarshipId || '',
        district: applicationData.district || '',
        fatherName: applicationData.fatherName || '',
        DOB: applicationData.DOB || new Date().toISOString(),
        gender: applicationData.gender || 'Other',
        category: applicationData.category || 'General',
        Nationality: applicationData.Nationality || 'Indian',
        Address: applicationData.Address || '',
        university: applicationData.university || '',
        referal: applicationData.referal || '',
      };

      // If there's a referral code, update the referrer's points
      if (applicationData.referal) {
        await updateReferralPoints(applicationData.referal);
      }

      console.log('Creating new document with data:', {
        databaseId: DATABASE_ID,
        collectionId: SCHOLARSHIP_APPLICATIONS_COLLECTION_ID,
        docId,
        data: fullApplicationData
      });

      // Save to Appwrite
      const result = await databases.createDocument(
        DATABASE_ID,
        SCHOLARSHIP_APPLICATIONS_COLLECTION_ID,
        docId,
        fullApplicationData
      );
      
      console.log('Document created successfully:', result);
      setApplicationId(docId);
      return docId;
    } catch (error) {
      console.error('Error saving application:', error);
      throw error;
    }
  };

  const handlePayment = async () => {
    if (!validateForm()) {
      return;
    }

    setPaymentProcessing(true);

    try {
      // Prepare application data
      const applicationData = {
        ...formData,
        scholarshipId,
        scholarshipTitle,
        userId: account?.$id,
        amount: price,
        currency: currency,
        status: 'pending_payment',
        applicationDate: new Date().toISOString()
      };
      
      // First save the application with a temporary payment ID
      const tempPaymentId = `temp_${Date.now()}`;
      const docId = await saveApplication(tempPaymentId, applicationData);
      
      // Initialize Razorpay
      const options = {
        key: import.meta.env.VITE_PUBLIC_RAZORPAY_KEY_ID,
        amount: Math.round(price * 11000), // Convert to paise (1 INR = 100 paise)
        currency: currency,
        name: 'Scholarship Application',
        description: `Payment for ${scholarshipTitle}`,
        order_id: undefined as string | undefined,
        handler: async function (response: any) {
          const currentApplicationId = docId; // Use the captured docId
          try {
            console.log('Payment successful, updating application...');
            console.log('Database ID:', DATABASE_ID);
            console.log('Collection ID:', SCHOLARSHIP_APPLICATIONS_COLLECTION_ID);
            console.log('Application ID:', currentApplicationId);
            
            if (!currentApplicationId) {
              throw new Error('No application ID found');
            }
            
            try {
              // First try to get the current document
              const currentDoc = await databases.getDocument(
                DATABASE_ID,
                SCHOLARSHIP_APPLICATIONS_COLLECTION_ID,
                currentApplicationId
              );
              
              console.log('Current document:', currentDoc);
              
              // Update with all fields including the payment info
              // Only include the fields we want to update
              const updateData = {
                paymentId: response.razorpay_payment_id,
                status: 'paid',
                payment: true
                // Removed updatedAt as it's handled by Appwrite
              };
              
              console.log('Update data:', updateData);
              
              try {
                // Perform the update
                const result = await databases.updateDocument(
                  DATABASE_ID,
                  SCHOLARSHIP_APPLICATIONS_COLLECTION_ID,
                  currentApplicationId,
                  updateData
                );
                
                console.log('Update successful:', result);
                setPaymentSuccess(true);
                toast.success('Payment successful! Your application has been submitted.');
                
                // Close the form after a delay
                setTimeout(() => {
                  onClose();
                  // Reset form state if needed
                  setActiveStep(0);
                  setPaymentProcessing(false);
                }, 2000);
                
                return result; // Return the updated document
              
              } catch (updateError) {
                console.error('Error updating document:', updateError);
                throw updateError; // Re-throw to be caught by the outer catch
              }
            } catch (getDocError) {
              console.log('Document not found, creating a new one...');
              // Continue to create a new document
            }

            // Create a new document if update fails or no document exists
            try {
              console.log('Attempting to create new document with fresh ID...');
              const newDocId = ID.unique();
              
              // Get current user
              const currentUser = await account.get();
              if (!currentUser) {
                throw new Error('User not authenticated');
              }
              
              // Remove any undefined or invalid fields
              const { otherCategory, otherLanguage, applicationDate, ...validFormData } = formData;
              
              // Ensure amount is a valid string
              const amount = formData.amount ? String(formData.amount) : '0';
              
              // Prepare document data with all required fields
              const createData = {
                // Required fields with defaults
                name: validFormData.name || '',
                phone: validFormData.phone || '',
                email: validFormData.email || '',
                scholarshipId: validFormData.scholarshipId || scholarshipId,
                district: validFormData.district || '',
                state: validFormData.state || '', // Make sure state is included
                
                // Personal details
                fatherName: validFormData.fatherName || '',
                DOB: validFormData.DOB || new Date().toISOString(),
                gender: validFormData.gender || 'Other',
                category: validFormData.category || 'General',
                nationality: validFormData.Nationality || 'Indian',
                address: validFormData.Address || '',
                school: validFormData.nameschoolcollege || '',
                university: validFormData.boarduniversity || '',
                amount: amount,
                currency: validFormData.currency || 'INR',
                status: 'pending',
                payment: false,
                userId: currentUser.$id, // Use the current user's ID
                paymentId: response.razorpay_payment_id || '',
                // Add any other required fields from your schema
              };

              console.log('Creating new document with data:', createData);
              
              // Save the document to the database
              const result = await databases.createDocument(
                DATABASE_ID,
                SCHOLARSHIP_APPLICATIONS_COLLECTION_ID,
                newDocId,
                createData
              );
              
              console.log('New document created successfully:', result);
              setApplicationId(newDocId);
              setPaymentSuccess(true);
              return result; // Return the created document
            } catch (createError) {
              console.error('Failed to create document:', createError);
              throw createError; // Re-throw to be caught by the outer catch
            }
            
            // Success handling is now done in the respective successful update/create blocks
          } catch (error) {
            console.error('Error updating payment status:', error);
            toast.error('Payment successful but failed to update application status. Please contact support.');
          }
        },
        prefill: {
          name: formData.name,
          email: formData.email,
          contact: formData.phone,
        },
        theme: {
          color: '#3399cc',
        },
      };

      // Open Razorpay payment modal
      if (window.Razorpay) {
        const rzp = new window.Razorpay(options);
        
        // Handle payment failure
        rzp.on('payment.failed', async function (response: any) {
          try {
            if (!currentApplicationId) {
              console.error('No application ID available for failed payment');
              return;
            }
            // Get the current document first to preserve existing fields
            const currentDoc = await databases.getDocument(
              DATABASE_ID,
              SCHOLARSHIP_APPLICATIONS_COLLECTION_ID,
              currentApplicationId
            );
            
            await databases.updateDocument(
              DATABASE_ID,
              SCHOLARSHIP_APPLICATIONS_COLLECTION_ID,
              currentApplicationId,
              {
                ...currentDoc, // Include all existing fields
                payment: false,
                status: 'payment_failed',
                paymentError: response.error.description,
                updatedAt: new Date().toISOString()
              }
            );
            toast.error('Payment failed. Please try again.');
          } catch (error) {
            console.error('Error updating failed payment status:', error);
          } finally {
            setPaymentProcessing(false);
          }
        });
        
        rzp.open();
      } else {
        throw new Error('Razorpay SDK failed to load');
      }
      
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error('Failed to process payment. Please try again.');
      setPaymentProcessing(false);
    }
  };
  // Render the form dialog
  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      aria-labelledby="scholarship-application-title"
    >
      <DialogTitle id="scholarship-application-title">
        Scholarship Application: {scholarshipTitle}
      </DialogTitle>
      
      <DialogContent dividers>
        {/* Stepper */}
        <Box sx={{ width: '100%', mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            {steps.map((label, index) => (
              <Box key={label} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Box
                  sx={{
                    width: 30,
                    height: 30,
                    borderRadius: '50%',
                    backgroundColor: activeStep >= index ? 'primary.main' : 'grey.300',
                    color: activeStep >= index ? 'white' : 'text.primary',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 1
                  }}
                >
                  {index + 1}
                </Box>
                <Typography variant="caption" align="center">
                  {label}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Form Content */}
        <Box sx={{ mt: 2 }}>
          {renderStepContent(activeStep)}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, justifyContent: 'space-between' }}>
        <Button 
          onClick={activeStep === 0 ? onClose : handleBack}
          disabled={paymentProcessing}
        >
          {activeStep === 0 ? 'Cancel' : 'Back'}
        </Button>
        
        <Box>
          {activeStep === steps.length - 1 ? (
            <Button
              variant="contained"
              color="primary"
              onClick={handlePayment}
              disabled={paymentProcessing}
              startIcon={paymentProcessing ? <CircularProgress size={20} color="inherit" /> : null}
            >
              {paymentProcessing ? 'Processing...' : 'Proceed to Payment'}
            </Button>
          ) : (
            <Button
              variant="contained"
              color="primary"
              onClick={handleNext}
              disabled={paymentProcessing}
            >
              Next
            </Button>
          )}
        </Box>
      </DialogActions>
    </Dialog>
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    // Add scholarshipId and userId to form data
    const applicationData = {
      ...formData,
      // Required fields from form data
      name: formData.name,
      phone: formData.phone,
      email: formData.email,
      university: formData.boarduniversity || 'Not specified',
      state: formData.state,
      fatherName: formData.fatherName,
      DOB: formData.DOB,
      gender: formData.gender,
      category: formData.category,
      Nationality: formData.Nationality,
      Address: formData.Address,
      district: formData.district,
      pin: formData.pin,
      class: formData.class,
      nameschoolcollege: formData.nameschoolcollege,
      boarduniversity: formData.boarduniversity,
      percentage: formData.percentage,
      deviceused: formData.deviceused,
      internet: formData.internet,
      language: formData.language,
      
      // System fields
      scholarshipId,
      scholarshipTitle,
      userId: account?.$id,
      status: 'pending_payment',
      applicationDate: new Date().toISOString(),
      paymentStatus: 'pending',
      payment: false,
      amount: price,
      currency: currency,
      appliedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      paymentId: '',
      createdAt: new Date().toISOString()
    };

    setLoading(true);
    
    try {
      // First save the application to get the document ID
      const docId = await saveApplication('temp_' + Date.now(), applicationData);
      
      // Store docId in state for later use
      setApplicationId(docId);
      
      // Initialize Razorpay options
      const options = {
        key: import.meta.env.VITE_PUBLIC_RAZORPAY_KEY_ID,
        amount: price * 11000, // Convert to paise
        currency: currency,
        name: `Scholar's Edge - ${scholarshipTitle}`,
        description: 'Scholarship Application Fee',
        order_id: undefined, // Will be set after creating order
        handler: async function (response: any) {
          try {
            // Update payment status on success
            await databases.updateDocument(
              DATABASE_ID,
              SCHOLARSHIP_APPLICATIONS_COLLECTION_ID,
              docId,
              {
                payment: true,
                status: 'paid',
                paymentId: response.razorpay_payment_id,
                paymentStatus: 'completed',
                updatedAt: new Date().toISOString()
              }
            );

            // Trigger the email confirmation function
            try {
              await functions.createExecution(
                '68b98ba90028773bd16d',
                JSON.stringify({
                  studentName: formData.name,
                  email: formData.email,
                  scholarshipName: scholarshipTitle,
                  applicationId: docId,
                  paymentId: response.razorpay_payment_id
                })
              );
              console.log('Confirmation email triggered successfully');
            } catch (emailError) {
              console.error('Error triggering email function:', emailError);
              toast.warning('Payment successful, but there was an issue sending the confirmation email.');
            }
            
            // Update referral points if referral code exists
            if (formData.referal) {
              try {
                await updateReferralPoints(formData.referal);
                console.log('Referral points updated successfully');
              } catch (referralError) {
                console.error('Error updating referral points:', referralError);
              }
            }
            
            setPaymentSuccess(true);
            toast.success('Payment successful! Confirmation email has been sent.');
            onClose(true);
          } catch (error) {
            console.error('Error updating payment status:', error);
            toast.error('Payment successful but failed to update application status. Please contact support.');
            onClose(true);
          }
        },
        prefill: {
          name: formData.name,
          email: formData.email,
          contact: formData.phone,
        },
        notes: {
          application_id: docId,
          scholarship_id: scholarshipId,
          scholarship_title: scholarshipTitle,
        },
        theme: {
          color: '#4f46e5',
        },
      };

      if (window.Razorpay) {
        const rzp = new window.Razorpay(options);
        
        // Handle payment failure
        rzp.on('payment.failed', async function (response: any) {
          try {
            await databases.updateDocument(
              DATABASE_ID,
              SCHOLARSHIP_APPLICATIONS_COLLECTION_ID,
              docId,
              {
                payment: false,
                status: 'payment_failed',
                paymentStatus: 'failed',
                updatedAt: new Date().toISOString()
              }
            );
            toast.error('Payment failed. Please try again.');
          } catch (error) {
            console.error('Error updating failed payment status:', error);
            toast.error('Payment failed. Please contact support for assistance.');
          } finally {
            setLoading(false);
          }
        });
        
        rzp.open();
      } else {
        throw new Error('Razorpay SDK failed to load');
      }
      
    } catch (error) {
      console.error('Error processing application:', error);
      toast.error(error.message || 'Failed to process application. Please try again.');
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {paymentSuccess ? 'Application Submitted' : `Apply for ${scholarshipTitle}`}
      </DialogTitle>
      
      {paymentSuccess ? (
        <DialogContent>
          <Box textAlign="center" py={4}>
            <CheckCircle color="success" sx={{ fontSize: 60, mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Payment Successful!
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Your application has been submitted successfully.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Application ID: {applicationId}
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={onClose}
              sx={{ mt: 3 }}
            >
              Close
            </Button>
          </Box>
        </DialogContent>
      ) : (
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                name="name"
                label="Full Name"
                value={formData.name}
                onChange={handleChange}
                fullWidth
                margin="normal"
                error={!!errors.name}
                helperText={errors.name}
                required
                disabled={loading}
              />
              <TextField
                name="email"
                label="Email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                fullWidth
                margin="normal"
                error={!!errors.email}
                helperText={errors.email}
                required
                disabled={loading}
              />
              <TextField
                name="phone"
                label="Phone Number"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                fullWidth
                margin="normal"
                error={!!errors.phone}
                helperText={errors.phone || '10-digit number'}
                required
                disabled={loading}
                inputProps={{ maxLength: 10 }}
              />
              <TextField
                name="university"
                label="University/Institution Name"
                value={formData.university}
                onChange={handleChange}
                fullWidth
                margin="normal"
                error={!!errors.university}
                helperText={errors.university}
                required
                disabled={loading}
              />
              <FormControl fullWidth margin="normal" error={!!errors.state}>
                <InputLabel id="state-label">State *</InputLabel>
                <Select
                  labelId="state-label"
                  name="state"
                  value={formData.state}
                  onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                  label="State *"
                  required
                  disabled={loading}
                >
                  <MenuItem value="">
                    <em>Select State</em>
                  </MenuItem>
                  {states.map((state) => (
                    <MenuItem key={state} value={state}>
                      {state}
                    </MenuItem>
                  ))}
                </Select>
                {errors.state && (
                  <Typography variant="caption" color="error">
                    {errors.state}
                  </Typography>
                )}
              </FormControl>

              {/* Payment Information */}
              <Paper elevation={0} sx={{ p: 2, mt: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="subtitle1">Total Amount</Typography>
                  <Typography variant="h6" color="primary">
                    {currency} {(price || 0).toFixed(2)}
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  * This is a one-time non-refundable application fee.
                </Typography>
              </Paper>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 0 }}>
            <Button 
              onClick={onClose} 
              disabled={loading}
              sx={{ color: 'text.secondary' }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
              sx={{ minWidth: 200 }}
            >
              {loading ? 'Processing...' : `Pay ${currency} ${(price || 0).toFixed(2)}`}
            </Button>
          </DialogActions>
          <Box px={3} pb={2}>
            <Typography variant="caption" color="text.secondary" align="center" display="block">
              You'll be redirected to a secure payment page
            </Typography>
          </Box>
        </form>
      )}
    </Dialog>
  );
};

export { ScholarshipApplicationForm, DEFAULT_PRICE };
