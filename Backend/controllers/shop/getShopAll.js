import sql from '../../db/index.js';

export const getShopAll = async (req, res) => {
  try {
    const { category } = req.query;

    // 1. Handle bundles (3in1 or 5in1)
    if (category === '3in1' || category === '5in1') {
      const bundleType = category === '3in1' ? '3-in-1' : '5-in-1';

      const bundleRes = await sql`
        SELECT 
          MIN(b.id) AS id,
          p.id AS product_id,
          p.name,
          MIN(b.bundle_price) AS price,
          ARRAY_AGG(DISTINCT b.bundle_type) AS bundle_types,
          COALESCE(
            (SELECT bi.image_url
             FROM bundle_images bi
             WHERE bi.bundle_id = MIN(b.id) AND bi.is_primary = TRUE
             LIMIT 1),
            (SELECT bi.image_url
             FROM bundle_images bi
             WHERE bi.bundle_id = MIN(b.id)
             LIMIT 1)
          ) AS image,
          FALSE AS is_product
        FROM bundles b
        JOIN products p ON b.product_id = p.id
        WHERE b.is_active = TRUE AND b.bundle_type = ${bundleType}
        GROUP BY p.id, p.name
      `;

      const bundles = bundleRes.map(row => ({
        id: row.id,
        name: row.name,
        price: row.price,
        image: row.image || 'https://via.placeholder.com/300x300?text=No+Image',
        is_product: false,
        bundle_types: row.bundle_types
      }));

      return res.status(200).json(bundles);
    }

    // 2. Handle all-bundles similarly...
    if (category === 'all-bundles') {
      const bundleRes = await sql`
        SELECT 
          MIN(b.id) AS id,
          p.id AS product_id,
          p.name,
          MIN(b.bundle_price) AS price,
          ARRAY_AGG(DISTINCT b.bundle_type) AS bundle_types,
          COALESCE(
            (SELECT bi.image_url
             FROM bundle_images bi
             WHERE bi.bundle_id = MIN(b.id) AND bi.is_primary = TRUE
             LIMIT 1),
            (SELECT bi.image_url
             FROM bundle_images bi
             WHERE bi.bundle_id = MIN(b.id)
             LIMIT 1)
          ) AS image,
          FALSE AS is_product
        FROM bundles b
        JOIN products p ON b.product_id = p.id
        WHERE b.is_active = TRUE
        GROUP BY p.id, p.name
      `;

      const bundles = bundleRes.map(row => ({
        id: row.id,
        name: row.name,
        price: row.price,
        image: row.image || 'https://via.placeholder.com/300x300?text=No+Image',
        is_product: false,
        bundle_types: row.bundle_types
      }));

      return res.status(200).json(bundles);
    }

    // 3. Fetch products
    let productQuery = sql`
      SELECT 
        p.id AS product_id,
        p.base_price AS price,
        pv.id AS variant_id,
        pv.name AS variant_name,
        (
          SELECT pi.image_url 
          FROM product_images pi 
          WHERE pi.variant_id = pv.id AND pi.is_primary = TRUE
          LIMIT 1
        ) AS primary_image,
        c.color_name
      FROM products p
      JOIN product_variants pv ON p.id = pv.product_id
      JOIN colors c ON pv.color_id = c.id
      WHERE p.is_active = TRUE AND pv.is_active = TRUE
    `;

    if (category) {
      if (category.toLowerCase() === 'new') {
        productQuery = sql`${productQuery} AND p.is_new_release = TRUE`;
      } else {
        const cat = category.toLowerCase();
        productQuery = sql`${productQuery} AND LOWER(p.category) = ${cat}`;
      }
    }

    const productRes = await productQuery; // <- must await the query
    const products = productRes.map(row => ({
      id: row.product_id,
      name: row.variant_name,
      price: row.price,
      image: row.primary_image || 'https://via.placeholder.com/300x300?text=No+Image',
      color: row.color_name,
      variantId: row.variant_id,
      is_product: true
    }));

    return res.status(200).json(products);
  } catch (err) {
    console.error('Database error:', err);

    res.status(500).json({
      message: 'Failed to fetch products or bundles',
      ...(process.env.NODE_ENV === 'development' && { error: err.message })
    });
  }
};
