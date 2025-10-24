import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { databases, DATABASE_ID, EXAMS_COLLECTION, QUESTIONS_COLLECTION, EXAM_ATTEMPTS_COLLECTION, RESULTS_COLLECTION } from '@/appwriteConfig';
import { Button } from '@/components/ui/button';
import { Loader2, Clock, AlertCircle, CheckCircle, Users, BarChart2, Settings, Plus, List, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';

interface Exam {
  $id: string;
  title: string;
  description?: string;
  duration: number;
  startDate?: string;
  endDate?: string;
  status: 'draft' | 'published' | 'completed' | 'archived';
  totalQuestions: number;
  passingScore: number;
  created: string;
  updated: string;
}

interface ExamAttempt {
  $id: string;
  examId: string;
  userId: string;
  status: 'not_started' | 'in_progress' | 'completed';
  score?: number;
  startedAt?: string;
  submittedAt?: string;
}

const TestConductorDashboard = () => {
  const { testId } = useParams<{ testId?: string }>();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [examAttempts, setExamAttempts] = useState<ExamAttempt[]>([]);
  const [activeTab, setActiveTab] = useState(testId ? 'overview' : 'exams');
  const [stats, setStats] = useState({
    totalParticipants: 0,
    completed: 0,
    inProgress: 0,
    notStarted: 0,
    averageScore: 0,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const loadExams = async () => {
      try {
        // Fetch all exams
        const response = await databases.listDocuments(
          DATABASE_ID,
          EXAMS_COLLECTION,
          [
            Query.orderDesc('$createdAt'),
            Query.limit(100)
          ]
        );
        
        setExams(response.documents as unknown as Exam[]);
        
        if (testId) {
          // If a specific test ID is provided, load its details
          const selected = response.documents.find(doc => doc.$id === testId);
          if (selected) {
            setSelectedExam(selected as unknown as Exam);
            await loadExamDetails(selected.$id);
          }
        }
        
      } catch (error) {
        console.error('Error loading exams:', error);
      } finally {
        setLoading(false);
      }
    };

    const loadExamDetails = async (examId: string) => {
      try {
        // Fetch exam attempts
        const attemptsResponse = await databases.listDocuments(
          DATABASE_ID,
          EXAM_ATTEMPTS_COLLECTION,
          [
            Query.equal('examId', examId),
            Query.limit(1000)
          ]
        );
        
        setExamAttempts(attemptsResponse.documents as unknown as ExamAttempt[]);
        
        // Calculate stats
        const completed = attemptsResponse.documents.filter((a: any) => a.status === 'completed');
        const inProgress = attemptsResponse.documents.filter((a: any) => a.status === 'in_progress');
        const notStarted = attemptsResponse.documents.filter((a: any) => a.status === 'not_started');
        
        const totalScore = completed.reduce((sum: number, a: any) => sum + (a.score || 0), 0);
        const averageScore = completed.length > 0 ? Math.round(totalScore / completed.length) : 0;
        
        setStats({
          totalParticipants: attemptsResponse.documents.length,
          completed: completed.length,
          inProgress: inProgress.length,
          notStarted: notStarted.length,
          averageScore,
        });
        
      } catch (error) {
        console.error('Error loading exam details:', error);
      }
    };

    loadExams();
  }, [testId, isAuthenticated, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading {testId ? 'exam details' : 'exams'}...</span>
      </div>
    );
  }

  // If no testId is provided, show the exam list
  if (!testId) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Exam Management</h1>
          <Button asChild>
            <Link to="/exams/new">
              <Plus className="h-4 w-4 mr-2" />
              Create New Exam
            </Link>
          </Button>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {exams.map((exam) => (
            <Card key={exam.$id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{exam.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {exam.totalQuestions} questions • {exam.duration} minutes
                    </CardDescription>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    exam.status === 'published' ? 'bg-green-100 text-green-800' :
                    exam.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                    exam.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {exam.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 line-clamp-2">
                  {exam.description || 'No description provided'}
                </p>
                <div className="mt-4 text-sm text-gray-500">
                  <p>Created: {format(new Date(exam.created), 'MMM d, yyyy')}</p>
                  {exam.startDate && (
                    <p>Starts: {format(new Date(exam.startDate), 'MMM d, yyyy')}</p>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/test-dashboard/${exam.$id}`}>
                    <BarChart2 className="h-4 w-4 mr-2" />
                    View Dashboard
                  </Link>
                </Button>
                <Button size="sm" asChild>
                  <Link to={`/exams/${exam.$id}/edit`}>
                    <Settings className="h-4 w-4 mr-2" />
                    Manage
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
          
          {exams.length === 0 && (
            <div className="col-span-full text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-gray-400" />
              <h3 className="mt-2 text-lg font-medium">No exams found</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating a new exam.</p>
              <Button className="mt-4" asChild>
                <Link to="/exams/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Exam
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }
  
  // If testId is provided but no exam is selected
  if (!selectedExam) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 mt-0.5" />
          <div>
            <h3 className="font-medium">Exam Not Found</h3>
            <p className="text-sm">The requested exam could not be found or you don't have permission to view it.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col space-y-2 mb-6">
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Link to="/test-dashboard" className="hover:underline">Exams</Link>
          <span>/</span>
          <span>{selectedExam.title}</span>
        </div>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">{selectedExam.title}</h1>
            <p className="text-gray-600">{selectedExam.description || 'No description provided'}</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" asChild>
              <Link to={`/exams/${testId}/edit`}>
                <Settings className="h-4 w-4 mr-2" />
                Exam Settings
              </Link>
            </Button>
            <Button asChild>
              <Link to={`/exams/${testId}/results`}>
                <BarChart2 className="h-4 w-4 mr-2" />
                View Results
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="participants">Participants ({stats.totalParticipants})</TabsTrigger>
          <TabsTrigger value="questions">Questions</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Participants</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalParticipants}</div>
                <p className="text-xs text-muted-foreground">Registered for this test</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">{stats.completed}</div>
                <p className="text-xs text-muted-foreground">Have completed the test</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                <Clock className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-500">{stats.inProgress}</div>
                <p className="text-xs text-muted-foreground">Currently taking the test</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Not Started</CardTitle>
                <Clock className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.notStarted}</div>
                <p className="text-xs text-muted-foreground">Haven't started yet</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Test Information</CardTitle>
              <CardDescription>Details about this test</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p>{selectedExam.duration} minutes</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <div className="flex items-center">
                    <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                      selectedExam.status === 'published' ? 'bg-green-500' :
                      selectedExam.status === 'draft' ? 'bg-gray-400' :
                      'bg-yellow-500'
                    }`}></span>
                    <span className="capitalize">{selectedExam.status}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Passing Score</p>
                  <p>{selectedExam.passingScore}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Average Score</p>
                  <p>{stats.averageScore}%</p>
                </div>
                {selectedExam.startDate && (
                  <div>
                    <p className="text-sm text-muted-foreground">Start Date</p>
                    <p>{format(new Date(selectedExam.startDate), 'MMM d, yyyy h:mm a')}</p>
                  </div>
                )}
                {selectedExam.endDate && (
                  <div>
                    <p className="text-sm text-muted-foreground">End Date</p>
                    <p>{format(new Date(selectedExam.endDate), 'MMM d, yyyy h:mm a')}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="participants">
          <Card>
            <CardHeader>
              <CardTitle>Participants</CardTitle>
              <CardDescription>View and manage test participants</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <div className="grid grid-cols-4 bg-gray-50 p-4 font-medium">
                  <div>Name</div>
                  <div>Status</div>
                  <div>Score</div>
                  <div>Actions</div>
                </div>
                {participants.map((participant) => (
                  <div key={participant.id} className="grid grid-cols-4 p-4 border-t items-center">
                    <div>{participant.name}</div>
                    <div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        participant.status === 'completed' 
                          ? 'bg-green-100 text-green-800' 
                          : participant.status === 'in-progress'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {participant.status.replace('-', ' ')}
                      </span>
                    </div>
                    <div>{participant.score || '-'}</div>
                    <div>
                      <Button variant="ghost" size="sm">View Details</Button>
                    </div>
                  </div>
                ))}
                {participants.length === 0 && (
                  <div className="p-8 text-center text-gray-500">
                    No participants found for this test.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="questions">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Test Questions</CardTitle>
                  <CardDescription>Manage questions for this test</CardDescription>
                </div>
                <Button size="sm" onClick={() => navigate(`/test/${testId}/questions/add`)}>
                  Add Question
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                <p>No questions added yet.</p>
                <Button variant="link" onClick={() => navigate(`/test/${testId}/questions/add`)}>
                  Add your first question
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Exam Reports</CardTitle>
              <CardDescription>View and analyze exam performance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Performance Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Average Score</p>
                        <p className="text-2xl font-bold">{stats.averageScore}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Pass Rate</p>
                        <p className="text-2xl font-bold">
                          {stats.totalParticipants > 0 
                            ? Math.round((stats.completed / stats.totalParticipants) * 100) 
                            : 0}%
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Completion Rate</p>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                          <div 
                            className="bg-blue-600 h-2.5 rounded-full" 
                            style={{ width: `${(stats.completed / stats.totalParticipants) * 100}%` }}
                          ></div>
                        </div>
                        <p className="text-sm text-right mt-1">
                          {stats.completed} of {stats.totalParticipants} completed
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Status Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Completed</span>
                          <span>{stats.completed} ({Math.round((stats.completed / stats.totalParticipants) * 100)}%)</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-green-600 h-2.5 rounded-full" 
                            style={{ width: `${(stats.completed / stats.totalParticipants) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>In Progress</span>
                          <span>{stats.inProgress} ({Math.round((stats.inProgress / stats.totalParticipants) * 100)}%)</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-blue-600 h-2.5 rounded-full" 
                            style={{ width: `${(stats.inProgress / stats.totalParticipants) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Not Started</span>
                          <span>{stats.notStarted} ({Math.round((stats.notStarted / stats.totalParticipants) * 100)}%)</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-gray-400 h-2.5 rounded-full" 
                            style={{ width: `${(stats.notStarted / stats.totalParticipants) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="pt-4">
                <Button variant="outline" className="mr-2">
                  <FileText className="h-4 w-4 mr-2" />
                  Export Results (CSV)
                </Button>
                <Button variant="outline">
                  <BarChart2 className="h-4 w-4 mr-2" />
                  Generate Detailed Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TestConductorDashboard;
