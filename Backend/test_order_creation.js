// Test script to simulate order creation with bundle items
import dotenv from 'dotenv';
import sql from './db/index.js';

dotenv.config();

async function testOrderCreation() {
  try {
    console.log('=== TESTING ORDER CREATION WITH BUNDLE ITEMS ===\n');
    
    // Simulate the order data that would come from the frontend
    const mockOrderData = {
      user_id: 1,
      items: [
        {
          bundle_id: 15,
          quantity: 1,
          price: 59999,
          bundle_items: [
            { variant_id: 7, size_id: 3 },
            { variant_id: 9, size_id: 3 },
            { variant_id: 8, size_id: 3 }
          ]
        }
      ]
    };
    
    console.log('Mock order data:');
    console.log(JSON.stringify(mockOrderData, null, 2));
    
    console.log('\n=== PROCESSING BUNDLE ITEM ===');
    
    const item = mockOrderData.items[0];
    
    // Fetch bundle (same as in orderController.js)
    const [bundle] = await sql`
      SELECT b.id, b.name, b.bundle_price, b.bundle_type, bi.image_url
      FROM bundles b
      LEFT JOIN bundle_images bi ON b.id = bi.bundle_id AND bi.is_primary = true
      WHERE b.id = ${item.bundle_id}
    `;
    
    console.log('Bundle found:', bundle);
    
    // Process bundle items (same logic as in orderController.js)
    const bundleItemsDetails = [];
    if (item.bundle_items && Array.isArray(item.bundle_items)) {
      console.log(`\nProcessing ${item.bundle_items.length} bundle items:`);
      
      for (const bi of item.bundle_items) {
        console.log(`Processing bundle item: variant_id=${bi.variant_id}, size_id=${bi.size_id}`);
        
        const [variant] = await sql`
          SELECT pv.id AS variant_id, pv.product_id, p.name AS product_name, 
                 c.color_name, s.size_name, pi.image_url
          FROM product_variants pv
          JOIN products p ON pv.product_id = p.id
          JOIN colors c ON pv.color_id = c.id
          LEFT JOIN sizes s ON s.id = ${bi.size_id || null}
          LEFT JOIN product_images pi ON pv.id = pi.variant_id AND pi.is_primary = true
          WHERE pv.id = ${bi.variant_id}
        `;
        
        if (!variant) {
          console.error(`Bundle item variant ${bi.variant_id} not found`);
          continue;
        }
        
        console.log('Variant found:', variant);
        
        bundleItemsDetails.push({
          variant_id: bi.variant_id,
          size_id: bi.size_id || null,
          product_name: variant.product_name,
          color_name: variant.color_name,
          size_name: variant.size_name,
          image_url: variant.image_url,
        });
      }
    }
    
    console.log('\n=== BUNDLE ITEMS DETAILS ===');
    console.log('bundleItemsDetails array:');
    console.log(JSON.stringify(bundleItemsDetails, null, 2));
    
    console.log('\n=== WHAT GETS STORED IN DATABASE ===');
    const bundleDetailsJson = JSON.stringify(bundleItemsDetails);
    console.log('bundle_details JSON string:');
    console.log(bundleDetailsJson);
    
    console.log('\n=== TESTING JSON PARSE ===');
    const parsedBack = JSON.parse(bundleDetailsJson);
    console.log('Parsed back from JSON:');
    console.log(JSON.stringify(parsedBack, null, 2));
    
    // Test what would be stored in order_items table
    const orderItem = {
      bundle_id: item.bundle_id,
      quantity: item.quantity,
      price: item.price,
      product_name: bundle.name,
      image_url: bundle.image_url,
      bundle_details: bundleDetailsJson,
    };
    
    console.log('\n=== ORDER ITEM THAT WOULD BE STORED ===');
    console.log(JSON.stringify(orderItem, null, 2));
    
  } catch (error) {
    console.error('Error testing order creation:', error);
  } finally {
    await sql.end();
  }
}

testOrderCreation();