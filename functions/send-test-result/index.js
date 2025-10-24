import { Client, Databases } from 'node-appwrite';
import nodemailer from 'nodemailer';

export default async ({ req, res, log, error }) => {
    log('Test result email function started');
    
    try {
        // Parse the request body
        const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        log('Parsed payload:', JSON.stringify(payload, null, 2));

        // Initialize Appwrite client
        const client = new Client()
            .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
            .setProject(process.env.APPWRITE_PROJECT_ID || '68261b5200198bea6bdf')
            .setKey(process.env.APPWRITE_API_KEY || 'standard_db4da41dd63064a8f6e28ebcd3d3e31171e9c316912aaebfe8eb0c685d34abb41f7328f10a2e074905922fa906a8cac4ba9e6b877f4525c9d3adf04b6303d76b8d42e7057d1cc60dfd90ea382a6d5ddd058f1265439b95362b08cb692a8633643b6f44af5b9c8ce6e3574fa7993173444504ef80e4cbca5a358dfe3d497b95e7');

        const databases = new Databases(client);

        // Get the updated document to fetch email and user details
        const { testId, userId } = payload;
        if (!testId) {
            throw new Error('Test ID is required');
        }

        log(Fetching document with ID: ${testId} );
        const document = await databases.getDocument(
            '68261b6a002ba6c3b584', // DATABASE_ID
            '689923bc000f2d15a263', // INTERNSHIP_TEST_LINKS_COLLECTION
            testId
        );

        log('Fetched document:', JSON.stringify(document, null, 2));

        // Extract user details from the document
        const {
            email = 'candidate@example.com',
            full_name: name = 'Student',
            score = 0,
            percentage = 0,
            status = 'completed',
            $updatedAt: completedAt
        } = document;

        // Calculate total marks (you might need to adjust this based on your test structure)
        const totalMarks = 100; // Adjust this based on your test structure

        // SMTP configuration
        const smtpConfig = {
            host: 'smtp.hostinger.com',
            port: 465,
            secure: true,
            auth: {
                user: 'hr@datatechalpha.com',
                pass: 'Param@123@@'
            }
        };

        log('Using SMTP Config:', {
            host: smtpConfig.host,
            port: smtpConfig.port,
            user: smtpConfig.auth.user,
            password: '***'
        });

        // Create reusable transporter
        const transporter = nodemailer.createTransport(smtpConfig);

        // Verify connection configuration
        await transporter.verify();

        // Calculate pass/fail
        const passed = status === 'passed' || (typeof percentage === 'number' ? percentage >= 70 : parseFloat(percentage) >= 70);
        const resultStatus = passed ? 'PASSED' : 'NOT PASSED';
        const testName = 'DSA Internship Test'; // You can make this dynamic if needed

        // Email content
        const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #2c3e50;">Pre-Exam Result and Next Steps: ${testName}</h2>
                <p>Dear ${name},</p>
                
                <p>Thank you for completing the ${testName}.</p>
                
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${passed ? '#2ecc71' : '#e74c3c'};">
                    <h3 style="margin-top: 0; color: #2c3e50;">Your Results:</h3>
                    <p>Score: <strong>${score} / ${totalMarks}</strong></p>
                    <p>Percentage: <strong>${percentage}%</strong></p>
                    <p>Status: <strong style="color: ${passed ? '#27ae60' : '#e74c3c'}">${resultStatus}</strong></p>
                </div>

                ${passed ? 
                    <p style="color: #27ae60;">🎉 Congratulations! You have successfully passed the test. Our team will review your submission and get back to you soon.</p>   :
                    <p>Thank you for taking the test. We appreciate your effort and encourage you to try again in the future.</p>  
                }

                <p style="margin-top: 30px; color: #7f8c8d; font-size: 0.9em;">
                    If you have any questions, please don't hesitate to contact our support team.
                </p>
                
                <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ecf0f1;">
                    <p>Best regards,<br><strong>DataTech Alpha Team</strong></p>
                </div>
            </div>
        `;

        // Send email
        log(Sending email to: ${email} );
        const info = await transporter.sendMail({
            from: '"DataTech Alpha" <hr@datatechalpha.com>',
            to: email,
            subject: Test Results: ${testName} 


,
            html: emailHtml
        });

        log('Email sent successfully. Message ID:', info.messageId);
        
        return res.json({
            success: true,
            message: 'Test results email sent successfully',
            data: {
                email,
                name,
                testName,
                score,
                totalMarks,
                percentage,
                passed,
                messageId: info.messageId
            }
        });

    } catch (err) {
        error('Error sending test results email:', err);
        return res.json({
            success: false,
            error: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        }, 500);
    }
};