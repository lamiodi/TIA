
import sql from './db/index.js';

async function removeTestOrders() {
    const orderIds = [217, 216, 215];
    const references = [
        'ORD-1773724340405-2259',
        'ORD-1773723374550-9940',
        'ORD-1773722933113-5066'
    ];

    try {
        console.log(`Attempting to remove test orders: ${orderIds.join(', ')}`);

        // First, let's see if they exist and what their current status is
        const existingOrders = await sql`
      SELECT id, reference, status, payment_status 
      FROM orders 
      WHERE id = ANY(${orderIds})
    `;

        console.log('Orders found:', JSON.stringify(existingOrders, null, 2));

        if (existingOrders.length === 0) {
            console.log('No matching orders found.');
            return;
        }

        // We'll perform a soft delete by setting deleted_at = NOW()
        // This is safer than a hard delete and follows the schema's design.
        const deletedCount = await sql`
      UPDATE orders 
      SET deleted_at = NOW() 
      WHERE id = ANY(${orderIds})
      RETURNING id
    `;

        console.log(`Successfully soft-deleted ${deletedCount.length} orders.`);

        // If there are specific order items, they are linked by order_id.
        // Usually, the order items stay in the DB but the order is hidden.
        // If the user wants them GONE gone, we can delete them, but soft delete is standard.

    } catch (error) {
        console.error('Error removing orders:', error);
    } finally {
        process.exit();
    }
}

removeTestOrders();
