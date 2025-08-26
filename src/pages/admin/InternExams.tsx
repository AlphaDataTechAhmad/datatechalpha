import React, { useState, useEffect } from 'react';
import { databases, DATABASE_ID } from '../../appwriteConfig';
import { Query } from 'appwrite';
import { format } from 'date-fns';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

// UI Components
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Alert } from '../../components/ui/alert';
import { ChevronDown, Edit, Loader2, CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Dialog, DialogContent } from '../../components/ui/dialog';

// Base interface for application data from Appwrite
interface AppwriteDocument {
  $id: string;
  $collectionId: string;
  $databaseId: string;
  $createdAt: string;
  $updatedAt: string;
  $permissions: string[];
  [key: string]: any;
}

// Test link data model from internship_test_links collection
interface TestLink extends AppwriteDocument {
  userId: string;
  full_name: string;
  email: string;
  phone: string;
  internship_id: string;
  start_date: string;
  expiry_date: string;
  is_used: boolean;
  test_attempt_id: string;
  score: string;
  passed: boolean;
  completed_at: string;
  status: string;
  percentage: string;
}

// DatePicker component
const DatePicker = ({
  date,
  onSelect,
  disabled = false,
}: {
  date: Date | undefined;
  onSelect: (date: Date | undefined) => void;
  disabled?: boolean;
}) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-full justify-start text-left font-normal',
            !date && 'text-muted-foreground'
          )}
          disabled={disabled}
        >
          <Calendar className="mr-2 h-4 w-4" />
          {date ? format(date, 'PPP') : <span>Pick a date</span>}
          <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={onSelect}
          disabled={(date) => date < new Date()}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
};

const TEST_LINKS_COLLECTION = '689923bc000f2d15a263';
const ITEMS_PER_PAGE = 100; // Increased from 10 to 100 to show more items per page

// Function to export data to Excel
const exportToExcel = (data: any[], filename: string = 'test_applications.xlsx') => {
  // Prepare the data for Excel
  const excelData = data.map(item => ({
    'Full Name': item.full_name || 'N/A',
    'Email': item.email || 'N/A',
    'Phone': item.phone || 'N/A',
    'Test Taken': item.is_used ? 'Yes' : 'No',
    'Score': item.score || 'N/A',
    'Status': item.status || 'pending',
    'Result': item.is_used ? (item.passed ? 'Passed' : 'Failed') : 'N/A',
    'Completed At': item.completed_at ? format(new Date(item.completed_at), 'PPpp') : 'N/A',
    'Start Date': item.start_date ? format(new Date(item.start_date), 'PPpp') : 'N/A',
    'Expiry Date': item.expiry_date ? format(new Date(item.expiry_date), 'PPpp') : 'N/A'
  }));

  // Create a new workbook and add a worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(excelData);

  // Add the worksheet to the workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Test Applications');

  // Generate the Excel file and trigger download
  XLSX.writeFile(wb, filename);
};

