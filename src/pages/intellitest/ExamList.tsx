import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { intelliTestService } from '../../Services/intelliTestService';
import { Clock, Award, BarChart2, Calendar, BookOpen, AlertCircle, Loader2, RefreshCw } from 'lucide-react';

// Add gradient text component
const GradientText = ({ children }: { children: React.ReactNode }) => (
  <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
    {children}
  </span>
);

type Exam = {
  $id: string;
  title: string;
  description?: string;
  duration: number;
  totalMarks: number;
  passingMarks?: number;
  status: 'active' | 'upcoming' | 'completed' | 'draft';
  endTime: string;
  totalQuestions?: number;
  category?: string;
};

export const ExamList: React.FC = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'upcoming' | 'completed'>('all');

  useEffect(() => {
    const fetchExams = async () => {
      try {
        setLoading(true);
        // Fetch exams from Appwrite
        const response = await intelliTestService.getExams();
        console.log('Fetched exams from Appwrite:', response);
        
        if (response && Array.isArray(response.documents)) {
          setExams(response.documents as unknown as Exam[]);
        } else {
          console.warn('Unexpected response format from getExams:', response);
          setExams([]);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        console.error('Error fetching exams:', err);
        setError(`Failed to load exams: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };

    fetchExams();
  }, []);

  const filteredExams = exams.filter(exam => {
    if (activeTab === 'all') return true;
    return exam.status === activeTab;
  });

  const getStatusBadge = (status: string) => {
    const baseClasses = 'px-3 py-1 text-xs font-medium rounded-full flex items-center';
    
    switch (status) {
      case 'active':
        return (
          <span className={`${baseClasses} bg-green-100 text-green-800`}>
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            Active
          </span>
        );
      case 'upcoming':
        return (
          <span className={`${baseClasses} bg-blue-100 text-blue-800`}>
            <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
            Upcoming
          </span>
        );
      case 'completed':
        return (
          <span className={`${baseClasses} bg-gray-100 text-gray-800`}>
            <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
            Completed
          </span>
        );
      default:
        return (
          <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>
            <span className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></span>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center h-96">
            <div className="flex flex-col items-center">
              <Loader2 className="h-12 w-12 text-blue-600 animate-spin mb-4" />
              <p className="text-gray-600">Loading exams...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-500" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  {error} <button onClick={() => window.location.reload()} className="font-medium text-red-700 underline hover:text-red-600">Try again</button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
            <GradientText>IntelliTest</GradientText> Platform
          </h1>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
            Test your skills and get certified with our comprehensive assessment platform
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-10">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Exams
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {exams.length}
                      </div>
                      <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                        +2 from last month
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
                  <Award className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Certifications
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">3+</div>
                      <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                        New: JavaScript Expert
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
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Avg. Duration
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {Math.round(exams.reduce((acc, exam) => acc + exam.duration, 0) / (exams.length || 1))} min
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
                <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
                  <BarChart2 className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Success Rate
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        87%
                      </div>
                      <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                        +5.45%
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { name: 'All Exams', value: 'all' },
              { name: 'Active', value: 'active' },
              { name: 'Upcoming', value: 'upcoming' },
              { name: 'Completed', value: 'completed' },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value as any)}
                className={`${
                  activeTab === tab.value
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                {tab.name}
                {tab.value !== 'all' && (
                  <span className="ml-2 bg-gray-100 text-gray-600 text-xs font-medium px-2 py-0.5 rounded-full">
                    {exams.filter(e => e.status === tab.value).length}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Search and Filter */}
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div className="relative w-full sm:max-w-xs">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Search exams..."
            />
          </div>
          <div className="flex space-x-3 w-full sm:w-auto">
            <select
              id="category"
              name="category"
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              defaultValue="all"
            >
              <option value="all">All Categories</option>
              <option value="programming">Programming</option>
              <option value="web">Web Development</option>
              <option value="data">Data Science</option>
              <option value="mobile">Mobile Development</option>
            </select>
            <select
              id="sort"
              name="sort"
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              defaultValue="newest"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="duration-asc">Duration (Shortest First)</option>
              <option value="duration-desc">Duration (Longest First)</option>
            </select>
          </div>
        </div>

        {/* Exams Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredExams.length > 0 ? (
            filteredExams.map((exam) => (
              <div 
                key={exam.$id} 
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-100 flex flex-col"
              >
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        {getStatusBadge(exam.status)}
                        {exam.category && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {exam.category}
                          </span>
                        )}
                      </div>
                      <h2 className="text-xl font-bold text-gray-900 mb-2">{exam.title}</h2>
                    </div>
                  </div>
                  
                  {exam.description && (
                    <p className="text-gray-600 mb-6 flex-grow">
                      {exam.description.length > 120 
                        ? `${exam.description.substring(0, 120)}...` 
                        : exam.description}
                    </p>
                  )}
                  
                  <div className="space-y-3 mt-auto">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center text-gray-500">
                        <Clock className="h-4 w-4 mr-2 text-blue-500" />
                        <span>{exam.duration} min</span>
                      </div>
                      <div className="flex items-center text-gray-500">
                        <Award className="h-4 w-4 mr-2 text-green-500" />
                        <span>{exam.totalMarks} points</span>
                      </div>
                      {exam.totalQuestions && (
                        <div className="flex items-center text-gray-500">
                          <svg className="h-4 w-4 mr-2 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          <span>{exam.totalQuestions} questions</span>
                        </div>
                      )}
                      <div className="flex items-center text-gray-500">
                        <Calendar className="h-4 w-4 mr-2 text-yellow-500" />
                        <span>{new Date(exam.startTime).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    {exam.passingMarks && (
                      <div className="mt-2">
                        <div className="flex justify-between text-sm text-gray-500 mb-1">
                          <span>Passing: {exam.passingMarks} points</span>
                          <span>{Math.round((exam.passingMarks / exam.totalMarks) * 100)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${(exam.passingMarks / exam.totalMarks) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                    
                    <div className="pt-4 mt-4 border-t border-gray-100">
                      <Link
                        to={`/intellitest/exam/${exam.$id}`}
                        className={`w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                          exam.status === 'active' 
                            ? 'bg-blue-600 hover:bg-blue-700' 
                            : exam.status === 'upcoming'
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-gray-400 cursor-not-allowed'
                        } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                        onClick={(e) => {
                          if (exam.status !== 'active') {
                            e.preventDefault();
                          }
                        }}
                      >
                        {exam.status === 'active' 
                          ? 'Start Exam' 
                          : exam.status === 'upcoming'
                          ? 'Coming Soon'
                          : 'Exam Ended'}
                        {exam.status === 'active' && (
                          <svg className="ml-2 -mr-1 w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        )}
                      </Link>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 px-6 py-3 text-sm text-gray-500 border-t border-gray-100">
                  <div className="flex items-center">
                    <span className="text-xs">
                      {exam.status === 'active' 
                        ? `Ends ${new Date(exam.endTime).toLocaleDateString()}` 
                        : exam.status === 'upcoming'
                        ? `Starts ${new Date(exam.startTime).toLocaleDateString()}`
                        : `Ended ${new Date(exam.endTime).toLocaleDateString()}`}
                    </span>
                    <div className="ml-auto flex space-x-2">
                      <button 
                        type="button" 
                        className="text-gray-400 hover:text-gray-500"
                        title="Add to favorites"
                      >
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </button>
                      <button 
                        type="button" 
                        className="text-gray-400 hover:text-gray-500"
                        title="Share"
                      >
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-16 text-center bg-white rounded-xl shadow-sm p-8 border border-gray-100">
              <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-blue-50">
                <BookOpen className="h-12 w-12 text-blue-600" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">No exams found</h3>
              <p className="mt-2 text-base text-gray-600 max-w-md mx-auto">
                {activeTab === 'all' 
                  ? "There are currently no exams available. Check back later or contact your instructor."
                  : `There are no ${activeTab} exams at the moment.`}
              </p>
              <div className="mt-6 flex justify-center space-x-4">
                <button
                  type="button"
                  className="inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={() => window.location.reload()}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </button>
                <button
                  type="button"
                  className="inline-flex items-center px-5 py-2.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={() => setActiveTab('all')}
                >
                  View all exams
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExamList;
