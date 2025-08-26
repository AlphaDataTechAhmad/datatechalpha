export interface TestOption {
  id: string;
  text: string;
  isCorrect?: boolean;
}

export interface TestQuestion {
  id: string;
  text: string;
  options: TestOption[];
  correctAnswer: string;
  marks: number;
  explanation?: string;
  imageUrl?: string;
}

export interface Test {
  id: string;
  title: string;
  description: string;
  duration: number; // in minutes
  totalMarks: number;
  passingScore: number;
  negativeMarking: boolean;
  instructions: string[];
  questions: TestQuestion[];
}

export interface TestResult {
  score: number;
  correct: number;
  incorrect: number;
  unanswered: number;
  percentage: number;
  passed: boolean;
  timeSpent: number; // in seconds
  answers: Record<string, string>; // questionId -> answerId
  completedAt: Date;
}

export interface TestTakerOptions {
  autoStart?: boolean;
  showTimer?: boolean;
  allowNavigation?: boolean;
  allowReview?: boolean;
  allowBookmarking?: boolean;
  saveProgress?: boolean;
  onComplete?: (results: TestResult) => void;
}

// Type for question navigation
export interface QuestionNavigationProps {
  question: TestQuestion;
  isBookmarked: boolean;
  isMarkedForReview: boolean;
  isCurrent: boolean;
  hasAnswer: boolean;
  onNavigate: (questionId: string) => void;
  onToggleBookmark: (questionId: string) => void;
  onToggleMarkForReview: (questionId: string) => void;
}

// Type for accessibility settings
export interface AccessibilitySettings {
  fontSize: 'small' | 'medium' | 'large';
  colorBlindMode: boolean;
  highContrast: boolean;
}

export interface TestTakerState {
  // Test state
  test: Test | null;
  currentQuestion: TestQuestion | null;
  currentQuestionNumber: number;
  totalQuestions: number;
  isFirstQuestion: boolean;
  isLastQuestion: boolean;
  progress: number;
  isSubmitted: boolean;
  answers: Record<string, string>; // questionId -> answerId
  timeLeft: number; // in seconds
  formattedTimeLeft: string;
  isTimerRunning: boolean;
  isTimerPaused: boolean;
  bookmarks: Set<string>; // questionIds
  markedForReview: Set<string>; // questionIds
  results: TestResult | null;
  
  // Navigation
  goToNextQuestion: () => void;
  goToPreviousQuestion: () => void;
  goToQuestion: (questionId: string) => void;
  
  // Actions
  selectAnswer: (questionId: string, answerId: string) => void;
  toggleBookmark: (questionId: string) => void;
  toggleMarkForReview: (questionId: string) => void;
  submitTest: () => Promise<void>;
  exitTest: () => void;
  
  // Accessibility
  accessibility: {
    fontSize: 'small' | 'medium' | 'large';
    colorBlindMode: boolean;
    highContrast: boolean;
  };
}
