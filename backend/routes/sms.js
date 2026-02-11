import { Router } from 'express';
import twilio from 'twilio';
import { verifyAuth } from '../middleware/auth.js';
import { strictLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post('/sms', strictLimiter, verifyAuth, async (req, res) => {
    console.log("Sending SMS");

    const { contacts, user } = req.body;
    const date = new Date();

    // Input validation
    if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
        return res.status(400).json({ error: 'Contacts must be a non-empty array' });
    }

    if (contacts.length > 20) {
        return res.status(400).json({ error: 'Too many contacts (max 20)' });
    }

    if (!user || typeof user !== 'string') {
        return res.status(400).json({ error: 'User name is required' });
    }

    // Validate each contact before sending any messages
    for (const contact of contacts) {
        if (!contact.phoneNumber || typeof contact.phoneNumber !== 'string') {
            return res.status(400).json({ error: 'Each contact must have a phoneNumber string' });
        }
        if (!/^\+?[1-9]\d{1,14}$/.test(contact.phoneNumber)) {
            return res.status(400).json({ error: `Invalid phone number format: ${contact.phoneNumber}` });
        }
        if (typeof contact.total !== 'number' || contact.total <= 0) {
            return res.status(400).json({ error: 'Each contact must have a positive total number' });
        }
    }

    const client = new twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
    );

    try {
        const results = await Promise.all(contacts.map(async (contact) => {
            const { phoneNumber, total } = contact;

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
