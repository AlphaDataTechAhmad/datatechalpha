import React, { useEffect, useState } from 'react';
import { RouterProvider } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './Services/realtimeUpdates';
import { router } from './Router';
import { ThemeProvider } from './contexts/ThemeContext';

// Import account service and utils
import { setAccountService } from './utils/subAdminUtils';
import { account } from './Services/appwrite';

// Initialize account service for sub-admin management
const initializeApp = async () => {
  try {
    setAccountService({
      create: async (userId: string, email: string, password: string, name: string) => {
        return await account.create(userId, email, password, name);
      }
    });
    return true;
  } catch (error) {
    console.error('Failed to initialize account service:', error);
    return false;
  }
};

const App: React.FC = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        await initializeApp();
        setIsInitialized(true);
      } catch (err) {
        console.error('Failed to initialize app:', err);
        setError('Failed to initialize application. Please refresh the page.');
      }
    };

    init();
  }, []);

  if (error) {
    return <div className="p-4 text-red-600">{error}</div>;
  }

  if (!isInitialized) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ThemeProvider>
  );
};

export default App;
