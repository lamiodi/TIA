// Debug script to trace bundle_details insertion issue
import dotenv from 'dotenv';
import sql from './db/index.js';

dotenv.config();

async function debugOrderInsertion() {
  try {
    console.log('=== DEBUGGING ORDER INSERTION ===\n');
    
    // Step 1: Simulate the orderItems array construction (from orderController.js line 476)
    console.log('Step 1: Simulating orderItems array construction...');
    
    const bundleItemsDetails = [
      {
        variant_id: 7,
        size_id: 3,
        product_name: "The Micheal Jordan",
        color_name: "Black",
        size_name: "M",
        image_url: "https://res.cloudinary.com/dgcwviufp/image/upload/v1751100901/nfabjrbz8womyyxcbpwr.jpg"
      },
      {
        variant_id: 9,
        size_id: 3,
        product_name: "The Micheal Jordan",
        color_name: "White",
        size_name: "M",
        image_url: "https://res.cloudinary.com/dgcwviufp/image/upload/v1751100919/vfruovmlfeovjrau9feb.webp"
      },
      {
        variant_id: 8,
        size_id: 3,
        product_name: "The Micheal Jordan",
        color_name: "Gray",
        size_name: "M",
        image_url: "https://res.cloudinary.com/dgcwviufp/image/upload/v1751100904/r1p8rrbvdxrssuralb4s.webp"
      }
    ];
    
    const orderItem = {
      bundle_id: 15,
      quantity: 1,
      price: 59999,
      product_name: "Men in Boost",
      image_url: "https://res.cloudinary.com/dgcwviufp/image/upload/v1751658880/bovcb3eyarxx2grhvacy.jpg",
      bundle_details: JSON.stringify(bundleItemsDetails),
    };
    
    console.log('Order item to be inserted:');
    console.log(JSON.stringify(orderItem, null, 2));
    console.log('bundle_details type:', typeof orderItem.bundle_details);
    console.log('bundle_details length:', orderItem.bundle_details.length);
    console.log('bundle_details content:', orderItem.bundle_details);
    
    // Step 2: Test the actual INSERT statement
    console.log('\nStep 2: Testing actual INSERT statement...');
    
    // First, find an existing user
    const [existingUser] = await sql`
      SELECT id FROM users LIMIT 1
    `;
    
    if (!existingUser) {
      console.log('❌ No users found in database');
      return;
    }
    
    // Create a test order
    const [testOrder] = await sql`
      INSERT INTO orders (
        user_id, total, discount, tax, shipping_cost, shipping_country, 
        payment_method, payment_status, status, currency, reference
      ) VALUES (
        ${existingUser.id}, 59999, 0, 0, 0, 'Nigeria', 'card', 'pending', 'pending', 'NGN', 'TEST-DEBUG-ORDER'
      )
      RETURNING id
    `;
    
    console.log('Created test order:', testOrder.id);
    
    // Now insert the order item exactly as in orderController.js
    await sql`
      INSERT INTO order_items (
        order_id, variant_id, bundle_id, quantity, price, size_id, product_name, image_url, 
        color_name, size_name, bundle_details
      ) VALUES (
        ${testOrder.id}, ${orderItem.variant_id || null}, ${orderItem.bundle_id || null}, ${orderItem.quantity}, 
        ${orderItem.price}, ${orderItem.size_id || null}, ${orderItem.product_name}, ${orderItem.image_url},
        ${orderItem.color_name || null}, ${orderItem.size_name || null}, ${orderItem.bundle_details || '[]'}
      )
    `;
    
    console.log('✅ Inserted order item successfully');
    
    // Step 3: Verify what was actually stored
    console.log('\nStep 3: Verifying what was stored in database...');
    
    const [storedItem] = await sql`
      SELECT bundle_id, bundle_details, product_name
      FROM order_items 
      WHERE order_id = ${testOrder.id}
    `;
    
    console.log('Stored order item:');
    console.log('bundle_id:', storedItem.bundle_id);
    console.log('bundle_details type:', typeof storedItem.bundle_details);
    console.log('bundle_details length:', storedItem.bundle_details ? storedItem.bundle_details.length : 'null');
    console.log('bundle_details content:', storedItem.bundle_details);
    
    try {
      const parsedDetails = JSON.parse(storedItem.bundle_details);
      console.log('Parsed bundle_details:', parsedDetails);
      console.log('Number of items in bundle_details:', parsedDetails.length);
    } catch (e) {
      console.log('❌ Failed to parse bundle_details:', e.message);
    }
    
    // Step 4: Check recent real orders
    console.log('\nStep 4: Checking recent real orders...');
    
    const recentOrders = await sql`
      SELECT o.id, o.reference, oi.bundle_id, oi.bundle_details, oi.product_name
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      WHERE oi.bundle_id IS NOT NULL
      ORDER BY o.created_at DESC
      LIMIT 3
    `;
    
    console.log('Recent real orders:');
    recentOrders.forEach(order => {
      console.log(`Order ${order.id}: bundle_details = "${order.bundle_details}"`);
      console.log(`  Type: ${typeof order.bundle_details}, Length: ${order.bundle_details ? order.bundle_details.length : 'null'}`);
    });
    
    // Clean up test order
    await sql`DELETE FROM order_items WHERE order_id = ${testOrder.id}`;
    await sql`DELETE FROM orders WHERE id = ${testOrder.id}`;
    console.log('\n✅ Cleaned up test order');
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    await sql.end();
  }
}

debugOrderInsertion();