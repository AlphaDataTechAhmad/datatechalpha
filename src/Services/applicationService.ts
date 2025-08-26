import { databases, DATABASE_ID, INTERNSHIP_APPLICATIONS_COLLECTION_ID } from '../appwriteConfig';
import { ID } from 'appwrite';

export interface ApplicationData {
  $id: string;
  userId: string;  // Changed from user_id to userId to match collection requirements
  internship_id: string;
  full_name: string;
  email: string;
  phone: string;
  payment_id: string;
  payment_status: 'pending' | 'completed' | 'failed';
  amount: string;
  testLink: string;
  applied_at: string;
}

export const createApplication = async (data: Omit<ApplicationData, 'applied_at'>): Promise<ApplicationData> => {
  try {
    const response = await databases.createDocument(
      DATABASE_ID,
      INTERNSHIP_APPLICATIONS_COLLECTION_ID,
      ID.unique(),
      {
        ...data,
        applied_at: new Date().toISOString(),
      }
    );
    
    return response as unknown as ApplicationData;
  } catch (error) {
    console.error('Error creating application:', error);
    throw error;
  }
};

export const updatePaymentStatus = async (
  applicationId: string, 
  paymentId: string, 
  status: 'pending' | 'completed' | 'failed'
) => {
  try {
    await databases.updateDocument(
      DATABASE_ID,
      INTERNSHIP_APPLICATIONS_COLLECTION_ID,
      applicationId,
      {
        payment_id: paymentId,
        payment_status: status
      }
    );
  } catch (error) {
    console.error('Error updating payment status:', error);
    throw error;
  }
};
