import { TestData } from '@/types/test';

const internTest: TestData = {
  testId: 'intern-test',
  title: 'Web Development Test',
  description: 'Basic web development knowledge test',
  duration: 30,
  category: 'Web Development',
  passingScore: 60,
  instructions: {
    generalInstructions: [
      'Answer all questions',
      'Each question has one correct answer',
      'No negative marking'
    ],
    markingScheme: {
      default: { correct: 1, incorrect: 0, unanswered: 0 }
    }
  },
  sections: [{
    id: 'web-dev',
    title: 'Web Dev',
    description: 'Questions',
    questionCount: 2,
    questions: [
      {
        id: 'q1',
        question: 'What does HTML stand for?',
        options: [
          'Hyper Text Markup Language',
          'Home Tool Markup Language',
          'Hyperlinks and Text Markup Language'
        ],
        correctAnswer: 0,
        explanation: 'HTML stands for Hyper Text Markup Language',
        marks: 1,
        sectionId: 'web-dev'
      },
      {
        id: 'q2',
        question: 'Which tag is used for a line break?',
        options: ['<br>', '<lb>', '<break>'],
        correctAnswer: 0,
        explanation: '<br> tag is used for line breaks',
        marks: 1,
        sectionId: 'web-dev'
      }
    ]
  }]
};

export default internTest;