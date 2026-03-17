
import sql from './db/index.js';

async function extractSize() {
    const orderId = 214;
    const cartId = 199; // From order details
    const orderTime = new Date('2026-03-16T19:49:07.814Z');

    try {
        console.log('=== DEEP SIZE EXTRACTION FOR ORDER #214 ===\n');

        //  1. Check if cart_items still have the info (even deleted)
        console.log('1. Checking cart_items for cart_id 199 (including all records):');
        const allCartItems = await sql`
      SELECT * FROM cart_items WHERE cart_id = ${cartId}
    `;
        console.log('Cart Items Found:', allCartItems.length, '\n', JSON.stringify(allCartItems, null, 2));

        // 2. Check if variant_sizes was updated around the time of order
        console.log('\n2. Checking variant_sizes for recent stock changes around order time:');
        const stockChanges = await sql`
      SELECT vs.variant_id, vs.size_id, s.size_name, vs.stock_quantity, vs.updated_at
      FROM variant_sizes vs
      JOIN sizes s ON vs.size_id = s.id
      WHERE (vs.variant_id = 12 OR vs.variant_id = 36)
        AND vs.updated_at >= ${new Date(orderTime.getTime() - 60 * 60 * 1000)}
      ORDER BY vs.updated_at DESC
    `;
        console.log('Stock changes near order time:');
        if (stockChanges.length === 0) {
            console.log('No stock changes found (size_id was NULL so stock was not deducted per-size)');
        }
        console.table(stockChanges.map(r => ({ variant_id: r.variant_id, size: r.size_name, stock: r.stock_quantity, updated: r.updated_at })));

        // 3. Check contacts / messages table for the email
        console.log('\n3. Checking contacts messages for this customer:');
        const contactMessages = await sql`
      SELECT * FROM contacts WHERE email = 'oliyideoluwatobi@gmail.com'
    `;
        console.log('Contact messages:', contactMessages);

        // 4. Check reviews or any other table that might have size info
        console.log('\n4. Checking wishlist for this user:');
        const wishlist = await sql`
      SELECT w.*, p.name, pv.id as variant_id
      FROM wishlist w
      LEFT JOIN product_variants pv ON w.product_id = pv.product_id
      LEFT JOIN products p ON p.id = pv.product_id
      WHERE w.user_id = 180
    `;
        console.log('Wishlist:', wishlist);

        // 5. Summarise what we can infer
        console.log('\n=== SUMMARY ===');
        console.log('Order #214 items:');
        console.log('  - Item 252: Megan Star Sleeveless Jumpsuit (Black) - variant_id: 12');
        console.log('    Available in-stock sizes at order time: L (34), M (34)  — S, XS, XL were OUT OF STOCK');
        console.log('    Most likely ordered size: L or M');
        console.log('  - Item 253: Evy Set (White) - variant_id: 36');
        console.log('    Available in-stock sizes at order time: M (5), S (5)  — L, XL, XS were OUT OF STOCK');
        console.log('    Most likely ordered size: M or S');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit();
    }
}

extractSize();
