import { TestData } from '@/types/test';

const generalKnowledgeTest: TestData = {
  testId: 'general-knowledge-test',
  title: 'General Knowledge Test',
  description: 'Test your general knowledge with these questions',
  duration: 30,
  category: 'SSC',
  thumbnail: 'https://via.placeholder.com/300x200?text=General+Knowledge',
  passingScore: 60,
  questions: [
    {
      id: 'q1',
      question: 'What is the capital of France?',
      options: ['London', 'Berlin', 'Paris', 'Madrid'],
      correctAnswer: 2,
      explanation: 'Paris is the capital of France.'
    },
    {
      id: 'q2',
      question: 'Which planet is known as the Red Planet?',
      options: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
      correctAnswer: 1,
      explanation: 'Mars is often called the Red Planet due to its reddish appearance.'
    },
    // Add more questions here
  ]
};

export default generalKnowledgeTest;
