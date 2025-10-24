import React, { useState } from 'react';
import { useDropzone, FileWithPath } from 'react-dropzone';
import { FileText, Upload, X } from 'lucide-react';
import { Button } from '../ui/button';
import { useAuth } from '../../contexts/AuthContext';
import { uploadStudyMaterial } from '../../Services/studyMaterialService';

interface UploadStudyMaterialProps {
  courseId: string;
  onUploadSuccess: () => void;
}

const UploadStudyMaterial: React.FC<UploadStudyMaterialProps> = ({ courseId, onUploadSuccess }) => {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: '',
    tags: '',
    isPublic: true,
  });

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-powerpoint': ['.ppt'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
    },
    maxFiles: 1,
    onDrop: (acceptedFiles: FileWithPath[]) => {
      setFile(acceptedFiles[0]);
      if (!formData.title) {
        setFormData(prev => ({
          ...prev,
          title: acceptedFiles[0].name.split('.').slice(0, -1).join('.')
        }));
      }
    },
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validate required fields
    if (!file) {
      alert('Please select a file to upload');
      return;
    }
    
    if (!user) {
      alert('You must be logged in to upload materials');
      return;
    }
    
    if (!courseId) {
      console.error('Error: No courseId provided to UploadStudyMaterial');
      alert('Error: Could not determine the course. Please refresh the page and try again.');
      return;
    }

    console.log('Uploading file with courseId:', courseId);
    
    setIsUploading(true);
    try {
      await uploadStudyMaterial(file, {
        ...formData,
        courseId: courseId, // Ensure courseId is included
        teacherId: user.$id,
        uploadedBy: user.$id,
        fileType: file.type || file.name.split('.').pop() || '',
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      });
      
      setFile(null);
      setFormData({
        title: '',
        description: '',
        subject: '',
        tags: '',
        isPublic: true,
      });
      
      onUploadSuccess();
    } catch (error) {
      console.error('Error uploading file:', error);
      // Handle error (show toast/notification)
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = () => {
    setFile(null);
  };

  return (
    <div className="bg-white dark:bg-dark-800 rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <FileText className="h-5 w-5 mr-2 text-primary-500" />
        Upload Study Material
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div 
          {...getRootProps()} 
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragActive 
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
              : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500'
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center space-y-2">
            <Upload className="h-10 w-10 text-gray-400" />
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {isDragActive 
                ? 'Drop the file here' 
                : 'Drag & drop a file here, or click to select'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              PDF, DOCX, PPTX (max 10MB)
            </p>
          </div>
        </div>

        {file && (
          <div className="flex items-center justify-between bg-gray-50 dark:bg-dark-700 p-3 rounded-md">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-xs">
                {file.name}
              </span>
              <span className="text-xs text-gray-500">
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </span>
            </div>
            <button
              type="button"
              onClick={removeFile}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-dark-700 dark:text-white"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-dark-700 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Subject
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-dark-700 dark:text-white"
              />
            </div>

            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tags (comma separated)
              </label>
              <input
                type="text"
                id="tags"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                placeholder="e.g., notes, chapter1, important"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-dark-700 dark:text-white"
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isPublic"
              name="isPublic"
              checked={formData.isPublic}
              onChange={handleInputChange}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
              Make this material public to all students
            </label>
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={!file || isUploading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? 'Uploading...' : 'Upload Material'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default UploadStudyMaterial;
