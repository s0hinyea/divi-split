import express from 'express';
import cors from 'cors';
import Tesseract from 'tesseract.js';
import { v4 as uuidv4 } from 'uuid';
import 'dotenv/config';
import twilio from 'twilio';
import OpenAI from 'openai';
import { verifyAuth } from './authMiddleware.js';
import { supabase } from './supabaseClient.js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});



const app = express();
//create instance of backend, your main application object 

const PORT = process.env.PORT || 3000;

// Allow frontend requests from any domain (important!)
app.use(cors());

// Parse incoming JSON with large image payloads
app.use(express.json({ limit: '10mb' }));

// Helper function to parse receipt text
function parseReceiptText(text) {
  // Split text into lines and clean them
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

  console.log(lines);

  const items = [];
  let tax = "";
  let tip = "";

  // Common price patterns: $XX.XX, XX.XX, XX,XX
  const pricePattern = /\$?\d+[.,]\d{2}/;

  const taxPattern = [
    /\b(?:sales\s*)?tax\b[:\s]*\$?\s*(\d+(?:\.\d{1,2})?)/i,
    /\btax\b[:\s]*\$?\s*(\d+(?:\.\d{1,2})?)/i,
    /\btax\b[:\s]*(\d+(?:\.\d{1,2})?)%/i,
  ];

  lines.forEach(line => {
    // Try to find a price in the line
    const priceMatch = line.match(pricePattern);
    let taxMatch = taxPattern.map(pattern => line.match(pattern)).find(match => match !== null);

    if (priceMatch) {
      // Extract the price
      const price = priceMatch[0].replace('$', '').replace(',', '.');

      // Get the item name (everything before the price)
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

// OCR endpoint
app.post('/ocr', async (req, res) => {
  console.log("Start process");
  const { image } = req.body;
  if (!image) {
    console.log("Not image")
    return res.status(400).json({ error: 'No image provided' });
  }

  try {
    console.log('[OCR] Got new data');

    // Strip the base64 header
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');

    const result = await Tesseract.recognize(imageBuffer, 'eng');
    const extractedText = result.data.text;

    // Parse the receipt text into structured data
    const results = parseReceiptText(extractedText);
    const { items, tax } = results;

    console.log('[OCR] Text extracted and parsed');

    res.json({
      text: extractedText,  // Keep original text for debugging
      items: items,
      tax: tax       // Add structured items
    });
  } catch (error) {
    console.error('[OCR] ERROR:', error.message);
    res.status(500).json({ error: 'OCR failed', details: error.message });
  }
});


// 🚀 NEW: OpenAI Vision OCR endpoint
app.post('/ocr-vision', verifyAuth, async (req, res) => {
  console.log("Start OpenAI Vision process");
  const { image } = req.body;

  if (!image) {
    console.log("No image provided")
    return res.status(400).json({ error: 'No image provided' });
  }

  try {
    console.log('[OpenAI Vision] Processing receipt image');

    // 🎯 LEARNING POINT: Prompt Engineering
    // This prompt is carefully crafted to:
    // 1. Set clear context and role
    // 2. Specify exact output format
    // 3. Handle edge cases
    // 4. Provide examples for consistency

    //#SOHI : This is giving the gpt model a defualt prompt for every receipt.
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // Latest vision model
      messages: [
        {
          role: "system",
          content: `You are an expert receipt parser. Analyze receipt images and extract structured data.

CRITICAL REQUIREMENTS:
- Return valid JSON only
- For prices: Use only numbers (e.g., 12.99, not $12.99)
- For names: Clean text, remove extra characters
- For tax: Single number representing total tax amount
- If information is unclear, make best estimate

RESPONSE FORMAT:
{
  "items": [
    {"id": "unique-id", "name": "Item Name", "price": 12.99}
  ],
  "tax": 2.50,
  "tip": 0,
  "total": 15.49
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
      temperature: 0.1, // Low temperature for consistent, factual responses
      // 🎯 LEARNING POINT: Structured Output
      // This forces the AI to return valid JSON matching our schema
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content);

    // 🎯 LEARNING POINT: Data Validation
    // Always validate AI responses before using them
    if (!result.items || !Array.isArray(result.items)) {
      throw new Error('Invalid response format: missing items array');
    }

    // Ensure all items have required fields and generate IDs if missing
    const validatedItems = result.items.map((item, index) => ({
      id: item.id || uuidv4(),
      name: item.name || `Item ${index + 1}`,
      price: typeof item.price === 'number' ? item.price : 0
    }));

    console.log('[OpenAI Vision] Successfully parsed receipt');

    res.json({
      items: validatedItems,
      tax: result.tax || 0,
      tip: result.tip || 0,
      total: result.total || 0,
      source: 'openai-vision' // For debugging/comparison
    });

  } catch (error) {
    console.error('[OpenAI Vision] ERROR:', error.message);

    // 🎯 LEARNING POINT: Graceful Error Handling
    // Provide specific error messages for different failure types
    if (error.message.includes('API key')) {
      res.status(401).json({ error: 'OpenAI API key invalid', details: error.message });
    } else if (error.message.includes('quota')) {
      res.status(429).json({ error: 'OpenAI quota exceeded', details: error.message });
    } else {
      res.status(500).json({ error: 'Vision OCR failed', details: error.message });
    }
  }
});

app.post('/sms', verifyAuth, async (req, res) => {
  console.log("Sending SMS");

  //Extracts contacts from request body
  const { contacts, user } = req.body;
  const date = new Date();
  //configures Twilio client to send messages from 
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

      const { phoneNumber, total } = contact; //extract
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

// ============================================
// 📋 RECEIPTS ENDPOINTS
// ============================================

// GET /receipts - Fetch user's receipts with items
app.get('/receipts', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.sub; // User ID from JWT

    // Fetch receipts for this user, newest first
    const { data: receipts, error } = await supabase
      .from('receipts')
      .select(`
        id,
        receipt_name,
        total_amount,
        tax_amount,
        tip_amount,
        created_at,
        receipt_items (
          id,
          item_name,
          item_price
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    console.log(`[Receipts] Fetched ${receipts.length} receipts for user`);
    res.json({ receipts });

  } catch (error) {
    console.error('[Receipts] Fetch error:', error.message);
    res.status(500).json({ error: 'Failed to fetch receipts', details: error.message });
  }
});

// POST /receipts - Save a complete receipt with items, contacts, and assignments
app.post('/receipts', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.sub;
    const { receipt_name, receipt_date, items, contacts, tax, tip, total } = req.body;

    console.log('[Receipts] Saving new receipt for user:', userId);

    // 1. Insert the receipt
    const { data: receipt, error: receiptError } = await supabase
      .from('receipts')
      .insert({
        user_id: userId,
        receipt_name: receipt_name || 'Untitled Receipt',
        total_amount: total || 0,
        tax_amount: tax || 0,
        tip_amount: tip || 0,
        created_at: receipt_date || new Date().toISOString()
      })
      .select()
      .single();

    if (receiptError) throw receiptError;
    console.log('[Receipts] Created receipt:', receipt.id);

    // 2. Insert receipt items
    let insertedItems = [];
    let frontendToDbItemMap = {}; // Map frontend item.id -> database item.id

    if (items && items.length > 0) {
      const itemsToInsert = items.map(item => ({
        receipt_id: receipt.id,
        item_name: item.name,
        item_price: item.price
        // Note: NOT storing item_id - it's only needed temporarily for assignment mapping
      }));

      const { data: itemsData, error: itemsError } = await supabase
        .from('receipt_items')
        .insert(itemsToInsert)
        .select();

      if (itemsError) throw itemsError;
      insertedItems = itemsData || [];

      // Build a map from frontend ID to database ID (by matching order)
      items.forEach((item, index) => {
        if (insertedItems[index]) {
          frontendToDbItemMap[item.id] = insertedItems[index].id;
        }
      });

      console.log('[Receipts] Inserted', insertedItems.length, 'items');
    }

    // 3. Insert contacts and create assignments
    if (contacts && contacts.length > 0) {
      for (const contact of contacts) {
        // Insert or update contact
        const { data: insertedContact, error: contactError } = await supabase
          .from('contacts')
          .insert({
            user_id: userId,
            contact_name: contact.name,
            phone_number: contact.phoneNumber,
            contact_id: contact.id  // Original frontend ID
          })
          .select()
          .single();

        if (contactError) {
          console.error('[Receipts] Contact insert error:', contactError.message);
          continue; // Skip this contact but continue with others
        }

        // Create assignments for items assigned to this contact
        if (contact.items && contact.items.length > 0) {
          const assignments = contact.items.map(item => {
            // Use the map to find database ID for this frontend item ID
            const dbItemId = frontendToDbItemMap[item.id];
            return {
              item_id: dbItemId,
              contact_id: insertedContact.id
            };
          }).filter(a => a.item_id); // Only include valid assignments

          if (assignments.length > 0) {
            const { error: assignmentError } = await supabase
              .from('assignments')
              .insert(assignments);

            if (assignmentError) {
              console.error('[Receipts] Assignment error:', assignmentError.message);
            }
          }
        }
      }
      console.log('[Receipts] Processed', contacts.length, 'contacts');
    }

    console.log('[Receipts] Successfully saved complete receipt:', receipt.id);
    res.json({ success: true, receipt });

  } catch (error) {
    console.error('[Receipts] Save error:', error.message);
    res.status(500).json({ error: 'Failed to save receipt', details: error.message });
  }
});

// Default home route
app.get('/', (req, res) => {
  res.send('Divi backend is running 🧠');
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port 5010`);
});


