import { ReactNode } from 'react';
import logo from '../Images/1.jpg';

// Helper function to generate random rating between 4.0 and 5.0
const generateRandomRating = () => {
  const rating = (Math.random() * 1 + 4).toFixed(1); // Random number between 4.0 and 5.0
  const fullStars = Math.floor(Number(rating));
  const hasHalfStar = Number(rating) % 1 >= 0.5;
  
  return (
    <div className="flex items-center">
      {[...Array(5)].map((_, i) => (
        <svg 
          key={i} 
          className={`w-5 h-5 ${i < fullStars ? 'text-yellow-400' : (i === fullStars && hasHalfStar ? 'text-yellow-400' : 'text-gray-300')}`} 
          fill={i < fullStars || (i === fullStars && hasHalfStar) ? 'currentColor' : 'none'} 
          viewBox="0 0 20 20"
          stroke="currentColor"
        >
          {i < fullStars ? (
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          ) : i === fullStars && hasHalfStar ? (
            <path d="M5.354 5.119L7.538.792A.516.516 0 018 .5c.183 0 .366.097.465.292l2.184 4.327 4.898.696A.537.537 0 0116 6.32a.55.55 0 01-.17.445l-3.523 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256a.52.52 0 01-.146.05c-.341.06-.668-.254-.6-.642l.83-4.73L.173 6.765a.55.55 0 01-.172-.403.58.58 0 01.085-.302.51.51 0 01.37-.245l4.898-.696zM8 12.027c.08 0 .16.018.232.056l3.686 1.894-.694-3.957a.56.56 0 01.16-.505l2.907-2.77-4.052-.576a.53.53 0 01-.393-.288L8.002 3.223 8 3.226v8.801z" />
          ) : (
            <path d="M9.05 3.691c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.372 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.539 1.118l-2.8-2.034a1 1 0 00-1.176 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.363-1.118l-2.8-2.034c-.784-.57-.38-1.81.588-1.81h3.461a1 1 0 00.95-.69l1.07-3.292z" />
          )}
        </svg>
      ))}
      <span className="ml-2 text-sm text-gray-500">({rating}/5.0)</span>
    </div>
  );
};

export interface VideoLecture {
  id: string;
  title: string;
  youtubeId: string;
  description: string;
  duration?: string;
}

export interface Teacher {
  id: string;
  name: string;
  email: string;
  bio: string;
  image: string;
}

export interface LiveLecture {
  id: string;
  title: string;
  description: string;
  scheduledTime: string;
  duration: string;
  meetingLink?: string;
  status: 'scheduled' | 'live' | 'completed';
  teacherId: string;
}

export interface StudyMaterial {
  id: string;
  title: string;
  description: string;
  fileUrl: string;
  fileType: 'pdf' | 'doc' | 'ppt' | 'video' | 'other';
  uploadDate: string;
  teacherId: string;
}

export interface Course {
  id: string;
  courseId?: string;  // Alias for id for backward compatibility
  title: string;
  description: string;
  duration: string;
  students: string;
  successRate: string;
  level: string;
  image: string;
  price?: number;
  category?: string;
  originalPrice?: number;
  syllabus: string[];
  features: string[];
  rating?: ReactNode;
  videoLectures?: VideoLecture[];
  overview?: string;
  teacherId?: string;
  liveLectures?: LiveLecture[];
  studyMaterials?: StudyMaterial[];
  testIds?: string[]; // Array of test IDs associated with this course
}

export interface CourseCategory {
  category: string;
  courses: Course[];
}

