// controllers/bundleController.js
import sql from '../db/index.js';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// GET all active products (for bundle dropdown)
export const getProducts = async (req, res) => {
  try {
    const products = await sql`
      SELECT id, name, sku_prefix 
      FROM products 
      WHERE is_active = TRUE
    `;
    res.json(products);
  } catch (err) {
    console.error('Products fetch failed:', err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};

// GET distinct sku_prefixes for active products
export const getSkuPrefixes = async (req, res) => {
  try {
    const rows = await sql`
      SELECT DISTINCT sku_prefix 
      FROM products 
      WHERE is_active = TRUE
    `;
    res.json(rows.map(r => r.sku_prefix));
  } catch (err) {
    console.error('SKU prefix fetch failed:', err);
    res.status(500).json({ error: 'Failed to fetch SKU prefixes.' });
  }
};

// POST to create a single bundle
export const createBundle = async (req, res) => {
  try {
    const files = req.files;
    const {
      name,
      description,
      bundle_price,
      sku_prefix,
      bundle_type,
      product_id
    } = JSON.parse(req.body.data);

    if (!name || !bundle_price || !sku_prefix || !bundle_type || !files?.length || !product_id) {
      return res.status(400).json({ error: 'Missing required fields or images.' });
    }

    const requiredCount = bundle_type === '3-in-1' ? 3 : 5;

    // Get all eligible variants under this SKU prefix and product
    const variants = await sql`
      SELECT pv.id AS variant_id, vs.size_id
      FROM product_variants pv
      JOIN variant_sizes vs ON pv.id = vs.variant_id
      WHERE pv.product_id = ${product_id} AND pv.sku LIKE ${sku_prefix + '%'} AND vs.stock_quantity > 0
    `;

    if (variants.length < requiredCount) {
      return res.status(400).json({ error: 'Not enough stock to create this bundle.' });
    }

    // Insert the bundle
    const bundleRes = await sql`
      INSERT INTO bundles (name, description, bundle_price, bundle_type, sku_prefix, product_id)
      VALUES (${name}, ${description || ''}, ${bundle_price}, ${bundle_type}, ${sku_prefix}, ${product_id})
      RETURNING id
    `;
    const bundleId = bundleRes[0].id;

    // Add bundle items
    const selected = variants.slice(0, requiredCount);
    for (const v of selected) {
      await sql`
        INSERT INTO bundle_items (bundle_id, variant_id)
        VALUES (${bundleId}, ${v.variant_id})
      `;
    }

    // Upload images
    for (const file of files) {
      try {
        const uploaded = await cloudinary.uploader.upload(file.path);
        await sql`
          INSERT INTO bundle_images (bundle_id, image_url)
          VALUES (${bundleId}, ${uploaded.secure_url})
        `;
        fs.unlinkSync(file.path);
      } catch (imgErr) {
        console.error('Image upload error:', imgErr);
      }
    }

    res.status(201).json({ message: 'Bundle created successfully.' });
  } catch (err) {
    console.error('Bundle creation error:', err);
    res.status(500).json({ error: 'Failed to create bundle' });
  }
};
