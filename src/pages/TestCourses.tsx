import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

const TestCourses = () => {
  const { user } = useAuth();
  
  // Check admin status
  const isAdmin = user?.role === 'admin' || user?.role === 'subadmin';
  
  // Debug info
  console.log('TestCourses - User:', user);
  console.log('TestCourses - isAdmin:', isAdmin);
  
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Test Courses Page</h1>
        
        {/* Debug Info */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8">
          <h2 className="font-bold mb-2">Debug Information</h2>
          <pre className="text-xs bg-black text-white p-2 rounded overflow-auto">
            {JSON.stringify({
              userId: user?.$id || 'No user',
              userRole: user?.role || 'No role',
              isAdmin,
              timestamp: new Date().toISOString()
            }, null, 2)}
          </pre>
        </div>
        
        {/* Test Button */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Test Admin Access</h2>
          
          <div className="mt-4">
            <Link
              to="/test-course"
              className={`inline-flex items-center px-4 py-2 rounded-md text-white ${
                isAdmin 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isAdmin ? 'View Course (Admin)' : 'Enroll Now'}
              {isAdmin && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-white/20 rounded-full">
                  Admin Access
                </span>
              )}
            </Link>
          </div>
          
          <div className="mt-6 p-4 bg-gray-50 rounded">
            <p className="font-medium">Expected Behavior:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
              <li>If you're an admin/subadmin, the button should be green and say "View Course"</li>
              <li>Otherwise, it should be blue and say "Enroll Now"</li>
              <li>Check the console for debug information</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestCourses;
