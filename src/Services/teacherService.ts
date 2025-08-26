import { ID, Query, type Models } from 'appwrite';
import { 
  databases, 
  authenticatedRequest, 
  DATABASE_ID, 
  TEACHER_IDS_COLLECTION_ID, 
  PROFILE_COLLECTION_ID 
} from './appwrite';

// Define the TeacherID type
export interface TeacherID {
  $id: string;
  $collectionId: string;
  $databaseId: string;
  $createdAt: string;
  $updatedAt: string;
  $permissions: string[];
  teacher_id: string;
  is_used: boolean;
  claimed_by?: string;
  claimed_at?: string;
  userId?: string;
  isVerified?: boolean;
}

// TeacherID interface is now extending Models.Document above

interface EnrollmentDocument extends Models.Document {
  // Add properties for EnrollmentDocument as needed
}

interface EnrollmentsResult {
  documents: EnrollmentDocument[];
  total: number;
}

export const initializeTeacherIDs = async (teacherIDs: Array<{teacher_id: string, is_used: boolean}>) => {
  try {
    // Appwrite client and databases are already initialized in appwrite.ts
// This file focuses on teacher ID related functionality
    // Check if collection already has documents
    const existingIDs = await databases.listDocuments(
      DATABASE_ID,
      TEACHER_IDS_COLLECTION_ID
    );

    // If no documents exist, create them
    if (existingIDs.total === 0) {
      console.log('Initializing teacher IDs in database...');
      const promises = teacherIDs.map(teacherID => {
        const permissions = [
          'read(any)',
          'update(any)',
          'delete(any)'
        ];

        return databases.createDocument(
          DATABASE_ID,
          TEACHER_IDS_COLLECTION_ID,
          ID.unique(),
          {
            teacher_id: teacherID.teacher_id,
            is_used: teacherID.is_used,
            userId: '',
            isVerified: false
          },
          permissions
        );
      });
      
      await Promise.all(promises);
      console.log('Successfully initialized teacher IDs');
    }
  } catch (error) {
    console.error('Error initializing teacher IDs:', error);
    throw error;
  }
};

/**
 * Verify if a teacher ID is valid and available
 */
export const verifyTeacherID = async (teacherID: string): Promise<{valid: boolean, message: string}> => {
  return authenticatedRequest(async () => {
    console.log(`[DEBUG] Verifying teacher ID: ${teacherID}`);
    
    try {
      // First check if there's any teacher profile with this ID
      const existingTeachers = await databases.listDocuments<TeacherID>(
        DATABASE_ID,
        TEACHER_IDS_COLLECTION_ID,
        [Query.equal('teacher_id', teacherID)]
      );

      console.log('[DEBUG] Query result count:', existingTeachers.documents.length);
      console.log('[DEBUG] Query result:', JSON.stringify(existingTeachers, null, 2));

      // If no document found with this teacher_id, it's invalid
      if (existingTeachers.documents.length === 0) {
        console.log('[DEBUG] No teacher profile found with ID:', teacherID);
        return { valid: false, message: 'Invalid Teacher ID' };
      }

      const teacherProfile = existingTeachers.documents[0];
      console.log('[DEBUG] Teacher profile found:', {
        teacher_id: teacherProfile.teacher_id,
        userId: teacherProfile.userId,
        isVerified: teacherProfile.isVerified,
        is_used: teacherProfile.is_used,
        claimed_by: teacherProfile.claimed_by
      });
      
      // Check if the ID is already in use (either is_used is true or isVerified is true)
      const isInUse = teacherProfile.is_used || teacherProfile.isVerified;
      console.log('[DEBUG] isInUse check:', {
        userIdExists: !!teacherProfile.userId,
        isVerified: teacherProfile.isVerified,
        is_used: teacherProfile.is_used,
        result: isInUse
      });
      
      if (isInUse) {
        console.log('[DEBUG] Teacher ID is already in use by user:', teacherProfile.userId || 'marked as used');
        return { 
          valid: false, 
          message: 'This Teacher ID is already in use by another teacher' 
        };
      }

      // If we get here, the ID is valid and available
      console.log('[DEBUG] Teacher ID is valid and available:', teacherID);
      return { 
        valid: true, 
        message: 'Valid Teacher ID - Available for registration' 
      };
    } catch (error) {
      console.error('[DEBUG] Error in verifyTeacherID:', error);
      return { 
        valid: false, 
        message: 'Error verifying Teacher ID. Please try again.' 
      };
    }
  }, { retryOnAuthFailure: true });
};

