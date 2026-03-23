
import sql from './db/index.js';

async function auditOrderItems() {
    const orderIds = [217, 216, 215];
    try {
        const items = await sql`
      SELECT * FROM order_items WHERE order_id = ANY(${orderIds})
    `;
        console.log(JSON.stringify(items, null, 2));
    } catch (error) {
        console.error(error);
    } finally {
        process.exit();
    }
}

auditOrderItems();
