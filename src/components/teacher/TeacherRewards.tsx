import React, { useState, useEffect } from 'react';
import { databases } from '../../Services/appwrite';
import { Query } from 'appwrite';
import { Loader2, Award, Users, BookOpen, Calendar } from 'lucide-react';
import { DATABASE_ID, TEACHER_IDS_COLLECTION_ID } from '../../config';

interface Referral {
  s: string; // studentId (first 8 chars)
  n: string; // studentName (first 15 chars)
  c: string; // courseName (first 15 chars)
  d: string; // date (YYYYMMDD)
  p: number; // pointsEarned
}

interface TeacherData {
  teacherId: string;
  points: number;
  referrals: Referral[];
}

const TeacherRewards: React.FC<{ userId: string }> = ({ userId }) => {
  const [teacherData, setTeacherData] = useState<TeacherData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalEarnings, setTotalEarnings] = useState(0);

  useEffect(() => {
    const fetchTeacherData = async () => {
      try {
        console.log('Fetching teacher data for user ID:', userId);
        // First, try to get the teacher's data using teacherId from profile
        console.log('Searching for profile with ID:', userId);
        const profileResponse = await databases.listDocuments(
          DATABASE_ID,
          '68261bb5000a54d8652b', // Profile collection ID
          [
            Query.equal('$id', userId), // Search by document ID
            Query.limit(1)
          ]
        );
        
        // If not found by document ID, try by accountId
        if (profileResponse.documents.length === 0) {
          console.log('Profile not found by document ID, trying accountId...');
          const accountResponse = await databases.listDocuments(
            DATABASE_ID,
            '68261bb5000a54d8652b',
            [
              Query.equal('accountId', userId),
              Query.limit(1)
            ]
          );
          if (accountResponse.documents.length > 0) {
            profileResponse.documents = accountResponse.documents;
          }
        }

        console.log('Profile response:', profileResponse);

        if (profileResponse.documents.length === 0) {
          console.error('No profile found for user ID:', userId);
          setError('No profile found for this user');
          setIsLoading(false);
          return;
        }

        const profile = profileResponse.documents[0];
        const teacherId = profile.teacherId;

        if (!teacherId) {
          console.error('No teacher ID found in profile for user ID:', userId);
          setError('No teacher ID found in your profile');
          setIsLoading(false);
          return;
        }

        // Now get the teacher's data using the teacherId
        const teacherResponse = await databases.listDocuments(
          DATABASE_ID,
          TEACHER_IDS_COLLECTION_ID,
          [Query.equal('teacher_id', teacherId)]
        );

        console.log('Teacher response:', teacherResponse);

        if (teacherResponse.documents.length === 0) {
          console.error('No teacher document found with ID:', teacherId);
          setError('No teacher data found for your ID');
          setIsLoading(false);
          return;
        }

        const teacherDoc = teacherResponse.documents[0];
        console.log('Teacher document:', teacherDoc);
        
        // Parse referrals from string to array if needed
        let referrals = [];
        if (teacherDoc.referrals) {
          try {
            // Handle both string and array formats
            const rawReferrals = typeof teacherDoc.referrals === 'string' 
              ? JSON.parse(teacherDoc.referrals)
              : teacherDoc.referrals;
            
            // Ensure we have an array and map to the correct format
            referrals = Array.isArray(rawReferrals) 
              ? rawReferrals.map(ref => ({
                  s: ref.s || '',
                  n: ref.n || 'Unknown',
                  c: ref.c || 'Unknown Course',
                  d: ref.d || new Date().toISOString().split('T')[0].replace(/-/g, ''),
                  p: typeof ref.p === 'number' ? ref.p : 10
                }))
              : [];
          } catch (e) {
            console.error('Error parsing referrals:', e);
            referrals = [];
          }
        }
        
        // Get points (using the correct field name from the document)
        const points = parseInt(teacherDoc.points || teacherDoc.poiints || '0', 10);
        const earnings = points * 50; // ₹50 per point
        
        // Ensure teacherId is set correctly
        const resolvedTeacherId = teacherDoc.teacher_id || teacherDoc.id || 'N/A';

        console.log('Setting teacher data:', {
          teacherId: resolvedTeacherId,
          points,
          referralCount: referrals.length,
          earnings
        });

        setTeacherData({
          teacherId: resolvedTeacherId,
          points,
          referrals: Array.isArray(referrals) ? referrals : []
        });
        setTotalEarnings(earnings);

      } catch (err) {
        console.error('Failed to fetch teacher data:', err);
        setError('Failed to load rewards data');
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      fetchTeacherData();
    }
  }, [userId]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (!teacherData) {
    return (
      <div className="text-center py-8">
        <p>No teacher data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Rewards Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-dark-800 p-6 rounded-xl shadow-md">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mr-4">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Points</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{teacherData.points}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-dark-800 p-6 rounded-xl shadow-md">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 mr-4">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Referrals</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{teacherData.referrals.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Referral History */}
      <div className="bg-white dark:bg-dark-800 rounded-xl shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-dark-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Referral History</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Your recent student enrollments through referrals</p>
        </div>
        
        {teacherData.referrals.length === 0 ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            No referral history available yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-700">
              <thead className="bg-gray-50 dark:bg-dark-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Student
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Course
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Points
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-dark-800 divide-y divide-gray-200 dark:divide-dark-700">
                {teacherData.referrals.map((referral, index) => {
                  // Format date from YYYYMMDD to DD/MM/YYYY
                  const formattedDate = referral.d 
                    ? `${referral.d.slice(6, 8)}/${referral.d.slice(4, 6)}/${referral.d.slice(0, 4)}`
                    : 'N/A';
                  
                  return (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-dark-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400">
                            <Users className="h-5 w-5" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {referral.n || 'N/A'}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {referral.s ? `${referral.s}...` : 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <BookOpen className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900 dark:text-white">
                            {referral.c || 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formattedDate}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-green-600 dark:text-green-400">
                        +{referral.p || 10}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Referral Information */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mb-2">Your Referral Code</h3>
        <div className="flex items-center">
          <div className="relative flex-1">
            <input
              type="text"
              readOnly
              value={teacherData.teacherId}
              className="w-full px-4 py-3 bg-white dark:bg-dark-700 border border-blue-300 dark:border-blue-700 rounded-lg text-blue-900 dark:text-blue-100 font-mono font-bold text-lg"
            />
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(teacherData.teacherId);
              // You might want to add a toast notification here
              alert('Referral code copied to clipboard!');
            }}
            className="ml-3 inline-flex items-center px-4 py-3 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Copy Code
          </button>
        </div>
        <p className="mt-3 text-sm text-blue-700 dark:text-blue-300">
          Share this code with your students. They'll get ₹500 off their enrollment, and you'll earn 10 points for each successful referral!
        </p>
      </div>
    </div>
  );
};

export default TeacherRewards;