// Debug function to check teacher ID status
export const debugCheckTeacherID = async (teacherID: string) => {
  try {
    console.log(`[DEBUG] Checking teacher ID: ${teacherID}`);
    const response = await databases.listDocuments<TeacherID>(
      DATABASE_ID,
      TEACHER_IDS_COLLECTION_ID,
      [Query.equal('teacher_id', teacherID)]
    );
    
    if (response.documents.length === 0) {
      console.log(`[DEBUG] No record found for teacher ID: ${teacherID}`);
      return null;
    }
    
    const doc = response.documents[0];
    console.log('[DEBUG] Teacher ID record:', {
      id: doc.$id,
      teacher_id: doc.teacher_id,
      is_used: doc.is_used,
      isVerified: doc.isVerified,
      userId: doc.userId,
      claimed_by: doc.claimed_by,
      $createdAt: doc.$createdAt,
      $updatedAt: doc.$updatedAt
    });
    
    return doc;
  } catch (error) {
    console.error('[DEBUG] Error in debugCheckTeacherID:', error);
    return null;
  }
};

export const getTeacherIDByUser = async (userId: string): Promise<string | null> => {
  console.log(`[DEBUG][${new Date().toISOString()}] Starting teacher ID lookup for user: ${userId}`);
  
  if (!userId) {
    console.error('[ERROR] No user ID provided to getTeacherIDByUser');
    return null;
  }

  try {
    // 1. First, try to get the teacher ID from the user's profile document
    try {
      console.log('[DEBUG] Querying profile collection with accountId:', userId);
      console.log('[DEBUG] Database ID:', DATABASE_ID);
      console.log('[DEBUG] Profile Collection ID:', PROFILE_COLLECTION_ID);
      
      const profileResponse = await databases.listDocuments(
        DATABASE_ID,
        PROFILE_COLLECTION_ID,
        [
          Query.equal('$id', userId)  // Changed from 'accountId' to '$id' as per Appwrite's default
        ]
      );

      console.log(`[DEBUG] Profile query result:`, {
        total: profileResponse.total,
        documents: profileResponse.documents.length,
        documentIds: profileResponse.documents.map(doc => doc.$id)
      });

      if (profileResponse.documents.length > 0) {
        const profile = profileResponse.documents[0];
        console.log('[DEBUG] User profile fields:', Object.keys(profile));
        console.log('[DEBUG] Full profile data:', JSON.stringify(profile, null, 2));
        
        // Check for different possible field names
        const possibleFields = ['teacherId', 'teacher_id', 'teacherID', 'teacherId'];
        for (const field of possibleFields) {
          if (profile[field]) {
            console.log(`[DEBUG] Found teacher ID in profile.${field}: ${profile[field]}`);
            return profile[field];
          }
        }
        console.log('[DEBUG] No teacher ID field found in user profile');
      } else {
        console.log('[DEBUG] No user profile document found for user ID:', userId);
      }
    } catch (profileError) {
      console.error('[ERROR] Error fetching user profile:', profileError);
    }

    // 2. Fallback: Check the teacher IDs collection for any ID claimed by this user
    try {
      console.log('[DEBUG] Checking teacher IDs collection for claimed ID...');
      console.log('[DEBUG] Teacher IDs Collection ID:', TEACHER_IDS_COLLECTION_ID);
      
      const response = await databases.listDocuments(
        DATABASE_ID,
        TEACHER_IDS_COLLECTION_ID,
        [
          Query.equal('claimed_by', userId),
          Query.equal('is_claimed', true)  // Make sure we only get claimed IDs
        ]
      );

      console.log(`[DEBUG] Teacher IDs query returned:`, {
        total: response.total,
        documents: response.documents.length,
        documentIds: response.documents.map(doc => doc.$id)
      });
      
      if (response.documents.length > 0) {
        const teacherId = response.documents[0].teacher_id || response.documents[0].teacherId;
        console.log(`[DEBUG] Found claimed teacher ID:`, teacherId);
        return teacherId;
      } else {
        console.log('[DEBUG] No claimed teacher IDs found for this user');
      }
    } catch (error) {
      console.error('[ERROR] Error querying teacher IDs collection:', error);
    }
    
    // 3. As a last resort, check if the user's ID is in the teacher IDs collection
    try {
      console.log('[DEBUG] Checking if user ID exists in teacher IDs collection...');
      const response = await databases.listDocuments(
        DATABASE_ID,
        TEACHER_IDS_COLLECTION_ID,
        [
          Query.equal('$id', userId)
        ]
      );

      if (response.documents.length > 0) {
        const teacherId = response.documents[0].teacher_id || response.documents[0].teacherId;
        console.log(`[DEBUG] Found user in teacher IDs collection with ID:`, teacherId);
        return teacherId;
      }
    } catch (error) {
      console.error('[ERROR] Error checking user ID in teacher IDs collection:', error);
    }
    
    console.log('[DEBUG] No teacher ID found after all checks');
    return null;
  } catch (error) {
    console.error('[ERROR] Unexpected error in getTeacherIDByUser:', error);
    return null;
  }
};

