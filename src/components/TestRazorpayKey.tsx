import { useEffect, useState } from 'react';
import { testRazorpayKey } from '../hooks/useRazorpayPayment';

export const TestRazorpayKey = () => {
  const [result, setResult] = useState<{success: boolean; message: string; keyType?: string} | null>(null);
  const [loading, setLoading] = useState(false);

  const testKey = () => {
    setLoading(true);
    try {
      const testResult = testRazorpayKey();
      setResult(testResult);
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      padding: '20px',
      margin: '20px',
      border: '1px solid #ddd',
      borderRadius: '8px',
      maxWidth: '500px'
    }}>
      <h3>Razorpay Key Test</h3>
      <button 
        onClick={testKey}
        disabled={loading}
        style={{
          padding: '8px 16px',
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          marginBottom: '10px'
        }}
      >
        {loading ? 'Testing...' : 'Test Razorpay Key'}
      </button>
      
      {result && (
        <div style={{
          marginTop: '10px',
          padding: '10px',
          backgroundColor: result.success ? '#e8f5e9' : '#ffebee',
          borderLeft: `4px solid ${result.success ? '#4CAF50' : '#f44336'}`,
          borderRadius: '4px'
        }}>
          <p><strong>Status:</strong> {result.success ? '✅ Success' : '❌ Error'}</p>
          <p><strong>Message:</strong> {result.message}</p>
          {result.keyType && <p><strong>Key Type:</strong> {result.keyType}</p>}
        </div>
      )}
    </div>
  );
};

export default TestRazorpayKey;
