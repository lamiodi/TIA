// Test email script - sends a test email via Resend API
import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

const sendTestEmail = async () => {
  try {
    const { data, error } = await resend.emails.send({
      from: 'The TiaBrand <support@thetiabrand.org>',
      to: 'tygaodibenuah@gmail.com',
      subject: 'Test Email - Email Functionality Verification',
      html: `
        <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9f9f9; padding: 40px 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
            <div style="text-align: center; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px solid #f0f0f0;">
              <h1 style="font-size: 28px; color: #000000; margin: 0; font-weight: 700; letter-spacing: 0.5px;">THE TiaBrand</h1>
              <p style="font-size: 14px; color: #666666; margin: 4px 0 0 0; font-style: italic;">Premium Fashion & Lifestyle</p>
            </div>
            <h2 style="font-size: 24px; color: #000000; margin-bottom: 20px; text-align: center;">Email Test Successful ✅</h2>
            <p style="font-size: 16px; color: #444444; margin-bottom: 24px; text-align: center;">
              This is a test email sent to verify that the email functionality is working correctly.
            </p>
            <div style="background-color: #f0f8ff; border-radius: 8px; padding: 20px; margin: 24px 0;">
              <p style="font-size: 14px; color: #333333; margin: 0;">
                <strong>Status:</strong> ✅ Email service is operational<br/>
                <strong>Provider:</strong> Resend API<br/>
                <strong>Sent at:</strong> ${new Date().toUTCString()}
              </p>
            </div>
            <p style="font-size: 14px; color: #666666; text-align: center; margin-top: 24px;">
              If you received this email, the email functionality is working as expected.
            </p>
            <div style="padding: 24px; border-top: 1px solid #f0f0f0; text-align: center;">
              <p style="font-size: 12px; color: #888888; margin: 0;">
                &copy; ${new Date().getFullYear()} The TiaBrand. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('❌ Error sending test email:', error);
      process.exit(1);
    }

    console.log('✅ Test email sent successfully!');
    console.log('📧 Email ID:', data.id);
    console.log('📬 Recipient: tygaodibenuah@gmail.com');
  } catch (err) {
    console.error('❌ Exception:', err.message);
    process.exit(1);
  }
};

sendTestEmail();
