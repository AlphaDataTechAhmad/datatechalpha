import { Client } from 'node-appwrite';
import nodemailer from 'nodemailer';

export default async ({ req, res, log, error }) => {
    log('Email sending function started');
    
    try {
        // Parse the request body
        const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        log('Request received');

        const {
            email,
            name = 'Student',
            testName = 'Internship Test',
            score,
            totalMarks,
            percentage
        } = payload;

        // Input validation
        if (!email) {
            throw new Error('Email is required');
        }

        // Get SMTP credentials from environment variables
        const smtpConfig = {
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '465'),
            secure: true,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASSWORD
            }
        };

        // Create reusable transporter
        const transporter = nodemailer.createTransport(smtpConfig);

        // Verify connection
        await transporter.verify();
        log('SMTP connection verified');

        // Determine email content based on test result
        let emailSubject, emailHtml;
        
        if (percentage >= 90) {
            emailSubject = `🎉 Congratulations! You've Passed the ${testName}`;
            emailHtml = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Congratulations, ${name}!</h2>
                    <p>You have successfully passed the ${testName} with an impressive score of ${percentage}%.</p>
                    <p>Your score: ${score} out of ${totalMarks}</p>
                    <p>Please check your internship dashboard for the next steps.</p>
                    <p>Best regards,<br/>The Data Tech Alpha Team</p>
                </div>
            `;
        } else {
            emailSubject = `Your ${testName} Results`;
            emailHtml = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Hello ${name},</h2>
                    <p>Thank you for taking the ${testName}.</p>
                    <p>Your score: ${score} out of ${totalMarks} (${percentage}%)</p>
                    <p>While your score is below our required threshold, you can still join our internship program by paying a nominal fee of ₹949.</p>
                    <p><a href="https://datatechalpha.com/internship/enroll" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">Pay Now</a></p>
                    <p>Best regards,<br/>The Data Tech Alpha Team</p>
                </div>
            `;
        }

        // Send email
        const info = await transporter.sendMail({
            from: `"Data Tech Alpha" <${process.env.SMTP_USER}>`,
            to: email,
            subject: emailSubject,
            html: emailHtml
        });

        log('Email sent successfully', { messageId: info.messageId });
        
        return res.json({
            success: true,
            message: 'Email sent successfully',
            messageId: info.messageId
        });

    } catch (err) {
        error('Error sending email: ' + err.message);
        return res.json({
            success: false,
            error: 'Failed to send email',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        }, 500);
    }
};