export const sqlCourses: Course[] = [
  {
    id: '6853c41f000dc86d8aae',
    title: 'SQL Fundamentals',
    description: 'Master database queries, joins, and basic operations',
    duration: '6 Weeks',
    students: '30,000+',
    successRate: '95%',
    rating: generateRandomRating(),
    price: 799,
    testIds: ['686548b2000e1cb9a932'],
    level: 'Beginner',
    image: 'https://www.ed2go.com/common/images/1/17136.jpg',
    syllabus: [
      'Database Fundamentals',
      'SQL Syntax',
      'CRUD Operations',
      'Basic Joins'
    ],
    features: [
      'Interactive Exercises',
      'Real-world Projects',
      'Quizzes',
      'Certificate'
    ],
    videoLectures: [
      {
        id: 'sql-intro',
        title: 'Introduction to SQL',
        youtubeId: '2SPkPZ0Zrn8',
        description: 'Learn the basics of SQL and databases',
        duration: '18:20'
      },
      {
        id: 'sql-queries',
        title: 'Basic SQL Queries',
        youtubeId: 'k9TUPpGqYTo',
        description: 'Writing your first SELECT statements',
        duration: '22:45'
      }
    ]
  },
  {
    id: '6853c41f002eef18b83f',
    title: 'Advanced SQL',
    description: 'Window functions, optimization, and complex queries',
    duration: '8 Weeks',
    rating: generateRandomRating(),
    price: 799,
    students: '15,000+',
    successRate: '92%',
    level: 'Intermediate',
    image: 'https://www.ed2go.com/common/images/1/17136.jpg',
    syllabus: [
      'Window Functions',
      'Query Optimization',
      'Advanced Joins',
      'Stored Procedures'
    ],
    features: [
      'Complex Query Challenges',
      'Performance Tuning',
      'Database Design',
      'Advanced Certification'
    ],
    videoLectures: [
      {
        id: 'window-functions',
        title: 'Window Functions Explained',
        youtubeId: '9Os0o3wzS_I',
        description: 'Mastering analytical functions in SQL',
        duration: '28:15'
      },
      {
        id: 'query-optimization',
        title: 'SQL Query Optimization',
        youtubeId: 'dQw4w9WgXcQ',
        description: 'Techniques to make your queries faster',
        duration: '25:30'
      }
    ]
  },
  {
    id: '6866ec1a002ad3caece9',
    title: 'Computer Networking Fundamentals',
    description: 'Understand the basics of computer networks, protocols, and communication models',
    duration: '6 Weeks',
    rating: generateRandomRating(),
    students: '25,000+',
    successRate: '93%',
    price: 799,
    testIds: ['686548b2000e1cb9a935'],
    level: 'Beginner',
    image: 'https://i.postimg.cc/VkGNHHB0/Chat-GPT-Image-Jul-4-2025-02-56-07-PM.png',
    syllabus: [
      'Introduction to Networking',
      'OSI & TCP/IP Models',
      'IP Addressing & Subnetting',
      'Network Devices & Protocols'
    ],
    features: [
      'Interactive Diagrams',
      'Real-world Scenarios',
      'Quizzes',
      'Certificate of Completion'
    ],
    videoLectures: [
      {
        id: 'networking-intro',
        title: 'What is Computer Networking?',
        youtubeId: 'qiQR5rTSshw',
        description: 'An introduction to networks, types, and basic concepts',
        duration: '16:10'
      },
      {
        id: 'osi-model',
        title: 'The OSI Model Explained',
        youtubeId: 'vv4y_uOneC0',
        description: 'Understand the 7 layers of the OSI model and how they work',
        duration: '20:34'
      }
    ]
  }
];

export const ComputerNetwork: Course[] = [
  {
    id: '6853c41f000dc86d8aaf',
    title: 'Computer Networking Fundamentals',
    description: 'Understand the basics of computer networks, protocols, and communication models',
    duration: '6 Weeks',
    students: '25,000+',
    successRate: '93%',
    price: 799,
    testIds: ['686548b2000e1cb9a935'],
    level: 'Beginner',
    image: 'https://asianetbroadband.in/wp-content/uploads/2023/09/computer-networking-devices.jpg',
    syllabus: [
      'Introduction to Networking',
      'OSI & TCP/IP Models',
      'IP Addressing & Subnetting',
      'Network Devices & Protocols'
    ],
    features: [
      'Interactive Diagrams',
      'Real-world Scenarios',
      'Quizzes',
      'Certificate of Completion'
    ],
    videoLectures: [
      {
        id: 'networking-intro',
        title: 'What is Computer Networking?',
        youtubeId: 'qiQR5rTSshw',
        description: 'An introduction to networks, types, and basic concepts',
        duration: '16:10'
      },
      {
        id: 'osi-model',
        title: 'The OSI Model Explained',
        youtubeId: 'vv4y_uOneC0',
        description: 'Understand the 7 layers of the OSI model and how they work',
        duration: '20:34'
      }
    ]
  }
];

