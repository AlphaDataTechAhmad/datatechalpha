import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getTestsByCourseId, createTest, updateTest, deleteTest, addQuestionToTest, updateQuestionInTest, deleteQuestionFromTest } from '../../services/testService';
import type { CourseTest, TestQuestion } from '../../pages/Tests';

interface TestManagementProps {
  courseId: string;
}

const TestManagement: React.FC<TestManagementProps> = ({ courseId }) => {
  const { user } = useAuth();
  const [tests, setTests] = useState<CourseTest[]>([]);
  const [selectedTest, setSelectedTest] = useState<CourseTest | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [newQuestion, setNewQuestion] = useState<Omit<TestQuestion, 'id' | 'marked'>>({
    question: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    explanation: '',
    hindiQuestion: '',
    hindiOptions: ['', '', '', '']
  });

  // Form state for test
  const [testForm, setTestForm] = useState<Omit<CourseTest, 'id' | 'questions'>>({
    courseId,
    title: '',
    description: '',
    duration: 1800, // 30 minutes
    passingScore: 70,
    instructions: [''],
    negativeMarking: 0
  });

  // Load tests for the course
  useEffect(() => {
    const loadTests = async () => {
      try {
        const loadedTests = await getTestsByCourseId(courseId);
        setTests(loadedTests);
      } catch (error) {
        console.error('Failed to load tests:', error);
      }
    };

    loadTests();
  }, [courseId]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTestForm(prev => ({
      ...prev,
      [name]: name === 'duration' || name === 'passingScore' || name === 'negativeMarking' 
        ? Number(value) 
        : value
    }));
  };

  // Handle question input changes
  const handleQuestionChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewQuestion(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle option changes
  const handleOptionChange = (index: number, value: string, isHindi = false) => {
    if (isHindi) {
      setNewQuestion(prev => {
        const newOptions = [...(prev.hindiOptions || [])];
        newOptions[index] = value;
        return { ...prev, hindiOptions: newOptions };
      });
    } else {
      setNewQuestion(prev => {
        const newOptions = [...prev.options];
        newOptions[index] = value;
        return { ...prev, options: newOptions };
      });
    }
  };

  // Handle correct answer selection
  const handleCorrectAnswerChange = (index: number) => {
    setNewQuestion(prev => ({
      ...prev,
      correctAnswer: index
    }));
  };

  // Handle test submission
  const handleSubmitTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      if (isEditing && selectedTest) {
        await updateTest(selectedTest.id, testForm, user.$id);
      } else {
        await createTest(testForm, user.$id);
      }
      // Refresh tests
      const updatedTests = await getTestsByCourseId(courseId);
      setTests(updatedTests);
      resetForm();
    } catch (error) {
      console.error('Error saving test:', error);
    }
  };

  // Handle question submission
  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTest?.id) return;

    try {
      await addQuestionToTest(selectedTest.id, newQuestion);
      const updatedTests = await getTestsByCourseId(courseId);
      setTests(updatedTests);
      setNewQuestion({
        question: '',
        options: ['', '', '', ''],
        correctAnswer: 0,
        explanation: '',
        hindiQuestion: '',
        hindiOptions: ['', '', '', '']
      });
      setIsAddingQuestion(false);
    } catch (error) {
      console.error('Error adding question:', error);
    }
  };

  // Reset form
  const resetForm = () => {
    setTestForm({
      courseId,
      title: '',
      description: '',
      duration: 1800,
      passingScore: 70,
      instructions: [''],
      negativeMarking: 0
    });
    setSelectedTest(null);
    setIsEditing(false);
  };

  // Edit test
  const handleEditTest = (test: CourseTest) => {
    setSelectedTest(test);
    setTestForm({
      courseId: test.courseId,
      title: test.title,
      description: test.description,
      duration: test.duration,
      passingScore: test.passingScore,
      instructions: test.instructions,
      negativeMarking: test.negativeMarking
    });
    setIsEditing(true);
  };

  // Delete test
  const handleDeleteTest = async (testId: string) => {
    if (window.confirm('Are you sure you want to delete this test?')) {
      try {
        await deleteTest(testId);
        const updatedTests = await getTestsByCourseId(courseId);
        setTests(updatedTests);
      } catch (error) {
        console.error('Error deleting test:', error);
      }
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Manage Tests</h2>
      
      {/* Test List */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-2">Existing Tests</h3>
        {tests.length === 0 ? (
          <p>No tests found for this course.</p>
        ) : (
          <div className="space-y-4">
            {tests.map(test => (
              <div key={test.id} className="border p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-bold">{test.title}</h4>
                    <p className="text-sm text-gray-600">{test.description}</p>
                    <p className="text-sm">Duration: {Math.floor(test.duration / 60)} minutes</p>
                    <p className="text-sm">Passing Score: {test.passingScore}%</p>
                    <p className="text-sm">Questions: {test.questions?.length || 0}</p>
                  </div>
                  <div className="space-x-2">
                    <button
                      onClick={() => handleEditTest(test)}
                      className="px-3 py-1 bg-blue-500 text-white rounded"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteTest(test.id)}
                      className="px-3 py-1 bg-red-500 text-white rounded"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => {
                        setSelectedTest(test);
                        setIsAddingQuestion(true);
                      }}
                      className="px-3 py-1 bg-green-500 text-white rounded"
                    >
                      Add Question
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Test Form */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-2">
          {isEditing ? 'Edit Test' : 'Create New Test'}
        </h3>
        <form onSubmit={handleSubmitTest} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Title</label>
            <input
              type="text"
              name="title"
              value={testForm.title}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              name="description"
              value={testForm.description}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              rows={3}
              required
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Duration (seconds)</label>
              <input
                type="number"
                name="duration"
                value={testForm.duration}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Passing Score (%)</label>
              <input
                type="number"
                name="passingScore"
                min="0"
                max="100"
                value={testForm.passingScore}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Negative Marking (per question)</label>
              <input
                type="number"
                name="negativeMarking"
                min="0"
                step="0.5"
                value={testForm.negativeMarking || 0}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Instructions (one per line)</label>
            <textarea
              name="instructions"
              value={testForm.instructions.join('\n')}
              onChange={(e) => {
                setTestForm(prev => ({
                  ...prev,
                  instructions: e.target.value.split('\n').filter(Boolean)
                }));
              }}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              rows={4}
              required
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              {isEditing ? 'Update Test' : 'Create Test'}
            </button>
          </div>
        </form>
      </div>

      {/* Add Question Modal */}
      {isAddingQuestion && selectedTest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Add Question to {selectedTest.title}</h3>
              <button
                onClick={() => {
                  setIsAddingQuestion(false);
                  setNewQuestion({
                    question: '',
                    options: ['', '', '', ''],
                    correctAnswer: 0,
                    explanation: '',
                    hindiQuestion: '',
                    hindiOptions: ['', '', '', '']
                  });
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmitQuestion} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Question</label>
                <input
                  type="text"
                  name="question"
                  value={newQuestion.question}
                  onChange={handleQuestionChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Hindi Question (Optional)</label>
                <input
                  type="text"
                  name="hindiQuestion"
                  value={newQuestion.hindiQuestion}
                  onChange={handleQuestionChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Options</label>
                {newQuestion.options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="correctAnswer"
                      checked={newQuestion.correctAnswer === index}
                      onChange={() => handleCorrectAnswerChange(index)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value, false)}
                      className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Hindi option (optional)"
                      value={newQuestion.hindiOptions?.[index] || ''}
                      onChange={(e) => handleOptionChange(index, e.target.value, true)}
                      className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                ))}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Explanation (Optional)</label>
                <textarea
                  name="explanation"
                  value={newQuestion.explanation || ''}
                  onChange={handleQuestionChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  rows={2}
                />
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddingQuestion(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                >
                  Add Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestManagement;
