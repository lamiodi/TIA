import express from 'express';
import {
  getProducts,
  getBundles,
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

// ✅ Delete a product by ID
router.delete('/products/:id', deleteProduct);

// ✅ Delete a bundle by ID
router.delete('/bundles/:id', deleteBundle);

// ✅ Update product (price + stock)
router.put('/products/:id', updateProduct);

// ✅ Update bundle (price only for now)
router.put('/bundles/:id', updateBundle);

export default router;
// ✅ Inventory management routes for admin panel