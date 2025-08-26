import { TestData, TestSection } from '@/types/test';

// Advanced SQL Test
const advancedSQLTest: TestData = {
  testId: 'ads-1',
  title: 'Advanced SQL Test',
  description: 'Assess your SQL skills with advanced queries, optimization, and database concepts.',
  duration: 60,
  category: 'Advanced SQL',
  thumbnail: 'https://via.placeholder.com/300x200?text=Advanced+SQL+Test',
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
      'Advanced SQL': { correct: 1, incorrect: 0 }
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
      title: 'Advanced SQL',
      description: 'Covers complex queries, indexing, transactions, and optimization techniques.',
      questionCount: 15,
      questions: [
        {
          id: 'q1',
          question: 'Which SQL clause is used to filter grouped data?',
          options: ['WHERE', 'HAVING', 'GROUP BY', 'ORDER BY'],
          correctAnswer: 1,
          explanation: 'HAVING filters grouped data after aggregation, unlike WHERE which filters rows before grouping.'
        },
        {
          id: 'q2',
          question: 'In SQL, what is the default transaction isolation level in MySQL?',
          options: ['READ UNCOMMITTED', 'READ COMMITTED', 'REPEATABLE READ', 'SERIALIZABLE'],
          correctAnswer: 2,
          explanation: 'MySQL uses REPEATABLE READ as the default transaction isolation level.'
        },
        {
          id: 'q3',
          question: 'Which of the following is used to improve the performance of queries?',
          options: ['Indexing', 'Triggers', 'Views', 'Constraints'],
          correctAnswer: 0,
          explanation: 'Indexes help in faster retrieval of data by reducing the number of disk reads.'
        },
        {
          id: 'q4',
          question: 'What does the EXPLAIN keyword in SQL do?',
          options: ['Shows query execution plan', 'Runs the query', 'Deletes indexes', 'Optimizes the database'],
          correctAnswer: 0,
          explanation: 'EXPLAIN displays the execution plan of a query, helping identify performance bottlenecks.'
        },
        {
          id: 'q5',
          question: 'Which SQL window function calculates a running total?',
          options: ['SUM() OVER()', 'RANK()', 'ROW_NUMBER()', 'NTILE()'],
          correctAnswer: 0,
          explanation: 'SUM() OVER() is used to calculate cumulative totals over a specified window.'
        },
        {
          id: 'q6',
          question: 'What is the main advantage of a clustered index?',
          options: ['Stores data in sorted order physically', 'Uses less memory', 'Supports only unique values', 'Works without a primary key'],
          correctAnswer: 0,
          explanation: 'A clustered index physically sorts and stores table rows according to the index key.'
        },
        {
          id: 'q7',
          question: 'Which keyword is used to remove duplicate rows in SQL results?',
          options: ['DISTINCT', 'UNIQUE', 'REMOVE DUPLICATES', 'NODUP'],
          correctAnswer: 0,
          explanation: 'DISTINCT eliminates duplicate rows from the query result.'
        },
        {
          id: 'q8',
          question: 'In SQL, the COALESCE() function returns:',
          options: ['The first non-NULL value', 'All NULL values', 'A boolean result', 'A random value'],
          correctAnswer: 0,
          explanation: 'COALESCE() returns the first non-NULL value in a list of expressions.'
        },
        {
          id: 'q9',
          question: 'What does ACID in database transactions stand for?',
          options: ['Atomicity, Consistency, Isolation, Durability', 'Accuracy, Consistency, Integrity, Data', 'Atomicity, Concurrency, Isolation, Data', 'All Conditions In Data'],
          correctAnswer: 0,
          explanation: 'ACID properties ensure reliable transaction processing in databases.'
        },
        {
          id: 'q10',
          question: 'Which join returns only matching rows from both tables?',
          options: ['INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL OUTER JOIN'],
          correctAnswer: 0,
          explanation: 'INNER JOIN returns only rows with matching values in both tables.'
        },
        {
          id: 'q11',
          question: 'What is the main purpose of a foreign key in SQL?',
          options: ['Enforces referential integrity', 'Speeds up queries', 'Stores encrypted values', 'Removes duplicates'],
          correctAnswer: 0,
          explanation: 'Foreign keys ensure referential integrity by linking data between tables.'
        },
        {
          id: 'q12',
          question: 'Which SQL command is used to create a new view?',
          options: ['MAKE VIEW', 'CREATE VIEW', 'NEW VIEW', 'ADD VIEW'],
          correctAnswer: 1,
          explanation: 'CREATE VIEW defines a new view in the database.'
        },
        {
          id: 'q13',
          question: 'In SQL, what is a CTE?',
          options: ['Common Table Expression', 'Central Table Execution', 'Conditional Table Entry', 'Computed Table Element'],
          correctAnswer: 0,
          explanation: 'A CTE (Common Table Expression) is a temporary result set used in complex queries.'
        },
        {
          id: 'q14',
          question: 'Which SQL command is used to revoke user privileges?',
          options: ['REMOVE PRIVILEGE', 'REVOKE', 'DROP ACCESS', 'DELETE PRIVILEGE'],
          correctAnswer: 1,
          explanation: 'REVOKE removes granted permissions from a user.'
        },
        {
          id: 'q15',
          question: 'In MySQL, which engine supports transactions?',
          options: ['MyISAM', 'InnoDB', 'Memory', 'CSV'],
          correctAnswer: 1,
          explanation: 'InnoDB supports transactions and ACID compliance.'
        }
      ]
    }
  ]
};

export default advancedSQLTest;