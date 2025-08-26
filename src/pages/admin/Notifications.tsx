import { useState, useEffect } from 'react';
import { Bell, Users, X, Check, Clock, AlertCircle, Info, Plus, BookOpen, Send } from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';

const NotificationsPage = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [notification, setNotification] = useState({
    title: '',
    message: '',
    recipients: 'all',
    schedule: false,
    scheduledDate: '',
    scheduledTime: ''
  });
  
  const { addNotification } = useNotifications();
  const { user } = useAuth();
  interface NotificationItem {
    id: number;
    title: string;
    message: string;
    type: string;
    status: 'sent' | 'scheduled';
    recipients: 'all' | 'students' | 'teachers';
    date: string;
    read: boolean;
  }

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch notifications from Appwrite
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Get notifications from Appwrite
        const response = await fetch(`/api/notifications`);
        if (!response.ok) {
          throw new Error('Failed to fetch notifications');
        }
        
        const data = await response.json();
        
        // Map Appwrite notifications to our local format
        const mappedNotifications = data.documents.map((doc: any) => ({
          id: doc.$id,
          title: doc.title,
          message: doc.message,
          type: doc.type || 'announcement',
          status: doc.status || 'sent',
          recipients: doc.recipientType || 'all',
          date: doc.$createdAt || new Date().toISOString(),
          read: doc.isRead || false
        }));
        
        setNotifications(mappedNotifications);
      } catch (err) {
        console.error('Error fetching notifications:', err);
        setError('Failed to load notifications. Please try again later.');
        toast.error('Failed to load notifications');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchNotifications();
  }, []);

  const filteredNotifications = notifications.filter(notification => {
    if (activeTab === 'all') return true;
    if (activeTab === 'unread') return !notification.read;
    if (activeTab === 'scheduled') return notification.status === 'scheduled';
    return false;
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'system':
        return <Info className="h-5 w-5 text-blue-500" />;
      case 'course':
        return <BookOpen className="h-5 w-5 text-green-500" />;
      case 'assignment':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'announcement':
        return <Bell className="h-5 w-5 text-purple-500" />;
      case 'meeting':
        return <Users className="h-5 w-5 text-indigo-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getRecipientsLabel = (recipients: string) => {
    switch (recipients) {
      case 'all':
        return 'All Users';
      case 'students':
        return 'Students';
      case 'teachers':
        return 'Teachers';
      default:
        return recipients;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    
    setNotification(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // In a real app, you would send this to your backend API
      const newNotification = {
        id: Date.now(),
        title: notification.title,
        message: notification.message,
        type: 'announcement',
        status: notification.schedule ? 'scheduled' : 'sent',
        recipients: notification.recipients as 'all' | 'students' | 'teachers',
        date: notification.schedule 
          ? `${notification.scheduledDate}T${notification.scheduledTime}:00Z`
          : new Date().toISOString(),
        read: false
      };
      
      // Add to local state
      setNotifications(prev => [newNotification, ...prev] as NotificationItem[]);
      
      // If not scheduled, send immediately
      if (!notification.schedule) {
        try {
          // Define the recipient type
          const recipientType = notification.recipients as 'all' | 'students' | 'teachers';
          
          // Create the notification data object with required fields
          const notificationData = {
            title: notification.title,
            message: notification.message,
            recipientType,
            metadata: {
              recipients: notification.recipients,
              senderId: user?.$id || 'system',
              senderName: user?.name || 'System',
              recipientType
            },
            senderId: user?.$id,
            senderName: user?.name || 'System',
            readAt: undefined
          };
          
          // Use type assertion to match the expected type for addNotification
          await addNotification(notificationData as any);
          
          // Show success message
          toast.success('Notification sent successfully');
        } catch (error) {
          console.error('Failed to send notification:', error);
          toast.error('Failed to send notification');
        }
        
        // In a real app, you would make an API call here to send the notification to the server
        // await fetch('/api/notifications', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({
        //     title: notification.title,
        //     message: notification.message,
        //     recipients: notification.recipients,
        //     senderId: user?.id,
        //     type: 'announcement'
        //   })
        // });
        
        toast.success('Notification sent successfully!');
      } else {
        toast.success('Notification scheduled successfully!');
      }
      
      // Close the form and reset
      setIsComposeOpen(false);
      setNotification({
        title: '',
        message: '',
        recipients: 'all',
        schedule: false,
        scheduledDate: '',
        scheduledTime: ''
      });
      
    } catch (error) {
      console.error('Failed to send notification:', error);
      toast.error('Failed to send notification. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage and send notifications to users
          </p>
        </div>
        <button 
          onClick={() => setIsComposeOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <Plus className="-ml-1 mr-2 h-5 w-5" />
          New Notification
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-dark-700">
        <nav className="-mb-px flex space-x-8">
          {['all', 'unread', 'scheduled'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === 'unread' && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                  {notifications.filter(n => !n.read).length}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Notifications List */}
      <div className="bg-white dark:bg-dark-800 shadow overflow-hidden sm:rounded-lg">
        <ul className="divide-y divide-gray-200 dark:divide-dark-700">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((item) => (
              <li key={item.id} className={`px-6 py-4 ${!item.read ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-dark-700'}`}>
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    {getNotificationIcon(item.type)}
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm font-medium ${!item.read ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                        {item.title}
                      </p>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(item.date).toLocaleString()}
                        </span>
                        {item.status === 'scheduled' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                            <Clock className="h-3 w-3 mr-1" />
                            Scheduled
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      {item.message}
                    </p>
                    <div className="mt-2 flex items-center text-xs text-gray-500 dark:text-gray-400">
                      <span className="inline-flex items-center">
                        <Users className="h-3 w-3 mr-1" />
                        {getRecipientsLabel(item.recipients)}
                      </span>
                      <span className="mx-2">•</span>
                      <span className="inline-flex items-center">
                        {item.status === 'sent' ? (
                          <>
                            <Check className="h-3 w-3 mr-1 text-green-500" />
                            Sent
                          </>
                        ) : (
                          <>
                            <Clock className="h-3 w-3 mr-1 text-yellow-500" />
                            Scheduled
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4 flex-shrink-0 flex">
                    <button className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400">
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </li>
            ))
          ) : (
            <li className="px-6 py-10 text-center">
              <Bell className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No notifications</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {activeTab === 'all' 
                  ? 'No notifications to display.' 
                  : `No ${activeTab} notifications found.`}
              </p>
            </li>
          )}
        </ul>
      </div>

      {/* Compose Notification Modal */}
      {isComposeOpen && (
        <div className="fixed inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setIsComposeOpen(false)}></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white dark:bg-dark-800 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div className="absolute top-0 right-0 pt-4 pr-4">
                <button
                  type="button"
                  className="bg-white dark:bg-dark-800 rounded-md text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none"
                  onClick={() => setIsComposeOpen(false)}
                >
                  <span className="sr-only">Close</span>
                  <X className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>
              <div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white" id="modal-title">
                    New Notification
                  </h3>
                  <div className="mt-4">
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Title
                        </label>
                        <div className="mt-1">
                          <input
                            type="text"
                            name="title"
                            id="title"
                            required
                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:bg-dark-700 dark:border-dark-600 dark:text-white rounded-md"
                            value={notification.title}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Message
                        </label>
                        <div className="mt-1">
                          <textarea
                            id="message"
                            name="message"
                            rows={4}
                            required
                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:bg-dark-700 dark:border-dark-600 dark:text-white rounded-md"
                            value={notification.message}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="recipients" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Recipients
                        </label>
                        <select
                          id="recipients"
                          name="recipients"
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:bg-dark-700 dark:border-dark-600 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                          value={notification.recipients}
                          onChange={handleInputChange}
                        >
                          <option value="all">All Users</option>
                          <option value="students">Students Only</option>
                          <option value="teachers">Teachers Only</option>
                        </select>
                      </div>

                      <div className="flex items-center">
                        <input
                          id="schedule"
                          name="schedule"
                          type="checkbox"
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          checked={notification.schedule as boolean}
                          onChange={handleInputChange}
                        />
                        <label htmlFor="schedule" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                          Schedule for later
                        </label>
                      </div>

                      {notification.schedule && (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="scheduledDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              Date
                            </label>
                            <input
                              type="date"
                              name="scheduledDate"
                              id="scheduledDate"
                              className="mt-1 block w-full border-gray-300 dark:bg-dark-700 dark:border-dark-600 dark:text-white rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                              value={notification.scheduledDate}
                              onChange={handleInputChange}
                              required={notification.schedule}
                            />
                          </div>
                          <div>
                            <label htmlFor="scheduledTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              Time
                            </label>
                            <input
                              type="time"
                              name="scheduledTime"
                              id="scheduledTime"
                              className="mt-1 block w-full border-gray-300 dark:bg-dark-700 dark:border-dark-600 dark:text-white rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                              value={notification.scheduledTime}
                              onChange={handleInputChange}
                              required={notification.schedule}
                            />
                          </div>
                        </div>
                      )}

                      <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                        <button
                          type="submit"
                          className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm"
                        >
                          {notification.schedule ? 'Schedule' : 'Send Now'}
                        </button>
                        <button
                          type="button"
                          className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-dark-600 shadow-sm px-4 py-2 bg-white dark:bg-dark-700 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-dark-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                          onClick={() => setIsComposeOpen(false)}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
