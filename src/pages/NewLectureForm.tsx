import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Clock, Calendar, X } from 'lucide-react';
import { databases } from '../Services/appwrite';
import { useAuth } from '../contexts/AuthContext';
import { ID } from 'appwrite';

const NewLectureForm: React.FC = () => {
  const { courseId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    scheduledTime: '',
    duration: '60 minutes',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !courseId) return;

    try {
      setLoading(true);
      setError('');

      await databases.createDocument(
        '68261b6a002ba6c3b584',
        'liveLectures',
        ID.unique(),
        {
          ...formData,
          courseId,
          teacherId: user.$id,
          status: 'scheduled',
        }
      );

      navigate(`/courses/${courseId}/teacher`);
    } catch (err) {
      setError('Failed to schedule lecture. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-dark-800 rounded-xl shadow-md p-6 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Schedule New Lecture</h2>
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
          <label className="block text-sm font-medium mb-1">Lecture Title</label>
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-1">Scheduled Time</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar size={16} className="text-gray-400" />
              </div>
              <input
                type="datetime-local"
                name="scheduledTime"
                value={formData.scheduledTime}
                onChange={handleChange}
                required
                className="w-full pl-10 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Duration</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Clock size={16} className="text-gray-400" />
              </div>
              <select
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                className="w-full pl-10 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="30 minutes">30 minutes</option>
                <option value="60 minutes">60 minutes</option>
                <option value="90 minutes">90 minutes</option>
                <option value="120 minutes">120 minutes</option>
              </select>
            </div>
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
            disabled={loading}
            className="btn-primary px-4 py-2"
          >
            {loading ? 'Scheduling...' : 'Schedule Lecture'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewLectureForm;