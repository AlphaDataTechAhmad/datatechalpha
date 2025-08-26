import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getPaymentByOrderId } from '../lib/appwrite';

const PaymentSuccess = () => {
  const router = useRouter();
  const [payment, setPayment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const { payment_id, order_id } = router.query;

    if (!order_id) {
      setError('No order ID found in the URL');
      setLoading(false);
      return;
    }

    const fetchPaymentDetails = async () => {
      try {
        const paymentData = await getPaymentByOrderId(order_id as string);
        if (!paymentData) {
          throw new Error('Payment details not found');
        }
        setPayment(paymentData);
      } catch (err) {
        console.error('Error fetching payment details:', err);
        setError('Failed to load payment details');
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentDetails();
  }, [router.query]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying your payment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Payment Verification Failed</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        <div className="bg-green-100 p-6 text-center">
          <div className="text-green-500 text-6xl mb-4">✓</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Payment Successful!</h1>
          <p className="text-green-700">Thank you for your purchase</p>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <h2 className="text-lg font-medium text-gray-700 mb-2">Order Details</h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">
                  <span className="font-medium">Order ID:</span> {payment.orderId}
                </p>
                <p className="text-sm text-gray-600 mb-1">
                  <span className="font-medium">Payment ID:</span> {payment.paymentId}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Date:</span> {new Date(payment.$createdAt).toLocaleString()}
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-medium text-gray-700 mb-2">Amount Paid</h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-2xl font-bold text-gray-800">
                  ₹{payment.amount.toLocaleString('en-IN')}
                  <span className="text-sm font-normal text-gray-500 ml-1">{payment.currency.toUpperCase()}</span>
                </p>
                <p className="text-sm text-green-600 mt-1">
                  Status: <span className="font-medium">Paid</span>
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-lg font-medium text-gray-700 mb-4">What's next?</h2>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 h-5 w-5 text-green-500 mr-3 mt-0.5">✓</div>
                <div>
                  <p className="text-gray-800">Your payment has been processed successfully.</p>
                  <p className="text-sm text-gray-500 mt-1">
                    You will receive a confirmation email with your order details.
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 h-5 w-5 text-green-500 mr-3 mt-0.5">✓</div>
                <div>
                  <p className="text-gray-800">Access your course materials.</p>
                  <p className="text-sm text-gray-500 mt-1">
                    You can now access all the course content in your dashboard.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => router.push('/courses')}
              className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Browse More Courses
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
