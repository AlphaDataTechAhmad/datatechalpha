import { useEffect, useState, useCallback, useMemo } from 'react';
import { FileText, Download, AlertCircle, RefreshCw, Search, User } from 'lucide-react';
import { Button } from '../ui/button';
import { getCourseStudyMaterials } from '../../Services/studyMaterialService';
import { formatDistanceToNow } from 'date-fns';
import { account } from '../../appwriteConfig';

// Appwrite document fields
interface AppwriteDocument {
  $id: string;
  $collectionId: string;
  $databaseId: string;
  $createdAt: string;
  $updatedAt: string;
  $permissions: string[];
}

interface StudyMaterial extends AppwriteDocument {
  title: string;
  description?: string;
  fileUrl: string;
  fileType: string;
  fileSize?: number;
  courseId: string;
  subject?: string;
  tags?: string[];
  uploadDate: string;
  uploadedBy: string;
  isPublic: boolean;
  name?: string;
}

interface StudyMaterialListProps {
  courseId: string;
  isTeacher?: boolean;
  onRefresh?: () => void;
  refreshKey?: number;
}

const StudyMaterialList: React.FC<StudyMaterialListProps> = ({
  courseId,
  isTeacher = false,
  onRefresh,
  refreshKey = 0
}) => {
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredMaterials, setFilteredMaterials] = useState<StudyMaterial[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [uploaderNames, setUploaderNames] = useState<Record<string, string>>({});

  const fetchUserName = useCallback(async (userId: string) => {
    if (!userId || uploaderNames[userId]) return;
    
    try {
      const user = await account.get(userId);
      setUploaderNames(prev => ({
        ...prev,
        [userId]: user.name || user.email || 'Unknown User'
      }));
    } catch (error) {
      console.error('Error fetching user:', error);
      setUploaderNames(prev => ({
        ...prev,
        [userId]: `User (${userId.substring(0, 6)}...)`
      }));
    }
  }, [uploaderNames]);

  const loadMaterials = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getCourseStudyMaterials(courseId);
      const studyMaterials = data.map((material: any) => ({
        ...material,
        title: material.title || 'Untitled',
        fileUrl: material.fileUrl || '',
        fileType: material.fileType || 'application/octet-stream',
        courseId: material.courseId || courseId,
        uploadDate: material.uploadDate || material.$createdAt,
        uploadedBy: material.uploadedBy || 'Unknown',
        isPublic: material.isPublic !== undefined ? material.isPublic : true
      } as StudyMaterial));
      setMaterials(studyMaterials);
      setFilteredMaterials(studyMaterials);
      
      // Fetch user names for all unique uploaders
      const uniqueUserIds = [...new Set(studyMaterials.map(material => material.uploadedBy))];
      uniqueUserIds.forEach(userId => fetchUserName(userId));
    } catch (err) {
      console.error('Error loading study materials:', err);
      setError('Failed to load study materials. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, [courseId, fetchUserName, uploaderNames]);

  useEffect(() => {
    loadMaterials();
  }, [loadMaterials, courseId]);

  useEffect(() => {
    if (refreshKey > 0) {
      loadMaterials();
    }
  }, [refreshKey, loadMaterials]);

  useEffect(() => {
    let result = [...materials];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(material => 
        material.title.toLowerCase().includes(query) ||
        (material.description && material.description.toLowerCase().includes(query)) ||
        (material.tags && material.tags.some(tag => 
          tag.toLowerCase().includes(query)
        ))
      );
    }

    if (selectedSubject !== 'all') {
      result = result.filter(material => 
        material.subject === selectedSubject
      );
    }

    setFilteredMaterials(result);
  }, [searchQuery, selectedSubject, materials]);

  const getFileIconClass = (fileType: string): string => {
    if (fileType.includes('pdf')) return 'text-red-500';
    if (fileType.includes('word') || fileType.includes('document')) return 'text-blue-500';
    if (fileType.includes('sheet') || fileType.includes('excel')) return 'text-green-500';
    if (fileType.includes('presentation') || fileType.includes('powerpoint')) return 'text-orange-500';
    return 'text-gray-500';
  };

  const getFileTypeName = (fileType: string): string => {
    if (fileType.includes('pdf')) return 'PDF';
    if (fileType.includes('word') || fileType.includes('document')) return 'Document';
    if (fileType.includes('sheet') || fileType.includes('excel')) return 'Spreadsheet';
    if (fileType.includes('presentation') || fileType.includes('powerpoint')) return 'Presentation';
    return fileType.split('/').pop()?.toUpperCase() || 'File';
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'N/A';
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const handleDownload = (material: StudyMaterial) => {
    if (!material.fileUrl) {
      console.error('No file URL available for download');
      return;
    }
    const link = document.createElement('a');
    link.href = material.fileUrl;
    link.download = material.title || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const subjects = useMemo(() => {
    const subjectSet = new Set<string>();
    materials.forEach(material => {
      if (material.subject) {
        subjectSet.add(material.subject);
      }
    });
    return ['all', ...Array.from(subjectSet)];
  }, [materials]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading study materials...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 my-4">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400 mr-2" />
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
        <button
          onClick={loadMaterials}
          className="mt-3 text-sm text-red-700 dark:text-red-300 hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (filteredMaterials.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">No study materials found</h3>
        <p className="mt-1 text-gray-500 dark:text-gray-400">
          {searchQuery || selectedSubject !== 'all' 
            ? 'No materials match your filters.'
            : 'No study materials have been uploaded for this course yet.'}
        </p>
        {isTeacher && (
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
          >
            Upload Study Material
          </button>
        )}
      </div>
    );
  }

  if (materials.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">No study materials yet</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {isTeacher 
            ? 'Upload your first study material to get started.' 
            : 'Check back later for study materials.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Study Materials</h2>
        {isTeacher && onRefresh && (
          <Button 
            onClick={() => {
              if (onRefresh) onRefresh();
              loadMaterials();
            }}
            variant="outline"
            className="ml-2"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        )}
      </div>
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search materials..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-dark-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-auto">
          <select
            className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md bg-white dark:bg-dark-800 text-gray-900 dark:text-white"
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
          >
            <option value="all">All Subjects</option>
            {subjects.map((subject) => (
              <option key={subject} value={subject}>
                {subject === 'all' ? 'All Subjects' : subject}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-dark-800 shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {filteredMaterials.map((material) => (
            <li key={material.$id}>
              <div className="px-4 py-4 sm:px-6 hover:bg-gray-50 dark:hover:bg-dark-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${getFileIconClass(material.fileType)}`}>
                      <FileText className="h-6 w-6" />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {material.title}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {getFileTypeName(material.fileType)} • {formatFileSize(material.fileSize)}
                        <div className="flex items-center mt-1 text-xs text-gray-400">
                          <User className="h-3 w-3 mr-1" />
                          {uploaderNames[material.uploadedBy] || 'Loading...'}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDistanceToNow(new Date(material.uploadDate), { addSuffix: true })}
                    </span>
                    <button
                      onClick={() => handleDownload(material)}
                      className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                      title="Download"
                    >
                      <Download className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                
                {material.description && (
                  <div className="mt-2 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                    {material.description}
                  </div>
                )}
                
                <div className="mt-2 flex flex-wrap gap-2">
                  {material.subject && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                      {material.subject}
                    </span>
                  )}
                  {material.tags?.map((tag: string, index: number) => (
                    <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-dark-700 text-gray-800 dark:text-gray-300">
                      {tag}
                    </span>
                  ))}
                </div>
                
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  <span>Uploaded by {material.uploadedBy}</span>
                  <span className="mx-2">•</span>
                  <span>{formatDistanceToNow(new Date(material.uploadDate), { addSuffix: true })}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default StudyMaterialList;
