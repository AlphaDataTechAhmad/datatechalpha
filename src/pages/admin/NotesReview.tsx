import React, { useState, useEffect, useCallback } from 'react';
import { Client, Account, Query } from 'appwrite';
import { databases } from '@/lib/appwrite';
import { FileText, Check, X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

interface PendingNote {
  $id: string;
  title: string;
  description: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  courseId: string;
  courseName: string;
  teacherName?: string;
  uploadedBy: string;
  uploadDate: string;
  status: 'pending' | 'approved' | 'rejected';
}

// Initialize Appwrite client
const client = new Client()
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

const account = new Account(client);

const NotesReviewPage: React.FC = () => {
  const [notes, setNotes] = useState<PendingNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedNote, setSelectedNote] = useState<PendingNote | null>(null);
  const [isReviewing, setIsReviewing] = useState(false);
  // Removed uploaderNames state as we'll use teacherName and courseName directly
  // react-hot-toast is available globally

  // Format date to relative time
  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    const intervals = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60,
      second: 1
    };
    
    for (const [unit, seconds] of Object.entries(intervals)) {
      const interval = Math.floor(diffInSeconds / seconds);
      if (interval >= 1) {
        return interval === 1 ? `${interval} ${unit} ago` : `${interval} ${unit}s ago`;
      }
    }
    
    return 'just now';
  };

  useEffect(() => {
    fetchPendingNotes();
  }, []);

  const fetchPendingNotes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // First fetch all pending notes
      const response = await databases.listDocuments(
        '68261b6a002ba6c3b584', // Database ID
        '682c0545000d9a62893e', // Study Materials Collection ID
        [
          Query.equal('status', 'pending'),
          Query.orderDesc('uploadDate')
        ]
      );
      
      if (!response.documents || response.documents.length === 0) {
        setNotes([]);
        return;
      }
      
      // Get unique course IDs and teacher IDs
      const courseIds = [...new Set(response.documents
        .map((doc: any) => doc.courseId)
        .filter((id: string | null | undefined): id is string => !!id)
      )];
      
      const teacherIds = [...new Set(response.documents
        .map((doc: any) => doc.uploadedBy)
        .filter((id: string | null | undefined): id is string => !!id)
      )];
      
      let enrichedNotes: PendingNote[] = [];
      const teacherMap = new Map();
      
      try {
        // Fetch teacher details in parallel
        const teacherPromises = teacherIds.map(teacherId => 
          account.get(teacherId).catch(() => null)
        );
        const teachers = await Promise.all(teacherPromises);
        
        // Create a map of teacher IDs to teacher names
        teachers.forEach(teacher => {
          if (teacher) {
            teacherMap.set(
              teacher.$id, 
              teacher.name || teacher.email?.split('@')[0] || 'Unknown Teacher'
            );
          }
        });
        
        // Fetch course details if we have course IDs
        if (courseIds.length > 0) {
          try {
            const allCourses = await databases.listDocuments(
              '68261b6a002ba6c3b584', // Database ID
              '682644ed002b437582d3'  // Courses Collection ID
            );
            
            // Create a map of course IDs to course titles
            const courseMap = new Map();
            allCourses.documents.forEach(course => {
              const title = course.title || 'Untitled Course';
              if (course.$id) courseMap.set(course.$id, title);
              if (course.courseId) courseMap.set(course.courseId, title);
            });
            
            // Enrich notes with both course names and teacher names
            enrichedNotes = response.documents.map(note => ({
              ...note,
              courseName: note.courseId 
                ? (courseMap.get(note.courseId) || `Course (${note.courseId.substring(0, 6)}...)`)
                : 'No course specified',
              teacherName: note.uploadedBy 
                ? (teacherMap.get(note.uploadedBy) || 'Unknown Teacher')
                : 'Unknown Teacher'
            }));
            
          } catch (courseError) {
            console.error('Error fetching course details:', courseError);
            // Fallback to showing notes with just course IDs
            enrichedNotes = response.documents.map(note => ({
              ...note,
              courseName: note.courseId 
                ? `Course (${note.courseId.substring(0, 6)}...)` 
                : 'No course specified',
              teacherName: note.uploadedBy 
                ? (teacherMap.get(note.uploadedBy) || 'Unknown Teacher')
                : 'Unknown Teacher'
            }));
          }
        } else {
          // If no course IDs, just add teacher names
          enrichedNotes = response.documents.map(note => ({
            ...note,
            courseName: 'No course specified',
            teacherName: note.uploadedBy 
              ? (teacherMap.get(note.uploadedBy) || 'Unknown Teacher')
              : 'Unknown Teacher'
          }));
        }
      } catch (error) {
        console.error('Error fetching teacher details:', error);
        // If we can't fetch teacher details, still show the notes with default values
        enrichedNotes = response.documents.map(note => ({
          ...note,
          courseName: note.courseId 
            ? `Course (${note.courseId.substring(0, 6)}...)` 
            : 'No course specified',
          teacherName: 'Unknown Teacher'
        }));
      }
      
      setNotes(enrichedNotes as unknown as PendingNote[]);
    } catch (err) {
      console.error('Error fetching pending notes:', err);
      setError('Failed to load pending notes');
      toast.error('Failed to load pending notes');
    } finally {
      setLoading(false);
    }
  }, [databases, account, toast]);

  const updateNoteStatus = async (noteId: string, status: 'approved' | 'rejected') => {
    try {
      await databases.updateDocument(
        '68261b6a002ba6c3b584', // Database ID
        '682c0545000d9a62893e', // Study Materials Collection ID
        noteId,
        { status }
      );

      // Update local state
      setNotes(prevNotes => prevNotes.filter(note => note.$id !== noteId));
      if (selectedNote?.$id === noteId) {
        setSelectedNote(null);
        setIsReviewing(false);
      }

      toast.success(`Note ${status === 'approved' ? 'approved' : 'rejected'} successfully`);
    } catch (err) {
      console.error(`Error ${status === 'approved' ? 'approving' : 'rejecting'} note:`, err);
      toast.error(`Failed to ${status === 'approved' ? 'approve' : 'reject'} note`);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return 'text-red-500';
    if (fileType.includes('word')) return 'text-blue-500';
    if (fileType.includes('powerpoint') || fileType.includes('presentation')) return 'text-orange-500';
    if (fileType.includes('sheet') || fileType.includes('excel')) return 'text-green-500';
    return 'text-gray-500';
  };

  const getFileTypeName = (fileType: string): string => {
    if (fileType.includes('pdf')) return 'PDF';
    if (fileType.includes('word') || fileType.includes('document')) return 'Document';
    if (fileType.includes('sheet') || fileType.includes('excel')) return 'Spreadsheet';
    if (fileType.includes('presentation') || fileType.includes('powerpoint')) return 'Presentation';
    return fileType.split('/').pop()?.toUpperCase() || 'File';
  };
  
  const formatDistanceToNow = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    const intervals = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60,
      second: 1
    };
    
    for (const [unit, seconds] of Object.entries(intervals)) {
      const interval = Math.floor(diffInSeconds / seconds);
      if (interval >= 1) {
        return interval === 1 ? `${interval} ${unit} ago` : `${interval} ${unit}s ago`;
      }
    }
    
    return 'just now';
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-16 bg-gray-50 dark:bg-dark-900">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen pt-24 pb-16 bg-gray-50 dark:bg-dark-900">
        <div className="container mx-auto px-4">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 bg-gray-50 dark:bg-dark-900">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Pending Study Materials</h1>
        
        {notes.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">No pending notes to review</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">All study materials have been reviewed.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Notes List */}
            <div className="lg:col-span-1 space-y-4">
              {notes.map((note) => (
                <div 
                  key={note.$id}
                  onClick={() => {
                    setSelectedNote(note);
                    setIsReviewing(true);
                  }}
                  className={`p-4 bg-white dark:bg-dark-800 rounded-lg shadow-sm border border-gray-200 dark:border-dark-700 cursor-pointer transition-colors ${
                    selectedNote?.$id === note.$id 
                      ? 'ring-2 ring-primary-500' 
                      : 'hover:shadow-md dark:hover:border-dark-600'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center flex-1 min-w-0">
                      <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${getFileIcon(note.fileType)}`}>
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="ml-4 min-w-0">
                        <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {note.title}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {getFileTypeName(note.fileType)} • {formatFileSize(note.fileSize)}
                          <div className="flex items-center mt-1 text-xs text-gray-400 space-x-2">
                            <span className="truncate flex items-center">
                              <span className="font-medium text-gray-700 dark:text-gray-300 mr-1">Course:</span> {note.courseName || 'N/A'}
                            </span>
                            <span className="text-gray-300 dark:text-gray-600">•</span>
                            <span className="truncate flex items-center">
                              <span className="font-medium text-gray-700 dark:text-gray-300 mr-1">By:</span> {note.teacherName || 'Unknown'}
                            </span>
                            <span className="text-gray-300 dark:text-gray-600">•</span>
                            <span className="whitespace-nowrap">
                              {formatTimeAgo(new Date(note.uploadDate))}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">
                        Pending
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Note Preview */}
            {isReviewing && selectedNote && (
              <div className="lg:col-span-2">
                <div className="bg-white dark:bg-dark-800 rounded-lg shadow overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {selectedNote.title}
                      </h2>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateNoteStatus(selectedNote.$id, 'rejected')}
                          className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                        <Button
                          onClick={() => updateNoteStatus(selectedNote.$id, 'approved')}
                          size="sm"
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                      </div>
                    </div>

                    <div className="mt-4">
                      <p className="text-gray-700 dark:text-gray-300">
                        {selectedNote.description || 'No description provided.'}
                      </p>
                    </div>

                    <div className="mt-6 border-t border-gray-200 dark:border-dark-700 pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">File Details</h4>
                          <div className="mt-1 text-sm text-gray-900 dark:text-white">
                            {selectedNote.fileType} • {formatFileSize(selectedNote.fileSize)}
                          </div>
                        </div>
                        <a
                          href={selectedNote.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-dark-700 hover:bg-gray-50 dark:hover:bg-dark-600"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </a>
                      </div>
                    </div>

                    <div className="mt-6 border-t border-gray-200 dark:border-dark-700 pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Course</h4>
                          <div className="mt-1 text-sm text-gray-900 dark:text-white">
                            {selectedNote.courseName || 'No course specified'}
                          </div>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Teacher</h4>
                          <div className="mt-1 text-sm text-gray-900 dark:text-white">
                            {selectedNote.teacherName || 'No teacher specified'}
                          </div>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Uploaded</h4>
                          <div className="mt-1 text-sm text-gray-900 dark:text-white">
                            {new Date(selectedNote.uploadDate).toLocaleDateString()}
                          </div>
                          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            {formatTimeAgo(new Date(selectedNote.uploadDate))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotesReviewPage;
