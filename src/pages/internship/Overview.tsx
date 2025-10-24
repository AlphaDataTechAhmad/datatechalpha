import React from 'react';
import { Clock, Award, MapPin, Calendar, Briefcase } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';

interface InternshipContext {
  internship: {
    title: string;
    description: string;
    duration: string;
    company: string;
    location: string;
    stipend: string;
    startDate: string;
    requirements: string[];
    responsibilities: string[];
    skills: string[];
    type: 'full-time' | 'part-time' | 'remote';
    image?: string;
  };
  application: {
    status: string;
    payment_status: string;
  };
}

const Overview: React.FC = () => {
  const context = useOutletContext<InternshipContext>();
  const internship = context?.internship || {
    title: '',
    description: '',
    duration: '',
    company: '',
    location: '',
    stipend: '',
    startDate: new Date().toISOString(),
    requirements: [],
    responsibilities: [],
    skills: [],
    type: 'full-time'
  };
  const application = context?.application || {};
  const isPaymentCompleted = application?.payment_status === 'completed';
  
  // Ensure arrays are always defined
  const requirements = Array.isArray(internship.requirements) ? internship.requirements : [];
  const responsibilities = Array.isArray(internship.responsibilities) ? internship.responsibilities : [];
  
  // Ensure we have the required data
  if (!internship) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500">Loading internship details...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">About This Internship</h2>
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
          {internship.description || 'No description available.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
          <div className="flex items-center mb-2">
            <Clock className="w-5 h-5 text-blue-500 mr-2" />
            <h3 className="font-medium">Duration</h3>
          </div>
          <p className="text-gray-700 dark:text-gray-300">{internship.duration}</p>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
          <div className="flex items-center mb-2">
            <Award className="w-5 h-5 text-blue-500 mr-2" />
            <h3 className="font-medium">Stipend</h3>
          </div>
          <p className="text-gray-700 dark:text-gray-300">
            {internship.stipend || 'Unpaid'}
          </p>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
          <div className="flex items-center mb-2">
            <MapPin className="w-5 h-5 text-blue-500 mr-2" />
            <h3 className="font-medium">Location</h3>
          </div>
          <p className="text-gray-700 dark:text-gray-300">
            {internship.location || 'Remote'}
          </p>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
          <div className="flex items-center mb-2">
            <Calendar className="w-5 h-5 text-blue-500 mr-2" />
            <h3 className="font-medium">Start Date</h3>
          </div>
          <p className="text-gray-700 dark:text-gray-300">
            {new Date(internship.startDate).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
          <div className="flex items-center mb-2">
            <Briefcase className="w-5 h-5 text-blue-500 mr-2" />
            <h3 className="font-medium">Job Type</h3>
          </div>
          <p className="text-gray-700 dark:text-gray-300 capitalize">
            {internship?.type ? internship.type.replace('-', ' ') : 'Not specified'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
        <div>
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Requirements</h3>
          <ul className="space-y-2">
            {requirements.length > 0 ? (
              requirements.map((req, index) => (
              <li key={index} className="flex items-start">
                <span className="text-blue-500 mr-2 mt-1">•</span>
                <span className="text-gray-700 dark:text-gray-300">{req}</span>
              </li>
              ))
            ) : (
              <li className="text-gray-500 italic">No responsibilities specified.</li>
            )}
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            What You'll Do
          </h3>
          <ul className="space-y-2">
            {responsibilities.length > 0 ? (
              responsibilities.map((resp, index) => (
              <li key={index} className="flex items-start">
                <span className="text-blue-500 mr-2 mt-1">•</span>
                <span className="text-gray-700 dark:text-gray-300">{resp}</span>
              </li>
              ))
            ) : (
              <li className="text-gray-500 italic">No responsibilities specified.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Overview;
