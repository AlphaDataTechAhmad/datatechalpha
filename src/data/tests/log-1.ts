import { TestData } from '@/types/test';

const logicalReasoningTest: TestData = {
    testId: 'log-1',
    title: 'Logical Reasoning',
    description: 'Evaluate your logical reasoning and problem-solving skills.',
    duration: 60,
    category: 'Logical Reasoning',
    thumbnail: 'https://via.placeholder.com/300x200?text=Logical+Reasoning+Test',
    passingScore: 60,
  
    instructions: {
      generalInstructions: [
        'Total duration of the test is 60 minutes.',
        'The test contains 15 questions divided into 1 section.',
        'Each question carries 1 mark.',
        'There is no negative marking for incorrect answers.',
        'You can navigate between questions using the question palette.',
        'You can mark questions for review and come back to them later.'
      ],
      markingScheme: {
        'Logical Reasoning': { correct: 1, incorrect: 0 }
      },
      navigationInstructions: [
        'Click on the section name to navigate to that section.',
        'Use the "Next" and "Previous" buttons to move between questions.',
        'Click on a question number in the question palette to go to that question.'
      ],
      importantNotes: [
        'The test will be auto-submitted when the time expires.',
        'Make sure to submit all your answers before the time runs out.',
        'You can change your answers any number of times before submitting.'
      ]
    },
  
    sections: [
      {
        id: 'section-1',
        title: 'Logical Reasoning',
        description: 'Includes analytical reasoning, patterns, and problem-solving.',
        questionCount: 15,
        questions: [
          {
            id: 'q1',
            question: 'Find the next number in the series: 2, 6, 12, 20, 30, ?',
            options: ['36', '40', '42', '44'],
            correctAnswer: 2,
            explanation: 'The difference increases by 2 each time: +4, +6, +8, +10, +12 → 30 + 12 = 42.'
          },
          {
            id: 'q2',
            question: 'If in a certain code, CAT = DBU, what does DOG equal?',
            options: ['EPH', 'EPI', 'DPH', 'EQI'],
            correctAnswer: 0,
            explanation: 'Each letter is shifted by +1 in ASCII: C→D, A→B, T→U; so D→E, O→P, G→H.'
          },
          {
            id: 'q3',
            question: 'Statements: All apples are fruits. Some fruits are bananas. Conclusion: Some apples are bananas. Is the conclusion correct?',
            options: ['Yes', 'No', 'Cannot be determined', 'Only if all bananas are apples'],
            correctAnswer: 2,
            explanation: 'The given statements do not establish a link between apples and bananas.'
          },
          {
            id: 'q4',
            question: 'Which of the following is the odd one out: 36, 49, 64, 81, 121?',
            options: ['36', '49', '64', '81', '121'],
            correctAnswer: 0,
            explanation: 'All are perfect squares, but 36 is the only square of an even number less than 10.'
          },
          {
            id: 'q5',
            question: 'If A is the mother of B and B is the father of C, how is A related to C?',
            options: ['Mother', 'Grandmother', 'Sister', 'Aunt'],
            correctAnswer: 1,
            explanation: 'A is the grandmother of C.'
          },
          {
            id: 'q6',
            question: 'Arrange the words in logical order: 1. Seed 2. Tree 3. Flower 4. Fruit 5. Plant',
            options: ['1,5,2,3,4', '1,2,5,3,4', '1,5,3,2,4', '1,5,2,4,3'],
            correctAnswer: 0,
            explanation: 'Seed → Plant → Tree → Flower → Fruit.'
          },
          {
            id: 'q7',
            question: 'Which of the following is a prime number?',
            options: ['27', '31', '33', '35'],
            correctAnswer: 1,
            explanation: '31 is a prime number; others are composite.'
          },
          {
            id: 'q8',
            question: 'In a certain code, if 2 is coded as 6, 3 as 12, 4 as 20, then 5 is coded as?',
            options: ['25', '30', '35', '40'],
            correctAnswer: 1,
            explanation: 'Pattern: n² + n → 2²+2=6, 3²+3=12, 4²+4=20 → 5²+5=30.'
          },
          {
            id: 'q9',
            question: 'Pointing to a man, a woman says, “He is my mother’s only son.” How is the man related to the woman?',
            options: ['Father', 'Brother', 'Uncle', 'Son'],
            correctAnswer: 1,
            explanation: 'Her mother’s only son is her brother.'
          },
          {
            id: 'q10',
            question: 'Which comes next in the sequence: A, C, F, J, O, ?',
            options: ['T', 'U', 'V', 'W'],
            correctAnswer: 0,
            explanation: 'The positions increase by +2, +3, +4, +5... → Next is +6 from O → T.'
          },
          {
            id: 'q11',
            question: 'If all BLOOD is coded as CMPPE, what will WATER be coded as?',
            options: ['XBUFS', 'XBSFS', 'XCUFS', 'XATFS'],
            correctAnswer: 0,
            explanation: 'Each letter is shifted by +1: W→X, A→B, T→U, E→F, R→S.'
          },
          {
            id: 'q12',
            question: 'A clock shows 3:15. What is the angle between the hour and minute hands?',
            options: ['0°', '7.5°', '15°', '30°'],
            correctAnswer: 1,
            explanation: 'Hour hand at 3 moves 0.5° per minute → 7.5° shift from exact 3.'
          },
          {
            id: 'q13',
            question: 'Which diagram correctly represents the relationship: Doctors, Engineers, Males?',
            options: ['Three separate circles', 'Two overlapping and one separate', 'All overlapping', 'Doctors and Engineers as subsets of Males'],
            correctAnswer: 2,
            explanation: 'Some doctors are engineers and some are males; they overlap in all three.'
          },
          {
            id: 'q14',
            question: 'If it takes 3 people 6 hours to paint a wall, how long will it take 6 people (same speed) to paint the same wall?',
            options: ['2 hours', '3 hours', '4 hours', '6 hours'],
            correctAnswer: 1,
            explanation: 'Work is inversely proportional to people → double people = half the time → 3 hours.'
          },
          {
            id: 'q15',
            question: 'Which of the following numbers is divisible by 3?',
            options: ['124', '237', '590', '701'],
            correctAnswer: 1,
            explanation: 'Sum of digits of 237 is 12, divisible by 3.'
          }
        ]
      }
    ]
  };

  export default logicalReasoningTest;