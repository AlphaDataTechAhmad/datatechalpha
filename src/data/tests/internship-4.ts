import { TestData } from '@/types/test';

const fullStackTest: TestData = {
  internshipId: '689b080e001f591184bd',
  testId: 'DSC-1',
  title: 'Data Science Internship – Question Paper',
  description: 'Covers Quantitative Aptitude, Verbal Ability, Puzzles & Critical Thinking, and Data Science.',
  duration: 60,
  category: 'Programming',
  thumbnail: 'https://via.placeholder.com/300x200?text=DSC+Test',
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
      'Data Science': { correct: 1, incorrect: 0 }
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
        { id: 'q1', question: 'What is the percentage increase from 120 to 150?', options: ['20%', '25%', '30%', '35%'], correctAnswer: 1 },
        { id: 'q2', question: 'A car travels 180 km in 3 hours. What is its average speed?', options: ['60 km/h', '50 km/h', '70 km/h', '90 km/h'], correctAnswer: 0 },
        { id: 'q3', question: 'What is the LCM of 15 and 20?', options: ['30', '60', '45', '75'], correctAnswer: 1 },
        { id: 'q4', question: 'If A can do a piece of work in 10 days and B in 15 days, how long will they take together?', options: ['6 days', '8 days', '9 days', '12 days'], correctAnswer: 0 },
        { id: 'q5', question: 'What is the simple interest on ₹5000 at 5% per annum for 2 years?', options: ['₹500', '₹550', '₹600', '₹520'], correctAnswer: 0 },
        { id: 'q6', question: 'Solve: 2x - 5 = 15', options: ['x = 5', 'x = 10', 'x = 15', 'x = 20'], correctAnswer: 0 },
        { id: 'q7', question: 'What is the square root of 1225?', options: ['35', '45', '55', '65'], correctAnswer: 0 },
        { id: 'q8', question: 'In a mixture of 60 liters, the ratio of milk to water is 2:1. How much water is there?', options: ['10 L', '15 L', '20 L', '25 L'], correctAnswer: 1 },
        { id: 'q9', question: 'Train A crosses a pole in 15 seconds at 60 km/h. What is its length?', options: ['150 m', '250 m', '300 m', '200 m'], correctAnswer: 0 },
        { id: 'q10', question: 'What is the compound interest on ₹4000 at 10% p.a. for 2 years?', options: ['₹800', '₹840', '₹880', '₹900'], correctAnswer: 1 }
      ]
    },
    {
      id: 'section-2',
      title: 'Verbal Ability',
      description: 'English language and grammar questions',
      questionCount: 10,
      questions: [
        { id: 'q11', question: "Choose the synonym for 'Rapid'.", options: ['Slow', 'Quick', 'Weak', 'Loud'], correctAnswer: 1 },
        { id: 'q12', question: "Choose the antonym for 'Generous'.", options: ['Kind', 'Cruel', 'Stingy', 'Smart'], correctAnswer: 2 },
        { id: 'q13', question: "Find the error: 'He don't like coffee.'", options: ['He', "don't", 'like', 'coffee'], correctAnswer: 1 },
        { id: 'q14', question: 'Choose the correct sentence.', options: ['She go to school.', 'She goes to school.', 'She going school.', 'She gone to school.'], correctAnswer: 1 },
        { id: 'q15', question: 'Fill in the blank: She _____ to the gym every day.', options: ['go', 'going', 'goes', 'gone'], correctAnswer: 2 },
        { id: 'q16', question: "What is the opposite of 'Optimistic'?", options: ['Negative', 'Realistic', 'Pessimistic', 'Hopeful'], correctAnswer: 2 },
        { id: 'q17', question: "Correct the sentence: 'He are a good boy.'", options: ['He is a good boy.', 'He be a good boy.', 'He has a good boy.', 'He have a good boy.'], correctAnswer: 0 },
        { id: 'q18', question: 'Choose the word that best completes the analogy: Dog : Bark :: Cat : ____', options: ['Meow', 'Roar', 'Howl', 'Chirp'], correctAnswer: 0 },
        { id: 'q19', question: 'Choose the grammatically correct option.', options: ['The book is on the table.', 'The book are on the table.', 'The book were on the table.', 'The book being on the table.'], correctAnswer: 0 },
        { id: 'q20', question: "Choose the correct passive voice: 'He writes a letter.'", options: ['A letter wrote by him.', 'A letter is written by him.', 'A letter was written by him.', 'A letter has been written.'], correctAnswer: 1 }
      ]
    },
    {
      id: 'section-3',
      title: 'Puzzles & Critical Thinking',
      description: 'Logic-based and arrangement puzzles',
      questionCount: 2,
      questions: [
        { id: 'q21', question: 'Yellow, White, Black, Orange, and Pink. K sits third to the right of the person who likes Green... Who likes Black?', options: ['K', 'R', 'O', 'None of these'], correctAnswer: 3 },
        { id: 'q22', question: 'Eight people – M, N, O, P, Q, R, S, and T – have birthdays in different months... Who was born in February on 22nd?', options: ['P', 'Q', 'R', 'None of these'], correctAnswer: 0 }
      ]
    },
    {
      id: 'section-4',
      title: 'Data Science',
      description: 'Fundamentals of data science and ML',
      questionCount: 20,
      questions: [
        { id: 'q23', question: 'What is the full form of CSV?', options: ['Comma Separated Version', 'Column Sorted Values', 'Comma Separated Values', 'Common Separated Variable'], correctAnswer: 2 },
        { id: 'q24', question: 'Which of the following is a supervised learning algorithm?', options: ['K-Means', 'PCA', 'Decision Tree', 'DBSCAN'], correctAnswer: 2 },
        { id: 'q25', question: 'Which library is used for data manipulation in Python?', options: ['NumPy', 'Pandas', 'Matplotlib', 'Seaborn'], correctAnswer: 1 },
        { id: 'q26', question: 'Which metric is best for imbalanced classification?', options: ['Accuracy', 'Precision', 'Recall', 'F1 Score'], correctAnswer: 3 },
        { id: 'q27', question: 'Which function loads a dataset in pandas?', options: ['pandas.read_file()', 'pandas.load()', 'pandas.read_csv()', 'pandas.load_data()'], correctAnswer: 2 },
        { id: 'q28', question: 'Which of the following is a dimensionality reduction technique?', options: ['SVM', 'Linear Regression', 'PCA', 'Naive Bayes'], correctAnswer: 2 },
        { id: 'q29', question: 'Which activation function is commonly used in neural networks?', options: ['ReLU', 'Sigmoid', 'Tanh', 'All of the above'], correctAnswer: 3 },
        { id: 'q30', question: 'Which library is used for visualization?', options: ['Pandas', 'NumPy', 'TensorFlow', 'Matplotlib'], correctAnswer: 3 },
        { id: 'q31', question: 'Which of the following is not a type of machine learning?', options: ['Reinforcement', 'Supervised', 'Unsupervised', 'Forecasted'], correctAnswer: 3 },
        { id: 'q32', question: 'Which language is commonly used in data science?', options: ['C', 'Java', 'Python', 'HTML'], correctAnswer: 2 },
        { id: 'q33', question: 'What is overfitting?', options: ['High training accuracy and high test accuracy', 'Low training accuracy', 'High training accuracy, low test accuracy', 'Model runs forever'], correctAnswer: 2 },
        { id: 'q34', question: 'What is the use of seaborn?', options: ['Web development', 'Data visualization', 'Audio processing', 'Hardware testing'], correctAnswer: 1 },
        { id: 'q35', question: 'Which algorithm is best for classification?', options: ['Linear Regression', 'KNN', 'DBSCAN', 'K-Means'], correctAnswer: 1 },
        { id: 'q36', question: 'Which plot is used for distribution?', options: ['Bar', 'Pie', 'Histogram', 'Line'], correctAnswer: 2 },
        { id: 'q37', question: 'Which command in pandas gives top rows?', options: ['df.tail()', 'df.top()', 'df.head()', 'df.start()'], correctAnswer: 2 },
        { id: 'q38', question: 'Which method removes null values?', options: ['drop()', 'delete()', 'dropna()', 'remove()'], correctAnswer: 2 },
        { id: 'q39', question: 'Which function shows correlation?', options: ['df.corr()', 'df.relate()', 'df.graph()', 'df.stats()'], correctAnswer: 0 },
        { id: 'q40', question: 'What is a dependent variable?', options: ['Output', 'Input', 'Parameter', 'Constant'], correctAnswer: 0 },
        { id: 'q41', question: 'Which function creates arrays?', options: ['np.data()', 'np.array()', 'np.create()', 'np.list()'], correctAnswer: 1 },
        { id: 'q42', question: 'Which ML library is made by Google?', options: ['Keras', 'PyTorch', 'TensorFlow', 'Scikit-learn'], correctAnswer: 2 }
      ]
    }
  ]
};

export default fullStackTest;
