import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, AlertCircle, Flag, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { intelliTestService } from '../../Services/intelliTestService';
import { account } from '../../Services/appwrite';

type Question = {
  $id: string;
  examId: string;
  type: 'mcq' | 'true_false' | 'short_answer' | 'code';
  question: string;
  options?: string[];
  marks: number;
  difficulty?: string;
};

type Exam = {
  $id: string;
  title: string;
  description?: string;
  duration: number; // in minutes
  totalMarks: number;
  passingMarks: number;
  instructions?: string;
  status: string;
};

type UserAnswer = {
  questionId: string;
  answer: string | string[] | boolean;
  isFlagged: boolean;
  timeSpent: number; // in seconds
};

const ExamInterface: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, UserAnswer>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  // Load exam data and questions
  useEffect(() => {
    const loadExamData = async () => {
      if (!examId) {
        console.error('No exam ID provided in URL');
        setError('No exam ID provided');
        return;
      }
      
      console.log('=== Starting exam load process ===');
      console.log('Exam ID:', examId);
      
      try {
        setIsLoading(true);
        
        // Get current user
        console.log('Getting current user...');
        const currentUser = await account.get();
        console.log('Current user:', currentUser);
        
        if (!currentUser || !currentUser.$id) {
          const errorMsg = 'User not authenticated';
          console.error(errorMsg);
          throw new Error(errorMsg);
        }
        
        // Start exam attempt with actual user ID
        console.log('Starting exam attempt for user:', currentUser.$id);
        try {
          const attempt = await intelliTestService.startExam(examId, currentUser.$id);
          console.log('Exam attempt created:', attempt);
          setAttemptId(attempt.$id);
        } catch (attemptError) {
          console.error('Error starting exam attempt:', attemptError);
          throw new Error(`Failed to start exam attempt: ${attemptError instanceof Error ? attemptError.message : 'Unknown error'}`);
        }
        
        startTimeRef.current = Date.now();
        
        // Load exam details
        console.log('Loading exam details...');
        let examData;
        try {
          examData = await intelliTestService.getExamById(examId);
          console.log('Exam details:', examData);
        } catch (examError) {
          console.error('Error loading exam details:', examError);
          throw new Error(`Failed to load exam details: ${examError instanceof Error ? examError.message : 'Unknown error'}`);
        }
        
        // Check if exam is active
        if (examData.status !== 'active') {
          const errorMsg = `This exam is not currently active. Status: ${examData.status}`;
          console.error(errorMsg);
          throw new Error(errorMsg);
        }
        
        setExam(examData as unknown as Exam);
        
        // Load questions
        console.log('Loading questions...');
        let questionsData;
        try {
          questionsData = await intelliTestService.getQuestions(examId);
          console.log(`Loaded ${questionsData.documents?.length || 0} questions`);
        } catch (questionsError) {
          console.error('Error loading questions:', questionsError);
          throw new Error(`Failed to load questions: ${questionsError instanceof Error ? questionsError.message : 'Unknown error'}`);
        }
        
        if (!questionsData.documents || questionsData.documents.length === 0) {
          const errorMsg = 'No questions found for this exam';
          console.error(errorMsg);
          throw new Error(errorMsg);
        }
        
        setQuestions(questionsData.documents as unknown as Question[]);
        
        // Initialize timer
        const durationInSeconds = (examData.duration || 60) * 60; // Default to 60 minutes if duration is missing
        console.log(`Setting timer for ${examData.duration} minutes (${durationInSeconds} seconds)`);
        setTimeLeft(durationInSeconds);
        
        console.log('=== Exam loaded successfully ===');
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        console.error('Error in loadExamData:', err);
        setError(`Failed to load exam: ${errorMessage}`);
        
        // If there's an error, navigate back to the exam list after a delay
        setTimeout(() => {
          console.log('Navigating back to exam list due to error');
          navigate('/intellitest');
        }, 5000);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadExamData();
    
    return () => {
      console.log('Cleaning up exam interface...');
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [examId, navigate]);
  
  // Timer effect
  useEffect(() => {
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }
    
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current as NodeJS.Timeout);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timeLeft]);
  
  const handleAnswer = (answer: string | string[] | boolean) => {
    if (!questions[currentQuestionIndex]) return;
    
    const questionId = questions[currentQuestionIndex].$id;
    const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000);
    
    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        questionId,
        answer,
        isFlagged: prev[questionId]?.isFlagged || false,
        timeSpent: (prev[questionId]?.timeSpent || 0) + timeSpent
      }
    }));
    
    // Reset timer for next question
    startTimeRef.current = Date.now();
  };
  
  const toggleFlag = () => {
    if (!questions[currentQuestionIndex]) return;
    
    const questionId = questions[currentQuestionIndex].$id;
    
    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        isFlagged: !prev[questionId]?.isFlagged
      }
    }));
  };
  
  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };
  
  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };
  
  const handleSubmit = async () => {
    if (isSubmitting || !attemptId) return;
    
    try {
      setIsSubmitting(true);
      
      // Submit all answers
      const answerPromises = Object.values(answers).map(answer => 
        intelliTestService.submitAnswer(
          attemptId,
          answer.questionId,
          'current-user-id', // TODO: Replace with actual user ID
          JSON.stringify(answer.answer)
        )
      );
      
      await Promise.all(answerPromises);
      
      // Navigate to results page
      navigate(`/intellitest/results/${examId}`);
      
    } catch (err) {
      setError('Failed to submit exam. Please try again.');
      console.error('Error submitting exam:', err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin h-12 w-12 text-blue-500" />
        <span className="ml-2 text-lg">Loading exam...</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
          <div className="flex items-center">
            <AlertCircle className="h-6 w-6 mr-2" />
            <p>{error}</p>
          </div>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }
  
  if (!exam || questions.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4">
          <p>No exam data available.</p>
        </div>
      </div>
    );
  }
  
  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = currentQuestion ? answers[currentQuestion.$id] : null;
  
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 p-4 overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">Questions</h2>
        <div className="grid grid-cols-4 gap-2 mb-6">
          {questions.map((q, index) => {
            const answer = answers[q.$id];
            const isCurrent = index === currentQuestionIndex;
            const isAnswered = !!answer?.answer;
            const isFlagged = answer?.isFlagged;
            
            return (
              <button
                key={q.$id}
                onClick={() => setCurrentQuestionIndex(index)}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  isCurrent 
                    ? 'bg-blue-600 text-white' 
                    : isAnswered 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 hover:bg-gray-200'
                } ${isFlagged ? 'ring-2 ring-yellow-400' : ''}`}
              >
                {index + 1}
              </button>
            );
          })}
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-100 rounded-full mr-2"></div>
            <span className="text-sm">Answered</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-gray-100 rounded-full mr-2"></div>
            <span className="text-sm">Not Answered</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-yellow-100 rounded-full mr-2 ring-2 ring-yellow-400"></div>
            <span className="text-sm">Flagged</span>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Time Left:</span>
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1 text-blue-600" />
              <span className="font-semibold">{formatTime(timeLeft)}</span>
            </div>
          </div>
        </div>
        
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className={`mt-6 w-full py-2 px-4 rounded-md font-medium text-white ${
            isSubmitting ? 'bg-gray-400' : 'bg-red-600 hover:bg-red-700'
          } transition-colors`}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Exam'}
        </button>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-8">
        {currentQuestion && (
          <div className="max-w-3xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-800">{exam.title}</h1>
              <div className="flex items-center">
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                  {currentQuestion.marks} marks
                </span>
                <button
                  onClick={toggleFlag}
                  className={`ml-3 p-1.5 rounded-full ${currentAnswer?.isFlagged ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'}`}
                  title="Flag question"
                >
                  <Flag className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <p className="text-lg mb-6">{currentQuestion.question}</p>
              
              {currentQuestion.type === 'mcq' && currentQuestion.options && (
                <div className="space-y-3">
                  {currentQuestion.options.map((option, index) => (
                    <div 
                      key={index}
                      onClick={() => handleAnswer(option)}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        currentAnswer?.answer === option 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      {option}
                    </div>
                  ))}
                </div>
              )}
              
              {currentQuestion.type === 'true_false' && (
                <div className="space-y-3">
                  {[true, false].map((value) => (
                    <div
                      key={value.toString()}
                      onClick={() => handleAnswer(value)}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        currentAnswer?.answer === value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      {value ? 'True' : 'False'}
                    </div>
                  ))}
                </div>
              )}
              
              {(currentQuestion.type === 'short_answer' || currentQuestion.type === 'code') && (
                <textarea
                  value={typeof currentAnswer?.answer === 'string' ? currentAnswer.answer : ''}
                  onChange={(e) => handleAnswer(e.target.value)}
                  className="w-full h-48 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={`Type your ${currentQuestion.type === 'code' ? 'code' : 'answer'} here...`}
                />
              )}
            </div>
            
            <div className="flex justify-between items-center">
              <button
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
                className={`px-4 py-2 rounded-md ${
                  currentQuestionIndex === 0
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <ChevronLeft className="inline h-5 w-5" /> Previous
              </button>
              
              <div className="text-sm text-gray-500">
                Question {currentQuestionIndex + 1} of {questions.length}
              </div>
              
              <button
                onClick={currentQuestionIndex === questions.length - 1 ? handleSubmit : handleNext}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
              >
                {currentQuestionIndex === questions.length - 1 ? (
                  isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin h-4 w-4 mr-2" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Exam'
                  )
                ) : (
                  <>
                    Next <ChevronRight className="inline h-5 w-5 ml-1" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExamInterface;
