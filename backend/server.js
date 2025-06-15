import express from 'express';
import cors from 'cors';
import Tesseract from 'tesseract.js';
import { v4 as uuidv4 } from 'uuid';


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
  const tax = "";
  const tip = "";
  
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
    const taxMatch = taxPattern.map(pattern => line.match(pattern)).find(match => match !== null);

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

  return {items, taxMatch}
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
  
// Default home route
app.get('/', (req, res) => {
  res.send('Divi backend is running 🧠');
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port 5010`);
});


