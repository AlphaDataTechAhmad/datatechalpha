import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Card,
  Form,
  Input,
  Button,
  InputNumber,
  Select,
  Space,
  message,
  Typography,
  Row,
  Col
} from 'antd';

const { Title, Text } = Typography;
const { Option } = Select;
import {
  PlusOutlined,
  DeleteOutlined,
  SaveOutlined,
  MinusCircleOutlined
} from '@ant-design/icons';
import * as pdfjsLib from 'pdfjs-dist';

// Set the worker source path
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

import { v4 as uuidv4 } from 'uuid';
import { useAuth } from "../../contexts/AuthContext";
import { createTest, updateTest, getTestById } from '../../Services/testService';
import ShareExamLink from '../test/ShareExamLink';

interface OptionType {
  id: string | number;
  text: string;
  hindiText?: string;
}

interface QuestionType {
  id: string | number;
  text: string;
  type: string;
  points: number;
  options: OptionType[];
  correctAnswer: number;
  explanation?: string;
}

interface SectionType {
  id?: string;
  name: string;
  description?: string;
  questions: QuestionType[];
}

interface TestFormValues {
  title: string;
  description: string;
  duration: number;
  passingScore: number;
  category: string;
  negativeMarking: number;
  instructions: string[];
  questions: QuestionType[];
  sections: SectionType[];
}

const TEST_CATEGORIES = [
  'SSC',
  'Banking',
  'Programming',
  'Apptitude',
  'AMCAT',
  'GS'
];

