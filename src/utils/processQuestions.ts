interface Question {
  id: number;
  text: string;
  type: string;
  points: number;
  correctAnswer: number;
}

interface Option {
  id: number;
  text: string;
}

interface ProcessedQuestion extends Omit<Question, 'correctAnswer'> {
  options: Option[];
  correctAnswer: number;
}

export function processQuestions(
  questions: Question[],
  optionsMap: Record<string, { choices: Option[]; correctAnswer: number }>
): ProcessedQuestion[] {
  return questions.map(question => {
    const questionId = question.id.toString();
    const questionOptions = optionsMap[questionId];
    
    if (!questionOptions) {
      console.warn(`No options found for question ${questionId}`);
      return {
        ...question,
        options: [],
        correctAnswer: 0
      };
    }

    return {
      id: question.id,
      text: question.text,
      type: question.type,
      points: question.points,
      options: questionOptions.choices,
      correctAnswer: questionOptions.correctAnswer
    };
  });
}

// Example usage:
/*
const questions = [
  { id: 1, text: "Question 1", type: "multiple_choice", points: 1, correctAnswer: 3 },
  // ... more questions
];

const options = {
  "1": {
    choices: [
      { id: 1, text: "Option 1" },
      { id: 2, text: "Option 2" },
      { id: 3, text: "Option 3" },
      { id: 4, text: "Option 4" }
    ],
    correctAnswer: 3
  },
  // ... more options
};

const processed = processQuestions(questions, options);
console.log(processed);
*/
