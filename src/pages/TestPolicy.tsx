import React from 'react';
import { Link } from 'react-router-dom';

const TestPolicy = () => {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6">Policy Pages Test</h1>
        <div className="space-y-4">
          <div className="p-4 border rounded">
            <h2 className="text-xl font-semibold mb-2">Privacy Policy</h2>
            <Link 
              to="/privacy-policy" 
              className="text-blue-600 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Open Privacy Policy
            </Link>
          </div>
          
          <div className="p-4 border rounded">
            <h2 className="text-xl font-semibold mb-2">Terms and Conditions</h2>
            <Link 
              to="/terms-and-conditions" 
              className="text-blue-600 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Open Terms and Conditions
            </Link>
          </div>
          
          <div className="p-4 border rounded">
            <h2 className="text-xl font-semibold mb-2">Cancellation and Refund</h2>
            <Link 
              to="/cancellation-refund" 
              className="text-blue-600 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Open Cancellation and Refund Policy
            </Link>
          </div>
          
          <div className="p-4 border rounded">
            <h2 className="text-xl font-semibold mb-2">Shipping and Delivery</h2>
            <Link 
              to="/shipping-delivery" 
              className="text-blue-600 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Open Shipping and Delivery Policy
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestPolicy;
