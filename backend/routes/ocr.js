import { Router } from 'express';
import Tesseract from 'tesseract.js';
import { v4 as uuidv4 } from 'uuid';
import OpenAI from 'openai';
import { verifyAuth } from '../middleware/auth.js';
import { strictLimiter } from '../middleware/rateLimiter.js';

const router = Router();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Helper function to parse receipt text (used by Tesseract OCR)
function parseReceiptText(text) {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

    console.log(lines);

    const items = [];
    let tax = "";
    let tip = "";

    const pricePattern = /\$?\d+[.,]\d{2}/;

    const taxPattern = [
        /\b(?:sales\s*)?tax\b[:\s]*\$?\s*(\d+(?:\.\d{1,2})?)/i,
        /\btax\b[:\s]*\$?\s*(\d+(?:\.\d{1,2})?)/i,
        /\btax\b[:\s]*(\d+(?:\.\d{1,2})?)%/i,
    ];

    lines.forEach(line => {
        const priceMatch = line.match(pricePattern);
        let taxMatch = taxPattern.map(pattern => line.match(pattern)).find(match => match !== null);

        if (priceMatch) {
            const price = priceMatch[0].replace('$', '').replace(',', '.');
            const itemName = line.substring(0, priceMatch.index).trim();

            if (itemName) {
                items.push({
                    name: itemName,
                    price: parseFloat(price),
                    id: uuidv4()
                });
            }
        }

        if (taxMatch) {
            tax = parseFloat(taxMatch[1]);
        }
    });

    return { items, tax };
}

// Tesseract OCR endpoint
router.post('/ocr', async (req, res) => {
    console.log("Start process");
    const { image } = req.body;
    if (!image) {
        console.log("Not image")
        return res.status(400).json({ error: 'No image provided' });
    }

    try {
        console.log('[OCR] Got new data');

        const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
        const imageBuffer = Buffer.from(base64Data, 'base64');

        const result = await Tesseract.recognize(imageBuffer, 'eng');
        const extractedText = result.data.text;

        const results = parseReceiptText(extractedText);
        const { items, tax } = results;

        console.log('[OCR] Text extracted and parsed');

        res.json({
            text: extractedText,
            items: items,
            tax: tax
        });
    } catch (error) {
        console.error('[OCR] ERROR:', error.message);
        res.status(500).json({ error: 'OCR failed', details: error.message });
    }
});

// OpenAI Vision OCR endpoint
router.post('/ocr-vision', strictLimiter, verifyAuth, async (req, res) => {
    console.log("Start OpenAI Vision process");
    const { image } = req.body;

    if (!image) {
        console.log("No image provided")
        return res.status(400).json({ error: 'No image provided' });
    }

    try {
        console.log('[OpenAI Vision] Processing receipt image');

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
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
            res.status(401).json({ error: 'OpenAI API key invalid', details: error.message });
        } else if (error.message.includes('quota')) {
            res.status(429).json({ error: 'OpenAI quota exceeded', details: error.message });
        } else {
            res.status(500).json({ error: 'Vision OCR failed', details: error.message });
        }
    }
});

export default router;
