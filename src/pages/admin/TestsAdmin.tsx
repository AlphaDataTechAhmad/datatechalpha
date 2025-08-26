import React from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, Row, Col } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import TestList from '../../components/admin/TestList';

const TestsAdmin: React.FC = () => {
  return (
    <div className="p-4">
      <Row justify="space-between" align="middle" className="mb-6">
        <Col>
          <h1 className="text-2xl font-bold">Test Management</h1>
          <p className="text-gray-600">Create and manage tests for your courses</p>
        </Col>
        <Col>
          <Link to="/admin/tests/new">
            <Button type="primary" icon={<PlusOutlined />} size="large">
              Create New Test
            </Button>
          </Link>
        </Col>
      </Row>
      
      <Card>
        <TestList />
      </Card>
    </div>
  );
};

export default TestsAdmin;