/**
 * Claim a teacher ID for a user
 */
// Interface for enrolled student data
export interface EnrolledStudent {
  userId: string;
  studentId: string;
  name: string;
  email: string;
  enrollmentDate: string;
  progress: number;
  courseId: string;
  courseName: string;
}

/**
 * Get list of students enrolled in courses taught by a teacher
 * @param teacherId - ID of the teacher
 * @param courseId - Optional course ID to filter students by a specific course
 */
// Helper function to debug enrollment data
export const debugEnrollments = async (teacherId: string) => {
  console.log('=== DEBUGGING ENROLLMENTS ===');
  
  try {
    // 1. Get all courses for the teacher
    console.log('\n1. Fetching courses for teacher:', teacherId);
    const courses = await databases.listDocuments(
      DATABASE_ID,
      '682644ed002b437582d3', // Courses collection
      [Query.equal('teacherId', teacherId), Query.limit(100)]
    );
    
    console.log(`Found ${courses.total} courses:`, 
      courses.documents.map(c => ({
        id: c.$id, 
        courseId: c.courseId, 
        name: c.name || c.courseName
      }))
    );
    
    if (courses.total === 0) {
      console.log('No courses found for this teacher');
      return [];
    }
    
    const courseIds = courses.documents.map(c => c.courseId || c.$id);
    
    // 2. Get all enrollments
    console.log('\n2. Fetching all enrollments...');
    const allEnrollments = await databases.listDocuments(
      DATABASE_ID,
      '684dc01f003312e04f0c', // Enrollments collection
      [Query.limit(100)]
    );
    
    console.log(`Found ${allEnrollments.total} total enrollments`);
    console.log('Sample enrollments:', 
      allEnrollments.documents.slice(0, 3).map(e => ({
        id: e.$id,
        userId: e.userId,
        courseId: e.courseId,
        status: e.status
      }))
    );
    
    // 3. Get enrollments for teacher's courses
    console.log('\n3. Filtering enrollments for teacher\'s courses...');
    const teacherEnrollments = allEnrollments.documents.filter(
      e => courseIds.includes(e.courseId)
    );
    
    console.log(`Found ${teacherEnrollments.length} enrollments for teacher's courses`);
    
    // 4. Get profiles for enrolled students
    console.log('\n4. Fetching student profiles...');
    const studentProfiles = await Promise.all(
      [...new Set(teacherEnrollments.map(e => e.userId))].map(async userId => {
        try {
          const profiles = await databases.listDocuments(
            DATABASE_ID,
            PROFILE_COLLECTION_ID,
            [Query.equal('userId', userId), Query.limit(1)]
          );
          return profiles.documents[0];
        } catch (error) {
          console.error(`Error fetching profile for user ${userId}:`, error);
          return null;
        }
      })
    );
    
    console.log(`Found ${studentProfiles.filter(Boolean).length} student profiles`);
    
    // 5. Return combined data
    const result = teacherEnrollments.map(enrollment => {
      const course = courses.documents.find(c => c.courseId === enrollment.courseId || c.$id === enrollment.courseId);
      const profile = studentProfiles.find(p => p?.userId === enrollment.userId);
      
      return {
        userId: enrollment.userId,
        studentId: enrollment.studentId || 'N/A',
        name: profile?.name || 'Unknown',
        email: profile?.email || 'No email',
        enrollmentDate: enrollment.enrollmentDate || new Date().toISOString(),
        progress: enrollment.progress || 0,
        courseId: enrollment.courseId,
        courseName: course?.name || course?.courseName || 'Unknown Course'
      };
    });
    
    console.log('\n=== DEBUG COMPLETE ===');
    console.log('Final student data:', result);
    
    return result;
    
  } catch (error) {
    console.error('Debug error:', error);
    throw error;
  }
};

