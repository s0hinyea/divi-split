import express from 'express';
import cors from 'cors';
import 'dotenv/config';

import { globalLimiter } from './middleware/rateLimiter.js';
import ocrRoutes from './routes/ocr.js';
import receiptRoutes from './routes/receipts.js';

const app = express();
const PORT = process.env.PORT || 3000;

// --- CORS ---
const allowedOrigins = [
  'http://localhost:8081',
  'http://localhost:19006',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// --- Global Middleware ---
app.use(globalLimiter);
app.use(express.json({ limit: '10mb' }));

// --- Routes ---
app.use(ocrRoutes);           // /ocr, /ocr-vision
app.use('/receipts', receiptRoutes);  // /receipts, /receipts/:id

// --- Health Check ---
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
  res.send('Divi backend is running 🧠');
});

// --- Start ---
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
