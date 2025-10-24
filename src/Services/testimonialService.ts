import { Query, type Models } from 'appwrite';
import { databases, DATABASE_ID, TESTIMONIALS_BUCKET_ID, client } from '../appwriteConfig';

export interface Testimonial extends Models.Document {
  name: string;
  company: string;
  type: string;
  package: string;
  year: string;
  district: string;
  state: string;
  photoId: string;
  // Optional fields that might be used by the UI
  rating?: number;
  comment?: string;
  avatar?: string;
}

export const getTestimonials = async (): Promise<Testimonial[]> => {
  try {
    const response = await databases.listDocuments<Testimonial>(
      DATABASE_ID,
      'testimonials',
      [
        Query.limit(100), // Adjust limit as needed
        Query.orderDesc('$createdAt')
      ]
    );
    
    // Map the response to include avatar URL and any additional fields
    return response.documents.map((doc) => ({
      ...doc,
      id: doc.$id,
      avatar: doc.photoId ? `${client.config.endpoint}/storage/buckets/${TESTIMONIALS_BUCKET_ID}/files/${doc.photoId}/view?project=${client.config.project}` : undefined,
      // Add default rating if not present
      rating: doc.rating || 5,
      
    }));
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    return [];
  }
};
