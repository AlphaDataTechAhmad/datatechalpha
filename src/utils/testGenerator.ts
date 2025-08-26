import { v4 as uuidv4 } from 'uuid';
import { createTest } from '@/Services/testService';

// Question type that matches the expected format for createTest
interface QuestionData {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

// Sample question bank with 10 diverse questions
const QUESTION_BANK: Omit<QuestionData, 'id'>[] = [
  {
    question: "What is the capital of France?",
    options: ["London", "Berlin", "Paris", "Madrid"],
    correctAnswer: 2,
    explanation: "Paris is the capital and most populous city of France."
  },
  {
    question: "Which planet is known as the Red Planet?",
    options: ["Venus", "Mars", "Jupiter", "Saturn"],
    correctAnswer: 1,
    explanation: "Mars appears reddish due to iron oxide on its surface."
  },
  {
    question: "What is the largest mammal in the world?",
    options: ["African Elephant", "Blue Whale", "Giraffe", "Polar Bear"],
    correctAnswer: 1,
    explanation: "The Blue Whale is the largest animal known to have ever existed."
  },
  {
    question: "Which element has the chemical symbol 'O'?",
    options: ["Gold", "Osmium", "Oxygen", "Oganesson"],
    correctAnswer: 2,
    explanation: "Oxygen is essential for human respiration and has the symbol 'O'."
  },
  {
    question: "Who painted the Mona Lisa?",
    options: ["Vincent van Gogh", "Pablo Picasso", "Leonardo da Vinci", "Michelangelo"],
    correctAnswer: 2,
    explanation: "The Mona Lisa was painted by Leonardo da Vinci in the 16th century."
  },
  {
    question: "What is the hardest natural substance on Earth?",
    options: ["Gold", "Iron", "Diamond", "Platinum"],
    correctAnswer: 2,
    explanation: "Diamond is the hardest known natural material on the Mohs scale."
  },
  {
    question: "Which country is home to the Great Barrier Reef?",
    options: ["Brazil", "Australia", "Thailand", "Mexico"],
    correctAnswer: 1,
    explanation: "The Great Barrier Reef is located off the coast of Queensland, Australia."
  },
  {
    question: "What is the largest organ in the human body?",
    options: ["Liver", "Brain", "Skin", "Lungs"],
    correctAnswer: 2,
    explanation: "The skin is the body's largest organ, with an average area of about 20 square feet."
  },
  {
    question: "Which planet is closest to the Sun?",
    options: ["Venus", "Mercury", "Earth", "Mars"],
    correctAnswer: 1,
    explanation: "Mercury is the smallest and innermost planet in the Solar System."
  },
  {
    question: "What is the chemical formula for water?",
    options: ["CO2", "H2O", "NaCl", "O2"],
    correctAnswer: 1,
    explanation: "Water is composed of two hydrogen atoms and one oxygen atom (H₂O)."
  }
];

export async function generateRandomTest(userId: string, count: number = 10) {
  // Get random questions and add unique IDs
  const questions: QuestionData[] = [...QUESTION_BANK]
    .sort(() => 0.5 - Math.random())
    .slice(0, count)
    .map(q => ({ ...q, id: uuidv4() }));

  // Prepare test data according to CreateTestData interface
  const testData = {
    title: 'Random Test',
    description: 'Test with random questions',
    duration: 1800, // 30 minutes
    passingScore: 60,
    category: 'random',
    courseId: 'random-quiz',
    instructions: [
      'Answer all questions',
      'Each question has one correct answer',
      'No negative marking',
      'The test will auto-submit when time expires'
    ],
    questions: questions.map(q => ({
      id: q.id,
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation || ''
    }))
  };

  return await createTest(testData, userId);
}
