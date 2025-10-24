import { Client } from 'appwrite';
import { Account } from 'appwrite';

export const sendSMS = async (to: string, message: string) => {
  try {
    const client = new Client()
      .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
      .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);
    
    const account = new Account(client);
    
    // This will trigger our Appwrite function
    const response = await fetch(`${import.meta.env.VITE_APPWRITE_ENDPOINT}/functions/send-sms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Appwrite-Project': import.meta.env.VITE_APPWRITE_PROJECT_ID,
        'X-Appwrite-Key': import.meta.env.VITE_APPWRITE_API_KEY, // Make sure to set this in your .env
      },
      body: JSON.stringify({
        to,
        message,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to send SMS');
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending SMS:', error);
    throw error;
  }
};