export const aptitudeCourses: Course[] = [
  {
    id: '6853c42300108f9f5c11',
    title: 'Quantitative Aptitude',
    description: 'Master math skills for competitive exams and interviews',
    duration: '8 Weeks',
    students: '25,000+',
    successRate: '92%',
    rating: generateRandomRating(),
    price: 899,
    level: 'All Levels',
    image: 'https://cache.careers360.mobi/media/presets/860X430/article_images/2019/9/17/Quantitative-Aptitude.jpg',
    syllabus: [
      'Number Systems',
      'Algebra',
      'Geometry',
      'Data Interpretation'
    ],
    features: [
      '1000+ Practice Questions',
      'Shortcut Techniques',
      'Exam Strategies',
      'Mock Tests'
    ],
    videoLectures: [
      {
        id: 'quant-basics',
        title: 'Quantitative Basics',
        youtubeId: '2SPkPZ0Zrn8',
        description: 'Fundamental concepts of quantitative aptitude',
        duration: '35:20'
      },
      {
        id: 'fast-calculation',
        title: 'Fast Calculation Techniques',
        youtubeId: 'k9TUPpGqYTo',
        description: 'Learn shortcut methods for faster calculations',
        duration: '28:45'
      }
    ]
  },
  {
    id: '6853c423002a2cabe040',
    title: 'Logical Reasoning',
    description: 'Develop critical thinking and problem-solving skills',
    duration: '6 Weeks',
    students: '35,000+',
    successRate: '94%',
    rating: generateRandomRating(),
    price: 999,
    level: 'All Levels',
    image: 'https://test.brainkart.com/media/subject/article-Logical-Reasoning-NWW.jpg',
    syllabus: [
      'Puzzles',
      'Syllogisms',
      'Blood Relations',
      'Coding-Decoding'
    ],
    features: [
      '500+ Practice Questions',
      'Pattern Recognition',
      'Time Management',
      'Exam Strategies'
    ],
    videoLectures: [
      {
        id: 'puzzle-solving',
        title: 'Puzzle Solving Techniques',
        youtubeId: '9Os0o3wzS_I',
        description: 'Approaches to solve complex puzzles',
        duration: '32:10'
      },
      {
        id: 'logical-deduction',
        title: 'Logical Deduction Methods',
        youtubeId: 'dQw4w9WgXcQ',
        description: 'Mastering syllogisms and logical sequences',
        duration: '26:45'
      }
    ]
  }
];

export const pythonCourses: Course[] = [
  {
    id: '6853c4200005a79f75b6',
    title: 'Python - Basic to Advance',
    description: 'Learn Python fundamentals, syntax, and basic programming concepts',
    duration: '10 Weeks',
    students: '50,000+',
    successRate: '97%',
    rating: generateRandomRating(),
    price: 999,
    level: 'Beginner to Advance',
    image: 'https://miro.medium.com/v2/resize:fit:1200/1*9PxpGrdJ5e-8uhb7hlvKGA.png',
    syllabus: [
      'Python Syntax',
      'Variables and Data Types',
      'Control Structures',
      'Functions'
    ],
    features: [
      'Interactive Coding Exercises',
      'Real-world Projects',
      'Quizzes and Assessments',
      'Certificate of Completion'
    ],
    overview: `<p style="margin-bottom: 20px;">This comprehensive course is designed to take students on a structured journey through the world of Python programming — from foundational concepts to advanced techniques. Whether you are new to coding or looking to sharpen your skills, this course provides a deep and practical understanding of Python, one of the most versatile and widely-used programming languages today.</p>

  <h3 style="margin-bottom: 10px;">What You'll Learn</h3>
  <ul>
    <li>• Understand how relational databases work</li>
    <li>• Write efficient SQL queries to retrieve data</li>
    <li>• Master INSERT, UPDATE, DELETE operations</li>
    <li style="margin-bottom: 10px;">• Join tables to combine data from multiple sources</li>
  </ul>

  <h3 style="margin-bottom: 10px;">Course Structure</h3>
  <p style="margin-bottom: 10px;">The course is divided into 4 modules, each focusing on key aspects of SQL. Each module contains video lectures, hands-on exercises, and quizzes to test your understanding.</p>

  <h3 style="margin-bottom: 10px;">Who Should Take This Course</h3>
  <p>Aspiring data analysts, backend developers, or anyone who needs to work with databases will benefit from this course. No prior database experience is required.</p>`,
    testIds: [
      'test-python-basics',
      'test-python-functions',
      'test-python-advanced'
    ],
  },
  {
    id: '6853c42000193d512282',
    title: 'Advanced Python',
    description: 'Master advanced Python concepts, OOP, and design patterns',
    duration: '10 Weeks',
    students: '22,500+',
    successRate: '90%',
    rating: generateRandomRating(),
    price: 999,
    level: 'Intermediate',
    image: 'https://miro.medium.com/v2/resize:fit:1200/1*9PxpGrdJ5e-8uhb7hlvKGA.png',
    syllabus: [
      'Object-Oriented Programming',
      'Decorators',
      'Generators',
      'Design Patterns'
    ],
    features: [
      'Advanced Projects',
      'Performance Optimization',
      'Testing Frameworks',
      'Professional Certification'
    ],
    videoLectures: [
      {
        id: 'python-oop',
        title: 'Object-Oriented Python',
        youtubeId: '2SPkPZ0Zrn8',
        description: 'Mastering classes and objects in Python',
        duration: '32:45'
      },
      {
        id: 'python-decorators',
        title: 'Python Decorators',
        youtubeId: 'k9TUPpGqYTo',
        description: 'Understanding and creating Python decorators',
        duration: '28:20'
      }
    ]
  }
];

