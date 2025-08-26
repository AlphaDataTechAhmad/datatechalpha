import { useState } from 'react';
import { Button, Card, InputNumber, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useAuth } from '@/contexts/AuthContext';
import { generateRandomTest } from '@/utils/testGenerator';
import { useNavigate } from 'react-router-dom';

const GenerateRandomTest = () => {
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [loading, setLoading] = useState<boolean>(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleGenerateTest = async () => {
    if (!user) {
      message.error('Please log in to generate a test');
      return;
    }

    try {
      setLoading(true);
      const test = await generateRandomTest(user.$id, questionCount);
      message.success('Test generated successfully!');
      navigate(`/tests/take/${test.$id}`);
    } catch (error) {
      console.error('Error generating test:', error);
      message.error('Failed to generate test. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card 
      title="Generate Random Test" 
      className="max-w-md mx-auto mt-8"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Number of Questions (1-20)
          </label>
          <InputNumber
            min={1}
            max={20}
            value={questionCount}
            onChange={(value) => setQuestionCount(value || 10)}
            className="w-full"
          />
        </div>
        
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleGenerateTest}
          loading={loading}
          block
          size="large"
        >
          Generate Test
        </Button>
        
        <p className="text-sm text-gray-500 mt-2">
          This will create a test with {questionCount} random questions.
        </p>
      </div>
    </Card>
  );
};

export default GenerateRandomTest;