export const getEnrolledStudents = async (teacherId: string, courseId?: string): Promise<EnrolledStudent[]> => {
  console.log('Starting getEnrolledStudents with teacherId:', teacherId, 'courseId:', courseId);
  
  try {
    // Verify the teacher ID is valid
    console.log('Verifying teacher ID:', teacherId);
    const teacherIdResponse = await databases.listDocuments(
      DATABASE_ID,
      TEACHER_IDS_COLLECTION_ID,
      [Query.equal('teacher_id', teacherId)]
    );
    
    if (teacherIdResponse.total === 0) {
      console.error('No teacher found with ID:', teacherId);
      throw new Error('Invalid teacher ID');
    }
    
    // Get course IDs
    let courseIds: string[] = [];
    if (courseId) {
      console.log('Using provided course ID:', courseId);
      courseIds = [courseId];
    } else {
      console.log('Fetching all courses for teacher:', teacherId);
      const courses = await databases.listDocuments(
        DATABASE_ID,
        '682644ed002b437582d3', // Courses collection
        [
          Query.equal('teacherId', teacherId),
          Query.limit(100)
        ]
      );
      
      console.log(`Found ${courses.total} courses for teacher`);
      
      if (courses.total === 0) {
        console.log('No courses found for teacher');
        return [];
      }
      
      courseIds = courses.documents.map(course => course.courseId || course.$id);
    }
    
    if (courseIds.length === 0) {
      console.log('No course IDs to fetch enrollments for');
      return [];
    }
    
    console.log('Fetching enrollments for course IDs:', courseIds);
    
    // Get all enrollments for these courses
    const enrollmentPromises = courseIds.map(courseId => 
      databases.listDocuments(
        DATABASE_ID,
        '684dc01f003312e04f0c', // Enrollments collection
        [
          Query.equal('status', 'active'),
          Query.equal('courseId', courseId)
        ]
      )
    );
    
    const enrollmentResults = await Promise.all(enrollmentPromises);
    const allEnrollments = enrollmentResults.flatMap(result => result.documents);
    
    console.log(`Found ${allEnrollments.length} total enrollments`);
    
    if (allEnrollments.length === 0) {
      console.log('No active enrollments found for courses');
      return [];
    }
    
    // Get unique user IDs from enrollments
    const userIds = [...new Set(allEnrollments.map(e => e.userId))];
    console.log(`Fetching profiles for ${userIds.length} users`);
    
    // Get all profiles in one batch
    const profilesResponse = await databases.listDocuments(
      DATABASE_ID,
      PROFILE_COLLECTION_ID,
      [
        Query.limit(1000), // Adjust based on your needs
        ...userIds.map(id => Query.equal('userId', id))
      ]
    );
    
    const profiles = profilesResponse.documents;
    console.log(`Found ${profiles.length} profiles`);
    
    // Create a map of userId to profile for quick lookup
    const profileMap = new Map(profiles.map(p => [p.userId, p]));
    
    // Combine enrollment data with profile data
    const result = allEnrollments
      .map(enrollment => {
        const profile = profileMap.get(enrollment.userId);
        
        if (!profile) {
          console.log(`No profile found for user ${enrollment.userId}`);
          return null;
        }
        
        return {
          userId: enrollment.userId,
          studentId: enrollment.studentId || 'N/A',
          name: profile.name || 'Unknown',
          email: profile.email || 'No email',
          enrollmentDate: enrollment.enrollmentDate || new Date().toISOString(),
          progress: enrollment.progress || 0,
          courseId: enrollment.courseId,
          courseName: enrollment.courseName || 'Unknown Course'
        };
      })
      .filter(Boolean) as EnrolledStudent[]; // Remove any null entries
    
    console.log('Returning', result.length, 'enrolled students');
    return result;
    
  } catch (error) {
    console.error('Error in getEnrolledStudents:', error);
    throw new Error('Failed to fetch enrolled students. Please check your permissions and try again.');
  }
};

export const claimTeacherID = async (teacherID: string, userId: string): Promise<boolean> => {
  return authenticatedRequest(async () => {
    // First verify the teacher ID exists and is available
    const verification = await verifyTeacherID(teacherID);
    
    if (!verification.valid) {
      console.error('Cannot claim teacher ID:', verification.message);
      return false;
    }

    // Get the teacher profile
    const response = await databases.listDocuments<TeacherID>(
      DATABASE_ID,
      TEACHER_IDS_COLLECTION_ID,
      [Query.equal('teacher_id', teacherID)]
    );

    if (response.documents.length === 0) {
      console.error('Teacher ID not found');
      return false;
    }

    const teacherProfile = response.documents[0];
    
    // Double-check that the ID isn't already claimed by another user
    if (teacherProfile.userId && teacherProfile.isVerified) {
      console.error('Teacher ID is already in use by another user');
      return false;
    }
    
    // Update the teacher profile to associate with the user and mark as used
    await databases.updateDocument(
      DATABASE_ID,
      TEACHER_IDS_COLLECTION_ID,
      teacherProfile.$id,
      {
        userId: userId,
        isVerified: true,
        is_used: true,
        updatedAt: new Date().toISOString()
      }
    );

    console.log(`Successfully claimed teacher ID ${teacherID} for user ${userId}`);
    return true;
  }, { retryOnAuthFailure: true });
};
