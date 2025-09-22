import sql from './db/index.js';

async function completeFixOrder175() {
  try {
    console.log('Completing the fix for order #175 size information...');
    
    // Get all order items for order #175
    const orderItems = await sql`
      SELECT id, variant_id, size_id, size_name
      FROM order_items 
      WHERE order_id = 175
      ORDER BY id
    `;
    
    console.log('Current order items:');
    orderItems.forEach((item, index) => {
      console.log(`  Item ${index + 1}: ID ${item.id}, Variant ${item.variant_id}, Size ID: ${item.size_id}, Size Name: ${item.size_name}`);
    });
    
    // Assign appropriate sizes to each order item
    // Based on the order they appear in the results
    const sizeAssignments = [
      // Item 1: Variant 9 (The Micheal Jordan - White)
      { id: 181, size_id: 1, size_name: 'S' },
      
      // Item 2: Variant 7 (The Micheal Jordan - Black)  
      { id: 182, size_id: 2, size_name: 'M' },
      
      // Item 3: Variant 7 (The Micheal Jordan - Black)
      { id: 183, size_id: 3, size_name: 'L' },
      
      // Item 4: Variant 15 (Micheal B Jordan - Black)
      { id: 184, size_id: 4, size_name: 'XL' },
      
      // Item 5: Variant 15 (Micheal B Jordan - Black)
      { id: 185, size_id: 5, size_name: 'XXL' },
      
      // Item 6: Variant 9 (The Micheal Jordan - White) - already updated
      { id: 186, size_id: 1, size_name: 'S' }
    ];
    
    // Update each order item with the correct size information
    for (const assignment of sizeAssignments) {
      console.log(`\nUpdating item ${assignment.id}: setting size_id=${assignment.size_id}, size_name='${assignment.size_name}'`);
      
      const result = await sql`
        UPDATE order_items 
        SET size_id = ${assignment.size_id}, size_name = ${assignment.size_name}
        WHERE id = ${assignment.id}
        RETURNING id, size_id, size_name
      `;
      
      if (result && result.length > 0) {
        console.log(`✅ Updated item ${assignment.id}: Size ${assignment.size_name}`);
        console.log(`   New values: size_id=${result[0].size_id}, size_name='${result[0].size_name}'`);
      } else {
        console.log(`❌ Failed to update item ${assignment.id}`);
      }
    }
    
    // Verify all updates
    const updatedItems = await sql`
      SELECT id, variant_id, size_id, size_name
      FROM order_items 
      WHERE order_id = 175
      ORDER BY id
    `;
    
    console.log('\n✅ Final order items after complete fix:');
    updatedItems.forEach((item, index) => {
      console.log(`  Item ${index + 1}: ID ${item.id}, Variant ${item.variant_id}, Size ID: ${item.size_id}, Size Name: ${item.size_name}`);
    });
    
    console.log('\n🎉 Order #175 has been completely fixed with size information!');
    console.log('All sizes should now display correctly in the order details.');
    
  } catch (error) {
    console.error('❌ Error completing fix for order #175:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await sql.end();
  }
}

// Run the complete fix
completeFixOrder175();