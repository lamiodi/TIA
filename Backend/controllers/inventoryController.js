import sql from '../db/index.js';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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
        p.is_new_release,
        p.video_url,
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
            'video_url', pv.video_url,
            'images', (
              SELECT jsonb_agg(
                jsonb_build_object(
                  'id', pi.id,
                  'image_url', pi.image_url,
                  'is_primary', pi.is_primary
                ) ORDER BY pi.is_primary DESC, pi.id ASC
              )
              FROM product_images pi
              WHERE pi.variant_id = pv.id
            ),
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
        b.video_url,
        (SELECT jsonb_agg(
          jsonb_build_object(
            'id', bi.id,
            'image_url', bi.image_url,
            'is_primary', bi.is_primary
          ) ORDER BY bi.is_primary DESC, bi.id ASC
        )
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

// Get a single bundle by ID (with full image details)
export const getBundle = async (req, res) => {
  const { id } = req.params;
  try {
    const [bundle] = await sql`
      SELECT
        b.id,
        b.name,
        b.description,
        b.bundle_price AS price,
        b.is_active,
        b.bundle_type,
        b.sku_prefix,
        b.video_url,
        (SELECT jsonb_agg(
          jsonb_build_object(
            'id', bi.id,
            'image_url', bi.image_url,
            'is_primary', bi.is_primary
          ) ORDER BY bi.is_primary DESC, bi.id ASC
        )
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
      WHERE b.id = ${id}
    `;

    if (!bundle) {
      return res.status(404).json({ error: 'Bundle not found' });
    }

    res.json(bundle);
  } catch (err) {
    console.error('Error fetching bundle:', err);
    res.status(500).json({ error: 'Failed to fetch bundle' });
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
      // Check if bundle is used in any orders
      const orderCheck = await sql`
        SELECT oi.id 
        FROM order_items oi 
        WHERE oi.bundle_id = ${id} 
        LIMIT 1
      `;
      
      if (orderCheck.length > 0) {
        throw { type: 'order_conflict' };
      }
      
      // Delete from wishlist first
      await sql`DELETE FROM wishlist WHERE bundle_id = ${id}`;
      
      // Delete from cart items
      await sql`DELETE FROM cart_items WHERE bundle_id = ${id}`;
      
      // Delete bundle images and items
      await sql`DELETE FROM bundle_images WHERE bundle_id = ${id}`;
      await sql`DELETE FROM bundle_items WHERE bundle_id = ${id}`;
      
      // Finally delete the bundle
      const result = await sql`DELETE FROM bundles WHERE id = ${id}`;
      
      if (result.count === 0) {
        throw { type: 'not_found' };
      }
    });
    res.json({ success: true });
  } catch (err) {
    if (err.type === 'order_conflict') {
      return res.status(400).json({ 
        error: 'Cannot delete bundle. It has been ordered by customers.',
        conflictType: 'order'
      });
    }
    if (err.type === 'not_found') {
      return res.status(404).json({ error: 'Bundle not found' });
    }
    console.error('Error deleting bundle:', err);
    res.status(500).json({ error: 'Failed to delete bundle' });
  }
};

