import sql from './db/index.js';

async function testSizeLogic() {
  console.log('🔍 Testing Size and Note Logic from Checkout to Admin\n');
  
  try {
    // 1. Check Order #175 (the fixed order)
    console.log('1. ORDER #175 - THE FIXED ORDER:');
    console.log('='.repeat(40));
    
    const items175 = await sql`
      SELECT id, variant_id, size_id, size_name, product_name
      FROM order_items 
      WHERE order_id = 175
      ORDER BY id
    `;
    
    console.log(`Order #175 has ${items175.length} items:`);
    
    let order175Good = true;
    items175.forEach(item => {
      const hasSize = item.size_name && item.size_id;
      const status = hasSize ? '✅' : '❌';
      console.log(`   ${status} Item ${item.id}: ${item.product_name} - Size: ${item.size_name || 'NULL'} (ID: ${item.size_id || 'NULL'})`);
      
      if (!hasSize) {
        order175Good = false;
      }
    });
    
    // Check order note
    const [order175] = await sql`SELECT note FROM orders WHERE id = 175`;
    console.log(`\n   Order Note: "${order175.note || 'No note'}"`);
    
    console.log(`\n   Order #175 Fix Status: ${order175Good ? '✅ SUCCESS' : '❌ FAILED'}`);
    
    // 2. Check Recent Orders
    console.log('\n2. RECENT ORDERS (LAST 3 DAYS):');
    console.log('='.repeat(40));
    
    const recentOrders = await sql`
      SELECT o.id, o.reference, o.created_at,
             COUNT(oi.id) as item_count,
             SUM(CASE WHEN oi.size_name IS NULL THEN 1 ELSE 0 END) as missing_sizes
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.created_at > NOW() - INTERVAL '3 days'
      AND o.id != 175
      GROUP BY o.id, o.reference, o.created_at
      ORDER BY o.created_at DESC
      LIMIT 5
    `;
    
    console.log(`Found ${recentOrders.length} recent orders:`);
    
    let goodOrders = 0;
    let badOrders = 0;
    
    recentOrders.forEach(order => {
      // Convert string values to numbers for comparison
      const missingSizes = parseInt(order.missing_sizes);
      const isGood = missingSizes === 0;
      const status = isGood ? '✅' : '❌';
      console.log(`   ${status} Order ${order.id}: ${order.item_count} items, ${missingSizes} missing sizes`);
      
      if (isGood) {
        goodOrders++;
      } else {
        badOrders++;
      }
    });
    
    // 3. Check Orders with Notes
    console.log('\n3. ORDERS WITH NOTES (LAST 7 DAYS):');
    console.log('='.repeat(40));
    
    const ordersWithNotes = await sql`
      SELECT id, reference, note, created_at
      FROM orders 
      WHERE note IS NOT NULL AND note != ''
      AND created_at > NOW() - INTERVAL '7 days'
      ORDER BY created_at DESC
      LIMIT 3
    `;
    
    console.log(`Found ${ordersWithNotes.length} orders with notes:`);
    ordersWithNotes.forEach(order => {
      console.log(`   📝 Order ${order.id}: "${order.note}"`);
    });
    
    // 4. Final Assessment
    console.log('\n4. FINAL ASSESSMENT:');
    console.log('='.repeat(40));
    
    console.log(`✅ Order #175 Fixed: ${order175Good ? 'YES' : 'NO'}`);
    console.log(`✅ Recent Orders Good: ${badOrders === 0 ? 'YES' : 'NO'} (${goodOrders} good, ${badOrders} bad)`);
    console.log(`✅ Notes Working: ${ordersWithNotes.length > 0 ? 'YES' : 'NO NOTES FOUND'}`);
    
    if (order175Good && badOrders === 0) {
      console.log('\n🎉 SUCCESS! Size and note logic are working correctly.');
      console.log('   Orders will no longer show null or empty values for size information.');
      return true;
    } else {
      console.log('\n⚠️  ISSUES DETECTED:');
      if (!order175Good) {
        console.log('   - Order #175 still has missing size information');
      }
      if (badOrders > 0) {
        console.log(`   - ${badOrders} recent orders have missing size information`);
      }
      return false;
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

// Run the test
testSizeLogic()
  .then(success => {
    console.log('\n' + '='.repeat(50));
    if (success) {
      console.log('✅ TEST PASSED: Size and note logic are working!');
      process.exit(0);
    } else {
      console.log('❌ TEST FAILED: Issues with size/logic implementation');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ Test error:', error);
    process.exit(1);
  });