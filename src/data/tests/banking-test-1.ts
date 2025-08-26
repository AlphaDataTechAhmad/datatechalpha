import { TestData, TestSection } from '@/types/test';

const bankingTest: TestData = {
  testId: 'banking-test-1',
  title: 'Banking Exam',
  description: 'Practice key concepts for SBI PO and other banking exams',
  duration: 60, // Total duration in minutes
  category: 'Banking Test Series',
  thumbnail: 'https://via.placeholder.com/300x200?text=Banking+Test',
  passingScore: 60,

  instructions: {
    generalInstructions: [
      'Total duration of the test is 60 minutes.',
      'The test contains 30 questions divided into 1 section.',
      'Each question carries 1 mark.',
      'There is no negative marking for incorrect answers.',
      'You can navigate between questions using the question palette.',
      'You can mark questions for review and come back to them later.'
    ],
    markingScheme: {
      'Banking Awareness': { correct: 1, incorrect: 0 }
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
      title: 'Banking Awareness',
      description: 'Questions based on banking concepts, current affairs, and financial awareness.',
      questionCount: 30,
      questions: [
        {
          id: 'q1',
          question: 'What does CRR stand for in banking terms?',
          options: ['Cash Reserve Ratio', 'Credit Rating Ratio', 'Current Reserve Rate', 'Capital Risk Ratio'],
          correctAnswer: 0,
          explanation: 'CRR stands for Cash Reserve Ratio, the percentage of deposits banks must keep with the RBI.'
        },
        {
          id: 'q2',
          question: 'Which organization regulates the monetary policy in India?',
          options: ['SEBI', 'RBI', 'IRDAI', 'NABARD'],
          correctAnswer: 1,
          explanation: 'The Reserve Bank of India (RBI) regulates India’s monetary policy.'
        },
        {
          id: 'q3',
          question: 'In banking, what does the term "NPA" mean?',
          options: ['Non-Paying Account', 'Non-Performing Asset', 'New Public Account', 'Net Profit Asset'],
          correctAnswer: 1,
          explanation: 'NPA stands for Non-Performing Asset, a loan or advance on which interest or principal is overdue.'
        },
        {
          id: 'q4',
          question: 'Which is the largest public sector bank in India?',
          options: ['Punjab National Bank', 'Bank of Baroda', 'State Bank of India', 'Canara Bank'],
          correctAnswer: 2,
          explanation: 'State Bank of India (SBI) is the largest public sector bank in India.'
        },
        {
          id: 'q5',
          question: 'What does the term "Repo Rate" mean?',
          options: [
            'Rate at which RBI lends to commercial banks',
            'Rate at which banks lend to RBI',
            'Rate charged by banks to customers',
            'Rate of recurring deposits'
          ],
          correctAnswer: 0,
          explanation: 'Repo Rate is the rate at which the RBI lends short-term funds to commercial banks.'
        },
        {
          id: 'q6',
          question: 'Which of the following is a type of cheque that cannot be encashed over the counter?',
          options: ['Open Cheque', 'Bearer Cheque', 'Crossed Cheque', 'Self Cheque'],
          correctAnswer: 2,
          explanation: 'A crossed cheque can only be deposited into a bank account, not encashed directly.'
        },
        {
          id: 'q7',
          question: 'NEFT in banking stands for?',
          options: ['National Electronic Fund Transfer', 'National Easy Fund Transfer', 'Net Electronic Finance Transfer', 'None of the above'],
          correctAnswer: 0,
          explanation: 'NEFT stands for National Electronic Fund Transfer, used for one-to-one bank transfers.'
        },
        {
          id: 'q8',
          question: 'Who is known as the banker to the government in India?',
          options: ['SBI', 'Ministry of Finance', 'RBI', 'NABARD'],
          correctAnswer: 2,
          explanation: 'RBI acts as the banker to the Government of India.'
        },
        {
          id: 'q9',
          question: 'Which of these is not a function of the RBI?',
          options: ['Issuing currency', 'Controlling inflation', 'Regulating stock markets', 'Managing foreign exchange'],
          correctAnswer: 2,
          explanation: 'SEBI regulates stock markets, not the RBI.'
        },
        {
          id: 'q10',
          question: 'What is the full form of KYC in banking?',
          options: ['Know Your Credit', 'Know Your Customer', 'Keep Your Cash', 'Know Your Currency'],
          correctAnswer: 1,
          explanation: 'KYC stands for Know Your Customer, a process for verifying customer identity.'
        },
        {
          id: 'q11',
          question: 'Which bank introduced the first credit card in India?',
          options: ['SBI', 'ICICI Bank', 'Central Bank of India', 'HDFC Bank'],
          correctAnswer: 2,
          explanation: 'Central Bank of India introduced the first credit card in India in 1980.'
        },
        {
          id: 'q12',
          question: 'What does MICR stand for in banking?',
          options: ['Magnetic Ink Character Recognition', 'Micro Interest Credit Rate', 'Managed Interest Credit Record', 'Monthly Interest Calculation Rate'],
          correctAnswer: 0,
          explanation: 'MICR stands for Magnetic Ink Character Recognition, used in cheque processing.'
        },
        {
          id: 'q13',
          question: 'What is the purpose of the "bank rate"?',
          options: [
            'It is the rate charged by the RBI for long-term loans to commercial banks',
            'It is the interest rate for savings accounts',
            'It is the penalty for late loan payment',
            'It is the annual inflation rate'
          ],
          correctAnswer: 0,
          explanation: 'The bank rate is the rate at which the RBI lends to commercial banks without any collateral.'
        },
        {
          id: 'q14',
          question: 'Which is the parent organization of UPI?',
          options: ['RBI', 'NPCI', 'NABARD', 'IRDAI'],
          correctAnswer: 1,
          explanation: 'The National Payments Corporation of India (NPCI) developed the UPI system.'
        },
        {
          id: 'q15',
          question: 'Which of these is not a type of bank account?',
          options: ['Savings Account', 'Current Account', 'Fixed Deposit Account', 'Mutual Fund Account'],
          correctAnswer: 3,
          explanation: 'Mutual Fund Account is an investment account, not a bank account type.'
        }
      ]
    }
  ]
};

export default bankingTest;
