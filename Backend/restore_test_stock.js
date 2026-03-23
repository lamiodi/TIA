
import sql from './db/index.js';

async function restoreStock() {
    const orderIds = [217, 216, 215];

    try {
        console.log('Fetching items for deleted test orders to restore stock...');
        const items = await sql`
      SELECT oi.variant_id, oi.size_id, oi.quantity, o.reference
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.id = ANY(${orderIds})
    `;

        if (items.length === 0) {
            console.log('No order items found to restore stock.');
            return;
        }

        console.log(`Found ${items.length} items. Restoring stock...`);

        for (const item of items) {
            if (item.variant_id && item.size_id) {
                await sql`
          UPDATE variant_sizes 
          SET stock_quantity = stock_quantity + ${item.quantity} 
          WHERE variant_id = ${item.variant_id} AND size_id = ${item.size_id}
        `;
                console.log(`Restored ${item.quantity} for variant ${item.variant_id}, size ${item.size_id} (Order ${item.reference})`);
            } else if (item.variant_id) {
                // If size_id was null, check how stock was handled. 
                // In the controller, it falls back to updating variant_sizes without size_id filter if it's missing.
                await sql`
          UPDATE variant_sizes 
          SET stock_quantity = stock_quantity + ${item.quantity} 
          WHERE variant_id = ${item.variant_id}
        `;
                console.log(`Restored ${item.quantity} for variant ${item.variant_id} (unknown size) (Order ${item.reference})`);
            }
        }

        console.log('Stock restoration complete.');

    } catch (error) {
        console.error('Error restoring stock:', error);
    } finally {
        process.exit();
    }
}

restoreStock();
