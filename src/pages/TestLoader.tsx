import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getTestById } from '@/utils/testUtils';
import { TestData } from '@/types/test';

const TestLoader: React.FC = () => {
  const { testId } = useParams<{ testId: string }>();
  const [test, setTest] = useState<TestData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTest = async () => {
      if (!testId) {
        setError('No test ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const loadedTest = await getTestById(testId);
        if (loadedTest) {
          setTest(loadedTest);
        } else {
          setError(`Test with ID "${testId}" not found`);
        }
      } catch (err) {
        console.error('Error loading test:', err);
        setError('Failed to load test. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadTest();
  }, [testId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading test...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">No test data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">{test.title}</h1>
          <p className="text-gray-600 mb-4">{test.description}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-700">Duration</h3>
              <p className="text-lg">{test.duration} minutes</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-700">Passing Score</h3>
              <p className="text-lg">{test.passingScore}%</p>
            </div>
          </div>

          <h2 className="text-xl font-semibold text-gray-800 mb-4">Questions ({test.questions.length})</h2>
          
          <div className="space-y-6">
            {test.questions.map((question, index) => (
              <div key={question.id} className="border-b border-gray-200 pb-6 last:border-b-0">
                <div className="flex items-start">
                  <span className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 text-blue-800 font-medium mr-3">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900 mb-3">{question.question}</h3>
                    
                    <div className="space-y-2">
                      {question.options.map((option, optionIndex) => (
                        <div 
                          key={optionIndex}
                          className={`p-3 border rounded-md ${
                            question.correctAnswer === optionIndex 
                              ? 'bg-green-50 border-green-200' 
                              : 'border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center">
                            <span className="font-medium text-gray-700 mr-2">
                              {String.fromCharCode(65 + optionIndex)}.
                            </span>
                            <span>{option}</span>
                            {question.correctAnswer === optionIndex && (
                              <span className="ml-auto text-green-600">
                                ✓ Correct Answer
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {question.explanation && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-md">
                        <p className="text-sm text-blue-800">
                          <span className="font-medium">Explanation:</span> {question.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestLoader;
