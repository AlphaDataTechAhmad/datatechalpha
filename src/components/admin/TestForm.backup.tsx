import React, { useState } from 'react';
import { Card, Form, message, Upload } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import * as pdfjsLib from 'pdfjs-dist';

// Set PDF.js worker path
if (typeof window !== 'undefined') {
  // @ts-ignore - pdfjsLib types don't include the worker property
  window.pdfjsWorker = pdfjsLib;
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

interface ParsedQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

const TestForm: React.FC = () => {
  const [form] = Form.useForm();
  const [isProcessing, setIsProcessing] = useState(false);

  // Extract text from PDF file
  const extractTextFromPdf = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
      let fullText = '';
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const strings = textContent.items.map(item => (item as any).str);
        fullText += strings.join(' ') + '\n';
      }
      
      return fullText;
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      throw new Error('Failed to extract text from PDF');
    }
  };

  // Parse questions from extracted text
  const parseQuestionsFromText = (text: string): ParsedQuestion[] => {
    // Simple regex to find questions and options
    // This is a basic implementation - you might need to adjust based on your PDF format
    const questionRegex = /(\d+\..+?)(?=\d+\.|$)/gs;
    const optionRegex = /^[a-d]\)\s*(.+)$/im;
    
    const questions: ParsedQuestion[] = [];
    let match;
    
    while ((match = questionRegex.exec(text)) !== null) {
      const questionText = match[1].trim();
      const options: string[] = [];
      
      // Extract options (a, b, c, d)
      const optionLines = questionText.split('\n');
      const question = optionLines[0];
      
      for (let i = 1; i < optionLines.length; i++) {
        const optionMatch = optionLines[i].match(optionRegex);
        if (optionMatch) {
          options.push(optionMatch[1]);
        }
      }
      
      if (question && options.length >= 2) {
        questions.push({
          question,
          options,
          correctAnswer: 0, // Default to first option as correct
          explanation: ''
        });
      }
    }
    
    return questions;
  };

  // Handle PDF file upload
  const handlePdfUpload = async (file: File) => {
    try {
      setIsProcessing(true);
      message.loading('Processing PDF...', 0);
      
      // Extract text from PDF
      const text = await extractTextFromPdf(file);
      
      // Parse questions from text
      const questions = parseQuestionsFromText(text);
      
      if (questions.length > 0) {
        // Update form with parsed questions
        form.setFieldsValue({ questions });
        message.success(`Successfully parsed ${questions.length} questions from PDF`);
      } else {
        message.warning('No questions found in the PDF');
      }
      
      return false; // Prevent default upload
    } catch (error) {
      console.error('Error processing PDF:', error);
      message.error('Failed to process PDF. Please try again.');
      return false;
    } finally {
      message.destroy();
      setIsProcessing(false);
    }
  };

  // Upload props for Ant Design Upload component
  const uploadProps = {
    beforeUpload: (file: File) => {
      if (file.type !== 'application/pdf') {
        message.error('You can only upload PDF files!');
        return Upload.LIST_IGNORE;
      }
      handlePdfUpload(file);
      return false; // Prevent default upload
    },
    showUploadList: false,
    accept: '.pdf',
  };

  return (
    <Card title="Upload Test Questions" style={{ maxWidth: 800, margin: '0 auto' }}>
      <Form form={form} layout="vertical">
        <Form.Item
          label="Upload PDF with Questions"
          extra="Upload a PDF containing multiple choice questions"
        >
          <Upload.Dragger {...uploadProps}>
            <p className="ant-upload-drag-icon">
              <UploadOutlined />
            </p>
            <p className="ant-upload-text">Click or drag PDF to this area to upload</p>
            <p className="ant-upload-hint">
              {isProcessing ? 'Processing...' : 'Support for a single PDF file only'}
            </p>
          </Upload.Dragger>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default TestForm;
          if (questions.length > 0) break;
        }
      }

      console.log(`Found ${questions.length} questions in the text`);
      
      // If no questions found with the regex, try to split the text into questions
      if (questions.length === 0) {
        console.log('No questions found with regex, trying to split text...');
        const questionSplits = text.split(/\n\s*\d+[.)]\s*/).filter(q => q.trim().length > 0);
        
        questionSplits.forEach((qText) => {
          if (qText.trim().length > 10) { // Minimum question length
            questions.push({
              question: qText.split('\n')[0].trim(),
              options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
              correctAnswer: 0
            });
          }
        });
      }
      
      return questions;
    } catch (error) {
      console.error('Error parsing questions from text:', error);
      throw new Error(`Failed to parse questions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // PDF upload handler
  const handlePdfUpload = async (file: File) => {
    try {
      setIsProcessingPdf(true);
      const text = await parsePdfText(file);
      
      // Parse questions from text
      const parsedQuestions = parseQuestionsFromText(text);
      
      if (Array.isArray(parsedQuestions) && parsedQuestions.length > 0) {
        // Get current questions from form
        const currentQuestions: FormQuestion[] = form.getFieldValue('questions') || [];
        
        // Map parsed questions to form questions
        const newQuestions: FormQuestion[] = parsedQuestions.map((q: ParsedQuestion) => ({
          id: uuid(),
          text: q.question,
          type: q.type || 'multiple-choice',
          points: q.points || 1,
          options: q.options.map((opt: string, optIndex: number) => ({
            id: optIndex,
            text: opt,
            hindiText: ''
          })),
          explanation: q.explanation || '',
          correctAnswer: q.correctAnswer || 0
        }));
        
        // Update form with new questions
        const updatedQuestions = [...currentQuestions, ...newQuestions];
        form.setFieldsValue({ questions: updatedQuestions });
        
        setFoundQuestions(updatedQuestions);
        antdMessage.success(`Successfully parsed ${newQuestions.length} questions from PDF`);
      } else {
        antdMessage.warning('No questions found in the PDF');
      }
    } catch (error) {
      console.error('Error processing PDF:', error);
      antdMessage.error('Failed to process PDF. Please try again.');
    } finally {
      setIsProcessingPdf(false);
    }
    return false; // Prevent default upload
  };

  const handleFormSubmit = async (values: TestFormValues) => {
    if (!user) {
      message.error('You must be logged in to save tests');
      return;
    }

    try {
      setLoading(true);
      
      // Ensure questions array exists
      const questions = values.questions || [];
      
      const testData = {
        ...values,
        userId: user.$id,
        questions: questions.map((q, index) => {
          // Generate a numeric ID if not present
          const questionId = q.id ? parseInt(q.id.toString(), 10) || Date.now() + index : Date.now() + index;
          
          return {
            id: questionId,
            text: q.text,
            question: q.text, // Required by TestQuestion interface
            type: q.type || 'multiple-choice',
            points: q.points || 1,
            options: q.options.map((opt, optIndex) => {
              // Generate a numeric ID for each option
              const optionId = opt.id ? parseInt(opt.id.toString(), 10) || Date.now() + index + optIndex : Date.now() + index + optIndex;
              return {
                id: optionId,
                text: opt.text,
                hindiText: opt.hindiText || ''
              };
            }),
            correctAnswer: q.correctAnswer,
            explanation: q.explanation || '',
            marked: false, // Required by TestQuestion interface
            answers: [], // Required by TestQuestion interface
            userAnswer: null,
            isCorrect: false,
            timeSpent: 0,
            // Add any other required fields from TestQuestion interface
            questionType: 'multiple-choice',
            hint: '',
            solution: ''
          };
        }),
        instructions: Array.isArray(values.instructions) 
          ? values.instructions 
          : values.instructions?.split('\n').filter(Boolean) || []
      };

      if (isEditing && testId) {
        // Update test with required parameters
        await updateTest(
          testId,
          testData,
          user?.$id || ''
        );
        message.success('Test updated successfully');
      } else if (user?.$id) {
        // Create new test with user ID
        await createTest(testData, user.$id);
        message.success('Test created successfully');
      } else {
        throw new Error('User not authenticated');
      }
      
      navigate('/admin/tests');
    } catch (error) {
      console.error('Error saving test:', error);
      message.error('Failed to save test. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const processPdf = async () => {
    if (!pdfFile) {
      console.log('No PDF file selected');
      antdMessage.warning('Please select a PDF file first');
      return;
    }
    
    try {
      setIsProcessingPdf(true);
      antdMessage.loading('Processing PDF and extracting text...', 0);
      
      console.log('Starting PDF processing for file:', pdfFile.name);
      
      // Step 1: Extract text from PDF
      console.log('Extracting text from PDF...');
      const extractedText = await parsePdfText(pdfFile);
      console.log('Text extraction complete. Length:', extractedText.length);
      
      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error('No text could be extracted from the PDF');
      }
      
      // Step 2: Parse questions from extracted text
      console.log('Parsing questions from extracted text...');
      const parsedQuestions = parseQuestionsFromText(extractedText);
      console.log('Question parsing complete. Found questions:', parsedQuestions.length);
      
      if (Array.isArray(parsedQuestions) && parsedQuestions.length > 0) {
        const currentQuestions = form.getFieldValue('questions') || [];
        
        const newQuestions = parsedQuestions.map((q: ParsedQuestion) => ({
          id: uuid(),
          text: q.question,
          type: 'multiple-choice',
          points: 1,
          options: q.options.map((opt: string, i: number) => ({
            id: i,
            text: opt,
            hindiText: ''
          })),
          correctAnswer: q.correctAnswer || 0,
          explanation: q.explanation || ''
        }));
        
        // Update form with new questions
        const updatedQuestions = [...currentQuestions, ...newQuestions];
        form.setFieldsValue({ questions: updatedQuestions });
        setFoundQuestions(updatedQuestions);
        
        antdMessage.success(`Successfully imported ${newQuestions.length} questions from PDF`);
      } else {
        console.warn('No questions were extracted from the PDF');
        antdMessage.info('PDF processed, but no questions were automatically extracted');
      }
      
    } catch (error) {
      console.error('Error in processPdf:', error);
      antdMessage.error(
        error instanceof Error 
          ? `Failed to process PDF: ${error.message}`
          : 'Failed to process PDF. Please try again or upload a different file.'
      );
    } finally {
      setIsProcessingPdf(false);
      setPdfFile(null);
      antdMessage.destroy();
    }

const processPdf = async () => {
if (!pdfFile) {
  console.log('No PDF file selected');
  antdMessage.warning('Please select a PDF file first');
  return;
}
  
try {
  setIsProcessingPdf(true);
  antdMessage.loading('Processing PDF and extracting text...', 0);
  
  console.log('Starting PDF processing for file:', pdfFile.name);
  
  // Step 1: Extract text from PDF
  console.log('Extracting text from PDF...');
  const extractedText = await parsePdfText(pdfFile);
  console.log('Text extraction complete. Length:', extractedText.length);
  
  if (!extractedText || extractedText.trim().length === 0) {
    throw new Error('No text could be extracted from the PDF');
  }
  
  // Step 2: Parse questions from extracted text
  console.log('Parsing questions from extracted text...');
  const parsedQuestions = parseQuestionsFromText(extractedText);
  console.log('Question parsing complete. Found questions:', parsedQuestions.length);
  
  if (Array.isArray(parsedQuestions) && parsedQuestions.length > 0) {
    const currentQuestions = form.getFieldValue('questions') || [];
    
    const newQuestions = parsedQuestions.map((q: ParsedQuestion) => ({
      id: uuid(),
      text: q.question,
      type: 'multiple-choice',
      points: 1,
      options: q.options.map((opt: string, i: number) => ({
        id: i,
        text: opt,
        hindiText: ''
      })),
      correctAnswer: q.correctAnswer || 0,
      explanation: q.explanation || ''
    }));
    
    // Update form with new questions
    const updatedQuestions = [...currentQuestions, ...newQuestions];
    form.setFieldsValue({ questions: updatedQuestions });
    setFoundQuestions(updatedQuestions);
    
    antdMessage.success(`Successfully imported ${newQuestions.length} questions from PDF`);
  } else {
    console.warn('No questions were extracted from the PDF');
    antdMessage.info('PDF processed, but no questions were automatically extracted');
  }
  
} catch (error) {
  console.error('Error in processPdf:', error);
  antdMessage.error(
    error instanceof Error 
      ? `Failed to process PDF: ${error.message}`
      : 'Failed to process PDF. Please try again or upload a different file.'
  );
} finally {
  setIsProcessingPdf(false);
  setPdfFile(null);
  antdMessage.destroy();
}
};

const uploadProps = {
beforeUpload: (file: File) => {
  if (file.type !== 'application/pdf') {
    antdMessage.error('You can only upload PDF files!');
    return Upload.LIST_IGNORE;
  }
  setPdfFile(file);
  return false; // Prevent auto-upload
},
fileList: pdfFile ? [pdfFile] : [],
accept: '.pdf',
multiple: false,
onChange: (info: any) => {
  if (info.file.status === 'done') {
    antdMessage.success(`${info.file.name} file uploaded successfully`);
  } else if (info.file.status === 'error') {
    antdMessage.error(`${info.file.name} file upload failed.`);
  }
},
};
        title={isEditing ? 'Edit Test' : 'Create New Test'}
        className="test-form-card"
        loading={loading}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFormSubmit}
          initialValues={{
            instructions: ['Read all questions carefully before answering.', 'Each question carries equal marks.'],
            duration: 60,
            passingScore: 40,
            negativeMarking: 0,
            isPublic: true,
            questions: [],
          }}
        >
          <Form.Item
            label="Upload PDF (Optional)"
            help="Upload a PDF to automatically extract questions and options"
          >
            <Upload.Dragger {...uploadProps}>
              <p className="ant-upload-drag-icon">
                <UploadOutlined />
              </p>
              <p className="ant-upload-text">Click or drag PDF to upload</p>
              <p className="ant-upload-hint">
                {isProcessingPdf ? 'Processing PDF...' : 'Supports PDF files only'}
              </p>
            </Upload.Dragger>
          </Form.Item>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Form.Item
              label="Course"
              name="courseId"
              rules={[{ required: true, message: 'Please select a course!' }]}
            >
              <Select placeholder="Select a course">
                <Option value="6853c4200005a79f75b6">Python - Basic to Advance</Option>
                <Option value="6853c4d8000b1e0d9c9c">SQL - Complete Course</Option>
                <Option value="6853c4f30015c0d0b8f3">JavaScript - The Complete Guide</Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="Test Title"
              name="title"
              rules={[{ required: true, message: 'Please input the test title!' }]}
            >
              <Input placeholder="Enter test title" />
            </Form.Item>

            <Form.Item
              name="category"
              label="Category"
              rules={[{ required: true, message: 'Please select a category' }]}
            >
              <Select placeholder="Select category">
                {TEST_CATEGORIES.map(category => (
                  <Option key={category} value={category}>
                    {category}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </div>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please enter test description' }]}
          >
            <TextArea rows={3} placeholder="Enter test description" />
          </Form.Item>

          <Divider orientation="left">PDF Upload (Optional)</Divider>
          <Form.Item label="Upload PDF with Questions">
            <Upload
              accept=".pdf"
              maxCount={1}
              beforeUpload={(file) => {
                setPdfFile(file);
                return false;
              }}
              onRemove={() => {
                setPdfFile(null);
                return true;
              }}
            >
              <Button icon={<UploadOutlined />}>Select PDF</Button>
            </Upload>
            <Button 
              type="primary" 
              onClick={processPdf} 
              disabled={!pdfFile || isProcessingPdf}
              loading={isProcessingPdf}
              style={{ marginTop: 8 }}
            >
              {isProcessingPdf ? 'Processing...' : 'Extract Questions from PDF'}
            </Button>
            {isProcessingPdf && (
              <div style={{ marginTop: 16 }}>
                <Spin tip="Processing PDF and extracting questions..." />
                <p>This may take a few moments. Please wait...</p>
              </div>
            )}
          </Form.Item>

          <Divider orientation="left">Test Settings</Divider>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Form.Item
              name="duration"
              label="Duration (seconds)"
              rules={[{ required: true, message: 'Please enter duration' }]}
            >
              <InputNumber min={60} step={60} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="passingScore"
              label="Passing Score (%)"
              rules={[
                { required: true, message: 'Please enter passing score' },
                { type: 'number', min: 1, max: 100, message: 'Must be between 1 and 100' }
              ]}
            >
              <InputNumber min={1} max={100} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="negativeMarking"
              label="Negative Marking (per wrong answer)"
            >
              <InputNumber min={0} step={0.25} style={{ width: '100%' }} />
            </Form.Item>
          </div>

          <Form.Item
            name="instructions"
            label="Instructions (one per line)"
          >
            <TextArea 
              rows={4} 
              placeholder="Enter each instruction on a new line"
            />
          </Form.Item>

          <Divider orientation="left">Questions</Divider>
          
          <Form.List name="questions">
            {(fields, { add, remove }) => (
              <div style={{ display: 'flex', rowGap: 16, flexDirection: 'column' }}>
                {fields.map((field) => (
                  <Card
                    size="small"
                    title={`Question ${field.name + 1}`}
                    key={field.key}
                    extra={
                      <MinusCircleOutlined
                        onClick={() => remove(field.name)}
                      />
                    }
                  >
                    <Form.Item
                      label="Question Text"
                      name={[field.name, 'text']}
                      rules={[{ required: true, message: 'Please enter question text' }]}
                    >
                      <Input.TextArea placeholder="Enter question text" />
                    </Form.Item>

                    <Form.Item
                      label="Question Type"
                      name={[field.name, 'type']}
                      rules={[{ required: true, message: 'Please select question type' }]}
                    >
                      <Select placeholder="Select question type">
                        <Option value="multiple_choice">Multiple Choice</Option>
                        <Option value="true_false">True/False</Option>
                      </Select>
                    </Form.Item>

                    <Form.Item
                      label="Points"
                      name={[field.name, 'points']}
                      rules={[{ required: true, message: 'Please enter points' }]}
                    >
                      <InputNumber min={1} defaultValue={1} />
                    </Form.Item>

                    <Form.Item
                      label="Options"
                      style={{ marginBottom: 0 }}
                    >
                      <Form.List name={[field.name, 'options']}>
                        {(optionFields, { add: addOption, remove: removeOption }) => (
                          <div style={{ display: 'flex', flexDirection: 'column', rowGap: 16 }}>
                            {optionFields.map((optionField) => (
                              <div key={optionField.key} style={{ display: 'flex', gap: 8 }}>
                                <Form.Item
                                  noStyle
                                  name={[optionField.name, 'text']}
                                  rules={[{ required: true, message: 'Missing option text' }]}
                                >
                                  <Input placeholder="Option text" style={{ flex: 1 }} />
                                </Form.Item>
                                <Form.Item
                                  noStyle
                                  name={[optionField.name, 'hindiText']}
                                >
                                  <Input placeholder="Hindi text (optional)" style={{ flex: 1 }} />
                                </Form.Item>
                                <MinusCircleOutlined
                                  onClick={() => removeOption(optionField.name)}
                                />
                              </div>
                            ))}
                            <Button
                              type="dashed"
                              onClick={() => addOption()}
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
                      label="Correct Answer"
                      name={[field.name, 'correctAnswer']}
                      rules={[{ required: true, message: 'Please select correct answer' }]}
                    >
                      <Select placeholder="Select correct answer">
                        {(form.getFieldValue(['questions', field.name])?.options || []).map((_: any, index: number) => (
                          <Option key={index} value={index}>
                            Option {index + 1}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Card>
                ))}

                <Button
                  type="dashed"
                  onClick={() => add({
                    id: uuid(),
                    type: 'multiple_choice',
                    points: 1,
                    options: [],
                    correctAnswer: 0
                  })}
                  block
                  icon={<PlusOutlined />}
                >
                  Add Question
                </Button>
              </div>
            )}
          </Form.List>

          <Form.Item style={{ marginTop: 24 }}>
            <Button type="primary" htmlType="submit" loading={loading}>
              {isEditing ? 'Update Test' : 'Create Test'}
            </Button>
            <Button
              style={{ marginLeft: 8 }}
              onClick={() => navigate('/admin/tests')}
              disabled={loading}
            >
              Cancel
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default TestForm;