import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Clock, CheckCircle, AlertCircle, Calendar as CalendarIcon, Search, Filter, Loader2 } from 'lucide-react';
import { intelliTestService } from '../../Services/intelliTestService';
import { account } from '../../Services/appwrite';

type Exam = {
  $id: string;
  title: string;
  duration: number;
  startTime: string;
  endTime: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'draft' | 'cancelled';
  totalMarks: number;
  totalQuestions?: number;
  feedback?: string;
  score?: number;
};

const StudentDashboard = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed'>('all');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchExams = async () => {
      try {
        setLoading(true);
        
        // Get the current user's session
        const session = await account.getSession('current');
        if (!session || !session.userId) {
          throw new Error('No active session found');
        }
        
        // Get the current user's ID from the session
        const currentUserId = session.userId;
        
        // Fetch only the exams assigned to this student
        const assignedExams = await intelliTestService.getAssignedExams(currentUserId);
        
        if (Array.isArray(assignedExams)) {
          const now = new Date();
          const processedExams = assignedExams.map((exam: any) => {
            if (!exam || !exam.$id) return null; // Skip if no exam or no ID
            
            const startDate = exam.startTime ? new Date(exam.startTime) : null;
            const endDate = exam.endTime ? new Date(exam.endTime) : null;
            
            let status: 'upcoming' | 'ongoing' | 'completed' | 'draft' | 'cancelled' = 'draft';
            
            if (startDate && endDate) {
              if (now < startDate) {
                status = 'upcoming';
              } else if (now >= startDate && now <= endDate) {
                status = 'ongoing';
              } else {
                status = 'completed';
              }
            }

            return {
              ...exam,
              $id: exam.$id, // Ensure $id is preserved
              status,
              duration: exam.duration || 0, // Default to 0 if duration is missing
              date: exam.startTime || new Date().toISOString(), // Default to now if no start time
              title: exam.title || 'Untitled Exam', // Default title if missing
              totalMarks: exam.totalMarks || 0, // Default to 0 if missing
              totalQuestions: exam.totalQuestions || 0 // Default to 0 if missing
            };
          }).filter(Boolean); // Remove any null values
          
          setExams(processedExams);
        } else {
          console.warn('No exams assigned to this student or error fetching assigned exams');
          setExams([]);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load exams';
        console.error('Error fetching exams:', err);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchExams();
  }, []);

  const filteredExams = exams.filter(exam => {
    if (!exam) return false; // Skip any null/undefined exams
    const matchesSearch = exam.title?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false;
    const matchesFilter = filter === 'all' || exam.status === filter;
    return matchesSearch && matchesFilter;
  });

  const startExam = async (examId: string) => {
    try {
      console.log('Attempting to start exam with ID:', examId);
      
      // Verify if the exam exists and is in a startable state
      const exam = exams.find(e => e.$id === examId);
      console.log('Found exam:', exam);
      
      if (!exam) {
        console.error('Exam not found with ID:', examId);
        return;
      }
      
      if (exam.status !== 'upcoming' && exam.status !== 'ongoing') {
        console.error('Exam is not in a startable state. Status:', exam.status);
        return;
      }
      
      // Get current user session
      console.log('Getting current user session...');
      const session = await account.getSession('current');
      if (!session || !session.userId) {
        console.error('No active user session found');
        return;
      }
      
      console.log('User authenticated. Starting exam...');
      
      // Navigate to the exam page
      navigate(`/intellitest/exam/${examId}`);
      
    } catch (error) {
      console.error('Error starting exam:', error);
      setError(`Failed to start exam: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const viewResults = (examId: string) => {
    navigate(`/intellitest/results/${examId}`);
  };
  
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Student Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500">Welcome back! Here are your upcoming and past exams.</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Search exams..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="relative">
              <select
                className="appearance-none bg-white border border-gray-300 rounded-md pl-3 pr-8 py-2 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">All Exams</option>
                <option value="upcoming">Upcoming</option>
                <option value="completed">Completed</option>
              </select>
              <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
                <Filter className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              <span className="ml-2">Loading exams...</span>
            </div>
          ) : error ? (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">
                    {error} <button onClick={() => window.location.reload()} className="font-medium text-red-700 underline hover:text-red-600">Try again</button>
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900">My Exams</h2>
                <span className="text-sm text-gray-500">
                  {filteredExams.length} {filteredExams.length === 1 ? 'exam' : 'exams'} found
                </span>
              </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {filteredExams.map((exam) => (
                  <li key={exam.$id}>
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            {exam.status === 'completed' ? (
                              <CheckCircle className="h-6 w-6 text-green-500" />
                            ) : (
                              <Clock className="h-6 w-6 text-blue-500" />
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-blue-600">{exam.title}</div>
                            <div className="text-sm text-gray-500">
                              <span className="mr-4">
                                <CalendarIcon className="inline h-4 w-4 mr-1" />
                                {new Date(exam.startTime).toLocaleDateString()}
                              </span>
                              <span>
                                <Clock className="inline h-4 w-4 mr-1" />
                                {formatDuration(exam.duration)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="ml-4 flex-shrink-0">
                          {exam.status === 'upcoming' || exam.status === 'ongoing' ? (
                            <button
                              onClick={() => {
                                console.log('Start exam clicked. Exam ID:', exam.$id);
                                startExam(exam.$id);
                              }}
                              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              Start Exam
                            </button>
                          ) : (
                            <button
                              onClick={() => viewResults(exam.$id)}
                              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            >
                              View Results
                            </button>
                          )}
                        </div>
                      </div>
                      {exam.status === 'completed' && (
                        <div className="mt-2 text-sm text-gray-500">
                          {exam.feedback && (
                            <><span className="font-medium">Feedback:</span> {exam.feedback}</>
                          )}
                          {exam.score !== undefined && (
                            <div className="mt-1">
                              <span className="font-medium">Score: </span>
                              <span className={`font-semibold ${exam.score >= (exam.totalMarks * 0.7) ? 'text-green-600' : 'text-yellow-600'}`}>
                                {exam.score}/{exam.totalMarks}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
                {filteredExams.length === 0 && (
                  <div className="text-center py-12">
                    <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No exams found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {searchTerm
                        ? 'Try adjusting your search or filter to find what you\'re looking for.'
                        : 'You don\'t have any exams matching the selected criteria.'}
                    </p>
                  </div>
                )}
              </ul>
            </div>
          </div>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                    <LayoutDashboard className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Upcoming Exams</dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">
                          {exams.filter((e) => e.status === 'upcoming' || e.status === 'ongoing').length}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Completed Exams</dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">
                          {exams.filter((e) => e.status === 'completed').length}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Average Score</dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">
                          {exams.length > 0
                            ? Math.round(
                                exams.reduce((sum, exam) => sum + (exam.score || 0), 0) /
                                  exams.length
                              )
                            : 0}
                          %
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;
