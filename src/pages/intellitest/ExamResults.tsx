import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, AlertCircle, BarChart, Clock, Award, BookOpen } from 'lucide-react';

// Mock data for exam results
const mockResults = {
  examId: 1,
  title: 'JavaScript Fundamentals',
  date: '2025-10-21',
  totalQuestions: 5,
  totalMarks: 13,
  passingMarks: 7,
  timeSpent: '45 minutes',
  score: 10,
  percentage: 77,
  passed: true,
  questions: [
    {
      id: 1,
      question: 'What is the output of `typeof null` in JavaScript?',
      type: 'mcq',
      correctAnswer: 0,
      userAnswer: 0,
      isCorrect: true,
      marksAwarded: 2,
      explanation: 'In JavaScript, `typeof null` returns "object". This is a well-known bug in JavaScript that can\'t be fixed because it would break existing code.'
    },
    {
      id: 2,
      question: 'JavaScript is a statically typed language.',
      type: 'true_false',
      correctAnswer: false,
      userAnswer: false,
      isCorrect: true,
      marksAwarded: 1,
      explanation: 'JavaScript is a dynamically typed language, which means variable types are determined at runtime.'
    },
    {
      id: 3,
      question: 'What does the `this` keyword refer to in JavaScript?',
      type: 'short_answer',
      correctAnswer: 'The object that the function is a property of',
      userAnswer: 'The window object',
      isCorrect: false,
      marksAwarded: 0,
      explanation: 'The value of `this` depends on how a function is called. In the global context, `this` refers to the global object (window in browsers), but in a method, it refers to the object the method is called on.'
    },
    {
      id: 4,
      question: 'Write a function that reverses a string in JavaScript.',
      type: 'coding',
      correctAnswer: 'function reverseString(str) { return str.split(""); }',
      userAnswer: 'function reverseString(str) { return str.split("").reverse().join(""); }',
      isCorrect: true,
      marksAwarded: 5,
      explanation: 'The function correctly reverses a string by splitting it into an array of characters, reversing the array, and joining it back into a string.'
    },
    {
      id: 5,
      question: 'Which method is used to add an element to the end of an array?',
      type: 'mcq',
      correctAnswer: 0,
      userAnswer: 1,
      isCorrect: false,
      marksAwarded: 0,
      explanation: 'The `push()` method adds one or more elements to the end of an array and returns the new length of the array.'
    }
  ]
};

