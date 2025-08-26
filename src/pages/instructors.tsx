import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Mail, Linkedin, BookOpen, Award, BarChart2, Clock, Users, ChevronRight } from 'lucide-react';

const InstructorsPage: React.FC = () => {
  // Instructors data
  const instructors = [
    {
      id: 1,
      name: 'Yashi Saxena',
      role: 'CO Founder',
      bio: 'Founder of Data Tech Alpha, Yashi Saxena brings over a decade of excellence in mentoring aspirants for competitive exams. With 15+ years of hands-on teaching experience, she has empowered over 4,000 students to crack top-tier government exams like SSC and Banking. Known for her result-oriented approach and unmatched shortcut techniques, she continues to be a beacon of inspiration for students across India.',
      experience: ' 10+ years',
      students: '4,000+',
      courses: ['Aptitude', 'Reasoning for Amca', 'Placement Preparation for Companies'],
      rating: '4.9',
      email: 'rajesh.sharma@datatech.edu',
      linkedin: 'https://linkedin.com',
      achievements: [
        '100+ selections in SSC CGL 2023',
        'Author of "Quant Shortcuts Made Easy"',
        'Gold Medalist in Mathematics'
      ]
    },
    {
      id: 2,
      name: 'MOHD AHMAD',
      role: 'Founder',
      bio: 'With over a decade of experience in aptitude training and data science, Mohd Ahmad has trained thousands of students across leading universities and institutes. Known for his engaging teaching style and in-depth subject knowledge, he bridges the gap between traditional concepts and modern applications in data-driven careers.',
      experience: '10+ years',
      students: '3,500+',
      courses: ['Aptitude', 'Data Science', 'Python for Beginners', 'Placement Prep'],
      rating: '4.8',
      email: 'imranahmadyashi@gmail.com',
      linkedin: 'https://linkedin.com',
      achievements: [
        'Senior Aptitude Trainer at Chandigarh University',
        'Data Science Mentor at DataTech Alpha Pvt Ltd',
        'Former Faculty at Mahendra Education with 7+ years of service',
        'Trained 9,500+ students for competitive exams and placements',
        'Expert in smartboard-based interactive learning'
      ]
    },
    {
      id: 3,
      name: 'Param Bhattal',
      role: 'Full-Stack Developer',
      bio: 'Param Bhattal, Developer of DATA TECH website, a dynamic B.Tech student, has quickly risen as a promising full-stack developer. With a passion for building scalable web applications, Param has already delivered multiple live projects and mentors juniors in MERN stack development.',
      experience: '2+ years',
      students: 'B.Tech Year Student',
      techSkills: ['MERN Stack', 'Python (Flask/Django)', 'MongoDB & Firebase', 'React Native', 'TypeScript', 'REST APIs', 'Docker', 'Git/GitHub', 'Fullstack Developer'],
      rating: '4.97',
      email: 'parambhattall@gmail.com',
      linkedin: 'https://linkedin.com/in/param-bhattal',
      achievements: [
        'Built and deployed 10+ full-stack projects',
        'Led college tech team in 3 national-level hackathons',
        'Contributed to 5 open-source projects on GitHub',
        'Joint Secratory at HACK TECH Community'
      ]
    }
    ,
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen pt-24 pb-16 bg-gray-50 dark:bg-dark-900"
    >
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Learn From <span className="gradient-text">The Best</span> Educators
          </h1>
          <p className="text-xl text-dark-500 dark:text-dark-300 max-w-3xl mx-auto">
            Our instructors are subject matter experts with proven track records of success
          </p>
        </div>

        {/* Stats Bar - Updated numbers to reflect new instructor */}
        <div className="bg-white dark:bg-dark-800 rounded-xl shadow-sm p-6 mb-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-primary-600 dark:text-primary-400 mb-2">54,500+</div>
            <p className="text-dark-500 dark:text-dark-300">Students Trained</p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-primary-600 dark:text-primary-400 mb-2">1,300+</div>
            <p className="text-dark-500 dark:text-dark-300">Exam Selections</p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-primary-600 dark:text-primary-400 mb-2">92%</div>
            <p className="text-dark-500 dark:text-dark-300">Success Rate</p>
          </div>
        </div>

        {/* Instructors List */}
        <div className="space-y-12">
          {instructors.map((instructor) => (
            <motion.div 
              key={instructor.id}
              whileHover={{ scale: 1.01 }}
              className="bg-white dark:bg-dark-800 rounded-2xl shadow-md overflow-hidden"
            >
              <div className="flex flex-col md:flex-row">
                {/* Instructor Details */}
                <div className="w-full p-8">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <div className="flex items-center mb-2">
                        <div className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-3 py-1 rounded-full font-bold flex items-center mr-4">
                          <span className="mr-1">★</span> {instructor.rating}
                        </div>
                        <div className="text-dark-500 dark:text-dark-400 flex items-center">
                          <Users className="h-4 w-4 mr-1" /> {instructor.students}
                        </div>
                      </div>
                      <h4 className="text-xl font-semibold dark:text-white mb-2">About {instructor.name}</h4>
                      <p className="text-dark-600 dark:text-dark-300 mb-4">{instructor.bio}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Experience */}
                    <div className="bg-gray-50 dark:bg-dark-700 p-4 rounded-lg">
                      <div className="flex items-center mb-2">
                        <Clock className="h-5 w-5 text-primary-500 mr-2" />
                        <h5 className="font-medium dark:text-white">Experience</h5>
                      </div>
                      <p className="text-dark-500 dark:text-dark-300">{instructor.experience}</p>
                    </div>
                    
                    {/* Courses or Tech Skills */}
                    <div className="bg-gray-50 dark:bg-dark-700 p-4 rounded-lg">
                      <div className="flex items-center mb-2">
                        <BookOpen className="h-5 w-5 text-primary-500 mr-2" />
                        <h5 className="font-medium dark:text-white">
                          {instructor.techSkills ? 'Tech Skills' : 'Courses'}
                        </h5>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(instructor.techSkills || instructor.courses || []).map((item, index) => (
                          <span 
                            key={index}
                            className="bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 text-xs px-3 py-1 rounded-full"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    {/* Achievements */}
                    {instructor.achievements && (
                      <div className="md:col-span-2 bg-gray-50 dark:bg-dark-700 p-4 rounded-lg">
                        <div className="flex items-center mb-2">
                          <Award className="h-5 w-5 text-primary-500 mr-2" />
                          <h5 className="font-medium dark:text-white">Notable Achievements</h5>
                        </div>
                        <ul className="space-y-2">
                          {instructor.achievements.map((achievement, index) => (
                            <li key={index} className="flex items-start text-dark-500 dark:text-dark-300">
                              <ChevronRight className="h-4 w-4 text-primary-500 mt-1 mr-2 flex-shrink-0" />
                              <span>{achievement}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between border-t border-gray-200 dark:border-dark-700 pt-4">
                    <div className="flex space-x-4">
                      <a 
                        href={`mailto:${instructor.email}`}
                        className="text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 transition-colors"
                        aria-label="Email"
                      >
                        <Mail className="h-6 w-6" />
                      </a>
                      <a 
                        href={instructor.linkedin} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 transition-colors"
                        aria-label="LinkedIn"
                      >
                        <Linkedin className="h-6 w-6" />
                      </a>
                    </div>
                    <Link 
                      to={`/instructors/${instructor.id}`} 
                      className="btn-outline flex items-center"
                    >
                      Full Profile <ChevronRight className="h-4 w-4 ml-1" />
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="mt-16 text-center bg-gradient-to-r from-primary-500 to-primary-700 rounded-2xl p-12 text-white">
          <h2 className="text-3xl font-bold mb-4">Become Part of Our Teaching Team</h2>
          <p className="text-xl text-white/90 max-w-2xl mx-auto mb-8">
            We're looking for passionate educators to join our mission of transforming exam preparation
          </p>
          <Link
            to="/careers"
            className="btn-white px-8 py-4 text-lg font-bold inline-flex items-center"
          >
            Apply Now <ChevronRight className="h-5 w-5 ml-2" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default InstructorsPage;