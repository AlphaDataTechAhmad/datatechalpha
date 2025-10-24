import React from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, User, Shield, Video, Settings, LogIn, Smartphone as SmartphoneIcon, BarChart } from 'lucide-react';

const IntelliTestHome = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">IntelliTest</h1>
          <p className="mt-1 text-sm text-gray-500">Advanced Online Examination Platform</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Student Portal Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                    <User className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <h3 className="text-lg font-medium text-gray-900">Student Portal</h3>
                    <p className="mt-1 text-sm text-gray-500">Take tests and view results</p>
                  </div>
                </div>
                <div className="mt-6">
                  <Link
                    to="/intellitest/student"
                    className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <LogIn className="mr-2 h-4 w-4" />
                    Enter as Student
                  </Link>
                </div>
              </div>
            </div>

            {/* Teacher Portal Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                    <LayoutDashboard className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <h3 className="text-lg font-medium text-gray-900">Teacher Portal</h3>
                    <p className="mt-1 text-sm text-gray-500">Create and manage exams</p>
                  </div>
                </div>
                <div className="mt-6">
                  <Link
                    to="/intellitest/teacher"
                    className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                  >
                    <LogIn className="mr-2 h-4 w-4" />
                    Enter as Teacher
                  </Link>
                </div>
              </div>
            </div>

            {/* Admin Portal Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <h3 className="text-lg font-medium text-gray-900">Admin Portal</h3>
                    <p className="mt-1 text-sm text-gray-500">System administration</p>
                  </div>
                </div>
                <div className="mt-6">
                  <Link
                    to="/intellitest/admin"
                    className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700"
                  >
                    <LogIn className="mr-2 h-4 w-4" />
                    Enter as Admin
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Features Section */}
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Key Features</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  name: 'AI Proctoring',
                  description: 'Advanced monitoring with face detection and behavior analysis',
                  icon: Video,
                },
                {
                  name: 'Secure Testing',
                  description: 'Browser lockdown and anti-cheating measures',
                  icon: Shield,
                },
                {
                  name: 'Flexible Question Types',
                  description: 'MCQ, coding challenges, and more',
                  icon: LayoutDashboard,
                },
                {
                  name: 'Real-time Analytics',
                  description: 'Detailed performance insights',
icon: BarChart,
                },
                {
                  name: 'Multi-device Support',
                  description: 'Access from any device',
                  icon: SmartphoneIcon,
                },
                {
                  name: 'Customizable',
                  description: 'Tailor the platform to your needs',
                  icon: Settings,
                },
              ].map((feature, index) => (
                <div key={index} className="bg-white overflow-hidden shadow rounded-lg p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-indigo-500 rounded-md p-2">
                      <feature.icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900">{feature.name}</h3>
                      <p className="mt-1 text-sm text-gray-500">{feature.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default IntelliTestHome;
