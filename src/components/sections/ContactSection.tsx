import React, { useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { MapPin, Phone, Mail, Send, Loader2, Check, AlertTriangle } from 'lucide-react';
import emailjs from '@emailjs/browser';

interface FormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const ContactSection: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.2 });
  
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
    <section 
      id="contact"
      ref={sectionRef}
      className="py-20 md:py-24 relative"
    >
      <div className="container mx-auto px-4 relative">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6 }}
            className="section-title"
          >
            Get In <span className="gradient-text">Touch</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="section-subtitle"
          >
            Have questions or need more information? Reach out to our team.
          </motion.p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Info */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            <h3 className="text-2xl font-bold mb-6">Contact Information</h3>
            
            <div className="flex items-start space-x-4">
              <div className="bg-primary-500/10 p-3 rounded-full">
                <MapPin className="h-6 w-6 text-primary-500" />
              </div>
              <div>
                <h4 className="font-bold text-lg">Visit Us</h4>
                <p className="text-dark-500 dark:text-dark-300">
                Uni tech Cyber Park<br />
                Sector - 39<br />
                Gurugram, Haryana - 122002
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="bg-primary-500/10 p-3 rounded-full">
                <Phone className="h-6 w-6 text-primary-500" />
              </div>
              <div>
                <h4 className="font-bold text-lg">Call Us</h4>
                <p className="text-dark-500 dark:text-dark-300">
                  +91 9760010407<br />
                  Mon-SUN, 9am-6pm EST
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="bg-primary-500/10 p-3 rounded-full">
                <Mail className="h-6 w-6 text-primary-500" />
              </div>
              <div>
                <h4 className="font-bold text-lg">Email Us</h4>
                <p className="text-dark-500 dark:text-dark-300">
                  hr@datatechalpha.com<br />
                </p>
              </div>
            </div>
            
            <div className="pt-6">
              <h4 className="font-bold text-lg mb-4">Connect With Us</h4>
              <div className="flex space-x-4">
                <a href="#" className="bg-dark-100 dark:bg-dark-700 hover:bg-primary-500 text-dark-700 hover:text-white dark:text-white p-3 rounded-full transition-colors">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.48 0H5.52A5.52 5.52 0 0 0 0 5.52v12.96A5.52 5.52 0 0 0 5.52 24h12.96A5.52 5.52 0 0 0 24 18.48V5.52A5.52 5.52 0 0 0 18.48 0zM7.2 19.2H4.8v-9.6h2.4v9.6zM6 8.04A1.44 1.44 0 1 1 7.44 6.6 1.44 1.44 0 0 1 6 8.04zm13.2 11.16h-2.4v-4.8c0-.6-.48-1.2-1.08-1.2s-1.32.6-1.32 1.2v4.8h-2.4v-9.6h2.4v.96c.48-.72 1.56-1.08 2.4-1.08 1.68 0 2.4 1.2 2.4 3.12v6.6z" />
                  </svg>
                </a>
                <a href="#" className="bg-dark-100 dark:bg-dark-700 hover:bg-primary-500 text-dark-700 hover:text-white dark:text-white p-3 rounded-full transition-colors">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723 10.1 10.1 0 01-3.126 1.195 4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.937 4.937 0 004.604 3.417 9.868 9.868 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.054 0 13.999-7.496 13.999-13.986 0-.209 0-.42-.015-.63a9.936 9.936 0 002.46-2.548l-.047-.02z"/>
                  </svg>
                </a>
                <a href="#" className="bg-dark-100 dark:bg-dark-700 hover:bg-primary-500 text-dark-700 hover:text-white dark:text-white p-3 rounded-full transition-colors">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm7.995 15.593c-.235 2.497-1.845 4.11-4.47 4.357-2.412.23-4.715-.866-4.891-2.62-.169-1.69 1.037-2.397 1.856-2.487.92-.096 1.747.747 1.747 1.555 0 .725-.493 1.135-.975 1.135-.433 0-.723-.346-.723-.773 0-.3.19-.605.484-.726-.135-.389-.51-.843-1.205-.843-1.314 0-1.932 1.223-1.932 2.325 0 3.117 3.321 3.936 4.745 2.863.607-.46.812-1.321.536-2.286l-.317-1.004c-.243-.795-.93-1.45-1.821-1.45-.956 0-1.731.81-1.731 1.815 0 .982.736 1.776 1.689 1.776.936 0 1.73-.71 1.848-1.667l.069-.555h1.415l-.139.864c-.329 2.05-2.13 3.492-4.145 3.492-2.504 0-4.5-2.141-4.5-4.756 0-2.614 2.014-4.757 4.5-4.757 1.006 0 1.942.328 2.697.902V9.422c-.992-.578-2.128-.88-3.227-.88-3.82 0-6.928 3.16-6.928 7.027 0 3.869 3.108 7.027 6.928 7.027 4.994 0 8.072-4.123 8.072-9.603 0-5.476-2.55-9.98-8.072-9.98-5.526 0-10.02 4.493-10.02 10.02S6.474 22.02 12 22.02c5.523 0 10.016-4.486 10.016-10.002 0-.871-.112-1.738-.333-2.578h1.345c.163.65.25 1.345.25 2.06a9.94 9.94 0 01-1.283 4.947z"/>
                  </svg>
                </a>
                <a href="#" className="bg-dark-100 dark:bg-dark-700 hover:bg-primary-500 text-dark-700 hover:text-white dark:text-white p-3 rounded-full transition-colors">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm4.441 16.892c-2.102.144-6.784.144-8.883 0C5.282 16.736 5.017 15.622 5 12c.017-3.629.285-4.736 2.558-4.892 2.099-.144 6.782-.144 8.883 0C18.718 7.264 18.982 8.378 19 12c-.018 3.629-.285 4.736-2.559 4.892zM10 9.658l4.917 2.338L10 14.342V9.658z" />
                  </svg>
                </a>
              </div>
            </div>
          </motion.div>
          
          {/* Contact Form */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 30 }}
            transition={{ duration: 0.6 }}
          >
            <div className="glass-card p-8">
              <h3 className="text-2xl font-bold mb-6">Send Us a Message</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" htmlFor="name">
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 focus:outline-none focus:ring-2 focus:ring-primary-500 text-dark-800 dark:text-white"
                      placeholder="John Doe"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" htmlFor="email">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 focus:outline-none focus:ring-2 focus:ring-primary-500 text-dark-800 dark:text-white"
                      placeholder="johndoe@example.com"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="subject">
                    Subject
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 focus:outline-none focus:ring-2 focus:ring-primary-500 text-dark-800 dark:text-white"
                    placeholder="How can we help you?"
                    disabled={isSubmitting}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="message">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={5}
                    required
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 focus:outline-none focus:ring-2 focus:ring-primary-500 text-dark-800 dark:text-white"
                    placeholder="Your message here..."
                    disabled={isSubmitting}
                  ></textarea>
                </div>
                
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="btn btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      Send Message
                      <Send className="h-5 w-5" />
                    </>
                  )}
                </button>

                {submitStatus && (
                  <div className={`mt-4 p-3 rounded-md ${
                    submitStatus.success 
                      ? 'bg-green-50 text-green-800 dark:bg-green-900 dark:bg-opacity-30 dark:text-green-300' 
                      : 'bg-red-50 text-red-800 dark:bg-red-900 dark:bg-opacity-30 dark:text-red-300'
                  }`}>
                    <div className="flex items-center gap-2">
                      {submitStatus.success ? (
                        <Check className="h-5 w-5 flex-shrink-0" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                      )}
                      <p className="text-sm">{submitStatus.message}</p>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;