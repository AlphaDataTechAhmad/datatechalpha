import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function createTransporter(config) {
  // Use provided auth config or default to env variables
  const auth = config.auth || {
    user: 'hr@datatechalpha.com',
    pass: process.env.SMTP_PASSWORD
  };

  const transporter = nodemailer.createTransport({
    // Default settings
    host: 'smtp.hostinger.com',
    port: 465,
    secure: true,
    // Override with provided config
    ...config,
    // Ensure auth is properly set
    auth: auth,
    // Debug and TLS settings
    tls: {
      rejectUnauthorized: false // Only for testing, remove in production
    },
    debug: true,
    logger: true // Enable detailed logging
  });

  // Verify connection on creation
  try {
    await transporter.verify();
    console.log('Server is ready to take our messages');
  } catch (error) {
    console.error('Server verification failed:', error.message);
    throw error;
  }

  return transporter;
}

async function testConnection(transporter, configName) {
  console.log(`🔄 Testing connection with ${configName}...`);
  await transporter.verify();
  console.log('✅ Server is ready to take our messages');

  console.log('\n📤 Sending test email...');
  const info = await transporter.sendMail({
    from: '"DATA TECH ALPHA" <hr@datatechalpha.com>',
    to: 'hr@datatechalpha.com',
    subject: `✅ SMTP Test Successful (${configName})`,
    text: `This is a test email using ${configName}`,
    html: `
      <h2>🎉 SMTP Test Successful!</h2>
      <p>This is a test email sent using <b>${configName}</b>.</p>
      <p>Time: ${new Date().toLocaleString()}</p>
    `
  });

  console.log('\n✅ Test email sent successfully!');
  console.log('Message ID:', info.messageId);
  return true;
}

async function testSMTP() {
  // Try different SMTP configurations
  const configs = [
    // Standard Hostinger SMTP settings
    { 
      host: 'smtp.hostinger.com',
      port: 465, 
      secure: true,
      name: 'Hostinger SSL (465)'
    },
    {
      host: 'smtp.hostinger.com',
      port: 587,
      secure: false,
      requireTLS: true,
      name: 'Hostinger TLS (587)'
    },
    // Alternative hostnames
    {
      host: 'smtp.hostinger.com',
      port: 465,
      secure: true,
      auth: {
        user: 'hr@datatechalpha.com',
        pass: process.env.SMTP_PASSWORD
      },
      name: 'Hostinger with explicit auth'
    },
    // Try without TLS (not recommended but for testing)
    {
      host: 'smtp.hostinger.com',
      port: 587,
      secure: false,
      ignoreTLS: true,
      name: 'Hostinger No TLS (insecure)'
    }
  ];

  for (const config of configs) {
    console.log(`\n🔍 Testing ${config.name}...`);
    try {
      const transporter = await createTransporter(config);
      const success = await testConnection(transporter, config.name);
      if (success) return; // Stop if successful
    } catch (error) {
      console.log(`❌ ${config.name} failed:`, error.message);
    }
  }
  
  console.error('\n❌ All SMTP configurations failed. Please check:');
  console.error('1. Your email account password in .env file');
  console.error('2. If SMTP access is enabled in your Hostinger email settings');
  console.error('3. If port 465/587 is not blocked by your firewall');
  console.error('4. If your email account is active and not locked');
}

// Run the test
testSMTP().catch(console.error);
