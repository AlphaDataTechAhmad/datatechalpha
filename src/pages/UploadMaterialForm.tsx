import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Upload, FileText, X } from 'lucide-react';
import { databases, storage } from '../Services/appwrite';
import { useAuth } from '../contexts/AuthContext';
import { ID } from 'appwrite';

const UploadMaterialForm: React.FC = () => {
  const { courseId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    fileType: 'pdf',
  });
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !courseId || !file) return;

    try {
      setLoading(true);
      setError('');

      const fileResponse = await storage.createFile(
        'studyMaterials',
        ID.unique(),
        file
      );

      const fileUrl = storage.getFileView('studyMaterials', fileResponse.$id);

      await databases.createDocument(
        '68261b6a002ba6c3b584',
        'studyMaterials',
        ID.unique(),
        {
          ...formData,
          fileUrl,
          courseId,
          teacherId: user.$id,
          uploadDate: new Date().toISOString(),
        }
      );

      navigate(`/courses/${courseId}/teacher`);
    } catch (err) {
      setError('Failed to upload material. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-dark-800 rounded-xl shadow-md p-6 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Upload Study Material</h2>
        <button
          onClick={() => navigate(`/courses/${courseId}/teacher`)}
          className="text-gray-500 hover:text-gray-700"
        >
          <X size={24} />
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">File Type</label>
          <select
            name="fileType"
            value={formData.fileType}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="pdf">PDF</option>
            <option value="doc">Word Document</option>
            <option value="ppt">PowerPoint</option>
            <option value="video">Video</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">File</label>
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 mb-3 text-gray-400" />
                <p className="mb-2 text-sm text-gray-500">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500">
                  {file ? file.name : 'PDF, DOC, PPT, MP4 (MAX. 100MB)'}
                </p>
              </div>
              <input 
                type="file" 
                className="hidden" 
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.ppt,.pptx,.mp4"
                required
              />
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => navigate(`/courses/${courseId}/teacher`)}
            className="px-4 py-2 border rounded-lg hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !file}
            className="btn-primary px-4 py-2"
          >
            {loading ? 'Uploading...' : 'Upload Material'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UploadMaterialForm;