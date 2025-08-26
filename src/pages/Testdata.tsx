import { allCourses } from './courseData';
import { getTestById } from '../Services/testService';
import { useEffect, useState } from 'react';

export interface TestQuestion {
  marked: any;
  id: number;
  question: string;
  options: string[];
  correctAnswer: number; // index of correct option
  explanation?: string;
  hindiQuestion?: string;  // Add Hindi translation
  hindiOptions?: string[]; // Add Hindi options
}

export interface CourseTest {
  courseId: string;
  title: string;
  description: string;
  category: string;
  duration: number;
  TestId: string;
  attempts: number;
  thumbnail: string;
  passingScore: number;
  negativeMarking?: number;
  sections?: { // Add sections for exams that need them
    name: string;
    questions: TestQuestion[];
  }[];
  questions?: TestQuestion[]; // Keep this for non-sectioned tests
  instructions: string[];
}

// Hook to fetch test data by ID
export const useTestData = (testId: string) => {
  const [test, setTest] = useState<CourseTest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchTest = async () => {
      try {
        setLoading(true);
        const testData = await getTestById(testId);
        if (testData) {
          // Transform the test data to match the CourseTest interface
          const transformedTest: CourseTest = {
            courseId: testData.courseId || testData.$id,
            title: testData.title,
            description: testData.description,
            duration: testData.duration,
            passingScore: testData.passingScore,
            negativeMarking: testData.negativeMarking,
            instructions: testData.instructions || [
              'Read each question carefully before answering.',
              'You cannot go back to previous questions once answered.',
              'The test will auto-submit when time expires.'
            ],
            questions: testData.questions?.map((q: any, index: number) => ({
              id: q.id || index + 1,
              question: q.question,
              options: q.options,
              correctAnswer: q.correctAnswer,
              explanation: q.explanation,
              hindiQuestion: q.hindiQuestion,
              hindiOptions: q.hindiOptions,
              marked: undefined
            })) || [],
            sections: testData.sections?.map(section => ({
              ...section,
              questions: section.questions?.map((q: any, idx: number) => ({
                ...q,
                id: q.id || idx + 1,
                marked: undefined
              }))
            }))
          };
          setTest(transformedTest);
        }
      } catch (err) {
        console.error('Error fetching test:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch test'));
      } finally {
        setLoading(false);
      }
    };

    if (testId) {
      fetchTest();
    }
  }, [testId]);

  return { test, loading, error };
};

