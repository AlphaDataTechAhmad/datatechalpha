import { useState, useEffect } from 'react';
import { databases, DATABASE_ID, EXAM_REGISTRATIONS_COLLECTION_ID } from '../../appwriteConfig';
import { Button, Table, message, Modal, DatePicker, TimePicker, Select, Tag, Space, Switch } from 'antd';
import type { Dayjs } from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { generateTestLink } from '../../utils/testLinkUtils';
import { sendTestInvitation } from '../../utils/emailService';

interface Registration {
  $id: string;
  full_name: string;
  email: string;
  status: string;
  scheduled_at?: string;
  test_link?: string;
  test_expiry?: string;
  test_sent_at?: string;
}

interface TestSchedule {
  startDate: Dayjs | null;
  startTime: Dayjs | null;
  duration: number;
  testLink: string;
}

export default function ExamRegistrationsTest() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);
  const [testSchedule, setTestSchedule] = useState<TestSchedule>({
    startDate: null,
    startTime: null,
    duration: 60, // Default 60 minutes
    testLink: ''
  });
  const [sendEmail, setSendEmail] = useState(true);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      const response = await databases.listDocuments<Registration>(
        DATABASE_ID,
        EXAM_REGISTRATIONS_COLLECTION_ID
      );
      setRegistrations(response.documents as Registration[]);
    } catch (err) {
      console.error('Error fetching registrations:', err);
      setError('Failed to fetch registrations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const handleSendTestLink = async () => {
    if (!testSchedule.startDate || !testSchedule.startTime || !testSchedule.duration || !selectedRegistration) {
      message.error('Please fill in all fields');
      return;
    }

    try {
      const startDateTime = dayjs(testSchedule.startDate)
        .set('hour', testSchedule.startTime.hour())
        .set('minute', testSchedule.startTime.minute())
        .set('second', 0);
      
      const expiryDateTime = startDateTime.add(testSchedule.duration, 'minute').toISOString();
      const testLink = generateTestLink(selectedRegistration.$id, selectedRegistration.email);

      // Update the registration status
      // First, get the current document to see its structure
      const currentDoc = await databases.getDocument(
        DATABASE_ID,
        EXAM_REGISTRATIONS_COLLECTION_ID,
        selectedRegistration.$id
      );
      
      console.log('Current document structure:', currentDoc);
      
      // Create update object with only the fields we want to update
      const updateData: Record<string, any> = {
        // Only include fields that exist in the document
        ...(currentDoc.status !== undefined && { status: 'scheduled' }),
        testLink: testLink,
        testStartTime: startDateTime.toISOString(),
        testEndTime: expiryDateTime,
        testSentAt: new Date().toISOString(),
        testDuration: testSchedule.duration
      };
      
      console.log('Updating with data:', updateData);
      
      // Update the document with only the fields we want to change
      await databases.updateDocument(
        DATABASE_ID,
        EXAM_REGISTRATIONS_COLLECTION_ID,
        selectedRegistration.$id,
        updateData
      );

      // Send email if enabled
      if (sendEmail) {
        const emailSent = await sendTestInvitation(
          selectedRegistration,
          testLink,
          startDateTime.toISOString(),
          testSchedule.duration
        );
        
        if (emailSent) {
          // Update status to indicate email was sent
await databases.updateDocument(
            DATABASE_ID,
            EXAM_REGISTRATIONS_COLLECTION_ID,
            selectedRegistration.$id,
            { emailSent: true }
          );
        }
      }

      message.success(`Test scheduled successfully${sendEmail ? ' and invitation sent' : ''}`);
      setIsModalVisible(false);
      
      // Refresh the registrations list
      await fetchRegistrations();
    } catch (error) {
      console.error('Error scheduling test:', error);
      message.error('Failed to schedule test');
    }
  };

  const handleOpenModal = (record: Registration) => {
    setSelectedRegistration(record);
    setTestSchedule({
      startDate: null,
      startTime: null,
      duration: 60,
      testLink: generateTestLink(record.$id, record.email)
    });
    setIsModalVisible(true);
  };

  const columns: ColumnsType<Registration> = [
    {
      title: 'Name',
      dataIndex: 'full_name',
      key: 'full_name',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'scheduled' ? 'green' : status === 'pending' ? 'yellow' : 'gray'}>
          {status || 'unknown'}
        </Tag>
      ),
    },
    {
      title: 'Scheduled At',
      dataIndex: 'scheduled_at',
      key: 'scheduled_at',
      render: (scheduledAt: string) => (
        scheduledAt ? new Date(scheduledAt).toLocaleString() : 'Not scheduled'
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: any) => (
        <Space size="middle">
          <Button 
            type="primary"
            onClick={() => handleOpenModal(record)}
            size="small"
          >
            Schedule Tes
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Exam Registrations</h1>
        <Button 
          type="primary" 
          onClick={fetchRegistrations}
          loading={loading}
        >
          Refresh
        </Button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div>Loading registrations...</div>
      ) : (
        <Table 
          columns={columns} 
          dataSource={registrations} 
          rowKey="$id"
          pagination={{ pageSize: 10 }}
        />
      )}

      <Modal
        title="Schedule Test"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsModalVisible(false)}>
            Cancel
          </Button>,
          <Button 
            key="submit" 
            type="primary" 
            onClick={handleSendTestLink}
            disabled={!testSchedule.startDate || !testSchedule.startTime}
          >
            Schedule Test
          </Button>
        ]}
      >
        {selectedRegistration && (
          <div className="space-y-4">
            <div>
              <p className="font-medium">Student: {selectedRegistration.full_name}</p>
              <p>Email: {selectedRegistration.email}</p>
            </div>
            
            <div>
              <label className="block mb-2">Test Start Date</label>
              <DatePicker 
                value={testSchedule.startDate}
                onChange={(date) => setTestSchedule({...testSchedule, startDate: date})}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block mb-2">Test Start Time</label>
              <TimePicker 
                value={testSchedule.startTime}
                onChange={(time) => setTestSchedule({...testSchedule, startTime: time})}
                className="w-full"
                format="h:mm A"
              />
            </div>
            
            <div>
              <label className="block mb-2">Test Duration</label>
              <Select
                value={testSchedule.duration}
                onChange={(value) => setTestSchedule({...testSchedule, duration: value})}
                className="w-full mb-4"
                options={[
                  { value: 30, label: '30 minutes' },
                  { value: 60, label: '1 hour' },
                  { value: 90, label: '1.5 hours' },
                  { value: 120, label: '2 hours' },
                ]}
              />
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span className="text-sm font-medium">Send Email Notification</span>
                <Switch 
                  checked={sendEmail} 
                  onChange={(checked) => setSendEmail(checked)}
                  checkedChildren="Yes"
                  unCheckedChildren="No"
                />
              </div>
            </div>
            
            {testSchedule.startDate && testSchedule.startTime && (
              <div className="mt-2 p-3 bg-blue-50 rounded-md">
                <p className="text-sm text-blue-800 font-medium">Test Schedule:</p>
                <div className="mt-1 text-sm text-blue-700">
                  <p>• Starts: {testSchedule.startDate.format('MMM D, YYYY')} at {testSchedule.startTime.format('h:mm A')}</p>
                  <p>• Ends: {testSchedule.startDate.format('MMM D, YYYY')} at {
                    testSchedule.startTime.add(testSchedule.duration, 'minute').format('h:mm A')
                  }</p>
                  <p>• Duration: {testSchedule.duration} minutes</p>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
