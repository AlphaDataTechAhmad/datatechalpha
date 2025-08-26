/**
 * Formats time in seconds to MM:SS format
 * @param seconds - Time in seconds
 * @returns Formatted time string (e.g., "05:30")
 */
export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Calculates the percentage of completed questions
 * @param current - Current question index (1-based)
 * @param total - Total number of questions
 * @returns Percentage of completion (0-100)
 */
export const calculateProgress = (current: number, total: number): number => {
  if (total === 0) return 0;
  return Math.min(Math.round((current / total) * 100), 100);
};

/**
 * Gets the current question number based on sections
 * @param sections - Array of sections
 * @param currentSectionIndex - Current section index
 * @param currentQuestionIndex - Current question index within the section
 * @returns The overall question number (1-based)
 */
export const getQuestionNumber = (
  sections: Array<{ questions: Array<unknown> }>,
  currentSectionIndex: number,
  currentQuestionIndex: number
): number => {
  if (!sections?.length) return currentQuestionIndex + 1;
  
  return (
    sections
      .slice(0, currentSectionIndex)
      .reduce((total, section) => total + section.questions.length, 0) +
    currentQuestionIndex +
    1
  );
};

/**
 * Checks if the current question is the last one
 * @param sections - Array of sections
 * @param currentSectionIndex - Current section index
 * @param currentQuestionIndex - Current question index within the section
 * @returns Boolean indicating if it's the last question
 */
export const isLastQuestion = (
  sections: Array<{ questions: Array<unknown> }>,
  currentSectionIndex: number,
  currentQuestionIndex: number
): boolean => {
  if (!sections?.length) return false;
  
  return (
    currentSectionIndex === sections.length - 1 &&
    currentQuestionIndex === sections[currentSectionIndex].questions.length - 1
  );
};

/**
 * Gets the total number of questions across all sections
 * @param sections - Array of sections
 * @returns Total number of questions
 */
export const getTotalQuestions = (sections: Array<{ questions: Array<unknown> }>): number => {
  if (!sections?.length) return 0;
  return sections.reduce((total, section) => total + section.questions.length, 0);
};

/**
 * Gets the current section based on the current section index
 * @param sections - Array of sections
 * @param currentSectionIndex - Current section index
 * @returns The current section or null if not found
 */
export const getCurrentSection = <T extends { id: string; name: string }>(
  sections: T[],
  currentSectionIndex: number
): T | null => {
  if (!sections?.length || currentSectionIndex < 0 || currentSectionIndex >= sections.length) {
    return null;
  }
  return sections[currentSectionIndex];
};

/**
 * Gets the current question based on the current section and question indices
 * @param sections - Array of sections with questions
 * @param currentSectionIndex - Current section index
 * @param currentQuestionIndex - Current question index within the section
 * @returns The current question or null if not found
 */
export const getCurrentQuestion = <T extends { questions: Array<unknown> }>(
  sections: T[],
  currentSectionIndex: number,
  currentQuestionIndex: number
): unknown | null => {
  const section = getCurrentSection(sections, currentSectionIndex);
  if (!section || !('questions' in section)) return null;
  
  const questions = section.questions as Array<unknown>;
  if (currentQuestionIndex < 0 || currentQuestionIndex >= questions.length) {
    return null;
  }
  
  return questions[currentQuestionIndex];
};

/**
 * Checks if an answer is correct
 * @param question - The question object
 * @param selectedOption - The selected option ID
 * @returns Boolean indicating if the answer is correct
 */
export const isAnswerCorrect = (
  question: { correctAnswer: string } | null,
  selectedOption: string | null
): boolean => {
  if (!question || selectedOption === null) return false;
  return question.correctAnswer === selectedOption;
};

/**
 * Calculates the score based on correct answers and total questions
 * @param correctAnswers - Number of correct answers
 * @param totalQuestions - Total number of questions
 * @returns Percentage score (0-100)
 */
export const calculateScore = (correctAnswers: number, totalQuestions: number): number => {
  if (totalQuestions === 0) return 0;
  return Math.round((correctAnswers / totalQuestions) * 100);
};

/**
 * Formats a number as a percentage
 * @param value - The value to format (0-1 or 0-100)
 * @param isDecimal - Whether the value is a decimal (0-1) or percentage (0-100)
 * @returns Formatted percentage string (e.g., "75%")
 */
export const formatPercentage = (value: number, isDecimal: boolean = false): string => {
  const percentage = isDecimal ? value * 100 : value;
  return `${Math.round(percentage)}%`;
};
