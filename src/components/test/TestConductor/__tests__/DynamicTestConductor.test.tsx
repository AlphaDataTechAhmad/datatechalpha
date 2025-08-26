import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { TestProvider } from '../context/TestContext';
import DynamicTestConductor from '../DynamicTestConductor';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock the test data
const mockTestData = {
  id: 'test-1',
  title: 'Sample Test',
  description: 'A test with multiple sections',
  duration: 60,
  passingScore: 70,
  sections: [
    {
      id: 'section-1',
      title: 'Section 1',
      description: 'First section',
      questions: [
        {
          id: 'q1',
          question: 'What is 2+2?',
          options: ['2', '3', '4', '5'],
          correctAnswer: 2,
          marks: 1,
          explanation: '2+2 equals 4'
        },
        {
          id: 'q2',
          question: 'What is the capital of France?',
          options: ['London', 'Berlin', 'Paris', 'Madrid'],
          correctAnswer: 2,
          marks: 1,
          explanation: 'Paris is the capital of France'
        }
      ]
    },
    {
      id: 'section-2',
      title: 'Section 2',
      description: 'Second section',
      questions: [
        {
          id: 'q3',
          question: 'What is the largest planet?',
          options: ['Earth', 'Jupiter', 'Saturn', 'Neptune'],
          correctAnswer: 1,
          marks: 1,
          explanation: 'Jupiter is the largest planet'
        }
      ]
    }
  ]
};

// Mock the useTest hook
vi.mock('../hooks/useTest', () => ({
  useTest: (testId: string) => ({
    test: mockTestData,
    loading: false,
    error: null,
  }),
}));

describe('DynamicTestConductor', () => {
  const renderTestConductor = () => {
    return render(
      <MemoryRouter initialEntries={['/test/test-1']}>
        <Routes>
          <Route 
            path="/test/:testId" 
            element={
              <TestProvider testId="test-1">
                <DynamicTestConductor />
              </TestProvider>
            } 
          />
        </Routes>
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    // Mock localStorage
    Storage.prototype.getItem = vi.fn(() => 'light');
  });

  it('renders test instructions initially', async () => {
    renderTestConductor();
    
    // Check if test title is displayed
    expect(await screen.findByText('Sample Test')).toBeInTheDocument();
    
    // Check if start test button is present
    expect(screen.getByRole('button', { name: /start test/i })).toBeInTheDocument();
  });

  it('navigates to section selection after starting test', async () => {
    renderTestConductor();
    
    // Start the test
    fireEvent.click(screen.getByRole('button', { name: /start test/i }));
    
    // Check if section selection is shown
    expect(await screen.findByText('Section 1')).toBeInTheDocument();
    expect(screen.getByText('Section 2')).toBeInTheDocument();
  });

  it('allows navigating between questions within a section', async () => {
    renderTestConductor();
    
    // Start the test and navigate to first section
    fireEvent.click(screen.getByRole('button', { name: /start test/i }));
    fireEvent.click(await screen.findByText('Section 1'));
    
    // Check first question is displayed
    expect(await screen.findByText('What is 2+2?')).toBeInTheDocument();
    
    // Navigate to next question
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    
    // Check second question is displayed
    expect(await screen.findByText('What is the capital of France?')).toBeInTheDocument();
    
    // Navigate back to first question
    fireEvent.click(screen.getByRole('button', { name: /previous/i }));
    
    // Check first question is displayed again
    expect(await screen.findByText('What is 2+2?')).toBeInTheDocument();
  });

  it('allows selecting answers and marks them as answered', async () => {
    renderTestConductor();
    
    // Start the test and navigate to first section
    fireEvent.click(screen.getByRole('button', { name: /start test/i }));
    fireEvent.click(await screen.findByText('Section 1'));
    
    // Select an answer
    const option = await screen.findByText('4');
    fireEvent.click(option);
    
    // Check if answer is selected
    expect(option.closest('button')).toHaveClass('bg-primary');
    
    // Check if question is marked as answered in the question palette
    const questionButtons = screen.getAllByRole('button', { name: /question \d+/i });
    expect(questionButtons[0]).toHaveClass('bg-green-500');
  });

  it('allows marking questions for review', async () => {
    renderTestConductor();
    
    // Start the test and navigate to first section
    fireEvent.click(screen.getByRole('button', { name: /start test/i }));
    fireEvent.click(await screen.findByText('Section 1'));
    
    // Mark question for review
    const markButton = screen.getByRole('button', { name: /mark for review/i });
    fireEvent.click(markButton);
    
    // Check if button text changes
    expect(screen.getByRole('button', { name: /marked for review/i })).toBeInTheDocument();
    
    // Check if question is marked in the question palette
    const questionButtons = screen.getAllByRole('button', { name: /question \d+/i });
    expect(questionButtons[0]).toHaveClass('border-yellow-500');
  });

  it('allows navigating between sections', async () => {
    renderTestConductor();
    
    // Start the test
    fireEvent.click(screen.getByRole('button', { name: /start test/i }));
    
    // Go to first section
    fireEvent.click(await screen.findByText('Section 1'));
    expect(await screen.findByText('What is 2+2?')).toBeInTheDocument();
    
    // Open section selector
    fireEvent.click(screen.getByRole('button', { name: /sections/i }));
    
    // Go to second section
    fireletEvent.click(screen.getByText('Section 2'));
    
    // Check if second section's question is displayed
    expect(await screen.findByText('What is the largest planet?')).toBeInTheDocument();
  });
});
