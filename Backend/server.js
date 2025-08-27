import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { v2 as cloudinary } from 'cloudinary';
import productRoutes from './routes/products.js';
import orderRoutes from './routes/orders.js';
import paystackRouter from './routes/paystack.js';
import bundleRoutes from './routes/bundleRoutes.js';
import inventoryRoutes from './routes/inventory.js';
import metaRoutes from './routes/meta.js';
import cartRoutes from './routes/cart.js';
import shopallRoutes from './routes/shopallRoutes.js';
import webhookRoutes from './routes/webhookRoutes.js';
import addressRoutes from './routes/addressRoutes.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import reviewRouter from './routes/reviewRouter.js';
import billingAddressRoutes from './routes/billingAddressRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import newsletterRoutes from './routes/newsletterRoutes.js';
import emailRoutes from './routes/email.js';
import { EventEmitter } from 'events';
import { cleanupOldOrders } from './utils/cleanupOrders.js';


EventEmitter.defaultMaxListeners = 40;

dotenv.config();

// Initialize Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const app = express();


const allowedOrigins = [
  'https://www.thetiabrand.org', // Production frontend
  'http://localhost:5173',        // Local Vite development
  'http://127.0.0.1:5173',        // Alternative localhost
];

// Enhanced CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    // Log the origin for debugging
    console.log('CORS request from origin:', origin);
    
    // Allow requests with no origin (like Postman, mobile apps) or from allowedOrigins
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.error(`CORS blocked origin: ${origin}`);
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-User-Country',
    'Cache-Control',
    'Pragma',
    'Accept',
    'Origin',
    'X-Requested-With'
  ],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  preflightContinue: false,
  optionsSuccessStatus: 200
}));

// Manual OPTIONS handler for extra safety
app.options('*', (req, res) => {
  const origin = req.headers.origin;
  console.log('OPTIONS preflight request from origin:', origin);
  
  if (!origin || allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-User-Country, Cache-Control, Pragma, Accept, Origin, X-Requested-With');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '3600');
    res.sendStatus(200);
  } else {
    res.sendStatus(403);
  }
});


// ... existing code ...



app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static('Uploads'));

// Route mounting
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/bundles', bundleRoutes);
app.use('/api/paystack', paystackRouter);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/meta', metaRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/shopall', shopallRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/billing-addresses', billingAddressRoutes);
app.use('/api/reviews', reviewRouter);
app.use('/api/admin', adminRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/email', emailRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] Error in ${req.method} ${req.url}:`, err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start cron job
cleanupOldOrders(); // Optional: Run on startup


app.get('/healthz', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// CORS test endpoint
app.get('/api/cors-test', (req, res) => {
  res.status(200).json({ 
    message: 'CORS is working!', 
    origin: req.headers.origin,
    timestamp: new Date().toISOString() 
  });
});

// Health check
app.get('/', (req, res) => res.send('TIA Backend is running 🚀'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));