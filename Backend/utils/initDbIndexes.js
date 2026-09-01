// Backend/utils/initDbIndexes.js
import sql from '../db/index.js';

export const ensurePerformanceIndexes = async () => {
  try {
    // Run index creation queries asynchronously
    await sql`CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_products_gender ON products(gender);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id, is_active);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_product_images_variant_id ON product_images(variant_id, is_primary);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_variant_sizes_variant_id ON variant_sizes(variant_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_bundles_is_active ON bundles(is_active);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_bundles_product_id ON bundles(product_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON cart_items(cart_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);`;

    // Ensure video_url columns exist on variants, products, and bundles
    await sql`ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS video_url TEXT;`;
    await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS video_url TEXT;`;
    await sql`ALTER TABLE bundles ADD COLUMN IF NOT EXISTS video_url TEXT;`;

    console.log('⚡ DB Performance Indexes & Schema Initialized Successfully');
  } catch (err) {
    console.warn('⚠️ Warning during DB index creation:', err.message);
  }
};
