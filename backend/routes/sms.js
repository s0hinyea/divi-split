import { Router } from 'express';
import twilio from 'twilio';
import { verifyAuth } from '../authMiddleware.js';
import { strictLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post('/sms', strictLimiter, verifyAuth, async (req, res) => {
    console.log("Sending SMS");

    const { contacts, user } = req.body;
    const date = new Date();

    const client = new twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
    );

    if (!contacts) {
        console.log("No contacts")
        return res.status(400).json({ error: 'No contacts provided' });
    }

    try {
        const results = await Promise.all(contacts.map(async (contact) => {

            const { phoneNumber, total } = contact;
            if (!phoneNumber) return { success: false, error: 'Missing phone number' };
            if (!total) return { success: false, error: 'Missing total' };

            const message = `Hello! You owe $${total} for the bill created on ${date} by ${user} (from Divi)`;

            const result = await client.messages.create({
                body: message,
                from: process.env.TWILIO_PHONE,
                to: phoneNumber
            });
            return { success: true, sid: result.sid, to: phoneNumber };
        }));
        res.json({ results });
    }
    catch (err) {
        console.error("SMS send failed", err.message);
        res.status(500).json({ error: "SMS sending failed", details: err.message });
    }
});

export default router;
