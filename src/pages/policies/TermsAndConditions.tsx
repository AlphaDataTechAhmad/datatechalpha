import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

const TermsAndConditions = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <Helmet>
        <title>Terms and Conditions - Your Site Name</title>
        <meta name="description" content="Review our Terms and Conditions to understand the rules and guidelines for using our platform." />
      </Helmet>
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Terms and Conditions</h1>
        <p className="text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>
      </div>

      <div className="prose max-w-none">
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
          <p>
            These Terms and Conditions govern your use of our website and services. By accessing or using our platform, 
            you agree to be bound by these terms.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. User Accounts</h2>
          <p>
            You are responsible for maintaining the confidentiality of your account credentials and for all activities 
            that occur under your account.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. Intellectual Property</h2>
          <p>
            All content on our platform, including text, graphics, logos, and software, is the property of our company 
            or its licensors and is protected by intellectual property laws.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Limitation of Liability</h2>
          <p>
            We are not liable for any indirect, incidental, or consequential damages arising from your use of our services.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">5. Governing Law</h2>
          <p>
            These terms shall be governed by and construed in accordance with the laws of [Your Country/State], 
            without regard to its conflict of law provisions.
          </p>
        </section>
      </div>

      <div className="mt-12 pt-6 border-t border-gray-200">
        <Link to="/" className="text-primary-600 hover:underline flex items-center">
          ← Back to Home
        </Link>
      </div>
    </div>
  );
};

export default TermsAndConditions;
