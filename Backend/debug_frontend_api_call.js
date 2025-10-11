// Debug script to intercept and log API calls to see what data is being sent from frontend
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3001; // Different port to avoid conflicts

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Middleware to log all incoming requests
app.use((req, res, next) => {
  console.log(`\n=== ${new Date().toISOString()} ===`);
  console.log(`${req.method} ${req.url}`);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// Intercept order creation calls
app.post('/api/orders', (req, res) => {
  console.log('\n🔍 ORDER CREATION API CALL INTERCEPTED');
  console.log('='.repeat(50));
  
  const { items } = req.body;
  
  console.log('\n📋 ITEMS ANALYSIS:');
  if (items && Array.isArray(items)) {
    items.forEach((item, index) => {
      console.log(`\nItem ${index + 1}:`);
      console.log(`  - Type: ${item.variant_id ? 'Product' : 'Bundle'}`);
      console.log(`  - ID: ${item.variant_id || item.bundle_id}`);
      console.log(`  - Quantity: ${item.quantity}`);
      console.log(`  - Price: ${item.price}`);
      console.log(`  - Product Name: ${item.product_name}`);
      
      if (item.bundle_items) {
        console.log(`  - Bundle Items: ${item.bundle_items.length} items`);
        item.bundle_items.forEach((bundleItem, biIndex) => {
          console.log(`    ${biIndex + 1}. variant_id: ${bundleItem.variant_id}, size_id: ${bundleItem.size_id}`);
        });
      } else if (!item.variant_id) {
        console.log(`  - ⚠️  BUNDLE WITHOUT bundle_items ARRAY!`);
      }
    });
  } else {
    console.log('❌ No items found in request');
  }
  
  console.log('\n' + '='.repeat(50));
  
  // Return a mock response to prevent frontend errors
  res.json({
    success: true,
    message: 'Debug intercepted - order not actually created',
    order: {
      id: 'debug-123',
      reference: 'DEBUG-REF-123'
    }
  });
});

// Catch all other routes
app.use('*', (req, res) => {
  console.log(`\n📡 Other API call: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: 'Debug server - route not handled' });
});

app.listen(PORT, () => {
  console.log(`🔍 Debug API server running on port ${PORT}`);
  console.log(`To test, temporarily change API_BASE_URL in frontend to http://localhost:${PORT}`);
  console.log('This will intercept and log all API calls from the frontend\n');
});

export default app;