export const sscCourses: Course[] = [
  {
    id: '6853c42000325f41481b',
    title: 'SSC CGL',
    description: 'Comprehensive preparation for Combined Graduate Level Examination',
    duration: '6 months',
    students: '40,000+',
    successRate: '90%',
    rating: generateRandomRating(),
    price: 1999,
    level: 'Graduate Level',
    image: logo,
    syllabus: [
      'Quantitative Aptitude',
      'English Language',
      'General Awareness',
      'Logical Reasoning'
    ],
    features: [
      '100+ Hours of Video Lectures',
      '5000+ Practice Questions',
      '50 Full-length Mock Tests',
      'Previous Year Papers'
    ],
    videoLectures: [
      {
        id: 'quant-intro',
        title: 'Quantitative Aptitude Introduction',
        youtubeId: 'dQw4w9WgXcQ',
        description: 'Learn the basics of quantitative aptitude',
        duration: '25:30'
      },
      {
        id: 'english-basics',
        title: 'English Language Basics',
        youtubeId: 'k9TUPpGqYTo',
        description: 'Fundamentals of English grammar',
        duration: '32:15'
      },
      {
        id: 'reasoning-start',
        title: 'Logical Reasoning Start',
        youtubeId: '9Os0o3wzS_I',
        description: 'Introduction to logical reasoning concepts',
        duration: '18:45'
      }
    ]
  },
  {
    id: '6853c42000325f41481c',
    title: 'SSC CPO',
    description: 'Complete preparation for Sub-Inspector exams in Delhi Police, BSF, CISF, CRPF, ITBP & SSB',
    duration: '6 months',
    rating: generateRandomRating(),
    price: 1999,
    students: '10,000+',
    successRate: '90%',
    level: 'Graduate Level',
    image: logo, // Replace with actual image URL
    syllabus: [
      'General Intelligence & Reasoning',
      'General Knowledge & Awareness',
      'Quantitative Aptitude',
      'English Comprehension',
      'Physical Endurance & Measurement Tests (PEMT)'
    ],
    features: [
      '120+ Hours of Video Lectures',
      'Practice Sets with Solutions',
      'Physical Test Guidance',
      'Previous Year Papers'
    ],
    videoLectures: [
      {
        id: 'cpo-reasoning',
        title: 'Reasoning for SSC CPO',
        youtubeId: 'xRQyfwLr2ZY',
        description: 'Detailed reasoning techniques and tricks',
        duration: '28:10'
      },
      {
        id: 'cpo-quant',
        title: 'Quantitative Aptitude Basics',
        youtubeId: 'ySdJtImcA44',
        description: 'Foundations of quantitative aptitude',
        duration: '33:05'
      }
    ]
  },
  {
    id: '6853c42000325f41481d',
    title: 'SSC JE',
    description: 'In-depth technical preparation for Junior Engineer posts in Civil, Mechanical, and Electrical domains',
    duration: '5 months',
    rating: generateRandomRating(),
    price: 1999,
    students: '8,000+',
    successRate: '88%',
    level: 'Engineering Diploma/Degree Level',
    image: logo,
    syllabus: [
      'General Intelligence & Reasoning',
      'General Awareness',
      'Engineering (Civil/Mechanical/Electrical)'
    ],
    features: [
      'Subject-wise Technical Lectures',
      'Mock Technical Papers',
      '5000+ Practice Questions',
      'Solved PYQs (10 Years)'
    ],
    videoLectures: [
      {
        id: 'je-civil',
        title: 'Basics of Civil Engineering',
        youtubeId: 'sRb9i4y6WeI',
        description: 'Overview of civil engineering concepts',
        duration: '30:00'
      },
      {
        id: 'je-elec',
        title: 'Electrical Fundamentals',
        youtubeId: '8lGzBwDFi3E',
        description: 'Introductory session on electrical engineering',
        duration: '27:15'
      }
    ]
  },
  {
    id: '6853c42000325f41481e',
    title: 'SSC Stenographer Grade C & D',
    description: 'Complete preparation for stenographer roles in central ministries and departments',
    duration: '4 months',
    rating: generateRandomRating(),
    price: 1999,
    students: '6,500+',
    successRate: '87%',
    level: '12th Pass',
    image: logo,
    syllabus: [
      'General Intelligence & Reasoning',
      'General Awareness',
      'English Language & Comprehension',
      'Stenography Skill Test'
    ],
    features: [
      'Typing & Dictation Practice',
      'Speed Building Exercises',
      'Mock Skill Tests',
      'PDF Notes & PYQs'
    ],
    videoLectures: [
      {
        id: 'steno-eng',
        title: 'English Comprehension Basics',
        youtubeId: 'k9TUPpGqYTo',
        description: 'Learn the fundamentals of English for SSC Steno',
        duration: '20:40'
      },
      {
        id: 'steno-typing',
        title: 'Stenography Tips',
        youtubeId: 'LOdZxaZ1fUI',
        description: 'Speed improvement techniques for stenography',
        duration: '15:22'
      }
    ]
  },
  {
    id: '6853c42000325f41481f',
    title: 'SSC Selection Post (Phase-XII)',
    description: 'Preparation for various ministry and department posts under Selection Post exams',
    duration: '3–6 months',
    rating: generateRandomRating(),
    price: 1999,
    students: '9,000+',
    successRate: '89%',
    level: '10th/12th/Graduate (as per post)',
    image: logo,
    syllabus: [
      'General Intelligence',
      'General Awareness',
      'Quantitative Aptitude',
      'English Language'
    ],
    features: [
      'Post-wise Exam Guidance',
      '100+ Practice Sets',
      'Mock Tests with Ranking',
      'Job Alert Updates'
    ],
    videoLectures: [
      {
        id: 'selpost-qa',
        title: 'Quantitative Aptitude',
        youtubeId: 'VRwY2UB8Jh0',
        description: 'Solve aptitude problems easily',
        duration: '22:00'
      },
      {
        id: 'selpost-ga',
        title: 'General Awareness for SSC',
        youtubeId: 'IqglGdOWsDg',
        description: 'Important GK topics covered',
        duration: '18:30'
      }
    ]
  },
  {
    id: '6853c42000325f414820',
    title: 'SSC JHT (Junior Hindi Translator)',
    description: 'Preparation for Translator and Hindi Officer roles in government offices',
    duration: '4 months',
    rating: generateRandomRating(),
    price: 1999,
    students: '4,000+',
    successRate: '85%',
    level: 'Post-Graduate in Hindi/English',
    image: logo,
    syllabus: [
      'General Hindi',
      'General English',
      'Translation & Essay Writing'
    ],
    features: [
      'Hindi & English Grammar Mastery',
      'Translation Practice Sets',
      'Model Essays',
      'Descriptive Paper Guidance'
    ],
    videoLectures: [
      {
        id: 'jht-hindi',
        title: 'General Hindi Concepts',
        youtubeId: 'A2k8Z6t6dIU',
        description: 'Grammar and usage for Hindi section',
        duration: '24:18'
      },
      {
        id: 'jht-english',
        title: 'General English for JHT',
        youtubeId: 'sZzGppHrTrg',
        description: 'English usage and translation strategies',
        duration: '19:55'
      }
    ]
  },
  {
    id: '6853c42000325f414821',
    title: 'Departmental Promotion Exams (LDC to UDC etc.)',
    description: 'Focused preparation for internal promotion exams conducted by departments',
    duration: '2–3 months',
    rating: generateRandomRating(),
    price: 1999,
    students: '2,000+',
    successRate: '91%',
    level: 'Government Employees',
    image: logo,
    syllabus: [
      'Service Rules & Regulations',
      'Office Procedures',
      'Noting & Drafting',
      'Basic Arithmetic & General Knowledge'
    ],
    features: [
      'Department-specific Material',
      'Short Notes',
      'Mock Tests',
      'Office Writing Practice'
    ],
    videoLectures: [
      {
        id: 'dept-rules',
        title: 'Understanding Service Rules',
        youtubeId: 'wB2m4c5mI0I',
        description: 'Get familiar with departmental rules and conduct',
        duration: '21:45'
      },
      {
        id: 'dept-drafting',
        title: 'Basics of Noting & Drafting',
        youtubeId: 'fhEBGJe0VP4',
        description: 'Office communication and documentation tips',
        duration: '17:30'
      }
    ]
  },
  {
    id: '6853c421000bcbde1bf6',
    title: 'SSC CHSL',
    description: 'Complete course for Combined Higher Secondary Level Examination',
    duration: '4 months',
    students: '12,000+',
    rating: generateRandomRating(),
    price: 1999,
    successRate: '90%',
    level: '12th Pass',
    image: logo,
    syllabus: [
      'Quantitative Aptitude',
      'English Language',
      'General Awareness',
      'Logical Reasoning'
    ],
    features: [
      '80+ Hours of Video Lectures',
      '4000+ Practice Questions',
      '40 Full-length Mock Tests',
      'Previous Year Papers'
    ],
    videoLectures: [
      {
        id: 'chsl-quant',
        title: 'CHSL Quantitative Aptitude',
        youtubeId: '2SPkPZ0Zrn8',
        description: 'Quantitative aptitude for CHSL exam',
        duration: '28:20'
      },
      {
        id: 'chsl-english',
        title: 'CHSL English Preparation',
        youtubeId: 'k9TUPpGqYTo',
        description: 'English language skills for CHSL',
        duration: '35:10'
      }
    ]
  },
  {
    id: '6853c4210020a673354f',
    title: 'SSC MTS',
    description: 'Complete course for Multi-Tasking Staff Examination',
    duration: '4 months',
    students: '12,000+',
    rating: generateRandomRating(),
    price: 1999,
    successRate: '90%',
    level: '12th Pass',
    image: logo,
    syllabus: [
      'Numerical Ability',
      'English Language',
      'General Awareness',
      'Reasoning Ability'
    ],
    features: [
      '60+ Hours of Video Lectures',
      '3000+ Practice Questions',
      '30 Full-length Mock Tests',
      'Previous Year Papers'
    ],
    videoLectures: [
      {
        id: 'mts-numerical',
        title: 'MTS Numerical Ability',
        youtubeId: '9Os0o3wzS_I',
        description: 'Numerical skills for MTS exam',
        duration: '22:45'
      },
      {
        id: 'mts-reasoning',
        title: 'MTS Reasoning Ability',
        youtubeId: 'dQw4w9WgXcQ',
        description: 'Reasoning skills for MTS exam',
        duration: '25:30'
      }
    ]
  },
  {
    id: '6853c4210033b51e65dc',
    title: 'SSC GD Constable',
    description: 'Complete course for General Duty Constable Examination',
    duration: '4 months',
    students: '12,000+',
    rating: generateRandomRating(),
    price: 1999,
    successRate: '90%',
    level: '12th Pass',
    image: logo,
    syllabus: [
      'General Intelligence',
      'General Knowledge',
      'Elementary Mathematics',
      'English/Hindi'
    ],
    features: [
      '70+ Hours of Video Lectures',
      '3500+ Practice Questions',
      '35 Full-length Mock Tests',
      'Physical Efficiency Tips'
    ],
    videoLectures: [
      {
        id: 'gd-intelligence',
        title: 'GD General Intelligence',
        youtubeId: '2SPkPZ0Zrn8',
        description: 'Intelligence test preparation',
        duration: '30:15'
      },
      {
        id: 'gd-mathematics',
        title: 'GD Elementary Mathematics',
        youtubeId: 'k9TUPpGqYTo',
        description: 'Math skills for GD exam',
        duration: '28:45'
      }
    ]
  }
];

