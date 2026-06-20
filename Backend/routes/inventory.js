import express from 'express';
import {
  getProducts,
  getBundles,
  getBundle,
  deleteProduct,
  deleteBundle,
  updateProduct,
  updateBundle,
  addBundleImages,
  deleteBundleImage,
  reorderBundleImages,
  addVariantImages,
  deleteVariantImage,
  reorderVariantImages,
} from '../controllers/inventoryController.js';
import upload from '../utils/multer.js';

const router = express.Router();

// ✅ Get all products (for admin panel)
router.get('/products', getProducts);

// ✅ Get all bundles (for admin panel)
router.get('/bundles', getBundles);

// ✅ Get a single bundle by ID (with full image details)
router.get('/bundles/:id', getBundle);

// ✅ Delete a product by ID
router.delete('/products/:id', deleteProduct);

// ✅ Delete a bundle by ID
router.delete('/bundles/:id', deleteBundle);

// ✅ Update product (price + stock)
router.put('/products/:id', updateProduct);

// ✅ Update bundle (price, name, description, images)
router.put('/bundles/:id', updateBundle);

// ✅ Add images to a bundle (upload)
router.post('/bundles/:id/images', upload.array('images', 10), addBundleImages);

// ✅ Delete a single bundle image
router.delete('/bundles/:id/images/:imageId', deleteBundleImage);

// ✅ Reorder bundle images
router.put('/bundles/:id/images/reorder', reorderBundleImages);

// ✅ Add images to a product variant (upload)
router.post('/products/variants/:variantId/images', upload.array('images', 10), addVariantImages);

// ✅ Delete a single product variant image
router.delete('/products/images/:imageId', deleteVariantImage);

// ✅ Reorder product variant images
router.put('/products/variants/:variantId/images/reorder', reorderVariantImages);

export default router;
// ✅ Inventory management routes for admin panel