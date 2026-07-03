// Backend/controllers/productController.js
import sql from '../db/index.js';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs/promises';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadProduct = async (req, res) => {
  const { name, description, base_price, sku_prefix, category, gender, variants, is_new_release } = JSON.parse(req.body.data);
  const files = req.files;
  
  if (!name || !base_price || !sku_prefix || !variants || !Object.keys(files).length) {
    return res.status(400).json({ error: 'Missing required fields or images' });
  }

  try {
    await sql.begin(async (sql) => {
      const [product] = await sql`
        INSERT INTO products (name, description, base_price, sku_prefix, category, gender, is_new_release)
        VALUES (${name}, ${description || ''}, ${base_price}, ${sku_prefix}, ${category || null}, ${gender || null}, ${is_new_release || false})
        RETURNING id
      `;
      const productId = product.id;

      for (const [index, variant] of variants.entries()) {
        const [variantResult] = await sql`
          INSERT INTO product_variants (product_id, color_id, sku, name)
          VALUES (${productId}, ${variant.color_id}, ${`${sku_prefix}-${index}`}, ${variant.name || null})
          RETURNING id
        `;
        const variantId = variantResult.id;

        for (const size of variant.sizes) {
          await sql`
            INSERT INTO variant_sizes (variant_id, size_id, stock_quantity)
            VALUES (${variantId}, ${size.size_id}, ${size.stock_quantity || 0})
          `;
        }

        const images = files[`images_${index}`] || [];
        for (const file of images) {
          // Cloudinary automatically handles HEIC to JPG conversion if format is not specified, 
          // or we can force it. For web compatibility, fetching 'jpg' or 'webp' is best.
          // By default, Cloudinary stores the original. 
          // However, we can use a transformation or rely on Cloudinary's auto-format delivery URL.
          // Ideally, we upload as-is and rely on frontend to request f_auto (which we usually do).
          // But to be safe for HEIC specifically, we might want to ensure it's viewable.
          // Cloudinary supports HEIC uploads.
          
          const uploaded = await cloudinary.uploader.upload(file.path, {
             resource_type: "image",
             format: "jpg" // Force conversion to JPG for compatibility
          });
          
          await sql`
            INSERT INTO product_images (variant_id, image_url, is_primary)
            VALUES (${variantId}, ${uploaded.secure_url}, ${images.indexOf(file) === 0})
          `;
          await fs.unlink(file.path);
        }
      }
    });

    res.status(201).json({ message: 'Product created successfully' });
  } catch (err) {
    console.error('Upload product error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getProductById = async (req, res) => {
  console.log('🔥 DEBUG: getProductById function called');
  const { id } = req.params;
  const type = req.query.type ? req.query.type.trim() : null; // 'product' or 'bundle'
  
  console.log('🔥 DEBUG: getProductById called with id:', id, 'type:', type, 'raw query:', req.query);
  
  try {
    // If type is explicitly specified as 'bundle', check bundle first
    if (type === 'bundle') {
      console.log('🔥 DEBUG: Checking for bundle with id:', id);
      const [bundle] = await sql`
        SELECT 
          b.id, b.name, b.description, b.bundle_price AS price, b.sku_prefix AS type, b.is_active,
          b.bundle_type, FALSE AS is_product, b.created_at,
          COALESCE(
            json_agg(
              json_build_object(
                'variant_id', bi.variant_id,
                'product_name', p.name,
                'color_name', c.color_name,
                'all_variants', (
                  SELECT COALESCE(json_agg(
                    json_build_object(
                      'variant_id', pv2.id,
                      'color_name', c2.color_name,
                      'sizes', (
                        SELECT COALESCE(json_agg(
                          json_build_object(
                            'size_id', s.id,
                            'size_name', s.size_name,
                            'stock_quantity', vs.stock_quantity
                          )
                        ), '[]'::json)
                        FROM variant_sizes vs
                        JOIN sizes s ON vs.size_id = s.id
                        WHERE vs.variant_id = pv2.id
                      )
                    )
                  ), '[]'::json)
                  FROM product_variants pv2
                  JOIN colors c2 ON pv2.color_id = c2.id
                  WHERE pv2.product_id = p.id
                  )
                )
              ), '[]'::json
            ) AS items,
          COALESCE(
            (SELECT COALESCE(json_agg(image_url), '[]'::json) FROM bundle_images bi2 WHERE bi2.bundle_id = b.id),
            '[]'::json
          ) AS images
        FROM bundles b
        LEFT JOIN bundle_items bi ON b.id = bi.bundle_id
        LEFT JOIN product_variants pv ON bi.variant_id = pv.id
        LEFT JOIN products p ON pv.product_id = p.id
        LEFT JOIN colors c ON pv.color_id = c.id
        WHERE b.id = ${id} AND b.is_active = TRUE
        GROUP BY b.id
      `;
      
      console.log('🔥 DEBUG: Bundle query result:', bundle);
      console.log('🔥 DEBUG: Bundle exists:', !!bundle);
      
      if (bundle && bundle.id) {
        console.log('🔥 DEBUG: Returning bundle data for id:', id);
        return res.json({ type: 'bundle', data: bundle });
      } else {
        console.log('🔥 DEBUG: Bundle not found for id:', id);
        return res.status(404).json({ error: 'Bundle not found' });
      }
    }
    
    // If type is explicitly specified as 'product', check product only
    if (type === 'product') {
      console.log('🔥 DEBUG: Checking for product with id:', id);
      const [product] = await sql`
        SELECT 
          p.id, 
          CASE 
            WHEN COUNT(pv.id) = 1 THEN MAX(pv.name)
            ELSE p.name
          END as name, 
          p.description, p.base_price AS price, p.sku_prefix AS type, p.is_active,
          p.is_new_release, p.category, p.gender, CASE WHEN p.is_new_release = TRUE THEN TRUE ELSE p.allow_preorder END as allow_preorder, TRUE AS is_product, p.created_at,
          COALESCE(
            json_agg(
              json_build_object(
                'variant_id', pv.id,
                'color_id', pv.color_id,
                'color_name', c.color_name,
                'color_code', c.color_code,
                'sku', pv.sku,
                'name', pv.name,
                'images', (
                  SELECT COALESCE(json_agg(image_url), '[]'::json)
                  FROM product_images pi
                  WHERE pi.variant_id = pv.id
                ),
                'sizes', (
                  SELECT COALESCE(json_agg(
                    json_build_object(
                      'size_id', s.id,
                      'size_name', s.size_name,
                      'stock_quantity', vs.stock_quantity
                    )
                  ), '[]'::json)
                  FROM variant_sizes vs
                  JOIN sizes s ON vs.size_id = s.id
                  WHERE vs.variant_id = pv.id
                )
              )
            ), '[]'::json
          ) AS variants
        FROM products p
        LEFT JOIN product_variants pv ON p.id = pv.product_id
        LEFT JOIN colors c ON pv.color_id = c.id
        WHERE p.id = ${id} AND p.is_active = TRUE
        GROUP BY p.id
      `;
      
      console.log('🔥 DEBUG: Product query result:', product);
      console.log('🔥 DEBUG: Product exists:', !!product);
      
      if (product && product.id) {
        console.log('🔥 DEBUG: Returning product data for id:', id);
        return res.json({ type: 'product', data: product });
      } else {
        console.log('🔥 DEBUG: Product not found for id:', id);
        return res.status(404).json({ error: 'Product not found' });
      }
    }
    
    // Default behavior: check bundle first, then product (to avoid ID conflicts where product shadows bundle)
    console.log('🔥 DEBUG: Default behavior - checking bundle first for id:', id);
    
    // Attempt to fetch bundle by ID
    const [bundle] = await sql`
      SELECT 
        b.id, b.name, b.description, b.bundle_price AS price, b.sku_prefix AS type, b.is_active,
        b.bundle_type, FALSE AS is_product, b.created_at,
        COALESCE(
          json_agg(
            json_build_object(
              'variant_id', bi.variant_id,
              'product_name', p.name,
              'color_name', c.color_name,
              'all_variants', (
                SELECT COALESCE(json_agg(
                  json_build_object(
                    'variant_id', pv2.id,
                    'color_name', c2.color_name,
                    'sizes', (
                      SELECT COALESCE(json_agg(
                        json_build_object(
                          'size_id', s.id,
                          'size_name', s.size_name,
                          'stock_quantity', vs.stock_quantity
                        )
                      ), '[]'::json)
                      FROM variant_sizes vs
                      JOIN sizes s ON vs.size_id = s.id
                      WHERE vs.variant_id = pv2.id
                    )
                  )
                ), '[]'::json)
                FROM product_variants pv2
                JOIN colors c2 ON pv2.color_id = c2.id
                WHERE pv2.product_id = p.id
              )
            )
          ), '[]'::json
        ) AS items,
        COALESCE(
          (SELECT COALESCE(json_agg(image_url), '[]'::json) FROM bundle_images bi2 WHERE bi2.bundle_id = b.id),
          '[]'::json
        ) AS images
      FROM bundles b
      LEFT JOIN bundle_items bi ON b.id = bi.bundle_id
      LEFT JOIN product_variants pv ON bi.variant_id = pv.id
      LEFT JOIN products p ON pv.product_id = p.id
      LEFT JOIN colors c ON pv.color_id = c.id
      WHERE b.id = ${id} AND b.is_active = TRUE
      GROUP BY b.id
    `;

    if (bundle && bundle.id) {
      console.log('🔥 DEBUG: Found bundle in default behavior, returning bundle data');
      return res.json({ type: 'bundle', data: bundle });
    }

    console.log('🔥 DEBUG: Bundle not found in default behavior, checking product');

    // Attempt to fetch product by ID
    const [product] = await sql`
      SELECT 
        p.id, 
        CASE 
          WHEN COUNT(pv.id) = 1 THEN MAX(pv.name)
          ELSE p.name
        END as name, 
        p.description, p.base_price AS price, p.sku_prefix AS type, p.is_active,
          p.is_new_release, p.category, p.gender, CASE WHEN p.is_new_release = TRUE THEN TRUE ELSE p.allow_preorder END as allow_preorder, TRUE AS is_product, p.created_at,
        COALESCE(
          json_agg(
            json_build_object(
              'variant_id', pv.id,
              'color_id', pv.color_id,
              'color_name', c.color_name,
              'color_code', c.color_code,
              'sku', pv.sku,
              'name', pv.name,
              'images', (
                SELECT COALESCE(json_agg(image_url), '[]'::json)
                FROM product_images pi
                WHERE pi.variant_id = pv.id
              ),
              'sizes', (
                SELECT COALESCE(json_agg(
                  json_build_object(
                    'size_id', s.id,
                    'size_name', s.size_name,
                    'stock_quantity', vs.stock_quantity
                  )
                ), '[]'::json)
                FROM variant_sizes vs
                JOIN sizes s ON vs.size_id = s.id
                WHERE vs.variant_id = pv.id
              )
            )
          ), '[]'::json
        ) AS variants
      FROM products p
      LEFT JOIN product_variants pv ON p.id = pv.product_id
      LEFT JOIN colors c ON pv.color_id = c.id
      WHERE p.id = ${id} AND p.is_active = TRUE
      GROUP BY p.id
    `;

    if (product && product.id) {
      console.log('🔥 DEBUG: Found product in default behavior, returning product data');
      return res.json({ type: 'product', data: product });
    }

    console.log('🔥 DEBUG: Neither bundle nor product found for id:', id);
    return res.status(404).json({ error: 'Item not found' });
  } catch (err) {
    console.error('Get product error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};



export const getSiblingBundle = async (req, res) => {
  const { id } = req.params;
  const { targetType } = req.query;
  if (!targetType || !['3-in-1', '5-in-1'].includes(targetType)) {
    return res.status(400).json({ error: 'Invalid targetType' });
  }
  try {
    const [currentBundle] = await sql`SELECT product_id FROM bundles WHERE id = ${id} AND is_active = TRUE`;
    if (!currentBundle) return res.status(404).json({ error: 'Bundle not found' });
    const [sibling] = await sql`
      SELECT b.id, b.bundle_price AS price, b.bundle_type,
        COALESCE((SELECT COALESCE(json_agg(image_url), '[]'::json) FROM bundle_images bi WHERE bi.bundle_id = b.id), '[]'::json) AS images
      FROM bundles b
      WHERE b.product_id = ${currentBundle.product_id} AND b.bundle_type = ${targetType} AND b.is_active = TRUE
      LIMIT 1`;
    if (!sibling) return res.status(404).json({ error: 'Sibling bundle not found' });
    return res.json({ id: sibling.id, price: sibling.price, bundle_type: sibling.bundle_type, images: sibling.images });
  } catch (err) {
    console.error('Get sibling bundle error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};
