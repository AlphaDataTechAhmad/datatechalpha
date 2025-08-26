interface FormQuestionOption {
  id: number;
  text: string;
  hindiText: string;
}

export interface FormQuestion {
  id: number;
  text: string;
  options: FormQuestionOption[];
  correctAnswer: number;
  type: string;
  points: number;
  explanation?: string;
  marked?: boolean;
  hindiQuestion?: string;
  hindiOptions?: string[];
}

interface BackendQuestion {
  id?: number;
  question?: string;
  text?: string;
  options: string[];
  correctAnswer: number;
  type?: string;
  points?: number;
  explanation?: string;
  marked?: boolean;
  hindiQuestion?: string;
  hindiOptions?: string[];
}

/**
 * Convert form question to backend-compatible format
 */
export const convertToBackendQuestion = (q: FormQuestion): BackendQuestion => ({
  id: q.id || Date.now(),
  question: q.text || '',
  options: q.options.map((opt: FormQuestionOption) => opt.text || ''),
  correctAnswer: q.correctAnswer || 0,
  type: q.type || 'multiple_choice',
  points: q.points || 1,
  explanation: q.explanation || '',
  marked: q.marked || false,
  hindiQuestion: q.hindiQuestion || '',
  hindiOptions: q.options.map(opt => opt.hindiText || '')
});

/**
 * Convert backend question to form-compatible format
 */
export const convertToFormQuestion = (q: BackendQuestion): FormQuestion => {
  const options = Array.isArray(q.options) 
    ? q.options.map((opt: string | { text: string }, idx: number) => ({
        id: idx,
        text: typeof opt === 'string' ? opt : opt.text || '',
        hindiText: q.hindiOptions?.[idx] || ''
      }))
    : [];

  return {
    id: q.id || Date.now(),
    text: q.question || q.text || '',
    options,
    correctAnswer: q.correctAnswer || 0,
    type: q.type || 'multiple_choice',
    points: q.points || 1,
    explanation: q.explanation,
    marked: q.marked,
    hindiQuestion: q.hindiQuestion,
    hindiOptions: q.hindiOptions
  };
};
