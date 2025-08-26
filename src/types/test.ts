export interface TestQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  imageUrl?: string;
  marks?: number;
  sectionId?: string;
}

export interface TestSection {
  id: string;
  title: string;
  description?: string;
  instructions?: string;
  questionCount: number;
  duration?: number; // in minutes, optional section-specific duration
  questions: TestQuestion[];
}

export interface TestInstructions {
  generalInstructions: string[];
  markingScheme?: {
    [key: string]: {
      correct: number;
      incorrect?: number;
      unanswered?: number;
    };
  };
  navigationInstructions?: string[];
  importantNotes?: string[];
}

export interface TestData {
  internshipId: string;
  testId: string;
  title: string;
  description: string;
  duration: number; // in minutes
  category: string;
  thumbnail?: string;
  passingScore: number;
  instructions: TestInstructions;
  sections: TestSection[];
  // For backward compatibility
  questions?: TestQuestion[];
}

export interface TestMetadata {
  testId: string;
  title: string;
  description: string;
  duration: number;
  category: string;
  thumbnail?: string;
  passingScore: number;
  questionCount: number;
  sectionCount: number;
}
