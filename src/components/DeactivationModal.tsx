import React from 'react';
import { X, LogOut, Mail } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface DeactivationModalProps {
  onClose: () => void;
}

const DeactivationModal: React.FC<DeactivationModalProps> = ({ onClose }) => {
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    onClose();
  };

  const handleContactAdmin = () => {
    window.location.href = 'mailto:support@datatechi.com';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <X size={20} />
        </button>
        
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <X className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="mt-3 text-lg font-medium text-gray-900">Account Deactivated</h3>
          <div className="mt-2">
            <p className="text-sm text-gray-500">
              Your account has been deactivated by the administrator. Please contact support for more information.
            </p>
          </div>
          <div className="mt-6 flex flex-col space-y-3">
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </button>
            <button
              type="button"
              onClick={handleContactAdmin}
              className="inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Mail className="mr-2 h-4 w-4" />
              Contact Administrator
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeactivationModal;