export const bankingCourses: Course[] = [
  {
    id: 'ibps-po',
    title: 'IBPS PO',
    description: 'Complete preparation for IBPS Probationary Officer exam',
    duration: '5 months',
    students: '35,000+',
    successRate: '93%',
    rating: generateRandomRating(),
    price: 4999,
    level: 'Graduate Level',
    image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80',
    syllabus: [
      'Quantitative Aptitude',
      'English Language',
      'Reasoning Ability',
      'Computer Awareness',
      'Banking Awareness'
    ],
    features: [
      '120+ Hours of Video Lectures',
      '6000+ Practice Questions',
      '60 Full-length Mock Tests',
      'Current Affairs Updates'
    ],
    videoLectures: [
      {
        id: 'banking-intro',
        title: 'Banking Awareness Introduction',
        youtubeId: '2SPkPZ0Zrn8',
        description: 'Learn the basics of banking concepts',
        duration: '20:10'
      },
      {
        id: 'math-basics',
        title: 'Quantitative Aptitude Basics',
        youtubeId: 'k9TUPpGqYTo',
        description: 'Fundamentals of banking math',
        duration: '35:20'
      },
      {
        id: 'reasoning-skills',
        title: 'Banking Reasoning Skills',
        youtubeId: '9Os0o3wzS_I',
        description: 'Logical reasoning for banking exams',
        duration: '28:45'
      }
    ]
  },
  {
    id: 'ibps-rrb',
    title: 'IBPS RRB',
    description: 'Complete preparation for Regional Rural Banks Examination',
    duration: '6 months',
    rating: generateRandomRating(),
    price: 2399,
    students: '25,000+',
    successRate: '89%',
    level: 'Graduate Level',
    image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80',
    syllabus: [
      'Quantitative Aptitude',
      'English/Hindi Language',
      'Reasoning Ability',
      'Computer Knowledge',
      'Financial Awareness'
    ],
    features: [
      '110+ Hours of Video Lectures',
      '5500+ Practice Questions',
      '55 Full-length Mock Tests',
      'Regional Language Support'
    ],
    videoLectures: [
      {
        id: 'rrb-quant',
        title: 'RRB Quantitative Aptitude',
        youtubeId: 'dQw4w9WgXcQ',
        description: 'Math skills for RRB exams',
        duration: '32:15'
      },
      {
        id: 'rrb-reasoning',
        title: 'RRB Reasoning Ability',
        youtubeId: '2SPkPZ0Zrn8',
        description: 'Logical reasoning for RRB',
        duration: '28:30'
      }
    ]
  },
  {
    id: '6853c42200356491ca97',
    title: 'SBI PO',
    description: 'Complete preparation for State Bank Probationary Officer Exam',
    duration: '6 months',
    rating: generateRandomRating(),
    price: 2399,
    students: '25,000+',
    successRate: '89%',
    level: 'Graduate Level',
    image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80',
    syllabus: [
      'Data Interpretation',
      'English Language',
      'Logical Reasoning',
      'General Awareness',
      'Computer Aptitude'
    ],
    features: [
      '130+ Hours of Video Lectures',
      '6500+ Practice Questions',
      '65 Full-length Mock Tests',
      'Group Discussion Preparation'
    ],
    videoLectures: [
      {
        id: 'sbi-di',
        title: 'SBI Data Interpretation',
        youtubeId: 'k9TUPpGqYTo',
        description: 'Mastering DI for SBI PO',
        duration: '38:20'
      },
      {
        id: 'sbi-interview',
        title: 'SBI Interview Preparation',
        youtubeId: '9Os0o3wzS_I',
        description: 'Tips for SBI PO interview',
        duration: '42:15'
      }
    ]
  }
];

