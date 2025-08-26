import React, { createContext, useContext, ReactNode } from 'react';
import { TestData } from '@/types/test';

type TestContextType = {
  currentTest: TestData | null;
  setCurrentTest: (test: TestData | null) => void;
};

const TestContext = createContext<TestContextType | undefined>(undefined);

export const TestProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentTest, setCurrentTest] = React.useState<TestData | null>(null);

  return (
    <TestContext.Provider value={{ currentTest, setCurrentTest }}>
      {children}
    </TestContext.Provider>
  );
};

export const useTest = (): TestContextType => {
  const context = useContext(TestContext);
  if (context === undefined) {
    throw new Error('useTest must be used within a TestProvider');
  }
  return context;
};

export default TestContext;
