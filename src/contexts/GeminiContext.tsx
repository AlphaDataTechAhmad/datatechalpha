import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

interface Message {
  role: 'user' | 'model';
  content: string;
}

interface GeminiContextType {
  messages: Message[];
  isLoading: boolean;
  sendMessage: (message: string) => Promise<void>;
  clearMessages: () => void;
  error: string | null;
  retryAfter: number | null;
  isInitialized: boolean;
}

const GeminiContext = createContext<GeminiContextType | undefined>(undefined);

interface GeminiProviderProps {
  apiKey?: string;
  children: ReactNode;
}

export const GeminiProvider: React.FC<GeminiProviderProps> = ({ 
  apiKey = import.meta.env.VITE_GEMINI_API_KEY || '',
  children 
}) => {
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'model', 
      content: "Hi there! I'm DATA-TECH Assistant. How can I help you today?" 
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryAfter, setRetryAfter] = useState<number | null>(null);
  const [model, setModel] = useState<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize the model
  useEffect(() => {
    const initializeModel = async () => {
      try {
        if (!apiKey) {
          throw new Error('API key is required');
        }

        const trimmedKey = apiKey.trim();
        if (!trimmedKey) {
          throw new Error('API key cannot be empty');
        }

        const genAI = new GoogleGenerativeAI(trimmedKey);
        
        const newModel = genAI.getGenerativeModel({
          model: "gemini-1.5-flash",
          generationConfig: {
            maxOutputTokens: 1000,
            temperature: 0.9,
            topP: 0.1,
          },
          safetySettings: [
            {
              category: HarmCategory.HARM_CATEGORY_HARASSMENT,
              threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH
            },
            {
              category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
              threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH
            },
            {
              category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
              threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH
            },
            {
              category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
              threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH
            },
          ]
        });

        // Test the model with a simple request
        try {
          const testChat = newModel.startChat();
          await testChat.sendMessage("Test connection - please ignore this message");
          setModel(newModel);
          setIsInitialized(true);
          setError(null);
        } catch (testError) {
          throw new Error('Failed to connect to Gemini API. Please check your API key.');
        }
      } catch (err: any) {
        console.error('Error initializing model:', err);
        setError(err.message || 'Failed to initialize Gemini model');
        setIsInitialized(false);
      }
    };

    initializeModel();
  }, [apiKey]);

  const sendMessage = async (message: string) => {
    if (!message.trim()) return;
    if (!model || !isInitialized) {
      setError('AI model is not ready yet');
      return;
    }

    const newUserMessage: Message = { role: 'user', content: message };
    setMessages(prev => [...prev, newUserMessage]);
    setIsLoading(true);
    setError(null);
    setRetryAfter(null);

    try {
      const chat = model.startChat({
        history: messages.map(msg => ({
          role: msg.role,
          parts: [{ text: msg.content }],
        })),
      });

      const result = await chat.sendMessage(message);
      const response = await result.response;
      const text = response.text();
      
      setMessages(prev => [...prev, { role: 'model', content: text }]);
    } catch (error: any) {
      console.error('Error sending message to Gemini:', error);
      
      // Handle rate limiting
      if (error?.response?.status === 429) {
        const retryDelay = parseInt(error?.response?.headers?.get('retry-after') || '30', 10);
        setRetryAfter(retryDelay);
        setError(`Too many requests. Please try again in ${retryDelay} seconds.`);
      } else {
        setError(error?.message || "I'm having trouble connecting right now. Please try again later.");
      }
      
      setMessages(prev => [...prev, { 
        role: 'model', 
        content: "I'm having trouble connecting right now. Please try again later." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearMessages = () => {
    setMessages([
      { 
        role: 'model', 
        content: "Hi there! I'm DATA-TECH Assistant. How can I help you today?" 
      }
    ]);
    setError(null);
    setRetryAfter(null);
  };

  return (
    <GeminiContext.Provider value={{ 
      messages, 
      isLoading, 
      sendMessage, 
      clearMessages,
      error,
      retryAfter,
      isInitialized
    }}>
      {children}
    </GeminiContext.Provider>
  );
};

export const useGemini = (): GeminiContextType => {
  const context = useContext(GeminiContext);
  if (!context) {
    throw new Error('useGemini must be used within GeminiProvider');
  }
  return context;
};