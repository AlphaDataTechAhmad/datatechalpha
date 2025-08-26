import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, AlertCircle, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { testData as scholarshipTestData } from '@/data/tests/internship-1';

const ScholarshipTestConductor = () => {
  const { testId } = useParams<{ testId: string }>();
  const { user, isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [testStarted, setTestStarted] = useState(false);
  const [testSubmitted, setTestSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<{[key: string]: string}>({});

  // Check authentication status
  useEffect(() => {
    if (!testId) {
      toast.error('Invalid test link');
      navigate('/scholarship');
      return;
    }
    
    setLoading(false);
  }, [testId, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    
    try {
      await login(email, password);
      setTestStarted(true);
      toast.success('Login successful! Starting your test...');
    } catch (error) {
      toast.error('Invalid email or password');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleAnswerSelect = (questionId: string, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleSubmit = () => {
    // Calculate score
    let correctAnswers = 0;
    scholarshipTestData.questions.forEach(question => {
      if (answers[question.id] === question.correctAnswer) {
        correctAnswers++;
      }
    });
    
    const finalScore = Math.round((correctAnswers / scholarshipTestData.questions.length) * 100);
    setScore(finalScore);
    setTestSubmitted(true);
    
    // Here you would typically submit the results to your backend
    console.log('Test submitted with score:', finalScore);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Scholarship Exam Login</CardTitle>
            <CardDescription>
              Please sign in to take your scholarship exam
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loginLoading}>
                {loginLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In & Start Test'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (testSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              {score >= 60 ? (
                <CheckCircle className="h-12 w-12 text-green-500" />
              ) : (
                <XCircle className="h-12 w-12 text-red-500" />
              )}
            </div>
            <CardTitle className="text-2xl font-bold text-center">
              {score >= 60 ? 'Congratulations!' : 'Test Completed'}
            </CardTitle>
            <CardDescription className="text-center">
              {score >= 60 
                ? 'You have successfully passed the scholarship exam!' 
                : 'Thank you for completing the test.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-4xl font-bold mb-4">{score}%</div>
            <p className="text-gray-600 mb-6">
              {score >= 60 
                ? 'You have qualified for the scholarship. We will contact you soon with further details.'
                : 'Unfortunately, you did not meet the passing score. Better luck next time!'}
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link to="/">Back to Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (testStarted) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Scholarship Exam</h1>
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={handleSubmit}>
              Submit Test
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {scholarshipTestData.questions.map((question, index) => (
            <Card key={question.id} className="p-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium mb-4">{question.question}</h3>
                  <div className="space-y-3">
                    {Object.entries(question.options).map(([key, value]) => (
                      <div key={key} className="flex items-center">
                        <input
                          type="radio"
                          id={`${question.id}-${key}`}
                          name={question.id}
                          checked={answers[question.id] === key}
                          onChange={() => handleAnswerSelect(question.id, key)}
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                        />
                        <label 
                          htmlFor={`${question.id}-${key}`}
                          className="ml-3 block text-sm font-medium text-gray-700 cursor-pointer"
                        >
                          {value}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-8 flex justify-end">
          <Button onClick={handleSubmit} size="lg">
            Submit Test
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Welcome to Your Scholarship Exam</CardTitle>
          <CardDescription>
            You are about to begin your scholarship examination. Please read the instructions carefully.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-medium">Instructions:</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
              <li>This test contains {scholarshipTestData.questions.length} questions</li>
              <li>You must answer all questions</li>
              <li>There is no negative marking</li>
              <li>You cannot go back once you submit the test</li>
            </ul>
          </div>
          <Button 
            className="w-full" 
            onClick={() => setTestStarted(true)}
          >
            Start Test
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ScholarshipTestConductor;
