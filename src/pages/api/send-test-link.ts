import { NextApiRequest, NextApiResponse } from 'next';
import { Client, Databases, Query } from 'node-appwrite';
import { Resend } from 'resend';

// Initialize Appwrite client
const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || '')
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '')
  .setKey(process.env.APPWRITE_API_KEY || '');

const databases = new Databases(client);

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { email, testLink, internshipTitle } = req.body;

  if (!email || !testLink || !internshipTitle) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    // Check if the email is from a registered user
    const response = await databases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '',
      'users', // Your users collection ID
      [
        Query.equal('email', email)
      ]
    );

    if (response.documents.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Send email with Resend
    const { error } = await resend.emails.send({
      from: 'onboarding@resend.dev', // Update with your verified sender
      to: email,
      subject: `Your Internship Test Link - ${internshipTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #4f46e5; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Your Internship Test is Ready</h1>
          </div>
          <div style="padding: 20px; background-color: #f9fafb;">
            <p>Hello,</p>
            <p>Thank you for applying to the <strong>${internshipTitle}</strong> internship program.</p>
            <p>Please click the button below to start your test. This link is valid for 7 days.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}${testLink}" 
                 style="display: inline-block; 
                        padding: 12px 30px; 
                        background-color: #4f46e5; 
                        color: white; 
                        text-decoration: none; 
                        border-radius: 6px;
                        font-weight: bold;
                        font-size: 16px;">
                Start Test Now
              </a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all;">${process.env.NEXT_PUBLIC_APP_URL}${testLink}</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="font-size: 14px; color: #6b7280;">
              If you did not request this test, please ignore this email or contact support.
            </p>
          </div>
          <div style="background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280;">
            © ${new Date().getFullYear()} Your Company Name. All rights reserved.
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('Error sending email:', error);
      return res.status(500).json({ message: 'Failed to send email' });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error in send-test-link API:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
