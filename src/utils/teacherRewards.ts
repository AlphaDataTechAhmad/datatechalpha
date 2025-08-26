import { databases, DATABASE_ID } from '../appwriteConfig';
import { Query } from 'appwrite';

const TEACHERS_COLLECTION_ID = '682c054e0029e175bc85';

export const updateTeacherRewards = async (teacherId: string) => {
  if (!teacherId) {
    console.error('No teacher ID provided');
    return null;
  }

  try {
    console.log('1. Looking up teacher with teacher_id:', teacherId);
    
    // 1. Find teacher by teacher_id field
    const response = await databases.listDocuments(
      DATABASE_ID,
      TEACHERS_COLLECTION_ID,
      [
        Query.equal('teacher_id', teacherId),
        Query.limit(1)
      ]
    );
    
    if (!response.documents || response.documents.length === 0) {
      console.error('❌ Teacher not found with teacher_id:', teacherId);
      return null;
    }
    
    const teacher = response.documents[0];
    console.log('2. Found teacher:', teacher);
    
    // 2. Calculate new points and referrals
    const currentPoints = Number(teacher.points) || 0;
    const currentReferrals = Number(teacher.referrals) || 0; // Using the 'referrals' field from the schema
    const pointsToAdd = 10;
    
    // 3. Prepare update data
    const updateData = {
      points: currentPoints + pointsToAdd,
      referrals: (currentReferrals + 1).toString(), // Convert to string to match schema
      updatedAt: new Date().toISOString()
    };
    
    console.log('3. Updating teacher with data:', updateData);
    
    // 4. Update teacher document
    const result = await databases.updateDocument(
      DATABASE_ID,
      TEACHERS_COLLECTION_ID,
      teacher.$id,
      updateData
    );
    
    console.log('✅ Successfully updated teacher rewards');
    return result;
  } catch (error: any) {
    console.error('❌ Error updating teacher rewards:', error);
    if (error?.response) {
      console.error('Error response:', {
        status: error.response.code,
        message: error.response.message,
        type: error.response.type
      });
    }
    throw error;
  }
};
