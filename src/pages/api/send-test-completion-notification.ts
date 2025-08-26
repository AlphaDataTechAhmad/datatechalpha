import { NextApiRequest, NextApiResponse } from 'next';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      userEmail,
      testName,
      score,
      totalMarks,
      percentage,
      passed,
      testId,
      userId
    } = req.body;

    // Send email to admin
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'Data Tech Alpha <noreply@datatechalpha.com>', // Replace with your verified sender
      to: ['admin@datatechalpha.com'], // Replace with admin email
      subject: `Test Submission: ${testName}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a365d;">New Test Submission</h2>
          <p>A user has completed the internship assessment test. Here are the details:</p>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p><strong>Test:</strong> ${testName}</p>
            <p><strong>User Email:</strong> ${userEmail}</p>
            <p><strong>User ID:</strong> ${userId}</p>
            <p><strong>Score:</strong> ${score} / ${totalMarks}</p>
            <p><strong>Percentage:</strong> ${percentage.toFixed(2)}%</p>
            <p><strong>Status:</strong> ${passed ? '✅ Passed' : '❌ Failed'}</p>
            <p><strong>Test ID:</strong> ${testId}</p>
            <p><strong>Completed At:</strong> ${new Date().toLocaleString()}</p>
          </div>
          
          <p>You can review the detailed results in the admin dashboard.</p>
          
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 0.9em; color: #718096;">
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      `,
    });

    if (emailError) {
      console.error('Error sending email:', emailError);
      return res.status(500).json({ error: 'Failed to send notification email' });
    }

    return res.status(200).json({ success: true, message: 'Notification sent successfully' });
  } catch (error) {
    console.error('Error in send-test-completion-notification:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
