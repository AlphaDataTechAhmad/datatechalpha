import React, { useState, useEffect, useRef } from 'react';
import { FileText, Download, AlertCircle, File, FileTextIcon, FileSpreadsheet, FileImage, FileArchive, Loader2 } from 'lucide-react';
import { useOutletContext, useParams, useNavigate } from 'react-router-dom';
import { storage, Query, databases, DATABASE_ID, PROFILE_COLLECTION_ID, ID } from '../../Services/appwrite';
import { toast } from 'react-toastify';

interface InternshipContext {
  internship: {
    title: string;
    company: string;
    $id: string;
  };
  application: {
    payment_status: string;
  };
  user: {
    $id: string;
    email: string;
    role?: string;
  };
}

// Storage bucket ID for internship notes
export const INTERNSHIP_NOTES_BUCKET_ID = '68d4c7cd000d86db132a';

interface StudyMaterial {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  $permissions: string[];
  name: string;
  mimeType: string;
  sizeOriginal: number;
  chunksTotal: number;
  chunksUploaded: number;
  signature: string;
  href: string;
  // Add any other properties that might be present in the Appwrite file object
  [key: string]: any;
}

const fileIcons = {
  pdf: <FileTextIcon className="h-5 w-5 text-red-500" />,
  doc: <FileText className="h-5 w-5 text-blue-500" />,
  docx: <FileText className="h-5 w-5 text-blue-500" />,
  ppt: <FileImage className="h-5 w-5 text-orange-500" />,
  pptx: <FileImage className="h-5 w-5 text-orange-500" />,
  xls: <FileSpreadsheet className="h-5 w-5 text-green-500" />,
  xlsx: <FileSpreadsheet className="h-5 w-5 text-green-500" />,
  zip: <FileArchive className="h-5 w-5 text-yellow-500" />,
  rar: <FileArchive className="h-5 w-5 text-yellow-500" />,
  default: <File className="h-5 w-5 text-gray-500" />,
};

