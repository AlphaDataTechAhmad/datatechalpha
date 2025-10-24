import { databases, ID, Query } from './appwrite';
import { sendEmail } from './emailService';

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID || '68261b6a002ba6c3b584';
const TEST_RESULTS_COLLECTION = '684da84500159ddfea6f'; // Your test results collection ID
const USERS_COLLECTION = '68261b7b0026f8d8a4a6'; // Your users collection ID

interface TestResult {
  userId: string;
  testId: string;
  testName: string;
  score: number;
  totalMarks: number;
  percentage: number;
  userName: string;
  email: string;
  passed: boolean;
  // Add other fields as needed
}

/**
 * Process test completion and send appropriate emails
 * @param testResult The test result data
 */
export async function processTestCompletion(testResult: TestResult) {
  try {
    // Save the test result first
    const savedResult = await saveTestResult(testResult);
    
    // Send appropriate email based on the test score
    if (testResult.percentage >= 90) {
      await sendPassedTestEmail(testResult);
    } else {
      await sendFailedTestEmail(testResult);
    }
    
    return { success: true, result: savedResult };
  } catch (error) {
    console.error('Error processing test completion:', error);
    throw new Error('Failed to process test completion');
  }
}

/**
 * Save test result to the database
 */
async function saveTestResult(testResult: TestResult) {
  try {
    const result = await databases.createDocument(
      DATABASE_ID,
      TEST_RESULTS_COLLECTION,
      ID.unique(),
      {
        ...testResult,
        takenAt: new Date().toISOString(),
      }
    );
    return result;
  } catch (error) {
    console.error('Error saving test result:', error);
    throw error;
  }
}

/**
 * Send email to students who passed the test (≥90%)
 */
async function sendPassedTestEmail(testResult: TestResult) {
  const subject = '🎉 Congratulations! You Have Been Selected for Internship';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Congratulations, ${testResult.userName}!</h2>
      <p>We are pleased to inform you that you have successfully passed the ${testResult.testName} with an impressive score of ${testResult.percentage}%.</p>
      
      <h3>Your Test Results:</h3>
      <ul>
        <li>Score: ${testResult.score} out of ${testResult.totalMarks}</li>
        <li>Percentage: ${testResult.percentage}%</li>
      </ul>
      
      <p>🎯 <strong>Next Steps:</strong></p>
      <ol>
        <li>Log in to your Data Tech Alpha Internship Dashboard</li>
        <li>Check your internship details and schedule</li>
        <li>Attend the orientation session on your dashboard</li>
      </ol>
      
      <p>We look forward to having you on board for the internship program!</p>
      
      <p>Best regards,<br/>The Data Tech Alpha Team</p>
      
      <p style="font-size: 12px; color: #666; margin-top: 30px;">
        If you have any questions, please contact our support team at support@datatechalpha.com
      </p>
    </div>
  `;

  await sendEmail({
    to: testResult.email,
    subject,
    html,
  });
}

/**
 * Send email to students who didn't pass the test (<90%)
 */
async function sendFailedTestEmail(testResult: TestResult) {
  const subject = 'Your Test Results - Data Tech Alpha';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Hello ${testResult.userName},</h2>
      <p>Thank you for taking the time to complete the ${testResult.testName}.</p>
      
      <h3>Your Test Results:</h3>
      <ul>
        <li>Score: ${testResult.score} out of ${testResult.totalMarks}</li>
        <li>Percentage: ${testResult.percentage}%</li>
      </ul>
      
      <p>We regret to inform you that your score is below the required 90% to qualify for the free internship program.</p>
      
      <p>🌟 <strong>Don't worry! You still have options:</strong></p>
      <p>You can still join our internship program by paying a nominal fee of ₹949. This will give you access to all the training materials, mentorship, and certification.</p>
      
      <div style="text-align: center; margin: 25px 0;">
        <a href="https://datatechalpha.com/internship/enroll" 
           style="display: inline-block; padding: 12px 25px; background-color: #4CAF50; 
                  color: white; text-decoration: none; border-radius: 4px;">
          Pay ₹949 to Continue with Internship
        </a>
      </div>
      
      <p>If you have any questions about your test results or the payment process, please don't hesitate to contact our support team.</p>
      
      <p>Best regards,<br/>The Data Tech Alpha Team</p>
      
      <p style="font-size: 12px; color: #666; margin-top: 30px;">
        Contact us at support@datatechalpha.com for any assistance
      </p>
    </div>
  `;

  await sendEmail({
    to: testResult.email,
    subject,
    html,
  });
}
