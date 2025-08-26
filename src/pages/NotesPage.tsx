import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, ArrowLeft, Plus, Loader } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useAuth } from '../contexts/AuthContext';
import { useCourse } from '../contexts/CourseContext';
import StudyMaterialList from '../components/study-material/StudyMaterialList';
import UploadStudyMaterial from '../components/study-material/UploadStudyMaterial';

const NotesPage: React.FC = () => {
  const navigate = useNavigate();
  const { course, loading } = useCourse();
  const { user } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const isTeacher = user?.role === 'teacher';
  
  // Debug log
  console.log('NotesPage - Course:', course);
  console.log('NotesPage - Course ID:', course?.courseId || course?.id);
  
  // Ensure we have a valid course ID
  const currentCourseId = course?.courseId || course?.id;

  const handleUploadSuccess = () => {
    setShowUploadForm(false);
    setRefreshKey(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
          Course Not Found
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          The requested course could not be found.
        </p>
        <Button 
          onClick={() => navigate('/courses')} 
          className="inline-flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Courses
        </Button>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="bg-white dark:bg-dark-800 rounded-xl shadow-sm p-6">
        <div className="flex items-center mb-6">
          <FileText className="h-6 w-6 text-primary-500 mr-2" />
          <h2 className="text-2xl font-bold dark:text-white">Study Material</h2>
        </div>
        <div className="text-center py-12">
          <p className="text-lg text-dark-600 dark:text-dark-300 mb-6">
            No course data available. Please select a course to view its study materials.
          </p>
          <Button 
            onClick={() => navigate('/courses')} 
            className="inline-flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Courses
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-dark-800 rounded-xl shadow-sm p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div className="flex items-center">
          <FileText className="h-6 w-6 text-primary-500 mr-2" />
          <h2 className="text-2xl font-bold dark:text-white">Study Material</h2>
          <span className="ml-4 text-dark-500 dark:text-dark-400 hidden sm:inline">
            {course.title}
          </span>
        </div>
        
        <div className="flex items-center space-x-3">
          {isTeacher && (
            <>
              {!showUploadForm ? (
                <Button
                  onClick={() => setShowUploadForm(true)}
                  className="flex items-center gap-1.5"
                >
                  <Plus className="h-4 w-4" />
                  <span>Upload Material</span>
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => setShowUploadForm(false)}
                  className="flex items-center gap-1.5"
                >
                  Cancel
                </Button>
              )}
            </>
          )}
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => window.history.back()}
            className="flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>
      </div>
      
      <div className="space-y-6">
        {isTeacher && showUploadForm && currentCourseId && (
          <UploadStudyMaterial 
            courseId={currentCourseId}
            onUploadSuccess={handleUploadSuccess}
          />
        )}
        
        <div className="bg-white dark:bg-dark-800 rounded-lg shadow">
          {currentCourseId && (
            <StudyMaterialList 
              key={refreshKey} 
              courseId={currentCourseId}
              isTeacher={isTeacher}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default NotesPage;