import React, { useState, useEffect, FC } from 'react';
import { Notification, NotificationService, type RecipientType } from '../../Services/notificationService';

interface NotificationForm {
  title: string;
  message: string;
  recipientType: RecipientType;
}

const NotificationCenter: FC = () => {
  const [notification, setNotification] = useState<NotificationForm>({
    title: '',
    message: '',
    recipientType: 'all',
  });
  const [isSending, setIsSending] = useState<boolean>(false);
  const [sendSuccess, setSendSuccess] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Load notifications
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const userType = 'all' as const;
        const userId = 'admin-user-id';
        const userNotifications = await NotificationService.getNotifications(userId, userType);
        setNotifications(userNotifications);
      } catch (error) {
        console.error('Error loading notifications:', error);
      }
    };

    loadNotifications();

    // Subscribe to real-time updates
    const unsubscribe = NotificationService.subscribeToNotifications((response) => {
      if (response.events.includes('databases.*.collections.notifications.documents.*.create')) {
        setNotifications(prev => [response.payload as Notification, ...prev]);
      }
    });

    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notification.title || !notification.message) {
      alert('Please fill in all fields');
      return;
    }

    setIsSending(true);
    setSendSuccess(false);

    try {
      const senderId = 'admin-user-id';
      const senderName = 'Admin';
      
      // Prepare the notification data according to the expected type
      const notificationData = {
        title: notification.title,
        message: notification.message,
        recipientType: notification.recipientType,
        recipientId: notification.recipientType === 'all' ? undefined : 'all',
        senderId,
        senderName
      };
      
      await NotificationService.sendNotification(
        notificationData,
        senderId,
        senderName
      );

      setNotification({
        title: '',
        message: '',
        recipientType: 'all',
      });
      
      // Refresh notifications after sending
      const updatedNotifications = await NotificationService.getNotifications('admin-user-id', 'all');
      setNotifications(updatedNotifications);
      
      setSendSuccess(true);
      setTimeout(() => setSendSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to send notification:', error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Notification Center</h1>
      
      <form onSubmit={handleSendNotification} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Recipient Type
          </label>
          <select
            value={notification.recipientType}
            onChange={(e) => setNotification({
              ...notification,
              recipientType: e.target.value as RecipientType
            })}
            className="w-full p-2 border rounded"
          >
            <option value="all">All Users</option>
            <option value="student">Students</option>
            <option value="teacher">Teachers</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title
          </label>
          <input
            type="text"
            value={notification.title}
            onChange={(e) => setNotification({
              ...notification,
              title: e.target.value
            })}
            className="w-full p-2 border rounded"
            placeholder="Enter notification title"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Message
          </label>
          <textarea
            value={notification.message}
            onChange={(e) => setNotification({
              ...notification,
              message: e.target.value
            })}
            className="w-full p-2 border rounded h-32"
            placeholder="Enter notification message"
            required
          />
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSending}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isSending ? 'Sending...' : 'Send Notification'}
          </button>
        </div>
        
        {sendSuccess && (
          <div className="p-2 bg-green-100 text-green-700 rounded">
            Notification sent successfully!
          </div>
        )}
      </form>
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Recent Notifications</h2>
        {notifications.length === 0 ? (
          <p>No notifications yet.</p>
        ) : (
          <div className="space-y-4">
            {notifications.map((notif) => (
              <div key={notif.id} className="p-4 border rounded">
                <h3 className="font-medium">{notif.title}</h3>
                <p className="text-gray-600">{notif.message}</p>
                <div className="text-sm text-gray-500 mt-2">
                  To: {notif.recipientType}
                  {notif.recipientId && ` (${notif.recipientId})`}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {new Date(notif.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationCenter;
