import { TestData, TestSection } from '@/types/test';

const pythonTest: TestData = {
  testId: 'python-test-1',
  title: 'Python Programming Test',
  description: '100 easy multiple-choice questions to test your Python basics, syntax, and concepts.',
  duration: 60, // minutes
  category: 'Python Test Series',
  thumbnail: 'https://via.placeholder.com/300x200?text=Python+Test',
  passingScore: 60,

  instructions: {
    generalInstructions: [
      'Total duration: 60 minutes.',
      'The test contains 4 sections with a total of 100 questions.',
      'Each question has exactly one correct answer.',
      'No negative marking for incorrect answers.',
      'Mark questions for review if needed.'
    ],
    markingScheme: {
      'Python Basics': { correct: 1, incorrect: 0 },
      'Data Types & Operators': { correct: 1, incorrect: 0 },
      'Control Flow & Functions': { correct: 1, incorrect: 0 },
      'OOP, Modules & Advanced': { correct: 1, incorrect: 0 }
    },
    navigationInstructions: [
      'Click on a section name to open it.',
      'Use "Next" and "Previous" to move between questions.',
      'Click on a number in the question palette to jump directly to it.'
    ],
    importantNotes: [
      'The test will auto-submit when time expires.',
      'Submit all answers before the timer runs out.',
      'You can change your answers any number of times before submitting.'
    ]
  },

  sections: [
    {
      id: 'section-1',
      title: 'Python Basics',
      description: 'Basic Python syntax, keywords, and environment setup.',
      questionCount: 25,
      questions: [
        { id: 'q1', question: 'Which keyword is used to define a function in Python?', options: ['function', 'def', 'fun', 'define'], correctAnswer: 1, explanation: 'Functions are defined using the def keyword.' },
        { id: 'q2', question: 'What will print(type("Hello")) output?', options: ['str', "<class \'str\'>", 'string', "<type \'str\'>"], correctAnswer: 1, explanation: 'It returns the type object representation <class \'str\'>.' },
        { id: 'q3', question: 'Which symbol is used to start a comment in Python?', options: ['//', '#', '--', '/*'], correctAnswer: 1, explanation: 'The # symbol starts a comment in Python.' },
        { id: 'q4', question: 'What is the correct file extension for Python files?', options: ['.pyth', '.pt', '.py', '.p'], correctAnswer: 2, explanation: 'Python files have the .py extension.' },
        { id: 'q5', question: 'Which function is used to get user input in Python 3?', options: ['input()', 'get()', 'scan()', 'read()'], correctAnswer: 0, explanation: 'The input() function reads user input.' },
        { id: 'q6', question: 'Which of the following is NOT a Python keyword?', options: ['elif', 'lambda', 'var', 'yield'], correctAnswer: 2, explanation: 'Python does not have a var keyword.' },
        { id: 'q7', question: 'What does print(2 ** 3) output?', options: ['5', '6', '8', '9'], correctAnswer: 2, explanation: '** is the exponent operator; 2 ** 3 = 8.' },
        { id: 'q8', question: 'Which statement is used to terminate a loop?', options: ['stop', 'exit', 'break', 'terminate'], correctAnswer: 2, explanation: 'The break statement exits a loop early.' },
        { id: 'q9', question: 'What is the correct way to display “Hello World” in Python?', options: ['echo("Hello World")', 'print("Hello World")', 'printf("Hello World")', 'display("Hello World")'], correctAnswer: 1, explanation: 'print() is used for output in Python.' },
        { id: 'q10', question: 'What will print(10 // 3) output?', options: ['3', '3.33', '4', '3.0'], correctAnswer: 0, explanation: '// is floor division; 10 // 3 = 3.' },
        { id: 'q11', question: 'Python is a ___ typed language.', options: ['statically', 'strongly', 'dynamically', 'weakly'], correctAnswer: 2, explanation: 'Python is dynamically typed; variable types are decided at runtime.' },
        { id: 'q12', question: 'Which keyword is used to skip the rest of the code inside a loop for the current iteration?', options: ['pass', 'skip', 'continue', 'break'], correctAnswer: 2, explanation: 'continue skips to the next iteration.' },
        { id: 'q13', question: 'Which function shows all Python keywords?', options: ['help()', 'dir()', 'keyword.kwlist', 'list_keywords()'], correctAnswer: 2, explanation: 'The keyword module’s kwlist contains all Python keywords.' },
        { id: 'q14', question: 'Which operator is used for string concatenation?', options: ['&', '+', '*', '%'], correctAnswer: 1, explanation: 'The + operator concatenates strings.' },
        { id: 'q15', question: 'What will print(type(5)) output?', options: ['<class \'float\'>', '<class \'int\'>', '<class \'number\'>', '<class \'integer\'>'], correctAnswer: 1, explanation: '5 is an integer, so <class \'int\'>.' },
        { id: 'q16', question: 'Which keyword is used to define a block with proper indentation?', options: ['block', 'begin', 'indent', 'None of these'], correctAnswer: 3, explanation: 'Indentation is defined by spaces, not a keyword.' },
        { id: 'q17', question: 'What will print(4 % 2) output?', options: ['2', '0', '1', 'None'], correctAnswer: 1, explanation: '% is modulus operator; 4 % 2 = 0.' },
        { id: 'q18', question: 'What is the correct way to assign multiple variables at once?', options: ['a = 1, b = 2', 'a = 1; b = 2', 'a, b = 1, 2', 'assign(a=1, b=2)'], correctAnswer: 2, explanation: 'Tuple unpacking: a, b = 1, 2.' },
        { id: 'q19', question: 'Which of these is used to get Python version?', options: ['sys.version', 'python.version()', 'ver()', 'getversion()'], correctAnswer: 0, explanation: 'sys.version shows the Python version.' },
        { id: 'q20', question: 'What will print(3 * "ab") output?', options: ['abab', 'ababab', 'ab3', 'error'], correctAnswer: 1, explanation: 'String repetition: "ab" * 3 = ababab.' },
        { id: 'q21', question: 'What will print(bool("")) output?', options: ['True', 'False', 'None', 'Error'], correctAnswer: 1, explanation: 'Empty strings are False in boolean context.' },
        { id: 'q22', question: 'Which of these is NOT a valid variable name?', options: ['_var', 'var_1', '1var', 'varName'], correctAnswer: 2, explanation: 'Variable names cannot start with a number.' },
        { id: 'q23', question: 'Which keyword is used to create an empty code block?', options: ['skip', 'pass', 'continue', 'empty'], correctAnswer: 1, explanation: 'pass does nothing and is used for empty code blocks.' },
        { id: 'q24', question: 'What will print(len("Python")) output?', options: ['5', '6', '7', 'Error'], correctAnswer: 1, explanation: '"Python" has 6 characters.' },
        { id: 'q25', question: 'What is the output of print("Hello"[1])?', options: ['H', 'e', 'l', 'o'], correctAnswer: 1, explanation: 'Indexing starts from 0; "Hello"[1] = e.' }
      ]
    },
    {
      id: 'section-2',
      title: 'Data Types & Operators',
      description: 'Python variables, data types, and operators.',
      questionCount: 25,
      questions: [
        { id: 'q26', question: 'Which of these is a mutable data type in Python?', options: ['tuple', 'list', 'str', 'int'], correctAnswer: 1, explanation: 'Lists are mutable; tuples and strings are immutable.' },
        { id: 'q27', question: 'What is the type of print(type(3.5))?', options: ['int', 'float', 'double', 'number'], correctAnswer: 1, explanation: '3.5 is a floating-point number.' },
        { id: 'q28', question: 'Which operator is used for floor division?', options: ['/', '//', '%', '**'], correctAnswer: 1, explanation: '// gives floor division result.' },
        { id: 'q29', question: 'Which function converts a string to an integer?', options: ['str()', 'float()', 'int()', 'bool()'], correctAnswer: 2, explanation: 'int() converts strings to integers if valid.' },
        { id: 'q30', question: 'What will print(type([1,2,3])) output?', options: ['<class \'tuple\'>', '<class \'list\'>', '<class \'array\'>', '<class \'set\'>'], correctAnswer: 1, explanation: 'Square brackets define a list.' },
        { id: 'q31', question: 'Which data type is created by {} without any values?', options: ['list', 'set', 'dict', 'tuple'], correctAnswer: 2, explanation: '{} creates an empty dictionary, not a set.' },
        { id: 'q32', question: 'Which of these is an immutable data type?', options: ['list', 'set', 'dict', 'tuple'], correctAnswer: 3, explanation: 'Tuples are immutable.' },
        { id: 'q33', question: 'What will len({"a":1, "b":2}) return?', options: ['1', '2', '3', 'Error'], correctAnswer: 1, explanation: 'len() on a dict returns number of keys.' },
        { id: 'q34', question: 'What is the output of print(2 ** 4)?', options: ['6', '8', '16', '4'], correctAnswer: 2, explanation: '** is exponentiation; 2 ** 4 = 16.' },
        { id: 'q35', question: 'Which operator is used to check equality?', options: ['=', '==', '===', 'eq'], correctAnswer: 1, explanation: '== checks value equality in Python.' },
        { id: 'q36', question: 'Which operator is used for logical AND?', options: ['&', 'and', '&&', 'AND'], correctAnswer: 1, explanation: 'Python uses and for logical AND.' },
        { id: 'q37', question: 'What will print(5 % 2) output?', options: ['2', '1', '0', 'Error'], correctAnswer: 1, explanation: '% is modulus; 5 % 2 = 1.' },
        { id: 'q38', question: 'Which of these is a set literal?', options: ['[]', '{}', '()', '{1, 2, 3}'], correctAnswer: 3, explanation: '{1, 2, 3} is a set literal.' },
        { id: 'q39', question: 'Which function returns the absolute value?', options: ['abs()', 'fabs()', 'absolute()', 'val()'], correctAnswer: 0, explanation: 'abs() returns absolute value.' },
        { id: 'q40', question: 'What will print("5" + "2") output?', options: ['7', '52', 'Error', 'None'], correctAnswer: 1, explanation: 'String concatenation gives 52.' },
        { id: 'q41', question: 'What will print(5 + 2 * 3) output?', options: ['21', '11', '17', 'Error'], correctAnswer: 1, explanation: 'Operator precedence: 2*3=6, 5+6=11.' },
        { id: 'q42', question: 'Which function gives the largest number in a list?', options: ['max()', 'largest()', 'big()', 'top()'], correctAnswer: 0, explanation: 'max() returns the largest item.' },
        { id: 'q43', question: 'What will print(type(True)) output?', options: ['<class \'bool\'>', '<class \'int\'>', '<class \'boolean\'>', 'bool'], correctAnswer: 0, explanation: 'True is of type bool.' },
        { id: 'q44', question: 'Which keyword is used for defining constants in Python?', options: ['const', 'final', 'None', 'No keyword'], correctAnswer: 3, explanation: 'Python has no constant keyword; use naming convention.' },
        { id: 'q45', question: 'What will print(3 != 4) return?', options: ['True', 'False', 'Error', 'None'], correctAnswer: 0, explanation: '!= checks inequality; 3 != 4 is True.' },
        { id: 'q46', question: 'Which operator is used for string repetition?', options: ['+', '-', '*', '/'], correctAnswer: 2, explanation: '"abc" * 3 = abcabcabc.' },
        { id: 'q47', question: 'What is the type of range(5)?', options: ['list', 'tuple', 'range', 'generator'], correctAnswer: 2, explanation: 'range(5) returns a range object.' },
        { id: 'q48', question: 'Which operator is used for membership test?', options: ['in', 'is', '==', 'has'], correctAnswer: 0, explanation: 'in checks membership in a sequence.' },
        { id: 'q49', question: 'What is the result of bool(0)?', options: ['True', 'False', '0', 'Error'], correctAnswer: 1, explanation: '0 is considered False in Python.' },
        { id: 'q50', question: 'Which operator is used for identity test?', options: ['in', 'is', '==', '!='], correctAnswer: 1, explanation: 'is checks if two objects are the same.' }
      ]
    }
    
  ]
};

export default pythonTest;
