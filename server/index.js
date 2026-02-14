const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3001;

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

// --- File Storage Logic ---
const fs = require('fs').promises;
const path = require('path');
const DATA_DIR = path.join(__dirname, 'data');

// Ensure data directory exists
const ensureDataDir = async () => {
    try {
        await fs.access(DATA_DIR);
    } catch {
        await fs.mkdir(DATA_DIR, { recursive: true });
    }
};

app.get('/api/storage/:key', async (req, res) => {
    const key = req.params.key;
    // sanitized key validation to prevent directory traversal
    if (!/^[a-zA-Z0-9_-]+$/.test(key)) {
        return res.status(400).json({ success: false, message: 'Invalid key format' });
    }

    const filePath = path.join(DATA_DIR, `${key}.json`);

    try {
        await ensureDataDir();
        const data = await fs.readFile(filePath, 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        if (error.code === 'ENOENT') {
            // File not found -> return null or empty object, let frontend handle init
            return res.json(null);
        }
        console.error(`Read error for key ${key}:`, error);
        res.status(500).json({ success: false, message: 'Failed to read data' });
    }
});

app.post('/api/storage/:key', async (req, res) => {
    const key = req.params.key;
    const data = req.body;

    if (!/^[a-zA-Z0-9_-]+$/.test(key)) {
        return res.status(400).json({ success: false, message: 'Invalid key format' });
    }

    const filePath = path.join(DATA_DIR, `${key}.json`);

    try {
        await ensureDataDir();
        await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
        res.json({ success: true });
    } catch (error) {
        console.error(`Write error for key ${key}:`, error);
        res.status(500).json({ success: false, message: 'Failed to save data' });
    }
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
