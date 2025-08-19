import sql from '../db/index.js';
import cron from 'node-cron';

export const cleanupOldOrders = async () => {
  try {
    console.log('Starting cleanup of old pending/failed orders...');
    const oldOrders = await sql`
      SELECT id, cart_id
      FROM orders
      WHERE (payment_status = 'pending' OR payment_status = 'failed')
      AND created_at < NOW() - INTERVAL '48 hours'
      AND deleted_at IS NULL
    `;

    if (oldOrders.length === 0) {
      console.log('No old pending or failed orders to clean up.');
      return;
    }

    for (const order of oldOrders) {
      await sql.begin(async sql => {
        const orderItems = await sql`
          SELECT variant_id, size_id, quantity 
          FROM order_items 
          WHERE order_id = ${order.id}
        `;
        for (const item of orderItems) {
          if (item.variant_id && item.size_id) {
            await sql`
              UPDATE variant_sizes
              SET stock_quantity = stock_quantity + ${item.quantity}
              WHERE variant_id = ${item.variant_id} AND size_id = ${item.size_id}
            `;
            console.log(`✅ Restocked ${item.quantity} units for variant_id=${item.variant_id}, size_id=${item.size_id}`);
          }
        }
        if (order.cart_id) {
          await sql`DELETE FROM cart_items WHERE cart_id = ${order.cart_id}`;
          console.log(`✅ Cleared cart items for cart_id=${order.cart_id}`);
        }
        await sql`
          UPDATE orders 
          SET deleted_at = NOW()
          WHERE id = ${order.id}
        `;
      });
      console.log(`✅ Cleaned up order_id=${order.id}`);
    }
    console.log('Cleanup completed.');
  } catch (err) {
    console.error('Error during order cleanup:', err.message);
  }
};

// Schedule to run daily at midnight
cron.schedule('0 0 * * *', cleanupOldOrders);