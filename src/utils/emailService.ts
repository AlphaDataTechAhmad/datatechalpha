import { message } from 'antd';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendTestInvitation(
  registration: { full_name: string; email: string },
  testLink: string,
  startTime: string,
  duration: number
): Promise<boolean> {
  const emailOptions = createTestInvitationEmail(
    registration.full_name,
    testLink,
    startTime,
    duration
  );
  
  return sendEmail({
    ...emailOptions,
    to: registration.email
  });
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    // In a real app, you would call your email API here
    // This is a mock implementation that simulates an API call
    console.log('Sending email:', {
      to: options.to,
      subject: options.subject,
      // Don't log the full HTML content as it might be large
      html: options.html.length > 100 ? options.html.substring(0, 100) + '...' : options.html
    });

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // In a real app, you would have proper error handling here
    // For now, we'll just log a success message
    message.success('Email sent successfully');
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    message.error('Failed to send email');
    return false;
  }
}

export function createTestInvitationEmail(
  recipientName: string,
  testLink: string,
  startTime: string,
  duration: number
): EmailOptions {
  const formattedDate = new Date(startTime).toLocaleString();
  
  return {
    to: '', // Will be set by the caller
    subject: `Test Invitation: Your Online Test is Scheduled`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Test Invitation</h2>
        <p>Hello ${recipientName},</p>
        
        <p>You have been scheduled to take an online test. Please find the details below:</p>
        
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Test Start Time:</strong> ${formattedDate}</p>
          <p><strong>Test Duration:</strong> ${duration} minutes</p>
          <p><strong>Test Link:</strong> 
            <a href="${testLink}" style="color: #1890ff; text-decoration: none;">
              Click here to start your test
            </a>
          </p>
        </div>
        
        <p><strong>Important Notes:</strong></p>
        <ul>
          <li>The test will only be available during the scheduled time window</li>
          <li>Make sure you have a stable internet connection</li>
          <li>Do not refresh the page during the test</li>
          <li>The test will automatically submit when time expires</li>
        </ul>
        
        <p>If you have any questions, please contact support.</p>
        
        <p>Best regards,<br>Exam Team</p>
      </div>
    `
  };
}
