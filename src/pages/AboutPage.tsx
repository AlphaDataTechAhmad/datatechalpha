import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Rocket, GraduationCap, Users, Award, Newspaper } from 'lucide-react';

interface NewsArticle {
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  source: {
    name: string;
  };
}

const AboutPage: React.FC = () => {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch news data
  useEffect(() => {
    const fetchNews = async () => {
      try {
        // Using mock data - in production, replace with actual API call
        const mockNews = [
          {
            title: "India's Online Education Market to Reach $10 Billion by 2025",
            description: "The e-learning sector in India is experiencing unprecedented growth, with projections showing a market size of $10 billion by 2025, driven by increased internet penetration and smartphone usage.",
            url: "https://example.com/education-growth",
            publishedAt: "2023-05-15T10:00:00Z",
            source: { name: "Education Times" }
          },
          {
            title: "Government Launches 'Digital University' Initiative",
            description: "A new national digital university will provide access to quality education across India, with courses from top institutions available through a single online platform.",
            url: "https://example.com/digital-initiative",
            publishedAt: "2023-05-14T14:30:00Z",
            source: { name: "EdTech India" }
          },
          {
            title: "Record 2.5 Million Students Appear for Competitive Exams",
            description: "This year saw the highest number of applicants for government exams, with a 25% increase from last year, highlighting the growing demand for stable career options.",
            url: "https://example.com/competitive-exams",
            publishedAt: "2023-05-12T09:15:00Z",
            source: { name: "Exam Times" }
          },
          {
            title: "AI and Machine Learning Added to University Curriculums",
            description: "Top universities nationwide are incorporating cutting-edge technology courses to prepare students for the jobs of tomorrow.",
            url: "https://example.com/ai-courses",
            publishedAt: "2023-05-10T11:20:00Z",
            source: { name: "University Herald" }
          },
          {
            title: "Rural India Sees 400% Growth in Online Learning",
            description: "Affordable data plans and vernacular content are driving massive adoption of digital education platforms in rural areas.",
            url: "https://example.com/rural-edtech-growth",
            publishedAt: "2023-05-08T16:45:00Z",
            source: { name: "Rural Tech News" }
          }
        ];
        
        setNews(mockNews);
      } catch (err) {
        setError('Failed to fetch news. Please try again later.');
        console.error('Error fetching news:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen pt-24 pb-16 bg-gray-50 dark:bg-dark-900"
    >
      <div className="container mx-auto px-4">
        {/* Hero Section */}
        <div className="text-center mb-12 md:mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 md:mb-6 bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
            About <span className="gradient-text">Data-Tech</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Revolutionizing education through innovative learning experiences
          </p>
        </div>

        {/* Our Story */}
        <section className="mb-12 md:mb-16 bg-white dark:bg-dark-800 rounded-xl shadow-lg p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
            <div className="md:w-1/2 order-2 md:order-1">
              <h2 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6 flex items-center">
                <Rocket className="h-6 w-6 md:h-8 md:w-8 mr-3 text-primary-500" />
                <span>Our Story</span>
              </h2>
              <div className="space-y-4 text-gray-600 dark:text-gray-300">
                <p className="text-base md:text-lg">
                  Founded in 2022, Data-Tech began as a small initiative to help government job aspirants in India. 
                </p>
                <p className="text-base md:text-lg">
                  What started as weekend coaching classes has now transformed into one of India's leading e-learning platforms.
                </p>
                <p className="text-base md:text-lg">
                  Our founders, a group of former civil servants and educators, recognized the need for affordable, 
                  high-quality exam preparation that could reach every corner of the country.
                </p>
              </div>
            </div>
            <div className="md:w-1/2 order-1 md:order-2">
              <img 
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80" 
                alt="Students learning" 
                className="rounded-xl shadow-md w-full h-auto"
              />
            </div>
          </div>
        </section>

        {/* Mission & Values */}
        <section className="mb-12 md:mb-16 bg-gradient-to-r from-primary-500 to-primary-700 rounded-xl shadow-lg p-6 md:p-8 text-white">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">Our Mission & Values</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5">
              <div className="flex items-center mb-4">
                <GraduationCap className="h-6 w-6 md:h-7 md:w-7 mr-3" />
                <h3 className="text-xl font-bold">Accessible Education</h3>
              </div>
              <p className="text-base">
                We believe quality education should be available to everyone, regardless of location or financial status.
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5">
              <div className="flex items-center mb-4">
                <Users className="h-6 w-6 md:h-7 md:w-7 mr-3" />
                <h3 className="text-xl font-bold">Student-Centric Approach</h3>
              </div>
              <p className="text-base">
                Every decision we make is focused on maximizing student success and learning outcomes.
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5">
              <div className="flex items-center mb-4">
                <Award className="h-6 w-6 md:h-7 md:w-7 mr-3" />
                <h3 className="text-xl font-bold">Excellence in Teaching</h3>
              </div>
              <p className="text-base">
                We recruit only the finest educators and continuously improve our teaching methodologies.
              </p>
            </div>
          </div>
        </section>

        {/* Latest News Section */}
        <section className="mb-12 md:mb-16 bg-white dark:bg-dark-800 rounded-xl shadow-lg p-6 md:p-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center flex justify-center items-center">
            <Newspaper className="h-6 w-6 md:h-8 md:w-8 mr-3 text-primary-500" />
            <span>Education News Updates</span>
          </h2>
          
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500 text-lg">
              {error}
            </div>
          ) : (
            <div className="space-y-6">
              {news.map((article, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="group"
                >
                  <div className="border-l-4 border-primary-500 pl-4 hover:border-primary-400 transition-colors duration-300">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                        {article.source.name}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(article.publishedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-300">
                      {article.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-3">
                      {article.description}
                    </p>
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 transition-colors duration-300"
                    >
                      Read more
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </a>
                  </div>
                  {index !== news.length - 1 && (
                    <div className="border-t border-gray-200 dark:border-gray-700 mt-4"></div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* Our Impact */}
        <section className="bg-white dark:bg-dark-800 rounded-xl shadow-lg p-6 md:p-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">Our Impact</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl md:text-2xl font-bold mb-4 text-primary-600 dark:text-primary-400">By The Numbers</h3>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <span className="bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 px-3 py-1 rounded-full mr-3 text-sm font-medium">20k+</span>
                  <span className="text-gray-600 dark:text-gray-300 text-base">Students empowered</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 px-3 py-1 rounded-full mr-3 text-sm font-medium">50+</span>
                  <span className="text-gray-600 dark:text-gray-300 text-base">Courses offered</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 px-3 py-1 rounded-full mr-3 text-sm font-medium">92%</span>
                  <span className="text-gray-600 dark:text-gray-300 text-base">Success rate in 2023</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 px-3 py-1 rounded-full mr-3 text-sm font-medium">10+</span>
                  <span className="text-gray-600 dark:text-gray-300 text-base">Cities reached across India</span>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-xl md:text-2xl font-bold mb-4 text-primary-600 dark:text-primary-400">Student Success Stories</h3>
              <div className="bg-gray-50 dark:bg-dark-700 rounded-xl p-5">
                <p className="italic text-gray-600 dark:text-gray-300 mb-3 text-base">
                  "Data-Tech's comprehensive SSC CGL course helped me secure AIR 42 in my first attempt. The quality of teaching rivals any premium institute."
                </p>
                <p className="font-bold text-base">- Rohan Kumar, SSC CGL 2023 Ranker</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </motion.div>
  );
};

export default AboutPage;