import { useState, useEffect } from 'react';
import { databases, TESTS_COLLECTION_ID } from '../../appwriteConfig';
import { DATABASE_ID, INTERNSHIPS_COLLECTION_ID } from '../../appwriteConfig';
const INTERNSHIP_TEST_LINKS_COLLECTION = '689923bc000f2d15a263'; // Collection ID for internship_test_links
import { Query, ID } from 'appwrite';
import { toast } from 'sonner';

interface TestResult {
  score?: number;
  totalMarks?: number;
  percentage?: number;
  passed?: boolean;
  submittedAt?: string;
}

interface Internship {
  title: string;
  description: string;
}

interface TestLinkDocument {
  $id: string;
  email: string;
  userId: string;
  internship_id: string;
  start_date: string;
  expiry_date: string;
  is_used: boolean;
  test_attempt_id: string;
  full_name: string;
  phone: string;
  $createdAt: string;
  $updatedAt: string;
  test_result?: TestResult;
  internship?: Internship; // Will be populated later
}

export default function TestLinksManager() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingInternships, setIsFetchingInternships] = useState(false);
  const [testLinks, setTestLinks] = useState<TestLinkDocument[]>([]);
  const [internships, setInternships] = useState<Record<string, string>>({});
  const [selectedLinks, setSelectedLinks] = useState<Set<string>>(new Set());

  // Fetch all internships on component mount
  useEffect(() => {
    const fetchInternships = async () => {
      try {
        setIsFetchingInternships(true);
        const response = await databases.listDocuments(
          DATABASE_ID,
          INTERNSHIPS_COLLECTION_ID,
          [Query.limit(100)]
        );
        
        const internshipMap: Record<string, string> = {};
        response.documents.forEach((doc: any) => {
          internshipMap[doc.$id] = doc.title;
        });
        setInternships(internshipMap);
      } catch (error) {
        console.error('Error fetching internships:', error);
        toast.error('Failed to load internships');
      } finally {
        setIsFetchingInternships(false);
      }
    };

    fetchInternships();
  }, []);

  const fetchTestResults = async (testAttemptId: string) => {
    if (!testAttemptId) return null;
    
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        'test_results', // Replace with your test results collection ID
        [
          Query.equal('test_attempt_id', testAttemptId),
          Query.limit(1)
        ]
      );
      
      return response.documents[0] || null;
    } catch (error) {
      console.error('Error fetching test result:', error);
      return null;
    }
  };

  const searchTestLinks = async () => {
    if (!email.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    setIsLoading(true);
    try {
      // Fetch test links
      const response = await databases.listDocuments(
        DATABASE_ID,
        INTERNSHIP_TEST_LINKS_COLLECTION,
        [
          Query.equal('email', email.trim().toLowerCase()),
          Query.orderDesc('$createdAt'),
          Query.limit(50) // Limit to 50 most recent test links
        ]
      );
      
      if (response.documents.length === 0) {
        setTestLinks([]);
        toast.info('No test links found for this email');
        return;
      }
      
      const links = response.documents as unknown as TestLinkDocument[];
      
      // Enhance links with test results and internship titles
      const enhancedLinks = await Promise.all(links.map(async (link: any) => {
        let testResult = null;
        
        // Only fetch test results if the test has been attempted
        if (link.test_attempt_id) {
          try {
            testResult = await fetchTestResults(link.test_attempt_id);
          } catch (error) {
            console.error('Error fetching test result:', error);
            // Continue even if test result fetch fails
          }
        }
        
        return {
          ...link,
          test_result: testResult || undefined,
          internship_title: internships[link.internship_id] || 'Unknown Internship',
          // Format dates for display
          createdDate: new Date(link.$createdAt).toLocaleDateString(),
          expiryDate: link.expiry_date ? new Date(link.expiry_date).toLocaleDateString() : 'N/A'
        };
      }));
      
      setTestLinks(enhancedLinks);
      toast.success(`Found ${enhancedLinks.length} test links`);
    } catch (error) {
      console.error('Error fetching test links:', error);
      toast.error('Failed to fetch test links');
      setTestLinks([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (link: TestLinkDocument) => {
    // If test_result exists, show passed/failed status with score
    if (link.test_result) {
      const { passed, percentage, score, totalMarks } = link.test_result;
      const scoreText = score !== undefined && totalMarks !== undefined 
        ? `${score}/${totalMarks} ` 
        : '';
      const percentageText = percentage !== undefined ? `(${percentage}%)` : '';
      
      return (
        <span className={`px-2 py-1 text-xs rounded-full ${
          passed 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {passed ? 'Passed ' : 'Failed '}
          {scoreText}
          {percentageText && <span className="ml-1">{percentageText}</span>}
        </span>
      );
    }
    
    // Check if test was started but not completed
    if (link.test_attempt_id) {
      return <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">In Progress</span>;
    }
    
    // Check if test link has been used but no attempt ID
    if (link.is_used) {
      return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Started</span>;
    }
    
    // Default case - not started
    return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">Not Started</span>;
  };

  const [deletingIds, setDeletingIds] = useState<Record<string, boolean>>({});

  const deleteTestLink = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this test link? This action cannot be undone.')) {
      return;
    }

    setDeletingIds(prev => ({ ...prev, [id]: true }));

    try {
      await databases.deleteDocument(
        DATABASE_ID,
        INTERNSHIP_TEST_LINKS_COLLECTION,
        id
      );
      
      setTestLinks(testLinks.filter(link => link.$id !== id));
      toast.success('Test link deleted successfully');
    } catch (error) {
      console.error('Error deleting test link:', error);
      toast.error('Failed to delete test link');
    } finally {
      setDeletingIds(prev => {
        const newDeleting = { ...prev };
        delete newDeleting[id];
        return newDeleting;
      });
    }
  };

  const deleteMultipleTestLinks = async (ids: string[]) => {
    if (!window.confirm(`Are you sure you want to delete ${ids.length} test links? This action cannot be undone.`)) {
      return;
    }

    const deletingState: Record<string, boolean> = {};
    ids.forEach(id => { deletingState[id] = true; });
    setDeletingIds(prev => ({ ...prev, ...deletingState }));

    const successfulDeletions = [];
    const failedDeletions = [];

    try {
      // Process deletions one by one to handle errors gracefully
      for (const id of ids) {
        try {
          await databases.deleteDocument(
            DATABASE_ID, 
            INTERNSHIP_TEST_LINKS_COLLECTION, // Use the correct collection ID
            id
          );
          successfulDeletions.push(id);
        } catch (error) {
          console.error(`Error deleting test link ${id}:`, error);
          failedDeletions.push(id);
        }
      }
      
      // Update the UI to remove successfully deleted items
      if (successfulDeletions.length > 0) {
        setTestLinks(prevLinks => 
          prevLinks.filter(link => !successfulDeletions.includes(link.$id))
        );
      }

      // Show appropriate success/error messages
      if (successfulDeletions.length > 0) {
        toast.success(`Successfully deleted ${successfulDeletions.length} test links`);
      }
      if (failedDeletions.length > 0) {
        toast.error(`Failed to delete ${failedDeletions.length} test links`);
      }
      
    } catch (error) {
      console.error('Unexpected error during deletion:', error);
      toast.error('An unexpected error occurred while deleting test links');
    } finally {
      // Clear the loading state for all processed IDs
      setDeletingIds(prev => {
        const newDeleting = { ...prev };
        ids.forEach(id => delete newDeleting[id]);
        return newDeleting;
      });
    }
  };

  const toggleSelectLink = (id: string) => {
    setSelectedLinks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedLinks.size === testLinks.length) {
      setSelectedLinks(new Set());
    } else {
      setSelectedLinks(new Set(testLinks.map(link => link.$id)));
    }
  };

  const handleBulkDelete = () => {
    if (selectedLinks.size === 0) {
      toast.error('No test links selected');
      return;
    }
    deleteMultipleTestLinks(Array.from(selectedLinks));
  };

  const findDuplicateTestLinks = async () => {
    setIsLoading(true);
    try {
      // First, get all test links
      const response = await databases.listDocuments(
        DATABASE_ID,
        INTERNSHIP_TEST_LINKS_COLLECTION,
        [
          Query.orderAsc('email'),
          Query.orderAsc('internship_id'),
          Query.orderDesc('$createdAt'),
          Query.limit(10000)
        ]
      );

      const links = response.documents as unknown as TestLinkDocument[];
      const seen = new Map();
      const duplicateGroups = new Map();

      // Group links by email and internship_id
      for (const link of links) {
        const key = `${link.email}:${link.internship_id}`;
        if (!duplicateGroups.has(key)) {
          duplicateGroups.set(key, []);
        }
        duplicateGroups.get(key).push(link);
      }

      // Filter to only include groups with duplicates
      const duplicates = Array.from(duplicateGroups.values())
        .filter(group => group.length > 1)
        .flat();

      if (duplicates.length === 0) {
        toast.info('No duplicate test links found');
        setTestLinks([]);
        return;
      }

      // Enhance with internship titles and test results
      const enhancedLinks = await Promise.all(
        duplicates.map(async (link) => {
          let testResult = null;
          if (link.test_attempt_id) {
            try {
              testResult = await fetchTestResults(link.test_attempt_id);
            } catch (error) {
              console.error('Error fetching test result:', error);
            }
          }
          
          return {
            ...link,
            test_result: testResult || undefined,
            internship_title: internships[link.internship_id] || 'Unknown Internship'
          };
        })
      );

      setTestLinks(enhancedLinks);
      toast.success(`Found ${duplicates.length} duplicate test links`);
    } catch (error) {
      console.error('Error finding duplicate test links:', error);
      toast.error('Failed to find duplicate test links');
    } finally {
      setIsLoading(false);
    }
  };

  const removeDuplicateTestLinks = async () => {
    if (!window.confirm('⚠️ This will remove all unused duplicate test links, keeping only the most recent one for each user and internship combination. Continue?')) {
      return;
    }

    setIsLoading(true);
    try {
      // First, get all test links ordered by email, internship_id, and creation date
      const response = await databases.listDocuments(
        DATABASE_ID,
        INTERNSHIP_TEST_LINKS_COLLECTION,
        [
          Query.orderAsc('email'),
          Query.orderAsc('internship_id'),
          Query.orderDesc('is_used'),  // Put used tests first
          Query.orderDesc('$createdAt'),
          Query.limit(10000)
        ]
      );

      const links = response.documents as unknown as TestLinkDocument[];
      const seen = new Map();
      const duplicates = [];

      // Process links to find duplicates
      for (const link of links) {
        const key = `${link.email}:${link.internship_id}`;
        
        if (seen.has(key)) {
          // Only mark for deletion if it's unused
          if (!link.is_used) {
            duplicates.push(link.$id);
          }
        } else {
          // First time seeing this combination, keep track of it
          seen.set(key, link);
        }
      }

      if (duplicates.length === 0) {
        toast.info('No duplicate test links found');
        return;
      }

      // Delete duplicates in chunks to avoid timeouts
      const chunkSize = 25;
      let deletedCount = 0;
      
      for (let i = 0; i < duplicates.length; i += chunkSize) {
        const chunk = duplicates.slice(i, i + chunkSize);
        await deleteMultipleTestLinks(chunk);
        deletedCount += chunk.length;
        toast.info(`Processed ${Math.min(i + chunkSize, duplicates.length)} of ${duplicates.length} duplicates...`);
      }
      
      toast.success(`Successfully removed ${deletedCount} duplicate test links`);
      
      // Refresh the current view if we have an active search
      if (email) {
        await searchTestLinks();
      } else {
        // If no email filter, find and show remaining duplicates
        await findDuplicateTestLinks();
      }
    } catch (error) {
      console.error('Error removing duplicates:', error);
      toast.error('Failed to remove duplicate test links');
    } finally {
      setIsLoading(false);
    }
  };

  const removeAllDuplicates = async () => {
    if (!window.confirm('⚠️ WARNING: This will scan the ENTIRE collection and remove ALL duplicate test links. This action cannot be undone. Continue?')) {
      return;
    }

    setIsLoading(true);
    try {
      // First, get ALL test links, ordered by is_used (true first) and then by creation date (newest first)
      const response = await databases.listDocuments(
        DATABASE_ID,
        INTERNSHIP_TEST_LINKS_COLLECTION,
        [
          Query.orderDesc('is_used'),
          Query.orderDesc('$createdAt'),
          Query.limit(10000) // Adjust limit based on your collection size
        ]
      );

      const links = response.documents as unknown as TestLinkDocument[];
      const seen = new Map();
      const duplicates = [];

      console.log(`Processing ${links.length} test links...`);

      // Process links to find duplicates
      for (const link of links) {
        const key = `${link.email}:${link.internship_id}`;
        
        // If we've seen this email+internship combination before, mark for deletion
        if (seen.has(key)) {
          duplicates.push(link.$id);
        } else {
          // First time seeing this combination, keep track of it
          seen.set(key, true);
        }
      }

      console.log(`Found ${duplicates.length} duplicates to remove`);

      if (duplicates.length === 0) {
        toast.info('No duplicate test links found in the entire collection');
        return;
      }

      // Delete duplicates in chunks to avoid timeouts
      const chunkSize = 25;
      let deletedCount = 0;
      
      for (let i = 0; i < duplicates.length; i += chunkSize) {
        const chunk = duplicates.slice(i, i + chunkSize);
        await deleteMultipleTestLinks(chunk);
        deletedCount += chunk.length;
        toast.info(`Processed ${Math.min(i + chunkSize, duplicates.length)} of ${duplicates.length} duplicates...`);
      }
      
      toast.success(`Successfully removed ${deletedCount} duplicate test links`);
      
      // Refresh the current view if we have an active search
      if (email) {
        await searchTestLinks();
      }
    } catch (error) {
      console.error('Error removing duplicates:', error);
      toast.error('Failed to remove duplicate test links');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Test Links Manager</h1>
        {selectedLinks.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">{selectedLinks.size} selected</span>
            <button
              onClick={handleBulkDelete}
              disabled={Object.values(deletingIds).some(Boolean)}
              className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
            >
              {Object.values(deletingIds).some(Boolean) ? 'Deleting...' : `Delete ${selectedLinks.size} links`}
            </button>
          </div>
        )}
      </div>
      
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter user email"
            className="flex-1 p-2 border rounded"
            onKeyPress={(e) => e.key === 'Enter' && searchTestLinks()}
            disabled={isLoading || isFetchingInternships}
          />
          <button
            onClick={searchTestLinks}
            disabled={isLoading || isFetchingInternships}
            className="bg-blue-600 text-white px-6 py-2 rounded disabled:opacity-50"
          >
            {isLoading ? 'Searching...' : 'Search'}
          </button>
          <button
            onClick={findDuplicateTestLinks}
            disabled={isLoading || isFetchingInternships}
            className="bg-purple-600 text-white px-4 py-2 rounded disabled:opacity-50 ml-2"
            title="Find all duplicate test links"
          >
            {isLoading ? 'Searching...' : 'Find Duplicates'}
          </button>
          <button
            onClick={removeDuplicateTestLinks}
            disabled={isLoading || isFetchingInternships}
            className="bg-yellow-600 text-white px-4 py-2 rounded disabled:opacity-50 ml-2"
            title="Remove duplicate test links (keeps most recent)"
          >
            {isLoading ? 'Processing...' : 'Remove Duplicates'}
          </button>
        </div>
        {isFetchingInternships && (
          <p className="text-sm text-gray-500">Loading internship data...</p>
        )}
      </div>

      {testLinks.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="text-lg font-semibold">
              {testLinks.length} test link{testLinks.length !== 1 ? 's' : ''} found
            </h2>
            <button 
              onClick={searchTestLinks}
              className="text-sm text-blue-600 hover:text-blue-800"
              disabled={isLoading}
            >
              Refresh Results
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="w-12 px-2 py-3">
                    <input
                      type="checkbox"
                      checked={selectedLinks.size > 0 && selectedLinks.size === testLinks.length}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Internship
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {testLinks.map((link) => {
                  const isDeleting = Boolean(deletingIds[link.$id]);
                  return (
                    <tr 
                      key={link.$id} 
                      className={`hover:bg-gray-50 ${isDeleting ? 'opacity-50' : ''}`}
                    >
                      <td className="w-12 px-2 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedLinks.has(link.$id)}
                          onChange={() => toggleSelectLink(link.$id)}
                          disabled={isDeleting}
                          className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {link.internship_title || 'Unknown Internship'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(link.$createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{link.full_name || 'N/A'}</div>
                      <div className="text-xs text-gray-500">{link.email}</div>
                      {link.phone && (
                        <div className="text-xs text-gray-500">{link.phone}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(link)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {link.test_result ? (
                        <div className="text-sm text-gray-900">
                          {link.test_result.score || 0}/{link.test_result.totalMarks || 'N/A'}
                          {link.test_result.percentage !== undefined && (
                            <span className="ml-2 text-gray-500">
                              ({link.test_result.percentage}%)
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => deleteTestLink(link.$id)}
                          disabled={isDeleting}
                          className={`text-red-600 hover:text-red-900 ${isDeleting ? 'opacity-50' : ''}`}
                        >
                          {isDeleting ? 'Deleting...' : 'Delete'}
                        </button>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}