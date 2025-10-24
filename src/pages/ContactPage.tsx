import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaEnvelope, FaPhone, FaMapMarkerAlt, FaPaperPlane, FaCheck, FaExclamationTriangle } from 'react-icons/fa';
import { useTheme } from '../contexts/ThemeContext';
import emailjs from '@emailjs/browser';

interface FormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const { theme } = useTheme();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const serviceId = 'service_qzdt2qj';
      const templateId = 'template_szgd6rb';
      const userId = 'LkNzzn6EtYJQaC210';

      console.log('Sending email with data:', {
        serviceId,
        templateId,
        userId,
        templateParams: {
          from_name: formData.name,
          from_email: formData.email,
          subject: formData.subject,
          message: formData.message,
          to_email: 'hr@datatechalpha.com',
          reply_to: formData.email
        }
      });

      // Initialize EmailJS with your user ID
      emailjs.init(userId);

      const response = await emailjs.send(
        serviceId,
        templateId,
        {
          from_name: formData.name,
          from_email: formData.email,
          subject: formData.subject,
          message: formData.message,
          to_email: 'hr@datatechalpha.com',
          reply_to: formData.email
        },
        userId
      );

      console.log('EmailJS response:', response);

      if (response.status !== 200) {
        throw new Error(`EmailJS returned status: ${response.status}`);
      }

      setSubmitStatus({
        success: true,
        message: 'Thank you for your message! We will get back to you soon.'
      });
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      console.error('Error sending email:', error);
      let errorMessage = 'Failed to send message. Please try again later.';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object' && 'text' in error) {
        try {
          const errorData = JSON.parse(error.text as string);
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          errorMessage = 'Invalid response from email service';
        }
      }
      
      setSubmitStatus({
        success: false,
        message: errorMessage
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen py-16 px-4 sm:px-6 lg:px-8 text-gray-900 dark:text-white">
      {/* Background with gradient and grid pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-dark-900 dark:to-dark-800 z-0" />
      
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 -z-10 opacity-30 dark:opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#4b5563_1px,transparent_1px)] [background-size:16px_16px]"></div>
      </div>
      
      {/* Animated gradient overlay */}
      <motion.div 
        className="absolute inset-0 -z-10 opacity-50 dark:opacity-30"
        initial={{ 
          background: 'linear-gradient(45deg, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.1))'
        }}
        animate={{
          background: [
            'linear-gradient(45deg, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.1))',
            'linear-gradient(135deg, rgba(168, 85, 247, 0.1), rgba(236, 72, 153, 0.1))',
            'linear-gradient(225deg, rgba(236, 72, 153, 0.1), rgba(245, 158, 11, 0.1))',
            'linear-gradient(315deg, rgba(245, 158, 11, 0.1), rgba(99, 102, 241, 0.1))'
          ]
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'linear'
        }}
      />
      
      {/* Animated Blobs */}
      <motion.div 
        className="absolute -top-48 -right-48 w-96 h-96 rounded-full bg-blue-200/40 dark:bg-blue-400/20 blur-3xl"
        animate={{
          x: [0, 30, 0],
          y: [0, -30, 0],
          scale: [1, 1.1, 1]
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      />
      
      <div className="relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-7xl mx-auto"
        >
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl font-bold sm:text-5xl lg:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-white">
            Get In Touch
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-xl text-blue-100">
            Have questions or need assistance? We're here to help. Drop us a message and our team will get back to you as soon as possible.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Contact Form */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="rounded-2xl bg-white/10 backdrop-blur-md p-8 border border-white/10 shadow-2xl hover:shadow-blue-900/30 transition-all duration-300"
          >
            <h2 className="text-2xl font-bold mb-8 text-white">Send us a Message</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className={`block text-sm font-medium ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="mt-2 block w-full bg-white/5 border border-white/20 rounded-lg py-3 px-4 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                />
              </div>

              <div>
                <label htmlFor="email" className={`block text-sm font-medium ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="mt-2 block w-full bg-white/5 border border-white/20 rounded-lg py-3 px-4 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                />
              </div>

              <div>
                <label htmlFor="subject" className={`block text-sm font-medium ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="mt-2 block w-full bg-white/5 border border-white/20 rounded-lg py-3 px-4 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                />
              </div>

              <div>
                <label htmlFor="message" className={`block text-sm font-medium ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  value={formData.message}
                  onChange={handleChange}
                  required
                  className="mt-2 block w-full bg-white/5 border border-white/20 rounded-lg py-3 px-4 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                ></textarea>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex justify-center items-center px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl text-lg font-semibold text-white hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 transition-all duration-300 transform hover:-translate-y-0.5 shadow-lg hover:shadow-xl hover:shadow-blue-500/20 disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending...
                    </>
                  ) : (
                    <>
                      <FaPaperPlane className="mr-2" />
                      Send Message
                    </>
                  )}
                </button>
                {submitStatus && (
                  <div className={`mt-4 p-4 rounded-xl ${
                    submitStatus.success 
                      ? 'bg-green-500/10 text-green-100 border border-green-400/20' 
                      : 'bg-red-500/10 text-red-100 border border-red-400/20'
                  }`}>
                    <div className="flex items-center">
                      {submitStatus.success ? (
                        <FaCheck className="h-5 w-5 text-green-300 mr-2" />
                      ) : (
                        <FaExclamationTriangle className="h-5 w-5 text-red-300 mr-2" />
                      )}
                      <p className="text-sm">{submitStatus.message}</p>
                    </div>
                  </div>
                )}
              </div>
            </form>
          </motion.div>

          {/* Contact Information */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="space-y-8"
          >
            <div className="rounded-2xl bg-white/10 backdrop-blur-md p-8 border border-white/10 shadow-2xl hover:shadow-blue-900/30 transition-all duration-300">
              <h2 className={`text-2xl font-bold mb-6 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>Contact Information</h2>
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0 rounded-xl p-3 bg-white/10 backdrop-blur-sm">
                    <FaEnvelope className="h-6 w-6 text-blue-300" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-white">Email</h3>
                    <p className="text-blue-100 hover:text-white transition-colors">hr@datatechalpha.com</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 rounded-xl p-3 bg-white/10 backdrop-blur-sm">
                    <FaPhone className="h-6 w-6 text-blue-300" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-white">Phone</h3>
                    <p className="text-blue-100 hover:text-white transition-colors">+91 9760010407</p>
                    <p className="text-blue-100/80 text-sm">Mon - Sun, 9:00 AM - 6:00 PM</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 rounded-xl p-3 bg-white/10 backdrop-blur-sm">
                    <FaMapMarkerAlt className="h-6 w-6 text-blue-300" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-white">Location</h3>
                    <p className="text-blue-100 hover:text-white transition-colors">Uni tech Cyber Park</p>
                    <p className="text-blue-100/80">Sector - 39</p>
                    <p className="text-blue-100/80">Gurugram, Haryana - 122002</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white/10 backdrop-blur-md p-8 border border-white/10 shadow-2xl hover:shadow-blue-900/30 transition-all duration-300">
              <h2 className="text-2xl font-bold mb-6 text-white">Find Us</h2>
              <div className="relative group overflow-hidden rounded-xl border-2 border-white/20 hover:border-blue-400 transition-all duration-300">
                <div className="relative aspect-video w-full">
                  {/* Interactive Google Maps iframe */}
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3431.234567890123!2d76.7176053!3d30.7048229!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x9e7e5a5a5e5a5a5e!2sData%20Tech%20Alpha!5e0!3m2!1sen!2sin!4v1234567890123!5m2!1sen!2sin"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="w-full h-full"
                    title="Data Tech Alpha Location"
                  ></iframe>
                  
                  {/* Click overlay that links to full Google Maps */}
                  <a 
                    href="https://maps.app.goo.gl/pY5wH81GPwr5wUbHA"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  >
                    <div className="bg-white/90 text-blue-700 px-6 py-3 rounded-full font-semibold flex items-center space-x-2 transform group-hover:scale-105 transition-transform duration-300">
                      <FaMapMarkerAlt className="text-red-500" />
                      <span>Open in Google Maps</span>
                    </div>
                  </a>
                  
                  {/* Watermark */}
                  <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                    Interactive Map
                  </div>
                </div>
              </div>
              <div className="mt-4 text-center">
                <p className="text-blue-100">Uni tech Cyber Park</p>
                <p className="text-blue-100">Sector - 39, Gurugram, Haryana - 122002</p>
              </div>
            </div>
          </motion.div>
        </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ContactPage;
