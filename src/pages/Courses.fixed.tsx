import React, { useState, useEffect } from 'react';
import { Search, BookOpen, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Force admin mode - this will override any other checks
const FORCE_ADMIN = true;

interface Course {
  $id: string;
  title: string;
  description: string;
  category: string;
  duration: string;
  price: number;
  image?: string;
  thumbnail?: string;
}

const CoursesPage = () => {
  const { user } = useAuth();
  
  // Debug info
  useEffect(() => {
    console.log('=== COURSES PAGE DEBUG ===');
    console.log('User:', user);
    console.log('User role:', user?.role);
    console.log('FORCE_ADMIN:', FORCE_ADMIN);
  }, [user]);

  // Sample course data for testing
  const testCourse = {
    $id: 'test123',
    title: 'Test Course',
    description: 'This is a test course to demonstrate admin access.',
    category: 'Test',
    duration: '1 hour',
    price: 0,
    thumbnail: 'https://via.placeholder.com/300x200?text=Course+Image'
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Debug Info Banner */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Debug Information</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>User ID: {user?.$id || 'Not logged in'}</p>
                <p>User Role: {user?.role || 'No role'}</p>
                <p>Admin Mode: {FORCE_ADMIN ? 'ENABLED (FORCED)' : 'Disabled'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
            Test Course Page
          </h1>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
            This page demonstrates admin access controls
          </p>
        </div>

        {/* Single Test Course Card */}
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl">
          <div className="md:flex">
            <div className="md:flex-shrink-0">
              <img 
                className="h-48 w-full object-cover md:w-48" 
                src={testCourse.thumbnail} 
                alt={testCourse.title} 
              />
            </div>
            <div className="p-8">
              <div className="uppercase tracking-wide text-sm text-indigo-500 font-semibold">
                {testCourse.category}
              </div>
              <Link to={`/course/${testCourse.$id}`} className="block mt-1 text-lg leading-tight font-medium text-black hover:underline">
                {testCourse.title}
              </Link>
              <p className="mt-2 text-gray-500">
                {testCourse.description}
              </p>
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="h-4 w-4 mr-1" />
                  {testCourse.duration}
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {testCourse.price > 0 ? `$${testCourse.price}` : 'Free'}
                </span>
              </div>
              
              {/* The Important Button */}
              <div className="mt-6">
                <Link
                  to={`/course/${testCourse.$id}`}
                  className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                >
                  View Course (Admin Mode Forced)
                  <span className="ml-2 px-2 py-0.5 text-xs bg-white/30 rounded-full">
                    Admin Access
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <h3 className="text-lg font-medium text-blue-800 mb-2">Testing Instructions</h3>
          <ul className="list-disc pl-5 space-y-1 text-blue-700 text-sm">
            <li>This is a test page with admin mode <strong>FORCED ON</strong> in the code</li>
            <li>The button should be green with "View Course (Admin Mode Forced)"</li>
            <li>Check browser console for debug information (Press F12)</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CoursesPage;
