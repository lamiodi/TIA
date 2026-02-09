
import sql from '../../db/index.js';

export const getShopAll = async (req, res) => {
  try {
    const { category } = req.query;
    const catLower = category ? category.toLowerCase() : 'all';

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
        c.color_name,
        p.category,
        p.gender,
        p.created_at,
        p.is_new_release,
        (
          SELECT COALESCE(json_agg(
            json_build_object(
              'stock_quantity', vs.stock_quantity
            )
          ), '[]'::json)
          FROM variant_sizes vs
          WHERE vs.variant_id = pv.id
        ) AS sizes
      FROM products p
      JOIN product_variants pv ON p.id = pv.product_id
      JOIN colors c ON pv.color_id = c.id
      WHERE p.is_active = TRUE AND pv.is_active = TRUE
    `;

    let bundleQuery = sql`
      SELECT 
        b.id,
        p.id AS product_id,
        b.name,
        b.bundle_price AS price,
        p.category,
        p.gender,
        p.created_at,
        p.is_new_release,
        ARRAY_AGG(b.bundle_type) AS bundle_types,
        COALESCE(
          (SELECT bi.image_url
           FROM bundle_images bi
           WHERE bi.bundle_id = b.id AND bi.is_primary = TRUE
           LIMIT 1),
          (SELECT bi.image_url
           FROM bundle_images bi
           WHERE bi.bundle_id = b.id
           LIMIT 1)
        ) AS image
      FROM bundles b
      JOIN products p ON b.product_id = p.id
      WHERE b.is_active = TRUE
    `;

    // Apply Filters
    if (catLower === 'his') {
      productQuery = sql`${productQuery} AND (p.gender = 'Male' OR p.gender = 'Unisex')`;
      bundleQuery = sql`${bundleQuery} AND (p.gender = 'Male' OR p.gender = 'Unisex')`;
    } else if (catLower === 'hers') {
      productQuery = sql`${productQuery} AND (p.gender = 'Female' OR p.gender = 'Unisex')`;
      bundleQuery = sql`${bundleQuery} AND (p.gender = 'Female' OR p.gender = 'Unisex')`;
    } else if (catLower === 'new') {
      productQuery = sql`${productQuery} AND p.is_new_release = TRUE`;
      bundleQuery = sql`${bundleQuery} AND p.is_new_release = TRUE`;
    } else if (catLower === '3in1') {
      // Legacy/Direct support if needed, though frontend might not use it anymore
      bundleQuery = sql`${bundleQuery} AND b.bundle_type = '3-in-1'`;
      // Don't fetch products for bundle-only filter
      productQuery = sql`${productQuery} AND 1=0`; 
    } else if (catLower === '5in1') {
      bundleQuery = sql`${bundleQuery} AND b.bundle_type = '5-in-1'`;
      productQuery = sql`${productQuery} AND 1=0`;
    } else if (catLower === 'briefs') {
      // Robust filter for briefs (name or category)
      const keyword = '%brief%';
      const keyword2 = '%boxer%';
      const keyword3 = '%trunk%';
      const keyword4 = '%underwear%';
      
      productQuery = sql`${productQuery} AND (
        LOWER(p.category) LIKE '%brief%' OR 
        p.name ILIKE ${keyword} OR 
        p.name ILIKE ${keyword2} OR 
        p.name ILIKE ${keyword3} OR 
        p.name ILIKE ${keyword4}
      )`;
      
      bundleQuery = sql`${bundleQuery} AND (
        LOWER(p.category) LIKE '%brief%' OR 
        b.bundle_type ILIKE ${keyword} OR 
        b.bundle_type ILIKE ${keyword2}
      )`;
    } else if (catLower === 'lounge sets' || catLower === 'lounge set') {
      const keyword = '%lounge%';
      // Ensure Lounge Sets show all female wears (including Unisex which are suitable for females)
      productQuery = sql`${productQuery} AND (
        (LOWER(p.category) = 'lounge set' OR 
         LOWER(p.category) = 'lounge sets' OR 
         p.name ILIKE ${keyword})
        AND (LOWER(p.gender) = 'female' OR LOWER(p.gender) = 'unisex')
      )`;
      bundleQuery = sql`${bundleQuery} AND (
        (LOWER(p.category) = 'lounge set' OR 
         LOWER(p.category) = 'lounge sets' OR 
         p.name ILIKE ${keyword})
        AND (LOWER(p.gender) = 'female' OR LOWER(p.gender) = 'unisex')
      )`;
    } else if (catLower !== 'all') {
        // Fallback for specific categories like 'briefs' if still used directly
        productQuery = sql`${productQuery} AND LOWER(p.category) = ${catLower}`;
        bundleQuery = sql`${bundleQuery} AND LOWER(p.category) = ${catLower}`;
    }

    // Finish Bundle Query Group By
    bundleQuery = sql`${bundleQuery} GROUP BY b.id, p.id, b.name, b.bundle_price, p.category, p.gender, p.created_at, p.is_new_release`;

    // Execute in parallel
    const [products, bundles] = await Promise.all([productQuery, bundleQuery]);

    // Format Products
    const formattedProducts = products.map(row => ({
      id: row.product_id,
      name: row.variant_name,
      price: row.price,
      image: row.primary_image || 'https://via.placeholder.com/300x300?text=No+Image',
      color: row.color_name,
      variantId: row.variant_id,
      category: row.category,
      gender: row.gender,
      is_product: true,
      sizes: row.sizes,
      created_at: row.created_at,
      is_new_release: row.is_new_release,
      allow_preorder: row.allow_preorder
    }));

    // Format Bundles
    const formattedBundles = bundles.map(row => ({
      id: row.id,
      name: row.name,
      price: row.price,
      image: row.image || 'https://via.placeholder.com/300x300?text=No+Image',
      is_product: false,
      bundle_types: row.bundle_types,
      category: row.category,
      gender: row.gender,
      created_at: row.created_at,
      is_new_release: row.is_new_release
    }));

    // Combine
    const allItems = [...formattedProducts, ...formattedBundles];

    return res.status(200).json(allItems);

  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({
      message: 'Failed to fetch shop items',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};