const ExamResults = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const results = mockResults; // In a real app, fetch results based on examId

  // Calculate statistics
  const correctAnswers = results.questions.filter(q => q.isCorrect).length;
  const incorrectAnswers = results.questions.length - correctAnswers;
  const accuracy = Math.round((correctAnswers / results.questions.length) * 100);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            {results.passed ? (
              <span className="text-green-600">Congratulations! You Passed!</span>
            ) : (
              <span className="text-red-600">Exam Results</span>
            )}
          </h1>
          <p className="mt-3 text-xl text-gray-500">
            {results.title} - {new Date(results.date).toLocaleDateString()}
          </p>
        </div>

        {/* Score Summary */}
        <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
          <div className="px-6 py-5 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Score Summary</h2>
          </div>
          <div className="px-6 py-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                    <BarChart className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-5">
                    <p className="text-sm font-medium text-gray-500 truncate">Score</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {results.score} / {results.totalMarks}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-5">
                    <p className="text-sm font-medium text-gray-500 truncate">Correct</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {correctAnswers} / {results.questions.length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
                    <AlertCircle className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-5">
                    <p className="text-sm font-medium text-gray-500 truncate">Accuracy</p>
                    <p className="text-2xl font-semibold text-gray-900">{accuracy}%</p>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-purple-100 rounded-md p-3">
                    <Clock className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-5">
                    <p className="text-sm font-medium text-gray-500 truncate">Time Spent</p>
                    <p className="text-2xl font-semibold text-gray-900">{results.timeSpent}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Graph */}
        <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
          <div className="px-6 py-5 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Performance Overview</h2>
          </div>
          <div className="px-6 py-5">
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center p-6">
                <BarChart className="h-12 w-12 mx-auto text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Performance Analytics</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Detailed performance analytics will be displayed here.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Question Review */}
        <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
          <div className="px-6 py-5 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Question Review</h2>
            <p className="mt-1 text-sm text-gray-500">
              Review your answers and see the correct solutions.
            </p>
          </div>
          <div className="divide-y divide-gray-200">
            {results.questions.map((q, index) => (
              <div key={q.id} className="p-6">
                <div className="flex items-start">
                  <div className={`flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center ${q.isCorrect ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                    {q.isCorrect ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-md font-medium text-gray-900">
                        Question {index + 1}
                      </h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${q.isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {q.marksAwarded} / {q.marksAwarded === 0 ? q.marksAwarded + 1 : q.marksAwarded} point{q.marksAwarded !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <p className="mt-1 text-gray-700">{q.question}</p>
                    
                    {q.type === 'mcq' && (
                      <div className="mt-3 space-y-2">
                        <p className="text-sm font-medium text-gray-900">Your answer:</p>
                        <div className={`p-3 rounded-md ${q.isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                          {q.isCorrect ? (
                            <span className="text-green-700">
                              <CheckCircle className="inline h-4 w-4 mr-1" />
                              {q.userAnswer !== undefined && typeof q.userAnswer === 'number' && q.options && q.options[q.userAnswer]}
                            </span>
                          ) : (
                            <div>
                              <div className="text-red-700">
                                <XCircle className="inline h-4 w-4 mr-1" />
                                {q.userAnswer !== undefined && typeof q.userAnswer === 'number' && q.options && q.options[q.userAnswer]}
                              </div>
                              <div className="mt-2 text-green-700 border-t border-green-200 pt-2">
                                <CheckCircle className="inline h-4 w-4 mr-1" />
                                Correct answer: {q.options && q.options[q.correctAnswer]}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {q.type === 'true_false' && (
                      <div className="mt-3 space-y-2">
                        <p className="text-sm font-medium text-gray-900">Your answer:</p>
                        <div className={`p-3 rounded-md ${q.isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                          {q.isCorrect ? (
                            <span className="text-green-700">
                              <CheckCircle className="inline h-4 w-4 mr-1" />
                              {q.userAnswer ? 'True' : 'False'}
                            </span>
                          ) : (
                            <div>
                              <div className="text-red-700">
                                <XCircle className="inline h-4 w-4 mr-1" />
                                {q.userAnswer ? 'True' : 'False'}
                              </div>
                              <div className="mt-2 text-green-700 border-t border-green-200 pt-2">
                                <CheckCircle className="inline h-4 w-4 mr-1" />
                                Correct answer: {q.correctAnswer ? 'True' : 'False'}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {q.type === 'short_answer' && (
                      <div className="mt-3 space-y-2">
                        <p className="text-sm font-medium text-gray-900">Your answer:</p>
                        <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                          {q.userAnswer || 'No answer provided'}
                        </div>
                        {!q.isCorrect && (
                          <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
                            <p className="text-sm font-medium text-green-800">Expected answer:</p>
                            <p className="mt-1 text-green-700">{q.correctAnswer}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {q.type === 'coding' && (
                      <div className="mt-3 space-y-2">
                        <p className="text-sm font-medium text-gray-900">Your solution:</p>
                        <div className="bg-gray-800 text-white p-4 rounded-md font-mono text-sm overflow-x-auto">
                          <pre>{q.userAnswer || '// No code submitted'}</pre>
                        </div>
                        {q.isCorrect ? (
                          <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md text-green-700">
                            <CheckCircle className="inline h-4 w-4 mr-1" />
                            Your solution passed all test cases.
                          </div>
                        ) : (
                          <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
                            <p className="text-sm font-medium text-red-800">Expected solution:</p>
                            <div className="mt-1 bg-gray-800 text-white p-3 rounded font-mono text-sm overflow-x-auto">
                              <pre>{q.correctAnswer}</pre>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {q.explanation && (
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                        <p className="text-sm font-medium text-blue-800">Explanation:</p>
                        <p className="mt-1 text-blue-700">{q.explanation}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-5">
            <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
              <div className="flex items-center">
                <Award className="h-5 w-5 text-yellow-500 mr-2" />
                <p className="text-sm text-gray-600">
                  {results.passed
                    ? 'You have successfully passed this exam!'
                    : `You need ${results.passingMarks - results.score} more points to pass.`}
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => navigate(-1)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Back to Dashboard
                </button>
                <button
                  onClick={() => {}}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  View Certificate
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamResults;
