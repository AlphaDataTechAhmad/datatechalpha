import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { getInternshipBySlug, enrollInInternship } from '../../services/internshipService';
import { useAuth } from '../../contexts/AuthContext';

// Types
export type Project = {
  id: string;
  title: string;
  description: string;
  sourceCodeUrl?: string;
};

export type Video = {
  id: string;
  title: string;
  url: string;
  duration: string;
};

export type LiveSession = {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  meetingId: string;
};

// Update Internship type to match the service
export interface Internship {
  $id?: string;
  id?: string; // For backward compatibility
  title: string;
  description: string;
  shortDescription: string;
  duration: string;
  level: string;
  slug: string;
  startDate: string;
  endDate: string;
  isActive?: boolean;
  maxStudents?: number;
  currentStudents?: number;
  price: number;
  currency: string;
  tags?: string[];
  image?: string;
  projects?: Project[];
  videos?: Video[];
  liveSessions?: LiveSession[];
}

// JitsiMeeting component with proper typing and error handling
declare global {
  interface Window {
    JitsiMeetExternalAPI: new (
      domain: string,
      options: {
        roomName: string;
        parentNode: HTMLElement | null;
        width?: string | number;
        height?: string | number;
        configOverwrite?: Record<string, any>;
        interfaceConfigOverwrite?: Record<string, any>;
        userInfo?: {
          displayName?: string;
          email?: string;
        };
      }
    ) => any;
  }
}

interface JitsiMeetingProps {
  roomName: string;
  onApiReady: (api: any) => void;
  configOverwrite?: Record<string, any>;
  getIFrameRef?: (node: HTMLIFrameElement) => void;
}

// JitsiMeeting component is commented out as it's not currently used
// but kept for future implementation
/*
const JitsiMeeting = ({ roomName, onApiReady, containerStyles }: { 
  roomName: string; 
  onApiReady: (api: any) => void; 
  containerStyles?: React.CSSProperties 
}) => {
  const jitsiContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!roomName) return;

    const loadJitsiScript = () => {
      const script = document.createElement('script');
      script.src = 'https://meet.jit.si/external_api.js';
      script.async = true;
      script.onload = initializeJitsi;
      document.body.appendChild(script);
    };

    const initializeJitsi = () => {
      if (!window.JitsiMeetExternalAPI) {
        console.error('Jitsi Meet API not loaded');
        return;
      }

      try {
        const domain = 'meet.jit.si';
        const options = {
          roomName: roomName,
          parentNode: jitsiContainerRef.current,
          width: '100%',
          height: '100%',
          configOverwrite: {
            startWithAudioMuted: true,
            startWithVideoMuted: true,
            enableWelcomePage: false,
          },
          interfaceConfigOverwrite: {
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            DEFAULT_BACKGROUND: '#f3f4f6',
          },
        };

        const api = new window.JitsiMeetExternalAPI(domain, options);
        onApiReady(api);

        return () => {
          api?.dispose();
        };
      } catch (error) {
        console.error('Failed to initialize Jitsi:', error);
      }
    };

    loadJitsiScript();
  }, [roomName, onApiReady]);

  return <div ref={jitsiContainerRef} style={{ width: '100%', height: '500px', ...containerStyles }} />;
};
*/

// Helper Components
const LoadingSpinner: React.FC = () => (
  <div className="flex justify-center items-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
  </div>
);

const ErrorMessage: React.FC<{ message: string }> = ({ message }) => (
  <div className="container mx-auto px-4 py-12">
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
      <strong className="font-bold">Error: </strong>
      <span className="block sm:inline">{message}</span>
    </div>
  </div>
);

const NotFoundMessage: React.FC = () => (
  <div className="text-center py-12">
    <h2 className="text-2xl font-bold mb-4">Internship Not Found</h2>
    <p className="text-gray-600">The requested internship could not be found.</p>
  </div>
);

// AuthContext type is now properly imported from the AuthContext file

const InternshipDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  
  // State for tracking enrollment status
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [jitsiApi, setJitsiApi] = useState<any>(null);
  
  // State for internship data and loading/error states
  const [internship, setInternship] = useState<Internship | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Use type assertion for useAuth until we have the actual type
  const { currentUser } = useAuth() as unknown as { currentUser: { $id: string } | null };

  // Handle Jitsi API ready - kept for future implementation
  const handleJitsiApiReady = useCallback((api: any) => {
    // Store the Jitsi API instance for cleanup
    setJitsiApi(api);
    console.log('Jitsi API ready:', api);
  }, []);

  // Fetch internship data when component mounts
  useEffect(() => {
    const fetchInternship = async () => {
      if (!slug) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const data = await getInternshipBySlug(slug);
        setInternship(data);
        
        // Check if user is already enrolled (you would implement this check with your backend)
        // const enrollmentStatus = await checkEnrollmentStatus(data.$id, currentUser.uid);
        // setIsEnrolled(enrollmentStatus.isEnrolled);
      } catch (err) {
        console.error('Error fetching internship:', err);
        setError('Failed to load internship details. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchInternship();
  }, [slug, currentUser]);

  // Handle enrollment
  const handleEnroll = useCallback(async () => {
    if (!internship || !currentUser) {
      setError('Please sign in to enroll in this internship.');
      return;
    }
    
    if (isEnrolling) return;
    
    try {
      setIsEnrolling(true);
      setError(null);
      
      // Enroll the user in the internship
      const internshipId = internship.$id || internship.id;
      if (!internshipId) {
        throw new Error('Invalid internship ID');
      }
      await enrollInInternship(internshipId, currentUser.$id);
      
      // Update the UI
      setIsEnrolled(true);
      setInternship(prev => prev ? {
        ...prev,
        currentStudents: (prev.currentStudents || 0) + 1
      } : null);
      
      // Show success message
      alert('Successfully enrolled in the internship!');
    } catch (err: any) {
      console.error('Failed to enroll:', err);
      setError(err.message || 'Failed to enroll. Please try again.');
    } finally {
      setIsEnrolling(false);
    }
  }, [internship, currentUser, isEnrolling]);

  // Render video list
  const renderVideos = useCallback(() => {
    if (!internship?.videos?.length) {
      return <p className="text-gray-600">No videos available yet.</p>;
    }
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {internship.videos.map((video) => (
          <div key={video.id} className="bg-white dark:bg-dark-800 rounded-lg overflow-hidden shadow">
            <div className="aspect-w-16 aspect-h-9 bg-gray-200 dark:bg-gray-700">
              <iframe
                src={video.url}
                title={video.title}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <div className="p-4">
              <h3 className="font-medium text-gray-900 dark:text-white mb-1">{video.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{video.duration}</p>
            </div>
          </div>
        ))}
      </div>
    );
  }, [internship?.videos]);

  // Render projects list
  const renderProjects = useCallback(() => {
    if (!internship?.projects?.length) {
      return <p className="text-gray-600">No projects assigned yet.</p>;
    }
    
    return (
      <div className="space-y-4">
        {internship.projects.map((project) => (
          <div key={project.id} className="bg-white dark:bg-dark-800 p-4 rounded-lg shadow">
            <h3 className="font-medium text-gray-900 dark:text-white mb-1">{project.title}</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-2">{project.description}</p>
            {project.sourceCodeUrl && (
              <a
                href={project.sourceCodeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
              >
                View Source Code
              </a>
            )}
          </div>
        ))}
      </div>
    );
  }, [internship?.projects]);

  // Clean up Jitsi API on unmount
  useEffect(() => {
    return () => {
      if (jitsiApi) {
        jitsiApi.dispose();
        setJitsiApi(null);
      }
    };
  }, [jitsiApi]);
  
  // Add a comment explaining why isEnrolled is kept even if not used
  // It's part of the component's state and might be used in the future for UI rendering
  // or passed to child components that might need it

  // Handle loading and error states
  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  if (!internship) {
    return <NotFoundMessage />;
  }

  return (
    <main className="container mx-auto px-4 py-12">
      <Helmet>
        <title>{internship.title} | Internship Program</title>
      </Helmet>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                {internship.title}
              </h1>
              <div className="flex flex-wrap gap-2 mb-4">
                {internship.tags?.map((tag, index) => (
                  <span 
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="text-right">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                internship.isActive 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              }`}>
                {internship.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
          
          {internship.image && (
            <div className="mb-6 rounded-xl overflow-hidden">
              <img 
                src={internship.image} 
                alt={internship.title} 
                className="w-full h-auto object-cover"
              />
            </div>
          )}
          
          <div className="prose dark:prose-invert max-w-none">
            <p className="text-xl text-gray-700 dark:text-gray-300 mb-6">
              {internship.shortDescription}
            </p>
            <div className="text-lg text-gray-700 dark:text-gray-300 space-y-4">
              {internship.description.split('\n\n').map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
          </div>
        </div>
        
        {renderEnrollmentInfo()}
        
        <div className="space-y-12 mt-12">
          {internship.projects && internship.projects.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Projects</h2>
              {renderProjects()}
            </div>
          )}
          
          {internship.videos && internship.videos.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Learning Resources</h2>
              {renderVideos()}
            </div>
          )}
          
          {internship.liveSessions && internship.liveSessions.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Live Sessions</h2>
              {renderLiveSessions()}
            </div>
          )}
        </div>
      </div>
      <Tab.Group>
        <Tab.List className="flex space-x-4 mb-4">
          <Tab
            key="projects"
            className={({ selected }) =>
              `px-4 py-2 rounded-lg ${selected ? 'bg-blue-600 text-white' : 'bg-white dark:bg-dark-800 text-gray-900 dark:text-white'}`
            }
          >
            Projects
          </Tab>
          <Tab
            key="videos"
            className={({ selected }) =>
              `px-4 py-2 rounded-lg ${selected ? 'bg-blue-600 text-white' : 'bg-white dark:bg-dark-800 text-gray-900 dark:text-white'}`
            }
          >
            Videos
          </Tab>
          <Tab
            key="live-sessions"
            className={({ selected }) =>
              `px-4 py-2 rounded-lg ${selected ? 'bg-blue-600 text-white' : 'bg-white dark:bg-dark-800 text-gray-900 dark:text-white'}`
            }
          >
            Live Sessions
          </Tab>
        </Tab.List>
        <Tab.Panels>
          <Tab.Panel key="projects">{renderProjects()}</Tab.Panel>
          <Tab.Panel key="videos">{renderVideos()}</Tab.Panel>
          <Tab.Panel key="live-sessions">{renderLiveSessions()}</Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </main>
  );
};

export default InternshipDetailPage;