// DSA Courses
export const machineLearningCourses: Course[] = [
  {
    id: 'ml-fundamentals',
    title: 'Machine Learning Fundamentals',
    description: 'Learn the basics of machine learning and AI with hands-on projects',
    duration: '3 months',
    students: '15,000+',
    successRate: '88%',
    rating: generateRandomRating(),
    price: 1999,
    level: 'Intermediate',
    image: 'https://images.unsplash.com/photo-1504639725590-34d0984388bd?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80',
    syllabus: [
      'Introduction to ML',
      'Supervised Learning',
      'Unsupervised Learning',
      'Neural Networks',
      'Deep Learning Basics'
    ],
    features: [
      '80+ Hours of Video Lectures',
      '20+ Hands-on Projects',
      'Real-world Case Studies',
      'Doubt Support',
      'Certificate of Completion'
    ],
    videoLectures: [
      {
        id: 'ml-intro',
        title: 'Introduction to Machine Learning',
        youtubeId: 'dQw4w9WgXcQ',
        description: 'Learn the basics of machine learning',
        duration: '25:30'
      },
      {
        id: 'ml-algorithms',
        title: 'ML Algorithms Overview',
        youtubeId: 'k9TUPpGqYTo',
        description: 'Overview of different ML algorithms',
        duration: '32:15'
      }
    ]
  }
];

