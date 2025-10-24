import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Clock, Video, BookOpen, Upload, Calendar, Plus, Edit, Trash, FileText, UserCheck } from 'lucide-react';
import { databases, DATABASE_ID, LIVE_LECTURES_COLLECTION_ID, STUDY_MATERIALS_COLLECTION_ID } from '../lib/appwrite';
import { useAuth } from '../contexts/AuthContext';
import { Query, Models } from 'appwrite';
import EnrolledStudents from './teacher/EnrolledStudents';

type TabType = 'lectures' | 'materials' | 'students';

interface Lecture extends Models.Document {
  title: string;
  description: string;
  scheduledTime: string;
  status?: 'scheduled' | 'live' | 'completed';
  meetingLink?: string;
  startedAt?: string;
  duration?: string;
}

interface StudyMaterial extends Models.Document {
  title: string;
  description: string;
  fileType: string;
  uploadDate: string;
  fileUrl: string;
  courseId: string;
}

const TeacherPanel: React.FC = () => {
  const { user } = useAuth();
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [liveLectures, setLiveLectures] = useState<Lecture[]>([]);
  const [studyMaterials, setStudyMaterials] = useState<StudyMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('lectures');
  
  // Type guards
  const isLecture = (obj: Models.Document): obj is Lecture => 
    obj && 'title' in obj && 'description' in obj && 'scheduledTime' in obj;
    
  const isStudyMaterial = (obj: Models.Document): obj is StudyMaterial => 
    obj && 'title' in obj && 'fileType' in obj && 'fileUrl' in obj;

  useEffect(() => {
    if (!user || !courseId) return;

    const fetchTeacherData = async () => {
      try {
        setLoading(true);
        
        // Fetch live lectures for this course
        const lecturesResponse = await databases.listDocuments(
          DATABASE_ID,
          LIVE_LECTURES_COLLECTION_ID,
          [
            Query.equal('courseId', courseId),
            Query.orderDesc('scheduledTime')
          ]
        );
        
        // Fetch study materials for this course
        const materialsResponse = await databases.listDocuments(
          DATABASE_ID,
          STUDY_MATERIALS_COLLECTION_ID,
          [
            Query.equal('courseId', courseId),
            Query.orderDesc('uploadDate')
          ]
        );

        // Filter and type check the documents
        const validLectures = lecturesResponse.documents.filter(isLecture);
        const validMaterials = materialsResponse.documents.filter(isStudyMaterial);
        
        setLiveLectures(validLectures);
        setStudyMaterials(validMaterials);
      } catch (error) {
        console.error('Error fetching teacher data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeacherData();
  }, [user, courseId]);

  const handleStartLecture = async (lectureId: string) => {
    try {
      // Generate a unique meeting link (using Jitsi as example)
      const meetingLink = `https://meet.jit.si/edu-${courseId}-${lectureId}`;
      
      await databases.updateDocument(
        DATABASE_ID,
        LIVE_LECTURES_COLLECTION_ID,
        lectureId,
        { 
          status: 'live', 
          meetingLink,
          startedAt: new Date().toISOString() 
        }
      );
      
      // Navigate to live lecture page
      navigate(`live/${lectureId}`);
    } catch (error) {
      console.error('Error starting lecture:', error);
    }
  };

  const handleDeleteLecture = async (lectureId: string) => {
    if (window.confirm('Are you sure you want to delete this lecture?')) {
      try {
        await databases.deleteDocument(
          '68261b6a002ba6c3b584',
          'liveLectures',
          lectureId
        );
        setLiveLectures(prev => prev.filter(l => l.$id !== lectureId));
      } catch (error) {
        console.error('Error deleting lecture:', error);
      }
    }
  };

  const handleDeleteMaterial = async (materialId: string) => {
    if (window.confirm('Are you sure you want to delete this material?')) {
      try {
        await databases.deleteDocument(
          '68261b6a002ba6c3b584',
          'studyMaterials',
          materialId
        );
        setStudyMaterials(prev => prev.filter(m => m.$id !== materialId));
      } catch (error) {
        console.error('Error deleting material:', error);
      }
    }
  };

  const getLectureStatus = (scheduledTime: string): 'scheduled' | 'live' | 'completed' => {
    const now = new Date();
    const scheduled = new Date(scheduledTime);
    const endTime = new Date(scheduled.getTime() + 60 * 60 * 1000); // 1 hour duration

    if (now < scheduled) return 'scheduled';
    if (now > endTime) return 'completed';
    return 'live';
  };

  const renderLoading = () => (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
    </div>
  );

  const renderTabContent = () => {
    if (loading) return renderLoading();

    switch (activeTab) {
      case 'lectures':
        return (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Live Lectures</h3>
              <Link 
                to="new-lecture"
                className="btn-primary flex items-center gap-2 px-4 py-2 rounded-lg"
              >
                <Plus size={18} /> New Lecture
              </Link>
            </div>
            {liveLectures.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 dark:bg-dark-700 rounded-lg">
                <Video size={48} className="mx-auto text-gray-400 mb-4" />
                <h4 className="text-lg font-medium text-gray-500">No lectures scheduled yet</h4>
                <p className="text-gray-400 mb-4">Schedule your first live lecture to get started</p>
                <Link
                  to="new-lecture"
                  className="btn-primary inline-flex items-center gap-2"
                >
                  <Plus size={16} /> Schedule Lecture
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {liveLectures.map((lecture) => {
                  const status = getLectureStatus(lecture.scheduledTime);
                  const isLive = status === 'live';
                  const isCompleted = status === 'completed';
                  
                  return (
                    <div 
                      key={lecture.$id}
                      className={`border rounded-lg p-4 transition-all ${
                        isLive ? 'border-green-500 bg-green-50 dark:bg-green-900/20' :
                        isCompleted ? 'border-gray-200 dark:border-dark-600' :
                        'border-gray-200 dark:border-dark-600 hover:shadow-md'
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg ${
                              isLive ? 'bg-green-100 dark:bg-green-800/30' :
                              isCompleted ? 'bg-gray-100 dark:bg-dark-700' :
                              'bg-blue-100 dark:bg-blue-900/30'
                            }`}>
                              <Video 
                                size={20} 
                                className={isLive ? 'text-green-600 dark:text-green-400' : 
                                  isCompleted ? 'text-gray-500 dark:text-gray-400' : 
                                  'text-blue-600 dark:text-blue-400'}
                              />
                            </div>
                            <div>
                              <h4 className="font-bold text-lg">{lecture.title}</h4>
                              <p className="text-gray-600 dark:text-gray-300 mt-1">{lecture.description}</p>
                              <div className="flex flex-wrap items-center gap-4 mt-3 text-sm">
                                <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                                  <Calendar size={14} />
                                  {new Date(lecture.scheduledTime).toLocaleString()}
                                </span>
                                <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                                  <Clock size={14} />
                                  {lecture.duration}
                                </span>
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  isLive ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                  isCompleted ? 'bg-gray-100 text-gray-800 dark:bg-dark-700 dark:text-gray-400' :
                                  'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                                }`}>
                                  {status}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {isLive && (
                            <Link
                              to={`live/${lecture.$id}`}
                              className="btn-primary px-3 py-1.5 text-sm flex items-center gap-1"
                            >
                              <Video size={14} /> Join Live
                            </Link>
                          )}
                          {!isCompleted && (
                            <button
                              onClick={() => isLive ? null : handleStartLecture(lecture.$id)}
                              className={`px-3 py-1.5 text-sm flex items-center gap-1 rounded-lg ${
                                isLive ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                'bg-primary-500 text-white hover:bg-primary-600'
                              }`}
                              disabled={isLive}
                            >
                              {isLive ? 'Live Now' : 'Start Lecture'}
                            </button>
                          )}
                          <Link
                            to={`edit-lecture/${lecture.$id}`}
                            className="btn-secondary px-3 py-1.5 text-sm flex items-center gap-1"
                          >
                            <Edit size={14} /> Edit
                          </Link>
                          <button
                            onClick={() => handleDeleteLecture(lecture.$id)}
                            className="btn-danger px-3 py-1.5 text-sm flex items-center gap-1"
                          >
                            <Trash size={14} /> Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );

      case 'students':
        return (
          <div className="mt-6">
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-2">Enrolled Students</h3>
              <p className="text-gray-600 dark:text-gray-400">
                View and manage students enrolled in this course
              </p>
            </div>
            <EnrolledStudents />
          </div>
        );

      case 'materials':
        return (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Study Materials</h3>
              <Link 
                to="upload-material"
                className="btn-primary flex items-center gap-2 px-4 py-2 rounded-lg"
              >
                <Upload size={18} /> Upload Material
              </Link>
            </div>

            {studyMaterials.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 dark:bg-dark-700 rounded-lg">
                <BookOpen size={48} className="mx-auto text-gray-400 mb-4" />
                <h4 className="text-lg font-medium text-gray-500">No study materials uploaded yet</h4>
                <p className="text-gray-400 mb-4">Upload PDFs, PPTs, or other resources for your students</p>
                <Link
                  to="upload-material"
                  className="btn-primary inline-flex items-center gap-2"
                >
                  <Upload size={16} /> Upload Material
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {studyMaterials.map((material) => (
                  <div 
                    key={material.$id} 
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow dark:border-dark-600"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`p-2 rounded-lg ${
                        material.fileType === 'pdf' ? 'bg-red-100 dark:bg-red-900/30' :
                        material.fileType === 'ppt' ? 'bg-orange-100 dark:bg-orange-900/30' :
                        material.fileType === 'doc' ? 'bg-blue-100 dark:bg-blue-900/30' :
                        'bg-gray-100 dark:bg-gray-700'
                      }`}>
                        {material.fileType === 'pdf' ? (
                          <FileText size={20} className="text-red-600 dark:text-red-400" />
                        ) : material.fileType === 'ppt' ? (
                          <FileText size={20} className="text-orange-600 dark:text-orange-400" />
                        ) : material.fileType === 'doc' ? (
                          <FileText size={20} className="text-blue-600 dark:text-blue-400" />
                        ) : (
                          <FileText size={20} className="text-gray-600 dark:text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold line-clamp-1">{material.title}</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                          {material.fileType}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                      {material.description}
                    </p>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500 dark:text-gray-400">
                        {new Date(material.uploadDate).toLocaleDateString()}
                      </span>
                      <div className="flex gap-3">
                        <a 
                          href={material.fileUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary-600 dark:text-primary-400 hover:underline"
                        >
                          View
                        </a>
                        <button
                          onClick={() => handleDeleteMaterial(material.$id)}
                          className="text-red-600 dark:text-red-400 hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-white dark:bg-dark-800 rounded-xl shadow-md p-6">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold">Teacher Panel</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('lectures')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'lectures' 
                ? 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400'
                : 'bg-gray-100 dark:bg-dark-700 hover:bg-gray-200 dark:hover:bg-dark-600'
            }`}
          >
            Live Lectures
          </button>
          <button
            onClick={() => setActiveTab('materials')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'materials' 
                ? 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400'
                : 'bg-gray-100 dark:bg-dark-700 hover:bg-gray-200 dark:hover:bg-dark-600'
            }`}
          >
            Study Materials
          </button>
        </div>
      </div>

      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('lectures')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'lectures' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center">
            <Video className="w-5 h-5 mr-2" />
            Live Lectures
          </div>
        </button>
        <button
          onClick={() => setActiveTab('materials')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'materials' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center">
            <BookOpen className="w-5 h-5 mr-2" />
            Study Materials
          </div>
        </button>
        <button
          onClick={() => setActiveTab('students')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'students' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center">
            <UserCheck className="w-5 h-5 mr-2" />
            Enrolled Students
          </div>
        </button>
      </div>

      {renderTabContent()}
    </div>
  );
};

export default TeacherPanel;