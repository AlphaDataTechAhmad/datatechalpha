import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

const CancellationRefund = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <Helmet>
        <title>Cancellation and Refund Policy - Your Site Name</title>
        <meta name="description" content="Review our Cancellation and Refund Policy to understand our terms for cancellations and refunds." />
      </Helmet>
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Cancellation and Refund Policy</h1>
        <p className="text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>
      </div>

      <div className="prose max-w-none">
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Cancellation Policy</h2>
          <p>
            You may cancel your subscription at any time. Your cancellation will take effect at the end of your current 
            billing period. No refunds will be provided for the current billing period.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. Refund Policy</h2>
          <p>
            We offer a 14-day money-back guarantee for new subscribers. If you're not satisfied with our service, 
            you may request a full refund within 14 days of your initial purchase.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. How to Request a Refund</h2>
          <p>
            To request a refund, please contact our support team at 
            <a href="hr@datatechalpha.com" className="text-primary-600 hover:underline">support@yoursite.com</a> 
            with your order details and reason for the refund request.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Processing Time</h2>
          <p>
            Refunds are typically processed within 5-7 business days. The time it takes for the refund to appear in your 
            account depends on your payment method and financial institution.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">5. Non-Refundable Items</h2>
          <p>
            The following items are non-refundable:
            <ul className="list-disc pl-6 mt-2">
              <li>Downloadable digital products</li>
              <li>Services already rendered</li>
              <li>Gift cards or promotional codes</li>
            </ul>
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

export default CancellationRefund;
