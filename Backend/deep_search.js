
import sql from './db/index.js';

async function deepSearch() {
    const orderId = 214;
    const userId = 180;

    try {
        console.log(`Deep search for Order #${orderId}, User #${userId}...`);

        const [payment] = await sql`SELECT * FROM payments WHERE order_id = ${orderId}`;
        if (payment) console.log('Payment Info:', payment);

        console.log('\nChecking all orders for this user to see if they previously ordered these items with sizes:');
        const previousItems = await sql`
      SELECT oi.product_name, oi.size_name, o.created_at, o.id as order_id
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.user_id = ${userId} AND oi.size_name IS NOT NULL
      ORDER BY o.created_at DESC
    `;
        console.table(previousItems);

        console.log('\nChecking if the user has any addresses that might hint at their size? (Unlikely but checking everything)');
        const addresses = await sql`SELECT * FROM addresses WHERE user_id = ${userId}`;
        console.log('Addresses:', addresses);

        console.log('\nChecking if there are any other cart_items in the DB for this user that were NOT linked to this order?');
        const lostCartItems = await sql`SELECT * FROM cart_items WHERE user_id = ${userId}`;
        console.log('Other Cart Items:', lostCartItems);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit();
    }
}

deepSearch();
