import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

const ShippingDelivery = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <Helmet>
        <title>Shipping and Delivery Policy - Your Site Name</title>
        <meta name="description" content="Review our Shipping and Delivery Policy to understand our shipping methods, delivery times, and related information." />
      </Helmet>
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Shipping and Delivery Policy</h1>
        <p className="text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>
      </div>

      <div className="prose max-w-none">
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Digital Products</h2>
          <p>
            All digital products are available for immediate download after purchase. You will receive an email with 
            download instructions and access to your purchased content.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. Physical Products</h2>
          <p>
            We process and ship physical products within 1-3 business days of order confirmation. Standard delivery 
            times vary by location but typically range from 3-10 business days.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. Shipping Methods and Costs</h2>
          <p>
            We offer the following shipping options:
            <ul className="list-disc pl-6 mt-2">
              <li>Standard Shipping: 3-7 business days (Free on orders over $50)</li>
              <li>Expedited Shipping: 2-3 business days ($12.99)</li>
              <li>Next Day Shipping: 1 business day ($24.99)</li>
            </ul>
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. International Shipping</h2>
          <p>
            We ship to most countries worldwide. International orders may be subject to customs fees, import duties, 
            and taxes which are the responsibility of the recipient.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Order Tracking</h2>
          <p>
            Once your order ships, you will receive a confirmation email with tracking information. You can track your 
            package using the provided tracking number on the carrier's website.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">6. Delivery Issues</h2>
          <p>
            If you experience any issues with your delivery, please contact our support team at 
            <a href="mailto:support@yoursite.com" className="text-primary-600 hover:underline">support@yoursite.com</a> 
            within 14 days of the estimated delivery date.
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

export default ShippingDelivery;
