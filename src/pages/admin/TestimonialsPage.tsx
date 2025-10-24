import React from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';

const TestimonialsPage = () => {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Testimonials Management</h1>
        <Link
          to="/admin/testimonials/manage"
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <MessageSquare className="w-5 h-5 mr-2" />
          Manage Testimonials
        </Link>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <p className="text-gray-600 dark:text-gray-300">
          Manage student testimonials that appear on the website. Click the button above to view and manage all testimonials.
        </p>
      </div>
    </div>
  );
};

export default TestimonialsPage;
