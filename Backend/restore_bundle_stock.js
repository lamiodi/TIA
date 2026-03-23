
import sql from './db/index.js';

async function restoreBundleStock() {
    const orderIds = [217, 216, 215];

    try {
        console.log('Fetching bundle items for deleted test orders to restore stock...');
        const items = await sql`
      SELECT oi.bundle_details, oi.quantity, o.reference
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.id = ANY(${orderIds}) AND oi.bundle_id IS NOT NULL
    `;

        if (items.length === 0) {
            console.log('No bundle items found to restore stock.');
            return;
        }

        console.log(`Found ${items.length} bundles. Restoring stock for individual items...`);

        for (const bundle of items) {
            let details;
            try {
                details = typeof bundle.bundle_details === 'string' ? JSON.parse(bundle.bundle_details) : bundle.bundle_details;
            } catch (e) {
                console.error('Failed to parse bundle details', e);
                continue;
            }

            if (Array.isArray(details)) {
                for (const item of details) {
                    if (item.variant_id && item.size_id) {
                        await sql`
              UPDATE variant_sizes 
              SET stock_quantity = stock_quantity + ${bundle.quantity} 
              WHERE variant_id = ${item.variant_id} AND size_id = ${item.size_id}
            `;
                        console.log(`Restored ${bundle.quantity} for variant ${item.variant_id}, size ${item.size_id} (from bundle in Order ${bundle.reference})`);
                    }
                }
            }
        }

        console.log('Bundle stock restoration complete.');

    } catch (error) {
        console.error('Error restoring bundle stock:', error);
    } finally {
        process.exit();
    }
}

restoreBundleStock();