const TestForm: React.FC = () => {
  const [form] = Form.useForm<TestFormValues>();
  const [loading, setLoading] = useState(false);
  // PDF upload state and handlers are kept for future use
  const [_, setIsProcessingPdf] = useState(false);
  const [__, setPdfFile] = useState<File | null>(null);
  const { user } = useAuth() || { user: null };
  const navigate = useNavigate();
  const { id: testId } = useParams<{ id: string }>();
  const isEditing = !!testId;

  const addQuestion = () => {
    const questions = form.getFieldValue('questions') || [];
    form.setFieldsValue({
      questions: [
        ...questions,
        {
          id: uuidv4(),
          text: '',
          type: 'multiple-choice',
          points: 1,
          options: [
            { id: uuidv4(), text: '', hindiText: '' },
            { id: uuidv4(), text: '', hindiText: '' }
          ],
          correctAnswer: 0,
          explanation: ''
        }
      ]
    });
  };

  useEffect(() => {
    const fetchTestData = async () => {
      if (isEditing && testId) {
        try {
          setLoading(true);
          const test = await getTestById(testId);

          if (test) {
            const formattedTest = {
              ...test,
              questions: Array.isArray(test.questions)
                ? test.questions
                : JSON.parse(test.questions || '[]'),
              sections: Array.isArray(test.sections)
                ? test.sections
                : JSON.parse(test.sections || '[]')
            };

            form.setFieldsValue(formattedTest);
          }
        } catch (error) {
          console.error('Error loading test data:', error);
          message.error('Failed to load test data');
        } finally {
          setLoading(false);
        }
      }
    };

    fetchTestData();
  }, [isEditing, testId, form]);

  const extractTextFromPdf = async (file: File): Promise<string> => {
    try {
      console.log('Starting PDF text extraction...');
      const arrayBuffer = await file.arrayBuffer();

      const loadingTask = pdfjsLib.getDocument(new Uint8Array(arrayBuffer));
      const pdf = await loadingTask.promise;
      console.log(`PDF loaded with ${pdf.numPages} pages`);

      let fullText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        console.log(`Processing page ${i} / ${pdf.numPages}...`);
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        console.log(`Page ${i} has ${textContent.items.length} text items`);

        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();

        console.log(`Page ${i} text sample:`, pageText.substring(0, 100) + '...');
        fullText += pageText + '\n\n';
      }

      console.log('Full extracted text length:', fullText.length, 'characters');
      return fullText.trim();
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      throw new Error('Failed to extract text from PDF: ' + (error as Error).message);
    }
  };

  const parseQuestionsFromText = (text: string): QuestionType[] => {
    console.log('Starting to parse questions from text...');
    const questions: QuestionType[] = [];

    // Split text into potential question blocks
    const questionBlocks = text.split(/(?=Q\.\s*\d+|Question\s*\d+|\d+\.|\d+\))/i);

    for (const block of questionBlocks) {
      try {
        if (!block.trim()) continue;

        // Extract question text (remove question number)
        const questionText = block
          .replace(/^(?:Q\s*[.:)]?\s*\d+[.:)]?|\d+[.)])\s*/i, '')
          .replace(/^Question\s*\d+[.:)]?\s*/i, '')
          .split(/\n/)[0]
          .trim();

        if (!questionText) continue;

        const options: OptionType[] = [];
        let correctAnswer = 0;

        // Try to find options
        const optionMatches = block.matchAll(/\(\s*([a-zA-Z])\s*\)\s*([^\n]+)/g);
        for (const match of optionMatches) {
          options.push({
            id: uuidv4(),
            text: match[2]?.trim() || '',
            hindiText: ''
          });
        }

        // If not enough options found, try alternative patterns
        if (options.length < 2) {
          const altOptionMatches = block.matchAll(/^\s*([a-zA-Z])[.)]\s*([^\n]+)/gm);
          for (const match of altOptionMatches) {
            options.push({
              id: uuidv4(),
              text: match[2]?.trim() || '',
              hindiText: ''
            });
          }
        }

        // Try to find correct answer
        const answerMatch = block.match(/(?:answer|correct)[\s:]*\(?([a-zA-Z])\)?/i);
        if (answerMatch) {
          const answerLetter = answerMatch[1].toLowerCase();
          correctAnswer = answerLetter.charCodeAt(0) - 'a'.charCodeAt(0);
        }

        if (questionText && options.length >= 2) {
          questions.push({
            id: uuidv4(),
            text: questionText,
            type: 'multiple-choice',
            points: 1,
            options,
            correctAnswer,
            explanation: ''
          });
        }
      } catch (error) {
        console.warn('Error parsing question block:', error, block);
        continue;
      }
    }

    console.log('Parsed questions:', questions);
    return questions;
  };

  const processPdfFile = async (file: File) => {
    const hideLoading = message.loading('Processing PDF...', 0);
    setIsProcessingPdf(true);

    try {
      if (!file.type.includes('pdf')) {
        message.error('Please upload a valid PDF file');
        return false;
      }

      const text = await extractTextFromPdf(file);
      const parsedQuestions = parseQuestionsFromText(text);

      if (parsedQuestions.length > 0) {
        const currentQuestions = form.getFieldValue('questions') || [];
        form.setFieldsValue({
          questions: [...currentQuestions, ...parsedQuestions]
        });
        message.success(`Successfully parsed ${parsedQuestions.length} questions from PDF`);
      } else {
        message.warning('No questions found in the PDF. Please check the format.');
      }
    } catch (error) {
      console.error('Error processing PDF:', error);
      message.error('Failed to process PDF. Please try again.');
    } finally {
      hideLoading();
      setIsProcessingPdf(false);
    }
    return false;
  };

  const onSubmit = async (values: TestFormValues) => {
    try {
      setLoading(true);

      if (!user) {
        message.error('User not authenticated');
        return;
      }

      const testData = {
        title: values.title.trim(),
        description: values.description.trim(),
        duration: Number(values.duration) || 30,
        passingScore: Number(values.passingScore) || 50,
        category: values.category,
        courseId: 'default-course-id',
        negativeMarking: values.negativeMarking || 0,
        instructions: Array.isArray(values.instructions)
          ? values.instructions.map(i => i.trim()).filter(Boolean)
          : [],
        questions: values.questions.map(question => ({
          id: question.id || uuidv4(),
          text: question.text,
          type: question.type || 'multiple-choice',
          points: question.points || 1,
          options: question.options || [],
          correctAnswer: question.correctAnswer || 0,
          explanation: question.explanation || ''
        })),
        sections: (values.sections || []).map(section => ({
          id: section.id || uuidv4(),
          name: section.name || 'Default Section',
          description: section.description || '',
          questions: section.questions || []
        }))
      };

      if (isEditing && testId) {
        await updateTest(testId, testData, user.$id);
        message.success('Test updated successfully');
      } else {
        await createTest(testData, user.$id);
        message.success('Test created successfully');
      }

      navigate('/admin/tests');
    } catch (error) {
      console.error('Error saving test:', error);
      message.error('Failed to save test. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // PDF upload props are kept for future use
  // @ts-ignore - Keeping for future use
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const uploadProps = {
    name: 'file',
    multiple: false,
    accept: '.pdf',
    maxCount: 1,
    fileList: [] as any[],
    beforeUpload: (file: File) => {
      setPdfFile(file);
      processPdfFile(file);
      return false;
    },
    onRemove: () => {
      setPdfFile(null);
      return true;
    }
  };

  return (
    <div className="test-form">
      <Title level={2} style={{ marginBottom: '24px' }}>
        {isEditing ? 'Edit Test' : 'Create New Test'}
      </Title>

      <Form
        form={form}
        layout="vertical"
        onFinish={onSubmit}
        initialValues={{
          title: '',
          description: '',
          duration: 60,
          passingScore: 60,
          category: '',
          negativeMarking: 0,
          instructions: [],
          questions: [],
          sections: []
        }}
      >
        <Card title="Test Details" style={{ marginBottom: '24px' }}>
        {isEditing && testId && (
          <div style={{ marginBottom: '24px' }}>
            <ShareExamLink testId={testId} />
          </div>
        )}
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Form.Item
                label="Test Title"
                name="title"
                rules={[{ required: true, message: 'Please enter a test title' }]}
              >
                <Input placeholder="Enter test title" />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item
                label="Description"
                name="description"
              >
                <Input.TextArea rows={3} placeholder="Enter test description" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Form.Item
                label="Duration (minutes)"
                name="duration"
                rules={[{ required: true, message: 'Please enter test duration' }]}
              >
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Form.Item
                label="Passing Score (%)"
                name="passingScore"
                rules={[{ required: true, message: 'Please enter passing score' }]}
              >
                <InputNumber min={1} max={100} style={{ width: '100%' }} />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Form.Item
                label="Negative Marking"
                name="negativeMarking"
                tooltip="Points to deduct for each wrong answer"
              >
                <InputNumber min={0} step={0.25} style={{ width: '100%' }} />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Form.Item
                label="Category"
                name="category"
                rules={[{ required: true, message: 'Please select a category' }]}
              >
                <Select placeholder="Select a category" style={{ width: '100%' }}>
                  {TEST_CATEGORIES.map(category => (
                    <Select.Option key={category} value={category}>
                      {category}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item
                label="Instructions"
                name="instructions"
              >
                <Form.List name="instructions">
                  {(fields, { add, remove }) => (
                    <>
                      {fields.map(({ key, name, ...restField }) => (
                        <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                          <Form.Item
                            {...restField}
                            name={[name]}
                            style={{ marginBottom: 0, flex: 1 }}
                            rules={[{ required: true, message: 'Instruction is required' }]}
                          >
                            <Input placeholder="Enter instruction" />
                          </Form.Item>
                          <MinusCircleOutlined onClick={() => remove(name)} />
                        </Space>
                      ))}
                      <Form.Item>
                        <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                          Add Instruction
                        </Button>
                      </Form.Item>
                    </>
                  )}
                </Form.List>
              </Form.Item>
            </Col>
          </Row>

          {/* PDF Upload temporarily removed from UI
          <Form.Item
            label="Upload Questions from PDF"
            extra="Upload a PDF containing questions and answers to automatically parse them"
          >
            <Upload
              {...uploadProps}
              disabled={isProcessingPdf}
            >
              <Button icon={<UploadOutlined />} loading={isProcessingPdf}>
                {isProcessingPdf ? 'Processing PDF...' : 'Upload PDF'}
              </Button>
            </Upload>
          </Form.Item>
          */}
        </Card>

        <Card
          title="Questions"
          style={{ marginBottom: '24px' }}
          extra={
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={addQuestion}
            >
              Add Question
            </Button>
          }
        >
          <Form.List name="questions">
            {(fields, { add, remove }) => (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {fields.map(({ key, name, ...restField }) => {
                  const question = form.getFieldValue(['questions', name]);
                  return (
                    <Card
                      key={key}
                      type="inner"
                      title={`Question ${name + 1}`}
                      extra={
                        <Button 
                          type="text" 
                          danger 
                          icon={<DeleteOutlined />}
                          onClick={() => remove(name)}
                        />
                      }
                    >
                      <Form.Item
                        {...restField}
                        name={[name, 'text']}
                        label="Question Text"
                        rules={[{ required: true, message: 'Question text is required' }]}
                      >
                        <Input.TextArea rows={2} placeholder="Enter question text" />
                      </Form.Item>

                      <Form.Item
                        {...restField}
                        name={[name, 'points']}
                        label="Points"
                        initialValue={1}
                      >
                        <InputNumber min={1} />
                      </Form.Item>

                      <Form.Item
                        label="Options"
                        required
                      >
                        <Form.List name={[name, 'options']}>
                          {(optionFields, { add: addOption, remove: removeOption }) => (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                              {optionFields.map(({ key: optionKey, name: optionName, ...optionRestField }) => (
                                <Space key={optionKey} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                                  <Form.Item
                                    {...optionRestField}
                                    name={[optionName, 'text']}
                                    rules={[{ required: true, message: 'Option text is required' }]}
                                    style={{ marginBottom: 0, flex: 1 }}
                                  >
                                    <Input placeholder={`Option ${String.fromCharCode(97 + optionName).toUpperCase()}`} />
                                  </Form.Item>
                                  <Button
                                    type="text"
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={() => removeOption(optionName)}
                                  />
                                </Space>
                              ))}
                              <Button
                                type="dashed"
                                onClick={() => addOption({ id: uuidv4(), text: '', hindiText: '' })}
                                block
                                icon={<PlusOutlined />}
                              >
                                Add Option
                              </Button>
                            </div>
                          )}
                        </Form.List>
                      </Form.Item>

                      <Form.Item
                        {...restField}
                        name={[name, 'correctAnswer']}
                        label="Correct Answer"
                        rules={[{ required: true, message: 'Please select the correct answer' }]}
                      >
                        <Select placeholder="Select correct answer">
                          {['A', 'B', 'C', 'D', 'E'].map((letter, index) => {
                            const isDisabled = question?.options?.length ? index >= question.options.length : true;
                            return (
                              <Option key={index} value={index} disabled={isDisabled}>
                                {letter}
                              </Option>
                            );
                          })}
                        </Select>
                      </Form.Item>

                      <Form.Item
                        {...restField}
                        name={[name, 'explanation']}
                        label="Explanation"
                      >
                        <Input.TextArea rows={2} placeholder="Enter explanation (optional)" />
                      </Form.Item>
                    </Card>
                  );
                })}

                {fields.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '24px', border: '1px dashed #d9d9d9', borderRadius: '2px' }}>
                    <Text type="secondary">No questions added yet</Text>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => add()}
                      style={{ marginTop: '16px' }}
                    >
                      Add First Question
                    </Button>
                  </div>
                )}
              </div>
            )}
          </Form.List>
        </Card>

        <div style={{ textAlign: 'right', marginTop: '24px' }}>
          <Button
            type="primary"
            htmlType="submit"
            icon={<SaveOutlined />}
            loading={loading}
            size="large"
          >
            {isEditing ? 'Update Test' : 'Create Test'}
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default TestForm;