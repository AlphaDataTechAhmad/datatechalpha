import { useParams, useNavigate } from 'react-router-dom';
import { useTestContext } from './context/TestContext';
import { TestData } from '@/types/test';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Clock, CheckCircle2, XCircle, AlertCircle, ChevronLeft, ChevronRight, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/theme-provider';
import { Badge } from '@/components/ui/badge';

// Type for the dynamically imported test module
type TestModule = {
  default: TestData;
};

// Dynamically import all test files from the tests folder
const testModules = import.meta.glob<TestModule>('@/data/tests/*.ts', { eager: false });

const TEST_DURATION = 60 * 60; // 60 minutes

// Define test stages
type TestStage = 'instructions' | 'test' | 'review' | 'results';

const DynamicTestConductor: React.FC = () => {
  console.log('DynamicTestConductor: Rendering');
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const { theme } = useTheme();
  
  const {
    currentSectionIndex,
    currentQuestionIndex,
    moveToNextQuestion,
    moveToPreviousQuestion,
    moveToQuestion,
    getCurrentSection,
    getCurrentQuestion,
    getQuestionState,
    setUserAnswer,
    toggleMarkForReview,
    test,
    loading,
    error,
    userAnswers: contextUserAnswers,
  } = useTestContext();
  
  // Local state
  const [testStage, setTestStage] = useState<TestStage>('instructions');
  const [testSubmitted, setTestSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TEST_DURATION);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showQuestionPalette, setShowQuestionPalette] = useState(false);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showTabSwitchWarning, setShowTabSwitchWarning] = useState(false);
  const [unansweredQuestionIndex, setUnansweredQuestionIndex] = useState<number | null>(null);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Handle answer selection
  const handleAnswerSelect = useCallback((questionId: string, answer: number | null) => {
    const currentSection = getCurrentSection();
    if (!currentSection) return;
    
    setUserAnswer(currentSection.id, questionId, answer);
    
    // Auto-save the answer
    console.log(`Answer saved for question ${questionId}:`, answer);
  }, [getCurrentSection, setUserAnswer]);

  // Load test data when component mounts
  useEffect(() => {
    const loadTestData = async () => {
      if (!testId) return;
      
      try {
        // The actual test data loading is now handled by TestContext
        console.log('DynamicTestConductor: Loading test data for testId:', testId);
      } catch (err) {
        console.error('Error in test data loading:', err);
      }
    };
    
    loadTestData();
  }, [testId]);

  // Rest of the component code...
  // [Previous implementation continues...]

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Test header with timer and progress */}
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex flex-col gap-2 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">{test?.title || 'Loading Test...'}</h1>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <span className="font-mono text-lg font-medium">
                  {Math.floor(timeLeft / 60).toString().padStart(2, '0')}:
                  {(timeLeft % 60).toString().padStart(2, '0')}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowQuestionPalette(!showQuestionPalette)}
              >
                {showQuestionPalette ? 'Hide Questions' : 'Show Questions'}
              </Button>
            </div>
          </div>
          
          <div className="w-full">
            <Progress value={calculateProgress()} className="h-2" />
          </div>
        </div>
      </header>

      {/* Main test content */}
      <main className="flex-1 container py-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="rounded-lg border bg-destructive/10 p-6 text-destructive dark:border-destructive/30">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              <h2 className="text-lg font-semibold">Error loading test</h2>
            </div>
            <p className="mt-2 text-sm">{error.message || 'Failed to load test. Please try again.'}</p>
            <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        ) : test ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
            {/* Question navigation sidebar */}
            {showQuestionPalette && (
              <div className="lg:col-span-1">
                <QuestionPalette
                  sections={test.sections || []}
                  currentSectionIndex={currentSectionIndex}
                  currentQuestionIndex={currentQuestionIndex}
                  onQuestionSelect={handleQuestionSelect}
                  getQuestionState={getQuestionState}
                />
              </div>
            )}

            {/* Main question area */}
            <div className={cn('space-y-6', showQuestionPalette ? 'lg:col-span-3' : 'lg:col-span-4')}>
              <QuestionNavigation
                currentSectionIndex={currentSectionIndex}
                currentQuestionIndex={currentQuestionIndex}
                sections={test.sections || []}
                onPrevious={handlePreviousQuestion}
                onNext={handleNextQuestion}
                onSubmit={handleSubmitTest}
                isLastQuestion={isLastQuestion}
                testSubmitted={testSubmitted}
              />

              <QuestionDisplay
                question={currentQuestion}
                questionState={currentQuestionState}
                onAnswerSelect={handleAnswerSelect}
                onMarkForReview={handleMarkForReview}
                testSubmitted={testSubmitted}
              />

              <QuestionNavigation
                currentSectionIndex={currentSectionIndex}
                currentQuestionIndex={currentQuestionIndex}
                sections={test.sections || []}
                onPrevious={handlePreviousQuestion}
                onNext={handleNextQuestion}
                onSubmit={handleSubmitTest}
                isLastQuestion={isLastQuestion}
                testSubmitted={testSubmitted}
                className="lg:hidden"
              />
            </div>
          </div>
        ) : (
          <div className="text-center text-muted-foreground">No test data available</div>
        )}
      </main>

      {/* Confirmation dialog */}
      <ConfirmationDialog
        open={showConfirmation}
        onOpenChange={setShowConfirmation}
        onConfirm={handleSubmitTest}
        title="Submit Test"
        description="Are you sure you want to submit your test? You won't be able to make any changes after submission."
        confirmText="Submit Test"
      />
    </div>
  );
};

export default DynamicTestConductor;