export const dsaCourses: Course[] = [
  {
    id: '6853c4210020a6733550',
    title: 'DSA',
    description: 'Master Data Structures and Algorithms with our comprehensive course',
    duration: '3-6 months',
    students: '500+',
    successRate: '95%',
    rating: generateRandomRating(),
    level: 'Beginner to Advanced',
    image: 'https://learnerbits.com/wp-content/uploads/2023/06/dsa.png',
    price: 2499,
    originalPrice: 9999,
    syllabus: [
      'Arrays and Strings',
      'Linked Lists',
      'Stacks and Queues',
      'Trees and Graphs',
      'Sorting and Searching',
      'Dynamic Programming',
      'Greedy Algorithms',
      'Graph Algorithms',
      'Complexity Analysis'
    ],
    features: [
      '200+ Practice Problems',
      '50+ Coding Exercises',
      'Mock Interviews',
      'Doubt Support',
      'Certificate of Completion'
    ],
    overview: 'This comprehensive DSA course covers all the essential data structures and algorithms you need to ace technical interviews and become a proficient problem solver. The course includes hands-on coding exercises, real-world problem-solving, and interview preparation.',
    testIds: [
      'test-dsa-arrays',
      'test-dsa-linked-lists',
      'test-dsa-trees'
    ]
  }
];

