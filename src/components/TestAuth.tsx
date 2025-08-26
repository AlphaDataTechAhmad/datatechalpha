
import { useAuth } from '../contexts/AuthContext';

const TestAuth = () => {
  const { user, isAuthenticated, isLoading, login, logout } = useAuth();

  const handleTestLogin = async () => {
    try {
      console.log('Attempting login...');
      const result = await login('test@example.com', 'password');
      console.log('Login result:', result);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>Auth Test Component</h2>
      <div style={{ marginBottom: '20px' }}>
        <p>Status: {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</p>
        {user && (
          <div>
            <p>User: {user.email}</p>
            <p>Name: {user.name}</p>
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button 
          onClick={handleTestLogin}
          style={{
            padding: '8px 16px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Test Login
        </button>
        <button 
          onClick={logout}
          style={{
            padding: '8px 16px',
            backgroundColor: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default TestAuth;
