import express from 'express';
import cors from 'cors';
import Tesseract from 'tesseract.js';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
dotenv.config({ path: './twilio.env' });

console.log('File exists check:', require('fs').existsSync('./twilio.env'));
console.log('Keys:', Object.keys(process.env).filter(key => key.includes('TWILIO')));

console.log('Environment check:');
console.log('TWILIO_ACCOUNT_SID:', process.env.TWILIO_ACCOUNT_SID ? 'Found' : 'Missing');
console.log('TWILIO_AUTH_TOKEN:', process.env.TWILIO_AUTH_TOKEN ? 'Found' : 'Missing');
console.log('TWILIO_PHONE:', process.env.TWILIO_PHONE);


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

    if(taxMatch){
       tax = parseFloat(taxMatch[1]);
    }
  });

  return { items, tax };
}

// 👇 OCR endpoint
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
    const {items, tax} = results;
    
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

app.post('/sms', async(req, res) => {
  console.log("Sending SMS");

  //Extracts contacts from request body
  const { contacts, user } = req.body;
  const date = new Date();
  //configures Twilio client to send messages from 
  const twilio = require('twilio');
  const client = new twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );

  if (!contacts) {
    console.log("No contacts")
    return res.status(400).json({ error: 'No contacts provided' });
  }

  try {
    const results = await Promise.all(contacts.map(async (contact) =>{

      const {phoneNumber, total} = contact; //extract
      if(!phoneNumber) return { success: false, error: 'Missing phone number'};
      if(!total) return {success: false, error: 'Missing total'};

      const message = `Hello! You owe $${total} for the bill created on ${date} by ${user} (from Divi)`;

      const result = await client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE,
        to: phoneNumber
      });
      return { success: true, sid: result.sid, to: phoneNumber};
  }));
    res.json({results});
  }
  catch (err){
    console.error("SMS send failed", err.message);
    res.status(500).json({ error: "SMS sending failed", details: err.message });
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


