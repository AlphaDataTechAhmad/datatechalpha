import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Lock } from 'lucide-react';

const DeactivationBanner: React.FC = () => {
  const { isDeactivated, logout } = useAuth();
  const navigate = useNavigate();
  
  // Prevent scrolling and add class to body when modal is open
  useEffect(() => {
    if (isDeactivated) {
      document.body.style.overflow = 'hidden';
      document.body.classList.add('deactivated-account');
    } else {
      document.body.style.overflow = 'unset';
      document.body.classList.remove('deactivated-account');
    }
    
    return () => {
      document.body.style.overflow = 'unset';
      document.body.classList.remove('deactivated-account');
    };
  }, [isDeactivated]);

  if (!isDeactivated) return null;

  const handleContactAdmin = () => {
    window.location.href = 'mailto:admin@datatechi.com?subject=Account%20Deactivated%20-%20Assistance%20Required';
  };

  // Handle logout click
  const handleLogout = async () => {
    await logout();
    navigate('/'); // Redirect to home page after logout
  };

  return (
    <>
      {/* Full page blur overlay */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999]"></div>
      
      {/* Header mask - positioned below modal but above other content */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-black/50 backdrop-blur-sm z-[9998]"></div>
      
      {/* Modal */}
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
        <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-xl max-w-md w-full p-6 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
            <Lock className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Account Deactivated
          </h3>
          
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Your account has been deactivated by the administrator. Please contact support for more information.
          </p>
          
          <div className="space-y-3">
            <button
              onClick={handleLogout}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Logout
            </button>
            
            <button
              onClick={handleContactAdmin}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/30 hover:bg-indigo-200 dark:hover:bg-indigo-800/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Contact Administrator
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default DeactivationBanner;