export default function InternExams() {
  const [testLinks, setTestLinks] = useState<TestLink[]>([]);
  const [loading, setLoading] = useState<boolean>(true); // State for loading
  const [showOnlyTestTakers, setShowOnlyTestTakers] = useState<boolean>(false); // State for filtering test takers
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedUser, setSelectedUser] = useState<TestLink | null>(null);


  const handleDateSelect = (newDate: Date | undefined) => {
    setDate(newDate);
  };

  useEffect(() => {
    const fetchTestLinks = async () => {
      try {
        setLoading(true);
        console.log('Fetching test links from:', {
          databaseId: DATABASE_ID,
          collectionId: TEST_LINKS_COLLECTION
        });

        // First, get the total count of documents
        const { total } = await databases.listDocuments(
          DATABASE_ID,
          TEST_LINKS_COLLECTION,
          [Query.limit(1)]
        );

        // Then fetch all documents
        const response = await databases.listDocuments(
          DATABASE_ID,
          TEST_LINKS_COLLECTION,
          [
            Query.orderDesc('$createdAt'),
            Query.limit(total)
          ]
        );

        console.log(`Fetched ${response.documents.length} test links`);

        // Map the response to our TestLink type
        const formattedTestLinks: TestLink[] = response.documents.map((doc: any) => ({
          $id: doc.$id,
          $collectionId: doc.$collectionId,
          $databaseId: doc.$databaseId,
          $createdAt: doc.$createdAt,
          $updatedAt: doc.$updatedAt,
          $permissions: Array.isArray(doc.$permissions) ? doc.$permissions : [],

          // Map fields from the document
          userId: doc.userId || '',
          full_name: doc.full_name || 'N/A',
          email: doc.email || 'N/A',
          phone: doc.phone || 'N/A',
          internship_id: doc.internship_id || '',
          start_date: doc.start_date || '',
          expiry_date: doc.expiry_date || '',
          is_used: Boolean(doc.is_used),
          test_attempt_id: doc.test_attempt_id || '',
          score: doc.score || '0',
          passed: Boolean(doc.passed),
          completed_at: doc.completed_at || '',
          status: doc.status || 'pending',
          percentage: doc.percentage || '0'
        }));

        setTestLinks(formattedTestLinks);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error('Error fetching test links:', err);
        setError(`Failed to load test links: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };

    fetchTestLinks();
  }, []);

  const handleEditDates = async (testLinkId: string, startDate: Date | undefined, expiryDate: Date | undefined) => {
    try {
      setUpdating(testLinkId);

      const updates: any = {};
      if (startDate) updates.start_date = startDate.toISOString();
      if (expiryDate) updates.expiry_date = expiryDate.toISOString();

      await databases.updateDocument(
        DATABASE_ID,
        TEST_LINKS_COLLECTION,
        testLinkId,
        updates
      );

      // Update local state
      setTestLinks(prev => prev.map(testLink =>
        testLink.$id === testLinkId ? { ...testLink, ...updates } : testLink
      ));

      toast.success('Dates updated successfully');
      setEditingDates({ id: null, start: null, expiry: null });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Error updating dates:', err);
      toast.error(`Failed to update dates: ${errorMessage}`);
    } finally {
      setUpdating(null);
    }
  };

  const updateTestResult = async (testLinkId: string, testResult: 'pass' | 'fail') => {
    try {
      setUpdating(testLinkId);

      await databases.updateDocument(
        DATABASE_ID,
        TEST_LINKS_COLLECTION,
        testLinkId,
        {
          passed: testResult === 'pass',
          status: 'completed',
          completed_at: new Date().toISOString()
        }
      );

      // Update local state
      setTestLinks(prev => prev.map(testLink => {
        if (testLink.$id === testLinkId) {
          return {
            ...testLink,
            passed: testResult === 'pass',
            status: 'completed',
            completed_at: new Date().toISOString()
          };
        }
        return testLink;
      }));

      toast.success(`Test marked as ${testResult === 'pass' ? 'passed' : 'failed'}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Error updating test result:', err);
      toast.error(`Failed to update test result: ${errorMessage}`);
    } finally {
      setUpdating(null);
    }
  };

  const handleUpdateTestStatus = async (testLink: TestLink, newStatus: boolean) => {
    try {
      setUpdatingStatus(testLink.$id);

      // Update the test status in the database
      await databases.updateDocument(
        DATABASE_ID,
        TEST_LINKS_COLLECTION,
        testLink.$id,
        {
          passed: newStatus,
          status: 'completed',
          completed_at: new Date().toISOString()
        }
      );

      // Update the local state
      setTestLinks(prev =>
        prev.map(link =>
          link.$id === testLink.$id
            ? { ...link, passed: newStatus, status: 'completed', completed_at: new Date().toISOString() }
            : link
        )
      );

              // Update selected user state if needed
      if (selectedUser?.$id === testLink.$id) {
        setSelectedUser({
          ...testLink,
          passed: newStatus,
          status: newStatus ? 'completed' : testLink.status,
          completed_at: newStatus ? new Date().toISOString() : testLink.completed_at
        });
      }

      toast.success(`Test status updated to ${newStatus ? 'Passed' : 'Failed'}`);
    } catch (error) {
      console.error('Error updating test status:', error);
      toast.error('Failed to update test status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatRelativeTime = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    const minute = 60;
    const hour = minute * 60;
    const day = hour * 24;
    const month = day * 30;
    const year = day * 365;

    if (diffInSeconds < minute) return 'just now';
    if (diffInSeconds < hour) return `${Math.floor(diffInSeconds / minute)}m ago`;
    if (diffInSeconds < day) return `${Math.floor(diffInSeconds / hour)}h ago`;
    if (diffInSeconds < month) return `${Math.floor(diffInSeconds / day)}d ago`;
    if (diffInSeconds < year) return `${Math.floor(diffInSeconds / month)}mo ago`;
    return `${Math.floor(diffInSeconds / year)}y ago`;
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full">Completed</span>;
      case 'in_progress':
        return <span className="px-2 py-1 text-xs font-semibold text-blue-800 bg-blue-100 rounded-full">In Progress</span>;
      case 'pending':
        return <span className="px-2 py-1 text-xs font-semibold text-yellow-800 bg-yellow-100 rounded-full">Pending</span>;
      default:
        return <span className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 rounded-full">{status}</span>;
    }
  };

  const getResultBadge = (passed: boolean) => {
    return passed
      ? <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full">Passed</span>
      : <span className="px-2 py-1 text-xs font-semibold text-red-800 bg-red-100 rounded-full">Failed</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  // Filter test links based on the test takers toggle
  const filteredTestLinks = testLinks.filter(link =>
    !showOnlyTestTakers || link.is_used
  );

  // Calculate total pages for pagination
  const totalPages = Math.ceil(filteredTestLinks.length / ITEMS_PER_PAGE);

  // Get current test links for the current page
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentItems = filteredTestLinks.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  // Change page
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const handleExport = () => {
    try {
      // Use filteredTestLinks instead of testLinks to respect the current filter
      const dataToExport = showOnlyTestTakers
        ? testLinks.filter(link => link.is_used)
        : testLinks;

      const filename = showOnlyTestTakers
        ? 'test_takers_export.xlsx'
        : 'all_applications_export.xlsx';

      exportToExcel(dataToExport, filename);
      toast.success(`Exported ${dataToExport.length} records to Excel`);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast.error('Failed to export data to Excel');
    }
  };


  return (
    <div className="container mx-auto py-6 px-4 relative">
      
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h1 className="text-2xl font-bold">Internship Test Results</h1>
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={showOnlyTestTakers}
                onChange={() => setShowOnlyTestTakers(!showOnlyTestTakers)}
              />
              <span className="text-sm font-medium text-gray-700">Show only test takers</span>
            </label>
            <Button
              onClick={handleExport}
              variant="outline"
              className="ml-2"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export to Excel
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Test Taken</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Completed At</TableHead>
                    <TableHead>Percentage</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentItems.length > 0 ? (
                    currentItems.map((testLink) => (
                      <TableRow key={testLink.$id}>
                        <TableCell className="font-medium">{testLink.full_name || 'N/A'}</TableCell>
                        <TableCell>{testLink.email || 'N/A'}</TableCell>
                        <TableCell>{testLink.phone || 'N/A'}</TableCell>
                        <TableCell>
                          {testLink.is_used ? (
                            <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full">
                              Yes
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs font-semibold text-red-800 bg-red-100 rounded-full">
                              No
                            </span>
                          )}
                        </TableCell>
                        <TableCell>{testLink.score || 'N/A'}</TableCell>
                        <TableCell>{formatDate(testLink.completed_at)}</TableCell>
                        <TableCell>
                          {testLink.percentage ? (
                            <span className="px-2 py-1 text-xs font-semibold text-blue-800 bg-blue-100 rounded-full">
                              {testLink.percentage}%
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-full">
                              N/A
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {testLink.is_used ? (
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${testLink.passed
                                  ? 'text-green-800 bg-green-100'
                                  : 'text-red-800 bg-red-100'
                                }`}>
                                {testLink.passed ? 'Passed' : 'Failed'}
                              </span>
                              <button
                                onClick={() => {
                                  handleUpdateTestStatus(testLink, !testLink.passed);
                                  if (!testLink.passed) {
                                    setSelectedUser(testLink);
                                  } else if (selectedUser?.$id === testLink.$id) {
                                    setSelectedUser(null);
                                  }
                                }}
                                disabled={updatingStatus === testLink.$id}
                                className="p-1 text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50"
                                title={`Mark as ${testLink.passed ? 'Failed' : 'Passed'}`}
                              >
                                {updatingStatus === testLink.$id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Edit className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          ) : (
                            <span className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-full">
                              NA
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-4">
                        No test results found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
            <div className="flex justify-between flex-1 sm:hidden">
              <button
                onClick={() => paginate(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center px-4 py-2 ml-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(indexOfLastItem, filteredTestLinks.length)}
                  </span>{' '}
                  of <span className="font-medium">{filteredTestLinks.length}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                  <button
                    onClick={() => paginate(1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-l-md hover:bg-gray-50 disabled:opacity-50"
                  >
                    <span className="sr-only">First</span>
                    &laquo;
                  </button>
                  <button
                    onClick={() => paginate(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    // Show page numbers around current page
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => paginate(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 text-sm font-medium ${currentPage === pageNum
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          } border`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                  <button
                    onClick={() => paginate(totalPages)}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-r-md hover:bg-gray-50 disabled:opacity-50"
                  >
                    <span className="sr-only">Last</span>
                    &raquo;
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
