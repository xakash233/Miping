require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

async function test() {
    console.log('Testing SMTP with:', process.env.SMTP_USER);
    try {
        const info = await transporter.sendMail({
            from: `"Miping Test" <${process.env.SMTP_USER}>`,
            to: process.env.SMTP_USER,
            subject: "SMTP Test",
            text: "It works!"
        });
        console.log('SUCCESS:', info.messageId);
    } catch (error) {
        console.error('ERROR:', error);
    }
}

test();
