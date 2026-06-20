import express from 'express';
import {
  getProducts,
  getBundles,
  getBundle,
  deleteProduct,
  deleteBundle,
  updateProduct,
  updateBundle,
} from '../controllers/inventoryController.js';

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

export default router;
// ✅ Inventory management routes for admin panel