// AI Courses
export const aiCourses: Course[] = [
  {
    id: '6853c4210020a6733551',
    title: 'AI',
    description: 'Master Artificial Intelligence concepts and applications with hands-on projects and real-world case studies',
    duration: '6 months',
    students: '8,500+',
    successRate: '92%',
    rating: generateRandomRating(),
    level: 'Intermediate to Advanced',
    image: 'https://skillfloor.com/uploads/thumbnails/course_thumbnails/optimized/course_thumbnail_default-new_21735025395.jpg',
    price: 2999,
    originalPrice: 9999,
    syllabus: [
      'Introduction to AI and ML',
      'Neural Networks and Deep Learning',
      'Natural Language Processing',
      'Computer Vision',
      'Reinforcement Learning',
      'AI Ethics and Responsible AI',
      'AI in Industry Applications',
      'Capstone Project'
    ],
    features: [
      '100+ Hours of Video Content',
      '15+ Real-world Projects',
      'Mentor Support',
      'Interview Preparation',
      'Certificate of Completion'
    ],
    videoLectures: [
      {
        id: 'ai-intro',
        title: 'Introduction to AI',
        youtubeId: 'WSKi8HfcxEk',
        description: 'Understanding the basics of Artificial Intelligence',
        duration: '28:45'
      },
      {
        id: 'ai-neural-networks',
        title: 'Neural Networks Explained',
        youtubeId: 'aircAruvnKk',
        description: 'Deep dive into neural networks',
        duration: '35:20'
      }
    ],
    overview: 'This comprehensive AI course covers everything from fundamental concepts to advanced applications. You\'ll learn through hands-on projects and real-world case studies, preparing you for a career in AI.',
    testIds: [
      'test-ai-basics',
      'test-neural-networks',
      'test-nlp'
    ]
  }
];
// Web Development Courses
export const webDevelopmentCourses: Course[] = [
  {
    id: '687102bf0025ee179cb1',
    title: 'Full Web Development Course 0-100',
    description: 'Become a full-stack web developer with this comprehensive course covering frontend, backend, and everything in between',
    duration: '8 months',
    students: '15,000+',
    successRate: '94%',
    rating: generateRandomRating(),
    level: 'Beginner to Advanced',
    image: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80',
    price: 2499,
    originalPrice: 12999,
    syllabus: [
      'HTML5 & CSS3 Fundamentals',
      'JavaScript & ES6+',
      'React.js & Redux',
      'Node.js & Express',
      'MongoDB & Databases',
      'RESTful APIs',
      'Authentication & Security',
      'Deployment & DevOps',
      'Final Project'
    ],
    features: [
      '150+ Hours of Video Content',
      '25+ Real-world Projects',
      'Code Reviews',
      'Career Guidance',
      'Portfolio Building',
      'Certificate of Completion'
    ],
    videoLectures: [
      {
        id: 'webdev-html-css',
        title: 'HTML & CSS Crash Course',
        youtubeId: 'hu-q2zYwEYE',
        description: 'Learn the basics of web development',
        duration: '45:15'
      },
      {
        id: 'webdev-javascript',
        title: 'JavaScript Fundamentals',
        youtubeId: 'PkZNo7MFNFg',
        description: 'Master JavaScript from scratch',
        duration: '52:30'
      }
    ],
    overview: 'This is the most comprehensive web development course you\'ll find. Go from zero to job-ready as you learn to build modern, responsive websites and web applications using the latest technologies and best practices in the industry.',
    testIds: [
      'test-html-css',
      'test-javascript',
      'test-react',
      'test-nodejs'
    ]
  }
];

// Combine all course arrays into categories
export const allCourses: CourseCategory[] = [
  {
    category: 'SSC',
    courses: sscCourses
  },
  {
    category: 'Aptitude',
    courses: aptitudeCourses
  },
  {
    category: 'SQL',
    courses: sqlCourses
  },
  {
    category: 'Python',
    courses: pythonCourses
  },
  {
    category: 'Banking',
    courses: bankingCourses
  },
  {
    category: 'DSA',
    courses: dsaCourses
  },
  {
    category: 'Artificial Intelligence',
    courses: aiCourses
  },
  {
    category: 'Web Development',
    courses: webDevelopmentCourses
  }
];