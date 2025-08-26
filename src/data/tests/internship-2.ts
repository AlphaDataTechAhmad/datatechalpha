import { TestData } from '@/types/test';

const dsaTest: TestData = {
  internshipId: '6898b14f00083f004360',
  testId: 'full-stack-1',
  title: 'Full Stack Web Development Internship – Entrance Exam',
  description: 'Covers Quantitative Aptitude, Verbal Ability, Puzzles & Critical Thinking, and Full Stack Web Development.',
  duration: 60,
  category: 'Programming',
  thumbnail: 'https://via.placeholder.com/300x200?text=Full+Stack+Test',
  passingScore: 60,

  instructions: {
    generalInstructions: [
      'Total duration of the test is 60 minutes.',
      'The test contains 42 questions divided into 4 sections.',
      'Each question carries 1 mark.',
      'There is no negative marking for incorrect answers.',
      'You can navigate between questions using the question palette.',
      'You can mark questions for review and come back to them later.'
    ],
    markingScheme: {
      'Quantitative Aptitude': { correct: 1, incorrect: 0 },
      'Verbal Ability': { correct: 1, incorrect: 0 },
      'Puzzles & Critical Thinking': { correct: 1, incorrect: 0 },
      'Full Stack Web Development': { correct: 1, incorrect: 0 }
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
      title: 'Quantitative Aptitude',
      description: 'Basic maths and numerical ability questions',
      questionCount: 10,
      questions: [
        { id: 'q1', question: 'What is the value of (25% of 200) + (30% of 150)?', options: ['95', '105', '115', '125'], correctAnswer: 2 },
        { id: 'q2', question: 'If a train travels 60 km in 1.5 hours, what is its speed in km/hr?', options: ['30', '40', '45', '50'], correctAnswer: 2 },
        { id: 'q3', question: 'What is the square root of 2025?', options: ['45', '55', '65', '75'], correctAnswer: 0 },
        { id: 'q4', question: 'If x + 2 = 10, what is the value of x?', options: ['6', '7', '8', '9'], correctAnswer: 2 },
        { id: 'q5', question: 'Find the next number in the sequence: 2, 6, 12, 20, ...', options: ['30', '28', '26', '24'], correctAnswer: 1 },
        { id: 'q6', question: 'Simplify: 8 + 2 × (15 ÷ 3) - 5', options: ['13', '14', '15', '16'], correctAnswer: 2 },
        { id: 'q7', question: 'If a bag contains 5 red, 4 green and 3 blue balls, what is the probability of picking a red ball?', options: ['1/3', '5/12', '1/4', '3/4'], correctAnswer: 1 },
        { id: 'q8', question: 'A man earns ₹2400 per month. If he spends ₹1800, what percentage does he save?', options: ['25%', '30%', '35%', '40%'], correctAnswer: 0 },
        { id: 'q9', question: 'What is the HCF of 60 and 75?', options: ['15', '10', '20', '5'], correctAnswer: 0 },
        { id: 'q10', question: 'What is 1/3 of 3/4 of 120?', options: ['30', '40', '45', '50'], correctAnswer: 1 }
      ]
    },
    {
      id: 'section-2',
      title: 'Verbal Ability',
      description: 'English language and grammar questions',
      questionCount: 10,
      questions: [
        { id: 'q11', question: "Choose the correct synonym of 'Eloquent'.", options: ['Silent', 'Fluent', 'Confused', 'Weak'], correctAnswer: 1 },
        { id: 'q12', question: "Choose the correct antonym of 'Rigid'.", options: ['Stiff', 'Flexible', 'Hard', 'Rough'], correctAnswer: 1 },
        { id: 'q13', question: 'Select the correctly spelled word.', options: ['Enviroment', 'Enviroenment', 'Environment', 'Enviroenmentt'], correctAnswer: 2 },
        { id: 'q14', question: "Identify the error in the sentence: 'He don't like playing football.'", options: ['He', "don't", 'like', 'football'], correctAnswer: 1 },
        { id: 'q15', question: 'Choose the correct sentence.', options: ["She don't know the answer.", "She doesn't knows the answer.", "She doesn't know the answer.", "She doesn't knew the answer."], correctAnswer: 2 },
        { id: 'q16', question: 'Fill in the blank: I have been living here ____ 2010.', options: ['for', 'since', 'from', 'by'], correctAnswer: 1 },
        { id: 'q17', question: 'Select the word that fits both blanks: He ___ to school and ___ his bag.', options: ['goes, carry', 'gone, carried', 'goes, carries', 'going, carrying'], correctAnswer: 2 },
        { id: 'q18', question: "Choose the passive voice: 'The chef cooked the meal.'", options: ['The chef was cooked the meal.', 'The meal is cooked by the chef.', 'The meal was cooked by the chef.', 'The meal was being cooked the chef.'], correctAnswer: 2 },
        { id: 'q19', question: 'Find the odd one out.', options: ['Book', 'Pen', 'Paper', 'Eat'], correctAnswer: 3 },
        { id: 'q20', question: 'Choose the correct preposition: She is fond ___ music.', options: ['on', 'of', 'for', 'in'], correctAnswer: 1 }
      ]
    },
    {
      id: 'section-3',
      title: 'Puzzles & Critical Thinking',
      description: 'Logic-based and arrangement puzzles',
      questionCount: 2,
      questions: [
        { id: 'q21', question: 'Seven boxes – P, Q, R, S, T, U, and V – are kept one above another with different items. Given conditions: Only three boxes are between the box containing Shoes and R. The box containing Mobile is immediately above R. Only one box is between Mobile and Q. The box containing Laptop is kept immediately below T. T is kept at one of the top 3 positions. Box U is kept immediately above the box containing Chocolates. Box V contains Watch and is kept at the bottom. The box containing Books is kept at the top. Question: Which box contains Clothes?', options: ['P', 'Q', 'R', 'None of these'], correctAnswer: 0 },
        { id: 'q22', question: 'Eight people – M, N, O, P, Q, R, S, and T – have birthdays in different months: January, February, March, and April. Given: M’s birthday is in a month having 30 days. Only one person has a birthday between M and N. O was born on 22nd of April. Q was born on 13th of the same month as P. Only three people have birthdays between Q and S. T was born just before P. R’s birthday is not in March. Question: Who was born in February on 22nd?', options: ['T', 'S', 'M', 'None of these'], correctAnswer: 1 }
      ]
    },
    {
      id: 'section-4',
      title: 'Full Stack Web Development',
      description: 'Frontend, backend, databases, and programming concepts',
      questionCount: 20,
      questions: [
        { id: 'q23', question: 'Which language is used for styling web pages?', options: ['HTML', 'Jquery', 'CSS', 'XML'], correctAnswer: 2 },
        { id: 'q24', question: 'Which is not a JavaScript framework?', options: ['Python Script', 'JQuery', 'Django', 'NodeJS'], correctAnswer: 0 },
        { id: 'q25', question: 'What does HTML stand for?', options: ['Hyper Trainer Marking Language', 'Hyper Text Marketing Language', 'Hyper Text Markup Language', 'Hyper Text Markup Leveler'], correctAnswer: 2 },
        { id: 'q26', question: 'Which is used to connect the frontend and backend of a website?', options: ['API', 'SQL', 'FTP', 'HTML'], correctAnswer: 0 },
        { id: 'q27', question: 'Which of the following is a NoSQL database?', options: ['MySQL', 'PostgreSQL', 'MongoDB', 'Oracle'], correctAnswer: 2 },
        { id: 'q28', question: 'Which HTTP method is used to create a resource?', options: ['GET', 'POST', 'PUT', 'DELETE'], correctAnswer: 1 },
        { id: 'q29', question: 'Which React hook is used for side effects?', options: ['useEffect', 'useState', 'useCallback', 'useMemo'], correctAnswer: 0 },
        { id: 'q30', question: 'Which tag is used to insert an image in HTML?', options: ['<image>', '<img>', '<src>', '<pic>'], correctAnswer: 1 },
        { id: 'q31', question: 'Which command installs a package in Node.js?', options: ['node install', 'npm install', 'install node', 'node get'], correctAnswer: 1 },
        { id: 'q32', question: 'Which CSS property is used to make text bold?', options: ['font-weight', 'font-size', 'font-style', 'text-style'], correctAnswer: 0 },
        { id: 'q33', question: 'Which component is used in React to handle routing?', options: ['BrowserRouter', 'Switch', 'Route', 'All of the above'], correctAnswer: 3 },
        { id: 'q34', question: 'What is JSX in React?', options: ['Java XML', 'Java Syntax Extension', 'JavaScript XML', 'JavaScript Extension'], correctAnswer: 2 },
        { id: 'q35', question: 'Which tool is used to build and bundle React apps?', options: ['Node', 'Webpack', 'Gulp', 'Babel'], correctAnswer: 1 },
        { id: 'q36', question: 'What is the full form of API?', options: ['Application Programming Interface', 'Application Process Interface', 'Applied Protocol Interface', 'Array Protocol Interface'], correctAnswer: 0 },
        { id: 'q37', question: 'Which of these is not a frontend framework?', options: ['React', 'Angular', 'Vue', 'Django'], correctAnswer: 3 },
        { id: 'q38', question: 'Which protocol is used for secure communication over a network?', options: ['FTP', 'HTTP', 'HTTPS', 'SMTP'], correctAnswer: 2 },
        { id: 'q39', question: 'Which command starts a React app?', options: ['npm start', 'node run', 'react run', 'node start'], correctAnswer: 0 },
        { id: 'q40', question: 'Which keyword is used to define a variable in JavaScript?', options: ['var', 'let', 'const', 'All of the above'], correctAnswer: 3 },
        { id: 'q41', question: 'Which attribute specifies the destination of a link in HTML?', options: ['href', 'src', 'link', 'dest'], correctAnswer: 0 },
        { id: 'q42', question: 'Which of these is a backend language?', options: ['JavaScript', 'HTML', 'Python', 'CSS'], correctAnswer: 2 }
      ]
    }
  ]
};

export default dsaTest;
