// controllers/shop/searchController.js
import sql from '../../db/index.js';

export const searchProducts = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim() === '') {
      return res.status(400).json({ message: 'Search query is required' });
    }
    
    const searchTerm = `%${q.trim().toLowerCase()}%`;
    
    // Check if search term matches a category
    const isCategorySearch = [
      'brief', 'briefs', 
      'gym', 'gymwear', 
      'set', 'sets', 'bundle', 'bundles',
      'new', 'new arrivals', 
      '3in1', '3 in 1', 
      '5in1', '5 in 1'
    ].includes(q.trim().toLowerCase());
    
    // Search in products
    let productQuery = sql`
      SELECT 
        p.id AS product_id,
        p.base_price AS price,
        pv.id AS variant_id,
        pv.name AS variant_name,
        p.name AS product_name,
        p.created_at,
        p.category,
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
    
    // If it's a category search, filter by category
    if (isCategorySearch) {
      const categoryMap = {
        'brief': 'Briefs',
        'briefs': 'Briefs',
        'gym': 'Gymwears',
        'gymwear': 'Gymwears',
        'set': 'Sets',
        'sets': 'Sets',
        'bundle': 'Sets',
        'bundles': 'Sets',
        'new': 'new',
        'new arrivals': 'new',
        '3in1': '3-in-1',
        '3 in 1': '3-in-1',
        '5in1': '5-in-1',
        '5 in 1': '5-in-1'
      };
      
      const category = categoryMap[q.trim().toLowerCase()];
      
      // For bundle types, we need to search in bundles table
      if (category === '3-in-1' || category === '5-in-1') {
        // We'll handle bundle types in the bundle query below
        productQuery = sql`
          ${productQuery}
          AND (LOWER(p.name) LIKE ${searchTerm} 
               OR LOWER(pv.name) LIKE ${searchTerm})
        `;
      } else {
        productQuery = sql`
          ${productQuery}
          AND p.category = ${category}
        `;
      }
    } else {
      // Otherwise search by name
      productQuery = sql`
        ${productQuery}
        AND (LOWER(p.name) LIKE ${searchTerm} 
             OR LOWER(pv.name) LIKE ${searchTerm})
      `;
    }
    
    const productRes = await productQuery;
    
    // Search in bundles
    let bundleQuery = sql`
      SELECT 
        MIN(b.id) AS id,
        p.id AS product_id,
        p.name,
        MIN(b.bundle_price) AS price,
        ARRAY_AGG(DISTINCT b.bundle_type) AS bundle_types,
        p.category,
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
        FALSE AS is_product,
        p.created_at
      FROM bundles b
      JOIN products p ON b.product_id = p.id
      WHERE b.is_active = TRUE
    `;
    
    // If it's a category search, filter by category or bundle type
    if (isCategorySearch) {
      const categoryMap = {
        'brief': 'Briefs',
        'briefs': 'Briefs',
        'gym': 'Gymwears',
        'gymwear': 'Gymwears',
        'set': 'Sets',
        'sets': 'Sets',
        'bundle': 'Sets',
        'bundles': 'Sets',
        'new': 'new',
        'new arrivals': 'new',
        '3in1': '3-in-1',
        '3 in 1': '3-in-1',
        '5in1': '5-in-1',
        '5 in 1': '5-in-1'
      };
      
      const category = categoryMap[q.trim().toLowerCase()];
      
      // For bundle types, filter by bundle_type
      if (category === '3-in-1' || category === '5-in-1') {
        bundleQuery = sql`
          ${bundleQuery}
          AND b.bundle_type = ${category}
        `;
      } else {
        bundleQuery = sql`
          ${bundleQuery}
          AND p.category = ${category}
        `;
      }
    } else {
      // Otherwise search by name
      bundleQuery = sql`
        ${bundleQuery}
        AND LOWER(p.name) LIKE ${searchTerm}
      `;
    }
    
    bundleQuery = sql`
      ${bundleQuery}
      GROUP BY p.id, p.name, p.created_at, p.category
    `;
    
    const bundleRes = await bundleQuery;
    
    // Format products
    const products = productRes.map(row => ({
      id: row.product_id,
      name: row.variant_name,
      productName: row.product_name,
      price: row.price,
      image: row.primary_image || 'https://via.placeholder.com/300x300?text=No+Image',
      color: row.color_name,
      variantId: row.variant_id,
      is_product: true,
      created_at: row.created_at,
      category: row.category
    }));
    
    // Format bundles
    const bundles = bundleRes.map(row => ({
      id: row.id,
      name: row.name,
      price: row.price,
      image: row.image || 'https://via.placeholder.com/300x300?text=No+Image',
      is_product: false,
      bundle_types: row.bundle_types,
      created_at: row.created_at,
      category: row.category
    }));
    
    // Combine results
    const searchResults = [...products, ...bundles];
    
    return res.status(200).json(searchResults);
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({
      message: 'Failed to search products',
      ...(process.env.NODE_ENV === 'development' && { error: err.message })
    });
  }
};