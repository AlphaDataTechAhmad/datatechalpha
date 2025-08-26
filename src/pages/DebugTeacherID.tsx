import React, { useState, useEffect } from 'react';
import { debugCheckTeacherID } from '../Services/teacherService';

const DebugTeacherID = () => {
  const [teacherID, setTeacherID] = useState('TECH10048260');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCheck = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await debugCheckTeacherID(teacherID);
      setResult(data);
    } catch (err) {
      setError('Error checking teacher ID');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleCheck();
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Debug Teacher ID</h1>
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          value={teacherID}
          onChange={(e) => setTeacherID(e.target.value)}
          style={{ padding: '8px', marginRight: '10px' }}
        />
        <button 
          onClick={handleCheck}
          disabled={loading}
          style={{ 
            padding: '8px 16px', 
            backgroundColor: '#4CAF50', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {loading ? 'Checking...' : 'Check'}
        </button>
      </div>
      
      {error && (
        <div style={{ color: 'red', marginBottom: '20px' }}>{error}</div>
      )}
      
      {result && (
        <div style={{ 
          backgroundColor: '#f5f5f5', 
          padding: '15px', 
          borderRadius: '4px',
          whiteSpace: 'pre-wrap',
          fontFamily: 'monospace'
        }}>
          <h3>Database Record:</h3>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
      
      <div style={{ marginTop: '20px', color: '#666' }}>
        <p>Console will show additional debug information.</p>
      </div>
    </div>
  );
};

export default DebugTeacherID;
