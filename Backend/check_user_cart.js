
import sql from './db/index.js';

async function checkUserCart() {
    const userId = 180;
    try {
        const [cart] = await sql`SELECT id FROM cart WHERE user_id = ${userId} ORDER BY updated_at DESC LIMIT 1`;
        if (cart) {
            console.log(`Checking items for cart ID: ${cart.id}`);
            const items = await sql`
        SELECT ci.*, p.name 
        FROM cart_items ci 
        LEFT JOIN product_variants pv ON ci.variant_id = pv.id 
        LEFT JOIN products p ON pv.product_id = p.id 
        WHERE ci.cart_id = ${cart.id}
      `;
            console.log('Cart Items:', JSON.stringify(items, null, 2));
        } else {
            console.log('No cart found for user 180');
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit();
    }
}

checkUserCart();
