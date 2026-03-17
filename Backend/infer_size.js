
import sql from './db/index.js';

async function inferSize() {
    const orderId = 214;
    const orderTime = '2026-03-16T19:49:07'; // Approximate time of order creation
    const variants = [12, 36];

    try {
        console.log(`Analyzing variants ${variants.join(', ')} around ${orderTime}...`);

        for (const variantId of variants) {
            console.log(`\nVariant: ${variantId}`);
            const sizingHistory = await sql`
        SELECT vs.size_id, s.size_name, vs.stock_quantity, vs.updated_at
        FROM variant_sizes vs
        JOIN sizes s ON vs.size_id = s.id
        WHERE vs.variant_id = ${variantId}
        ORDER BY vs.updated_at DESC
      `;

            console.table(sizingHistory.map(row => ({
                size: row.size_name,
                stock: row.stock_quantity,
                updated: row.updated_at
            })));
        }

        // Also check if there's any other table like order_logs or similar
        const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
        console.log('\nAvailable tables:', tables.map(t => t.table_name).join(', '));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit();
    }
}

inferSize();
