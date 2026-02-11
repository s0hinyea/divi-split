import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import OpenAI from 'openai';
import { verifyAuth } from '../middleware/auth.js';
import { strictLimiter } from '../middleware/rateLimiter.js';

const router = Router();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// OpenAI Vision OCR endpoint
router.post('/ocr-vision', strictLimiter, verifyAuth, async (req, res) => {
    console.log("Start OpenAI Vision process");
    const { image } = req.body;

    // Input validation
    if (!image || typeof image !== 'string') {
        return res.status(400).json({ error: 'Image is required and must be a string' });
    }

    if (!image.startsWith('data:image/')) {
        return res.status(400).json({ error: 'Invalid image format. Expected base64-encoded image' });
    }

    // Reject images over 10MB (base64 is ~33% larger than raw)
    if (image.length > 10 * 1024 * 1024) {
        return res.status(400).json({ error: 'Image too large (max 10MB)' });
    }

    try {
        console.log('[OpenAI Vision] Processing receipt image');

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: `You are an expert receipt parser. Analyze receipt images and extract structured data.

CRITICAL REQUIREMENTS:
- Return valid JSON only
- For prices: Use only numbers (e.g., 12.99, not $12.99)
- For names: Clean text, remove extra characters and quantity prefixes
- For quantity: Extract the number of items if shown (e.g., "2 Burgers" = quantity 2)
- For tax: Single number representing total tax amount
- If quantity not specified, default to 1
- Price should be the LINE TOTAL (e.g., "2 Burgers $20.00" means price: 20.00, quantity: 2)
- If information is unclear, make best estimate

RESPONSE FORMAT:
{
  "items": [
    {"id": "unique-id", "name": "Item Name", "price": 20.00, "quantity": 2}
  ],
  "tax": 2.50,
  "tip": 0,
  "total": 22.50
}`
                },
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: "Parse this receipt and extract all menu items with their prices, plus tax amount. Return as JSON."
                        },
                        {
                            type: "image_url",
                            image_url: {
                                url: image
                            }
                        }
                    ]
                }
            ],
            max_tokens: 1000,
            temperature: 0.1,
            response_format: { type: "json_object" }
        });

        const result = JSON.parse(response.choices[0].message.content);

        if (!result.items || !Array.isArray(result.items)) {
            throw new Error('Invalid response format: missing items array');
        }

        // Expand items based on quantity (e.g., "2 Burgers $20" becomes 2x "Burger $10")
        const expandedItems = [];
        result.items.forEach((item, index) => {
            const quantity = typeof item.quantity === 'number' && item.quantity > 0 ? item.quantity : 1;
            const lineTotal = typeof item.price === 'number' ? item.price : 0;
            const unitPrice = quantity > 1 ? lineTotal / quantity : lineTotal;
            const itemName = item.name || `Item ${index + 1}`;

            for (let i = 0; i < quantity; i++) {
                expandedItems.push({
                    id: uuidv4(),
                    name: itemName,
                    price: Math.round(unitPrice * 100) / 100
                });
            }
        });

        console.log('[OpenAI Vision] Successfully parsed receipt with', expandedItems.length, 'items');

        res.json({
            items: expandedItems,
            tax: result.tax || 0,
            tip: result.tip || 0,
            total: result.total || 0,
            source: 'openai-vision'
        });

    } catch (error) {
        console.error('[OpenAI Vision] ERROR:', error.message);

        if (error.message.includes('API key')) {
            res.status(401).json({ error: 'OCR service configuration error' });
        } else if (error.message.includes('quota')) {
            res.status(429).json({ error: 'Service temporarily unavailable' });
        } else {
            res.status(500).json({ error: 'Failed to process receipt image' });
        }
    }
});

export default router;
