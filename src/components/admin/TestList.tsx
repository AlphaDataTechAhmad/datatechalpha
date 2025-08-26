import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getAllTests, deleteTest, getTestsByCategory } from '../../Services/testService';
import { Button, Card, Table, Modal, message, Select, Input, Space } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';

const { Option } = Select;

const TestList: React.FC = () => {
  const { user } = useAuth();
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchText, setSearchText] = useState('');
  const [categories, setCategories] = useState<string[]>([]);

  // Load all tests
  useEffect(() => {
    loadTests();
  }, [selectedCategory, searchText]);

  const loadTests = async () => {
    try {
      setLoading(true);
      let data;
      
      if (selectedCategory === 'all') {
        data = await getAllTests();
      } else {
        data = await getTestsByCategory(selectedCategory);
      }
      
      // Filter by search text
      if (searchText) {
        const searchLower = searchText.toLowerCase();
        data = data.filter((test: any) => 
          test.title.toLowerCase().includes(searchLower) ||
          test.description.toLowerCase().includes(searchLower)
        );
      }
      
      setTests(data);
      
      // Extract unique categories
      const uniqueCategories = [...new Set(data.map((test: any) => test.category))];
      setCategories(uniqueCategories.filter(Boolean) as string[]);
      
    } catch (error) {
      console.error('Error loading tests:', error);
      message.error('Failed to load tests');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (testId: string) => {
    Modal.confirm({
      title: 'Are you sure you want to delete this test?',
      content: 'This action cannot be undone.',
      okText: 'Yes, delete it',
      okType: 'danger',
      cancelText: 'No, keep it',
      onOk: async () => {
        try {
          await deleteTest(testId);
          message.success('Test deleted successfully');
          loadTests();
        } catch (error) {
          console.error('Error deleting test:', error);
          message.error('Failed to delete test');
        }
      },
    });
  };

  const columns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: any) => (
        <Link to={`/admin/tests/edit/${record.$id}`}>
          {text}
        </Link>
      ),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
    },
    {
      title: 'Duration (mins)',
      dataIndex: 'duration',
      key: 'duration',
      render: (duration: number) => Math.floor(duration / 60),
    },
    {
      title: 'Passing Score',
      dataIndex: 'passingScore',
      key: 'passingScore',
      render: (score: number) => `${score}%`,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space size="middle">
          <Link to={`/admin/tests/edit/${record.$id}`}>
            <Button type="link" icon={<EditOutlined />} />
          </Link>
          <Button 
            type="link" 
            danger 
            icon={<DeleteOutlined />} 
            onClick={() => handleDelete(record.$id)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div className="test-list">
      <Card 
        title="Test Management" 
        extra={
          <Link to="/admin/tests/new">
            <Button type="primary" icon={<PlusOutlined />}>
              Create New Test
            </Button>
          </Link>
        }
      >
        <div style={{ marginBottom: 16 }}>
          <Space size="large">
            <Input
              placeholder="Search tests..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 250 }}
            />
            
            <Select
              defaultValue="all"
              style={{ width: 200 }}
              onChange={(value) => setSelectedCategory(value)}
              value={selectedCategory}
            >
              <Option value="all">All Categories</Option>
              {categories.map(category => (
                <Option key={category} value={category}>
                  {category}
                </Option>
              ))}
            </Select>
          </Space>
        </div>

        <Table 
          columns={columns} 
          dataSource={tests} 
          rowKey="$id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
};

export default TestList;
