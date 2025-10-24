import { Client, Account } from 'appwrite';

// Initialize the Appwrite client
const client = new Client()
  .setEndpoint('https://cloud.appwrite.io/v1')
  .setProject('68261b5200198bea6bdf');

const account = new Account(client);

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
  name?: string;
}

/**
 * Send an email using Appwrite
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    // In a real implementation, you would use an email service like SendGrid, Mailgun, etc.
    // This is a placeholder implementation that logs the email to the console
    console.log('Sending email:', {
      to: options.to,
      subject: options.subject,
      // Truncate HTML for logging
      html: options.html.substring(0, 100) + '...',
    });

    // In a real implementation, you would use your email service API here
    // For example, if using SendGrid:
    // const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${import.meta.env.VITE_SENDGRID_API_KEY}`
    //   },
    //   body: JSON.stringify({
    //     personalizations: [{
    //       to: [{ email: options.to }],
    //       subject: options.subject
    //     }],
    //     from: { 
    //       email: options.from || 'noreply@datatechalpha.com',
    //       name: options.name || 'Data Tech Alpha'
    //     },
    //     content: [{
    //       type: 'text/html',
    //       value: options.html
    //     }]
    //   })
    // });
    
    // For now, we'll simulate a successful response
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

/**
 * Send a test email (for testing purposes)
 */
export async function sendTestEmail(to: string) {
  return sendEmail({
    to,
    subject: 'Test Email from Data Tech Alpha',
    html: '<h1>This is a test email</h1><p>If you received this, the email service is working!</p>',
  });
}