const Notes: React.FC = () => {
  const { internship, application, user } = useOutletContext<InternshipContext>();
  const { id: internshipId } = useParams<{ id: string }>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  type UserRole = 'student' | 'teacher' | 'admin' | 'subadmin';
  
  // Initialize userRole with role from context if available, otherwise default to 'student'
  const getInitialRole = (): UserRole => {
    if (user?.role) {
      const role = user.role.toLowerCase() as UserRole;
      return ['student', 'teacher', 'admin', 'subadmin'].includes(role) ? role : 'student';
    }
    return 'student';
  };
  
  const [userRole, setUserRole] = useState<UserRole>(getInitialRole);
  
  // Update role when user context changes
  useEffect(() => {
    if (user?.role) {
      const role = user.role.toLowerCase() as UserRole;
      console.log('[Notes] Updating role from context:', role);
      setUserRole(role);
    }
  }, [user]);
  
  // Helper function to check if user has teacher or admin privileges
  const hasTeacherPrivileges = () => {
    console.log('[Notes] Checking teacher privileges. Current role:', userRole, 'From context:', user?.role);
    const hasAccess = ['teacher', 'admin', 'subadmin'].includes(userRole);
    console.log('[Notes] Has teacher privileges:', hasAccess);
    return hasAccess;
  };
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [studyMaterials, setStudyMaterials] = useState<StudyMaterial[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const isPaymentCompleted = application?.payment_status === 'completed';
  
  // Filter materials based on search query
  const filteredMaterials = studyMaterials.filter(material =>
    searchQuery === '' || 
    material.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Fetch study materials from Appwrite storage
  useEffect(() => {
    if (!isPaymentCompleted || !internshipId) return;

    const fetchStudyMaterials = async () => {
      try {
        setIsLoading(true);
        // List all files in the bucket
        const response = await storage.listFiles(
          INTERNSHIP_NOTES_BUCKET_ID,
          [
            Query.orderDesc('$createdAt')
          ]
        );
        
        console.log('Available files:', response.files);

        // Transform files to StudyMaterial format
        const materials = response.files.map(file => ({
          $id: file.$id,
          name: file.name || 'Unnamed File',
          mimeType: file.mimeType || 'application/octet-stream',
          sizeOriginal: file.sizeOriginal || 0,
          $createdAt: file.$createdAt,
          $updatedAt: file.$updatedAt,
          href: storage.getFileView(INTERNSHIP_NOTES_BUCKET_ID, file.$id).toString(),
          // Include any other properties you need
          ...file
        }));

        console.log('Processed materials:', materials);
        setStudyMaterials(materials);
      } catch (err) {
        console.error('Error fetching study materials:', err);
        setError('Failed to load study materials. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudyMaterials();
  }, [isPaymentCompleted, internshipId]);

  // Check user role on component mount if not available in context
  useEffect(() => {
    const checkUserRole = async () => {
      // Skip if we already have a role from context
      if (user?.role) {
        console.log('[Notes] Using role from context:', user.role);
        const role = user.role.toLowerCase() as UserRole;
        setUserRole(role);
        return;
      }

      try {
        console.log('[Notes] Fetching user role for user ID:', user?.$id);
        const profile = await databases.getDocument(
          DATABASE_ID,
          PROFILE_COLLECTION_ID,
          user.$id
        );
        
        if (profile?.role) {
          console.log('[Notes] Fetched profile with role:', profile.role);
          const validRoles: UserRole[] = ['student', 'teacher', 'admin', 'subadmin'];
          const role = validRoles.includes(profile.role.toLowerCase() as UserRole)
            ? profile.role.toLowerCase() as UserRole
            : 'student';
          
          console.log('[Notes] Setting user role to:', role);
          setUserRole(role);
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
        setUserRole('student'); // Default to student on error
      }
    };

    if (user?.$id) {
      checkUserRole();
    }
  }, [user]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (limit to 10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      toast.error('File size must be less than 10MB');
      return;
    }

    // Check file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png',
      'image/gif',
      'text/plain'
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload a document, presentation, spreadsheet, PDF, or image.');
      return;
    }

    try {
      setIsUploading(true);
      await storage.createFile(
        INTERNSHIP_NOTES_BUCKET_ID,
        ID.unique(),
        file
      );
      
      // Refresh the file list
      await fetchStudyMaterials();
      toast.success('File uploaded successfully!');
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload file');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;
    
    try {
      await storage.deleteFile(INTERNSHIP_NOTES_BUCKET_ID, fileId);
      setStudyMaterials(prev => prev.filter(m => m.$id !== fileId));
      toast.success('File deleted successfully!');
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Failed to delete file');
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase() || 'default';
    return fileIcons[extension as keyof typeof fileIcons] || fileIcons.default;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const fetchStudyMaterials = async () => {
    try {
      setIsLoading(true);
      const response = await storage.listFiles(
        INTERNSHIP_NOTES_BUCKET_ID,
        [Query.orderDesc('$createdAt')]
      );

      const materials = response.files.map(file => ({
        $id: file.$id,
        name: file.name || 'Unnamed File',
        mimeType: file.mimeType || 'application/octet-stream',
        sizeOriginal: file.sizeOriginal || 0,
        $createdAt: file.$createdAt,
        $updatedAt: file.$updatedAt,
        href: storage.getFileView(INTERNSHIP_NOTES_BUCKET_ID, file.$id).toString(),
        ...file
      }));

      setStudyMaterials(materials);
    } catch (err) {
      console.error('Error fetching study materials:', err);
      setError('Failed to load study materials. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600 dark:text-gray-300">Loading study materials...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Error Loading Materials
        </h3>
        <p className="text-gray-600 dark:text-gray-300 max-w-md mx-auto mb-6">
          {error}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  // Only show payment required for non-teacher/admin users who haven't paid
  if (!hasTeacherPrivileges() && !isPaymentCompleted) {
    return (
      <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
        <AlertCircle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Payment Required
        </h3>
        <p className="text-gray-600 dark:text-gray-300 max-w-md mx-auto mb-6">
          Please complete your payment to access the study materials for {internship?.title || 'this internship'}.
        </p>
        <button
          onClick={() => window.location.href = '/payment'}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Complete Payment
        </button>
      </div>
    );
  }

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Study Materials
            </h2>
            {hasTeacherPrivileges() && (
              <div className="flex space-x-4">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                  accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*"
                />
                <button
                  onClick={triggerFileInput}
                  disabled={isUploading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                      Uploading...
                    </>
                  ) : (
                    'Upload File'
                  )}
                </button>
              </div>
            )}
          </div>
          
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative rounded-md shadow-sm">
              <input
                type="text"
                className="block w-full rounded-md border-gray-300 pl-4 pr-12 py-2 focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="mt-6">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
              </div>
            ) : filteredMaterials.length > 0 ? (
              <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredMaterials.map((material) => {
                    const fileExtension = material.name.split('.').pop()?.toLowerCase() || '';
                    const isPdf = fileExtension === 'pdf';

                    return (
                      <li key={material.$id} className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            {getFileIcon(material.name)}
                            <div>
                              <h4 className="font-medium text-gray-900 dark:text-white">
                                {material.name}
                              </h4>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {formatFileSize(material.sizeOriginal)} •
                                <span className="ml-1">
                                  Uploaded on{' '}
                                  {new Date(material.$createdAt).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                  })}
                                </span>
                              </p>
                            </div>
                          </div>
                          <div className="flex space-x-3">
                            {isPdf && (
                              <a
                                href={material.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 dark:text-blue-300 dark:bg-blue-900/50 dark:hover:bg-blue-800/50 transition-colors"
                              >
                                <FileTextIcon className="h-3.5 w-3.5 mr-1.5" />
                                View
                              </a>
                            )}
                            <div className="flex space-x-2">
                              <a
                                href={material.href}
                                download
                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 dark:text-blue-300 dark:bg-blue-900/50 dark:hover:bg-blue-800/50 transition-colors"
                              >
                                <Download className="h-3.5 w-3.5 mr-1.5" />
                                Download
                              </a>
                              {hasTeacherPrivileges() && (
                                <button
                                  onClick={() => handleDeleteFile(material.$id)}
                                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 dark:text-red-300 dark:bg-red-900/50 dark:hover:bg-red-800/50 transition-colors"
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
                <p className="text-gray-500 dark:text-gray-400">
                  {searchQuery ? 'No files match your search.' : 'No study materials have been uploaded yet.'}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 dark:border-blue-500 p-4 rounded-r">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h2a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">Need help with the materials?</h3>
              <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                <p>
                  If you're having trouble accessing any of the materials, please contact your instructor or the support team.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notes;
