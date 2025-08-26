import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Card, Form, Input, Typography, message } from 'antd';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { Loader2 } from 'lucide-react';

const { Title } = Typography;

interface LoginFormValues {
  email: string;
  password: string;
}

const InternTest: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { user, login } = useAuth();
  const navigate = useNavigate();

  // Redirect to test if already authenticated
  useEffect(() => {
    if (user) {
      navigate('/test/web-development-internship', { replace: true });
    }
  }, [user, navigate]);

  const onFinish = async (values: LoginFormValues) => {
    setIsLoading(true);
    try {
      await login(values.email, values.password);
      // The useEffect will handle the redirect after successful login
    } catch (error) {
      console.error('Login failed:', error);
      message.error('Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <div className="text-center mb-6">
          <Title level={3}>Web Development Internship Test</Title>
          <p className="text-gray-600">Please login with your website credentials to start the test</p>
        </div>
        
        <Form
          name="login"
          className="login-form"
          initialValues={{ remember: true }}
          onFinish={onFinish}
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Please input your email!' },
              { type: 'email', message: 'Please enter a valid email address' }
            ]}
          >
            <Input
              prefix={<UserOutlined className="text-gray-400" />}
              placeholder="Email"
              size="large"
            />
          </Form.Item>
          
          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Please input your password!' }]}
          >
            <Input.Password
              prefix={<LockOutlined className="text-gray-400" />}
              type="password"
              placeholder="Password"
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              className="w-full"
              size="large"
              loading={isLoading}
            >
              Login & Start Test
            </Button>
          </Form.Item>
        </Form>
        
        <div className="text-center text-sm text-gray-500 mt-4">
          Don't have an account? Contact support for access
        </div>
      </Card>
    </div>
  );
};

export default InternTest;
