const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

// Helper function to create transporter
const createTransporter = (settings) => {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: settings.gmailAddress,
            pass: settings.appPassword
        }
    });
};

app.post('/api/test-connection', async (req, res) => {
    const { gmailAddress, appPassword } = req.body;

    if (!gmailAddress || !appPassword) {
        return res.status(400).json({ success: false, message: 'Missing credentials' });
    }

    try {
        const transporter = createTransporter({ gmailAddress, appPassword });
        await transporter.verify();
        res.json({ success: true, message: 'Connection successful!' });
    } catch (error) {
        console.error('Test connection error:', error);
        res.status(500).json({ success: false, message: 'Connection failed: ' + error.message });
    }
});

app.post('/api/send-email', async (req, res) => {
    const { settings, to, subject, text, html } = req.body;

    if (!settings || !settings.gmailAddress || !settings.appPassword || !to || !subject) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    try {
        const transporter = createTransporter(settings);

        const mailOptions = {
            from: `"${settings.senderName || 'TAGO System'}" <${settings.gmailAddress}>`,
            to: to,
            subject: subject,
            text: text,
            html: html
        };

        const info = await transporter.sendMail(mailOptions);
        res.json({ success: true, messageId: info.messageId });
    } catch (error) {
        console.error('Send email error:', error);
        res.status(500).json({ success: false, message: 'Failed to send email: ' + error.message });
    }
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
