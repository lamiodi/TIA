import sql from './db/index.js';

async function checkOrder() {
  try {
    // Check order 192 details
    const orderResult = await sql`SELECT * FROM orders WHERE id = 192`;
    console.log('=== ORDER 192 DETAILS ===');
    console.log(orderResult[0]);
    
    // Check order items for order 192
    const itemsResult = await sql`SELECT * FROM order_items WHERE order_id = 192`;
    console.log('\n=== ORDER 192 ITEMS ===');
    itemsResult.forEach((item, index) => {
      console.log(`Item ${index + 1}:`);
      console.log(`  ID: ${item.id}`);
      console.log(`  Product ID: ${item.product_id}`);
      console.log(`  Variant ID: ${item.variant_id}`);
      console.log(`  Bundle ID: ${item.bundle_id}`);
      console.log(`  Quantity: ${item.quantity}`);
      console.log(`  Bundle Details: ${item.bundle_details}`);
      console.log(`  Bundle Details Type: ${typeof item.bundle_details}`);
      console.log(`  Bundle Details Length: ${item.bundle_details ? item.bundle_details.length : 'N/A'}`);
      
      // Try to parse bundle_details if it exists
      if (item.bundle_details && item.bundle_details !== '[]') {
        try {
          const parsed = JSON.parse(item.bundle_details);
          console.log(`  Parsed Bundle Details:`, parsed);
          console.log(`  Number of items in bundle: ${parsed.length}`);
        } catch (e) {
          console.log(`  Error parsing bundle_details: ${e.message}`);
        }
      }
      console.log('---');
    });
    
    await sql.end();
  } catch (error) {
    console.error('Error:', error);
    await sql.end();
  }
}

checkOrder();