// Update product price and stock
export const updateProduct = async (req, res) => {
  const { id } = req.params;
  const { base_price, variants, is_new_release, description } = req.body;

  try {
    await sql.begin(async (sql) => {
      if (base_price !== undefined) {
        await sql`UPDATE products SET base_price = ${base_price} WHERE id = ${id}`;
      }
      if (is_new_release !== undefined) {
        await sql`UPDATE products SET is_new_release = ${is_new_release} WHERE id = ${id}`;
      }
      if (description !== undefined) {
        await sql`UPDATE products SET description = ${description} WHERE id = ${id}`;
      }

      if (variants?.length) {
        for (const variant of variants) {
          // Update stock quantities
          if (variant.sizes) {
            for (const size of variant.sizes) {
              await sql`
                UPDATE variant_sizes
                SET stock_quantity = ${size.stock_quantity}
                WHERE variant_id = ${variant.id} AND size_id = ${size.size_id}
              `;
            }
          }
          
          // Update image primary status
          if (variant.images && variant.images.length > 0) {
            for (const image of variant.images) {
              if (image.id) { // Only update existing images
                await sql`
                  UPDATE product_images
                  SET is_primary = ${image.is_primary}
                  WHERE id = ${image.id}
                `;
              }
            }
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

// Update bundle price, name, description and images
export const updateBundle = async (req, res) => {
  const { id } = req.params;
  const { bundle_price, name, description, images } = req.body;

  try {
    await sql.begin(async (sql) => {
        if (bundle_price !== undefined) {
            await sql`UPDATE bundles SET bundle_price = ${bundle_price} WHERE id = ${id}`;
        }
        if (name !== undefined) {
            await sql`UPDATE bundles SET name = ${name} WHERE id = ${id}`;
        }
        if (description !== undefined) {
            await sql`UPDATE bundles SET description = ${description} WHERE id = ${id}`;
        }
        
        // Update image primary status if images array is provided
        if (images && images.length > 0) {
            for (const image of images) {
                if (image.id) {
                    await sql`
                        UPDATE bundle_images
                        SET is_primary = ${image.is_primary}
                        WHERE id = ${image.id} AND bundle_id = ${id}
                    `;
                }
            }
        }
    });
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating bundle:', err);
    res.status(500).json({ error: 'Failed to update bundle' });
  }
};

// Add images to a bundle (upload to Cloudinary + insert into DB)
export const addBundleImages = async (req, res) => {
  const { id } = req.params;
  const files = req.files;

  if (!files || files.length === 0) {
    return res.status(400).json({ error: 'No images provided' });
  }

  try {
    const uploadedImages = [];

    for (const file of files) {
      try {
        const uploaded = await cloudinary.uploader.upload(file.path);
        const [imgRecord] = await sql`
          INSERT INTO bundle_images (bundle_id, image_url)
          VALUES (${id}, ${uploaded.secure_url})
          RETURNING id, image_url, is_primary
        `;
        uploadedImages.push(imgRecord);

        // Clean up temp file
        const sanitizedPath = path.resolve(file.path);
        if (sanitizedPath.startsWith(path.resolve('./')) && fs.existsSync(sanitizedPath)) {
          fs.unlinkSync(sanitizedPath);
        }
      } catch (imgErr) {
        console.error('Image upload error:', imgErr);
      }
    }

    res.status(201).json({ 
      message: `${uploadedImages.length} image(s) added`,
      images: uploadedImages 
    });
  } catch (err) {
    console.error('Error adding bundle images:', err);
    res.status(500).json({ error: 'Failed to add images' });
  }
};

// Delete a single bundle image (from DB + Cloudinary)
export const deleteBundleImage = async (req, res) => {
  const { id, imageId } = req.params;

  try {
    // Get the image URL first so we can delete from Cloudinary
    const [image] = await sql`
      SELECT image_url FROM bundle_images WHERE id = ${imageId} AND bundle_id = ${id}
    `;

    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    // Delete from Cloudinary
    try {
      const urlParts = image.image_url.split('/');
      const publicIdWithExt = urlParts[urlParts.length - 1];
      const publicId = 'bundle_images/' + publicIdWithExt.split('.')[0];
      await cloudinary.uploader.destroy(publicId);
    } catch (cloudErr) {
      console.error('Cloudinary delete error (continuing):', cloudErr);
    }

    // Delete from DB
    await sql`DELETE FROM bundle_images WHERE id = ${imageId} AND bundle_id = ${id}`;

    res.json({ success: true, message: 'Image deleted' });
  } catch (err) {
    console.error('Error deleting bundle image:', err);
    res.status(500).json({ error: 'Failed to delete image' });
  }
};

// Reorder bundle images (update sort_order)
export const reorderBundleImages = async (req, res) => {
  const { id } = req.params;
  const { imageIds } = req.body; // ordered array of image IDs

  if (!Array.isArray(imageIds) || imageIds.length === 0) {
    return res.status(400).json({ error: 'No image order provided' });
  }

  try {
    await sql.begin(async (sql) => {
      // Add sort_order column if it doesn't exist (safe to run multiple times)
      await sql`ALTER TABLE bundle_images ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0`;

      // Update sort_order for each image based on array position
      for (let i = 0; i < imageIds.length; i++) {
        await sql`
          UPDATE bundle_images
          SET sort_order = ${i}
          WHERE id = ${imageIds[i]} AND bundle_id = ${id}
        `;
      }
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Error reordering bundle images:', err);
    res.status(500).json({ error: 'Failed to reorder images' });
  }
};

// Add images to a product variant (upload to Cloudinary + insert into DB)
export const addVariantImages = async (req, res) => {
  const { variantId } = req.params;
  const files = req.files;

  if (!files || files.length === 0) {
    return res.status(400).json({ error: 'No images provided' });
  }

  try {
    const uploadedImages = [];

    for (const file of files) {
      try {
        const uploaded = await cloudinary.uploader.upload(file.path);
        const [imgRecord] = await sql`
          INSERT INTO product_images (variant_id, image_url)
          VALUES (${variantId}, ${uploaded.secure_url})
          RETURNING id, image_url, is_primary
        `;
        uploadedImages.push(imgRecord);

        const sanitizedPath = path.resolve(file.path);
        if (sanitizedPath.startsWith(path.resolve('./')) && fs.existsSync(sanitizedPath)) {
          fs.unlinkSync(sanitizedPath);
        }
      } catch (imgErr) {
        console.error('Image upload error:', imgErr);
      }
    }

    res.status(201).json({
      message: `${uploadedImages.length} image(s) added`,
      images: uploadedImages,
    });
  } catch (err) {
    console.error('Error adding variant images:', err);
    res.status(500).json({ error: 'Failed to add images' });
  }
};

// Delete a single product variant image (from DB + Cloudinary)
export const deleteVariantImage = async (req, res) => {
  const { imageId } = req.params;

  try {
    const [image] = await sql`
      SELECT image_url FROM product_images WHERE id = ${imageId}
    `;

    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    try {
      const urlParts = image.image_url.split('/');
      const publicIdWithExt = urlParts[urlParts.length - 1];
      const publicId = 'product_images/' + publicIdWithExt.split('.')[0];
      await cloudinary.uploader.destroy(publicId);
    } catch (cloudErr) {
      console.error('Cloudinary delete error (continuing):', cloudErr);
    }

    await sql`DELETE FROM product_images WHERE id = ${imageId}`;

    res.json({ success: true, message: 'Image deleted' });
  } catch (err) {
    console.error('Error deleting variant image:', err);
    res.status(500).json({ error: 'Failed to delete image' });
  }
};

// Reorder product variant images (update sort_order)
export const reorderVariantImages = async (req, res) => {
  const { variantId } = req.params;
  const { imageIds } = req.body;

  if (!Array.isArray(imageIds) || imageIds.length === 0) {
    return res.status(400).json({ error: 'No image order provided' });
  }

  try {
    await sql.begin(async (sql) => {
      await sql`ALTER TABLE product_images ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0`;

      for (let i = 0; i < imageIds.length; i++) {
        await sql`
          UPDATE product_images
          SET sort_order = ${i}
          WHERE id = ${imageIds[i]} AND variant_id = ${variantId}
        `;
      }
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Error reordering variant images:', err);
    res.status(500).json({ error: 'Failed to reorder images' });
  }
};

// Upload or replace video for a product variant
export const uploadVariantVideo = async (req, res) => {
  const { variantId } = req.params;

  try {
    let videoUrl = req.body.video_url;

    if (req.file) {
      const uploadResult = await cloudinary.uploader.upload(req.file.path, {
        resource_type: 'video',
        folder: 'tia-products/videos',
        timeout: 600000,
      });
      videoUrl = uploadResult.secure_url;

      try {
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      } catch (cleanErr) {
        console.error('Temp file cleanup error:', cleanErr);
      }
    }

    if (!videoUrl) {
      return res.status(400).json({ error: 'No video file or URL provided' });
    }

    const [variant] = await sql`
      UPDATE product_variants
      SET video_url = ${videoUrl}
      WHERE id = ${variantId}
      RETURNING id, product_id, video_url
    `;

    if (!variant) {
      return res.status(404).json({ error: 'Variant not found' });
    }

    // Sync to main product
    await sql`
      UPDATE products
      SET video_url = ${videoUrl}
      WHERE id = ${variant.product_id}
    `;

    res.json({
      success: true,
      message: 'Variant video updated successfully',
      video_url: videoUrl,
      variantId: variant.id,
    });
  } catch (err) {
    console.error('Error uploading variant video:', err);
    if (req.file && fs.existsSync(req.file.path)) {
      try { fs.unlinkSync(req.file.path); } catch (e) {}
    }
    res.status(500).json({ error: 'Failed to upload video', details: err.message });
  }
};

// Delete video from a product variant
export const deleteVariantVideo = async (req, res) => {
  const { variantId } = req.params;

  try {
    const [variant] = await sql`
      SELECT id, product_id, video_url FROM product_variants WHERE id = ${variantId}
    `;

    if (!variant) {
      return res.status(404).json({ error: 'Variant not found' });
    }

    await sql`
      UPDATE product_variants
      SET video_url = NULL
      WHERE id = ${variantId}
    `;

    // Re-sync main product video_url from remaining variants
    const [otherVariant] = await sql`
      SELECT video_url FROM product_variants
      WHERE product_id = ${variant.product_id} AND video_url IS NOT NULL
      LIMIT 1
    `;

    await sql`
      UPDATE products
      SET video_url = ${otherVariant ? otherVariant.video_url : null}
      WHERE id = ${variant.product_id}
    `;

    res.json({ success: true, message: 'Video deleted successfully' });
  } catch (err) {
    console.error('Error deleting variant video:', err);
    res.status(500).json({ error: 'Failed to delete video', details: err.message });
  }
};

// Upload or replace video for a bundle
export const uploadBundleVideo = async (req, res) => {
  const { id } = req.params;

  try {
    let videoUrl = req.body.video_url;

    if (req.file) {
      const uploadResult = await cloudinary.uploader.upload(req.file.path, {
        resource_type: 'video',
        folder: 'tia-products/videos',
        timeout: 600000,
      });
      videoUrl = uploadResult.secure_url;

      try {
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      } catch (cleanErr) {
        console.error('Temp file cleanup error:', cleanErr);
      }
    }

    if (!videoUrl) {
      return res.status(400).json({ error: 'No video file or URL provided' });
    }

    const [bundle] = await sql`
      UPDATE bundles
      SET video_url = ${videoUrl}
      WHERE id = ${id}
      RETURNING id, video_url
    `;

    if (!bundle) {
      return res.status(404).json({ error: 'Bundle not found' });
    }

    res.json({
      success: true,
      message: 'Bundle video updated successfully',
      video_url: videoUrl,
    });
  } catch (err) {
    console.error('Error uploading bundle video:', err);
    if (req.file && fs.existsSync(req.file.path)) {
      try { fs.unlinkSync(req.file.path); } catch (e) {}
    }
    res.status(500).json({ error: 'Failed to upload video', details: err.message });
  }
};

// Delete video from a bundle
export const deleteBundleVideo = async (req, res) => {
  const { id } = req.params;

  try {
    await sql`
      UPDATE bundles
      SET video_url = NULL
      WHERE id = ${id}
    `;

    res.json({ success: true, message: 'Bundle video deleted successfully' });
  } catch (err) {
    console.error('Error deleting bundle video:', err);
    res.status(500).json({ error: 'Failed to delete video', details: err.message });
  }
};

