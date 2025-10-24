import { useState, useEffect } from 'react';
import { databases } from '../../appwriteConfig';
import { DATABASE_ID, TECHNICAL_FORM_COLLECTION_ID } from '../../appwriteConfig';
import { toast } from 'sonner';
import { Query } from 'appwrite';

interface TechnicalTestApplicationFormProps {
  internshipId: string;
  userId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const TechnicalTestApplicationForm: React.FC<TechnicalTestApplicationFormProps> = ({
  internshipId,
  userId,
  onSuccess,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    email: '',
    mobileNumber: '',
    fullName: '',
    collegeName: '',
  });
  
  // Pre-fill user data if available
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    if (userData) {
      setFormData(prev => ({
        ...prev,
        email: userData.email || '',
        fullName: userData.name || '',
      }));
    }
  }, []);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('1. Form submitted', formData);
    
    // Check if the form is already being submitted
    if (isSubmitting) {
      console.log('Form submission already in progress');
      return;
    }
    
    console.log('2. Starting form validation');
    // Basic validation
    if (!formData.email || !formData.mobileNumber || !formData.fullName || !formData.collegeName) {
      const missingFields = [];
      if (!formData.email) missingFields.push('Email');
      if (!formData.mobileNumber) missingFields.push('Mobile Number');
      if (!formData.fullName) missingFields.push('Full Name');
      if (!formData.collegeName) missingFields.push('College/University Name');
      
      console.log('Missing required fields:', missingFields);
      toast.error(`Please fill in all required fields: ${missingFields.join(', ')}`);
      return;
    }

    console.log('3. Validating mobile number');
    // Mobile number validation
    const mobileRegex = /^[0-9]{10,15}$/; // Allow 10-15 digits
    if (!mobileRegex.test(formData.mobileNumber)) {
      const errorMsg = 'Please enter a valid 10-15 digit mobile number';
      console.error('Mobile number validation error:', errorMsg);
      toast.error(errorMsg);
      return;
    }

    console.log('4. Validating email');
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      const errorMsg = 'Please enter a valid email address';
      console.error('Email validation error:', errorMsg);
      toast.error(errorMsg);
      return;
    }

    console.log('5. All validations passed, preparing to submit');
    
    console.log('6. Setting isSubmitting to true');
    setIsSubmitting(true);
    
    try {
      
      console.log('Checking for existing applications...');
      // First, check if the user has already applied
      console.log('Using collection ID:', TECHNICAL_FORM_COLLECTION_ID);
      const existingApplications = await databases.listDocuments(
        DATABASE_ID,
        TECHNICAL_FORM_COLLECTION_ID,
        [
          Query.equal('email', formData.email),
          Query.equal('internshipId', internshipId)
        ]
      );
      
      console.log('Existing applications check result:', existingApplications);
      
      if (existingApplications.documents.length > 0) {
        console.log('Application already exists, showing info message');
        toast.info('You have already submitted an application for this technical test');
        onSuccess();
        return;
      }
      
      // Get current user data
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const documentData = {
        email: formData.email,
        mobileNumber: formData.mobileNumber,
        fullName: formData.fullName,
        collegeName: formData.collegeName,
        internshipId: internshipId,
        // Removed status and submittedAt as they're not in the schema
        // Appwrite will automatically add $id, $createdAt, and $updatedAt
      };
      
      console.log('Document data to be saved:', documentData);
      
      console.log('Attempting to create document with data:', documentData);
      
      // Save to technical_form collection
      try {
        console.log('Creating document in collection:', TECHNICAL_FORM_COLLECTION_ID);
        const result = await databases.createDocument(
          DATABASE_ID,
          TECHNICAL_FORM_COLLECTION_ID,
          'unique()',
          documentData
        );
        console.log('Document created successfully:', result);
        toast.success('Technical test application submitted successfully!');
        onSuccess();
      } catch (error) {
        console.error('Error creating document:', error);
        throw error; // This will be caught by the outer catch block
      }
    } catch (error) {
      console.error('Error submitting technical test application:', error);
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          name: error.name,
          stack: error.stack
        });
        
        if (error.message.includes('permission')) {
          toast.error('Permission denied. Please make sure you are logged in and have the necessary permissions.');
        } else if (error.message.includes('network')) {
          toast.error('Network error. Please check your internet connection and try again.');
        } else if (error.message.includes('collection')) {
          toast.error('Database error. The collection might not exist or is not accessible.');
          console.error('Collection might not exist or is not accessible. Current collection ID:', TECHNICAL_FORM_COLLECTION_ID);
        } else {
          toast.error(`Failed to submit application: ${error.message}`);
        }
      } else {
        console.error('Unknown error occurred:', error);
        toast.error('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '1rem'
    }} onClick={(e) => {
      // Close modal if clicking on the overlay
      if (e.target === e.currentTarget) {
        onCancel();
      }
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '0.75rem',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        width: '100%',
        maxWidth: '28rem',
        position: 'relative',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <div style={{ padding: '1.5rem' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem'
          }}>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: 600,
              margin: 0
            }}>Apply for Technical Test</h3>
            <button
              onClick={onCancel}
              type="button"
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1.25rem',
                cursor: 'pointer',
                color: '#6b7280',
                padding: '0.25rem',
                marginRight: '-0.5rem'
              }}
              aria-label="Close"
            >
              &times;
            </button>
          </div>
          
          <form onSubmit={(e) => {
            console.log('Form submit event fired');
            handleSubmit(e);
          }} style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <div>
              <div>
                <label htmlFor="fullName" style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: '#374151',
                  marginBottom: '0.25rem'
                }}>
                  Full Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                    outline: 'none',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    backgroundColor: 'white',
                    color: '#111827'
                  }}
                  required
                  maxLength={128}
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: '#374151',
                marginBottom: '0.25rem'
              }}>
                Email <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                  outline: 'none',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                  backgroundColor: 'white',
                  color: '#111827'
                }}
                required
                maxLength={64}
              />
            </div>

            <div>
              <label htmlFor="mobileNumber" style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: '#374151',
                marginBottom: '0.25rem'
              }}>
                Mobile Number <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="tel"
                id="mobileNumber"
                name="mobileNumber"
                value={formData.mobileNumber}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                  outline: 'none',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                  backgroundColor: 'white',
                  color: '#111827'
                }}
                required
                maxLength={15}
              />
            </div>

            <div>
              <label htmlFor="collegeName" style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: '#374151',
                marginBottom: '0.25rem'
              }}>
                College/University Name <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                id="collegeName"
                name="collegeName"
                value={formData.collegeName}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                  outline: 'none',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                  backgroundColor: 'white',
                  color: '#111827'
                }}
                required
                maxLength={128}
              />
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.75rem',
              paddingTop: '1rem',
              marginTop: '0.5rem'
            }}>
              <button
                type="button"
                onClick={onCancel}
                disabled={isSubmitting}
                style={{
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: '#374151',
                  backgroundColor: 'white',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  opacity: isSubmitting ? 0.7 : 1,
                  pointerEvents: isSubmitting ? 'none' : 'auto'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: 'white',
                  backgroundColor: '#2563eb',
                  border: '1px solid transparent',
                  borderRadius: '0.375rem',
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  opacity: isSubmitting ? 0.7 : 1,
                  pointerEvents: isSubmitting ? 'none' : 'auto'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TechnicalTestApplicationForm;
