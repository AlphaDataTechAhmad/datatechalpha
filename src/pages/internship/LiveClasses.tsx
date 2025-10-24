import React, { useState, useEffect } from 'react';
import { Video, Clock, Calendar, AlertCircle, Plus, Loader2, Edit2, Trash2 } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { databases, DATABASE_ID, LIVE_CLASSES_COLLECTION_ID, Query, ID } from '../../Services/appwrite';
import { toast } from 'react-toastify';

interface LiveClass {
  $id: string;
  name: string;
  topic: string;
  description: string;
  meetlink: string;
  time: string;
  internshipId: string;
  createdBy: string;
  $createdAt: string;
  $updatedAt: string;
}

interface InternshipContext {
  internship: {
    title: string;
    company: string;
    $id: string;
  };
  application: {
    payment_status: string;
  };
  user: {
    $id: string;
    email: string;
    role?: string; // Add role to user type
  };
}

const LiveClasses: React.FC = () => {
  const { internship, application, user } = useOutletContext<InternshipContext>();
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isTeacher, setIsTeacher] = useState(false);
  const [liveClasses, setLiveClasses] = useState<LiveClass[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    topic: '',
    description: '',
    meetlink: '',
    time: ''
  });

  const isPaymentCompleted = application?.payment_status === 'completed';

  // Check if current time is within 10 minutes of class time
  const isClassStartingSoon = (classTime: string) => {
    const now = new Date();
    const classStart = new Date(classTime);
    const tenMinutesBefore = new Date(classStart.getTime() - 10 * 60 * 1000);
    return now >= tenMinutesBefore && now < classStart;
  };

  // Check if class has started
  const hasClassStarted = (classTime: string) => {
    return new Date() >= new Date(classTime);
  };

  // Check if class has ended (assuming 2 hour duration for now)
  const hasClassEnded = (classTime: string) => {
    const classEnd = new Date(new Date(classTime).getTime() + 2 * 60 * 60 * 1000);
    return new Date() > classEnd;
  };

  // Format class time
  const formatClassTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };
  
  // Format time remaining until class starts
  const formatTimeRemaining = (classTime: string) => {
    const now = new Date();
    const start = new Date(classTime);
    const diff = start.getTime() - now.getTime();
    
    if (diff <= 0) return 'Class is starting now';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `Starts in ${days} day${days > 1 ? 's' : ''}`;
    if (hours > 0) return `Starts in ${hours} hour${hours > 1 ? 's' : ''} ${minutes} min`;
    return `Starts in ${minutes} minute${minutes !== 1 ? 's' : ''}`;
  };

  // Fetch live classes
  const fetchLiveClasses = async () => {
    try {
      setIsLoading(true);
      const response = await databases.listDocuments(
        DATABASE_ID,
        LIVE_CLASSES_COLLECTION_ID,
        [
          Query.equal('internshipId', internship.$id),
          Query.orderAsc('time')
        ]
      );
      setLiveClasses(response.documents as unknown as LiveClass[]);
    } catch (error) {
      console.error('Error fetching live classes:', error);
      toast.error('Failed to load live classes');
    } finally {
      setIsLoading(false);
    }
  };

  // Check user role
  const checkUserRole = async () => {
    try {
      // First check if user is admin, subadmin, or teacher
      if (user?.role === 'admin' || user?.role === 'subadmin' || user?.role === 'teacher') {
        console.log('User is teacher/admin/subadmin based on role:', user.role);
        setIsTeacher(true);
        return;
      }
      
      // If not, check their profile
      console.log('Fetching user profile to check role...');
      const profile = await databases.getDocument(
        DATABASE_ID,
        'user_profiles',
        user?.$id || ''
      );
      
      // Set teacher status if user has teacher role or is an admin/subadmin
      const isUserTeacher = profile?.role === 'teacher' || user?.role === 'admin' || user?.role === 'subadmin';
      console.log('User profile role check result:', { profileRole: profile?.role, isUserTeacher });
      setIsTeacher(isUserTeacher);
    } catch (error) {
      console.error('Error fetching user role:', error);
      // If there's an error, check if user is admin/subadmin/teacher from user object
      const fallbackIsTeacher = user?.role === 'admin' || user?.role === 'subadmin' || user?.role === 'teacher';
      console.log('Error fetching profile, using fallback role check:', { userRole: user?.role, fallbackIsTeacher });
      setIsTeacher(fallbackIsTeacher);
    }
  };

  // Create new live class
  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form data
    if (!formData.name || !formData.topic || !formData.meetlink || !formData.time) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    // Validate Google Meet link format
    if (!formData.meetlink.includes('meet.google.com')) {
      toast.error('Please enter a valid Google Meet link');
      return;
    }
    
    // Ensure the time is in the future
    const selectedTime = new Date(formData.time);
    if (selectedTime < new Date()) {
      toast.error('Please select a future date and time');
      return;
    }
    
    try {
      setIsCreating(true);
      
      // Format the time to ISO string for storage
      const formattedTime = selectedTime.toISOString();
      
      await databases.createDocument(
        DATABASE_ID,
        LIVE_CLASSES_COLLECTION_ID,
        ID.unique(),
        {
          name: formData.name.trim(),
          topic: formData.topic.trim(),
          description: formData.description.trim(),
          meetlink: formData.meetlink.trim(),
          time: formattedTime,
          internshipId: internship.$id,
          createdBy: user.$id
        }
      );
      
      toast.success('Live class scheduled successfully!');
      setShowCreateForm(false);
      setFormData({
        name: '',
        topic: '',
        description: '',
        meetlink: '',
        time: ''
      });
      fetchLiveClasses();
    } catch (error) {
      console.error('Error creating live class:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to schedule live class');
    } finally {
      setIsCreating(false);
    }
  };

  // Delete live class
  const handleDeleteClass = async (classId: string) => {
    if (!window.confirm('Are you sure you want to delete this class?')) return;
    
    try {
      await databases.deleteDocument(
        DATABASE_ID,
        LIVE_CLASSES_COLLECTION_ID,
        classId
      );
      toast.success('Live class deleted successfully!');
      fetchLiveClasses();
    } catch (error) {
      console.error('Error deleting live class:', error);
      toast.error('Failed to delete live class');
    }
  };

  // State for tracking current time (used for countdown timers)
  const [, setCurrentTime] = useState(new Date());

  // Update current time every minute for countdown timers
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => clearInterval(timer);
  }, []);

  // Fetch data on component mount and when dependencies change
  useEffect(() => {
    console.log('useEffect - Checking user role and payment status', { 
      isTeacher, 
      isPaymentCompleted, 
      hasUser: !!user,
      userRole: user?.role
    });
    
    // Always check user role first to ensure isTeacher is set correctly
    if (user) {
      checkUserRole().then(() => {
        console.log('After checkUserRole - isTeacher:', isTeacher);
        // If user is a teacher/admin/subadmin or payment is completed, fetch data
        if ((isTeacher || isPaymentCompleted) && internship?.$id) {
          console.log('Fetching live classes...');
          fetchLiveClasses();
        }
      });
    }
  }, [user, isPaymentCompleted, internship?.$id]);
  
  // If user is not a teacher/admin/subadmin and payment is not completed, show payment required
  console.log('Rendering LiveClasses - isTeacher:', isTeacher, 'isPaymentCompleted:', isPaymentCompleted, 'userRole:', user?.role);
  if (!isTeacher && !isPaymentCompleted) {
    return (
      <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
        <AlertCircle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Payment Required
        </h3>
        <p className="text-gray-600 dark:text-gray-300 max-w-md mx-auto mb-6">
          Please complete your payment to access the live classes.
        </p>
        <button
          onClick={() => window.location.href = '/payment'}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Complete Payment
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600 dark:text-gray-300">Loading live classes...</span>
      </div>
    );
  }

  // Sort classes by time (soonest first for upcoming, most recent first for past)
  const upcomingClasses = liveClasses
    .filter((classItem) => !hasClassEnded(classItem.time))
    .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

  const pastClasses = liveClasses
    .filter((classItem) => hasClassEnded(classItem.time))
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Live Classes
          </h2>
          {isTeacher && (
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              Schedule Class
            </button>
          )}
        </div>

        {/* Create Class Form */}
        {showCreateForm && (
          <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg mb-8">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                Schedule New Live Class
              </h3>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-5 sm:p-6">
              <form onSubmit={handleCreateClass}>
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Class Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="topic" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Topic
                    </label>
                    <input
                      type="text"
                      id="topic"
                      required
                      value={formData.topic}
                      onChange={(e) => setFormData({...formData, topic: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Description
                    </label>
                    <textarea
                      id="description"
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="time" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Date & Time
                      </label>
                      <input
                        type="datetime-local"
                        id="time"
                        required
                        value={formData.time}
                        onChange={(e) => setFormData({...formData, time: e.target.value})}
                        min={new Date().toISOString().slice(0, 16)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="meetlink" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Google Meet Link
                      </label>
                      <input
                        type="url"
                        id="meetlink"
                        required
                        placeholder="https://meet.google.com/..."
                        value={formData.meetlink}
                        onChange={(e) => setFormData({...formData, meetlink: e.target.value})}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                        Scheduling...
                      </>
                    ) : (
                      'Schedule Class'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="mb-12">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Upcoming Classes
          </h3>
          {upcomingClasses.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
              {upcomingClasses.map((classItem) => {
                const classTime = new Date(classItem.time);
                const isStartingSoon = isClassStartingSoon(classItem.time);
                const hasStarted = hasClassStarted(classItem.time);
                const canJoin = isStartingSoon || hasStarted;
                
                return (
                  <div
                    key={classItem.$id}
                    className="bg-white dark:bg-gray-800 shadow overflow-hidden rounded-lg border-l-4 border-blue-500"
                  >
                    <div className="px-4 py-5 sm:px-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                            {classItem.name}
                          </h4>
                          <p className="mt-1 text-sm text-blue-600 dark:text-blue-400 font-medium">
                            {classItem.topic}
                          </p>
                        </div>
                        {isTeacher && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                setFormData({
                                  name: classItem.name,
                                  topic: classItem.topic,
                                  description: classItem.description,
                                  meetlink: classItem.meetlink,
                                  time: classItem.time.split('.')[0] // Remove milliseconds for datetime-local input
                                });
                                setShowCreateForm(true);
                              }}
                              className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                              title="Edit"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteClass(classItem.$id)}
                              className="text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>
                      {classItem.description && (
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                          {classItem.description}
                        </p>
                      )}
                    </div>
                    <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-4 sm:px-6">
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <Calendar className="flex-shrink-0 mr-1.5 h-5 w-5" />
                        {formatClassTime(classItem.time)}
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <Clock className="flex-shrink-0 mr-1.5 h-5 w-5" />
                        {classTime.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        })}
                        {' • '}
                        {classTime.toLocaleTimeString('en-US', {
                          timeZoneName: 'short'
                        }).split(' ')[1]}
                      </div>
                      <div className="mt-4">
                        <a
                          href={canJoin ? classItem.meetlink : '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                            canJoin 
                              ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500' 
                              : 'bg-gray-400 cursor-not-allowed'
                          } focus:outline-none focus:ring-2 focus:ring-offset-2`}
                          onClick={(e) => !canJoin && e.preventDefault()}
                        >
                          <Video className="-ml-1 mr-2 h-5 w-5" />
                          {hasStarted 
                            ? 'Join Class' 
                            : isStartingSoon 
                              ? 'Starting Soon' 
                              : 'Not Started Yet'}
                        </a>
                        {!hasStarted && (
                          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                            {isStartingSoon 
                              ? 'Class will start in less than 10 minutes' 
                              : `Class will start on ${formatClassTime(classItem.time)}`}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
              <Video className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No upcoming classes</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {isTeacher 
                  ? 'Get started by scheduling a new class.'
                  : 'Check back later for upcoming classes.'}
              </p>
              {isTeacher && (
                <div className="mt-6">
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Plus className="-ml-1 mr-2 h-5 w-5" />
                    Schedule Class
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {pastClasses.length > 0 && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Past Classes
            </h3>
            <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {pastClasses.map((classItem) => (
                  <li key={classItem.$id}>
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-base font-medium text-gray-900 dark:text-white">
                            {classItem.name}
                          </h4>
                          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            {classItem.topic} • {formatClassTime(classItem.time)}
                          </p>
                        </div>
                        {classItem.meetlink && (
                          <div className="ml-2 flex-shrink-0">
                            <a
                              href={classItem.meetlink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-full shadow-sm text-blue-700 bg-blue-100 hover:bg-blue-200 dark:text-blue-300 dark:bg-blue-900/50 dark:hover:bg-blue-800/50"
                            >
                              <Video className="-ml-0.5 mr-1.5 h-3.5 w-3.5" />
                              {isTeacher ? 'Meeting Link' : 'Watch Recording'}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  if (!isPaymentCompleted) {
    return (
      <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
        <AlertCircle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Payment Required
        </h3>
        <p className="text-gray-600 dark:text-gray-300 max-w-md mx-auto mb-6">
          Please complete your payment to access live classes for {internship.title} at {internship.company}.
        </p>
        <button
          onClick={() => window.location.href = '/payment'}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Complete Payment
        </button>
      </div>
    );
  }

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Live Classes
          </h2>
          {isTeacher && (
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              Schedule Class
            </button>
          )}
        </div>

        {/* Create Class Form */}
        {showCreateForm && (
          <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg mb-8">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                Schedule New Live Class
              </h3>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-5 sm:p-6">
              <form onSubmit={handleCreateClass}>
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Class Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="topic" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Topic
                    </label>
                    <input
                      type="text"
                      id="topic"
                      required
                      value={formData.topic}
                      onChange={(e) => setFormData({...formData, topic: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Description
                    </label>
                    <textarea
                      id="description"
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="time" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Date & Time
                      </label>
                      <input
                        type="datetime-local"
                        id="time"
                        required
                        value={formData.time}
                        onChange={(e) => setFormData({...formData, time: e.target.value})}
                        min={new Date().toISOString().slice(0, 16)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="meetlink" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Google Meet Link
                      </label>
                      <input
                        type="url"
                        id="meetlink"
                        required
                        placeholder="https://meet.google.com/..."
                        value={formData.meetlink}
                        onChange={(e) => setFormData({...formData, meetlink: e.target.value})}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                        Scheduling...
                      </>
                    ) : (
                      'Schedule Class'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="mb-12">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Upcoming Classes
          </h3>
          {upcomingClasses.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
              {upcomingClasses.map((classItem) => {
                const classTime = new Date(classItem.time);
                const isStartingSoon = isClassStartingSoon(classItem.time);
                const hasStarted = hasClassStarted(classItem.time);
                const canJoin = isStartingSoon || hasStarted;
                
                return (
                  <div
                    key={classItem.$id}
                    className="bg-white dark:bg-gray-800 shadow overflow-hidden rounded-lg border-l-4 border-blue-500"
                  >
                    <div className="px-4 py-5 sm:px-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                            {classItem.name}
                          </h4>
                          <p className="mt-1 text-sm text-blue-600 dark:text-blue-400 font-medium">
                            {classItem.topic}
                          </p>
                        </div>
                        {isTeacher && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                setFormData({
                                  name: classItem.name,
                                  topic: classItem.topic,
                                  description: classItem.description,
                                  meetlink: classItem.meetlink,
                                  time: classItem.time.split('.')[0] // Remove milliseconds for datetime-local input
                                });
                                setShowCreateForm(true);
                              }}
                              className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                              title="Edit"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteClass(classItem.$id)}
                              className="text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>
                      {classItem.description && (
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                          {classItem.description}
                        </p>
                      )}
                    </div>
                    <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-4 sm:px-6">
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <Calendar className="flex-shrink-0 mr-1.5 h-5 w-5" />
                        {formatDate(classItem.time)}
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <Clock className="flex-shrink-0 mr-1.5 h-5 w-5" />
                        {classTime.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        })}
                        {' • '}
                        {classTime.toLocaleTimeString('en-US', {
                          timeZoneName: 'short'
                        }).split(' ')[1]}
                      </div>
                      <div className="mt-4">
                        <a
                          href={canJoin ? classItem.meetlink : '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                            canJoin 
                              ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500' 
                              : 'bg-gray-400 cursor-not-allowed'
                          } focus:outline-none focus:ring-2 focus:ring-offset-2`}
                          onClick={(e) => !canJoin && e.preventDefault()}
                        >
                          <Video className="-ml-1 mr-2 h-5 w-5" />
                          {hasStarted 
                            ? 'Join Class' 
                            : isStartingSoon 
                              ? 'Starting Soon' 
                              : 'Not Started Yet'}
                        </a>
                        {!hasStarted && (
                          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                            {isStartingSoon 
                              ? 'Class will start in less than 10 minutes' 
                              : `Class will start on ${formatDate(classItem.time)}`}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
              <Video className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No upcoming classes</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {isTeacher 
                  ? 'Get started by scheduling a new class.'
                  : 'Check back later for upcoming classes.'}
              </p>
              {isTeacher && (
                <div className="mt-6">
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Plus className="-ml-1 mr-2 h-5 w-5" />
                    Schedule Class
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {pastClasses.length > 0 && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Past Classes
            </h3>
            <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {pastClasses.map((classItem) => (
                  <li key={classItem.$id}>
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-base font-medium text-gray-900 dark:text-white">
                            {classItem.name}
                          </h4>
                          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            {classItem.topic} • {formatDate(classItem.time)}
                          </p>
                        </div>
                        {classItem.meetlink && (
                          <div className="ml-2 flex-shrink-0">
                            <a
                              href={classItem.meetlink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-full shadow-sm text-blue-700 bg-blue-100 hover:bg-blue-200 dark:text-blue-300 dark:bg-blue-900/50 dark:hover:bg-blue-800/50"
                            >
                              <Video className="-ml-0.5 mr-1.5 h-3.5 w-3.5" />
                              {isTeacher ? 'Meeting Link' : 'Watch Recording'}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveClasses;
