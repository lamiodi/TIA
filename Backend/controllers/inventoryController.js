import sql from '../db/index.js';

// Get all products with inventory data
export const getProducts = async (req, res) => {
  try {
    const products = await sql`
      SELECT 
        p.id,
        p.name,
        p.description,
        p.base_price AS price,
        p.sku_prefix AS design_code,
        p.is_active,
        (SELECT array_agg(DISTINCT pi.image_url)
         FROM product_images pi
         JOIN product_variants pv ON pi.variant_id = pv.id
         WHERE pv.product_id = p.id) AS images,
        (SELECT COUNT(*) FROM bundle_items bi
         JOIN product_variants pv ON bi.variant_id = pv.id
         WHERE pv.product_id = p.id) AS bundle_count,
        (SELECT string_agg(DISTINCT c.color_name, ', ') FROM product_variants pv
         JOIN colors c ON c.id = pv.color_id
         WHERE pv.product_id = p.id) AS color,
        (SELECT string_agg(DISTINCT s.size_name, ', ') FROM variant_sizes vs
         JOIN sizes s ON s.id = vs.size_id
         JOIN product_variants pv ON pv.id = vs.variant_id
         WHERE pv.product_id = p.id) AS size,
        (SELECT SUM(vs.stock_quantity) FROM variant_sizes vs
         JOIN product_variants pv ON pv.id = vs.variant_id
         WHERE pv.product_id = p.id) AS stock,
        (SELECT jsonb_agg(
          jsonb_build_object(
            'id', pv.id,
            'color_id', pv.color_id,
            'color_name', c.color_name,
            'sku', pv.sku,
            'sizes', (
              SELECT jsonb_agg(
                jsonb_build_object(
                  'size_id', vs.size_id,
                  'size_name', s.size_name,
                  'stock_quantity', vs.stock_quantity
                )
              )
              FROM variant_sizes vs
              JOIN sizes s ON vs.size_id = s.id
              WHERE vs.variant_id = pv.id
            )
          )
        )
        FROM product_variants pv
        JOIN colors c ON pv.color_id = c.id
        WHERE pv.product_id = p.id) AS variants
      FROM products p
      ORDER BY p.created_at DESC
    `;
    res.json(products);
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ 
      error: 'Failed to fetch products',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Get all bundles with inventory data
export const getBundles = async (req, res) => {
  try {
    const bundles = await sql`
      SELECT 
        b.id,
        b.name,
        b.description,
        b.bundle_price AS price,
        b.is_active,
        b.bundle_type,
        (SELECT array_agg(DISTINCT bi.image_url)
         FROM bundle_images bi 
         WHERE bi.bundle_id = b.id) AS images,
        (SELECT COUNT(*) 
         FROM bundle_items 
         WHERE bundle_id = b.id) AS item_count,
        (SELECT jsonb_agg(
          jsonb_build_object(
            'variant_id', bi.variant_id,
            'product_name', p.name,
            'color_name', c.color_name
          )
        )
        FROM bundle_items bi
        JOIN product_variants pv ON bi.variant_id = pv.id
        JOIN products p ON pv.product_id = p.id
        JOIN colors c ON pv.color_id = c.id
        WHERE bi.bundle_id = b.id) AS items
      FROM bundles b
      ORDER BY b.created_at DESC
    `;
    res.json(bundles);
  } catch (err) {
    console.error('Error fetching bundles:', err);
    res.status(500).json({ 
      error: 'Failed to fetch bundles',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Permanent delete a product
export const deleteProduct = async (req, res) => {
  const { id } = req.params;
  try {
    await sql.begin(async (sql) => {
      const bundleCheck = await sql`
        SELECT b.id, b.name
        FROM bundles b
        JOIN bundle_items bi ON b.id = bi.bundle_id
        JOIN product_variants pv ON bi.variant_id = pv.id
        WHERE pv.product_id = ${id} AND b.is_active = TRUE
        LIMIT 1
      `;

      if (bundleCheck.length > 0) {
        throw { type: 'bundle_conflict', bundle: bundleCheck[0] };
      }

      await sql`DELETE FROM product_images WHERE variant_id IN (SELECT id FROM product_variants WHERE product_id = ${id})`;
      await sql`DELETE FROM variant_sizes WHERE variant_id IN (SELECT id FROM product_variants WHERE product_id = ${id})`;
      await sql`DELETE FROM product_variants WHERE product_id = ${id}`;
      await sql`DELETE FROM products WHERE id = ${id}`;
    });

    res.json({ message: 'Product permanently deleted' });
  } catch (err) {
    if (err.type === 'bundle_conflict') {
      return res.status(400).json({ 
        error: `Cannot delete product. It is used in active bundle "${err.bundle.name}"`,
        bundleId: err.bundle.id,
        conflictType: 'bundle'
      });
    }
    console.error('Error deleting product:', err);
    res.status(500).json({ error: 'Failed to delete product' });
  }
};

// Delete a bundle
export const deleteBundle = async (req, res) => {
  const { id } = req.params;
  try {
    await sql.begin(async (sql) => {
      await sql`DELETE FROM bundle_images WHERE bundle_id = ${id}`;
      await sql`DELETE FROM bundle_items WHERE bundle_id = ${id}`;
      await sql`DELETE FROM bundles WHERE id = ${id}`;
    });
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting bundle:', err);
    res.status(500).json({ error: 'Failed to delete bundle' });
  }
};

// Update product price and stock
export const updateProduct = async (req, res) => {
  const { id } = req.params;
  const { base_price, variants } = req.body;

  try {
    await sql.begin(async (sql) => {
      if (base_price) {
        await sql`UPDATE products SET base_price = ${base_price} WHERE id = ${id}`;
      }

      if (variants?.length) {
        for (const variant of variants) {
          for (const size of variant.sizes || []) {
            await sql`
              UPDATE variant_sizes
              SET stock_quantity = ${size.stock_quantity}
              WHERE variant_id = ${variant.id} AND size_id = ${size.size_id}
            `;
          }
        }
      }
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).json({ error: 'Failed to update product' });
  }
};

// Update bundle price
export const updateBundle = async (req, res) => {
  const { id } = req.params;
  const { bundle_price } = req.body;

  try {
    await sql`UPDATE bundles SET bundle_price = ${bundle_price} WHERE id = ${id}`;
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating bundle:', err);
    res.status(500).json({ error: 'Failed to update bundle' });
  }
};
