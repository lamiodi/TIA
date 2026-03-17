
import sql from './db/index.js';

async function checkOrder() {
  const reference = 'ORD-1773694146460-9469';
  console.log(`Checking order: ${reference}`);

  try {
    const orders = await sql`
      SELECT * FROM orders WHERE reference = ${reference}
    `;

    if (orders.length === 0) {
      console.log('Order not found');
      return;
    }

    const order = orders[0];
    console.log('Order Details:', JSON.stringify(order, null, 2));

    const items = await sql`
      SELECT * FROM order_items WHERE order_id = ${order.id}
    `;

    console.log('Order Items:', JSON.stringify(items, null, 2));

  } catch (error) {
    console.error('Error checking order:', error);
  } finally {
    process.exit();
  }
}

checkOrder();
