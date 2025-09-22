// Script to check order #175 details
import sql from './db/index.js';

async function checkOrder175() {
  try {
    console.log('Checking order items for order #175...');
    
    // Check order_items table for order #175
    const items = await sql`
      SELECT 
        oi.id, oi.variant_id, oi.quantity, oi.price, oi.size_id, 
        oi.product_name, oi.color_name, oi.size_name, oi.image_url
      FROM order_items oi
      WHERE oi.order_id = 175
    `;
    
    console.log('Order items found:', items.length);
    items.forEach((item, index) => {
      console.log(`\nItem ${index + 1}:`);
      console.log('  Product:', item.product_name);
      console.log('  Variant ID:', item.variant_id);
      console.log('  Size ID:', item.size_id);
      console.log('  Size Name:', item.size_name);
      console.log('  Color Name:', item.color_name);
    });
    
    // Check if order exists and get basic info
    const [order] = await sql`
      SELECT id, user_id, reference, status, note
      FROM orders 
      WHERE id = 175
    `;
    
    if (order) {
      console.log('\nOrder #175 details:');
      console.log('  Reference:', order.reference);
      console.log('  Status:', order.status);
      console.log('  Note:', order.note || '(No note)');
      console.log('  User ID:', order.user_id);
    } else {
      console.log('\nOrder #175 not found!');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await sql.end();
  }
}

checkOrder175();