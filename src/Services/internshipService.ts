import { client, databases, DATABASE_ID, INTERNSHIPS_COLLECTION_ID, authenticatedRequest } from '../appwriteConfig';
import { Query, Models } from 'appwrite';

// Types
export interface Internship {
  $id?: string;
  title: string;
  slug: string;
  description: string;
  shortDescription: string;
  duration: string;
  level: string;
  startDate: string;
  endDate: string;
  isActive?: boolean;
  maxStudents?: number;
  currentStudents?: number;
  price: number;
  currency: string;
  tags?: string[];
  image?: string;
  projects?: any[];
  videos?: any[];
  liveSessions?: any[];
}

export const createInternship = async (internshipData: Omit<Internship, '$id'>) => {
  try {
    const response = await databases.createDocument(
      DATABASE_ID,
      INTERNSHIPS_COLLECTION_ID,
      'unique()', // Auto-generate document ID
      internshipData
    );
    return response;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create internship';
    console.error('Error creating internship:', errorMessage);
    throw new Error(errorMessage);
  }
};

export const getInternshipBySlug = async (slug: string): Promise<Internship> => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      INTERNSHIPS_COLLECTION_ID,
      [Query.equal('slug', slug)]
    );
    
    if (response.documents.length === 0) {
      throw new Error('Internship not found');
    }
    
    return response.documents[0] as unknown as Internship;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch internship';
    console.error('Error fetching internship:', errorMessage);
    throw new Error(errorMessage);
  }
};

/**
 * Get all internships with proper authentication handling
 * Uses the authenticatedRequest pattern to automatically handle session refresh
 */
export const getAllInternships = async (): Promise<Internship[]> => {
  try {
    console.log('Fetching internships from Appwrite...', {
      databaseId: DATABASE_ID,
      collectionId: INTERNSHIPS_COLLECTION_ID
    });

    // Use the authenticated request pattern which will handle session refresh automatically
    const response = await authenticatedRequest(
      async () => {
        // Prepare the queries
        const queries = [
          Query.orderDesc('$createdAt'),
          Query.limit(50)
        ];
        
        // Make the API call
        return await databases.listDocuments(
          DATABASE_ID,
          INTERNSHIPS_COLLECTION_ID,
          queries
        );
      },
      { retryOnAuthFailure: true }
    );
    
    // Process the response
    if (!response || !response.documents) {
      console.error('Invalid response format from Appwrite:', response);
      throw new Error('Failed to fetch internships: Invalid response format');
    }
    
    // Map the documents to Internship objects
    const internships = response.documents.map((doc: Models.Document) => ({
      $id: doc.$id,
      title: doc.title,
      slug: doc.slug,
      description: doc.description,
      shortDescription: doc.shortDescription,
      duration: doc.duration,
      level: doc.level,
      startDate: doc.startDate,
      endDate: doc.endDate,
      isActive: doc.isActive || false,
      maxStudents: doc.maxStudents || 0,
      currentStudents: doc.currentStudents || 0,
      price: doc.price || 0,
      currency: doc.currency || 'INR',
      tags: doc.tags || [],
      image: doc.image || '',
      projects: doc.projects || [],
      videos: doc.videos || [],
      liveSessions: doc.liveSessions || [],
      $createdAt: doc.$createdAt,
      $updatedAt: doc.$updatedAt,
    }));
    
    console.log(`Fetched ${internships.length} internships`);
    return internships;
  } catch (error) {
    console.error('Error fetching internships:', error);
    throw new Error(
      error instanceof Error 
        ? error.message 
        : 'An unknown error occurred while fetching internships'
    );
  }
};

export const updateInternship = async (internshipId: string, updates: Partial<Internship>) => {
  try {
    const response = await databases.updateDocument(
      DATABASE_ID,
      INTERNSHIPS_COLLECTION_ID,
      internshipId,
      updates
    );
    return response;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update internship';
    console.error('Error updating internship:', errorMessage);
    throw new Error(errorMessage);
  }
};

export const enrollInInternship = async (internshipId: string, userEmail: string) => {
  try {
    // First, get the current internship to check max students
    const internship = await databases.getDocument(
      DATABASE_ID,
      INTERNSHIPS_COLLECTION_ID,
      internshipId
    ) as unknown as Internship;

    // Check if there's space available
    if (internship.maxStudents && internship.currentStudents && 
        internship.currentStudents >= internship.maxStudents) {
      throw new Error('This internship is already at maximum capacity');
    }

    // In a real app, you would create a new enrollment record in a separate collection
    // For now, we'll just increment the currentStudents count
    const updatedInternship = await databases.updateDocument(
      DATABASE_ID,
      INTERNSHIPS_COLLECTION_ID,
      internshipId,
      {
        currentStudents: (internship.currentStudents || 0) + 1
      }
    );

    // Send test invitation email
    await sendTestInvitation(userEmail, internship.title);

    return updatedInternship;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to enroll in internship';
    console.error('Error enrolling in internship:', errorMessage);
    throw new Error(errorMessage);
  }
};

/**
 * Sends a test invitation email to the candidate using Appwrite's email service
 * @param email - Candidate's email address
 * @param internshipName - Name of the internship
 */
export const sendTestInvitation = async (email: string, internshipName: string) => {
  try {
    // Create the test link (update with your actual test URL structure)
    const testLink = `${window.location.origin}/internship-test/${internshipName.toLowerCase().replace(/\s+/g, '-')}`;
    
    // In a real implementation, you would use Appwrite's Messaging service or a cloud function
    // to send the email. This is a placeholder for that implementation.
    console.log('Sending test invitation to:', email);
    console.log('Test link:', testLink);
    
    // Example of how you might call an Appwrite Function to send the email
    // const functions = new Functions(client);
    // const response = await functions.createExecution(
    //   'YOUR_FUNCTION_ID',
    //   JSON.stringify({
    //     email,
    //     subject: `Link for Internship entrance Test - ${internshipName}`,
    //     message: `
    //       <p>Hello,</p>
    //       <p>This mail was sent to you regarding the <b>Internship Entrance Exam Test</b> for <b>${internshipName}</b> conducted by <b>DataTech Alpha Pvt. Ltd.</b>.</p>
    //       <p><a href="${testLink}" target="_blank" style="font-size: 14px; font-family: Inter, sans-serif; color: #ffffff; text-decoration: none; background-color: #2D2D31; border-radius: 8px; padding: 9px 14px; border: 1px solid #414146; display: inline-block; text-align:center; box-sizing: border-box;">Start Your Test</a></p>
    //       <p>Your online exam link will be active for 24 hours.</p>
    //       <p style="margin-bottom: 32px">
    //           Thanks,<br/>
    //           DataTech Alpha Team
    //       </p>
    //     `,
    //     sender: 'hr@datatechalpha.com',
    //     senderName: 'DATA TECH ALPHA'
    //   })
    // );
    
    // For now, we'll return a mock response
    return { success: true, message: 'Test invitation email would be sent here' };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to send test invitation';
    console.error('Error sending test invitation:', errorMessage);
    throw new Error(errorMessage);
  }
};
