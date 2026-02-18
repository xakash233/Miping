const nodemailer = require('nodemailer');

// Getter for transporter to ensure env vars are fresh and errors are caught
const getTransporter = () => {
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!user || !pass) {
        console.error("SMTP Credentials missing in .env!");
    }

    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true', // false for 587
        auth: { user, pass },
        tls: {
            rejectUnauthorized: false // Often needed for local dev/certain networks
        }
    });
};

exports.sendWelcomeEmail = async (to, name, email, password) => {
    try {
        const transporter = getTransporter();
        const info = await transporter.sendMail({
            from: `"Miping Admin" <${process.env.SMTP_USER}>`,
            to: to,
            subject: "Welcome to Miping - Your Login Credentials",
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2>Welcome to Miping!</h2>
                    <p>Hi ${name},</p>
                    <p>Your subscription has been activated by the Super Admin. Here are your login details:</p>
                    <div style="background: #f4f4f4; padding: 15px; border-radius: 5px;">
                        <p><strong>Email:</strong> ${email}</p>
                        <p><strong>Password:</strong> ${password}</p>
                    </div>
                    <p>Please login at <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login">Miping Dashboard</a> and change your password immediately.</p>
                    <br>
                    <p>Regards,<br>The Miping Team</p>
                </div>
            `
        });
        console.log("Email sent: %s", info.messageId);
        return true;
    } catch (error) {
        console.error("Error sending email: ", error);
        throw error;
    }
};

exports.sendOTPEmail = async (to, otp) => {
    try {
        const transporter = getTransporter();
        console.log(`Attempting to send OTP to ${to} from ${process.env.SMTP_USER}`);

        const info = await transporter.sendMail({
            from: `"Miping" <${process.env.SMTP_USER}>`,
            to: to,
            subject: "Your Miping Verification Code",
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; text-align: center;">
                    <div style="max-width: 400px; margin: 0 auto; border: 1px solid #eee; padding: 30px; border-radius: 10px;">
                        <h2 style="color: #4F46E5;">Verify your Email</h2>
                        <p>Thank you for signing up for Miping. Please use the verification code below to continue your registration:</p>
                        <div style="background: #f8fafc; padding: 20px; border-radius: 10px; margin: 25px 0;">
                            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1e293b;">${otp}</span>
                        </div>
                        <p style="font-size: 13px; color: #64748b;">This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
                    </div>
                </div>
            `
        });
        console.log("OTP Email sent: %s", info.messageId);
        return true;
    } catch (error) {
        console.error("CRITICAL: Email Transport Error:", error.message);
        throw error;
    }
};
