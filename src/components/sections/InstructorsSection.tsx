import { motion } from 'framer-motion';
import ProfileCard from '../ui/ProfileCard';

// Instructor data
const instructors = [
  {
    id: 1,
    name: "PARAM BHATTAL",
    role: "AI & Machine Learning",
    bio: "Former lead researcher at DeepMind with over 15 years experience in neural networks and deep learning.",
    image: "https://i.postimg.cc/4ynr6w03/2b8c2309-f6f9-4c05-8f33-b2398a3d29b4.jpg",
    social: {
      twitter: "https://twitter.com",
      linkedin: "https://linkedin.com",
      website: "https://example.com",
    },
  },
  {
    id: 2,
    name: "Sarah Chen, PhD",
    role: "Data Science & Analytics",
    bio: "Data scientist with experience at Google and Stanford. Author of 'Practical Data Analysis' and industry consultant.",
    image: "https://images.pexels.com/photos/3763188/pexels-photo-3763188.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    social: {
      twitter: "https://twitter.com",
      linkedin: "https://linkedin.com",
      website: "https://example.com",
    },
  },
  {
    id: 3,
    name: "Michael Rodriguez",
    role: "Web Development & Design",
    bio: "Full-stack developer and UX specialist with 10+ years building web applications for startups and enterprises.",
    image: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    social: {
      twitter: "https://twitter.com",
      linkedin: "https://linkedin.com",
      website: "https://example.com",
    },
  },
  {
    id: 4,
    name: "Dr. Emma Wilson",
    role: "Blockchain & Cryptocurrency",
    bio: "Blockchain researcher and technical advisor to multiple crypto projects. PhD in Cryptography from MIT.",
    image: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    social: {
      twitter: "https://twitter.com",
      linkedin: "https://linkedin.com",
      website: "https://example.com",
    },
  },
];

const InstructorsSection = () => {
  return (
    <section className="py-20 bg-dark-900 overflow-hidden">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Meet Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-secondary-500">Instructors</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            Learn from industry experts with years of hands-on experience in their fields.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {instructors.map((instructor, index) => (
            <ProfileCard
              key={instructor.id}
              name={instructor.name}
              role={instructor.role}
              bio={instructor.bio}
              image={instructor.image}
              social={instructor.social}
              index={index}
              enableTilt={true}
            />
          ))}
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-16 text-center"
        >
          <p className="text-gray-400 mb-6">
            We're always looking for talented instructors to join our platform.
          </p>
          <a 
            href="/become-instructor" 
            className="inline-block px-8 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white hover:opacity-90 rounded-lg font-medium transition-all transform hover:-translate-y-1"
          >
            Apply to Teach
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default InstructorsSection;