// Export an empty array as fallback
export const courseTests: CourseTest[] = [
  {
    courseId: '6853c41f002eef18b83f',
    TestId: '',
    category: 'SSC',
    attempts: 223,
    thumbnail: 'https://i.postimg.cc/zvXnqV5y/Chat-GPT-Image-Jul-3-2025-09-12-42-PM.png',
    title: 'SQL Practice Test',
    description: 'Test your knowledge of SQL concepts',
    duration: 1800, // 30 minutes
    passingScore: 70,
    instructions: [
      'Total questions: 20',
      'Time limit: 30 minutes',
      'Each question has one correct answer',
      'You can mark questions for review',
      'No negative marking'
    ],
    questions: [
      {
        id: 1,
        question: "Which of these is a window function in SQL?",
        options: [
          "GROUP BY",
          "PARTITION BY",
          "OVER",
          "JOIN"
        ],
        correctAnswer: 2,
        explanation: "The OVER clause defines a window or set of rows for window functions.",
        marked: undefined
      },
      {
        id: 2,
        question: "Which SQL clause is used to filter records?",
        options: [
          "FILTER",
          "WHERE",
          "QUERY",
          "CONDITION"
        ],
        correctAnswer: 1,
        explanation: "The WHERE clause is used to filter records.",
        marked: undefined
      },
    ]
  },
  {
    courseId: '6853c41f002eef18b83f',
    TestId: '',
    category: 'SQL',
    attempts: 2323,
    thumbnail: 'https://i.postimg.cc/zvXnqV5y/Chat-GPT-Image-Jul-3-2025-09-12-42-PM.png',
    title: 'Advanced SQL Practice Test',
    description: 'Test your knowledge of advanced SQL concepts',
    duration: 2700, // 45 minutes
    passingScore: 75,
    instructions: [
      'Total questions: 25',
      'Time limit: 45 minutes',
      'Each question has one correct answer',
      'You can mark questions for review',
      'No negative marking'
    ],
    questions: [
      {
        id: 1,
        question: "Which of these is a window function in SQL?",
        options: [
          "GROUP BY",
          "PARTITION BY",
          "OVER",
          "JOIN"
        ],
        correctAnswer: 2,
        explanation: "The OVER clause defines a window or set of rows for window functions.",
        marked: undefined
      },
    ]
  },
  {
    courseId: '6853c42300108f9f5c11',
    TestId: '',
    category: '',
    attempts: 2233,
    thumbnail: 'https://i.postimg.cc/zvXnqV5y/Chat-GPT-Image-Jul-3-2025-09-12-42-PM.png',
    title: 'Quantitative Aptitude Practice Test',
    description: 'Test your math skills for competitive exams',
    duration: 1800, // 30 minutes
    passingScore: 65,
    instructions: [
      'Total questions: 30',
      'Time limit: 30 minutes',
      'Each question has one correct answer',
      'You can mark questions for review',
      'No negative marking'
    ],
    questions: [
      {
        id: 1,
        question: "If 2x + 5 = 15, what is the value of x?",
        options: [
          "5",
          "10",
          "7.5",
          "2.5"
        ],
        correctAnswer: 0,
        explanation: "Subtract 5 from both sides: 2x = 10, then divide by 2: x = 5",
        marked: undefined
      },
    ]
  },
  {
    courseId: '6853c42000325f41481b',
    TestId: '686548b3002ba3f7e9f6',
    attempts: 222,
    category: '',
    title: 'SSC CGL Practice Test',
    description: 'Practice test for SSC CGL examination',
    duration: 3600, // 60 minutes
    passingScore: 60,
    negativeMarking: 0.5,
    thumbnail: 'https://i.postimg.cc/zvXnqV5y/Chat-GPT-Image-Jul-3-2025-09-12-42-PM.png',
    instructions: [
      'General Intelligence and Reasoning (25 Questions)',
      'General Awareness (25 Questions)',
      'Quantitative Aptitude (25 Questions)',
      'English Comprehension (25 Questions)',
      '+2.0 for correct attempt',
      '-0.5 for wrong attempt ',
      'Total questions: 100',
      'Time limit: 60 minutes',
      'Each question has one correct answer',
      'There is no -ve marking for unattempted questions',
      'You can also use the question numbers provided to move quickly',
      'You can bookmark any question to visit it later'
    ],
    sections: [
      {
        name: 'General Intelligence and Reasoning',
        questions: [
          {
            id: 1,
            question: "Three statements are given, followed by three conclusions numbered I, II and III. Assuming the statements to be true, even if they seem to be at variance with commonly known facts, decide which of the conclusions logically follow(s) from the statements.\n\nStatements:\nAll pages are diaries.\nSome diaries are books.\nAll books are notebooks.\n\nConclusions:\nI. No page is a notebook.\nII. All pages are notebooks.\nIII. All diaries being notebooks is a possibility.",
            options: [
              "Both conclusion I and II follow",
              "Only conclusions I and III follow",
              "Only conclusion III follows",
              "Only conclusion II follows"
            ],
            correctAnswer: 3,
            marked: undefined
          },
          {
            id: 2,
            question: "The position of how many letters will remain unchanged if all the letters in the word BINDER are arranged in English alphabetical order?",
            options: [
              "None",
              "One",
              "Two",
              "Three"
            ],
            correctAnswer: 3,
            marked: undefined
          },
          {
            id: 3,
            question: "In a certain code language,\n\n'A + B' means 'A is the mother of B';\n'A - B' means 'A is the brother of B';\n'A × B' means 'A is the wife of B' and\n'A ÷ B' means 'A is the father of B'.\n\nBased on the above, how is 4 related to 2 if '4 + 3 ÷ 2 ÷ 1 - 5'?",
            options: [
              "Father's father",
              "Father's mother",
              "Mother's father",
              "Mother's mother"
            ],
            correctAnswer: 2,
            marked: undefined
          },
          {
            id: 4,
            question: "Identify the figure given in the options which when put in place of '?' will logically complete the series.",
            options: [
              "Option 1",
              "Option 2",
              "Option 3",
              "Option 4"
            ],
            correctAnswer: 3,
            marked: undefined
          },
          {
            id: 5,
            question: "'WISK' is related to 'DRHP' in a certain way based on the English alphabetical order. In the same way, 'LENT' is related to 'OVMG'. To which of the following is 'BANG' related, following the same logic?",
            options: [
              "ZYLU",
              "ZYNS",
              "YZNU",
              "YZMT"
            ],
            correctAnswer: 4,
            marked: undefined
          },
          {
            id: 6,
            question: "Two sets of numbers are given below. In each set of numbers, certain mathematical operation(s) on the first number result(s) in the second number. Similarly, certain mathematical operation(s) on the second number result(s) in the third number and so on. Which of the given options follows the same set of operations as in the given sets?\n\n(NOTE: Operations should be performed on the whole numbers, without breaking down the numbers into their constituent digits. E.g. 13 - Operations on 13 such as adding/subtracting/multiplying to 13 can be performed. Breaking down 13 into 1 and 3 and then performing mathematical operations on 1 and 3 is not allowed.)\n\n18 – 36 – 72 – 107; 15 – 30 – 60 – 95",
            options: [
              "22 – 44 – 88 – 123",
              "25 – 50 – 100 – 125",
              "11 – 22 – 66 – 101",
              "30 – 60 – 90 – 115"
            ],
            correctAnswer: 1,
            marked: undefined
          },
          {
            id: 7,
            question: "Select the number from the given options to complete the series.\n25, 30, 40, 55, 75, ___",
            options: [
              "105",
              "85",
              "80",
              "100"
            ],
            correctAnswer: 4,
            marked: undefined
          },
          {
            id: 8,
            question: "The position(s) of how many letters will remain unchanged if all the letters in the word 'ENTOMB' are arranged in English alphabetical order?",
            options: [
              "None",
              "Two",
              "One",
              "Three"
            ],
            correctAnswer: 1,
            marked: undefined
          },
          {
            id: 9,
            question: "Six words Eat, Cry, Play, Sleep, Run and Bath are written on different faces of a dice. Three positions of this dice are shown in the figure. Find the word on the face opposite to Eat.",
            options: [
              "Play",
              "Cry",
              "Sleep",
              "Run"
            ],
            correctAnswer: 4,
            marked: undefined
          },
          {
            id: 10,
            question: "Two different positions of the same dice with faces T, O, B, L, Y and V are shown below. Select the letter that will be on the face opposite to the one having L.",
            options: [
              "Y",
              "B",
              "V",
              "O"
            ],
            correctAnswer: 4,
            marked: undefined
          },
          {
            id: 11,
            question: "Select the word-pair that best represents a similar relationship to the one expressed in the pair of words given below. (The words must be considered as meaningful English words and must NOT be related to each other based on the number of letters/number of consonants/vowels in the word)",
            options: [
              "Fungus : Jasmine",
              "Amaltas : Tree",
              "Fenugreek : Micro organism",
              "Algae : Flower"
            ],
            correctAnswer: 2,
            marked: undefined
          },
          {
            id: 12,
            question: "Select the set in which the numbers are related in the same way as are the numbers of the given sets. (213, 157), (185, 129)\n(NOTE : Operations should be performed on the whole numbers, without breaking down the numbers into its constituent digits. E.g., 13 - Operations on 13 such as adding /deleting /multiplying etc. to 13 can be performed. Breaking down 13 into 1 and 3 and then performing mathematical operations on 1 and 3 is not allowed)",
            options: [
              "(171, 123)",
              "(189, 141)",
              "(164, 108)",
              "(192, 152)"
            ],
            correctAnswer: 3,
            marked: undefined
          },
          {
            id: 13,
            question: "Three of the following four options are alike in a certain way and thus form a group. Which is the one that does NOT belong to that group?\n(NOTE: Operations should be performed on the whole numbers, without breaking down the numbers into its constituent digits. E.g. 13 - Operations on 13 such as adding/subtracting/multiplying etc. to 13 can be performed. Breaking down 13 into 1 and 3 and then performing mathematical operations on 1 and 3 is not allowed.)",
            options: [
              "540 – 188 – 128",
              "72 – 284 – 266",
              "81 – 101 – 92",
              "90 – 22 – 12"
            ],
            correctAnswer: 2,
            marked: undefined
          },
          {
            id: 14,
            question: "Which of the following terms will replace the question mark (?) in the given series?\nIMHP, MPJQ, QSLR, UVNS, ?",
            options: [
              "YYPT",
              "YYPT",
              "YXPT",
              "XYPT"
            ],
            correctAnswer: 1,
            marked: undefined
          },
          {
            id: 15,
            question: "In a certain code language, 'FACED' is written as 'GZDDE' and 'VACAY' is written as 'WZDZZ'. How will 'LABOR' be written in that language?",
            options: [
              "MZCNS",
              "MBCPS",
              "MBDPS",
              "MADMS"
            ],
            correctAnswer: 1,
            marked: undefined
          },
          {
            id: 16,
            question: "Which two signs should be interchanged to make the following equation correct?\n247 ÷ 13 + 16 × 3 – 148 = 119",
            options: [
              "+ and ×",
              "- and +",
              "- and ×",
              "+ and ×"
            ],
            correctAnswer: 2,
            marked: undefined
          },
          {
            id: 17,
            question: "How many triangles are there in the given figure?",
            options: [
              "18",
              "16",
              "21",
              "20"
            ],
            correctAnswer: 3,
            marked: undefined
          },
          {
            id: 18,
            question: "Select the correct mirror image of the given figure when the mirror is placed at MN.",
            options: [
              "Option 1",
              "Option 2",
              "Option 3",
              "Option 4"
            ],
            correctAnswer: 1,
            marked: undefined
          },
          {
            id: 19,
            question: "Select the figure from among the given options that can replace the question mark (?) in the following series.",
            options: [
              "Option 1",
              "Option 2",
              "Option 3",
              "Option 4"
            ],
            correctAnswer: 1,
            marked: undefined
          },
          {
            id: 20,
            question: "In a certain code language, 'FIVE' is written as '12184410' and FOUR is written as '12304236'. How will 'THREE' be written in that language?",
            options: [
              "4016361110",
              "4016361310",
              "4016361212",
              "4016361010"
            ],
            correctAnswer: 4,
            marked: undefined
          },
          {
            id: 21,
            question: "Select the correct mirror image of the given figure when the mirror is placed at MN as shown below.",
            options: [
              "Option 1",
              "Option 2",
              "Option 3",
              "Option 4"
            ],
            correctAnswer: 1,
            marked: undefined
          },
          {
            id: 22,
            question: "In the following series, only one letter-cluster is incorrect. Select the incorrect letter-cluster.",
            options: [
              "SVZ",
              "MQU",
              "CGK",
              "IMQ"
            ],
            correctAnswer: 1,
            marked: undefined
          },
          {
            id: 23,
            question: "Based on the English alphabetical order, three of the following four letter-clusters are alike in a certain way and thus form a group. Which is the one that DOES NOT belong to that group?\n(Note: The odd man out is not based on the number of consonants/vowels or their position in the letter-cluster.)",
            options: [
              "KJE",
              "JHD",
              "FDZ",
              "AYU"
            ],
            correctAnswer: 1,
            marked: undefined
          },
          {
            id: 24,
            question: "Select the option that is related to the fifth number in the same way as the second number is related to the first number and the fourth number is related to the third number. 19 : 34 :: 5 : 6 :: 27 : ?",
            options: [
              "50",
              "67",
              "52",
              "63"
            ],
            correctAnswer: 1,
            marked: undefined
          },
          {
            id: 25,
            question: "What will come in the place of the question mark (?) in the following equation, if '+' and '−' are interchanged and '×' and '÷' are interchanged?\n342 × 18 + 79 - 45 + 3 = ?",
            options: [
              "65",
              "75",
              "85",
              "55"
            ],
            correctAnswer: 2,
            marked: undefined
          }
        ]
      },
      {
        name: 'General Awareness',
        questions: [
          {
            id: 26,
            question: "Who among the following is the world renowned exponent of the bamboo flute?",
            options: [
              "MS Subbulakshmi",
              "Ravi Shankar",
              "Hariprasad Chaurasia",
              "Bismillah Khan"
            ],
            correctAnswer: 3,
            marked: undefined
          },
          {
            id: 27,
            question: "What is net investment?",
            options: [
              "Sum of all the investments in a country",
              "Gross investment + depreciation",
              "Gross capital investment - indirect taxes",
              "Gross investment - depreciation"
            ],
            correctAnswer: 4,
            marked: undefined
          },
          {
            id: 28,
            question: "India won the ICC Men Cricket World Cup for the first time in which of the following years?",
            options: [
              "1996",
              "1992",
              "1987",
              "1983"
            ],
            correctAnswer: 4,
            marked: undefined
          },
          {
            id: 29,
            question: "Match the following institutes with their respective founders of British India.\n\nInstitutes\na. Asiatic Society of Bengal\nb. Sanskrit College of Benaras\nc. Fort William College\nd. Calcutta Madrasa\n\nTheir respective founders\ni. Warren Hastings\nii. Lord Wellesley\niii. Jonathan Duncan\niv. Sir William Jones",
            options: [
              "a-iii, b-i, c-iv, d-iii",
              "a-iii, b-iv, c-i, d-ii",
              "a-iv, b-iii, c-ii, d-i",
              "a-i, b-ii, c-iii, d-iv"
            ],
            correctAnswer: 2,
            marked: undefined
          },
          {
            id: 30,
            question: "Kathakali, one of the classical dances of India, is predominantly performed in which of the following states of India?",
            options: [
              "Assam",
              "Manipur",
              "Uttar Pradesh",
              "Kerala"
            ],
            correctAnswer: 4,
            marked: undefined
          },
          {
            id: 31,
            question: "Identify the oldest iron and steel company of India from the following options.",
            options: [
              "Tata Iron & Steel Company(TISCO)",
              "Visvesvaraiya Iron & Steel Works",
              "Indian Iron & Steel Company (IISCO)",
              "Mysore Iron & Steel Works"
            ],
            correctAnswer: 1,
            marked: undefined
          },
          {
            id: 32,
            question: "The magnificent Kailasa temple at Ellora was built during the reign of which Rashtrakuta king?",
            options: [
              "Krishna I",
              "Indra III",
              "Govinda III",
              "Amoghavarsha"
            ],
            correctAnswer: 0,
            marked: undefined
          },
          {
            id: 33,
            question: "In which state/UT is the Hemis festival celebrated?",
            options: [
              "Punjab",
              "Sikkim",
              "Lakshadweep",
              "Ladakh"
            ],
            correctAnswer: 4,
            marked: undefined
          },
          {
            id: 34,
            question: "Which of the following is the largest artificial lake of Asia?",
            options: [
              "Naini Lake",
              "Bhopal Lake",
              "Dal Lake",
              "Chilika Lake"
            ],
            correctAnswer: 2,
            marked: undefined
          },
          {
            id: 35,
            question: "In 2002, Zakir Hussain became the youngest percussionist to be honoured with which award?",
            options: [
              "Sangeet Natak Akademi Award",
              "Grammy Award",
              "Padma Bhushan",
              "National Heritage Fellowship"
            ],
            correctAnswer: 3,
            marked: undefined
          },
          {
            id: 36,
            question: "Microbes like Rhizobium, Nitrosomonas and Nitrobacter are used for:",
            options: [
              "nitrogen cycling",
              "carbon cycling",
              "water cycling",
              "sulphur cycling"
            ],
            correctAnswer: 1,
            marked: undefined
          },
          {
            id: 37,
            question: "With reference to Sepoy Mutiny of 1857, on which of the following dates did the soldiers at Meerut start their journey to Delhi?",
            options: [
              "10 May",
              "19 April",
              "2 June",
              "29 March"
            ],
            correctAnswer: 1,
            marked: undefined
          },
          {
            id: 38,
            question: "Who among the following was selected as the Sherpa for India's G20 hosted in 2022-23?",
            options: [
              "Piyush Goyal",
              "Ashwini Vaishnav",
              "Shakilkanta Das",
              "Amitabh Kant"
            ],
            correctAnswer: 4,
            marked: undefined
          },
          {
            id: 39,
            question: "Purvanchal Himalayas does NOT comprise of:",
            options: [
              "Naga hills",
              "Pir Panjal range",
              "Manipur hills",
              "Mizo hills"
            ],
            correctAnswer: 2,
            marked: undefined
          },
          {
            id: 40,
            question: "In which year did India make its Olympic debut in hockey?",
            options: [
              "1936",
              "1932",
              "1924",
              "1928"
            ],
            correctAnswer: 4,
            marked: undefined
          },
          {
            id: 41,
            question: "A student, on his school assignment, is taking a session on how to make compost at home for using it at a park. Which fundamental duty is he performing?",
            options: [
              "To strive towards excellence in all spheres of individual and collective activity",
              "To safeguard public property and to abjure violence",
              "To develop the scientific temper, humanism and the spirit of inquiry",
              "To protect and improve the natural environment"
            ],
            correctAnswer: 4,
            marked: undefined
          },
          {
            id: 42,
            question: "In August 2022, the Ministry of Social Justice and Empowerment launched the ______ scheme, with an aim to provide comprehensive rehabilitation services to people engaged in begging in 75 municipalities.",
            options: [
              "TWINKLE-75",
              "BEAM-75",
              "SMILE-75",
              "RISE-75"
            ],
            correctAnswer: 3,
            marked: undefined
          },
          {
            id: 43,
            question: "Which is the National Mission for Financial Inclusion to ensure access to financial services, namely, a basic savings and deposits accounts, remittance, credit, insurance, pension in an affordable manner?",
            options: [
              "Deendayal Antyodaya Yojana",
              "Deen Dayal Upadhyaya Grameen Kaushalya Yojana",
              "Swarajayanti Gram Swarozgar Yojana",
              "Pradhan Mantri Jan Dhan Yojana"
            ],
            correctAnswer: 4,
            marked: undefined
          },
          {
            id: 44,
            question: "Which of the following plays was NOT written by Harshavardhana?",
            options: [
              "Vikramoryasiyam",
              "Ratnavali",
              "Nagananda",
              "Priyadarshika"
            ],
            correctAnswer: 1,
            marked: undefined
          },
          {
            id: 45,
            question: "The organisms that do not have a defined nucleus or organelles are classified in to ______ Kingdom.",
            options: [
              "Fungi",
              "Protista",
              "Monera",
              "Plantae"
            ],
            correctAnswer: 3,
            marked: undefined
          },
          {
            id: 46,
            question: "Which Article of the Constitution of India provides that 'there shall be a Vice President of India'?",
            options: [
              "Article 61",
              "Article 63",
              "Article 65",
              "Article 62"
            ],
            correctAnswer: 2,
            marked: undefined
          },
          {
            id: 47,
            question: "A javelin thrown by an athlete is in ______ motion.",
            options: [
              "oscillatory",
              "periodic",
              "rectilinear",
              "curvilinear"
            ],
            correctAnswer: 4,
            marked: undefined
          },
          {
            id: 48,
            question: "The green revolution technology resulted in an increase in production of cereal production from 72.4 million tons in 1965-66 to ______ million tons in 1978-79.",
            options: [
              "150.8",
              "165.9",
              "131.9",
              "141.2"
            ],
            correctAnswer: 3,
            marked: undefined
          },
          {
            id: 49,
            question: "Calculate the oxidation number of 'S' in H₂S₂O₇.",
            options: [
              "3",
              "7",
              "6",
              "2"
            ],
            correctAnswer: 3,
            marked: undefined
          },
          {
            id: 50,
            question: "Which of the following is NOT an amendment made to the Airport Economic Regulatory Authority (AERA) Amendment Act, 2021?",
            options: [
              "The government can call any airport a major airport just by notification.",
              "The government will club together profit-making and loss-making airports.",
              "The government can offer airports as a package in PPP mode to the prospective bidders.",
              "A major airport is one which has an annual traffic of minimum 35 lakh passengers."
            ],
            correctAnswer: 4,
            marked: undefined
          }
        ]
      },
      {
        name: 'Quantitative Aptitude',
        questions: [
          {
            id: 51,
            question: "Which digits should come in place * and $, respectively, if the number 72864*$ is divisible by both 8 and 5?",
            options: [
              "4 and 0",
              "2 and 0",
              "2 and 5",
              "4 and 5"
            ],
            correctAnswer: 1,
            marked: undefined
          },
          {
            id: 52,
            question: "The given table shows the number of soaps sold by four different companies in 4 different months.\n\n| Month Company | May | June | July | August |\n|--------------|-----|------|------|--------|\n| P            | 1924 | 1780 | 1820 | 1490   |\n| Q            | 1540 | 1245 | 1648 | 2450   |\n| R            | 2035 | 1485 | 1350 | 1650   |\n| S            | 1736 | 1855 | 1470 | 1180   |\n\nThe total number of soaps sold by companies Q and S together in May, is what percentage more than the number of soaps sold by company P in July?",
            options: [
              "75%",
              "90%",
              "65%",
              "80%"
            ],
            correctAnswer: 3,
            marked: undefined
          },
          {
            id: 53,
            question: "In a triangle PQR, S is a point on the side QR such that PS⊥QR, then which of the following options is true?",
            options: [
              "PS² + PR² = PQ² + QR²",
              "PR² + QS² = PQ² + SR²",
              "PQ² + PR² = QS² + SR²",
              "PS² + QS² = PQ² + PR²"
            ],
            correctAnswer: 2,
            marked: undefined
          },
          {
            id: 54,
            question: "Simplify\n15.5 – [3 – (7 – (5 – (14.5 – 13.5)))]",
            options: [
              "15.5",
              "13.5",
              "12.5",
              "14.5"
            ],
            correctAnswer: 1,
            marked: undefined
          },
          {
            id: 55,
            question: "The incomes of P, Q and R are in the ratio 10 : 12 : 9 and their expenditures are in the ratio 12 : 15 : 8. If Q saves 25% of his income, then what is the ratio of the savings of P, Q and R?",
            options: [
              "15 : 14 : 21",
              "14 : 15 : 21",
              "21 : 15 : 14",
              "21 : 14 : 15"
            ],
            correctAnswer: 2,
            marked: undefined
          },
          {
            id: 56,
            question: "The classification of 100 students based on the marks obtained by them in English and Mathematics in an examination is given in the table below. Study the table and answer the question that follows.\n\n| MARKS OUT OF 50    |    |    |    |    |\n|--------------------|----|----|----|----|\n| SUBJECT            | 40 and above | 30 and above | 20 and above | 10 and above | 0 and above |\n| ENGLISH            | 10 | 31 | 80 | 92 | 100 |\n| MATHEMATICS        | 3 | 23 | 65 | 81 | 100 |\n| AGGREGATE          | 7 | 27 | 73 | 87 | 100 |\n\nIf at least 40% marks in Mathematics are required for pursuing higher studies in Mathematics, how many students will be eligible to pursue higher studies in Mathematics?",
            options: [
              "55",
              "65",
              "70",
              "50"
            ],
            correctAnswer: 2,
            marked: undefined
          },
          {
            id: 57,
            question: "In triangles ABC and DEF, AB = FD and ∠A = ∠D. The two triangles are congruent by SAS criterion if:",
            options: [
              "BC = DE",
              "AC = EF",
              "BC = EF",
              "AC = DE"
            ],
            correctAnswer: 4,
            marked: undefined
          },
          {
            id: 58,
            question: "Two pipes, A and B, can fill a tank in 10 minutes and 20 minutes, respectively. The pipe C can empty the tank in 30 minutes. All the three pipes are opened at a time in the beginning. However, pipe C is closed 2 minutes before the tank is filled. In what time, will the tank be full (in minutes)?",
            options: [
              "12",
              "10",
              "8",
              "6"
            ],
            correctAnswer: 3,
            marked: undefined
          },
          {
            id: 59,
            question: "A payment of ₹120 is made with ₹10, ₹5 and ₹2 coins. A total of 25 coins are used. Which of the following is the number of ₹10 coins used in the payment?",
            options: [
              "6",
              "4",
              "10",
              "8"
            ],
            correctAnswer: 4,
            marked: undefined
          },
          {
            id: 60,
            question: "If 28.9 : x :: x : 36.1, and x > 0, then find the value of x.",
            options: [
              "38.3",
              "32.3",
              "30.4",
              "35"
            ],
            correctAnswer: 2,
            marked: undefined
          },
          {
            id: 61,
            question: "Study the given pie chart carefully and answer the question that follows. The given pie chart shows the number of successful start-ups in different sectors in a particular year.\n\nSTART-UPS IN THE DIFFERENT SECTORS\n\nAgriculture 12%\nHealth and Pharmaceutical 30%\nInfrastructure 15%\nTransport 9%\nEducation 24%\nCommunication 10%\n\nIf the total number of successful start-ups is 2910, then find the number of start-ups in the education and agriculture sectors. (Neglect the decimal part.)",
            options: [
              "698",
              "1048",
              "1074",
              "1047"
            ],
            correctAnswer: 4,
            marked: undefined
          },
          {
            id: 62,
            question: "The height of a cylinder is 20 cm. The lateral surface area is 1760 cm². Its volume is:",
            options: [
              "12032 cm³",
              "12302 cm³",
              "12203 cm³",
              "12320 cm³"
            ],
            correctAnswer: 4,
            marked: undefined
          },
          {
            id: 63,
            question: "Raj divides ₹1,200 in the ratio 2 : 1 : 3 among three of his friends. The amount equal to the sum of three times the largest share and two times the smallest share is:",
            options: [
              "₹2,400",
              "₹1,800",
              "₹2,200",
              "₹2,000"
            ],
            correctAnswer: 3,
            marked: undefined
          },
          {
            id: 64,
            question: "A shopkeeper marked an article at ₹5,000. The shopkeeper allows successive discounts of 20%,15% and 10%. The selling price of the article is:",
            options: [
              "₹2,750",
              "₹3,000",
              "₹2,800",
              "₹3,060"
            ],
            correctAnswer: 4,
            marked: undefined
          },
          {
            id: 65,
            question: "The average of 12 numbers is 48. The average of the first 5 numbers is 45 and the average of next 4 numbers is 52. If the 10th number is 10 less than the 11th number and is 5 more than the 12th number, then the average of the 11th and 12th numbers is:",
            options: [
              "50.5",
              "46.5",
              "47.5",
              "48.5"
            ],
            correctAnswer: 4,
            marked: undefined
          },
          {
            id: 66,
            question: "Find the value of the following expression.\n√{(1 + sin θ)/(1 - sin θ)}",
            options: [
              "sec θ + tan θ",
              "cosec θ + tan θ",
              "cosec θ + cot θ",
              "sec θ + cot θ"
            ],
            correctAnswer: 1,
            marked: undefined
          },
          {
            id: 67,
            question: "The value of (sin θ - 2 sin³ θ)/(2 cos³ θ - cos θ) × (1/tan θ) = sec² θ",
            options: [
              "2",
              "1",
              "0",
              "-1"
            ],
            correctAnswer: 4,
            marked: undefined
          },
          {
            id: 68,
            question: "Let t = 2/5, then the value of the expression t³ + (3/5)³ + (9/5)t is:",
            options: [
              "1/5",
              "1",
              "2",
              "1/2"
            ],
            correctAnswer: 2,
            marked: undefined
          },
          {
            id: 69,
            question: "M and N walk along a circular track. They start at 5:00 a.m. from the same point in the opposite directions. M and N walk at a speed of 5 rounds per hour and 2 rounds per hour, respectively. How many times will they cross each other before 6.30 a.m. on the same day?",
            options: [
              "10",
              "3",
              "5",
              "7"
            ],
            correctAnswer: 1,
            marked: undefined
          },
          {
            id: 70,
            question: "Two circles C₁ and C₂ touch each other externally. The radius of C₁ = 16 cm and the radius of C₂ = 8 cm. Find the length (in cm) of their common tangent.",
            options: [
              "8√3",
              "16√3",
              "8√2",
              "16√2"
            ],
            correctAnswer: 4,
            marked: undefined
          },
          {
            id: 71,
            question: "Two circles C₁ and C₂ touch each other externally. The radius of C₁ = 16 cm and the radius of C₂ = 8 cm. Find the length (in cm) of their common tangent.",
            options: [
              "8√3",
              "16√3",
              "8√2",
              "16√2"
            ],
            correctAnswer: 4,
            marked: undefined
          },
          // Add more English questions...
        ]
      }
    ]
  },
  {
    courseId: 'ibps-po',
    TestId: '',
    attempts: 9323,
    category: '',
    thumbnail: 'https://i.postimg.cc/zvXnqV5y/Chat-GPT-Image-Jul-3-2025-09-12-42-PM.png',
    title: 'IBPS PO Practice Test',
    description: 'Practice test for IBPS Probationary Officer examination',
    duration: 3600, // 60 minutes
    passingScore: 65,
    instructions: [
      'Total questions: 50',
      'Time limit: 60 minutes',
      'Each question has one correct answer',
      'You can mark questions for review',
      'No negative marking'
    ],
    questions: [
      {
        id: 1,
        question: "What is the full form of IBPS?",
        options: [
          "Indian Banking Personnel Service",
          "Institute of Banking Personnel Selection",
          "International Banking and Payment System",
          "Indian Bureau of Public Sector"
        ],
        correctAnswer: 1,
        marked: undefined
      },
      // Add more questions...
    ]
  },
  {
    courseId: 'ibps-rrbddddd',
    TestId: '',
    category: '',
    attempts: 4453,
    thumbnail: 'https://i.postimg.cc/zvXnqV5y/Chat-GPT-Image-Jul-3-2025-09-12-42-PM.png',
    title: 'IBPS RRB Practice Test',
    description: 'Practice test for IBPS Probationary Officer examination',
    duration: 3600, // 60 minutes
    passingScore: 65,
    instructions: [
      'Total questions: 50',
      'Time limit: 60 minutes',
      'Each question has one correct answer',
      'You can mark questions for review',
      'No negative marking'
    ],
    questions: [
      {
        id: 1,
        question: "What is the full form of IBPS?",
        options: [
          "Indian Banking Personnel Service",
          "Institute of Banking Personnel Selection",
          "International Banking and Payment System",
          "Indian Bureau of Public Sector"
        ],
        correctAnswer: 1,
        marked: undefined
      },
      // Add more questions...
    ]
  }
];

// Helper function to get test by TestId
export const getTestByTestId = (testId: string): CourseTest | undefined => {
  console.log('Searching for test with ID:', testId);
  const test = courseTests.find(test => {
    // Try both 'TestId' and 'testId' to handle any case sensitivity issues
    const id = (test as any).TestId || (test as any).testId;
    console.log('Checking test:', { id, testTitle: test.title });
    return id === testId;
  });
  
  if (!test) {
    console.error('No test found with ID:', testId);
    console.log('Available test IDs:', courseTests.map(t => (t as any).TestId || (t as any).testId));
  }
  
  return test;
};