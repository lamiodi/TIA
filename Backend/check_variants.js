
import sql from './db/index.js';

async function checkVariants() {
    const variantIds = [12, 36];

    try {
        for (const id of variantIds) {
            console.log(`\nChecking variant: ${id}`);

            const [variant] = await sql`
        SELECT pv.id, p.name, c.color_name
        FROM product_variants pv
        JOIN products p ON pv.product_id = p.id
        LEFT JOIN colors c ON pv.color_id = c.id
        WHERE pv.id = ${id}
      `;

            if (variant) {
                console.log('Variant details:', variant);

                const sizes = await sql`
          SELECT vs.size_id, s.size_name, vs.stock_quantity
          FROM variant_sizes vs
          JOIN sizes s ON vs.size_id = s.id
          WHERE vs.variant_id = ${id}
        `;

                console.log('Available sizes:', sizes);
            } else {
                console.log('Variant not found');
            }
        }
    } catch (error) {
        console.error('Error checking variants:', error);
    } finally {
        process.exit();
    }
}

checkVariants();
