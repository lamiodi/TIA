import express from 'express';
import { 
  getCart, 
  addToCart, 
  updateCartItem,
  removeFromCart, 
  clearCart 
} from '../controllers/cartController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get cart for a user
router.get('/:userId', authenticateToken, (req, res, next) => {
  console.log(`GET /api/cart/${req.params.userId}`);
  getCart(req, res, next);
});

// Add item to cart (requires login)
router.post('/', authenticateToken, (req, res, next) => {
  console.log('POST /api/cart', req.body);
  addToCart(req, res, next);
});

// Update cart item quantity (requires login)
router.put('/:id', authenticateToken, (req, res, next) => {
  console.log(`PUT /api/cart/${req.params.id}`, req.body);
  updateCartItem(req, res, next);
});

// Remove item from cart (requires login)
router.delete('/:id', authenticateToken, (req, res, next) => {
  console.log(`DELETE /api/cart/${req.params.id}`);
  removeFromCart(req, res, next);
});

// Clear cart for a user (requires login)
router.delete('/clear/:userId', authenticateToken, (req, res, next) => {
  console.log(`DELETE /api/cart/clear/${req.params.userId}`);
  clearCart(req, res, next);
});

export default router;
