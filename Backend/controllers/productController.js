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
  const { name, description, base_price, sku_prefix, category, gender, variants } = JSON.parse(req.body.data);
  const files = req.files;
  
  if (!name || !base_price || !sku_prefix || !variants || !Object.keys(files).length) {
    return res.status(400).json({ error: 'Missing required fields or images' });
  }

  try {
    await sql.begin(async (sql) => {
      const [product] = await sql`
        INSERT INTO products (name, description, base_price, sku_prefix, category, gender)
        VALUES (${name}, ${description || ''}, ${base_price}, ${sku_prefix}, ${category || null}, ${gender || null})
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
          const uploaded = await cloudinary.uploader.upload(file.path);
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
  const { id } = req.params;
  
  try {
    // Attempt to fetch product by ID
    const [product] = await sql`
      SELECT 
        p.id, p.name, p.description, p.base_price AS price, p.sku_prefix AS type, p.is_active,
        p.is_new_release, p.category, p.gender, TRUE AS is_product, p.created_at,
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

    if (product && product.id) {
      return res.json({ type: 'product', data: product });
    } else if (bundle && bundle.id) {
      return res.json({ type: 'bundle', data: bundle });
    } else {
      return res.status(404).json({ error: 'Item not found' });
    }
  } catch (err) {
    console.error('Get product error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

