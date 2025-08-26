import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import { databases, DATABASE_ID, Query } from '@/appwriteConfig';

const INTERNSHIP_TEST_LINKS_COLLECTION = '689923bc000f2d15a263'; // internship_test_links collection ID
const INTERNSHIP_APPLICATIONS_COLLECTION = '6884a2ca0003ae2e2fba'; // internship_applications collection ID

export interface InternshipTestLink {
  $id?: string;
  internship_id: string;  // snake_case
  userId: string;         // camelCase (as per Appwrite schema)
  start_date: string;     // snake_case
  expiry_date: string;    // snake_case
  is_used: boolean;       // snake_case
  created_at?: string;    // snake_case
  test_attempt_id?: string; // snake_case
  full_name: string;      // snake_case (required in schema)
  email: string;          // required in schema
  phone: string;          // required in schema
}

export const generateTestLink = async (
  internshipId: string, 
  userId: string, 
  userData: {
    full_name: string;
    email: string;
    phone: string;
    accountId?: string;  // Add accountId to userData
  }
): Promise<string> => {
  try {
    // Generate a unique test ID
    const testId = `test_${uuidv4().substring(0, 10)}`;
    const testLink = `/internship-test/${testId}`;
    
    // Set test availability (24 hours from now until 2 days after that)
    const now = dayjs();
    const startDate = now.add(1, 'day').toISOString(); // Available 24 hours from now
    const expiryDate = now.add(3, 'days').toISOString(); // Expires 2 days after becoming available
    const createdAt = now.toISOString();

    // Prepare document data with all required fields (matching schema exactly)
    const documentData = {
      userId: userId,  // Document ID of the user
      accountId: userData.accountId || userId, // Use provided accountId or fallback to userId for backward compatibility
      internship_id: internshipId,
      start_date: startDate,
      expiry_date: expiryDate,
      is_used: false,
      created_at: createdAt,
      full_name: userData.full_name,
      email: userData.email,
      phone: userData.phone || '',
      test_attempt_id: ''
    };

    console.log('Creating test link document with data:', documentData);

    // First, save to internship_test_links collection
    await databases.createDocument(
      DATABASE_ID,
      INTERNSHIP_TEST_LINKS_COLLECTION,
      testId, // Using testId as the document ID for easy lookup
      documentData
    );

    // Update the application document with the test link
    try {
      const applications = await databases.listDocuments(
        DATABASE_ID,
        INTERNSHIP_APPLICATIONS_COLLECTION,
        [
          Query.equal('userId', userId),
          Query.equal('internship_id', internshipId)
        ]
      );

      if (applications.documents.length > 0) {
        const application = applications.documents[0];
        await databases.updateDocument(
          DATABASE_ID,
          INTERNSHIP_APPLICATIONS_COLLECTION,
          application.$id,
          {
            testLink: testLink
          }
        );
      }
    } catch (error) {
      console.error('Error updating application with test link:', error);
      // Don't fail the entire operation if we can't update the application
      // The test link will still be created in the test_links collection
    }

    console.log('Test link created and saved successfully:', testLink);
    return testLink;
  } catch (error) {
    console.error('Error generating test link:', error);
    throw new Error('Failed to generate test link');
  }
};

export const validateTestLink = async (testId: string, accountId: string): Promise<{
  isValid: boolean;
  message?: string;
  testLink?: InternshipTestLink;
}> => {
  try {
    console.log('Validating test link:', { testId, accountId });
    
    // Get test link from database
    const testLink = await databases.getDocument(
      DATABASE_ID,
      INTERNSHIP_TEST_LINKS_COLLECTION,
      testId
    ) as unknown as InternshipTestLink;

    if (!testLink) {
      console.log('Test link not found');
      return { isValid: false, message: 'Invalid test link' };
    }

    console.log('Retrieved test link:', testLink);

    // Check if test is for the correct user using accountId
    if (testLink.userId !== accountId) {
      console.log('User ID mismatch:', { 
        testLinkUserId: testLink.userId, 
        currentUserAccountId: accountId 
      });
      return { 
        isValid: false, 
        message: 'You are not authorized to take this test. Please ensure you are logged in with the correct account.' 
      };
    }

    // Check if test has already been used
    if (testLink.is_used) {
      return { 
        isValid: false, 
        message: 'This test has already been submitted' 
      };
    }

    const now = dayjs();
    const startDate = dayjs(testLink.start_date);
    const expiryDate = dayjs(testLink.expiry_date);

    // Check if test is not yet available
    if (now.isBefore(startDate)) {
      return {
        isValid: false,
        message: `Your test is not yet available. Please check back at ${startDate.format('MMM D, YYYY h:mm A')}.`
      };
    }

    // Check if test has expired
    if (now.isAfter(expiryDate)) {
      return {
        isValid: false,
        message: 'This test link has expired.'
      };
    }

    return { 
      isValid: true, 
      testLink 
    };
  } catch (error) {
    console.error('Error validating test link:', error);
    return { 
      isValid: false, 
      message: 'An error occurred while validating the test link' 
    };
  }
};

export const markTestAsUsed = async (testId: string): Promise<void> => {
  try {
    await databases.updateDocument(
      DATABASE_ID,
      INTERNSHIP_TEST_LINKS_COLLECTION,
      testId,
      {
        is_used: true,
        used_at: new Date().toISOString()
      }
    );
  } catch (error) {
    console.error('Error marking test as used:', error);
    throw error;
  }
};
