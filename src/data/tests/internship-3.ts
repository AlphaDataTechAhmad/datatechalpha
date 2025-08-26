import { TestData } from '@/types/test';

const dsaTest: TestData = {
  internshipId: '6899578b00398ade2cad',
  testId: 'CN-1',
  title: 'Computer Networks Full Test',
  description: 'Covers Quantitative Aptitude, Verbal Ability, Puzzles, Computer Networking, and Data Structures & Algorithms.',
  duration: 60,
  category: 'Programming',
  thumbnail: 'https://via.placeholder.com/300x200?text=DSA+Test',
  passingScore: 60,

  instructions: {
    generalInstructions: [
      'Total duration of the test is 60 minutes.',
      'The test contains 62 questions divided into 5 sections.',
      'Each question carries 1 mark.',
      'There is no negative marking for incorrect answers.',
      'You can navigate between questions using the question palette.',
      'You can mark questions for review and come back to them later.'
    ],
    markingScheme: {
      'Quantitative Aptitude': { correct: 1, incorrect: 0 },
      'Verbal Ability': { correct: 1, incorrect: 0 },
      'Puzzles & Critical Thinking': { correct: 1, incorrect: 0 },
      'Computer Networking': { correct: 1, incorrect: 0 },
      'Data Structures & Algorithms': { correct: 1, incorrect: 0 }
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
        { id: 'q1', question: 'A train 240 m long passes a pole in 24 seconds. What is the speed of the train?', options: ['10 km/h', '24 km/h', '36 km/h', '40 km/h'], correctAnswer: 2 },
        { id: 'q2', question: 'If the cost price of 15 articles is equal to the selling price of 12 articles, what is the gain percentage?', options: ['20%', '25%', '30%', '35%'], correctAnswer: 2 },
        { id: 'q3', question: 'A can complete a task in 20 days and B in 30 days. In how many days can they complete it together?', options: ['12', '15', '18', '25'], correctAnswer: 0 },
        { id: 'q4', question: 'If 5x + 3 = 18, what is the value of x?', options: ['2', '3', '4', '5'], correctAnswer: 2 },
        { id: 'q5', question: 'What is the compound interest on ₹5000 for 2 years at 10% per annum?', options: ['₹1000', '₹1050', '₹1100', '₹1155'], correctAnswer: 3 },
        { id: 'q6', question: 'A shopkeeper sells an item at a 10% loss. If the cost price is ₹200, what is the selling price?', options: ['₹180', '₹190', '₹195', '₹210'], correctAnswer: 0 },
        { id: 'q7', question: 'The average of five numbers is 42. What is their total sum?', options: ['200', '210', '220', '230'], correctAnswer: 1 },
        { id: 'q8', question: 'Find the next number in the series: 2, 6, 12, 20, ?', options: ['30', '32', '36', '40'], correctAnswer: 0 },
        { id: 'q9', question: 'What is the simple interest on ₹1000 at 5% per annum for 4 years?', options: ['₹100', '₹200', '₹150', '₹250'], correctAnswer: 1 },
        { id: 'q10', question: 'A man spends 80% of his income. If his income is ₹5000, what is his savings?', options: ['₹800', '₹900', '₹1000', '₹1200'], correctAnswer: 2 }
      ]
    },
    {
      id: 'section-2',
      title: 'Verbal Ability',
      description: 'English language and grammar questions',
      questionCount: 10,
      questions: [
        { id: 'q11', question: "Choose the correct synonym of 'Rapid':", options: ['Slow', 'Fast', 'Rough', 'Steady'], correctAnswer: 1 },
        { id: 'q12', question: 'Identify the correct spelling:', options: ['Recieve', 'Receive', 'Receeve', 'Receve'], correctAnswer: 1 },
        { id: 'q13', question: 'Choose the correctly punctuated sentence:', options: ['He said, he will come today.', 'He said he will, come today.', "He said, 'He will come today.'", 'He said he will come, today.'], correctAnswer: 2 },
        { id: 'q14', question: 'Fill in the blank: The sun ____ in the east.', options: ['rise', 'rises', 'rose', 'rising'], correctAnswer: 1 },
        { id: 'q15', question: "Choose the antonym of 'Generous':", options: ['Kind', 'Selfish', 'Polite', 'Wise'], correctAnswer: 1 },
        { id: 'q16', question: 'Which of these is a noun?', options: ['Run', 'Happy', 'Joy', 'Quickly'], correctAnswer: 2 },
        { id: 'q17', question: 'Identify the passive voice:', options: ['She was writing a letter.', 'A letter was written by her.', 'She writes a letter.', 'She wrote a letter.'], correctAnswer: 1 },
        { id: 'q18', question: 'Choose the correct article: He bought ____ umbrella.', options: ['a', 'an', 'the', 'no article'], correctAnswer: 1 },
        { id: 'q19', question: 'Choose the word with a prefix:', options: ['Undo', 'Do', 'Did', 'Done'], correctAnswer: 0 },
        { id: 'q20', question: 'Select the correct conjunction: I was tired ____ I went to bed.', options: ['but', 'and', 'so', 'because'], correctAnswer: 2 }
      ]
    },
    {
      id: 'section-3',
      title: 'Puzzles & Critical Thinking',
      description: 'Logic-based and arrangement puzzles',
      questionCount: 2,
      questions: [
        { id: 'q21', question: 'Eight persons – A, B, C, D, E, F, G, and H – are sitting in a straight line... What is the position of H with respect to A?', options: ['H sits second to the right of A', 'H sits immediately to the left of A', 'H sits third to the right of A', 'None of these'], correctAnswer: 2 },
        { id: 'q22', question: 'Eight people – A, B, C, D, E, F, G, and H – live on an 8-floor building... Who lives on floor 3?', options: ['A', 'G', 'H', 'None of these'], correctAnswer: 1 }
      ]
    },
    {
      id: 'section-4',
      title: 'Computer Networking',
      description: 'Fundamentals of networking concepts',
      questionCount: 20,
      questions: [
        { id: 'q23', question: 'Which device operates at the Data Link layer of the OSI model?', options: ['Router', 'Switch', 'Hub', 'Repeater'], correctAnswer: 1 },
        { id: 'q24', question: 'What is the default port for HTTP?', options: ['20', '21', '80', '443'], correctAnswer: 2 },
        { id: 'q25', question: 'Which protocol is used for secure file transfer?', options: ['FTP', 'SFTP', 'TFTP', 'HTTP'], correctAnswer: 1 },
        { id: 'q26', question: 'Which IP class has the default subnet mask 255.255.255.0?', options: ['Class A', 'Class B', 'Class C', 'Class D'], correctAnswer: 2 },
        { id: 'q27', question: 'What is the maximum length of a CAT6 Ethernet cable for proper performance?', options: ['50m', '75m', '100m', '150m'], correctAnswer: 2 },
        { id: 'q28', question: 'Which layer of the OSI model is responsible for routing?', options: ['Data Link', 'Network', 'Transport', 'Application'], correctAnswer: 1 },
        { id: 'q29', question: 'Which protocol is used to assign IP addresses automatically?', options: ['DNS', 'DHCP', 'ARP', 'ICMP'], correctAnswer: 1 },
        { id: 'q30', question: 'Which device breaks up collision domains in a network?', options: ['Hub', 'Switch', 'Repeater', 'Bridge'], correctAnswer: 1 },
        { id: 'q31', question: 'What does DNS stand for?', options: ['Domain Name System', 'Data Network Service', 'Digital Network Server', 'Domain Network Setup'], correctAnswer: 0 },
        { id: 'q32', question: 'Which command is used to check network connectivity?', options: ['ping', 'ipconfig', 'tracert', 'netstat'], correctAnswer: 0 },
        { id: 'q33', question: 'Which protocol is used to send emails?', options: ['SMTP', 'POP3', 'IMAP', 'SNMP'], correctAnswer: 0 },
        { id: 'q34', question: 'Which type of IP address is 192.168.1.1?', options: ['Public', 'Private', 'Multicast', 'Broadcast'], correctAnswer: 1 },
        { id: 'q35', question: 'What is the purpose of ARP?', options: ['Resolve IP to MAC', 'Resolve MAC to IP', 'Transfer files', 'Encrypt data'], correctAnswer: 0 },
        { id: 'q36', question: 'Which topology connects all devices to a single central cable?', options: ['Star', 'Ring', 'Bus', 'Mesh'], correctAnswer: 2 },
        { id: 'q37', question: 'Which wireless standard operates at 5GHz frequency?', options: ['802.11b', '802.11g', '802.11n', '802.11ac'], correctAnswer: 3 },
        { id: 'q38', question: 'Which protocol is connection-oriented?', options: ['UDP', 'TCP', 'ICMP', 'ARP'], correctAnswer: 1 },
        { id: 'q39', question: 'What is the size of an IPv6 address?', options: ['32 bits', '64 bits', '128 bits', '256 bits'], correctAnswer: 2 },
        { id: 'q40', question: 'Which layer of OSI ensures data is delivered error-free?', options: ['Transport', 'Network', 'Session', 'Application'], correctAnswer: 0 },
        { id: 'q41', question: 'Which device connects different networks together?', options: ['Switch', 'Router', 'Hub', 'Bridge'], correctAnswer: 1 },
        { id: 'q42', question: 'What is the maximum number of hosts for a /24 subnet?', options: ['126', '254', '510', '1022'], correctAnswer: 1 }
      ]
    },
    {
      id: 'section-5',
      title: 'Data Structures & Algorithms',
      description: 'Core DSA concept questions',
      questionCount: 20,
      questions: [
        { id: 'q43', question: 'Which data structure uses FIFO order?', options: ['Stack', 'Queue', 'Tree', 'Graph'], correctAnswer: 1 },
        { id: 'q44', question: 'What is the time complexity of binary search?', options: ['O(n)', 'O(log n)', 'O(n log n)', 'O(1)'], correctAnswer: 1 },
        { id: 'q45', question: 'Which of the following is a linear data structure?', options: ['Tree', 'Graph', 'Array', 'Heap'], correctAnswer: 2 },
        { id: 'q46', question: 'What is the worst-case time complexity of quicksort?', options: ['O(n^2)', 'O(n log n)', 'O(log n)', 'O(n)'], correctAnswer: 0 },
        { id: 'q47', question: 'Which of the following is a self-balancing binary search tree?', options: ['BST', 'AVL', 'Heap', 'Trie'], correctAnswer: 1 },
        { id: 'q48', question: 'Which data structure is best suited for implementing LRU cache?', options: ['Queue', 'LinkedList', 'HashMap', 'HashMap + Doubly LinkedList'], correctAnswer: 3 },
        { id: 'q49', question: 'What is the maximum number of nodes in a binary tree of height h?', options: ['2^h', '2^h - 1', 'h^2', 'h'], correctAnswer: 1 },
        { id: 'q50', question: 'Which traversal technique uses a stack?', options: ['Breadth First', 'Depth First', 'Level Order', 'None'], correctAnswer: 1 },
        { id: 'q51', question: 'Which algorithm is used to find the shortest path in a graph?', options: ['DFS', 'BFS', "Dijkstra's", "Prim's"], correctAnswer: 2 },
        { id: 'q52', question: 'Which is not a stable sorting algorithm?', options: ['Bubble Sort', 'Merge Sort', 'Heap Sort', 'Insertion Sort'], correctAnswer: 2 },
        { id: 'q53', question: 'Which data structure uses LIFO order?', options: ['Queue', 'Array', 'Stack', 'LinkedList'], correctAnswer: 2 },
        { id: 'q54', question: 'Which sorting algorithm is best for nearly sorted data?', options: ['Quick Sort', 'Merge Sort', 'Insertion Sort', 'Heap Sort'], correctAnswer: 2 },
        { id: 'q55', question: 'What is the height of a complete binary tree with n nodes?', options: ['log(n)', 'n', 'n log(n)', '1'], correctAnswer: 0 },
        { id: 'q56', question: 'Which data structure is used in recursion?', options: ['Queue', 'Stack', 'Tree', 'Graph'], correctAnswer: 1 },
        { id: 'q57', question: 'Which tree traversal gives prefix expression?', options: ['Inorder', 'Preorder', 'Postorder', 'Level order'], correctAnswer: 1 },
        { id: 'q58', question: 'What is the time complexity of inserting an element in a max-heap?', options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'], correctAnswer: 1 },
        { id: 'q59', question: 'Which graph algorithm is used for minimum spanning tree?', options: ['Dijkstra', 'Kruskal', 'Bellman-Ford', 'Floyd Warshall'], correctAnswer: 1 },
        { id: 'q60', question: 'A complete binary tree has all levels filled except possibly the:', options: ['First', 'Last', 'Middle', 'None'], correctAnswer: 1 },
        { id: 'q61', question: 'Which is not a characteristic of a graph?', options: ['Vertices', 'Edges', 'Heaps', 'Cycles'], correctAnswer: 2 },
        { id: 'q62', question: 'What is a trie used for?', options: ['Sorting', 'Searching', 'Prefix Searching', 'Counting'], correctAnswer: 2 }
      ]
    }
  ]
};

export default dsaTest;
