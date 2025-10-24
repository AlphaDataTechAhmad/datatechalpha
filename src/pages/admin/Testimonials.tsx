import React, { useState, useEffect } from 'react';
import { databases, storage, DATABASE_ID, TESTIMONIALS_COLLECTION_ID, TESTIMONIALS_BUCKET_ID } from '../../appwriteConfig';
import { motion } from 'framer-motion';
import { Plus, Trash2, Edit, Star, X } from 'lucide-react';
import { toast } from 'react-toastify';

interface Testimonial {
  $id: string;
  name: string;
  company: string;
  type: string;
  package: string;
  year: string;
  district: string;
  state: string;
  rating: number;
  comment: string;
  photoId: string;
  $createdAt: string;
  $updatedAt: string;
}

const Testimonials = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] = useState<Partial<Testimonial> | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    type: 'Full-time',
    package: '',
    year: new Date().getFullYear().toString(),
    district: '',
    state: '',
    rating: 5,
    comment: '',
    photoId: ''
  });

  // Fetch testimonials
  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    try {
      const response = await databases.listDocuments(DATABASE_ID, TESTIMONIALS_COLLECTION_ID);
      setTestimonials(response.documents as unknown as Testimonial[]);
    } catch (error) {
      console.error('Error fetching testimonials:', error);
      toast.error('Failed to load testimonials');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      if (name === 'rating') {
        // Ensure rating is a number and within valid range (1-5)
        const ratingValue = Math.min(5, Math.max(1, parseInt(value, 10) || 1));
        return { ...prev, [name]: ratingValue };
      }
      return { ...prev, [name]: value };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (currentTestimonial?.$id) {
        // Update existing testimonial - ensure rating is a valid number between 1-5
        const ratingValue = Math.min(5, Math.max(1, Number(formData.rating) || 1));
        const testimonialData = {
          ...formData,
          rating: ratingValue
        };
        await databases.updateDocument(
          DATABASE_ID,
          TESTIMONIALS_COLLECTION_ID,
          currentTestimonial.$id,
          testimonialData
        );
        toast.success('Testimonial updated successfully');
      } else {
        // Create new testimonial - ensure rating is a valid number between 1-5
        const ratingValue = Math.min(5, Math.max(1, Number(formData.rating) || 1));
        const testimonialData = {
          ...formData,
          rating: ratingValue
        };
        await databases.createDocument(
          DATABASE_ID,
          TESTIMONIALS_COLLECTION_ID,
          'unique()',
          testimonialData
        );
        toast.success('Testimonial added successfully');
      }
      
      // Reset form and refresh list
      setFormData({
        name: '',
        company: '',
        type: 'Full-time',
        package: '',
        year: new Date().getFullYear().toString(),
        district: '',
        state: '',
        rating: 5,
        comment: '',
        photoId: ''
      });
      setCurrentTestimonial(null);
      setIsFormOpen(false);
      fetchTestimonials();
    } catch (error) {
      console.error('Error saving testimonial:', error);
      toast.error('Failed to save testimonial');
    }
  };

  const handleEdit = (testimonial: Testimonial) => {
    setCurrentTestimonial(testimonial);
    setFormData({
      name: testimonial.name,
      company: testimonial.company,
      type: testimonial.type,
      package: testimonial.package,
      year: testimonial.year,
      district: testimonial.district,
      state: testimonial.state,
      rating: testimonial.rating,
      comment: testimonial.comment,
      photoId: testimonial.photoId
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this testimonial?')) {
      try {
        await databases.deleteDocument(DATABASE_ID, TESTIMONIALS_COLLECTION_ID, id);
        toast.success('Testimonial deleted successfully');
        fetchTestimonials();
      } catch (error) {
        console.error('Error deleting testimonial:', error);
        toast.error('Failed to delete testimonial');
      }
    }
  };

  const renderStars = (rating: number) => {
    return Array(5).fill(0).map((_, i) => (
      <Star 
        key={i} 
        className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
      />
    ));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Testimonials</h1>
        <button
          onClick={() => {
            setCurrentTestimonial(null);
            setFormData({
              name: '',
              company: '',
              type: 'Full-time',
              package: '',
              year: new Date().getFullYear().toString(),
              district: '',
              state: '',
              rating: 5,
              comment: '',
              photoId: ''
            });
            setIsFormOpen(true);
          }}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Testimonial
        </button>
      </div>

      {/* Testimonials List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {testimonials.map((testimonial) => (
          <motion.div 
            key={testimonial.$id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-100 dark:border-gray-700"
          >
            <div className="p-6">
              <div className="flex items-center mb-4">
                <img 
                  src={testimonial.photoId 
                    ? storage.getFilePreview(TESTIMONIALS_BUCKET_ID, testimonial.photoId).toString() 
                    : `https://ui-avatars.com/api/?name=${encodeURIComponent(testimonial.name)}`}
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full object-cover mr-4"
                  onError={(e) => {
                    // Fallback to initials if image fails to load
                    const target = e.target as HTMLImageElement;
                    target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(testimonial.name)}`;
                  }}
                />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{testimonial.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{testimonial.company}</p>
                </div>
              </div>
              
              <div className="flex mb-3">
                {renderStars(testimonial.rating)}
              </div>
              
              <p className="text-gray-600 dark:text-gray-300 italic mb-4">{testimonial.comment}</p>
              
              <div className="flex flex-wrap gap-2 text-sm text-gray-500 dark:text-gray-400">
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">
                  {testimonial.type}
                </span>
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">
                  {testimonial.package}
                </span>
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">
                  {testimonial.district}, {testimonial.state}
                </span>
              </div>
              
              <div className="mt-4 flex justify-end space-x-2">
                <button
                  onClick={() => handleEdit(testimonial)}
                  className="p-2 text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-gray-700 rounded-full"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(testimonial.$id)}
                  className="p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-gray-700 rounded-full"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Add/Edit Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {currentTestimonial ? 'Edit' : 'Add New'} Testimonial
                </h2>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Company *
                    </label>
                    <input
                      type="text"
                      name="company"
                      value={formData.company}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Type *
                    </label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                      required
                    >
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Internship">Internship</option>
                      <option value="Freelance">Freelance</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Package *
                    </label>
                    <input
                      type="text"
                      name="package"
                      value={formData.package}
                      onChange={handleInputChange}
                      placeholder="e.g., 12 LPA"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Year *
                    </label>
                    <input
                      type="text"
                      name="year"
                      value={formData.year}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      District *
                    </label>
                    <input
                      type="text"
                      name="district"
                      value={formData.district}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      State *
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Rating *
                    </label>
                    <select
                      name="rating"
                      value={formData.rating}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                      required
                    >
                      {[1, 2, 3, 4, 5].map(num => (
                        <option key={num} value={num}>
                          {num} Star{num !== 1 ? 's' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Photo URL
                    </label>
                    <input
                      type="url"
                      name="photoId"
                      value={formData.photoId}
                      onChange={handleInputChange}
                      placeholder="https://example.com/photo.jpg"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Comment *
                  </label>
                  <textarea
                    name="comment"
                    value={formData.comment}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                    required
                  ></textarea>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    {currentTestimonial ? 'Update' : 'Add'} Testimonial
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Testimonials;
