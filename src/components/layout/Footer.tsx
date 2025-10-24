import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Linkedin, Github, Mail, Phone, MapPin } from 'lucide-react';
import Logo from '../ui/Logo';
import { sscCourses, bankingCourses, pythonCourses, aptitudeCourses } from '../../pages/courseData';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  // Define the categories to match those shown on CoursesPage
  const courseCategories = [
    {
      name: 'SSC Courses',
      path: 'ssc',
      count: sscCourses.length
    },
    {
      name: 'Banking Courses',
      path: 'banking',
      count: bankingCourses.length
    },
    {
      name: 'Python Courses',
      path: 'python',
      count: pythonCourses.length
    },
    {
      name: 'Aptitude Courses',
      path: 'aptitude',
      count: aptitudeCourses.length
    }
  ];

  return (
    <footer className="bg-dark-800 dark:bg-dark-900 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="space-y-4">
            <Logo className="h-10 w-auto" />
            <p className="text-dark-200 max-w-xs">
              Learn Future, Live Future. Transforming education through cutting-edge technology and innovative learning experiences.
            </p>
            <div className="flex space-x-4">
              <a href="https://www.facebook.com/share/15i8PdurvL/" className="text-dark-300 hover:text-primary-400 transition-colors" aria-label="Facebook">
                <Facebook size={20} />
              </a>
              <a href="https://twitter.com" className="text-dark-300 hover:text-primary-400 transition-colors" aria-label="Twitter">
                <Twitter size={20} />
              </a>
              <a href="https://www.instagram.com/data_tech_alpha?igsh=YnRjNmdtaXc3aXc1" className="text-dark-300 hover:text-primary-400 transition-colors" aria-label="Instagram">
                <Instagram size={20} />
              </a>
              <a href="http://linkedin.com/in/data-tech-alpha-84a364319" className="text-dark-300 hover:text-primary-400 transition-colors" aria-label="LinkedIn">
                <Linkedin size={20} />
              </a>
              <a href="https://github.com" className="text-dark-300 hover:text-primary-400 transition-colors" aria-label="GitHub">
                <Github size={20} />
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-display text-xl font-bold mb-4">Explore</h3>
            <ul className="space-y-2">
              <li><Link to="/courses" className="text-dark-200 hover:text-primary-400 transition-colors">All Courses</Link></li>
              <li><Link to="/instructors" className="text-dark-200 hover:text-primary-400 transition-colors">Our Instructors</Link></li>
              <li><Link to="/about" className="text-dark-200 hover:text-primary-400 transition-colors">About Us</Link></li>
              <li><Link to="/blog" className="text-dark-200 hover:text-primary-400 transition-colors">Blog & Resources</Link></li>
              <li><Link to="/careers" className="text-dark-200 hover:text-primary-400 transition-colors">Careers</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-display text-xl font-bold mb-4">Categories</h3>
            <ul className="space-y-2">
              {courseCategories.map((category) => (
                <li key={category.path}>
                  <Link 
                    to={{
                      pathname: "/courses",
                      hash: `#${category.path}`
                    }}
                    className="text-dark-200 hover:text-primary-400 transition-colors flex justify-between"
                  >
                    <span>{category.name}</span>
                    <span className="text-dark-400">({category.count})</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-display text-xl font-bold mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <MapPin size={20} className="text-primary-400 mr-2 mt-1 flex-shrink-0" />
                <span className="text-dark-200">Uni tech Cyber Park, Sector - 39, Gurugram, Haryana - 122002</span>
              </li>
              <li className="flex items-center">
                <Phone size={20} className="text-primary-400 mr-2 flex-shrink-0" />
                <span className="text-dark-200">+91 9760010407</span>
              </li>
              <li className="flex items-center">
                <Mail size={20} className="text-primary-400 mr-2 flex-shrink-0" />
                <span className="text-dark-200">hr@datatechalpha.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-dark-700 mt-8 pt-8 flex flex-col md:flex-row md:justify-between items-center">
          <p className="text-dark-300 text-sm mb-4 md:mb-0">
            &copy; {currentYear} DATA-TECH. All rights reserved.
          </p>
          <div className="flex space-x-6">
            <Link to="/privacy" className="text-dark-300 text-sm hover:text-primary-400 transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="text-dark-300 text-sm hover:text-primary-400 transition-colors">Terms of Service</Link>
            <Link to="/cookies" className="text-dark-300 text-sm hover:text-primary-400 transition-colors">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;